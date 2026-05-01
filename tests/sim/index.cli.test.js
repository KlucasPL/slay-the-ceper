import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '../../scripts/sim/index.js');

// A minimal batch config file that writes to stdout (no output.path).
const BATCH_PATH = join(tmpdir(), `cli-test-batch-${process.pid}.mjs`);

beforeAll(() => {
  writeFileSync(
    BATCH_PATH,
    `import { RandomBot } from ${JSON.stringify(join(__dirname, '../../src/logic/bots/RandomBot.js'))};
export default {
  schemaVersion: 2,
  name: 'cli-smoke',
  character: 'jedrek',
  agent: RandomBot,
  agentName: 'random',
  games: 1,
  seedStart: 42,
  difficulty: 'normal',
  verbosity: 'summary',
};
`,
    'utf8'
  );
});

afterAll(() => {
  if (existsSync(BATCH_PATH)) unlinkSync(BATCH_PATH);
});

/** Spawn the CLI with given extra args and return { status, stdout, stderr }. */
function spawnCli(extraArgs = []) {
  return spawnSync(process.execPath, [CLI, '--batch', BATCH_PATH, ...extraArgs], {
    encoding: 'utf8',
    timeout: 30_000,
  });
}

describe('index.js CLI smoke', () => {
  it('shouldExitZeroForOneGame', () => {
    // given / when
    const { status } = spawnCli(['--games', '1', '--workers', '1']);

    // then
    expect(status).toBe(0);
  });

  it('shouldWriteOneJsonlLinePerGameToStdout', () => {
    // given / when
    const { status, stdout } = spawnCli(['--games', '2', '--workers', '1']);

    // then
    expect(status).toBe(0);
    const lines = stdout.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      const rec = JSON.parse(line);
      expect(['player_win', 'enemy_win']).toContain(rec.outcome);
      expect(rec.schemaVersion).toBe(2);
    }
  });

  it('shouldEmitSimBannerToStderr', () => {
    // given / when
    const { status, stderr } = spawnCli(['--games', '1', '--workers', '1']);

    // then
    expect(status).toBe(0);
    expect(stderr).toMatch(/\[sim\]/);
  });

  it('shouldOmitBattlesFieldAtVerbosityOff', () => {
    // given / when
    const { status, stdout } = spawnCli(['--games', '1', '--workers', '1', '--verbosity', 'off']);

    // then
    expect(status).toBe(0);
    const lines = stdout.trim().split('\n').filter(Boolean);
    expect(lines.length).toBeGreaterThan(0);
    const rec = JSON.parse(lines[0]);
    expect(rec.battles).toBeUndefined();
    expect(rec.outcome).toBeDefined();
  });

  it('shouldOutputValidEnvelopeFieldsAtVerbositySummary', () => {
    // given / when
    const { status, stdout } = spawnCli([
      '--games',
      '1',
      '--workers',
      '1',
      '--verbosity',
      'summary',
    ]);

    // then
    expect(status).toBe(0);
    const lines = stdout.trim().split('\n').filter(Boolean);
    expect(lines.length).toBeGreaterThan(0);
    const rec = JSON.parse(lines[0]);
    // Envelope fields always present at every verbosity
    expect(rec.schemaVersion).toBe(2);
    expect(['player_win', 'enemy_win']).toContain(rec.outcome);
    expect(typeof rec.floorReached).toBe('number');
  });

  it('shouldExitNonZeroForMalformedPairedFlag', () => {
    // given / when — no colon in --paired value
    const { status } = spawnCli(['--games', '1', '--workers', '1', '--paired', 'nocolon']);

    // then
    expect(status).not.toBe(0);
  });

  it('shouldExpandPairedRunsIntoAAndBWorlds', () => {
    // given / when — --paired relic:pas_bacowski should produce 2 records per seed
    const { status, stdout } = spawnCli([
      '--games',
      '2',
      '--workers',
      '1',
      '--paired',
      'relic:pas_bacowski',
    ]);

    // then
    expect(status).toBe(0);
    const lines = stdout.trim().split('\n').filter(Boolean);
    // 2 seeds × 2 worlds (A, B) = 4 records
    expect(lines).toHaveLength(4);
    const worlds = lines.map((l) => JSON.parse(l).world).sort();
    expect(worlds).toEqual(['A', 'A', 'B', 'B']);
    for (const line of lines) {
      const rec = JSON.parse(line);
      expect(rec.pairKey).toMatch(/^relic:pas_bacowski:/);
      expect(rec.pairStatus).toBe('ok');
    }
  });

  it('shouldEmitSurvivalScoreAndHpAtDeathFields', () => {
    // given / when
    const { status, stdout } = spawnCli(['--games', '1', '--workers', '1']);

    // then
    expect(status).toBe(0);
    const rec = JSON.parse(stdout.trim().split('\n')[0]);
    expect(typeof rec.hpAtDeath).toBe('number');
    expect(typeof rec.maxHpAtDeath).toBe('number');
    expect(rec.maxHpAtDeath).toBeGreaterThan(0);
    expect(typeof rec.survivalScore).toBe('number');
    // survival score is floor + hpAtDeath/maxHp, so within [floor, floor+1]
    expect(rec.survivalScore).toBeGreaterThanOrEqual(rec.floorReached);
    expect(rec.survivalScore).toBeLessThanOrEqual(rec.floorReached + 1);
  });
});
