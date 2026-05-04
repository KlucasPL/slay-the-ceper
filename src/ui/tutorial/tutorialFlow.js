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

/** @type {Array<{ action: string, selectors: string[], text: string, textEn?: string, requiredCardId?: string, noDim?: boolean, btnText?: string, btnTextEn?: string, dynamicText?: string }>} */
export const tutorialSteps = [
  {
    action: 'ack',
    selectors: ['#e-intent'],
    text: 'Widzisz tego cepra? Ta ikonka nad jego głową znaczy, że zaraz wejdzie Ci w szkodę. Zawsze patrz, co kombinują, zanim cokolwiek zagrasz!',
    textEn:
      "See that tourist? The icon above his head means he's about to make your life difficult. Always check what they're planning before you play anything!",
  },
  {
    action: 'ack',
    selectors: ['#p-hp-line', '.energy'],
    text: 'Ten pasek to Twoja Krzepa. Jak spadnie do zera, to koniec zabawy. Obok masz Oscypki - to Twoja energia. Każda karta kosztuje, więc nie przeżryj wszystkiego na raz!',
    textEn:
      "That bar is your Krzepa (HP). If it hits zero, it's game over. Next to it you have Oscypki — your energy. Every card costs some, so don't spend it all at once!",
  },
  {
    action: 'play_card',
    requiredCardId: 'goralska_obrona',
    selectors: ['.hand .card[data-card-id="goralska_obrona"]'],
    text: "Ceper chce Cię uderzyć, więc musisz chronić swoją Krzepę. Zagraj 'Góralską Obronę', żeby zyskać Gardę. Garda przyjmie cios na siebie!",
    textEn:
      "The tourist wants to hit you, so protect your Krzepa. Play 'Góral's Defense' to gain Garda (Block). Garda will absorb the blow!",
  },
  {
    action: 'play_card',
    requiredCardId: 'ciupaga',
    selectors: ['#p-statuses', '.hand .card[data-card-id="ciupaga"]'],
    text: "Widzisz tę ikonkę pod Krzepą? To Siła - to tylko jeden z wielu statusów w grze. Jedne Ci pomogą, inne mocno zepsują dzień. Siła sprawia, że Twój 'Cios Ciupagą' boli mocniej. No już, przetestuj to na tym turuście!",
    textEn:
      "See that icon below your Krzepa? That's Strength — just one of many statuses in the game. Some will help you, others will ruin your day. Strength makes your 'Ciupaga Strike' hit harder. Go ahead, test it on this tourist!",
  },
  {
    action: 'ack',
    selectors: ['.relics-wrap'],
    text: 'Widzisz te pierdoły na górze? To Pamiątki z Krupówek. Dają Ci bonusy, o których nie musisz pamiętać - działają same. Im więcej ich masz, tym trudniej Cię ubić.',
    textEn:
      "See those trinkets up top? Those are Relics from Krupówki Street. They give you bonuses you don't need to think about — they work automatically. The more you have, the harder you are to beat.",
  },
  {
    action: 'end_turn',
    selectors: ['#end-turn-btn'],
    text: 'Jak skończysz ruch, kliknij tutaj. Twoja Garda zniknie na początku następnej tury (chyba że masz specjalną pamiątkę), a ceper spróbuje Ci oddać.',
    textEn:
      "When you're done with your turn, click here. Your Garda resets at the start of the next turn (unless you have a special Relic), and the tourist will try to hit back.",
  },
  {
    action: 'claim_relic',
    noDim: true,
    selectors: ['#claim-relic-btn'],
    text: 'Zwycięstwo! Za każdego ubitego cepra dostaniesz fanty. To jest Pamiątka – bierz ją, bo daje bonusy na stałe. Kliknij w nią, nie bój się, nie pogryzie!',
    textEn:
      "Victory! Every tourist you beat earns you loot. That's a Relic — take it, it gives you permanent bonuses. Click on it, don't be shy, it won't bite!",
  },
  {
    action: 'pick_card',
    noDim: true,
    selectors: ['#reward-cards'],
    text: 'Teraz najważniejsze: musisz wybrać nową kartę do talii. Nie bierz byle czego! Buduj talię tak, żebyś miał czym bić i czym się zasłaniać. Wybierz jedną z tych trzech.',
    textEn:
      "Now the important part: you must choose a new card for your deck. Don't pick just anything! Build a deck with both offense and defense. Choose one of these three.",
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
    textEn:
      "Well? I've explained everything plain as day. Want me to repeat it, or are we good to go? Just remember: you don't sprint through Krupówki Street. Be patient, or those tourists will trample you!",
  },
  {
    action: 'ack',
    btnText: 'Rozumiem, hej!',
    btnTextEn: "Let's go, hej!",
    selectors: [],
    dynamicText: 'finale_text',
    text: '',
  },
];

/**
 * @param {(type: string) => {emoji: string}} getMapNodeMeta
 * @param {'pl' | 'en'} [language]
 * @returns {string}
 */
export function buildTutorialMapExplanationText(getMapNodeMeta, language = 'pl') {
  const icon = (type) => getMapNodeMeta(type).emoji;
  if (language === 'en') {
    return [
      'Your Krupówki Street in a nutshell. Each icon is a different adventure:',
      `- ${icon('fight')} Battle: A regular tourist in need of some culture.`,
      `- ${icon('elite')} Elite: A tougher opponent, but richer loot.`,
      `- ${icon('event')} Event: Anything can happen here, from free bread to getting your wallet nicked.`,
      `- ${icon('campfire')} Campfire: Rest here and patch up your Krzepa.`,
      `- ${icon('shop')} Market: Spend your Dutki on new relics and cards.`,
    ].join('\n');
  }
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
 * @param {'pl' | 'en'} [language]
 * @returns {string}
 */
export function buildTutorialFinaleText(getMapNodeMeta, language = 'pl') {
  const bossIcon = getMapNodeMeta('boss').emoji;
  if (language === 'en') {
    return `That's the spirit! Now go teach them some manners! Just watch out at the end... the greatest menace of all Krupówki Street lurks there ${bossIcon}... you'll need to be strong to beat it!`;
  }
  return `I tak ma być! No, leć uczyć ich kultury! Ino uwazuj na końcu... tam się czai największa zmora całych Krupówek ${bossIcon}... trza być silnym coby go ubić!`;
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
