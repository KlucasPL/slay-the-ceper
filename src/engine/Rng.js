/**
 * @typedef {(() => number) & { getState: () => number, setState: (s: number) => void }} RngFn
 */

/**
 * Mulberry32 PRNG — 32-bit, single 4-byte state, passes BigCrush.
 * The returned function has getState()/setState() for snapshot/restore.
 * @param {number} seed - 32-bit unsigned integer
 * @returns {RngFn}
 */
export function mulberry32(seed) {
  let s = seed >>> 0;
  const rng = /** @type {RngFn} */ (
    function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    }
  );
  rng.getState = () => s;
  rng.setState = (newS) => {
    s = newS >>> 0;
  };
  return rng;
}

/**
 * Parse a hex seed string or number into a 32-bit unsigned integer.
 * @param {string | number} hex
 * @returns {number}
 */
export function parseSeed(hex) {
  if (typeof hex === 'number') return hex >>> 0;
  const n = parseInt(hex, 16);
  if (isNaN(n)) throw new Error(`Invalid seed: ${hex}`);
  return n >>> 0;
}

/**
 * Run fn with Math.random replaced by mulberry32(seed). Restores Math.random
 * even if fn throws. Returns fn's return value.
 * @template T
 * @param {string | number} seed - hex string or number
 * @param {(rng: RngFn) => T} fn
 * @returns {T}
 */
export function withSeededRng(seed, fn) {
  const rng = mulberry32(parseSeed(seed));
  const original = Math.random;
  Math.random = rng;
  try {
    return fn(rng);
  } finally {
    Math.random = original;
  }
}
