import { describe, it, expect } from 'vitest';
import { characters } from '../src/data/characters.js';
import { cardLibrary } from '../src/data/cards.js';
import { enemyLibrary } from '../src/data/enemies.js';
import { relicLibrary } from '../src/data/relics.js';
import { marynaBoonLibrary } from '../src/data/marynaBoons.js';
import { eventLibrary } from '../src/data/events.js';
import { weatherLibrary } from '../src/data/weather.js';
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

  it('shouldHaveMatchingKeyAndIdForEveryCardInCardLibrary', () => {
    // given
    const entries = Object.entries(cardLibrary);
    expect(entries.length).toBeGreaterThan(0);

    // then
    for (const [key, card] of entries) {
      expect(card.id, `cardLibrary key "${key}" must equal card.id`).toBe(key);
    }
  });

  it('shouldHaveMatchingKeyAndIdForEveryEnemyInEnemyLibrary', () => {
    // given
    const entries = Object.entries(enemyLibrary);
    expect(entries.length).toBeGreaterThan(0);

    // then
    for (const [key, enemy] of entries) {
      expect(enemy.id, `enemyLibrary key "${key}" must equal enemy.id`).toBe(key);
    }
  });

  it('shouldHaveMatchingKeyAndIdForEveryRelicInRelicLibrary', () => {
    // given
    const entries = Object.entries(relicLibrary);
    expect(entries.length).toBeGreaterThan(0);

    // then
    for (const [key, relic] of entries) {
      expect(relic.id, `relicLibrary key "${key}" must equal relic.id`).toBe(key);
    }
  });

  it('shouldHaveMatchingKeyAndIdForEveryBoonInMarynaBoonLibrary', () => {
    // given
    const entries = Object.entries(marynaBoonLibrary);
    expect(entries.length).toBeGreaterThan(0);

    // then
    for (const [key, boon] of entries) {
      expect(boon.id, `marynaBoonLibrary key "${key}" must equal boon.id`).toBe(key);
    }
  });

  it('shouldHaveMatchingKeyAndIdForEveryEventInEventLibrary', () => {
    // given
    const entries = Object.entries(eventLibrary);
    expect(entries.length).toBeGreaterThan(0);

    // then
    for (const [key, event] of entries) {
      expect(event.id, `eventLibrary key "${key}" must equal event.id`).toBe(key);
    }
  });

  it('shouldResolveHumanReadableNameForEveryEventInEventLibrary', () => {
    // given — analyzer's NAME_LOOKUPS resolves event labels via `title ?? name`.
    // Entries missing both fall back to their id in the dashboard, which reads
    // as raw snake_case and hides regressions (E1 in docs/balancing-audit.md).
    const entries = Object.entries(eventLibrary);
    expect(entries.length).toBeGreaterThan(0);

    // then
    for (const [key, event] of entries) {
      const label = event.title ?? event.name;
      expect(typeof label, `eventLibrary["${key}"] must expose title or name`).toBe('string');
      expect(label.length, `eventLibrary["${key}"].title is empty`).toBeGreaterThan(0);
      expect(label, `eventLibrary["${key}"].title must differ from id "${key}"`).not.toBe(key);
    }
  });

  it('shouldHaveMatchingKeyAndIdForEveryWeatherInWeatherLibrary', () => {
    // given
    const entries = Object.entries(weatherLibrary);
    expect(entries.length).toBeGreaterThan(0);

    // then
    for (const [key, weather] of entries) {
      expect(weather.id, `weatherLibrary key "${key}" must equal weather.id`).toBe(key);
    }
  });

  it('shouldHaveMatchingKeyAndIdForEveryCharacterInCharactersLibrary', () => {
    // given
    const entries = Object.entries(characters);
    expect(entries.length).toBeGreaterThan(0);

    // then
    for (const [key, character] of entries) {
      expect(character.id, `characters key "${key}" must equal character.id`).toBe(key);
    }
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
