import { afterEach, describe, expect, it } from 'vitest';
import { detectPreferredLanguage, getLanguage, setLanguage } from '../../src/logic/settings.js';

/**
 * @returns {{ getItem: (key: string) => string | null, setItem: (key: string, value: string) => void, clear: () => void }}
 */
function createMemoryStorage() {
  /** @type {Map<string, string>} */
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    clear() {
      store.clear();
    },
  };
}

afterEach(() => {
  // Restore defaults between tests.
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'navigator', {
    value: { language: 'en-US', languages: ['en-US'] },
    configurable: true,
    writable: true,
  });
});

describe('language settings', () => {
  it('shouldDetectPolishWhenAnyNavigatorLanguageStartsWithPl', () => {
    expect(detectPreferredLanguage({ language: 'en-US', languages: ['en-US', 'pl-PL'] })).toBe(
      'pl'
    );
  });

  it('shouldDetectEnglishWhenNoNavigatorLanguageStartsWithPl', () => {
    expect(detectPreferredLanguage({ language: 'en-US', languages: ['en-US', 'de-DE'] })).toBe(
      'en'
    );
  });

  it('shouldPersistAndReadExplicitLanguageChoice', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'pl-PL', languages: ['pl-PL'] },
      configurable: true,
      writable: true,
    });

    setLanguage('en');

    expect(getLanguage()).toBe('en');
  });

  it('shouldFallbackToBrowserDetectionWhenNoStoredLanguage', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: 'pl-PL', languages: ['pl-PL'] },
      configurable: true,
      writable: true,
    });

    expect(getLanguage()).toBe('pl');
  });
});
