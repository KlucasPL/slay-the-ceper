/** @type {string} localStorage key for the skip-intro preference. */
const SKIP_INTRO_KEY = 'stc_skip_intro';
/** @type {string} localStorage key for the menu music preference. */
const MENU_MUSIC_KEY = 'slay-the-ceper:menu-music';
/** @type {string} localStorage key for the in-game music preference. */
const GAME_MUSIC_KEY = 'slay-the-ceper:game-music';

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
