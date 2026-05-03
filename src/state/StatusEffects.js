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
    okradziony: 0,
    brak_reszty: false,
    targowanie_sie: false,
    parcie_na_szklo: false,
    blokada_parkingowa: false,
    lichwa: false,
    hart_ducha: false,
    influencer_aura: false,
    ochrona_wizerunku: false,
    drugi_oddech: false,
    wiecznie_glodny: false,
    kontrola_stempla: false,
    gaz_do_dechy: 0,
    napor_wody: 0,
    kolejka_do_toalety: 0,
    zmiana_pogody: false,
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
