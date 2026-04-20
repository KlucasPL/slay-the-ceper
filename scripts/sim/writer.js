/**
 * JSONL writer with per-verbosity field filtering and optional gzip compression.
 *
 * - off:     envelope fields only (~1-2 KB/game)
 * - summary: adds battles[], S-tier entityEvents[], counterRollups (~6 KB/game)
 * - full:    all fields including agentTrace[] (~180 KB/game)
 *
 * Atomic writes: data goes to <path>.tmp, renamed to <path> on close().
 */

import { createWriteStream, renameSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { createGzip } from 'node:zlib';
import { dirname } from 'node:path';

// ---------------------------------------------------------------------------
// S-tier event kinds — included in 'summary' and 'full'
// ---------------------------------------------------------------------------

const S_TIER_KINDS = new Set([
  'run_started',
  'run_ended',
  'map_generated',
  'node_entered',
  'weather_entered',
  'battle_started',
  'battle_ended',
  'phase_transition',
  'card_played',
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

// ---------------------------------------------------------------------------
// Envelope-only fields (present at every verbosity tier)
// ---------------------------------------------------------------------------

const ENVELOPE_FIELDS = [
  'schemaVersion',
  'batch',
  'gitSha',
  'configHash',
  'poolOverridesHash',
  'cell',
  'pairKey',
  'world',
  'pairStatus',
  'seed',
  'agent',
  'agentParams',
  'character',
  'difficulty',
  'poolOverrides',
  'outcome',
  'floorReached',
  'turnsPlayed',
  'totalDutkiEarned',
  'hpAtDeath',
  'maxHpAtDeath',
  'survivalScore',
  'killerEnemyId',
  'killerName',
  'finalDeck',
  'finalRelics',
  'finalBoons',
  'durationMs',
  'errorStack',
];

// ---------------------------------------------------------------------------
// Per-verbosity record filtering
// ---------------------------------------------------------------------------

/**
 * @param {Record<string, unknown>} record
 * @param {'off'|'summary'|'full'} verbosity
 * @returns {Record<string, unknown>}
 */
function filterRecord(record, verbosity) {
  if (verbosity === 'full') return record;

  const out = /** @type {Record<string, unknown>} */ ({});
  for (const field of ENVELOPE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      out[field] = record[field];
    }
  }

  if (verbosity === 'off') return out;

  // summary: add battles[], S-tier-filtered entityEvents[], counterRollups
  if (Array.isArray(record.battles)) {
    out.battles = record.battles;
  }
  if (Array.isArray(record.entityEvents)) {
    out.entityEvents = record.entityEvents.filter((ev) => ev != null && S_TIER_KINDS.has(ev.kind));
  }
  if (Object.prototype.hasOwnProperty.call(record, 'counterRollups')) {
    out.counterRollups = record.counterRollups;
  }

  return out;
}

// ---------------------------------------------------------------------------
// Writer factory
// ---------------------------------------------------------------------------

/**
 * @typedef {'off'|'summary'|'full'} Verbosity
 *
 * @typedef {{
 *   path: string,
 *   compress?: boolean,
 *   verbosity?: Verbosity,
 * }} JsonlWriterOptions
 *
 * @typedef {{
 *   write: (record: Record<string, unknown>) => void,
 *   close: () => Promise<void>,
 * }} JsonlWriter
 */

/**
 * Open a streaming JSONL writer.
 *
 * Writes to `<path>.tmp`, atomically renames to `<path>` on close().
 * If `compress` is true, pipes through gzip (use `.jsonl.gz` extension).
 *
 * @param {JsonlWriterOptions} opts
 * @returns {JsonlWriter}
 */
export function openJsonlWriter({ path, compress = false, verbosity = 'summary' }) {
  const tmpPath = `${path}.tmp`;

  // Ensure output directory exists
  mkdirSync(dirname(path), { recursive: true });

  // Remove stale .tmp from a previous crashed run
  if (existsSync(tmpPath)) {
    unlinkSync(tmpPath);
  }

  const fileStream = createWriteStream(tmpPath);

  /** @type {import('node:stream').Writable} */
  let sink;
  if (compress) {
    const gzip = createGzip();
    gzip.pipe(fileStream);
    sink = gzip;
  } else {
    sink = fileStream;
  }

  let closed = false;

  function write(record) {
    if (closed) throw new Error('JsonlWriter: write after close');
    const line = JSON.stringify(filterRecord(record, verbosity)) + '\n';
    sink.write(compress ? Buffer.from(line, 'utf8') : line);
  }

  function close() {
    if (closed) return Promise.resolve();
    closed = true;

    return new Promise((resolve, reject) => {
      sink.end((/** @type {Error|null} */ err) => {
        if (err) return reject(err);

        const finish = () => {
          try {
            renameSync(tmpPath, path);
            resolve();
          } catch (renameErr) {
            reject(renameErr);
          }
        };

        // When compressing, the fileStream finishes after the gzip stream ends
        if (compress) {
          if (fileStream.writableFinished) {
            finish();
          } else {
            fileStream.once('finish', finish);
            fileStream.once('error', reject);
          }
        } else {
          finish();
        }
      });
    });
  }

  return { write, close };
}

// Keep legacy createWriter export for any existing callers
export { openJsonlWriter as createWriter };

/**
 * Write a single record to stdout as JSONL (useful for piping / testing).
 * @param {Record<string, unknown>} record
 * @param {Verbosity} verbosity
 */
export function writeToStdout(record, verbosity = 'summary') {
  process.stdout.write(JSON.stringify(filterRecord(record, verbosity)) + '\n');
}
