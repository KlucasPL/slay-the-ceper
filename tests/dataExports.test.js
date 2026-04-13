import { describe, it, expect } from 'vitest';
import { characters } from '../src/data/characters.js';
import { releaseNotesData } from '../src/data/releaseNotes.js';

describe('data exports', () => {
  it('characters export defines playable Jędrek with required combat stats', () => {
    expect(characters).toHaveProperty('jedrek');

    const jedrek = characters.jedrek;
    expect(jedrek.name).toBeTruthy();
    expect(jedrek.hp).toBeGreaterThan(0);
    expect(jedrek.maxHp).toBeGreaterThanOrEqual(jedrek.hp);
    expect(jedrek.energy).toBeGreaterThan(0);
    expect(jedrek.maxEnergy).toBeGreaterThanOrEqual(jedrek.energy);
  });

  it('release notes list is non-empty and newest entry is v1.2.4', () => {
    expect(Array.isArray(releaseNotesData)).toBe(true);
    expect(releaseNotesData.length).toBeGreaterThan(0);

    const newest = releaseNotesData[0];
    expect(newest.version).toContain('v1.2.4');
    expect(newest.date).toBeTruthy();
    expect(newest.changes.length).toBeGreaterThanOrEqual(1);
  });

  it('every release note has required fields and at least one change', () => {
    for (const entry of releaseNotesData) {
      expect(typeof entry.version).toBe('string');
      expect(entry.version.length).toBeGreaterThan(0);
      expect(typeof entry.date).toBe('string');
      expect(entry.date.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.changes)).toBe(true);
      expect(entry.changes.length).toBeGreaterThan(0);
      for (const change of entry.changes) {
        expect(typeof change).toBe('string');
        expect(change.length).toBeGreaterThan(0);
      }
    }
  });
});
