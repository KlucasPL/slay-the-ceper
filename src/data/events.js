/**
 * @typedef {{
 *   text: string,
 *   description: string,
 *   cost: number,
 *   effect: (state: import('../state/GameState.js').GameState) => string,
 * }} EventChoiceDef
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   image: string,
 *   fallbackFight?: { minDutki: number, enemyId: string, message: string },
 *   choices: EventChoiceDef[],
 * }} GameEventDef
 */

const fiakierEventSvg = `
<svg viewBox="0 0 220 130" width="220" height="130" aria-hidden="true">
  <rect x="16" y="84" width="112" height="26" rx="6" fill="#6b3f1e" stroke="#3b220f" stroke-width="3"/>
  <polyline points="24,90 36,84 48,90 60,84 72,90 84,84 96,90 108,84 120,90" fill="none" stroke="#e0b43a" stroke-width="2"/>
  <circle cx="42" cy="112" r="14" fill="none" stroke="#2d1a0c" stroke-width="4"/>
  <circle cx="42" cy="112" r="4" fill="#2d1a0c"/>
  <circle cx="102" cy="112" r="14" fill="none" stroke="#2d1a0c" stroke-width="4"/>
  <circle cx="102" cy="112" r="4" fill="#2d1a0c"/>
  <line x1="42" y1="112" x2="102" y2="112" stroke="#2d1a0c" stroke-width="2"/>

  <ellipse cx="162" cy="86" rx="24" ry="15" fill="#9f6f3d" stroke="#5a381e" stroke-width="3"/>
  <rect x="138" y="72" width="42" height="18" rx="7" fill="#a87743"/>
  <circle cx="176" cy="70" r="9" fill="#a87743" stroke="#5a381e" stroke-width="3"/>
  <polygon points="182,64 198,58 188,71" fill="#5a381e"/>
  <line x1="198" y1="86" x2="214" y2="82" stroke="#2d1a0c" stroke-width="3" stroke-linecap="round"/>

  <rect x="22" y="62" width="26" height="20" rx="6" fill="#31508b" stroke="#1a2d52" stroke-width="2"/>
  <circle cx="35" cy="52" r="11" fill="#e1b48e"/>
  <path d="M 26,56 Q 35,62 44,56" fill="#5a3216"/>
  <path d="M 29,40 Q 35,34 41,40 L 41,46 L 29,46 Z" fill="#1f1f1f"/>
  <line x1="48" y1="66" x2="80" y2="48" stroke="#e1b48e" stroke-width="5" stroke-linecap="round"/>
  <path d="M 80,48 Q 98,40 104,48" fill="none" stroke="#5a3216" stroke-width="2"/>
</svg>`;

/** @type {Record<string, GameEventDef>} */
export const eventLibrary = {
  fiakier_event: {
    id: 'fiakier_event',
    title: 'Wąsaty Fiakier',
    description:
      "Wielka bryczka tarasuje przejście. Fiakier w zakurzonym kapeluszu strzela z bata i patrzy na Twoją sakiewkę. 'Panocku, koń tyż głodny, a patrzynie na luksusy kosztuje!'",
    image: fiakierEventSvg,
    fallbackFight: {
      minDutki: 10,
      enemyId: 'pomocnik_fiakra',
      message:
        "Fiakier mierzy Cię wzrokiem: 'Bez dutków to se możesz po asfalcie tupać, a nie moją bryką jechać! Naucy Cie rozumu...'",
    },
    choices: [
      {
        text: 'Pogłaskaj konia (30 dutków)',
        description: 'Koń jest miły w dotyku. Chwila relaksu regeneruje siły.',
        cost: 30,
        effect(state) {
          state.healPlayer(15);
          return 'Poczułeś powiew tatrzańskiej natury. Odzyskałeś 15 Krzepy.';
        },
      },
      {
        text: 'Popatrz na konia (10 dutków)',
        description: 'Tylko rzuciłeś okiem na kopyta, ale Fiakier już wyciąga rękę po zapłatę.',
        cost: 10,
        effect() {
          return 'Fiakier mruknął coś pod nosem i schował monety. Nic się nie zmieniło.';
        },
      },
      {
        text: 'Przejażdżka bryczką (150 dutków)',
        description:
          'Wsiadasz dumnie na tył. Bryczka rusza z kopyta, omijając wszystkich turystów!',
        cost: 150,
        effect(state) {
          state.jumpToBoss = true;
          state.forceMainBossNextBattle = true;
          return 'Wiatr we włosach! Fiakier dowozi Cię pod samiuśkie stopy Białego Miśka.';
        },
      },
    ],
  },
};

export const events = eventLibrary;
