import { describe, it, expect } from 'vitest';
import { characters } from '../src/data/characters.js';
import { marynaBoonLibrary } from '../src/data/marynaBoons.js';
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

  it('release notes list is non-empty and newest entry has the highest semantic version', () => {
    expect(Array.isArray(releaseNotesData)).toBe(true);
    expect(releaseNotesData.length).toBeGreaterThan(0);

    const newest = releaseNotesData[0];
    const extractVersion = (value) => {
      const match = value.match(/v(\d+)\.(\d+)\.(\d+)/i);
      return match ? match.slice(1).map(Number) : null;
    };

    const newestVersion = extractVersion(newest.version);
    expect(newestVersion).not.toBeNull();

    const allVersions = releaseNotesData
      .map((entry) => extractVersion(entry.version))
      .filter(Boolean);

    const sortedVersions = [...allVersions].sort((left, right) => {
      if (left[0] !== right[0]) return right[0] - left[0];
      if (left[1] !== right[1]) return right[1] - left[1];
      return right[2] - left[2];
    });

    expect(newestVersion).toEqual(sortedVersions[0]);
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

  it('Maryna boon descriptions match current rebalance values', () => {
    expect(marynaBoonLibrary.kiesa.effectDesc).toContain('+100 Dutków od razu');
    expect(marynaBoonLibrary.przeglad_plecaka.effectDesc).toContain('+80 Dutków');
    expect(marynaBoonLibrary.zloty_rozaniec.effectDesc).toContain('+5 Garda');
  });
});
