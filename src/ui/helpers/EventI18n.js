/** @typedef {'pl' | 'en'} LanguageCode */

/**
 * Curated English event title translations keyed by the canonical Polish title.
 * @type {Record<string, string>}
 */
const EVENT_TITLES_EN = {
  'Hazard na Kartonie': 'Shell Game on Cardboard',
  'Uliczny Karykaturzysta': 'Street Caricaturist',
  'Wąsaty Fiakier': 'The Mustachioed Coachman',
  'Korek do Toalety': 'The Toilet Queue',
  'Selfie na Krawędzi': 'Selfie at the Edge',
  'Paragon za Wrzątek': 'Receipt for Hot Water',
};

/**
 * Curated English event description translations keyed by the canonical Polish description.
 * Flavor terms preserved: Oscypki, Dutki, Garda, Krzepa, Lans.
 * Game terms translated: Kruchość→Fragile, Słabość→Weak, etc.
 * @type {Record<string, string>}
 */
const EVENT_DESCS_EN = {
  // Hazard na Kartonie
  'Przy kartonie po bananach stoi podejrzany typ i miesza kubki. "Gdzie jest kulka?!"':
    'A suspicious character stands by a banana crate shuffling cups. "Where\'s the ball?!"',

  // Uliczny Karykaturzysta
  'Na Krupówkach uliczny artysta pokazuje Ci groteskowy portret. "Płać, bo dorysuję rogi!"':
    'On Krupówki Street, a street artist shows you a grotesque portrait. "Pay, or I\'ll add horns!"',

  // Wąsaty Fiakier
  "Wielka bryczka tarasuje przejście. Fiakier w zakurzonym kapeluszu strzela z bata i patrzy na Twoją sakiewkę. 'Panocku, koń tyż głodny, a patrzynie na luksusy kosztuje!'":
    'A large carriage blocks the path. A mustachioed coachman in a dusty hat cracks his whip, eyeing your wallet. "Master, the horse is hungry too, and sightseeing costs money!"',

  // Korek do Toalety
  'Przy drzwiach z literą "WC" stoi kolejka jak na Black Friday. Tabliczka: "Wejście 15 zł. Papier własny."':
    'At the door marked "WC" there\'s a queue like Black Friday. Sign: "Entry 15 zł. Bring your own paper."',

  // Selfie na Krawędzi
  'Insta-taterniczka stoi na krawędzi skały z telefonem w wyciągniętej ręce. "Hej, możesz zrobić zdjęcie? Potrzebuję 400 zdjęć, żeby wybrać jedno!"':
    'An Instagram mountaineer stands on a cliff edge with her phone outstretched. "Hey, can you take a photo? I need 400 shots to pick one!"',

  // Paragon za Wrzątek
  'W schronisku dostęp do wrzątku kosztuje 18 zł. Do kubka 6 zł. Do stołu 4 zł. Za siedzenie na krześle dopłata 3 zł.':
    'At the mountain hut, access to hot water costs 18 zł. A mug: 6 zł. A table: 4 zł. Sitting in a chair: an extra 3 zł.',

  // Event-specific choice consequences and other texts (if needed for choice descriptions)
  'Koń jest miły w dotyku. Chwila relaksu regeneruje siły.':
    'The horse is soft to the touch. A moment of relaxation restores your strength.',
  "Fiakier mierzy Cię wzrokiem: 'Bez dutków to se możesz po asfalcie tupać, a nie moją bryką jechać! Naucy Cie rozumu...'":
    'The coachman sizes you up: "Without Dutki, you can only walk the asphalt, not ride my carriage! I\'ll teach you a lesson..."',
  'Wciskasz banknoty w szparę i wchodzisz bez kolejki. Chwila ciszy i świeżości — prawdziwy luksus na szlaku.':
    'You slip bills through the slot and enter without waiting. A moment of silence and freshness—true luxury on the trail.',
  'Czekasz godzinę. Potem drugą. Nogi odmawiają posłuszeństwa. Obserwujesz tłum i wyciągasz wnioski.':
    'You wait one hour. Then two. Your legs refuse to obey. You observe the crowd and draw conclusions.',
  'Znasz las lepiej niż toaletę. Ale TPN czuwa — i mandat do kompletu.':
    'You know the forest better than a toilet. But the National Park guards are watchful—and a ticket comes with it.',
  'Fotograf-amator na chwilę. Przez dwie godziny wisisz na krawędzi z jej telefonem. Twoje serce bije jak oszalałe.':
    'An amateur photographer for a moment. For two hours you dangle over the cliff with her phone. Your heart races.',
  'Masz stary kijaszek — ona desperacko go potrzebuje. Biznes gotowy. Dopiero na zjeździe okazuje się, że kijki były jednak do czegoś.':
    'You have an old walking stick—she desperately needs it. Easy sale. Only on the descent do you realize those sticks were actually useful.',
  'Masz dość contentu, krawędzi i telefonów. Zostawiasz ją z problemem i idziesz spokojnie swoją drogą.':
    "You've had enough of content, cliffs, and phones. You leave her to her problem and walk on in peace.",
  'Wyciągasz portfel, nie patrzysz na rachunek i delektujesz się herbatą.':
    "You pull out your wallet, don't look at the bill, and savor your tea.",
  'Targuj się jak na bazarze. Może uda się zbić cenę.':
    'Haggle like at a bazaar. Maybe you can knock down the price.',
  'To jest skandal, złodziejstwo i naruszenie praw konsumenta! Wzywasz wszystkich na świadków!':
    'This is a scandal, theft, and a violation of consumer rights! You call everyone to witness!',
  "Kelner chwyta ścierkę jak broń. 'Wynocha z mojego schroniska!'":
    'The waiter grabs a rag like a weapon. "Get out of my hut!"',
  'Cisza na szlaku... dziś nic się nie wydarzyło.':
    'Silence on the trail... nothing happened today.',
  'Przedzierasz się przez tłum i szykujesz do walki.':
    'You push through the crowd and prepare for battle.',
  'Stań do walki': 'Stand and Fight',
  Kontynuuj: 'Continue',
  'Koszt: 20 dutków. Wynik: 50% WYGRANA (+45 dutków), 50% PRZEGRANA (karta Pocieszenie: dobierz 1).':
    'Cost: 20 Dutki. Result: 50% WIN (+45 Dutki), 50% LOSS (Consolation card: draw 1).',
  'Koszt: 0 dutków. Nagroda: karta Spostrzegawczość (dobierz 1; jeśli to Atak, Twój następny atak w tej turze zadaje +2 obrażeń).':
    "Cost: 0 Dutki. Reward: Keen Eye card (draw 1; if it's an Attack, your next Attack this turn deals +2 damage).",
  'Koszt: 0 dutków. Efekt: walka wydarzeniowa z Naganiaczami. Nagroda po wygranej: Zasłużony Portfel (+6 dutków po każdym zwycięstwie poza walkami wydarzeniowymi).':
    'Cost: 0 Dutki. Effect: event battle with Enforcers. Reward upon victory: Deserved Purse (+6 Dutki after each victory outside event battles).',
  'Koszt: 25 dutków. Nagroda: relikt Krzywy Portret (wróg zadaje -2 obrażeń przez 1 turę).':
    'Cost: 25 Dutki. Reward: relic Crooked Portrait (enemy deals -2 damage for 1 turn).',
  'Koszt: brak. Nagroda: karta Furia Turysty (0 kosztu, +50% obrażeń w turze, -3 Krzepy, PRZEPADO).':
    "Cost: none. Reward: Tourist's Fury card (0 cost, +50% damage this turn, -3 Krzepa, exhaust).",
  'Koszt: -5 Krzepy. Nagroda: karta Prestiż na Kredyt (1 koszt, 6 Gardy +2 za każde 20 dutków, maks. +14 premii).':
    'Cost: -5 Krzepa. Reward: Prestige on Credit card (1 cost, 6 Garda +2 for every 20 Dutki, max +14 bonus).',
  'Koszt: 30 dutków. Nagroda: uleczenie +12 Krzepy (do max).':
    'Cost: 30 Dutki. Reward: heal +12 Krzepa (to max).',
  'Koszt: -6 Krzepy (nogi bolą). Nagroda: karta Spostrzegawczość trafia do talii.':
    'Cost: -6 Krzepa (your legs ache). Reward: Keen Eye card added to deck.',
  '50% szans: +45 dutków (spokój). 50%: bileter z TPN wyskakuje z krzaków — walka wydarzeniowa i -8 Krzepy wstydu!':
    '50% chance: +45 Dutki (peace). 50%: park ranger jumps out—event battle and -8 Krzepa shame!',
  'Walka wydarzeniowa z Kelnerem Schroniska. Po wygranej: relikt Zasłużony Portfel.':
    'Event battle with the Mountain Hut Waiter. Upon victory: relic Deserved Purse.',
  'Koszt: 60 dutków. Efekt: +7 Krzepy.': 'Cost: 60 Dutki. Effect: +7 Krzepa.',
  'Koszt: 20 dutków. Efekt: brak dodatkowej nagrody.':
    'Cost: 20 Dutki. Effect: no additional reward.',
  'Koszt: 150 dutków. Efekt: skrót do finału i wymuszenie walki z głównym finałowym wrogiem.':
    'Cost: 150 Dutki. Effect: shortcut to the finale and forced battle with the main boss.',
  'Koszt: 40 dutków. Nagroda: +10 Krzepy i karta Sernik trafia do talii.':
    'Cost: 40 Dutki. Reward: +10 Krzepa and Cheesecake card added to deck.',
  'Koszt: 15 dutków. 50%: pełen zwrot 15 dutków + 8 Krzepy. 50%: płacisz i dostajesz kartę Ulotka.':
    'Cost: 15 Dutki. 50%: full refund of 15 Dutki + 8 Krzepa. 50%: you pay and get a Flyer card.',
  'Koszt: -5 Krzepy (prawie spadłeś). Nagroda: karta Furia Turysty trafia do talii (adrenalina z przepaści).':
    "Cost: -5 Krzepa (almost fell). Reward: Tourist's Fury card added to deck (adrenaline from the cliff).",
  'Koszt: -8 Krzepy (skręcona kostka bez kijków). Nagroda: karta Prestiż na Kredyt w talii (wrzuciła Cię na story jako legendarnego przewodnika).':
    'Cost: -8 Krzepa (twisted ankle without sticks). Reward: Prestige on Credit card added to deck (she featured you as a legendary guide).',
  'Nagroda: uleczenie +8 Krzepy (spokój ducha to najlepsza dieta). Bez kosztów.':
    'Reward: heal +8 Krzepa (peace of mind is the best medicine). No cost.',
  'Bileter z TPN-u słyszy awanturę i rusza w twoją stronę z notatnikiem.':
    'The park ranger hears the commotion and rushes toward you with a notepad.',
};

/**
 * Localizes an event title for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} title
 * @returns {string}
 */
export function localizeEventTitle(language, title) {
  if (language !== 'en') return title;
  return EVENT_TITLES_EN[title] ?? title;
}

/**
 * Localizes an event description for the active language.
 * Falls back to the original Polish text if no translation exists.
 * @param {LanguageCode} language
 * @param {string} description
 * @returns {string}
 */
export function localizeEventDescription(language, description) {
  if (language !== 'en') return description;
  return EVENT_DESCS_EN[description] ?? description;
}
