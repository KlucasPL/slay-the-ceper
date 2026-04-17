/**
 * Compares two metrics.json files and emits a markdown diff table.
 *
 * Usage:
 *   node scripts/sim/tools/diff-baseline.js --baseline <a.json> --candidate <b.json>
 *   node scripts/sim/tools/diff-baseline.js --baseline <a.json> --candidate <b.json> \
 *       --thresholds baselines/thresholds.json
 *
 * Exit codes:
 *   0 — no drift outside thresholds
 *   1 — hash mismatch (configHash or poolOverridesHash differ)
 *   2 — one or more entities drifted outside threshold
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Default thresholds
// ---------------------------------------------------------------------------

/** @typedef {{ winratePp: number, liftPp: number, pickRatePp: number, pValue: number }} Thresholds */

const DEFAULT_THRESHOLDS = {
  winratePp: 2, // ±2 pp
  liftPp: 3, // ±3 pp
  pickRatePp: 10, // ±10 pp
  pValue: 0.01,
};

// ---------------------------------------------------------------------------
// Pure diff logic (exported for tests)
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   entityKey: string,
 *   status: 'changed' | 'new' | 'removed',
 *   winrateDelta: number | null,
 *   liftPpDelta: number | null,
 *   pickRateDelta: number | null,
 *   baselineSampleTier: string | null,
 *   candidateSampleTier: string | null,
 *   flags: string[],
 * }} EntityDiff
 *
 * @typedef {{
 *   ok: boolean,
 *   hashMismatch: { field: string, baseline: string, candidate: string } | null,
 *   overallWinrateDelta: number | null,
 *   entities: EntityDiff[],
 *   driftedEntities: string[],
 * }} DiffResult
 */

/**
 * Compute diff between two metrics.json objects.
 * @param {object} baseline
 * @param {object} candidate
 * @param {Thresholds} thresholds
 * @returns {DiffResult}
 */
export function diffMetrics(baseline, candidate, thresholds = DEFAULT_THRESHOLDS) {
  // Hash guardrail — refuse to diff mismatched pool configs
  for (const field of ['configHash', 'poolOverridesHash']) {
    if (baseline[field] && candidate[field] && baseline[field] !== candidate[field]) {
      return {
        ok: false,
        hashMismatch: { field, baseline: baseline[field], candidate: candidate[field] },
        overallWinrateDelta: null,
        entities: [],
        driftedEntities: [],
      };
    }
  }

  const overallWinrateDelta = _delta(
    baseline.overall?.winrate?.rate,
    candidate.overall?.winrate?.rate
  );

  const baselineEntities = baseline.byEntity ?? {};
  const candidateEntities = candidate.byEntity ?? {};

  const allKeys = new Set([...Object.keys(baselineEntities), ...Object.keys(candidateEntities)]);

  const entities = [];
  const driftedEntities = [];

  for (const key of allKeys) {
    const b = baselineEntities[key] ?? null;
    const c = candidateEntities[key] ?? null;

    /** @type {EntityDiff} */
    const diff = {
      entityKey: key,
      status: b && c ? 'changed' : c ? 'new' : 'removed',
      winrateDelta: _delta(b?.winrateWithEntity?.rate, c?.winrateWithEntity?.rate),
      liftPpDelta: _delta(b?.winrateLiftPp, c?.winrateLiftPp),
      pickRateDelta: _delta(b?.pickRate, c?.pickRate),
      baselineSampleTier: b?.sampleTier ?? null,
      candidateSampleTier: c?.sampleTier ?? null,
      flags: [],
    };

    // Significance check using CLT two-sample z-test for winrate
    const winrateSig = _isWinrateSignificant(b, c, thresholds.pValue);

    if (diff.status === 'new') {
      diff.flags.push('NEW');
    } else if (diff.status === 'removed') {
      diff.flags.push('REMOVED');
    } else {
      // Only flag drift if statistically significant
      if (
        diff.winrateDelta !== null &&
        Math.abs(diff.winrateDelta * 100) > thresholds.winratePp &&
        winrateSig
      ) {
        diff.flags.push(diff.winrateDelta > 0 ? '▲WINRATE' : '▼WINRATE');
      }
      if (diff.liftPpDelta !== null && Math.abs(diff.liftPpDelta * 100) > thresholds.liftPp) {
        diff.flags.push(diff.liftPpDelta > 0 ? '▲LIFT' : '▼LIFT');
      }
      if (
        diff.pickRateDelta !== null &&
        Math.abs(diff.pickRateDelta * 100) > thresholds.pickRatePp
      ) {
        diff.flags.push(diff.pickRateDelta > 0 ? '▲PICKRATE' : '▼PICKRATE');
      }
    }

    entities.push(diff);
    if (diff.flags.some((f) => f !== '~')) {
      // NEW/REMOVED always count; drift flags count for exit code
      if (diff.flags.includes('NEW') || diff.flags.includes('REMOVED')) {
        // Not a CI failure by themselves — informational
      } else if (diff.flags.length > 0) {
        driftedEntities.push(key);
      }
    }
  }

  // Sort: drifted first, then by key
  entities.sort((a, b) => {
    const aHasDrift = a.flags.some((f) => f !== 'NEW' && f !== 'REMOVED');
    const bHasDrift = b.flags.some((f) => f !== 'NEW' && f !== 'REMOVED');
    if (aHasDrift !== bHasDrift) return aHasDrift ? -1 : 1;
    return a.entityKey.localeCompare(b.entityKey);
  });

  return {
    ok: driftedEntities.length === 0,
    hashMismatch: null,
    overallWinrateDelta,
    entities,
    driftedEntities,
  };
}

/**
 * Render a DiffResult as a markdown report string.
 * @param {DiffResult} result
 * @param {object} baseline
 * @param {object} candidate
 * @returns {string}
 */
export function renderMarkdown(result, baseline, candidate) {
  const lines = [];

  lines.push('## Balance Diff Report');
  lines.push('');
  lines.push(`| | Baseline | Candidate |`);
  lines.push(`|---|---|---|`);
  lines.push(`| batch | \`${baseline.batchId ?? '?'}\` | \`${candidate.batchId ?? '?'}\` |`);
  lines.push(`| runs | ${baseline.runCount ?? '?'} | ${candidate.runCount ?? '?'} |`);
  lines.push(
    `| gitSha | \`${(baseline.gitSha ?? '').slice(0, 8)}\` | \`${(candidate.gitSha ?? '').slice(0, 8)}\` |`
  );
  lines.push('');

  if (result.hashMismatch) {
    lines.push(`> **ERROR**: Cannot diff — \`${result.hashMismatch.field}\` differs.`);
    lines.push(`> baseline: \`${result.hashMismatch.baseline}\``);
    lines.push(`> candidate: \`${result.hashMismatch.candidate}\``);
    lines.push('');
    lines.push('Diff refused to prevent misleading comparisons (§4.11 guardrail).');
    return lines.join('\n');
  }

  // Overall summary
  const bWin = pct(baseline.overall?.winrate?.rate);
  const cWin = pct(candidate.overall?.winrate?.rate);
  const winDelta =
    result.overallWinrateDelta !== null ? fmtDelta(result.overallWinrateDelta * 100) : 'n/a';

  lines.push('### Overall');
  lines.push('');
  lines.push(`| Metric | Baseline | Candidate | Delta |`);
  lines.push(`|---|---|---|---|`);
  lines.push(`| Winrate | ${bWin} | ${cWin} | ${winDelta} |`);
  lines.push('');

  if (result.entities.length === 0) {
    lines.push('_No entities to compare._');
    return lines.join('\n');
  }

  // Entity diff table
  lines.push('### Entity Diff');
  lines.push('');
  lines.push(`| Entity | Status | Winrate Δ | Lift Δ | PickRate Δ | Flags |`);
  lines.push(`|---|---|---|---|---|---|`);

  for (const e of result.entities) {
    const status = e.status === 'new' ? '🆕 NEW' : e.status === 'removed' ? '🗑 REMOVED' : '~';
    const wr = e.winrateDelta !== null ? fmtDelta(e.winrateDelta * 100) : '—';
    const lift = e.liftPpDelta !== null ? fmtDelta(e.liftPpDelta * 100) : '—';
    const pr = e.pickRateDelta !== null ? fmtDelta(e.pickRateDelta * 100) : '—';
    const flags = e.flags.filter((f) => f !== 'NEW' && f !== 'REMOVED').join(' ') || '~';
    lines.push(`| \`${e.entityKey}\` | ${status} | ${wr} | ${lift} | ${pr} | ${flags} |`);
  }

  lines.push('');

  if (result.driftedEntities.length > 0) {
    lines.push(
      `> **${result.driftedEntities.length} entity/entities drifted outside thresholds.**`
    );
    lines.push('');
  } else {
    lines.push('> All entities within thresholds.');
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _delta(a, b) {
  if (a == null || b == null) return null;
  return Math.round((b - a) * 10000) / 10000;
}

/**
 * Two-sample z-test for proportion difference.
 * Returns true if the difference is significant at the given p threshold.
 */
function _isWinrateSignificant(b, c, pThreshold) {
  if (!b || !c) return false;
  const n1 = b.winrateWithEntity?.n ?? 0;
  const n2 = c.winrateWithEntity?.n ?? 0;
  if (n1 < 30 || n2 < 30) return false;

  const p1 = b.winrateWithEntity?.rate ?? 0;
  const p2 = c.winrateWithEntity?.rate ?? 0;
  const pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  if (se === 0) return false;

  const z = Math.abs(p2 - p1) / se;
  // Approximate two-tailed p from z using complementary error function
  const p = 2 * (1 - _normalCdf(z));
  return p < pThreshold;
}

/** Approximation of normal CDF using Abramowitz & Stegun 26.2.17 */
function _normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly =
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const result = 1 - pdf * poly;
  return z >= 0 ? result : 1 - result;
}

function pct(rate) {
  if (rate == null) return 'n/a';
  return `${(rate * 100).toFixed(1)}%`;
}

function fmtDelta(pp) {
  const sign = pp > 0 ? '+' : '';
  return `${sign}${pp.toFixed(1)}pp`;
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--baseline' && argv[i + 1]) args.baseline = argv[++i];
    else if (argv[i] === '--candidate' && argv[i + 1]) args.candidate = argv[++i];
    else if (argv[i] === '--thresholds' && argv[i + 1]) args.thresholds = argv[++i];
    else if (argv[i] === '--output' && argv[i + 1]) args.output = argv[++i];
  }
  return args;
}

function loadJson(filePath) {
  if (!existsSync(filePath)) {
    process.stderr.write(`[diff-baseline] File not found: ${filePath}\n`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.baseline || !args.candidate) {
    process.stderr.write('Usage: diff-baseline.js --baseline <a.json> --candidate <b.json>\n');
    process.exit(1);
  }

  const baseline = loadJson(args.baseline);
  const candidate = loadJson(args.candidate);

  let thresholds = DEFAULT_THRESHOLDS;
  if (args.thresholds) {
    thresholds = { ...DEFAULT_THRESHOLDS, ...loadJson(args.thresholds) };
  } else {
    // Try default location
    const defaultThresholds = 'baselines/thresholds.json';
    if (existsSync(defaultThresholds)) {
      thresholds = { ...DEFAULT_THRESHOLDS, ...loadJson(defaultThresholds) };
    }
  }

  const result = diffMetrics(baseline, candidate, thresholds);
  const report = renderMarkdown(result, baseline, candidate);

  if (args.output) {
    writeFileSync(args.output, report, 'utf8');
  } else {
    process.stdout.write(report + '\n');
  }

  if (result.hashMismatch) process.exit(1);
  if (!result.ok) process.exit(2);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('diff-baseline.js')) {
  main();
}
