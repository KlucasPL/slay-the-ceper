/** @typedef {'pl' | 'en'} LanguageCode */

/**
 * Curated English card name translations keyed by the canonical Polish name.
 * Flavor terms are preserved: Oscypki, Dutki, Garda, Krzepa, Lans.
 * @type {Record<string, string>}
 */
const CARD_NAMES_EN = {
  // Starter / tutorial
  'Cios ciupagą': 'Axe Strike',
  'Łyk z Gąsiora': 'Swig from the Jug',
  'Góralska Obrona': 'Highland Defense',
  'Rzut kierpcem': 'Kierpce Throw',
  'Góralskie Hej!': 'Highland Hey!',

  // Common
  Sernik: 'Cheesecake',
  Halny: 'Halny Wind',
  Zadyma: 'Brawl',
  Żyntyca: 'Żyntyca',
  'Pchnięcie Ciupagą': 'Axe Thrust',
  'Barchanowe Gacie': 'Woolen Britches',
  'Echo w Tatrach': 'Tatra Echo',
  'Zapas Oscypków': 'Oscypki Stash',
  'Wdech Halnego': 'Halny Breath',
  'Dutki na Stole': 'Dutki on the Table',
  'Punkt Widokowy': 'Viewpoint',
  'Ciupaga we Mgle': 'Axe in the Fog',
  'Przymusowe Morsowanie': 'Forced Ice Bath',
  'Zaskoczenie z Kosodrzewiny': 'Ambush from the Pines',
  'Z Rozmachu': 'With Momentum',
  'Beczenie Redyku': "Ram's Bellow",
  'Przeliczanie Dutków': 'Dutki Counting',

  // Uncommon
  Redyk: 'Sheep Drive',
  'Wypożyczone Gogle': 'Borrowed Goggles',
  Parzenica: 'Parzenica',
  'Szukanie Okazji': 'Opportunity Hunt',
  Lodołamacz: 'Icebreaker',
  'Tatrzański Szpan': 'Tatra Swagger',
  'Paradny Zwyrt': 'Grand Flourish',
  'Cios z Telemarkiem': 'Telemark Strike',
  'Wepchniecie w Kolejkę': 'Line Cut',
  'Rozpęd z Równi': 'Downhill Rush',
  Krzesany: 'Krzesany Dance',
  'Wymuszony Napiwek': 'Forced Tip',
  'Przymusowy Napiwek': 'Mandatory Tip',
  'List od Maryny': "Maryna's Letter",
  'Wydruk z Kasy': 'Register Printout',
  'Nadplacony Bilet': 'Overpriced Ticket',
  'Pan na Włościach': 'Lord of the Lands',
  'Zimna Krew': 'Cold Blood',
  'Baciarka Ciesy': "Baciarka's Grip",
  'Schowek za Pazuchą': 'Hidden in the Coat',
  'Piórko u Kapelusza': 'Feather in the Cap',
  'Wypięta Pierś': 'Puffed-Out Chest',
  'Nauczka z Krupówek': 'Lesson from Krupówki',
  'Zamach znad Głodówki': 'Strike from the Heights',
  'Pogodzenie Sporów': 'Dispute Settlement',
  'Herbata z Prądem': 'Electric Tea',
  'Góralski Upór': 'Highland Stubbornness',
  'Na Ratunek GOPR': 'GOPR Rescue',
  'Lawina z Morskiego Oka': 'Avalanche from Morskie Oko',
  'Zgubieni we Mgle': 'Lost in the Fog',
  'Kąpiel w Białce': 'Białka River Plunge',

  // Rare
  Janosikowe: "Janosik's Toll",
  'Gniew Giewontu': 'Wrath of Giewont',
  'Mocny Organizm': 'Iron Constitution',
  Sandały: 'Sandals',
  'Duma Podhala': 'Pride of Podhale',
  'Zemsta Górala': "Highlander's Revenge",
  'Prestiż na Kredyt': 'Prestige on Credit',
  'Furia Turysty': "Tourist's Fury",
  Spostrzegawczość: 'Keen Eye',
  'Zdjęcie z Misiem': 'Selfie with the Bear',
  'Paragon za Gofra': 'Waffle Receipt',
  'Podatek Klimatyczny': 'Climate Tax',
  'Mlynek Ciupagą': 'Axe Whirl',
  'Młynek Ciupagą': 'Axe Whirl',
  'Eksmisja z Kwatery': 'Eviction Notice',
  'Rachunek za Oddychanie': 'Breathing Fee',
  'Skrupulatne Wyliczenie': 'Precise Calculation',
  'Paragon Grozy': 'Terror Receipt',
  'Czas na Fajkę': 'Smoke Break',
  'Góralska Gościnność': 'Highland Hospitality',
  'Koncesja na Oscypki': 'Oscypki Licence',
  'Zasieki z Gubałówki': 'Gubałówka Barricade',
  'Wezwanie Przedsądowe': 'Pre-Trial Notice',
  'Szał Bacy': "Baca's Frenzy",
  'Stary Numer Maryny': "Maryna's Old Trick",
  'Znajomość Szlaku': 'Trail Knowledge',

  // Status / curse cards
  Pocieszenie: 'Consolation',
  Ulotka: 'Flyer',
  'Spam Tagami': 'Hashtag Spam',
  Mandat: 'Ticket',
  'Numerek do Toalety': 'Toilet Queue Number',
  Hałas: 'Ruckus',
  'Nadprogramowy Paragon': 'Unexpected Receipt',
};

/**
 * Curated English card description translations keyed by the canonical Polish description.
 * Flavor terms preserved: Oscypki, Dutki, Garda, Krzepa, Lans, Rachunek (→ Tab).
 * @type {Record<string, string>}
 */
const CARD_DESCS_EN = {
  // Starter / tutorial
  'Zadaje 6 obrażeń.': 'Deal 6 damage.',
  'Zyskujesz 5 Gardy.': 'Gain 5 Garda.',
  'Zadaje 12 obrażeń i nakłada 1 Słabości. Śmierdzi jak diabli.':
    'Deal 12 damage and apply 1 Weak. Stinks to high heaven.',
  'Dobierz 2 karty.': 'Draw 2 cards.',

  // Common
  'Zyskujesz 1 Oscypek.': 'Gain 1 Oscypki.',
  'Odrzuć rękę, dobierz 5 kart i zyskaj 6 Gardy.':
    'Discard your hand, draw 5 cards, and gain 6 Garda.',
  'Zadaje 8 obrażeń. Jeśli wróg ma Gardę: 12 obrażeń.':
    'Deal 8 damage. If the enemy has Garda: deal 12 instead.',
  'Leczysz 4 Krzepy.': 'Heal 4 Krzepa.',
  'Pchnięcie Ciupagą — deal 8 damage': 'Axe Thrust',
  'Zadaje 8 obrażeń. Jeśli wróg nie ma Gardy, zadaje 12 obrażeń.':
    'Deal 8 damage. If the enemy has no Garda, deal 12 instead.',
  'Zyskujesz 9 Gardy. Jeśli masz Lans, zyskujesz 13 Gardy.':
    'Gain 9 Garda. If you have Lans, gain 13 Garda instead.',
  'Twój następny cios zadaje podwójne obrażenia. Dobierz 1 kartę.':
    'Your next attack deals double damage. Draw 1 card.',
  'Zyskaj 1 Oscypek na następną turę i 4 Gardy.': 'Gain 1 Oscypki next turn and 4 Garda.',
  'Odrzuć 1 kartę z ręki i dobierz 2 karty.': 'Discard 1 card from your hand and draw 2 cards.',
  'Zyskujesz 14 dutków, dodajesz 6 do Rachunku i dobierasz 1 kartę.':
    "Gain 14 Dutki, add 6 to the enemy's Tab, and draw 1 card.",
  'Dobierz 1 kartę. Jeśli pogoda to słonecznie, dobierz jeszcze 1 kartę.':
    'Draw 1 card. If the weather is clear, draw 1 more.',
  'Zadaje 6 obrażeń i nakłada 2 Słabości. Jeśli pogoda to mgła, nakłada też 1 Kruchość.':
    'Deal 6 damage and apply 2 Weak. If the weather is fog, also apply 1 Fragile.',
  'Zadaje 7 obrażeń. Jeśli pogoda to mróz, zadaje dodatkowo 7 obrażeń i dobiera 1 kartę.':
    'Deal 7 damage. If the weather is frozen, deal 7 more and draw 1 card.',
  'Zadaje 7 obrażeń. Zawsze trafia (ignoruje mgłę i uniki).':
    'Deal 7 damage. Always hits (ignores fog and evasion).',
  'Zadaje 7 obrażeń. Jeśli masz status następnego podwójnego ciosu, dobierz 1 kartę.':
    'Deal 7 damage. If you have Double Strike active, draw 1 card.',
  'Zadaje 9 obrażeń. Zyskuje +4 obrażenia za każdy punkt Twojej Siły.':
    'Deal 9 damage. Gains +4 damage for each point of your Strength.',
  'LANS: Dobierz 1 kartę i zyskaj 4 Gardy.': 'LANS: Draw 1 card and gain 4 Garda.',

  // Uncommon
  'Atakuje 4 razy po 2 obrażenia (+Siła).': 'Attack 4 times for 2 damage (+Strength).',
  'Zyskaj status Lans (obrażenia najpierw w dutki, potem w Krzepę).':
    'Gain the Lans status (damage hits Dutki first, then Krzepa).',
  'Zyskujesz 7 Gardy. Na początku następnej tury +1 Oscypek.':
    'Gain 7 Garda. At the start of your next turn, +1 Oscypki.',
  'Odrzuć 1 kartę, dobierz 2 karty.': 'Discard 1 card, draw 2 cards.',
  'Zadaje 8 obrażeń. Dodatkowo zadaje obrażenia równe połowie Twojej aktualnej Gardy.':
    'Deal 8 damage plus damage equal to half of your current Garda.',
  'LANS: Zadaje 18 obrażeń.': 'LANS: Deal 18 damage.',
  'LANS: Zadaje 18 obrażeń, dobiera 2 karty.': 'LANS: Deal 18 damage and draw 2 cards.',
  'LANS: Zadaje 16 obrażeń i dobiera 1 kartę.': 'LANS: Deal 16 damage and draw 1 card.',
  'LANS: Nakłada 2 Podatności i dobiera 1 kartę.': 'LANS: Apply 2 Vulnerable and draw 1 card.',
  'Zadaje 3x3 obrażenia. Jeśli wróg ma Słabość, zadaje 4x3.':
    'Attack 3 times for 3 damage. If the enemy is Weak, deal 4 per hit instead.',
  'Atakuje 2x6 obrażeń. Jeśli drugi cios przebije pancerz, zyskujesz 1 Oscypek.':
    'Attack twice for 6 damage. If the second hit pierces Garda, gain 1 Oscypki.',
  'Zadaje 11 obrażeń. Jeśli wróg padnie od tej karty, zyskujesz 20 dutków.':
    'Deal 11 damage. If this card kills the enemy, gain 20 Dutki.',
  'Dodaj 8 do Rachunku. Jeśli wróg ma Podatność, dodaj jeszcze 8.':
    'Add 8 to the Tab. If the enemy is Vulnerable, add 8 more.',
  'Dobierz 2 karty i zyskaj 9 Gardy. Jeśli wróg ma Słabość lub Kruchość, dobierz jeszcze 1.':
    'Draw 2 cards and gain 9 Garda. If the enemy is Weak or Fragile, draw 1 more.',
  'Zadaje 6 obrażeń. Dodaje 4 do Rachunku wroga.': "Deal 6 damage. Add 4 to the enemy's Tab.",
  'Zadaje 7 obrażeń. +1 obrażenia za każde 5 Rachunku na wrogu (maks. +5).':
    'Deal 7 damage. +1 damage for every 5 Tab on the enemy (max +5).',
  'Za każdym razem, gdy aktywujesz Lans, zyskujesz 3 Gardy.':
    'Whenever you activate Lans, gain 3 Garda.',
  'Ilekroć nakładasz Słabość, nakładasz dodatkowo +1 Słabości.':
    'Whenever you apply Weak, apply 1 additional Weak.',
  'Zyskujesz +2 Siły na całą walkę.': 'Gain +2 Strength for the rest of combat.',
  'Wybierz 1 kartę z ręki. Zostaje ona na następną turę.':
    'Choose 1 card from your hand. It stays for the next turn.',
  'LANS: Zyskaj 8 Gardy i dobierz 1 kartę.': 'LANS: Gain 8 Garda and draw 1 card.',
  'LANS: Zyskaj 7 Gardy. Następny atak zadaje +3 obrażenia.':
    'LANS: Gain 7 Garda. Your next attack deals +3 damage.',
  'Nakładasz na siebie 1 Słabość. Zyskujesz +2 Siły.':
    'Apply 1 Weak to yourself. Gain +2 Strength.',
  'Ustawiasz status Podwójnego Ciosu. Wyczerpuje.': 'Activate Double Strike status. Exhaust.',
  'Dodaj 10 do Rachunku i dobierz 1 kartę.': 'Add 10 to the Tab and draw 1 card.',
  'Jeśli masz ≤50% Krzepy, ulecz 6. W przeciwnym razie ulecz 2. Wyczerpuje.':
    'If you have ≤50% Krzepa, heal 6. Otherwise heal 2. Exhaust.',
  'Zyskaj 5 Gardy. Ta Garda nie znika na początku następnej tury (Blur).':
    "Gain 5 Garda. This Garda doesn't expire at the start of your next turn (Blur).",
  'Ulecz 5 Krzepy. Jeśli wróg ma >20 Rachunku, ulecz dodatkowe 5. Wyczerpuje.':
    'Heal 5 Krzepa. If the enemy has >20 Tab, heal 5 more. Exhaust.',
  'Zadaje 16 obrażeń. Jeśli pogoda to mróz, karta kosztuje 1 Oscypek.':
    'Deal 16 damage. If the weather is frozen, costs 1 Oscypki.',
  'Jeśli pogoda to mgła, nakłada na wroga 2 Słabości. W innym wypadku zyskujesz 8 Gardy.':
    'If the weather is fog, apply 2 Weak to the enemy. Otherwise, gain 8 Garda.',
  'W pogodzie mrozu nakładasz na wroga 1 Podatność na starcie swojej tury.':
    'In frozen weather, apply 1 Vulnerable to the enemy at the start of your turn.',
  'Ilekroć dobierasz kartę w trakcie swojej tury (poza normalnym dobieraniem), zadaj wrogowi 3 obrażenia.':
    'Whenever you draw a card during your turn (outside normal draw), deal the enemy 3 damage.',
  'Ilekroć tracisz Krzepę, dobierz 1 kartę na początku następnej tury.':
    'Whenever you lose Krzepa, draw 1 card at the start of your next turn.',

  // Rare
  'Zadaje 11 obrażeń. Zyskujesz +10 dutków. Jeśli wróg pada: dodatkowe +25 dutków.':
    'Deal 11 damage. Gain +10 Dutki. If the enemy dies: gain +25 more Dutki.',
  'Zadaje 28 obrażeń.': 'Deal 28 damage.',
  'Zadaje 12 obrażeń. Jeśli wróg pada: na stałe +3 do maksymalnej Krzepy.':
    'Deal 12 damage. If the enemy dies: permanently gain +3 max Krzepa.',
  'Zadaje 7 obrażeń. Nakłada Słabość 1 na wroga.': 'Deal 7 damage. Apply 1 Weak to the enemy.',
  'Do końca walki: za każde 10 Gardy straconej od ataku wroga zadajesz mu 5 obrażeń.':
    'For the rest of combat: for every 10 Garda lost to enemy attacks, deal the enemy 5 damage.',
  'Zadaje 22 obrażenia. Jeśli to ostatnia karta na ręce, zadaje podwójne obrażenia.':
    'Deal 22 damage. If this is the last card in your hand, deal double damage.',
  'Zyskujesz 6 Gardy. +2 Gardy za każde 20 dutków (max +14).':
    'Gain 6 Garda. +2 Garda for every 20 Dutki (max +14).',
  'Do końca tury: +50% zadawanych obrażeń. Tracisz 3 Krzepy.':
    'Until end of turn: +50% damage dealt. Lose 3 Krzepa.',
  'Dobierz 1. Jeśli to Atak, następny Atak w tej turze zadaje +2 obrażenia.':
    "Draw 1. If it's an Attack, your next Attack this turn deals +2 damage.",
  'Jeśli masz aktywny Lans, zyskaj 30 dutków i dobierz 1 kartę. Inaczej nic się nie dzieje.':
    'If you have active Lans, gain 30 Dutki and draw 1 card. Otherwise, nothing happens.',
  'Dodaj 12 do Rachunku wroga. Dobierz 1 kartę.': "Add 12 to the enemy's Tab. Draw 1 card.",
  'Podwój obecny Rachunek wroga.': "Double the enemy's current Tab.",
  'Atakuje 3x3 obrażenia. Nakłada 2 Słabości, jeśli masz LANS, w przeciwnym razie 1.':
    'Attack 3 times for 3 damage. Apply 2 Weak if you have LANS, otherwise 1.',
  'Zadaje 12 obrażeń. Jeśli wróg ma Słabość, dodaje 6 do Rachunku.':
    'Deal 12 damage. If the enemy is Weak, add 6 to their Tab.',
  'Zadaje 8 obrażeń. Zwiększa aktualny Rachunek wroga o 25% (zaokrąglając w górę).':
    "Deal 8 damage. Increase the enemy's Tab by 25% (rounded up).",
  'Zadaje obrażenia równe 90% Twojej aktualnej Gardy. Jeśli Rachunek >= 8, dodaje +10 obrażeń.':
    'Deal damage equal to 90% of your current Garda. If Tab ≥ 8, deal +10 bonus damage.',
  'Zadaje 18 obrażeń. Jeśli wróg ma co najmniej 24 Rachunku, kosztuje 0 Oscypków.':
    'Deal 18 damage. If the enemy has at least 24 Tab, costs 0 Oscypki.',
  'Na koniec Twojej tury, jeśli masz ponad 10 Gardy, leczysz 2 Krzepy.':
    'At the end of your turn, if you have more than 10 Garda, heal 2 Krzepa.',
  'Za każdą zagraną kartą Ataku dodajesz 3 do Rachunku wroga. Dobierz 1 kartę.':
    "For each Attack card played, add 3 to the enemy's Tab. Draw 1 card.",
  'Na początku tury, jeśli wróg ma co najmniej 20 Rachunku, zyskujesz 1 Oscypek, dobierasz 1 kartę i zyskujesz 3 Gardy.':
    'At the start of your turn, if the enemy has at least 20 Tab, gain 1 Oscypki, draw 1 card, and gain 3 Garda.',
  'Zyskaj 12 Gardy. Gdy otrzymujesz obrażenia od wroga (nawet blokowane), zadaj mu 5 obrażeń.':
    'Gain 12 Garda. Whenever you take damage from the enemy (even blocked), deal them 5 damage.',
  'Zyskaj Gardę równą 1/3 Rachunku wroga. Wyczerpuje.':
    "Gain Garda equal to 1/3 of the enemy's Tab. Exhaust.",
  'Nakłada 2 Słabości i 2 Kruchości. Dobierz 1 kartę.': 'Apply 2 Weak and 2 Fragile. Draw 1 card.',
  'Zyskujesz 7 Gardy. W pogodzie mgły zyskujesz 7 Gardy na starcie swojej tury.':
    'Gain 7 Garda. In foggy weather, gain 7 Garda at the start of your turn.',

  // Status / curse cards
  'Dobierz 1.': 'Draw 1.',
  'Zapycha rękę.': 'Clogs your hand.',
  'Niegrywalna. Póki na ręce, tracisz 2 dutki co turę.':
    'Unplayable. While in hand, lose 2 Dutki per turn.',
  'Zapłać mandat (2 Oscypki) i wyrzuć. Jeśli nie zapłacisz — tracisz 2 Dutki co turę.':
    'Pay the fine (2 Oscypki) and exhaust. If unpaid — lose 2 Dutki per turn.',
  'Nie można zagrać. Utknąłeś w kolejce — zajmuje miejsce w dłoni.':
    "Cannot be played. You're stuck in the queue — takes up a hand slot.",
  'Musisz zagrać tę kartę przed innymi. Zagraj, by wyrzucić.':
    'Must be played before other cards. Play to exhaust.',
  'Zapłać 1 Oscypek i wyrzuć. Póki na ręce — tracisz 3 dutki co turę.':
    'Pay 1 Oscypki and exhaust. While in hand — lose 3 Dutki per turn.',

  // Exhaust label
  PRZEPADO: 'EXHAUSTED',
};

/**
 * Localizes a card name for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} name
 * @returns {string}
 */
export function localizeCardName(language, name) {
  if (language !== 'en') return name;
  return CARD_NAMES_EN[name] ?? name;
}

/**
 * Localizes a card description for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} description
 * @returns {string}
 */
export function localizeCardDescription(language, description) {
  if (language !== 'en') return description;
  return CARD_DESCS_EN[description] ?? description;
}
