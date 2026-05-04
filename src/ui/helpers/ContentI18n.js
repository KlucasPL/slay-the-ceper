/** @typedef {'pl' | 'en'} LanguageCode */

/** @type {Array<[RegExp, string]>} */
const REPLACEMENTS = [
  // --- Compound phrases first to prevent partial substitution by generic patterns ---
  [/Wybierz kartę, o której chcesz zapomnieć\./g, 'Choose a card to forget.'],
  [/Podejrzyj kartę/g, 'Preview card'],
  [/Cepr usieczony! Wybierz łup:/g, 'Tourist Slain! Choose loot:'],
  [/Elita pokonana! Wybierz kartę rare:/g, 'Elite Defeated! Choose rare card:'],
  [/Elita pokonana! Wybierz kartę:/g, 'Elite Defeated! Choose card:'],
  [/Elita pokonana! Wybierz pamiątkę:/g, 'Elite Defeated! Choose relic:'],
  [
    /Mistrz pokonany! Wybierz swój atut na Morskie Oko:/g,
    'Master Defeated! Choose your ace for Morskie Oko:',
  ],
  [
    /Brak pamiątek na sprzedaż \(lub zostały już wykupione\)\./g,
    'No relics for sale (or all sold out).',
  ],
  [/Brak kart na sprzedaż \(lub wszystkie wyprzedane\)\./g, 'No cards for sale (or all sold out).'],
  [/Kup Karty/g, 'Buy Cards'],
  [/Kup Pamiątki/g, 'Buy Relics'],
  [/Usuwanie Kart/g, 'Card Removal'],
  [/Koszt: brak\./g, 'Cost: free.'],
  [/Usuń Kartę z Talii/g, 'Remove a Card from Deck'],
  // ---
  [/\bZadaje\b/g, 'Deal'],
  [/\bzadaje\b/g, 'deal'],
  [/\bobrazen\b/gi, 'damage'],
  [/\bobrazenia\b/gi, 'damage'],
  [/\bobrażeń\b/gi, 'damage'],
  [/\bobrażenia\b/gi, 'damage'],
  [/\bZyskujesz\b/g, 'Gain'],
  [/\bzyskujesz\b/g, 'gain'],
  [/\bDobierz\b/g, 'Draw'],
  [/\bdobierz\b/g, 'draw'],
  [/\bkarty\b/g, 'cards'],
  [/\bkartę\b/g, 'a card'],
  [/\bkart\b/g, 'cards'],
  [/\bNa starcie walki\b/g, 'At battle start'],
  [/\bNa początku tury\b/g, 'At turn start'],
  [/\bNa końcu tury\b/g, 'At end of turn'],
  [/\bNa koniec tury\b/g, 'At end of turn'],
  [/\bwróg\b/g, 'enemy'],
  [/\bWrogowie\b/g, 'Enemies'],
  [/\bWróg\b/g, 'Enemy'],
  [/\bwrogowi\b/g, 'to the enemy'],
  [/\bKrzepy\b/g, 'HP'],
  [/\bKrzepa\b/g, 'HP'],
  [/\bGardy\b/g, 'Block'],
  [/\bGarda\b/g, 'Block'],
  [/\bSiły\b/g, 'Strength'],
  [/\bSiła\b/g, 'Strength'],
  [/\bSłabości\b/g, 'Weak'],
  [/\bSłabość\b/g, 'Weak'],
  [/\bKruchości\b/g, 'Fragile'],
  [/\bKruchość\b/g, 'Fragile'],
  [/\bOscypek\b/g, 'Oscypek'],
  [/\bOscypki\b/g, 'Oscypki'],
  [/\bDutki\b/g, 'Dutki'],
  [/\bdutków\b/g, 'Dutki'],
  [/\bdutki\b/g, 'Dutki'],
  [/\bPamiątki\b/g, 'Relics'],
  [/\bPamiątka\b/g, 'Relic'],
  [/\bWybierz\b/g, 'Choose'],
  [/\bKontynuuj\b/g, 'Continue'],
  [/\bIdź dalej\b/g, 'Go on'],
  [/\bStań do walki\b/g, 'Fight'],
  [/\bBrak\b/g, 'No'],
  [/\bTwoja talia jest pusta\./g, 'Your deck is empty.'],
  [/\bBrak kart w tym stosie\./g, 'No cards in this pile.'],
  [/\bTalia Dociągu\b/g, 'Draw Pile'],
  [/\bKarty Odrzucone\b/g, 'Discard Pile'],
  [/\bPrzepadło\b/g, 'Exhaust Pile'],
  [/\bWróć do Bacy\b/g, 'Back to Baca'],
  [/\bWróć na szlak\b/g, 'Back to the trail'],
  [/\bKup\b/g, 'Buy'],
  [/\bUsuń\b/g, 'Remove'],
  [/\bJarmark u Bacy\b/g, 'Baca Market'],
  [/\bKup Pamiątki\b/g, 'Buy Relics'],
  [/\bUsługi Bacy\b/g, 'Baca Services'],
  [/\bUsuń Kartę z Talii\b/g, 'Remove a Card from Deck'],
  [/\bWybierz Karty\b/g, 'Choose Cards'],
  [/\bLosowe Wydarzenie\b/g, 'Random Event'],
  [/\bSeba ucieka! Mati wpada w furię!\b/g, 'Seba flees! Mati enters a rage!'],
  [/\bWróg zbankrutował!\b/g, 'Enemy went bankrupt!'],
  [/\bNie udało się rozpocząć walki eventowej\.\b/g, 'Could not start event battle.'],
  [
    /\bCisza na szlaku\.\.\. dziś nic się nie wydarzyło\.\b/g,
    'Quiet on the trail... nothing happened today.',
  ],
  // Map
  [/Pogoda na polu/g, 'Weather at field'],
  [/Pogoda/g, 'Weather'],
  [/Brak danych o pogodzie\./g, 'No weather data.'],
  // Reward / victory screen
  [/Zgarnij Pamiątkę/g, 'Claim Relic'],
  [/Znalazłeś Skarb!/g, 'Treasure Found!'],
  [/Łup z wroga!/g, 'Enemy Loot!'],
  [/Nagroda Bossowa:/g, 'Boss Reward:'],
  [/Łup z bitki/g, 'Battle loot'],
  // Shop
  [/Patrzcie no! Mom towar i ciepłe oscypki!/g, 'Look at this! Got wares and warm Oscypki!'],
  [/Zablokowane przez Dzwonek Owcy!/g, 'Blocked by Sheep Bell!'],
  [/Ciepły Oscypek/g, 'Warm Oscypek'],
  [/Baca dał oscypek na ratunek\. \(\+15 HP\)/g, 'Baca gave an Oscypek for rescue. (+15 HP)'],
  [/Usunięto z talii:/g, 'Removed from deck:'],
  [/Kupiono kartę:/g, 'Card purchased:'],
  [/Kupiono pamiątkę:/g, 'Relic purchased:'],
  [/Ni mos tela dutków, synek!/g, 'Not enough Dutki, pal!'],
  [/To już wykupione\./g, 'Already purchased.'],
  [/Tej pamiątki nie ma\./g, 'This relic is not available.'],
  [/Kategoria/g, 'Category'],
  [/wkrótce dostępna/g, 'coming soon'],
  // Event
  [/Skutek/g, 'Effect'],
  [
    /Przedzierasz się przez tłum i szykujesz do walki\./g,
    'You push through the crowd and prepare for a fight.',
  ],
  [/Koszt:/g, 'Cost:'],
  [
    /Fiakier skrócił drogę\. Następny przystanek: finał wyprawy\./g,
    'A cab shortened the path. Next stop: expedition finale.',
  ],
  // Card UI
  [/Brak oscypków!/g, 'Not enough Oscypki!'],
  // Rarity / card-type compound labels (from UIHelpers.getFullCardType & rarityLabel)
  [/Powszechna karta/g, 'Common card'],
  [/Niepowszechna karta/g, 'Uncommon card'],
  [/Rzadka karta/g, 'Rare card'],
  [/Powszechna pamiątka/g, 'Common relic'],
  [/Niepowszechna pamiątka/g, 'Uncommon relic'],
  [/Rzadka pamiątka/g, 'Rare relic'],
  [/Powszechny Atak/g, 'Common Attack'],
  [/Niepowszechny Atak/g, 'Uncommon Attack'],
  [/Rzadki Atak/g, 'Rare Attack'],
  [/Powszechna Umiejętność/g, 'Common Skill'],
  [/Niepowszechna Umiejętność/g, 'Uncommon Skill'],
  [/Rzadka Umiejętność/g, 'Rare Skill'],
  [/Powszechny Stan/g, 'Common Status'],
  [/Niepowszechny Stan/g, 'Uncommon Status'],
  [/Rzadki Stan/g, 'Rare Status'],
  [/Powszechna Moc/g, 'Common Power'],
  [/Niepowszechna Moc/g, 'Uncommon Power'],
  [/Rzadka Moc/g, 'Rare Power'],
  // Inflected / genitive forms
  [/\bDutków\b/g, 'Dutki'],
  [/\bdutka\b/g, 'Dutki'],
  [/\bKarty\b/g, 'Cards'],
];

/**
 * Best-effort content translation for game text in English mode.
 * Uses deterministic phrase replacements and preserves original text in Polish mode.
 * @param {LanguageCode} language
 * @param {string} text
 * @returns {string}
 */
export function localizeGameText(language, text) {
  if (language === 'pl' || typeof text !== 'string' || text.length === 0) {
    return text;
  }

  let localized = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    localized = localized.replace(pattern, replacement);
  }
  return localized;
}
