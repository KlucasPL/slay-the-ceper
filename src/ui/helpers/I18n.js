/** @typedef {'pl' | 'en'} LanguageCode */

/** @type {Readonly<Record<LanguageCode, Record<string, string>>>} */
const UI_TRANSLATIONS = {
  pl: {
    'common.on': 'ON',
    'common.off': 'OFF',
    'language.pl': 'Polski',
    'language.en': 'English',

    'title.kicker': 'Góralska przygoda dla cierpliwych',
    'title.subtitle': 'Pomóż Jędrkowi odzyskać spokój na perci!',
    'title.menuAria': 'Menu główne',
    'title.normal': 'Tryb Podstawowy (Nowa Gra)',
    'title.tutorial': 'Samouczek',
    'title.hard': 'Tryb Dla Marka 🌶️',
    'title.options': 'Opcje',
    'title.library': 'Biblioteka',
    'title.difficultyHint': 'W trybie Dla Marka przeciwnicy stają się silniejsi z każdą walką!',
    'title.releaseNotesPrefix': 'Co nowego?',

    'options.title': 'Opcje',
    'options.menuMusic': 'Muzyka w Menu',
    'options.gameMusic': 'Muzyka w Grze',
    'options.skipIntro': 'Pomiń Wstęp',
    'options.textSize': 'Rozmiar Tekstu',
    'options.analytics': 'Analityka gry',
    'options.language': 'Język',
    'options.backMain': 'Wróć do menu głównego',
    'options.textSize.normal': 'NORMALNY',
    'options.textSize.large': 'DUŻY',
    'options.textSize.xlarge': 'BARDZO DUŻY',
    'options.textSizeAria': 'Rozmiar tekstu: {label}',

    'confirm.backToMenu': 'Wrócić do menu głównego? Bieżąca wyprawa zostanie zresetowana.',

    'map.title': 'Perć przez Tatry',
    'map.hardBadge': 'TRUDNY',
    'map.newPath': 'Nowa perć',
    'map.goNext': 'Idź dalej',

    'runSummary.win': '🏔️ ZWYCIĘSTWO!',
    'runSummary.loss': '💀 KONIEC PRZYGODY',
    'runSummary.killedBy': 'Zgładzony przez: {name}',
    'runSummary.floor': 'Piętro:',
    'runSummary.dutki': 'Zebrane Dutki:',
    'runSummary.turns': 'Tury:',
    'runSummary.relicsTitle': 'Pamiątki',
    'runSummary.deckTitle': 'Końcowa Talia',
    'runSummary.noDeck': 'Brak kart w talii końcowej.',
    'runSummary.noRelics': 'Brak zebranych pamiątek.',
    'runSummary.replay': 'Zagraj ponownie',
    'runSummary.replaySeed': 'Powtórz ten seed',
    'runSummary.exit': 'Menu Główne',
    'runSummary.downloadLog': '💾 Pobierz Log (JSON)',

    'combat.endTurn': 'Koniec Tury',
    'combat.hp': '❤️ Krzepa: ',
    'combat.block': '🛡️ Garda: ',
    'combat.energy': 'Oscypki: ',
    'combat.currency': 'Dutki: ',
    'combat.piles': 'Stosy kart',
    'combat.drawPile': 'Talia dociągu',
    'combat.discardPile': 'Karty odrzucone',
    'combat.exhaustPile': 'Karty przepadłe',
    'combat.relicsLabel': 'Pamiątki:',
    'combat.relicsAria': 'Zebrane Pamiątki',

    'library.title': 'Biblioteka Tatrzańska',
    'library.subtitle': 'Spis kart i pamiątek z tej wyprawy przez Tatry.',
    'library.tabCards': 'Karty',
    'library.tabRelics': 'Pamiątki',
    'library.tabMaryna': 'Dary Maryny',
    'library.filterAll': 'Wszystkie',
    'library.filterCommon': 'Powszechne',
    'library.filterUncommon': 'Niepowszechne',
    'library.filterRare': 'Rzadkie',
    'library.tabsAria': 'Typ przedmiotów',
    'library.filtersAria': 'Filtrowanie rzadkości',
    'library.backBtn': 'Wróć do bazy',

    'changelog.title': 'Dziennik Zmian',
    'common.close': 'Zamknij',
    'common.copySeed': 'Skopiuj seed',
    'common.copySeedTitle': 'Kliknij, aby skopiować seed',
  },
  en: {
    'common.on': 'ON',
    'common.off': 'OFF',
    'language.pl': 'Polski',
    'language.en': 'English',

    'title.kicker': 'A highlander adventure for the patient',
    'title.subtitle': 'Help Jedrek reclaim peace on the mountain trail!',
    'title.menuAria': 'Main menu',
    'title.normal': 'Standard Mode (New Game)',
    'title.tutorial': 'Tutorial',
    'title.hard': 'Marek Mode 🌶️',
    'title.options': 'Options',
    'title.library': 'Library',
    'title.difficultyHint': 'In Marek Mode enemies get stronger after every battle!',
    'title.releaseNotesPrefix': "What's new?",

    'options.title': 'Options',
    'options.menuMusic': 'Menu Music',
    'options.gameMusic': 'Game Music',
    'options.skipIntro': 'Skip Intro',
    'options.textSize': 'Text Size',
    'options.analytics': 'Game Analytics',
    'options.language': 'Language',
    'options.backMain': 'Back to Main Menu',
    'options.textSize.normal': 'NORMAL',
    'options.textSize.large': 'LARGE',
    'options.textSize.xlarge': 'X-LARGE',
    'options.textSizeAria': 'Text size: {label}',

    'confirm.backToMenu': 'Return to main menu? The current run will be reset.',

    'map.title': 'Tatra Trail',
    'map.hardBadge': 'HARD',
    'map.newPath': 'New Route',
    'map.goNext': 'Continue',

    'runSummary.win': '🏔️ VICTORY!',
    'runSummary.loss': '💀 RUN OVER',
    'runSummary.killedBy': 'Defeated by: {name}',
    'runSummary.floor': 'Floor:',
    'runSummary.dutki': 'Dutki Collected:',
    'runSummary.turns': 'Turns:',
    'runSummary.relicsTitle': 'Relics',
    'runSummary.deckTitle': 'Final Deck',
    'runSummary.noDeck': 'No cards in the final deck.',
    'runSummary.noRelics': 'No relics collected.',
    'runSummary.replay': 'Play Again',
    'runSummary.replaySeed': 'Replay This Seed',
    'runSummary.exit': 'Main Menu',
    'runSummary.downloadLog': '💾 Download Log (JSON)',

    'combat.endTurn': 'End Turn',
    'combat.hp': '❤️ HP: ',
    'combat.block': '🛡️ Block: ',
    'combat.energy': 'Oscypki: ',
    'combat.currency': 'Dutki: ',
    'combat.piles': 'Card Piles',
    'combat.drawPile': 'Draw Pile',
    'combat.discardPile': 'Discard Pile',
    'combat.exhaustPile': 'Exhaust Pile',
    'combat.relicsLabel': 'Relics:',
    'combat.relicsAria': 'Collected Relics',

    'library.title': 'Tatra Library',
    'library.subtitle': 'Cards and relics from this Tatra expedition.',
    'library.tabCards': 'Cards',
    'library.tabRelics': 'Relics',
    'library.tabMaryna': "Maryna's Gifts",
    'library.filterAll': 'All',
    'library.filterCommon': 'Common',
    'library.filterUncommon': 'Uncommon',
    'library.filterRare': 'Rare',
    'library.tabsAria': 'Item type',
    'library.filtersAria': 'Rarity filter',
    'library.backBtn': 'Back to base',

    'changelog.title': 'Changelog',
    'common.close': 'Close',
    'common.copySeed': 'Copy seed',
    'common.copySeedTitle': 'Click to copy seed',
  },
};

/**
 * Translates a UI string key for the active language.
 * Falls back to Polish when key is missing in the selected language.
 * @param {LanguageCode} language
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @returns {string}
 */
export function t(language, key, params = {}) {
  const langBucket = UI_TRANSLATIONS[language] ?? UI_TRANSLATIONS.pl;
  const template = langBucket[key] ?? UI_TRANSLATIONS.pl[key] ?? key;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token) =>
    String(params[token] ?? `{${token}}`)
  );
}
