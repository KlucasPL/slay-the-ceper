import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');
const SCAN_DIRS = [path.join(PROJECT_ROOT, 'src/state'), path.join(PROJECT_ROOT, 'src/data')];

const FORBIDDEN = [
  'Math.random()',
  'Date.now',
  'performance.now',
  'crypto.getRandomValues',
  'setTimeout',
  'setInterval',
];

/** @returns {{ file: string, line: number, match: string }[]} */
function scanDirectory(dir) {
  const violations = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      violations.push(...scanDirectory(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('nondeterminism-ok')) continue;
        for (const forbidden of FORBIDDEN) {
          if (lines[i].includes(forbidden)) {
            violations.push({ file: fullPath, line: i + 1, match: forbidden });
          }
        }
      }
    }
  }
  return violations;
}

describe('nondeterminism-sources scanner', () => {
  it('shouldFindNoForbiddenCallsInStateAndDataLayers', () => {
    // given
    const allViolations = SCAN_DIRS.flatMap(scanDirectory);

    // then
    if (allViolations.length > 0) {
      const report = allViolations.map((v) => `  ${v.file}:${v.line} — "${v.match}"`).join('\n');
      expect.fail(
        `Found ${allViolations.length} non-determinism source(s) in src/state/ or src/data/:\n${report}`
      );
    }

    expect(allViolations).toHaveLength(0);
  });
});
