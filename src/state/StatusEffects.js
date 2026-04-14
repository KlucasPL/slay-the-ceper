/**
 * @typedef {import('../data/cards.js').StatusDef} StatusDef
 */

/** @returns {StatusDef} */
export function defaultStatus() {
  return {
    strength: 0,
    weak: 0,
    fragile: 0,
    vulnerable: 0,
    next_double: false,
    energy_next_turn: 0,
    lans: 0,
    duma_podhala: 0,
    furia_turysty: 0,
  };
}

/**
 * Ticks down duration-based status debuffs (weak, fragile) by 1 each.
 * @param {StatusDef} status
 */
export function tickStatus(status) {
  if (status.weak > 0) status.weak--;
  if (status.fragile > 0) status.fragile--;
  if (status.vulnerable > 0) status.vulnerable--;
  if (status.furia_turysty > 0) status.furia_turysty--;
}
