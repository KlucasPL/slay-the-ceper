/**
 * @typedef {{ version: string, date: string, changes: string[] }} ReleaseNoteEntry
 */

/** @type {ReleaseNoteEntry[]} */
export const releaseNotesDataEn = [
  {
    version: 'v2.0.2 - Tutorial UI Improvements and English Language',
    date: 'May 2026',
    changes: [
      '🗺️ MAP TUTORIAL: Map node explanations now display properly without scrolling, with proper rendering layers for visibility over the map.',
      '🌍 ENGLISH LANGUAGE: The entire game is now available in English, including cards, souvenirs, enemies, and all system text.',
    ],
  },
  {
    version: 'v2.0.1 - Act II Polish and App Mode',
    date: 'May 2026',
    changes: [
      '📱 MOBILE APP MODE: On mobile devices in the app version, a "Force Landscape" button was added, making a best-effort attempt to switch to landscape view.',
      '🗺️ EVENTS IN ACTS: Reduced the repetition of events in the same act, making the expedition yield more diverse encounters.',
      '🔀 BETTER EVENT NODE FALLBACK: When the event pool in an act is exhausted, the node falls back to a sensible variant (combat or market) instead of an empty event.',
      '🚽 TOILET QUEUE: Reworked the passive so the counter builds up sensibly between turns and is only consumed upon triggering the corresponding effect.',
      '🧩 STATUS ICONS: Unified the visibility of new statuses and power markers to display active effects more clearly during combat.',
    ],
  },
  {
    version: 'v2.0.0 - Morskie Oko and Full Expedition',
    date: 'May 2026',
    changes: [
      '🏔️ ACT II: The expedition has been expanded with a second act (Morskie Oko) featuring a new pool of enemies, elites, and final bosses.',
      '👑 NEW ACT II BOSSES: Waiting at the end of the second act are the Mountain Hut Queen and the Harnaś Weatherman, with their own mechanics and attack patterns.',
      '🌦️ WEATHER MATTERS MORE: Combat and map decisions now heavily utilize the weather system, which genuinely impacts the pacing and risk of the run.',
      '❓ NEW EVENTS AND BETTER POOLS: Organized event acts (Act I/Act II) so encounters appear in the correct part of the expedition.',
      '🧾 NEW ENEMY STATUSES: Added new status threats and refined economic pressure in combat (e.g., receipt/bill effects).',
      '⚖️ FULL ENEMY ROSTER TUNING: Adjusted enemy strength across both acts so the difficulty scales more smoothly from start to finish.',
      '📊 RUN RECORDING: Added automatic run recording (divided by acts) to improve balance analysis and combat quality (CAN BE DISABLED IN SETTINGS).',
      '🛠️ STABILITY AND CONSISTENCY: Improved handling of boss victories and defeats, run data export, and numerous minor bugs affecting the fluidity of the run.',
    ],
  },
  {
    version: 'v1.7.2 - King of Krupówki and Balance',
    date: 'April 2026',
    changes: [
      '🐻‍❄️ King of Krupówki – decreased the damage of all attacks, lowered the Guard gained from buffs, and reduced the damage of the Photo Tax.',
      '⚖️ Master of Redyk – lowered the Guard gained from buffs and reduced health.',
      '🚧 Parking Attendant – increased the damage of the "Ticket behind the Wiper" attack.',
      '🐴 Fiaker – increased the damage of all attacks by 20%.',
      '🌬️ Halny Wind – now both sides lose 3 Guard at the end of the turn.',
      '🛠️ Other – minor fixes and description consistency improvements.',
    ],
  },
  {
    version: 'v1.7.1 - App Update Reminder',
    date: 'April 2026',
    changes: [
      '📲 PWA APP GAME UPDATES: An app update reminder prompt has been added to the main menu screen.',
    ],
  },
  {
    version: 'v1.7.0 - Interface Polish',
    date: 'April 2026',
    changes: [
      '📲 GAME AS AN APP (PWA): "Usiec Cepra" can now be installed on your phone or PC like a native app – no app store needed, works fully offline. On Android/Chrome, click "Install" in the browser menu. On iPhone/iPad, open in Safari → Share □↑ → "Add to Home Screen". On a PC (Chrome/Edge), click the ⊕ icon in the address bar. The "📲 Install" button in the bottom left of the main menu guides you through the whole process.',
      '📱 LANDSCAPE MODE RETURNS TO PHONES: The game works in landscape orientation on mobile devices again – the lock from the previous version has been lifted. The interface automatically adapts to wide screens, and the title and menu buttons are readable regardless of orientation.',
      "🔍 CARD AND RELIC PREVIEW: Pressing and holding (or clicking and holding with a mouse) on any card or relic – in rewards, Market, Campfire, Tatra Library, card piles, and at Maryna's – opens a full-screen preview with the full description.",
      "🃏 MARYNA'S GIFTS PREVIEW: Holding Maryna's blessing voucher now correctly displays the preview window over the selection overlay.",
    ],
  },
  {
    version: 'v1.6.0 - Great Card and Souvenir Rebalance',
    date: 'April 2026',
    changes: [
      '⚖️ MAJOR BALANCE UPDATE: Tuned the weakest and strongest elements simultaneously, focusing on better playability for weak choices and toning down the most dominant options.',
      "🃏 CARDS (ATTACK/SKILL): Buffed Highlander's Revenge, Viewpoint, and Letter from Maryna; nerfed Ciupaga Spin, Room Eviction, and Receipt of Terror; fixed descriptions to match the new values 1:1.",
      "🎒 RELICS: Rebalanced key economic and combat relics (incl. Empty Plum Brandy Bottle, Sheep Bell, Broken Thermometer, Certified Oscypek, Cracked Abacus, Highlander's Gold Card).",
      "👵 MARYNA'S STARTER KITS: Adjusted the power and economy of starting gifts (Wet Rag, Pouch, Golden Rosary, Backpack Check), and synchronized starter kit descriptions and their corresponding relics with the new balance.",
      '🧾 READABILITY AND CONSISTENCY: Unified numerical values in card and relic descriptions so deck-building decisions are more predictable right at the selection stage.',
    ],
  },
  {
    version: 'v1.5.3 - More comfortable mobile gameplay',
    date: 'April 2026',
    changes: [
      '📱 PORTRAIT ONLY ON PHONES: The game now blocks landscape gameplay on mobile devices and displays a clear message to rotate the phone back to portrait.',
      '🛑 CLEAR LOCK SCREEN: Instead of trying to cram the interface after rotation, we show a full-screen info screen and disable game interaction until returning to portrait mode.',
      '🖥️ NO MOBILE MODE ON PC: Very wide but short windows on PCs no longer switch the game to a fallback mobile layout. Instead, a clear message appears stating the window is too short for comfortable gameplay.',
    ],
  },
  {
    version: 'v1.5.2 - Combat and event fixes',
    date: 'April 2026',
    changes: [
      '🔥 CAMPFIRE ONLY FOR ATTACKS: Sharpening at the Campfire now only accepts Attack cards again; Skills and Powers are correctly rejected.',
      "🧹 STATUSES CLEARED IMMEDIATELY AFTER WIN: Temporary status cards from Cepers disappear immediately after combat, so they no longer show up in the Market's removal list.",
      '🐴 MUSTACHIOED FIAKER - FIXED COMBAT THRESHOLD: Emergency combat now triggers correctly at less than 20 Dutki (including the 10-19 range).',
    ],
  },
  {
    version: 'v1.5.1 - Fixes and polish',
    date: 'April 2026',
    changes: [
      '🗡️ ELITES ON THE MAP: The map now guarantees at least 3 Elites on the available paths, with each being at least 3 nodes apart – no more empty routes without challenges.',
      '🛖 NEW MARKET RULES: At least 5 Markets now appear on the map, at least one path leads through 3 Markets, and two Markets can no longer be placed back-to-back.',
      '🔥 CAMPFIRE FIXED: The sharpening card list at the Campfire now shows all Attacks from the deck, not just a select few – every deck can fully utilize the upgrade.',
      '🪓 ONE CARD, NOT THE WHOLE PILE: Sharpening at the Campfire now only buffs one selected copy of an Attack, instead of all cards of the same type in the deck.',
      '📝 TERMINOLOGY CLEANUP: Unified the name of the "Vulnerability" status across the entire game interface.',
    ],
  },
  {
    version: 'v1.5.0 - New card pack',
    date: 'April 2026',
    changes: [
      '🃏 NEW CARDS: Added 35 cards in total (19 Attacks, 8 Skills, 8 Powers).',
      '⚔️ ATTACKS: Cash Register Printout, Momentum from Równia, Krzesany (Dance), Tatra Flex, Ciupaga in the Fog, Parade Spin, Overpaid Ticket, With Momentum, Room Eviction, Telemark Strike, Forced Tip, Ciupaga Spin, Bill for Breathing, Forced Ice Bath, Pushing into the Queue, Morskie Oko Avalanche, Redyk Bleating, Meticulous Calculation, Receipt of Terror.',
      '🛡️ SKILLS: Reconciling Disputes, Oscypek Stash, Halny Inhale, Viewpoint, Forced Tip, Lost in the Fog, Letter from Maryna, Dutki on the Table.',
      '✨ POWERS: Lord of the Manor, Time for a Smoke, Cold Blood, Highlander Hospitality, Trail Knowledge, Bath in Białka, Oscypek Concession, Ciesa Baciarka (Highlander Party).',
    ],
  },
  {
    version: 'v1.4.0 - Flexing at full throttle',
    date: 'April 2026',
    changes: [
      "🕶️ FLEX WITH CHARACTER: Cards labeled with Flex (Lans) now have their own global rule - if you are not in Flex yet, the first play triggers the status itself, and only subsequent plays trigger the card's full effect.",
      '💸 FLEXING COSTS MORE: Flex still protects Vigor at the cost of Dutki, but during combat, the tab for this style grows faster, making a strong start easily end in painful BANKRUPTCY.',
      '✨ NEW FLEX VISUALS: Status activation is now accompanied by a golden flash, falling sunglasses, and a shout "IT\'S A FLEX!", and when the effect is lost, the sunglasses spectacularly fall off your face.',
    ],
  },
  {
    version: 'v1.3.2 - A new face at the market',
    date: 'April 2026',
    changes: [
      '🧀 OSCYPEK TRADER: Hostess Maryna has changed into the Oscypek Trader – the same tough hostess, new, more fitting name.',
    ],
  },
  {
    version: 'v1.3.1 - Calmer run finale',
    date: 'April 2026',
    changes: [
      '👹 MILDER FINAL ENEMIES: The Krupówki Fiaker and White Bear now have 50 less Vigor each, so the finale still hurts, but less frequently ends a run with a single, overly long fight.',
    ],
  },
  {
    version: "v1.3.0 - Maryna's Starter Kit",
    date: 'April 2026',
    changes: [
      '👵 MARYNA: Before the first fight, you meet Maryna – an old highlander woman who hands you one of three special gifts for the road. Choose wisely!',
      '🎁 7 GIFTS OF MARYNA: Wet Rag (+12 Max Vigor), Pouch (+80 Dutki + bonus after first fight), Backpack Check (swap starter card for an uncommon), Jar of Broth (for 3 fights: +6 Guard and +1 Strength at start), Golden Rosary (double the first attack hit in every fight), Shopping List (first shop visit: 30% discount on cards + free removal), Secret Ingredient (every fight: Ceper starts with -1 Weakness and -1 Frailty).',
      "⚔️ GUARANTEED CEPER: After choosing Maryna's gift, the first real opponent is always a Ceper – so you can test the gift in peace.",
      '🏠 MAP FIXED: The starting map node is now "Maryna" instead of a random fight – a drawing of Maryna appears in a dedicated selection window.',
    ],
  },
  {
    version: 'v1.2.6 - Great polish and readable cards',
    date: 'April 2026',
    changes: [
      '🃏 PERFECT CARDS: A thorough overhaul of card visuals! Texts and icons intelligently make room for each other, descriptions are larger and more readable, and corners with costs are no longer cut off on phones. Additionally, cards clearly display their full type (e.g., "Common Attack", "Uncommon Skill").',
      '📱 FLEXIBLE INTERFACE: No more cut-off views! Whether you play on a small smartphone or a laptop (like a Mac Air) – the Main Menu and Tatra Library will perfectly adapt to your display without hiding buttons at the bottom.',
      "📖 BETTER INTRO PACING: We extended the display time of panels in the starting comic, so everyone can calmly familiarize themselves with Jędrek's story.",
      '🎓 TUTORIAL FIX: We moved Jędrek\'s speech bubble, which previously rudely covered the "Exit" button.',
      '⚖️ FORMALITIES: At the bottom of the menu, we added a discreet note reminding everyone that our highlander game is simply a humorous parody of Slay the Spire.',
    ],
  },
  {
    version: 'v1.2.5 - Tutorial and mobile comfort',
    date: 'April 2026',
    changes: [
      '🧭 NEW TUTORIAL FROM JĘDREK: Added a full Tutorial mode that explains combat, rewards, and map movement step-by-step.',
      '📱 BETTER READABILITY ON PHONES: Reorganized the main menu layout so nothing is cut off and content is readable on smaller screens.',
    ],
  },
  {
    version: 'v1.2.4 - Intro and map graphics for part one',
    date: 'April 2026',
    changes: [
      '🎬 NEW INTRO: Added a comic intro played before the main game loop, skippable with ESC or a click. It can also be disabled in settings.',
      "🖼️ NEW ADVENTURE ART: Added art for the first part of Jędrek's adventures used on the map.",
      '🎵 NEW MENU TRACK: Added a new music track to the main game menu.',
    ],
  },
  {
    version: 'v1.2.3 - Card Piles Preview',
    date: 'April 2026',
    changes: [
      '🃏 NEW PILE PREVIEW IN COMBAT: During a fight, you can click the Deck, Discard, and Exhaust pile icons to see exactly which cards are in each pile.',
      '👀 CLEARER TACTICAL DECISIONS: The preview works in a convenient grid window, making it easier to plan your next moves and manage combat pacing.',
      '📱 BETTER INTERFACE ERGONOMICS: Pile icons are constantly visible in the top panel and no longer cover cards in your hand, even on smaller screens.',
      "🧾 GAŹDZINA FIX: Gaździna is now fully immune to The Bill (Rachunek) - the counter doesn't increase and stays at 0 throughout the battle, removing misleading indicators.",
    ],
  },
  {
    version: 'v1.2.2 - Gambling on Krupówki',
    date: 'April 2026',
    changes: [
      '🎲 NEW EVENT: On the trail, you can encounter Cardboard Gambling with several different choices and consequences that change the course of your run.',
      '🎨 SECOND NEW EVENT: A Street Caricaturist was also added to the pool, offering another encounter with its own choices and rewards affecting the deck.',
      '⚔️ NEW SPECIAL COMBAT: As part of an event, a unique fight with Touts (Naganiacze) appears, along with a dedicated reward tied to this encounter.',
      '🎁 CLEARER REWARDS: After elites and select encounters, rewards are laid out more predictably, making it easier to plan future decisions.',
      '🗺️ SMOOTHER EXPEDITION: Refined the map and event randomness so runs more frequently maintain a good combat pace and offer more satisfying choices.',
    ],
  },
  {
    version: 'v1.2.1 - Music and Expedition Flow',
    date: 'April 2026',
    changes: [
      '🎵 NEW MUSIC AND BETTER TRANSITIONS: Added separate themes for the map, normal combat, the final boss, and the Mustachioed Fiaker event. Transitions between the map, event, and combat now always return to the correct track without overlapping audio.',
      "💥 BETTER ENEMY TURN FEEL: Resolutions related to enemy bankruptcy are now more consistent with the turn's rhythm and animations.",
    ],
  },
  {
    version: 'v1.2.0 - Expedition Structure and Real Elites',
    date: 'April 2026',
    changes: [
      '🗺️ EXPEDITION STRUCTURE: The run now has 15 levels, a guaranteed Campfire mid-route, and a final Campfire before the final boss, stabilizing the pacing of final preparations.',
      '🎁 TREASURE AND PATHS: Every run contains exactly one guaranteed treasure node in the early and middle phases, and map connections are clearer and do not intersect locally.',
      '👹 REAL ELITES: Elite nodes use a separate enemy pool, appear from y=4 onwards, and give a dedicated 1-of-3 relic reward (with an emergency rare card draw).',
      '👑 NEW ELITES: Elite encounters gained a new pool of enemies with distinctly different combat styles, giving each elite fight its own character and pace.',
      '⚖️ BETTER ELITE BALANCE: Adjusted the strength of select elites so they remain challenging but less often end runs with a single, massive difficulty spike.',
      '🧭 CLEARER DURING THE RUN: You can now see your current Vigor and Dutki directly on the map, making it easier to plan the risk of upcoming nodes.',
      '💰 CLEARER COMBAT EFFECTS: Effects related to losing Dutki (e.g., interactions with FLEX) are better telegraphed during combat.',
    ],
  },
  {
    version: 'v1.1.3 - New music and fixes',
    date: 'April 2026',
    changes: [
      '🎵 NEW MUSIC: Added new tracks for the Market and Campfire, and improved music switching between major game scenes.',
      "⚔️ COMBAT: The game's main theme now plays more stably during battles and doesn't restart during regular actions.",
      '📝 NAMING: Cleaned up some names and descriptions visible during gameplay to make them more consistent.',
    ],
  },
  {
    version: 'v1.1.2 - New screens and music',
    date: 'April 2026',
    changes: [
      '🆕 NEW SCREENS: Added an options screen and a run summary, making it easier to track progress and jump back into the next expedition.',
      '🎵 MUSIC: The game received new tracks and more cinematic transitions between the most important moments of gameplay.',
      '⚙️ CONVENIENCE: Options are now accessible during the game without needing to return to the main menu.',
    ],
  },
  {
    version: 'v1.1.1 - Souvenir Re-tiering',
    date: 'April 2026',
    changes: [
      '🎒 RELICS: Reorganized the rarities of some relics to make rewards and store choices more intuitive.',
      '⚖️ BALANCE: Power distribution among relics is now more even, making it easier to evaluate loot value during a run.',
      '🛖 MARKET: Adjusted prices for selected relics to better fit their new role in gameplay.',
    ],
  },
  {
    version: 'v1.1.0 - Great Rebalance',
    date: 'April 2026',
    changes: [
      '🆕 NEW CONTENT: Expanded the game with new cards, new enemies, and new relics.',
      '⚖️ EXPEDITION REBALANCE: Combat pacing, economy, and deck strength have been better tuned so decisions during the run matter more.',
      '🌄 EXPEDITION FLOW: Early and mid-stages of the run lead more smoothly to the finale, and the final enemies are closer to each other in challenge level.',
      '🗺️ MAP AND MARKET: Events, rewards, and purchases have been refreshed to ensure every path offers more interesting choices.',
    ],
  },
  {
    version: 'v1.0.2 - Calming the Finale',
    date: 'April 2026',
    changes: [
      '👹 EXPEDITION FINALE: Nerfed final enemies to ensure the finale remains challenging but less frustrating for a wider variety of decks.',
      "🎴 REWARDS: It's easier to find stronger cards after combat, making building a deck around a specific plan more enjoyable.",
      "🗺️ EXPEDITION PATH: The middle section of the map leads through fights and shops more often, with fewer random detours from the run's main pace.",
    ],
  },
  {
    version: 'v1.0.1 - Krupówki Balance',
    date: 'April 2026',
    changes: [
      '⚖️ ENEMY BALANCE: Calmed the difficulty of certain encounters to make the early and mid-game more fair.',
      '❓ RANDOM EVENTS: Special events with their own choices and consequences for the rest of the run have appeared on the map.',
    ],
  },
  {
    version: 'v1.0.0 - Grand Opening of Krupówki',
    date: 'April 2026',
    changes: [
      '🏔️ ROGUELIKE CARD GAME: Build your deck, manage Oscypeks, and plan your turns on a map filled with events.',
      "⚔️ TWO PATHS TO VICTORY: You can win classically through damage, or via the 'Bill' mechanic by bankrupting the opponent.",
      '✨ FLEX AND STATUSES: Combat revolves around statuses, card synergy, and effects that allow for very diverse playstyles.',
      '🎒 RELIC SYSTEM: Develop your deck through relics of varying rarity that alter your economy, defense, and combat pacing.',
      '🗺️ THE TRAIL AND EVENTS: The map leads you through brawls, the Market, Campfire, treasures, and a final showdown with the ultimate boss.',
      '⚖️ ENEMIES: Every opponent has their own fighting style and forces a different approach to gameplay.',
      '👺 ENEMY ROSTER: Enemies have unique passives and movement patterns that force you to adapt your tactics between battles.',
      '👹 EXPEDITION FINALE: At the end of the trail awaits a random final boss and a demanding encounter concluding the run.',
    ],
  },
];
