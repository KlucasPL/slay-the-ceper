import { describe, it, expect, afterEach } from 'vitest';
import { createReadStream, existsSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openJsonlWriter } from '../../scripts/sim/writer.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Each test gets its own isolated temp dir to prevent parallel-test collisions.
let _testDir = null;

function getTestDir() {
  if (!_testDir) {
    _testDir = join(tmpdir(), `writer-test-${randomUUID()}`);
    mkdirSync(_testDir, { recursive: true });
  }
  return _testDir;
}

function tmpPath(name) {
  return join(getTestDir(), name);
}

const ALL_PATHS = [];

function track(p) {
  ALL_PATHS.push(p);
  return p;
}

afterEach(() => {
  for (const p of ALL_PATHS.splice(0)) {
    for (const candidate of [p, `${p}.tmp`]) {
      if (existsSync(candidate)) {
        try {
          unlinkSync(candidate);
        } catch {
          /* ignore */
        }
      }
    }
  }
  // Reset per-test dir so the next test gets a fresh UUID-scoped directory
  _testDir = null;
});

async function readJsonlFile(filePath) {
  const lines = readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

async function readGzipJsonlFile(filePath) {
  const stream = createReadStream(filePath);
  const gunzip = createGunzip();
  stream.pipe(gunzip);
  const rl = createInterface({ input: gunzip, crlfDelay: Infinity });
  const records = [];
  for await (const line of rl) {
    if (line.trim()) records.push(JSON.parse(line));
  }
  return records;
}

// ---------------------------------------------------------------------------
// Minimal record factory
// ---------------------------------------------------------------------------

function makeRecord(overrides = {}) {
  return {
    schemaVersion: 2,
    batch: 'test',
    gitSha: 'abc',
    configHash: 'cfg',
    poolOverridesHash: 'po',
    seed: 'deadbeef',
    agent: 'random',
    agentParams: {},
    character: 'jedrek',
    difficulty: 'normal',
    poolOverrides: null,
    outcome: 'enemy_win',
    floorReached: 3,
    turnsPlayed: 8,
    totalDutkiEarned: 40,
    killerEnemyId: 'cepr',
    killerName: 'Cepr',
    finalDeck: ['ciupaga'],
    finalRelics: [],
    finalBoons: [],
    durationMs: 100,
    // summary-tier fields
    battles: [{ floor: 1, turns: 4, outcome: 'enemy_win' }],
    entityEvents: [
      { kind: 'card_played', payload: { card: { kind: 'card', id: 'ciupaga' }, cost: 1 } },
      { kind: 'turn_started', payload: { battleTurn: 1 } }, // F-tier
      { kind: 'reward_offered', payload: { entities: [] } },
      { kind: 'card_drawn', payload: { card: { kind: 'card', id: 'ciupaga' } } }, // F-tier
    ],
    counterRollups: { cardsPlayed: 3 },
    // full-tier fields
    agentTrace: [{ turn: 1, action: { type: 'end_turn' } }],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('openJsonlWriter', () => {
  it('shouldWriteOneLinePerRecordInOffTier', async () => {
    // given
    const path = track(tmpPath('off.jsonl'));
    const writer = openJsonlWriter({ path, verbosity: 'off' });

    // when
    writer.write(makeRecord());
    writer.write(makeRecord({ outcome: 'player_win' }));
    await writer.close();

    // then
    const records = await readJsonlFile(path);
    expect(records).toHaveLength(2);
  });

  it('shouldIncludeOnlyEnvelopeFieldsInOffTier', async () => {
    // given
    const path = track(tmpPath('off-fields.jsonl'));
    const writer = openJsonlWriter({ path, verbosity: 'off' });

    // when
    writer.write(makeRecord());
    await writer.close();

    // then
    const [rec] = await readJsonlFile(path);
    expect(rec.battles).toBeUndefined();
    expect(rec.entityEvents).toBeUndefined();
    expect(rec.counterRollups).toBeUndefined();
    expect(rec.agentTrace).toBeUndefined();
    // all envelope fields present
    expect(rec.schemaVersion).toBe(2);
    expect(rec.outcome).toBe('enemy_win');
    expect(rec.finalDeck).toEqual(['ciupaga']);
  });

  it('shouldAddBattlesAndSFilteredEntityEventsInSummaryTier', async () => {
    // given
    const path = track(tmpPath('summary.jsonl'));
    const writer = openJsonlWriter({ path, verbosity: 'summary' });

    // when
    writer.write(makeRecord());
    await writer.close();

    // then
    const [rec] = await readJsonlFile(path);
    expect(rec.battles).toHaveLength(1);
    expect(rec.counterRollups).toEqual({ cardsPlayed: 3 });
    // S-tier events kept, F-tier filtered out
    const kinds = rec.entityEvents.map((e) => e.kind);
    expect(kinds).toContain('card_played');
    expect(kinds).toContain('reward_offered');
    expect(kinds).not.toContain('turn_started');
    expect(kinds).not.toContain('card_drawn');
    expect(rec.agentTrace).toBeUndefined();
  });

  it('shouldIncludeAllFieldsInFullTier', async () => {
    // given
    const path = track(tmpPath('full.jsonl'));
    const writer = openJsonlWriter({ path, verbosity: 'full' });

    // when
    writer.write(makeRecord());
    await writer.close();

    // then
    const [rec] = await readJsonlFile(path);
    expect(rec.agentTrace).toBeDefined();
    // F-tier events present
    const kinds = rec.entityEvents.map((e) => e.kind);
    expect(kinds).toContain('turn_started');
    expect(kinds).toContain('card_drawn');
  });

  it('shouldAtomicallyRenameFromTmpOnClose', async () => {
    // given
    const path = track(tmpPath('atomic.jsonl'));
    const writer = openJsonlWriter({ path, verbosity: 'off' });

    // when: write and close
    writer.write(makeRecord());

    // before close: final path must not exist yet
    expect(existsSync(path)).toBe(false);

    await writer.close();

    // then: final path exists, .tmp removed
    expect(existsSync(path)).toBe(true);
    expect(existsSync(`${path}.tmp`)).toBe(false);
  });

  it('shouldWriteGzipCompressedJsonl', async () => {
    // given
    const path = track(tmpPath('compressed.jsonl.gz'));
    const writer = openJsonlWriter({ path, compress: true, verbosity: 'summary' });

    // when
    writer.write(makeRecord({ outcome: 'player_win' }));
    writer.write(makeRecord({ outcome: 'enemy_win' }));
    await writer.close();

    // then: file exists and decompresses correctly
    expect(existsSync(path)).toBe(true);
    const records = await readGzipJsonlFile(path);
    expect(records).toHaveLength(2);
    expect(records[0].outcome).toBe('player_win');
    expect(records[1].outcome).toBe('enemy_win');
  });

  it('shouldFilterEntityEventsInGzipSummaryTier', async () => {
    // given
    const path = track(tmpPath('gz-summary.jsonl.gz'));
    const writer = openJsonlWriter({ path, compress: true, verbosity: 'summary' });

    // when
    writer.write(makeRecord());
    await writer.close();

    // then: F-tier events stripped even in gzip output
    const [rec] = await readGzipJsonlFile(path);
    const kinds = rec.entityEvents.map((e) => e.kind);
    expect(kinds).not.toContain('turn_started');
    expect(kinds).toContain('card_played');
  });

  it('shouldCleanUpStaleTmpFileOnOpen', async () => {
    // given: pre-create a stale .tmp
    const path = track(tmpPath('stale.jsonl'));
    const staleTmp = `${path}.tmp`;
    // Write stale content
    const staleWriter = openJsonlWriter({ path: staleTmp.replace('.tmp', ''), verbosity: 'off' });
    staleWriter.write(makeRecord());
    // Deliberately don't close — just simulate stale file by writing directly
    const { writeFileSync } = await import('node:fs');
    writeFileSync(staleTmp, 'stale\n', 'utf8');

    // when: open a new writer for the same path
    const writer = openJsonlWriter({ path, verbosity: 'off' });
    writer.write(makeRecord({ outcome: 'player_win' }));
    await writer.close();

    // then: final file contains only the new record, not stale content
    const records = await readJsonlFile(path);
    expect(records).toHaveLength(1);
    expect(records[0].outcome).toBe('player_win');
  });

  it('shouldThrowOnWriteAfterClose', async () => {
    // given
    const path = track(tmpPath('after-close.jsonl'));
    const writer = openJsonlWriter({ path, verbosity: 'off' });
    await writer.close();

    // when / then
    expect(() => writer.write(makeRecord())).toThrow('write after close');
  });

  it('shouldHandleRecordWithNoOptionalEnvelopeFields', async () => {
    // given: minimal record without pairKey/world/pairStatus/errorStack/cell
    const path = track(tmpPath('minimal.jsonl'));
    const writer = openJsonlWriter({ path, verbosity: 'off' });
    const minimal = {
      schemaVersion: 2,
      batch: 'b',
      gitSha: 'g',
      configHash: 'c',
      poolOverridesHash: 'p',
      seed: 'aa',
      agent: 'random',
      agentParams: {},
      character: 'jedrek',
      difficulty: 'normal',
      poolOverrides: null,
      outcome: 'player_win',
      floorReached: 10,
      turnsPlayed: 20,
      totalDutkiEarned: 100,
      killerEnemyId: null,
      killerName: null,
      finalDeck: [],
      finalRelics: [],
      finalBoons: [],
      durationMs: 50,
    };

    // when
    writer.write(minimal);
    await writer.close();

    // then
    const [rec] = await readJsonlFile(path);
    expect(rec.outcome).toBe('player_win');
    expect(rec.pairKey).toBeUndefined();
    expect(rec.errorStack).toBeUndefined();
  });
});
