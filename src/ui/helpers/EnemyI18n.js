/** @typedef {'pl' | 'en'} LanguageCode */

/** @type {Record<string, string>} */
const ENEMY_NAMES_EN = {
  Cepr: 'Tourist',
  'Zagubiony Ceper': 'Lost Tourist',
  'Wąsaty Busiarz': 'Mustachioed Minibus Driver',
  'Handlara oscypkami': 'Oscypki Vendor',
  Influencerka: 'Influencer',
  'Parkingowy z Palenicy': 'Palenica Parking Attendant',
  'Konik spod Kuźnic': 'Kuźnice Ticket Scalper',
  'Naganiacz z Krupówek': 'Krupówki Tout',
  'Naganiacze z Krupówek': 'Krupówki Touts',
  'Spekulant z Zakopanego': 'Zakopane Speculator',
  'Mistrz Redyku': 'Master of the Flock',
  'Ceprzyca VIP': 'VIP Tourist',
  'Fiakier spod Krupówek': 'Krupówki Coachman',
  'Pomocnik Fiakra': "Coachman's Assistant",
  'Król Krupówek - Biały Misiek (Zdzisiek)': 'King of Krupówki – White Bear (Zdzisiek)',
  'Turysta w Klapkach': 'Flip-Flop Tourist',
  'Rodzina z Głośnikiem': 'Family with a Bluetooth Speaker',
  'Spocony Półmaratończyk': 'Sweaty Half-Marathon Runner',
  'Insta-Taterniczka': 'Insta-Climber',
  'Janusz Znawca Szlaków': 'Janusz the Trail Expert',
  'Złodziejska Kaczka': 'Thieving Duck',
  'Głodny Świstak': 'Hungry Marmot',
  'Bileter z TPN': 'TPN Ticket Inspector',
  'Kelner Schroniska': 'Mountain Hut Waiter',
  'Meleksiarz Pirat Drogowy': 'Meleks Road Pirate',
  'Bober z Morskiego Oka': 'Morskie Oko Beaver',
  'Królowa Schroniska': 'Queen of the Mountain Hut',
  'Harnaś Pogodynka': 'The Weather Warden',
};

/** @type {Record<string, string>} */
const ENEMY_MOVE_NAMES_EN = {
  // cepr
  'Rzut klapkiem': 'Flip-Flop Toss',
  'Pytanie o drogę': 'Asking for Directions',
  'Złość turysty': "Tourist's Rage",
  // zagubiony_ceper
  'Niezdarny Cios': 'Clumsy Strike',
  // busiarz
  'Trąbienie na pieszych': 'Honking at Pedestrians',
  'Wyprzedzanie na trzeciego': 'Three-Lane Overtake',
  'Zbieranie kompletu': 'Filling Up the Bus',
  // baba
  'Darmowa degustacja': 'Free Sample',
  'Cena z kosmosu': 'Astronomical Price',
  'Rzut redykołką': 'Smoked Cheese Throw',
  // influencerka
  'Selfie z zaskoczenia': 'Surprise Selfie',
  'Oznaczenie w relacji': 'Tagged in Stories',
  'Filtr upiększający': 'Beauty Filter',
  // parkingowy
  'Bilet za wycieraczką': 'Ticket Under the Wiper',
  'Kłótnia o rezerwację': 'Booking Dispute',
  'Blokada na koło': 'Wheel Clamp',
  // konik
  'Szturchanie w kolejce': 'Queue Shove',
  'Zmiana regulaminu': 'Terms & Conditions Change',
  'Priorytet VIP': 'VIP Priority',
  // naganiacz
  'Krzykliwa zachęta': 'Loud Come-On',
  'Promka spod budki': 'Kiosk Deal',
  'Zasyp ulotkami': 'Leaflet Barrage',
  // naganiacze
  Podpuszczanie: 'Egging On',
  'Szybkie Palce': 'Quick Fingers',
  'Desperackie Cięcie': 'Desperate Slash',
  'Unik w Tłumie': 'Crowd Dodge',
  // spekulant
  'Kancelaria prawna': 'Legal Firm',
  'Umowa wstępna': 'Preliminary Contract',
  'Podwyżka czynszu': 'Rent Hike',
  'Eksmisja Odwrócona': 'Reversed Eviction',
  // mistrz redyku
  Poświst: "Shepherd's Whistle",
  'Uderzenie Bacówką': "Shepherd's Hut Strike",
  'Redyk przez dolinę': 'Valley Drive',
  'Zbójnicki taniec': 'Robber Baron Dance',
  // ceprzyca
  'Zdjęcie z widokiem': 'Scenic Photo',
  'Rezerwacja VIP': 'VIP Reservation',
  'Awantura o cenę': 'Price Argument',
  'Concierge na ratunek': 'Concierge to the Rescue',
  // fiakier
  'Batogiem po grzbiecie': 'Whip Across the Back',
  Rozped: 'Momentum',
  Przyspieszenie: 'Speed Up',
  'Zamach Batem': 'Whip Strike',
  // pomocnik fiakra
  'Bat po łydkach': 'Whip at the Shins',
  'Szarpnięcie lejców': 'Rein Jerk',
  'Zbieranie oddechu': 'Gathering Breath',
  // boss misiek
  'Górski Ryk': 'Mountain Roar',
  'Agresywne pozowanie': 'Aggressive Posing',
  'Podatek od zdjęcia': 'Photo Tax',
  'Uścisk Krupówek': 'Krupówki Squeeze',
  // turysta w klapkach
  'Rzut kabanosem': 'Kabanos Throw',
  'Plask klapkiem': 'Flip-Flop Slap',
  'Otarcia pięty': 'Heel Blister',
  // rodzina z głośnikiem
  'Bas drop': 'Bass Drop',
  'Zgubione dziecko': 'Lost Child',
  'Krzyk o loda': 'Screaming for Ice Cream',
  // półmaratończyk
  'Łapanie oddechu': 'Catching Breath',
  'Pot na czole': 'Sweat on the Brow',
  'Ślepa szarża': 'Blind Charge',
  // insta-taterniczka
  'Błysk flesza': 'Flash Burst',
  'Selfie z hasztagiem': 'Selfie with Hashtag',
  'Selfie z widokiem': 'Scenic Selfie',
  Dzióbek: 'Duck Lips',
  // janusz
  'Zjedz kanapkę': 'Eat a Sandwich',
  'Dobra rada': 'Friendly Advice',
  'Wykład o mapie': 'Map Lecture',
  // kaczka
  Uszczypnięcie: 'Pinch',
  'Unik wodny': 'Waterside Dodge',
  'Kradzież kanapki': 'Sandwich Theft',
  // świstak
  'Krótki pazur': 'Short Claw',
  'Pisk rozpaczy': 'Squeal of Despair',
  'Ucieczka w nory': 'Burrow Escape',
  // bileter
  'Brak biletu': 'No Ticket',
  'Inspekcja paragonu': 'Receipt Inspection',
  'Wezwanie straży': 'Calling the Guards',
  'Mandat za wydeptanie': 'Fine for Trampling',
  // kelner schroniska
  'Paragon za paragon': 'Receipt for Receipt',
  'Dopłata za obsługę': 'Service Charge',
  'Wyrzucenie z lokalu': 'Thrown Out',
  // meleksiarz
  'Boczkiem, boczkiem!': 'Sneaking Through!',
  'Klakson z zaskoczenia': 'Surprise Honk',
  'Wjazd w tłum': 'Plowing into the Crowd',
  'Priorytet dla meleksa': 'Meleks Right of Way',
  // bober
  'Budowa tamy': 'Dam Construction',
  'Plask ogonem': 'Tail Slap',
  'Podgryzanie kijka': 'Gnawing the Stick',
  'Inspekcja tamy': 'Dam Inspection',
  // królowa schroniska
  'Gorąca zupa': 'Hot Soup',
  'Wrzątek płatny': 'Boiling Water (Paid)',
  'Obsługa kolejki': 'Serving the Queue',
  'Koniec wydawki': 'Last Orders',
  // harnaś pogodynka – phase 1
  'Przygotowanie do prognozy': 'Forecast Preparation',
  'Wiatr wstępny': 'Incoming Wind',
  'Zmiana frontów': 'Changing Fronts',
  'Prognoza burzy': 'Storm Forecast',
  // harnaś – phase 2
  'Powiew halnego': 'Halny Gust',
  'Taniec w wichurze': 'Dance in the Gale',
  'Wicher tatrzański': 'Tatra Wind',
  'Podmuch szczytowy': 'Summit Gust',
  // harnaś – phase 3
  'Lód na szlaku': 'Ice on the Trail',
  'Mroźne uderzenie': 'Frosty Strike',
  'Zamarznięty wicher': 'Frozen Wind',
  Zamrożenie: 'Freeze',
  // harnaś – phase 4
  'Uderzenie we mgle': 'Strike in the Fog',
  'Mglisty manewr': 'Misty Maneuver',
  'Gęsta mgła': 'Dense Fog',
};

/**
 * @param {LanguageCode} language
 * @param {string} name
 * @returns {string}
 */
export function localizeEnemyName(language, name) {
  if (language !== 'en') return name;
  return ENEMY_NAMES_EN[name] ?? name;
}

/**
 * @param {LanguageCode} language
 * @param {string} moveName
 * @returns {string}
 */
export function localizeMoveName(language, moveName) {
  if (language !== 'en') return moveName;
  return ENEMY_MOVE_NAMES_EN[moveName] ?? moveName;
}

/**
 * Localizes the intent text produced by getEnemyIntentText (L2 state layer).
 * Replaces the Polish "Zamiar:" prefix and known move names with English equivalents.
 *
 * @param {LanguageCode} language
 * @param {string} intentText
 * @returns {string}
 */
export function localizeIntentText(language, intentText) {
  if (language !== 'en') return intentText;
  let result = intentText.replace('Zamiar:', 'Intent:');
  result = result.replace('Ogłuszony', 'Stunned');
  result = result.replace('kradzież', 'theft');
  result = result.replace('efekt', 'effect');
  for (const [pl, en] of Object.entries(ENEMY_MOVE_NAMES_EN)) {
    if (result.includes(pl)) {
      result = result.replace(pl, en);
      break;
    }
  }
  return result;
}
