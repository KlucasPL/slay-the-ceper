/** @typedef {'pl' | 'en'} LanguageCode */

/**
 * Curated English relic name translations keyed by the canonical Polish name.
 * @type {Record<string, string>}
 */
const RELIC_NAMES_EN = {
  'Ciupaga-Długopis': 'Axe-Pen',
  'Bilet TPN Ulgowy': 'Tatras National Park Discount',
  'Wiatr Halny w Butelce': 'Halny Wind in a Bottle',
  'Pusta Flaszka po Śliwowicy': 'Empty Plum Vodka Bottle',
  'Krokus pod Ochroną': 'Protected Crocus',
  'Zepsuty Termometr': 'Broken Thermometer',
  'Pocztówka z Giewontem': 'Giewont Postcard',
  'Kierpce z Wyprzedaży': 'Discount Kierpce',
  'Smycz „Zakopane 2026"': 'Zakopane 2026 Leash',
  'Dzwonek Owcy – Przeklęty': "Cursed Sheep's Bell",
  'Piekielna Papryczka Marka': "Mark's Hellfire Pepper",
  'Papucie po Babci': "Grandma's Slippers",
  'Magnes na Lodówkę': 'Refrigerator Magnet',
  'Pęknięte Liczydło': 'Cracked Abacus',
  'Blacha Przewodnika': "Guide's Badge",
  'Lustrzane Gogle': 'Mirror Goggles',
  'Złota Karta Zakopiańczyka': "Highlander's Gold Card",
  'Szczęśliwa Podkowa': 'Lucky Horseshoe',
  'Góralski Zegarek': 'Highlander Watch',
  'Termos z Herbatką': 'Tea Thermos',
  'Mapa Zakopanego': 'Map of Zakopane',
  'Pas Bacowski': "Shepherd's Belt",
  'Certyfikowany Oscypek': 'Certified Oscypki',
  'Krzywy Portret': 'Crooked Portrait',
  'Zasłużony Portfel': 'Deserved Purse',
  'Mokra Ściera Maryny': "Maryna's Wet Rag",
  'Kiesa na Pierwszy Dzień': 'First Day Purse',
  'Przegląd Plecaka Maryny': "Maryna's Pack Inspection",
  'Słoik Rosołu na Drogę': 'Broth Jar for the Journey',
  'Złoty Różaniec Maryny': "Maryna's Golden Rosary",
  'Lista Zakupów': 'Shopping List',
  'Tajny Składnik Maryny': "Maryna's Secret Ingredient",
  'Pasterski Termos': "Shepherd's Thermos",
  'Muffin z Oscypkiem': 'Oscypki Muffin',
  'Kędziołek na Energię': 'Energy Tuft',
  'Herbata Zimowa': 'Winter Tea',
  'Portfel Turysty': "Tourist's Wallet",
  'Ciupaga Ekspresowa': 'Swift Axe',
  'Dzbanek Mleka': 'Milk Pitcher',
  'Paragon Startowy': 'Starter Receipt',
  'Księga Długów': 'Ledger of Debts',
  'Bankructwo z Bonusem': 'Profitable Bankruptcy',
  'Pancerz z Łansu': 'Armor of Lans',
  'Wejście z Przytupem': 'Entrance with a Stomp',
  'Zaszczyt Upadku': "Fall's Glory",
  'Plecak na Każdą Pogodę': 'All-Weather Backpack',
  'Góralska Skóra': 'Highlander Hide',
  'Barometr Tatrzański': 'Tatras Barometer',
};

/**
 * Curated English relic description translations keyed by the canonical Polish description.
 * Flavor terms preserved: Oscypki, Dutki, Garda, Krzepa, Lans, Rachunek.
 * @type {Record<string, string>}
 */
const RELIC_DESCS_EN = {
  'Każda zagrana karta Umiejętności zadaje wrogowi 1 obrażenie.':
    'Each Skill card played deals 1 damage to the enemy.',
  'Co 3. zagrana karta Ataku w walce daje +1 Oscypka.':
    'Every 3rd Attack card played in combat grants +1 Oscypki.',
  'Na początku każdej tury: dobierz +2 karty.': 'At the start of each turn: draw +2 cards.',
  'Na start walki: +2 Siły. Każda tura: koszty kart w ręce losowe (0–3).':
    'At battle start: +2 Strength. Each turn: card costs in hand are random (0–3).',
  'Na koniec tury: jeśli masz co najmniej 8 Gardy – ulecz 2 Krzepy.':
    'At the end of your turn: if you have at least 8 Garda, heal 2 Krzepa.',
  'Na start walki wróg dostaje 2 Słabości i 2 Kruchości. Słabość i Kruchość na wrogach spada co 2 tury, nie co turę.':
    'At battle start, the enemy gets 2 Weak and 2 Fragile. Weak and Fragile decay every 2 turns, not every turn.',
  'Pierwsza i druga karta w każdej walce wywoła efekt podwójnie i zyskujesz 2 Gardy.':
    'The first and second cards in each battle trigger effects twice and you gain 2 Garda.',
  'Za każdym razem, gdy tracisz Krzepę w walce, dobierz 1 kartę i zyskaj 3 Gardy.':
    'Whenever you lose Krzepa in combat, draw 1 card and gain 3 Garda.',
  'Na koniec tury: kliknij 📿 na karcie, by trafił na wierzch talii.':
    'At the end of your turn: click 📿 on a card to put it on top of your deck.',
  'Wrogowie mają –15% maks. Krzepy. Leczenie działa, ale najwyżej 2 Krzepy na efekt.':
    'Enemies have –15% max Krzepa. Healing works but caps at 2 Krzepa per effect.',
  'Na start walki: +3 Siły. Na początku każdej tury: zyskaj 1 Gardy i strać 1 Krzepę.':
    'At battle start: +3 Strength. At the start of each turn: gain 1 Garda and lose 1 Krzepa.',
  'Na koniec tury: ulecz 1 Krzepy (2 przy aktywnym Lansie).':
    'At the end of your turn: heal 1 Krzepa (2 if Lans is active).',
  'Po walce dostajesz +20% dutków, a przy Bankructwie wroga +50%.':
    'After combat: +20% Dutki, and +50% if the enemy is Bankrupt.',
  'Leczy 1 Krzepy przy każdym nałożeniu Rachunku.': 'Heals 1 Krzepa whenever Tab is added.',
  'Rozpoczynasz każdą walkę z aktywnym Lansem.': 'You start each battle with Lans active.',
  'Dopóki masz aktywny Lans, każda karta Gardy daje +2 pkt pancerza więcej.':
    'While Lans is active, each Garda card grants +2 additional block.',
  'Usuwanie kart w sklepie kosztuje 0 dutków. Wszystkie karty w sklepie są o 20% tańsze.':
    'Card removal in shop costs 0 Dutki. All shop cards are 20% cheaper.',
  'Wygranie walki mając ≤40% Krzepy daje bonus +25 dutków.':
    'Winning combat at ≤40% Krzepa grants +25 Dutki bonus.',
  'W każdej parzystej turze walki (2, 4, 6...) pierwsza zagrana karta Umiejętności kosztuje 0 Oscypków.':
    'On every even turn (2, 4, 6...), the first Skill card costs 0 Oscypki.',
  'Koniec walki w 2 turach lub mniej: ulecz +4 Krzepy. W przeciwnym razie: +15 dutków.':
    'Battle ends in 2 turns or less: heal +4 Krzepa. Otherwise: +15 Dutki.',
  "Widzisz, co kryje się pod '?' na mapie. Na start walki: +3 Gardy.":
    "Reveal what's hidden under '?' on the map. At battle start: +3 Garda.",
  'Po podniesieniu: +6 do maksymalnej Krzepy.': 'Upon pickup: +6 to max Krzepa.',
  'Za wejście do sklepu: +5 do maksymalnej Krzepy (maks. 3 razy na wyprawę).':
    'Per shop visit: +5 to max Krzepa (max 3 times per run).',
  'Na start walki: wróg zadaje o 2 obrażenia mniej przez 1 turę.':
    'At battle start: enemy deals 2 less damage for 1 turn.',
  'Po zwycięstwie poza walką wydarzeniową: +6 dutków.':
    'After victory outside event battles: +6 Dutki.',
  '+7 max Krzepy i +7 Krzepy (do nowego limitu).': '+7 max Krzepa and +7 Krzepa (to new limit).',
  '+100 Dutków od razu; +40 Dutków po pierwszym zwycięstwie (jednorazowo).':
    '+100 Dutki immediately; +40 Dutki after first victory (once).',
  'Usuń 1 losową kartę startową z talii; dodaj 1 losową kartę niepowszechną; zyskaj +80 Dutków.':
    'Remove 1 random starter card from deck; add 1 random uncommon card; gain +80 Dutki.',
  'Przez pierwsze 4 walki na starcie: +8 Gardy i +1 Siły.':
    'First 4 battles at start: +8 Garda and +1 Strength.',
  'Na starcie każdej walki: +5 Garda i pierwsze trafienie atakiem zadaje podwójne obrażenia.':
    'At the start of each battle: +5 Garda and first Attack hit deals double damage.',
  '+50 Dutków od razu. Wszystkie sklepy: karty -25%. Jedno darmowe usunięcie karty w wyprawie.':
    '+50 Dutki immediately. All shops: cards –25%. One free card removal per run.',
  'Na starcie każdej walki wróg dostaje 2 Słabości i 2 Kruchości.':
    'At the start of each battle, enemy gets 2 Weak and 2 Fragile.',
  'Na start walki: +2 Oscypki w tej turze. Po walce: strać 2 Krzepy (minimum 1).':
    'At battle start: +2 Oscypki this turn. After battle: lose 2 Krzepa (minimum 1).',
  'Co 2. karta Ataku w turze: +1 Oscypek (maks. 2 na turę).':
    'Every 2nd Attack card in your turn: +1 Oscypki (max 2 per turn).',
  'Na początku parzystej tury walki (2, 4, 6...): +1 Oscypek. Na koniec tury: jeśli masz 8+ Gardy, stracisz 1 Oscypek w następnej turze.':
    'At the start of even turns (2, 4, 6...): +1 Oscypki. At turn end: if you have 8+ Garda, lose 1 Oscypki next turn.',
  'Pierwszy zakup w każdym sklepie: zysk +1 Oscypka na start następnej walki.':
    'First purchase in each shop: gain +1 Oscypki at the start of the next battle.',
  'Pierwsza karta Umiejętności w każdej turze kosztuje 0 Oscypków.':
    'The first Skill card each turn costs 0 Oscypki.',
  'Na start walki: -1 Oscypek. Efekty leczenia: +1 Oscypek za każde 3 uleczone Krzepy (maks. 2 na turę).':
    'At battle start: –1 Oscypki. Healing effects: +1 Oscypki per 3 Krzepa healed (max 2 per turn).',
  'Na start każdej walki: wróg natychmiast dostaje 6 Rachunku.':
    'At the start of each battle: enemy immediately gains 6 Tab.',
  'Każda zagrana karta Umiejętności nakłada na wroga 2 Rachunku.':
    'Each Skill card played inflicts 2 Tab on the enemy.',
  'Gdy wróg bankrutuje przez Rachunek: ulecz 6 Krzepy i zysk 20 Dutków.':
    'When enemy goes Bankrupt via Tab: heal 6 Krzepa and gain 20 Dutki.',
  'Gdy Lans jest aktywny: każde otrzymane obrażenie w Krzepę jest zmniejszone o 2 (minimum 0).':
    'While Lans is active: each damage to Krzepa is reduced by 2 (minimum 0).',
  'Gdy Lans aktywuje się: zadaj wrogowi 5 obrażeń.':
    'When Lans activates: deal 5 damage to the enemy.',
  'Gdy Lans się załamie: dobierz 2 karty i zysk +2 Oscypki w następnej turze.':
    'When Lans breaks: draw 2 cards and gain +2 Oscypki next turn.',
  'Na start walki: bonus zależny od pogody — Czyste Niebo: +1 Oscypek; Halny: +6 Gardy; Zamarznięty Szlak: Kruchość na wroga; Mgła: dobierz 2 karty.':
    'At battle start: weather-based bonus — Clear Skies: +1 Oscypki; Halny Wind: +6 Garda; Frozen Path: Fragile enemy; Fog: draw 2 cards.',
  'Halny drenuje tylko 1 Gardy na turę (nie 2). Mgła: szansa pudła na Twój atak spada do 12% (nie 25%).':
    'Halny Wind drains only 1 Garda per turn (not 2). Fog: your miss chance drops to 12% (not 25%).',
  'Na początku każdej tury walki w pogodzie innej niż Czyste Niebo: +1 Oscypek.':
    'At the start of each turn in weather other than Clear Skies: +1 Oscypki.',
};

/**
 * Localizes a relic name for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} name
 * @returns {string}
 */
export function localizeRelicName(language, name) {
  if (language !== 'en') return name;
  return RELIC_NAMES_EN[name] ?? name;
}

/**
 * Localizes a relic description for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} description
 * @returns {string}
 */
export function localizeRelicDescription(language, description) {
  if (language !== 'en') return description;
  return RELIC_DESCS_EN[description] ?? description;
}
