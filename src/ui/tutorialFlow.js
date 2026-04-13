/** @typedef {'fight' | 'event' | 'shop' | 'campfire' | 'elite'} TutorialMapNodeType */

export const TUTORIAL_DONE_KEY = 'stc_tutorial_done';

/** @returns {import('../data/cards.js').StatusDef} */
export function tutorialPlayerStatus() {
  return {
    strength: 1,
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

/** @type {Array<{ action: string, selectors: string[], text: string, requiredCardId?: string, noDim?: boolean, btnText?: string, dynamicText?: string }>} */
export const tutorialSteps = [
  {
    action: 'ack',
    selectors: ['#e-intent'],
    text: 'Widzisz tego cepra? Ta ikonka nad jego głową znaczy, że zaraz wejdzie Ci w szkodę. Zawsze patrz, co kombinują, zanim cokolwiek zagrasz!',
  },
  {
    action: 'ack',
    selectors: ['#p-hp-line', '.energy'],
    text: 'Ten pasek to Twoja Krzepa. Jak spadnie do zera, to koniec zabawy. Obok masz Oscypki - to Twoja energia. Każda karta kosztuje, więc nie przeżryj wszystkiego na raz!',
  },
  {
    action: 'play_card',
    requiredCardId: 'goralska_obrona',
    selectors: ['.hand .card[data-card-id="goralska_obrona"]'],
    text: "Ceper chce Cię uderzyć, więc musisz chronić swoją Krzepę. Zagraj 'Góralską Obronę', żeby zyskać Gardę. Garda przyjmie cios na siebie!",
  },
  {
    action: 'play_card',
    requiredCardId: 'ciupaga',
    selectors: ['#p-statuses', '.hand .card[data-card-id="ciupaga"]'],
    text: "Widzisz tę ikonkę pod Krzepą? To Siła - to tylko jeden z wielu statusów w grze. Jedne Ci pomogą, inne mocno zepsują dzień. Siła sprawia, że Twój 'Cios Ciupagą' boli mocniej. No już, przetestuj to na tym turuście!",
  },
  {
    action: 'ack',
    selectors: ['.relics-wrap'],
    text: 'Widzisz te pierdoły na górze? To Pamiątki z Krupówek. Dają Ci bonusy, o których nie musisz pamiętać - działają same. Im więcej ich masz, tym trudniej Cię ubić.',
  },
  {
    action: 'end_turn',
    selectors: ['#end-turn-btn'],
    text: 'Jak skończysz ruch, kliknij tutaj. Twoja Garda zniknie na początku następnej tury (chyba że masz specjalną pamiątkę), a ceper spróbuje Ci oddać.',
  },
  {
    action: 'claim_relic',
    noDim: true,
    selectors: ['#claim-relic-btn'],
    text: 'Zwycięstwo! Za każdego ubitego cepra dostaniesz fanty. To jest Pamiątka – bierz ją, bo daje bonusy na stałe. Kliknij w nią, nie bój się, nie pogryzie!',
  },
  {
    action: 'pick_card',
    noDim: true,
    selectors: ['#reward-cards'],
    text: 'Teraz najważniejsze: musisz wybrać nową kartę do talii. Nie bierz byle czego! Buduj talię tak, żebyś miał czym bić i czym się zasłaniać. Wybierz jedną z tych trzech.',
  },
  {
    action: 'ack',
    noDim: true,
    selectors: ['#map-levels'],
    dynamicText: 'map_explain',
    text: '',
  },
  {
    action: 'conclude',
    noDim: true,
    selectors: [],
    text: 'No i co? Wytłumaczyłem Ci wszystko jak krowie na miedzy. Chcesz, żebym powtórzył, czy jedziemy z tym koksem? Tylko pamiętej: po Krupówkach nie idzie się sprintem. Trza być cierpliwym, bo Cię te cepry zadeptają!',
  },
  {
    action: 'ack',
    btnText: 'Rozumiem, hej!',
    selectors: [],
    dynamicText: 'finale_text',
    text: '',
  },
];

/**
 * @param {(type: string) => {emoji: string}} getMapNodeMeta
 * @returns {string}
 */
export function buildTutorialMapExplanationText(getMapNodeMeta) {
  const icon = (type) => getMapNodeMeta(type).emoji;
  return [
    'To Twoje Krupówki w pigułce. Każdy znaczek to inna przygoda:',
    `- ${icon('fight')} Bitka: Zwykły ceper do nauki kultury.`,
    `- ${icon('elite')} Elita: Mocniejszy zawodnik, ale i łup bogatszy.`,
    `- ${icon('event')} Wydarzenie: Tu się może zdarzyć wszystko, od darmowej pajdy chleba po kradzież portfela.`,
    `- ${icon('campfire')} Watra: Tu odpoczniesz i podreperujesz Krzepę.`,
    `- ${icon('shop')} Jarmark: Tu wydasz Dutki na nowe pamiątki i karty.`,
  ].join('\n');
}

/**
 * @param {(type: string) => {emoji: string}} getMapNodeMeta
 * @returns {string}
 */
export function buildTutorialFinaleText(getMapNodeMeta) {
  const bossIcon = getMapNodeMeta('boss').emoji;
  return `I tak ma być! No, leć uczyć ich kultury! Ino uwazuj na końcu... tam się czai zajwiększa zmora całych Krupówek ${bossIcon}... trza być silnym coby go ubić!`;
}

/**
 * @param {TutorialMapNodeType[]} sequence
 * @param {(type: TutorialMapNodeType) => {label: string, emoji: string}} getMapNodeMeta
 * @returns {(Array<(null | {x: number, y: number, type: TutorialMapNodeType, label: string, emoji: string, weather: 'clear', connections: number[], eventOutcome?: 'neutral'})>)}
 */
export function createTutorialMiniMap(sequence, getMapNodeMeta) {
  return sequence.map((type, y) => {
    const row = [null, null, null];
    const meta = getMapNodeMeta(type);
    const node = {
      x: 1,
      y,
      type,
      label: meta.label,
      emoji: meta.emoji,
      weather: 'clear',
      connections: y < sequence.length - 1 ? [1] : [],
    };
    if (type === 'event') {
      node.eventOutcome = 'neutral';
    }
    row[1] = node;
    return row;
  });
}
