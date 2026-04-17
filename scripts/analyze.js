/**
 * JSONL → metrics.json aggregator.
 *
 * Usage:
 *   node scripts/analyze.js [input.jsonl] [output.json]
 *   cat runs.jsonl | node scripts/analyze.js
 *
 * If no input path is given, reads stdin. If no output path, writes to stdout.
 * Export `analyze(records)` for unit tests.
 */

import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';

import { cardLibrary } from '../src/data/cards.js';
import { enemyLibrary } from '../src/data/enemies.js';
import { relicLibrary } from '../src/data/relics.js';
import { marynaBoonLibrary } from '../src/data/marynaBoons.js';
import { eventLibrary } from '../src/data/events.js';
import { weatherLibrary } from '../src/data/weather.js';
import { characters } from '../src/data/characters.js';

const SCHEMA_VERSION = 1;

// Per-kind name resolution — look up the canonical display name from the game
// data libraries so the dashboard can show human-readable labels. Falls back
// to the id when a name is missing (new entity, stale baseline).
const NAME_LOOKUPS = {
  card: /** @param {string} id */ (id) => cardLibrary[id]?.name,
  enemy: /** @param {string} id */ (id) => enemyLibrary[id]?.name,
  relic: /** @param {string} id */ (id) => relicLibrary[id]?.name,
  boon: /** @param {string} id */ (id) => marynaBoonLibrary[id]?.name,
  // event defs use `title` (Polish UI text); analyzer falls back to `name` for forward-compat
  event: /** @param {string} id */ (id) => eventLibrary[id]?.title ?? eventLibrary[id]?.name,
  weather: /** @param {string} id */ (id) => weatherLibrary[id]?.name,
  character: /** @param {string} id */ (id) => characters[id]?.name,
};

function resolveEntityName(kind, id) {
  const lookup = NAME_LOOKUPS[kind];
  return lookup?.(id) ?? id;
}
const BOOTSTRAP_RESAMPLES = 2000;
const SAMPLE_TIER_GREEN = 2000;
const SAMPLE_TIER_YELLOW = 500;

// Pick-rate denominator strategy per kind. Cards/events use offered/picked
// (pick decisions are observable). Relics and boons are often granted without
// an explicit offer event (boss reward, event grants), so we use
// acquired / runCount as a population-prevalence rate instead.
const PICK_RATE_RUN_FRACTION_KINDS = new Set(['relic', 'boon']);

// Kinds that never have a meaningful pick rate (the dashboard hides the column).
const PICK_RATE_HIDDEN_KINDS = new Set(['enemy', 'weather', 'character']);

// ---------------------------------------------------------------------------
// Bootstrap CI
// ---------------------------------------------------------------------------

/**
 * Paired bootstrap CI for lift (presentWins - absentWins) / pairs.
 * @param {number[]} deltas - array of per-pair deltas (+1 win, -1 loss, 0 draw)
 * @param {number} resamples
 * @returns {{ lo: number, hi: number }}
 */
function bootstrapLiftCi(deltas, resamples = BOOTSTRAP_RESAMPLES) {
  const n = deltas.length;
  if (n === 0) return { lo: 0, hi: 0 };

  const observed = deltas.reduce((s, d) => s + d, 0) / n;
  const centred = deltas.map((d) => d - observed);
  const boots = new Float64Array(resamples);

  for (let r = 0; r < resamples; r++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += centred[Math.floor(Math.random() * n)];
    }
    boots[r] = sum / n;
  }

  boots.sort();
  const lo = observed - boots[Math.floor(resamples * 0.975)];
  const hi = observed - boots[Math.floor(resamples * 0.025)];
  return { lo: round4(lo), hi: round4(hi) };
}

/**
 * Approximate two-proportion 95% CI for the difference (p1 - p2) using the
 * normal approximation. Used to put a CI band around marginal lift when no
 * paired runs are available.
 *
 * @param {number} winsA @param {number} totalA
 * @param {number} winsB @param {number} totalB
 * @returns {{ lo: number, hi: number } | null}
 */
function diffCi(winsA, totalA, winsB, totalB) {
  if (totalA <= 0 || totalB <= 0) return null;
  const pA = winsA / totalA;
  const pB = winsB / totalB;
  const se = Math.sqrt((pA * (1 - pA)) / totalA + (pB * (1 - pB)) / totalB);
  const z = 1.96;
  const diff = pA - pB;
  return { lo: round4(diff - z * se), hi: round4(diff + z * se) };
}

/**
 * Two-sample 95% CI for a difference of means (Welch).
 *
 * @param {{ mean: number, variance: number, n: number }} a
 * @param {{ mean: number, variance: number, n: number }} b
 * @returns {{ lo: number, hi: number } | null}
 */
function meanDiffCi(a, b) {
  if (a.n <= 0 || b.n <= 0) return null;
  const se = Math.sqrt((a.variance || 0) / a.n + (b.variance || 0) / b.n);
  const z = 1.96;
  const diff = a.mean - b.mean;
  return { lo: round4(diff - z * se), hi: round4(diff + z * se) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round4(x) {
  return Math.round(x * 10000) / 10000;
}

function sampleTier(n) {
  if (n >= SAMPLE_TIER_GREEN) return 'green';
  if (n >= SAMPLE_TIER_YELLOW) return 'yellow';
  return 'red';
}

/** Mean ± 95 % normal CI via CLT */
function meanCi(values) {
  const n = values.length;
  if (n === 0) return { mean: 0, lo: 0, hi: 0, n: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / n;
  if (n === 1) return { mean: round4(mean), lo: round4(mean), hi: round4(mean), n };
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  const se = Math.sqrt(variance / n);
  const z = 1.96;
  return { mean: round4(mean), lo: round4(mean - z * se), hi: round4(mean + z * se), n };
}

/**
 * Mean + percentile distribution (p10/p50/p90/max). Used for floor/turn/dutki
 * histograms when callers want shape, not just the mean.
 *
 * @param {number[]} values
 * @returns {{ mean: number, lo: number, hi: number, n: number, p10: number, p50: number, p90: number, max: number }}
 */
function distribution(values) {
  const base = meanCi(values);
  if (values.length === 0) return { ...base, p10: 0, p50: 0, p90: 0, max: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    ...base,
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    max: sorted[sorted.length - 1],
  };
}

/** @param {number[]} sorted @param {number} q */
function percentile(sorted, q) {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return round4(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
}

/** Winrate with CLT CI */
function rateCi(wins, total) {
  if (total === 0) return { rate: 0, lo: 0, hi: 0, n: 0 };
  const p = wins / total;
  const se = Math.sqrt((p * (1 - p)) / total);
  const z = 1.96;
  return {
    rate: round4(p),
    lo: round4(Math.max(0, p - z * se)),
    hi: round4(Math.min(1, p + z * se)),
    n: total,
  };
}

function sliceKey(record) {
  const char = record.character ?? 'unknown';
  const diff = record.difficulty ?? 'normal';
  const act = record.floorReached != null ? Math.min(3, Math.ceil(record.floorReached / 5)) : 1;
  return `${char}/${diff}/${act}`;
}

// ---------------------------------------------------------------------------
// Per-entity accumulator
// ---------------------------------------------------------------------------

class EntityAcc {
  constructor() {
    this.offeredCount = 0;
    this.acquiredCount = 0;
    this.runsWithEntity = 0;
    this.runsWithoutEntity = 0;
    this.winsWithEntity = 0;
    this.winsWithoutEntity = 0;
    // paired
    this.pairDeltas = [];
    this.matchedPairCount = 0;
    // per kind extras (populated by subclasses / kind-specific paths)
    this.playsTotal = 0; // card
    this.battlesTotal = 0; // card (denominator for avgPlaysPerBattle)
    this.turnsToKillTotal = 0; // enemy: cumulative battle_ended.turnCount across kills
    this.killCount = 0; // enemy: number of kills (battle_ended player_win)
    this.byFloor = {}; // enemy: floor -> { wins, total }
    this.byWeather = {}; // enemy: weather -> { wins, total }
    // slice breakdown (sliceKey -> EntityAcc-lite object)
    this.bySlice = {};
    // acquisition sources (source -> count)
    this.acquisitionSources = {};
    // Floor-reached (run-level): summed for runs in which the entity appeared.
    // Used for avgFloorReachedWith and the marginal "without" comparison.
    this.floorSumWith = 0;
    this.floorSqSumWith = 0;
  }

  addAcquisitionSource(src) {
    this.acquisitionSources[src] = (this.acquisitionSources[src] ?? 0) + 1;
  }
}

// ---------------------------------------------------------------------------
// Core analyze function
// ---------------------------------------------------------------------------

/**
 * @param {object[]} records - parsed JSONL game records
 * @returns {object} metrics.json object
 */
export function analyze(records) {
  if (records.length === 0) {
    return _emptyMetrics();
  }

  // Use envelope fields from first valid record
  const first = records[0];
  const batchId = first.batch ?? 'unknown';
  const batchName = first.batch ?? 'unknown';
  const gitSha = first.gitSha ?? '';
  const configHash = first.configHash ?? '';
  const poolOverridesHash = first.poolOverridesHash ?? '';
  const dateRun = new Date().toISOString();

  // Track schema drift
  const unknownEventKinds = new Set();
  const schemaDrift = { unknownEventKinds: [] };

  // Overall accumulators
  let totalWins = 0;
  let totalValid = 0;
  let floorSumAll = 0;
  let floorSqSumAll = 0;
  const floors = [];
  const turns = [];
  const dutki = [];
  const hpAtDeaths = [];
  const survivalScores = [];
  const agentMix = {};
  // agentStats: agentName -> { wins, total, floors[], survivalScores[] }
  const agentStats = {};

  // bySlice: sliceKey -> { wins, total, floors, turns }
  const sliceAccs = {};

  // byEntity: `kind:id` -> EntityAcc
  const entityAccs = {};

  // Pair tracking: pairKey -> { present: record | null, absent: record | null }
  const pairs = {};
  // Count broken pairs (one half crashed or marked broken)
  let brokenPairs = 0;

  // Diagnostic
  let belowMinSample = 0;

  function getEntityAcc(kind, id) {
    const key = `${kind}:${id}`;
    if (!entityAccs[key]) entityAccs[key] = new EntityAcc();
    return entityAccs[key];
  }

  function getSliceAcc(key) {
    if (!sliceAccs[key]) sliceAccs[key] = { wins: 0, total: 0, floors: [], turns: [] };
    return sliceAccs[key];
  }

  const KNOWN_EVENT_KINDS = new Set([
    'run_started',
    'run_ended',
    'map_generated',
    'node_entered',
    'weather_entered',
    'battle_started',
    'battle_ended',
    'phase_transition',
    'turn_started',
    'turn_ended',
    'card_drawn',
    'card_played',
    'card_skipped',
    'card_exhausted',
    'enemy_move',
    'status_applied',
    'shop_opened',
    'shop_purchase',
    'event_entered',
    'event_resolved',
    'reward_offered',
    'reward_picked',
    'campfire_choice',
    'relic_gained',
    'boon_offered',
    'boon_picked',
    'deck_mutation',
  ]);

  for (const rec of records) {
    if (rec.errorStack) continue; // crashed run — skip entirely

    const win = rec.outcome === 'player_win' ? 1 : 0;
    const floor = rec.floorReached ?? 0;
    const turn = rec.turnsPlayed ?? 0;
    const dutkiVal = rec.totalDutkiEarned ?? 0;
    const agent = rec.agent ?? 'unknown';
    const sk = sliceKey(rec);
    // Older records (pre-hpAtDeath) omit these fields; fall back to a degenerate
    // survival score == floorReached so aggregations over mixed baselines stay comparable.
    const hpAtDeath = Number.isFinite(rec.hpAtDeath) ? rec.hpAtDeath : 0;
    const maxHpAtDeath =
      Number.isFinite(rec.maxHpAtDeath) && rec.maxHpAtDeath > 0 ? rec.maxHpAtDeath : 1;
    const survival = Number.isFinite(rec.survivalScore)
      ? rec.survivalScore
      : floor + hpAtDeath / maxHpAtDeath;

    totalWins += win;
    totalValid += 1;
    floorSumAll += floor;
    floorSqSumAll += floor * floor;
    floors.push(floor);
    turns.push(turn);
    dutki.push(dutkiVal);
    hpAtDeaths.push(hpAtDeath);
    survivalScores.push(survival);
    agentMix[agent] = (agentMix[agent] ?? 0) + 1;

    if (!agentStats[agent]) {
      agentStats[agent] = { wins: 0, total: 0, floors: [], survivalScores: [] };
    }
    agentStats[agent].wins += win;
    agentStats[agent].total += 1;
    agentStats[agent].floors.push(floor);
    agentStats[agent].survivalScores.push(survival);

    const sacc = getSliceAcc(sk);
    sacc.wins += win;
    sacc.total += 1;
    sacc.floors.push(floor);
    sacc.turns.push(turn);

    // Track which entity ids appeared in this run so we credit floor-reached
    // and runsWithEntity exactly once per unique entity.
    /** @type {Set<string>} */ const seenEntityKeys = new Set();

    // Entity stats from finalDeck / finalRelics / finalBoons
    _processEndInventory(rec, win, floor, getEntityAcc, seenEntityKeys);

    // Entity stats from entityEvents[] if present (summary/full tiers)
    if (Array.isArray(rec.entityEvents)) {
      // Per-record card play and battle counters for avgPlaysPerBattle
      const recCardPlays = {}; // cardId -> play count this record
      let recBattleCount = 0;
      // Dedupe by kind:id so each unique entity counts once per run toward runsWithEntity.
      /** @type {Set<string>} */ const recEnemyIds = new Set();
      /** @type {Set<string>} */ const recEventIds = new Set();
      /** @type {Set<string>} */ const recWeatherIds = new Set();

      // Track current floor + weather as the run progresses. Floor comes from
      // node_entered / battle_started events (each event has its own
      // ev.floor, but we trust battle_started for the per-enemy floor stat).
      let currentWeather = null;

      for (const ev of rec.entityEvents) {
        if (ev.kind && !KNOWN_EVENT_KINDS.has(ev.kind)) {
          unknownEventKinds.add(ev.kind);
        }

        if (ev.kind === 'weather_entered') {
          currentWeather = ev.payload?.weather?.id ?? currentWeather;
        }

        _processEntityEvent(ev, rec, win, getEntityAcc, currentWeather);

        if (ev.kind === 'card_played' && ev.payload?.card?.id) {
          const cid = ev.payload.card.id;
          recCardPlays[cid] = (recCardPlays[cid] ?? 0) + 1;
        }
        if (ev.kind === 'battle_started') {
          recBattleCount += 1;
          const eid = ev.payload?.enemy?.id;
          if (eid) recEnemyIds.add(eid);
        }
        if (ev.kind === 'event_entered') {
          const eid = ev.payload?.event?.id;
          if (eid) recEventIds.add(eid);
        }
        if (ev.kind === 'weather_entered') {
          const wid = ev.payload?.weather?.id;
          if (wid) recWeatherIds.add(wid);
        }
      }

      // Apply per-record card play stats to entity accumulators
      for (const [cid, plays] of Object.entries(recCardPlays)) {
        const acc = getEntityAcc('card', cid);
        acc.playsTotal += plays;
        acc.battlesTotal += recBattleCount;
      }

      // Per-run counts — each unique id contributes once per run (enemies,
      // events and weather can fire many times per run, but a run either "saw"
      // them or not for lift purposes).
      for (const eid of recEnemyIds) {
        _creditRunWithEntity(
          getEntityAcc('enemy', eid),
          `enemy:${eid}`,
          win,
          floor,
          seenEntityKeys
        );
      }
      for (const eid of recEventIds) {
        _creditRunWithEntity(
          getEntityAcc('event', eid),
          `event:${eid}`,
          win,
          floor,
          seenEntityKeys
        );
      }
      for (const wid of recWeatherIds) {
        _creditRunWithEntity(
          getEntityAcc('weather', wid),
          `weather:${wid}`,
          win,
          floor,
          seenEntityKeys
        );
      }
    }

    // Paired A/B tracking — accept world A/B (new) or present/absent (legacy)
    if (rec.pairKey && rec.world) {
      if (rec.pairStatus === 'broken' || rec.errorStack) {
        // Broken half — mark the pair key as having a broken half; count later
        if (!pairs[rec.pairKey])
          pairs[rec.pairKey] = { present: null, absent: null, broken: false };
        pairs[rec.pairKey].broken = true;
      } else {
        if (!pairs[rec.pairKey])
          pairs[rec.pairKey] = { present: null, absent: null, broken: false };
        const isPresent = rec.world === 'A' || rec.world === 'present';
        const isAbsent = rec.world === 'B' || rec.world === 'absent';
        if (isPresent) pairs[rec.pairKey].present = rec;
        else if (isAbsent) pairs[rec.pairKey].absent = rec;
      }
    }
  }

  // Resolve complete pairs → per-entity lift deltas
  for (const [, pair] of Object.entries(pairs)) {
    if (pair.broken) {
      brokenPairs += 1;
      continue;
    }
    if (!pair.present || !pair.absent) {
      brokenPairs += 1; // half-crashed or missing
      continue;
    }
    const delta =
      (pair.present.outcome === 'player_win' ? 1 : 0) -
      (pair.absent.outcome === 'player_win' ? 1 : 0);
    // Attribute to the paired entity derived from pairKey format "kind:id:pairIndex"
    const parts = pair.present.pairKey.split(':');
    if (parts.length >= 2) {
      const kind = parts[0];
      const id = parts[1];
      const acc = getEntityAcc(kind, id);
      acc.pairDeltas.push(delta);
      acc.matchedPairCount += 1;
    }
  }

  // Marginal "without" stats — computed against the global population so every
  // entity gets a non-null winrateWithout / winrateLiftPp value.
  const overallFloorMean = totalValid > 0 ? floorSumAll / totalValid : 0;
  const overallFloorVar =
    totalValid > 1
      ? Math.max(
          0,
          (floorSqSumAll - totalValid * overallFloorMean * overallFloorMean) / (totalValid - 1)
        )
      : 0;

  for (const acc of Object.values(entityAccs)) {
    acc.runsWithoutEntity = Math.max(0, totalValid - acc.runsWithEntity);
    acc.winsWithoutEntity = Math.max(0, totalWins - acc.winsWithEntity);
    acc.floorSumWithout = Math.max(0, floorSumAll - acc.floorSumWith);
    acc.floorSqSumWithout = Math.max(0, floorSqSumAll - acc.floorSqSumWith);
  }

  // Build byEntity output
  const byEntity = {};
  for (const [key, acc] of Object.entries(entityAccs)) {
    const [kind, ...idParts] = key.split(':');
    const id = idParts.join(':');
    byEntity[key] = _buildEntityStats(kind, id, acc, totalValid);
  }

  // Check belowMinSample
  for (const stats of Object.values(byEntity)) {
    if (stats.sampleTier === 'red') belowMinSample += 1;
  }

  schemaDrift.unknownEventKinds = [...unknownEventKinds];

  return {
    schemaVersion: SCHEMA_VERSION,
    batchId,
    batchName,
    gitSha,
    runCount: totalValid,
    dateRun,
    configHash,
    poolOverridesHash,
    agentMix,
    agentStats: _buildAgentStats(agentStats),
    agentDivergence: _buildAgentDivergence(agentStats),
    overall: {
      winrate: rateCi(totalWins, totalValid),
      avgFloorReached: meanCi(floors),
      avgTurnsPlayed: meanCi(turns),
      avgDutkiEarned: meanCi(dutki),
      avgHpAtDeath: meanCi(hpAtDeaths),
      avgSurvivalScore: meanCi(survivalScores),
      floorReached: distribution(floors),
      turnsPlayed: distribution(turns),
      dutkiEarned: distribution(dutki),
      hpAtDeath: distribution(hpAtDeaths),
      survivalScore: distribution(survivalScores),
    },
    bySlice: _buildBySlice(sliceAccs),
    byEntity,
    synergyMatrix: { topK: 5, pairs: {} },
    diagnostic: {
      ciMethodology: `paired-bootstrap-${BOOTSTRAP_RESAMPLES}-resamples`,
      sampleTierThresholds: { green: SAMPLE_TIER_GREEN, yellow: SAMPLE_TIER_YELLOW },
      belowMinSample,
      brokenPairs,
      schemaDrift,
      coverage: {
        runs: totalValid,
        withEntityEvents: records.filter((r) => Array.isArray(r.entityEvents)).length,
      },
      overallFloorVariance: round4(overallFloorVar),
    },
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _emptyMetrics() {
  const emptyDist = distribution([]);
  return {
    schemaVersion: SCHEMA_VERSION,
    batchId: 'unknown',
    batchName: 'unknown',
    gitSha: '',
    runCount: 0,
    dateRun: new Date().toISOString(),
    configHash: '',
    poolOverridesHash: '',
    agentMix: {},
    agentStats: {},
    agentDivergence: _emptyAgentDivergence(),
    overall: {
      winrate: rateCi(0, 0),
      avgFloorReached: meanCi([]),
      avgTurnsPlayed: meanCi([]),
      avgDutkiEarned: meanCi([]),
      avgHpAtDeath: meanCi([]),
      avgSurvivalScore: meanCi([]),
      floorReached: emptyDist,
      turnsPlayed: emptyDist,
      dutkiEarned: emptyDist,
      hpAtDeath: emptyDist,
      survivalScore: emptyDist,
    },
    bySlice: {},
    byEntity: {},
    synergyMatrix: { topK: 5, pairs: {} },
    diagnostic: {
      ciMethodology: `paired-bootstrap-${BOOTSTRAP_RESAMPLES}-resamples`,
      sampleTierThresholds: { green: SAMPLE_TIER_GREEN, yellow: SAMPLE_TIER_YELLOW },
      belowMinSample: 0,
      brokenPairs: 0,
      schemaDrift: { unknownEventKinds: [] },
      coverage: { runs: 0, withEntityEvents: 0 },
      overallFloorVariance: 0,
    },
  };
}

/**
 * Credit a single (kind:id) entity with one run-level appearance: bumps
 * runsWithEntity, winsWithEntity, floor sums, and slice breakdown — but only
 * once per (run, entity) pair regardless of how many event paths reference it.
 *
 * @param {EntityAcc} acc
 * @param {string} key kind:id
 * @param {number} win 0|1
 * @param {number} floor
 * @param {Set<string>} seenEntityKeys
 */
function _creditRunWithEntity(acc, key, win, floor, seenEntityKeys) {
  if (seenEntityKeys.has(key)) return;
  seenEntityKeys.add(key);
  acc.runsWithEntity += 1;
  if (win) acc.winsWithEntity += 1;
  acc.floorSumWith += floor;
  acc.floorSqSumWith += floor * floor;
}

/**
 * Accumulate end-of-run inventory into entity accumulators. Each unique id
 * contributes once per run; duplicates inside a deck do not inflate
 * runsWithEntity (F1 fix).
 */
function _processEndInventory(rec, win, floor, getEntityAcc, seenEntityKeys) {
  const character = rec.character;
  const sk = sliceKey(rec);

  if (character) {
    const acc = getEntityAcc('character', character);
    const key = `character:${character}`;
    if (!seenEntityKeys.has(key)) {
      _creditRunWithEntity(acc, key, win, floor, seenEntityKeys);
      acc.acquiredCount += 1;
      _addToSlice(acc, sk, win);
    }
  }

  for (const cardId of new Set(rec.finalDeck ?? [])) {
    const acc = getEntityAcc('card', cardId);
    const key = `card:${cardId}`;
    if (seenEntityKeys.has(key)) continue;
    _creditRunWithEntity(acc, key, win, floor, seenEntityKeys);
    _addToSlice(acc, sk, win);
  }

  for (const relicId of new Set(rec.finalRelics ?? [])) {
    const acc = getEntityAcc('relic', relicId);
    const key = `relic:${relicId}`;
    if (seenEntityKeys.has(key)) continue;
    _creditRunWithEntity(acc, key, win, floor, seenEntityKeys);
    acc.acquiredCount += 1;
    _addToSlice(acc, sk, win);
  }

  for (const boonId of new Set(rec.finalBoons ?? [])) {
    const acc = getEntityAcc('boon', boonId);
    const key = `boon:${boonId}`;
    if (seenEntityKeys.has(key)) continue;
    _creditRunWithEntity(acc, key, win, floor, seenEntityKeys);
    acc.acquiredCount += 1;
    _addToSlice(acc, sk, win);
  }
}

function _addToSlice(acc, sk, win) {
  if (!acc.bySlice[sk]) acc.bySlice[sk] = { wins: 0, total: 0 };
  acc.bySlice[sk].total += 1;
  acc.bySlice[sk].wins += win;
}

/**
 * Process a single entityEvent from entityEvents[] (summary/full tiers).
 *
 * @param {object} ev
 * @param {object} rec
 * @param {number} win
 * @param {(kind: string, id: string) => EntityAcc} getEntityAcc
 * @param {string | null} currentWeather
 */
function _processEntityEvent(ev, rec, win, getEntityAcc, currentWeather) {
  if (!ev || !ev.kind) return;

  switch (ev.kind) {
    case 'reward_offered': {
      for (const entity of ev.payload?.entities ?? []) {
        if (!entity?.kind || !entity?.id) continue;
        getEntityAcc(entity.kind, entity.id).offeredCount += 1;
      }
      break;
    }
    case 'reward_picked': {
      const entity = ev.payload?.entity;
      if (entity?.kind && entity?.id) {
        const acc = getEntityAcc(entity.kind, entity.id);
        acc.acquiredCount += 1;
        acc.addAcquisitionSource('reward');
      }
      break;
    }
    case 'shop_purchase': {
      const entity = ev.payload?.entity;
      if (entity?.kind && entity?.id) {
        const acc = getEntityAcc(entity.kind, entity.id);
        acc.acquiredCount += 1;
        acc.addAcquisitionSource('shop');
      }
      break;
    }
    case 'boon_offered': {
      for (const boon of ev.payload?.boons ?? []) {
        if (boon?.id) getEntityAcc('boon', boon.id).offeredCount += 1;
      }
      break;
    }
    case 'boon_picked': {
      const boon = ev.payload?.boon;
      if (boon?.id) {
        const acc = getEntityAcc('boon', boon.id);
        acc.acquiredCount += 1;
        acc.addAcquisitionSource('maryna');
      }
      break;
    }
    case 'card_played':
      // card play counts handled in per-record aggregation loop above
      break;
    case 'battle_started': {
      const enemy = ev.payload?.enemy;
      if (enemy?.id) {
        const acc = getEntityAcc('enemy', enemy.id);
        acc.battlesTotal += 1;
        const floor = ev.floor ?? 0;
        const fk = String(floor);
        if (!acc.byFloor[fk]) acc.byFloor[fk] = { wins: 0, total: 0 };
        acc.byFloor[fk].total += 1;
        if (currentWeather) {
          if (!acc.byWeather[currentWeather]) acc.byWeather[currentWeather] = { wins: 0, total: 0 };
          acc.byWeather[currentWeather].total += 1;
        }
      }
      break;
    }
    case 'battle_ended': {
      const enemy = ev.payload?.enemy;
      const playerWon = ev.payload?.outcome === 'player_win';
      if (enemy?.id && playerWon) {
        const acc = getEntityAcc('enemy', enemy.id);
        acc.killCount += 1;
        // Prefer explicit turnCount payload, fall back to envelope ev.turn.
        const turnCount = Number.isFinite(ev.payload?.turnCount)
          ? ev.payload.turnCount
          : Number.isFinite(ev.turn)
            ? ev.turn
            : 0;
        acc.turnsToKillTotal += turnCount;
        const floor = ev.floor ?? 0;
        const fk = String(floor);
        if (!acc.byFloor[fk]) acc.byFloor[fk] = { wins: 0, total: 0 };
        acc.byFloor[fk].wins += 1;
        if (currentWeather) {
          if (!acc.byWeather[currentWeather]) acc.byWeather[currentWeather] = { wins: 0, total: 0 };
          acc.byWeather[currentWeather].wins += 1;
        }
      }
      break;
    }
    case 'weather_entered':
    case 'event_entered':
      // Per-run run counts for weather/event handled via record-level dedupe
      // in the outer loop — these events fire multiple times per run.
      break;
    case 'relic_gained': {
      const relic = ev.payload?.relic;
      if (relic?.id) {
        const acc = getEntityAcc('relic', relic.id);
        acc.acquiredCount += 1;
        acc.addAcquisitionSource('reward');
      }
      break;
    }
    // Other event kinds (deck_mutation, status_applied, etc.) not aggregated here
    default:
      break;
  }
}

function _buildBySlice(sliceAccs) {
  const out = {};
  for (const [key, acc] of Object.entries(sliceAccs)) {
    out[key] = {
      winrate: rateCi(acc.wins, acc.total),
      avgFloorReached: meanCi(acc.floors),
      avgTurnsPlayed: meanCi(acc.turns),
      runCount: acc.total,
    };
  }
  return out;
}

/**
 * Build per-agent summary (winrate, avg floor, survival score) so callers can
 * compare bot behaviour side-by-side. Used by the Batch Summary divergence card.
 *
 * @param {Record<string, { wins: number, total: number, floors: number[], survivalScores: number[] }>} agentAccs
 */
function _buildAgentStats(agentAccs) {
  const out = {};
  for (const [name, acc] of Object.entries(agentAccs)) {
    out[name] = {
      runCount: acc.total,
      winrate: rateCi(acc.wins, acc.total),
      avgFloorReached: meanCi(acc.floors),
      avgSurvivalScore: meanCi(acc.survivalScores),
    };
  }
  return out;
}

/**
 * Summarise how much agents diverge on the primary outcome metrics. Emits the
 * stddev and spread (max−min) across agents with at least one run. Agents with
 * no runs are excluded. Returns zeros when only one agent is present.
 *
 * @param {Record<string, { wins: number, total: number, floors: number[], survivalScores: number[] }>} agentAccs
 * @returns {{ agents: number, winrateStdDev: number, winrateSpread: number, winrateMin: number, winrateMax: number, floorStdDev: number, floorSpread: number, survivalScoreStdDev: number, survivalScoreSpread: number }}
 */
function _buildAgentDivergence(agentAccs) {
  const rows = Object.values(agentAccs).filter((acc) => acc.total > 0);
  if (rows.length < 2) {
    return { ..._emptyAgentDivergence(), agents: rows.length };
  }

  const winrates = rows.map((r) => r.wins / r.total);
  const avgFloors = rows.map((r) => (r.floors.length > 0 ? sum(r.floors) / r.floors.length : 0));
  const avgSurvival = rows.map((r) =>
    r.survivalScores.length > 0 ? sum(r.survivalScores) / r.survivalScores.length : 0
  );

  return {
    agents: rows.length,
    winrateStdDev: round4(stddev(winrates)),
    winrateSpread: round4(spread(winrates)),
    winrateMin: round4(Math.min(...winrates)),
    winrateMax: round4(Math.max(...winrates)),
    floorStdDev: round4(stddev(avgFloors)),
    floorSpread: round4(spread(avgFloors)),
    survivalScoreStdDev: round4(stddev(avgSurvival)),
    survivalScoreSpread: round4(spread(avgSurvival)),
  };
}

function _emptyAgentDivergence() {
  return {
    agents: 0,
    winrateStdDev: 0,
    winrateSpread: 0,
    winrateMin: 0,
    winrateMax: 0,
    floorStdDev: 0,
    floorSpread: 0,
    survivalScoreStdDev: 0,
    survivalScoreSpread: 0,
  };
}

function sum(values) {
  let s = 0;
  for (const v of values) s += v;
  return s;
}

function stddev(values) {
  const n = values.length;
  if (n < 2) return 0;
  const mean = sum(values) / n;
  let sq = 0;
  for (const v of values) sq += (v - mean) * (v - mean);
  return Math.sqrt(sq / (n - 1));
}

function spread(values) {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

function _buildEntityStats(kind, id, acc, totalValid) {
  const winrateWith =
    acc.runsWithEntity > 0 ? rateCi(acc.winsWithEntity, acc.runsWithEntity) : rateCi(0, 0);

  const winrateWithout =
    acc.runsWithoutEntity > 0 ? rateCi(acc.winsWithoutEntity, acc.runsWithoutEntity) : null;

  const winrateLiftPp =
    winrateWithout != null ? round4(winrateWith.rate - winrateWithout.rate) : null;

  // Lift CI: prefer paired bootstrap when available, else marginal two-prop.
  let liftCi;
  if (acc.pairDeltas.length > 0) {
    liftCi = bootstrapLiftCi(acc.pairDeltas);
  } else if (winrateWithout != null) {
    liftCi = diffCi(
      acc.winsWithEntity,
      acc.runsWithEntity,
      acc.winsWithoutEntity,
      acc.runsWithoutEntity
    );
  } else {
    liftCi = null;
  }

  const pairedLift =
    acc.pairDeltas.length > 0
      ? round4(acc.pairDeltas.reduce((s, d) => s + d, 0) / acc.pairDeltas.length)
      : null;

  // Floor-reached marginal lift — gives a usable signal even when winrate is 0.
  const meanFloorWith = acc.runsWithEntity > 0 ? acc.floorSumWith / acc.runsWithEntity : null;
  const meanFloorWithout =
    acc.runsWithoutEntity > 0 ? acc.floorSumWithout / acc.runsWithoutEntity : null;
  const varFloorWith =
    acc.runsWithEntity > 1
      ? Math.max(
          0,
          (acc.floorSqSumWith - acc.runsWithEntity * meanFloorWith * meanFloorWith) /
            (acc.runsWithEntity - 1)
        )
      : 0;
  const varFloorWithout =
    acc.runsWithoutEntity > 1
      ? Math.max(
          0,
          (acc.floorSqSumWithout - acc.runsWithoutEntity * meanFloorWithout * meanFloorWithout) /
            (acc.runsWithoutEntity - 1)
        )
      : 0;

  const avgFloorReachedWith = meanFloorWith != null ? round4(meanFloorWith) : null;
  const avgFloorReachedWithout = meanFloorWithout != null ? round4(meanFloorWithout) : null;
  const floorReachedLift =
    avgFloorReachedWith != null && avgFloorReachedWithout != null
      ? round4(avgFloorReachedWith - avgFloorReachedWithout)
      : null;
  const floorReachedLiftCi =
    avgFloorReachedWith != null && avgFloorReachedWithout != null
      ? meanDiffCi(
          { mean: meanFloorWith, variance: varFloorWith, n: acc.runsWithEntity },
          { mean: meanFloorWithout, variance: varFloorWithout, n: acc.runsWithoutEntity }
        )
      : null;

  const tier = sampleTier(acc.runsWithEntity);

  // Pick rate strategy depends on kind. Hidden kinds get null so the dashboard
  // can omit the column entirely.
  let pickRate = null;
  if (PICK_RATE_HIDDEN_KINDS.has(kind)) {
    pickRate = null;
  } else if (PICK_RATE_RUN_FRACTION_KINDS.has(kind)) {
    pickRate = totalValid > 0 ? round4(acc.acquiredCount / totalValid) : null;
  } else if (acc.offeredCount > 0) {
    pickRate = round4(acc.acquiredCount / acc.offeredCount);
  }

  const base = {
    kind,
    id,
    name: resolveEntityName(kind, id),
    offeredCount: acc.offeredCount,
    acquiredCount: acc.acquiredCount,
    runsWithEntity: acc.runsWithEntity,
    runsWithoutEntity: acc.runsWithoutEntity,
    pickRate,
    winrateWithEntity: winrateWith,
    winrateWithout,
    winrateLiftPp,
    liftCi,
    matchedPairCount: acc.matchedPairCount,
    ...(pairedLift !== null ? { pairedLift } : {}),
    avgFloorReachedWith,
    avgFloorReachedWithout,
    floorReachedLift,
    floorReachedLiftCi,
    bySlice: acc.bySlice,
    acquisitionSources: acc.acquisitionSources,
    sampleTier: tier,
  };

  // Per-kind extensions
  if (kind === 'card') {
    const avgPlaysPerBattle =
      acc.battlesTotal > 0 ? round4(acc.playsTotal / acc.battlesTotal) : null;
    return { ...base, avgPlaysPerBattle, damagePerEnergy: null };
  }

  if (kind === 'enemy') {
    // Null-guard avgTurnsToKill: 0 turns recorded is uninformative, render as null.
    const avgTurnsToKill =
      acc.killCount > 0 && acc.turnsToKillTotal > 0
        ? round4(acc.turnsToKillTotal / acc.killCount)
        : null;
    return {
      ...base,
      avgTurnsToKill,
      byFloor: _buildEnemyMatrix(acc.byFloor),
      byWeather: _buildEnemyMatrix(acc.byWeather),
    };
  }

  return base;
}

/**
 * Map { wins, total } cells into derived winrate cells for downstream charts.
 * Matches what the dashboard expects.
 *
 * @param {Record<string, { wins: number, total: number }>} bucket
 */
function _buildEnemyMatrix(bucket) {
  const out = {};
  for (const [k, cell] of Object.entries(bucket)) {
    if (!cell || cell.total === 0) continue;
    out[k] = {
      wins: cell.wins,
      total: cell.total,
      winrate: round4(cell.wins / cell.total),
    };
  }
  return out;
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

async function readLines(inputPath) {
  const stream = inputPath
    ? createReadStream(inputPath, { encoding: 'utf8' })
    : Readable.from(process.stdin);

  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  const lines = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) lines.push(trimmed);
  }
  return lines;
}

function parseRecords(lines) {
  const records = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return records;
}

async function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0] ?? null;
  const outputPath = args[1] ?? null;

  const lines = await readLines(inputPath);
  const records = parseRecords(lines);
  const metrics = analyze(records);
  const json = JSON.stringify(metrics, null, 2);

  if (outputPath) {
    const ws = createWriteStream(outputPath, { encoding: 'utf8' });
    ws.write(json);
    ws.end();
  } else {
    process.stdout.write(json + '\n');
  }
}

// Only run main when invoked directly (not imported by tests)
if (process.argv[1] && process.argv[1].endsWith('analyze.js')) {
  main().catch((err) => {
    process.stderr.write(`[analyze] FATAL: ${err.message}\n`);
    process.exit(1);
  });
}
