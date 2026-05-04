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
    'title.pwaInstall': '📲 Zainstaluj',
    'title.pwaForceLandscape': '↔ Wymuś poziom',
    'title.disclaimerBtn': 'ⓘ Parodia',
    'title.disclaimerText':
      'Usiec Cepra to darmowa parodia gry Slay the Spire. Projekt ma charakter wyłącznie humorystyczny i nie ma na celu nikogo obrazić, ani nie przedstawia prawdziwych ludzi i wydarzeń.',

    'pwa.installTitle': 'Zainstaluj jako aplikację',
    'pwa.installPrompt':
      'Kliknij poniższy przycisk, aby dodać Usiec Cepra do pulpitu - bez sklepu z aplikacjami, działa offline.',
    'pwa.installNow': '⬇ Zainstaluj',
    'pwa.iosTitle': 'Zainstaluj na iPhone / iPad',
    'pwa.iosStep1': 'Otwórz w Safari (nie Chrome/Firefox)',
    'pwa.iosStep2': 'Stuknij ikonę Udostępnij □↑ na dole',
    'pwa.iosStep3': 'Wybierz "Dodaj do ekranu głównego"',
    'pwa.iosStep4': 'Stuknij "Dodaj"',
    'pwa.iosFooter': 'Gra pojawi się jako ikona i będzie działać bez przeglądarki.',
    'pwa.androidStep1': 'Android (Chrome): menu ⋮ -> "Dodaj do ekranu głównego" / "Zainstaluj"',
    'pwa.androidStep2': 'Android (Firefox): menu ⋮ -> "Zainstaluj"',
    'pwa.desktopStep': 'Komputer (Chrome/Edge): ikona ⊕ w pasku adresu -> "Zainstaluj"',
    'pwa.footer': 'Po instalacji gra działa offline i bez paska przeglądarki.',
    'pwa.forceLandscapeAria': 'Wymuś widok poziomy',
    'pwa.landscapeAlreadyTitle': 'Widok poziomy jest już aktywny.',
    'pwa.landscapeAlreadyBody': 'Możesz od razu grać w układzie poziomym.',
    'pwa.landscapeAttemptTitle': 'Próba przejścia do poziomu wykonana.',
    'pwa.landscapeAttemptBody': 'Jeśli ekran nie obrócił się automatycznie, obróć telefon ręcznie.',
    'pwa.fullscreenEnabled': 'Uruchomiono pełny ekran.',
    'pwa.fullscreenUnavailable': 'Pełny ekran nie jest dostępny na tym urządzeniu.',
    'pwa.forceUnavailableTitle': 'Automatyczne wymuszenie poziomu niedostępne.',
    'pwa.forceUnavailableBody': 'Obróć telefon ręcznie, aby grać wygodnie.',

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

    'maryna.title': 'Wyprawka od Maryny',
    'maryna.description': 'Stara Maryna wyciąga z torby trzy prezenty. Wybierz jeden.',
    'maryna.choose': 'Wybierz',
    'maryna.boonRarity': 'Błogosławieństwo Maryny',

    'tutorial.exit': 'Wyjdź',
    'tutorial.speaker': 'Jędrek mówi',
    'tutorial.ack': 'Zrozumiałem',
    'tutorial.repeat': 'POWTÓRZ OD POCZĄTKU',
    'tutorial.finish': 'NIE, JEDZIEMY Z TYM KOKSEM!',
    'tutorial.rewardChooseCard': 'Zdobyłeś kartę! Wybierz jedną:',

    'seeded.title': 'Podany Seed',
    'seeded.hint': 'Podaj seed (1-8 znaków hex), aby zagrać identyczny przebieg z innym graczem.',
    'seeded.placeholder': 'np. deadbeef',
    'seeded.error': 'Nieprawidłowy seed - użyj 1-8 znaków hex (0-9, a-f).',
    'seeded.start': 'Start',
    'seeded.cancel': 'Anuluj',

    'pwaUpdate.updating': 'Aktualizowanie...',
    'pwaUpdate.readyTitle': 'Nowa wersja aplikacji jest gotowa',
    'pwaUpdate.readyBody': 'Zaktualizuj Usiec Cepra, aby pobrać najnowsze poprawki i zawartość.',
    'pwaUpdate.updateNow': '⬆ Zaktualizuj teraz',
    'pwaUpdate.updateApp': '⬆ Zaktualizuj aplikację',
    'pwaUpdate.updateBadge': '⬆ Aktualizacja',
    'pwaUpdate.requiredTitle': 'Dostępna jest obowiązkowa aktualizacja',
    'pwaUpdate.requiredText':
      'Ta wersja aplikacji jest już nieaktualna. Zaktualizuj Usiec Cepra teraz, aby kontynuować grę na najnowszym wydaniu.',

    'viewport.mobileTitle': 'Obróć telefon do pionu',
    'viewport.mobileText':
      'Ta gra działa tylko w orientacji pionowej. Obróć urządzenie, aby kontynuować.',
    'viewport.desktopTitle': 'Okno jest za niskie',
    'viewport.desktopText':
      'Ten widok jest zbyt szeroki i zbyt niski dla wygodnej gry. Zwiększ wysokość okna albo zmniejsz jego szerokość, aby wrócić do rozgrywki.',

    'actIntro.motifAria': 'Góralski motyw dekoracyjny',

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
    'title.pwaInstall': '📲 Install',
    'title.pwaForceLandscape': '↔ Force landscape',
    'title.disclaimerBtn': 'ⓘ Parody',
    'title.disclaimerText':
      'Usiec Cepra is a free parody of Slay the Spire. This project is purely humorous, does not aim to offend anyone, and does not depict real people or events.',

    'pwa.installTitle': 'Install as an app',
    'pwa.installPrompt':
      'Click the button below to add Usiec Cepra to your home screen - no app store required, works offline.',
    'pwa.installNow': '⬇ Install',
    'pwa.iosTitle': 'Install on iPhone / iPad',
    'pwa.iosStep1': 'Open in Safari (not Chrome/Firefox)',
    'pwa.iosStep2': 'Tap the Share icon □↑ at the bottom',
    'pwa.iosStep3': 'Choose "Add to Home Screen"',
    'pwa.iosStep4': 'Tap "Add"',
    'pwa.iosFooter': 'The game will appear as an icon and run outside the browser.',
    'pwa.androidStep1': 'Android (Chrome): menu ⋮ -> "Add to Home screen" / "Install"',
    'pwa.androidStep2': 'Android (Firefox): menu ⋮ -> "Install"',
    'pwa.desktopStep': 'Desktop (Chrome/Edge): click the ⊕ icon in the address bar -> "Install"',
    'pwa.footer': 'After installation, the game works offline and without browser chrome.',
    'pwa.forceLandscapeAria': 'Force landscape mode',
    'pwa.landscapeAlreadyTitle': 'Landscape mode is already active.',
    'pwa.landscapeAlreadyBody': 'You can play in horizontal layout right away.',
    'pwa.landscapeAttemptTitle': 'Landscape switch attempt completed.',
    'pwa.landscapeAttemptBody':
      'If the screen did not rotate automatically, rotate your phone manually.',
    'pwa.fullscreenEnabled': 'Fullscreen was enabled.',
    'pwa.fullscreenUnavailable': 'Fullscreen is not available on this device.',
    'pwa.forceUnavailableTitle': 'Automatic landscape forcing is unavailable.',
    'pwa.forceUnavailableBody': 'Rotate your phone manually for comfortable play.',

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

    'maryna.title': "Maryna's Starter Gift",
    'maryna.description': 'Old Maryna pulls three gifts from her bag. Choose one.',
    'maryna.choose': 'Choose',
    'maryna.boonRarity': "Maryna's Blessing",

    'tutorial.exit': 'Exit',
    'tutorial.speaker': 'Jędrek says',
    'tutorial.ack': 'Got it',
    'tutorial.repeat': 'REPEAT FROM START',
    'tutorial.finish': "NO, LET'S GO!",
    'tutorial.rewardChooseCard': 'You got a card! Choose one:',

    'seeded.title': 'Custom Seed',
    'seeded.hint': 'Enter a seed (1-8 hex chars) to play the exact same run as another player.',
    'seeded.placeholder': 'e.g. deadbeef',
    'seeded.error': 'Invalid seed - use 1-8 hex characters (0-9, a-f).',
    'seeded.start': 'Start',
    'seeded.cancel': 'Cancel',

    'pwaUpdate.updating': 'Updating...',
    'pwaUpdate.readyTitle': 'A new app version is ready',
    'pwaUpdate.readyBody': 'Update Usiec Cepra to get the latest fixes and content.',
    'pwaUpdate.updateNow': '⬆ Update now',
    'pwaUpdate.updateApp': '⬆ Update app',
    'pwaUpdate.updateBadge': '⬆ Update',
    'pwaUpdate.requiredTitle': 'A mandatory update is available',
    'pwaUpdate.requiredText':
      'This app version is outdated. Update Usiec Cepra now to continue on the latest release.',

    'viewport.mobileTitle': 'Rotate your phone to portrait',
    'viewport.mobileText':
      'This game works only in portrait orientation. Rotate your device to continue.',
    'viewport.desktopTitle': 'Window is too short',
    'viewport.desktopText':
      'This view is too wide and too short for comfortable play. Increase window height or reduce width to continue playing.',

    'actIntro.motifAria': 'Highlander decorative motif',

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
