/* global document */
/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderStatuses } from '../src/ui/renderers/StatusRenderer.js';

/** @returns {import('../src/data/cards.js').StatusDef} */
function emptyStatus() {
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

describe('StatusRenderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="p-statuses"></div><div id="e-statuses"></div>';
  });

  it('renders active power chips for new player power flags with card emoji and tooltip', () => {
    const uiManager = {
      state: {
        player: {
          pan_na_wlosciach: true,
          zimna_krew: true,
          weather_fog_garda: true,
          weather_frozen_vulnerable: true,
          czas_na_fajke: true,
          goralska_goscinnosc: true,
          koncesja_na_oscypki: true,
        },
        getEnemySpecialStatuses: () => [],
      },
      _closeStatusTooltips() {},
    };

    renderStatuses(uiManager, 'p-statuses', emptyStatus());

    const chips = Array.from(document.querySelectorAll('#p-statuses .status-tag'));
    expect(chips.length).toBe(7);

    const chipTexts = chips.map((chip) => chip.textContent ?? '');
    expect(chipTexts.some((text) => text.includes('🗺️'))).toBe(true);
    expect(chipTexts.some((text) => text.includes('🧊'))).toBe(true);
    expect(chipTexts.some((text) => text.includes('🏰'))).toBe(true);
    expect(chipTexts.some((text) => text.includes('🥶'))).toBe(true);
    expect(chipTexts.some((text) => text.includes('🚬'))).toBe(true);
    expect(chipTexts.some((text) => text.includes('🏡'))).toBe(true);
    expect(chipTexts.some((text) => text.includes('🧾'))).toBe(true);

    const ariaLabels = chips.map((chip) => chip.getAttribute('aria-label') ?? '');
    expect(ariaLabels.some((label) => label.includes('Znajomość Szlaku'))).toBe(true);
    expect(ariaLabels.some((label) => label.includes('Kąpiel w Białce'))).toBe(true);
    expect(ariaLabels.some((label) => label.includes('Pan na Włościach'))).toBe(true);
    expect(ariaLabels.some((label) => label.includes('Zimna Krew'))).toBe(true);
    expect(ariaLabels.some((label) => label.includes('Czas na Fajkę'))).toBe(true);
    expect(ariaLabels.some((label) => label.includes('Góralska Gościnność'))).toBe(true);
    expect(ariaLabels.some((label) => label.includes('Koncesja na Oscypki'))).toBe(true);
  });
});
