/** @type {string} localStorage key for the skip-intro preference. */
const SKIP_INTRO_KEY = 'stc_skip_intro';
/** @type {string} localStorage key for the menu music preference. */
const MENU_MUSIC_KEY = 'slay-the-ceper:menu-music';
/** @type {string} localStorage key for the in-game music preference. */
const GAME_MUSIC_KEY = 'slay-the-ceper:game-music';
/** @type {string} localStorage key for analytics preference. */
const ANALYTICS_ENABLED_KEY = 'slay-the-ceper:analytics-enabled';
/** @type {string} localStorage key for language preference. */
const LANGUAGE_KEY = 'slay-the-ceper:language';
/** @type {string} localStorage key for global text size preference. */
const TEXT_SIZE_KEY = 'slay-the-ceper:text-size';
/** @type {string} localStorage key for text-size schema version. */
const TEXT_SIZE_SCHEMA_KEY = 'slay-the-ceper:text-size-schema';
/** @type {string} current text-size schema version. */
const TEXT_SIZE_SCHEMA_VERSION = '2';

/** @typedef {'normal' | 'large' | 'xlarge'} TextSizePreset */
/** @typedef {'pl' | 'en'} LanguageCode */

/** @type {Readonly<Record<TextSizePreset, number>>} */
const TEXT_SIZE_SCALE = {
  // New baseline: previous "large" is now the default readable size.
  normal: 1.15,
  large: 1.3,
  xlarge: 1.45,
};

/**
 * Generic localStorage boolean reader with fallback.
 * @param {string} key
 * @param {boolean} fallback
 * @returns {boolean}
 */
function readBool(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

/**
 * Generic localStorage boolean writer. Ignores write failures.
 * @param {string} key
 * @param {boolean} value
 */
function writeBool(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore — localStorage may be blocked by browser privacy settings.
  }
}

/**
 * Returns whether the provided value is a supported UI language code.
 * @param {unknown} value
 * @returns {value is LanguageCode}
 */
function isSupportedLanguage(value) {
  return value === 'pl' || value === 'en';
}

/**
 * Detects preferred language from browser navigator data.
 * Rule: if any language starts with `pl`, prefer Polish, otherwise English.
 * @param {{ language?: string, languages?: string[] } | undefined} navigatorLike
 * @returns {LanguageCode}
 */
export function detectPreferredLanguage(navigatorLike = globalThis.navigator) {
  const candidates = [];

  if (navigatorLike?.language) {
    candidates.push(navigatorLike.language);
  }
  if (Array.isArray(navigatorLike?.languages)) {
    candidates.push(...navigatorLike.languages);
  }

  const hasPolish = candidates.some(
    (lang) => typeof lang === 'string' && lang.toLowerCase().startsWith('pl')
  );
  return hasPolish ? 'pl' : 'en';
}

/**
 * Returns currently selected language.
 * Priority: explicit user preference (localStorage) -> browser detection.
 * @returns {LanguageCode}
 */
export function getLanguage() {
  try {
    const raw = localStorage.getItem(LANGUAGE_KEY);
    if (isSupportedLanguage(raw)) return raw;
  } catch {
    // Ignore — localStorage may be blocked by browser privacy settings.
  }
  return detectPreferredLanguage();
}

/**
 * Persists selected language.
 * Invalid values are ignored to keep storage clean.
 * @param {LanguageCode} value
 */
export function setLanguage(value) {
  if (!isSupportedLanguage(value)) return;
  try {
    localStorage.setItem(LANGUAGE_KEY, value);
  } catch {
    // Ignore — localStorage may be blocked by browser privacy settings.
  }
}

/**
 * Returns whether the intro cinematic should be skipped on startup.
 * Defaults to `false` (intro plays by default).
 * Falls back to `false` when localStorage is unavailable (strict privacy mode).
 * @returns {boolean}
 */
export function getSkipIntro() {
  return readBool(SKIP_INTRO_KEY, false);
}

/**
 * Persists the skip-intro preference to localStorage.
 * Silently ignores write failures (e.g. strict privacy mode).
 * @param {boolean} value
 */
export function setSkipIntro(value) {
  writeBool(SKIP_INTRO_KEY, value);
}

/**
 * Returns whether menu music is enabled. Defaults to `true`.
 * @returns {boolean}
 */
export function getMenuMusicEnabled() {
  return readBool(MENU_MUSIC_KEY, true);
}

/**
 * Persists the menu music enabled preference.
 * @param {boolean} value
 */
export function setMenuMusicEnabled(value) {
  writeBool(MENU_MUSIC_KEY, value);
}

/**
 * Returns whether in-game music is enabled. Defaults to `true`.
 * @returns {boolean}
 */
export function getGameMusicEnabled() {
  return readBool(GAME_MUSIC_KEY, true);
}

/**
 * Persists the in-game music enabled preference.
 * @param {boolean} value
 */
export function setGameMusicEnabled(value) {
  writeBool(GAME_MUSIC_KEY, value);
}

/**
 * Returns whether analytics tracking is enabled. Defaults to `true`.
 * @returns {boolean}
 */
export function getAnalyticsEnabled() {
  return readBool(ANALYTICS_ENABLED_KEY, true);
}

/**
 * Persists the analytics enabled preference.
 * @param {boolean} value
 */
export function setAnalyticsEnabled(value) {
  writeBool(ANALYTICS_ENABLED_KEY, value);
}

/**
 * Reads and validates the persisted global text-size preset.
 * Defaults to `normal` when storage is unavailable or value is invalid.
 * @returns {TextSizePreset}
 */
export function getTextSizePreset() {
  try {
    const schema = localStorage.getItem(TEXT_SIZE_SCHEMA_KEY);
    const raw = localStorage.getItem(TEXT_SIZE_KEY);

    if (schema === TEXT_SIZE_SCHEMA_VERSION) {
      if (raw === 'normal' || raw === 'large' || raw === 'xlarge') return raw;
      return 'normal';
    }

    // One-time migration for presets saved before the scale shift.
    const migrated = raw === 'xlarge' ? 'large' : 'normal';
    localStorage.setItem(TEXT_SIZE_KEY, migrated);
    localStorage.setItem(TEXT_SIZE_SCHEMA_KEY, TEXT_SIZE_SCHEMA_VERSION);
    return migrated;
  } catch {
    return 'normal';
  }
}

/**
 * Persists global text-size preset.
 * @param {TextSizePreset} value
 */
export function setTextSizePreset(value) {
  try {
    localStorage.setItem(TEXT_SIZE_KEY, value);
    localStorage.setItem(TEXT_SIZE_SCHEMA_KEY, TEXT_SIZE_SCHEMA_VERSION);
  } catch {
    // Ignore — localStorage may be blocked by browser privacy settings.
  }
}

/**
 * Returns numeric scale factor for a text-size preset.
 * @param {TextSizePreset} preset
 * @returns {number}
 */
export function getTextSizeScale(preset) {
  return TEXT_SIZE_SCALE[preset] ?? TEXT_SIZE_SCALE.normal;
}
