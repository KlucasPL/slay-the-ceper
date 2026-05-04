import { cardLibrary, startingDeck, getCardDefinition } from '../data/cards.js';
import { relicLibrary } from '../data/relics.js';
import { releaseNotesData } from '../data/releaseNotes.js';
import { ActIntroOverlay } from './overlays/ActIntroOverlay.js';
import {
  getSkipIntro,
  setSkipIntro,
  getLanguage,
  setLanguage,
  getTextSizePreset,
  setTextSizePreset,
  getTextSizeScale,
  getAnalyticsEnabled,
  setAnalyticsEnabled,
} from '../logic/settings.js';
import { t as translateUi } from './helpers/I18n.js';
import { localizeGameText } from './helpers/ContentI18n.js';
import * as uiHelpers from './helpers/UIHelpers.js';
import * as cardRenderer from './renderers/CardRenderer.js';
import * as statusRenderer from './renderers/StatusRenderer.js';
import * as pileViewerRenderer from './renderers/PileViewerRenderer.js';
import { localizeIntentText } from './helpers/EnemyI18n.js';
import * as mapRenderer from './renderers/MapRenderer.js';
import * as shopRenderer from './renderers/ShopRenderer.js';
import * as rewardRenderer from './renderers/RewardRenderer.js';
import * as eventRenderer from './renderers/EventRenderer.js';
import * as libraryRenderer from './renderers/LibraryRenderer.js';
import * as campfireOverlay from './overlays/CampfireOverlay.js';
import * as marynaOverlay from './overlays/MarynaOverlay.js';
import * as combatUI from './combat/CombatUI.js';
import * as tutorialUI from './tutorial/TutorialUI.js';
import * as cardZoomOverlay from './overlays/CardZoomOverlay.js';
import * as handViewOverlay from './overlays/HandViewOverlay.js';

export class UIManager {
  /**
   * @param {import('../state/GameState.js').GameState} state
   * @param {import('../logic/AudioManager.js').AudioManager} audioManager
   */
  constructor(state, audioManager) {
    this.state = state;
    this.audioManager = audioManager;
    /** @type {boolean} */
    this.isAnimating = false;
    /** @type {boolean} */
    this.campfireUsed = false;
    /** @type {string} */
    this.mapMessage = '';
    /** @type {(() => void) | null} */
    this.pendingBattleRelicClaimAction = null;
    /** @type {'cards' | 'relics'} */
    this.libraryTab = 'cards';
    /** @type {'all' | 'common' | 'uncommon' | 'rare'} */
    this.libraryRarityFilter = 'all';
    /** @type {string | null} */
    this.pendingEventFallbackEnemyId = null;
    /** @type {boolean} */
    this.isPileViewerOpen = false;
    /** @type {'draw' | 'discard' | 'exhaust' | null} */
    this.activePileViewer = null;
    /** @type {ActIntroOverlay} */
    this.actIntroOverlay = new ActIntroOverlay();
    /** @type {boolean} */
    this.isActIntroPlaying = false;
    /** @type {boolean} */
    this.isTutorialMode = false;
    /** @type {boolean} */
    this.isTutorialGuidanceActive = false;
    /** @type {number} */
    this.tutorialStepIndex = 0;
    /** @type {Element[]} */
    this.tutorialFocusedElements = [];
    /** @type {ResizeObserver | null} */
    this.cardDescResizeObserver = null;
    /** @type {number | null} */
    this.cardDescFitRaf = null;
    /** @type {'pl' | 'en'} */
    this.language = getLanguage();
  }

  /**
   * @param {string} key
   * @param {Record<string, string | number>} [params]
   * @returns {string}
   */
  t(key, params = {}) {
    return translateUi(this.language, key, params);
  }

  /**
   * @param {string} text
   * @returns {string}
   */
  localizeText(text) {
    return localizeGameText(this.language, text);
  }

  /**
   * Binds DOM events and performs the initial render.
   */
  init() {
    const titleScreen = document.getElementById('title-screen');
    const unlockMenuMusic = () => {
      if (this.state.currentScreen !== 'title') return;
      this.audioManager.unlockAndPlayMenu();
    };
    titleScreen?.addEventListener('click', unlockMenuMusic);
    titleScreen?.addEventListener('pointerdown', unlockMenuMusic);

    const cornerOptionsBtn = document.getElementById('corner-options-btn');
    if (cornerOptionsBtn)
      cornerOptionsBtn.addEventListener('click', () => this._openOptionsModal());

    document
      .getElementById('title-btn-normal')
      .addEventListener('click', () => this._handleTitleStart('normal'));
    document
      .getElementById('title-btn-hard')
      .addEventListener('click', () => this._handleTitleStart('hard'));
    document
      .getElementById('title-btn-tutorial')
      .addEventListener('click', () => this._handleTutorialStart());
    document
      .getElementById('title-btn-normal')
      .addEventListener('mouseenter', unlockMenuMusic, { passive: true });
    document
      .getElementById('title-btn-hard')
      .addEventListener('mouseenter', unlockMenuMusic, { passive: true });
    document.getElementById('title-btn-normal').addEventListener('focus', unlockMenuMusic);
    document.getElementById('title-btn-hard').addEventListener('focus', unlockMenuMusic);
    document
      .getElementById('title-btn-library')
      .addEventListener('click', () => this._openLibraryOverlay());
    document
      .getElementById('btn-release-notes')
      .addEventListener('click', () => this._openReleaseNotesModal());
    document
      .getElementById('title-btn-options')
      .addEventListener('click', () => this._openOptionsModal());
    const titleDisclaimerBtn = document.getElementById('title-disclaimer-btn');
    const titleDisclaimerPanel = document.getElementById('title-disclaimer-panel');
    titleDisclaimerBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!titleDisclaimerPanel) return;
      const isHidden = titleDisclaimerPanel.classList.contains('hidden');
      titleDisclaimerPanel.classList.toggle('hidden', !isHidden);
      titleDisclaimerBtn.setAttribute('aria-expanded', String(isHidden));
    });
    document.addEventListener('click', (event) => {
      if (!titleDisclaimerPanel || !titleDisclaimerBtn) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.title-disclaimer-widget')) return;
      titleDisclaimerPanel.classList.add('hidden');
      titleDisclaimerBtn.setAttribute('aria-expanded', 'false');
    });

    this._initPwaWidget();
    this._initPwaUpdateWidget();

    document
      .querySelector('#release-notes-modal .close-btn')
      .addEventListener('click', () => this._closeReleaseNotesModal());
    document
      .querySelector('#release-notes-modal .close-btn')
      .addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this._closeReleaseNotesModal();
        }
      });
    document.getElementById('release-notes-modal').addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        this._closeReleaseNotesModal();
      }
    });
    document
      .querySelector('#options-modal .close-btn')
      .addEventListener('click', () => this._closeOptionsModal());
    document.getElementById('options-modal').addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        this._closeOptionsModal();
      }
    });
    document
      .getElementById('option-menu-music-btn')
      ?.addEventListener('click', () => this._toggleMenuMusicOption());
    document
      .getElementById('option-game-music-btn')
      ?.addEventListener('click', () => this._toggleGameMusicOption());
    document
      .getElementById('option-skip-intro-btn')
      ?.addEventListener('click', () => this._toggleSkipIntroOption());
    document
      .getElementById('option-text-size-btn')
      ?.addEventListener('click', () => this._cycleTextSizeOption());
    document
      .getElementById('option-language-btn')
      ?.addEventListener('click', () => this._toggleLanguageOption());
    document
      .getElementById('option-analytics-btn')
      ?.addEventListener('click', () => this._toggleAnalyticsOption());
    document
      .getElementById('option-back-main-btn')
      ?.addEventListener('click', () => this._returnToMainMenuFromOptions());
    document
      .getElementById('tutorial-ack-btn')
      ?.addEventListener('click', () => this._handleTutorialAcknowledge());
    document.getElementById('tutorial-exit-btn')?.addEventListener('click', () => {
      this._finishTutorialMode();
    });
    document
      .getElementById('tutorial-repeat-btn')
      ?.addEventListener('click', () => this._handleTutorialRepeat());
    document
      .getElementById('tutorial-finish-btn')
      ?.addEventListener('click', () => this._handleTutorialFinish());
    document.getElementById('end-turn-btn').addEventListener('click', () => this._handleEndTurn());
    document
      .getElementById('map-continue-btn')
      .addEventListener('click', () => this._handleMapAdvance());
    // Removed legacy campfire button listeners (now handled dynamically)
    document
      .getElementById('random-event-continue-btn')
      .addEventListener('click', () => this._continueAfterRandomEvent());
    // Removed legacy campfire button listeners (now handled dynamically)
    document
      .getElementById('library-tab-cards')
      .addEventListener('click', () => this._setLibraryTab('cards'));
    document
      .getElementById('library-tab-relics')
      .addEventListener('click', () => this._setLibraryTab('relics'));
    document
      .getElementById('library-tab-maryna')
      .addEventListener('click', () => this._setLibraryTab('maryna'));
    document.querySelectorAll('.library-filter').forEach((filterBtn) => {
      filterBtn.addEventListener('click', () => {
        const rarity = filterBtn.dataset.rarity;
        if (rarity === 'all' || rarity === 'common' || rarity === 'uncommon' || rarity === 'rare') {
          this._setLibraryFilter(rarity);
        }
      });
    });
    document
      .getElementById('library-back-btn')
      .addEventListener('click', () => this._closeLibraryOverlay());
    document
      .getElementById('run-summary-replay-btn')
      .addEventListener('click', () => this._handleRunSummaryReplay());
    document
      .getElementById('run-summary-exit-btn')
      .addEventListener('click', () => this._handleRunSummaryExit());
    document
      .getElementById('weather-indicator')
      .addEventListener('click', (event) => this._toggleWeatherTooltip(event.currentTarget));
    document.getElementById('draw-pile-btn')?.addEventListener('click', () => {
      this._openPileViewer('draw');
    });
    document.getElementById('discard-pile-btn')?.addEventListener('click', () => {
      this._openPileViewer('discard');
    });
    document.getElementById('exhaust-pile-btn')?.addEventListener('click', () => {
      this._openPileViewer('exhaust');
    });
    document.getElementById('pile-viewer-close')?.addEventListener('click', () => {
      this._closePileViewer();
    });
    document.getElementById('pile-viewer-overlay')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        this._closePileViewer();
      }
    });
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        (!target.closest('.status-tag-hint') && !target.closest('.weather-hint-trigger'))
      ) {
        this._closeStatusTooltips();
        this._closeWeatherTooltips();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isPileViewerOpen) {
        this._closePileViewer();
      }
    });
    document.addEventListener(
      'click',
      (event) => {
        if (!this._isInputLocked() || !this.isActIntroPlaying) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest('#act-intro-overlay')) return;
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
    document.addEventListener(
      'click',
      (event) => {
        if (this._isTutorialInteractionAllowed(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
    document.addEventListener(
      'keydown',
      (event) => {
        if (!this.isTutorialGuidanceActive) return;
        if (event.key === 'Tab') return;
        if (event.key === 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
    window.addEventListener('resize', () => this._renderTutorialOverlay());
    window.addEventListener('resize', () => this._queueCardDescFit());
    this._setupCardDescriptionAutoFit();
    cardZoomOverlay.initCardZoomOverlay();
    handViewOverlay.initHandViewOverlay();
    document.getElementById('hand-view-close-btn')?.addEventListener('click', () => {
      handViewOverlay.closeHandView();
    });
    document.getElementById('hand-view-btn')?.addEventListener('click', () => {
      this._openHandViewOverlay();
    });
    handViewOverlay.initHandViewOverlay();
    document.getElementById('hand-view-close-btn')?.addEventListener('click', () => {
      handViewOverlay.closeHandView();
    });
    document.getElementById('hand-view-btn')?.addEventListener('click', () => {
      this._openHandViewOverlay();
    });
    handViewOverlay.initHandViewOverlay();
    document.getElementById('hand-view-close-btn')?.addEventListener('click', () => {
      handViewOverlay.closeHandView();
    });
    document.getElementById('hand-view-btn')?.addEventListener('click', () => {
      this._openHandViewOverlay();
    });
    this._applyTextSizePreference();
    this._applyLanguageToStaticUi();
    this._renderReleaseNotesButtonLabel();
    this._renderReleaseNotes();
    this._renderAudioOptions();
    this.updateUI();
    this._syncScreenState();
    if (this.state.currentScreen === 'battle') {
      this._playEncounterMusic();
    }
    this._renderCornerOptionsButton();
    this._initSeedHud();
    this._initSeededRunModal();
    document
      .getElementById('run-summary-replay-seed-btn')
      ?.addEventListener('click', () => this._handleRunSummaryReplaySeed());
  }

  _renderReleaseNotesButtonLabel() {
    const releaseNotesBtn = document.getElementById('btn-release-notes');
    if (!releaseNotesBtn) return;

    const latestVersion = releaseNotesData[0]?.version?.split(' - ')[0];
    releaseNotesBtn.textContent = latestVersion
      ? `📜 ${this.t('title.releaseNotesPrefix')} (${latestVersion})`
      : `📜 ${this.t('title.releaseNotesPrefix')}`;
  }

  _applyLanguageToStaticUi() {
    document.documentElement.lang = this.language;

    const assignText = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.textContent = this.t(key);
    };

    assignText('title-kicker', 'title.kicker');
    assignText('title-subtitle', 'title.subtitle');
    assignText('title-btn-normal', 'title.normal');
    assignText('title-btn-tutorial', 'title.tutorial');
    assignText('title-btn-hard', 'title.hard');
    assignText('title-btn-options', 'title.options');
    assignText('title-btn-library', 'title.library');
    assignText('title-difficulty-hint', 'title.difficultyHint');

    const nav = document.getElementById('title-menu-nav');
    if (nav) nav.setAttribute('aria-label', this.t('title.menuAria'));

    assignText('options-title', 'options.title');
    assignText('option-menu-music-label', 'options.menuMusic');
    assignText('option-game-music-label', 'options.gameMusic');
    assignText('option-skip-intro-label', 'options.skipIntro');
    assignText('option-text-size-label', 'options.textSize');
    assignText('option-language-label', 'options.language');
    assignText('option-analytics-label', 'options.analytics');
    assignText('option-back-main-btn', 'options.backMain');

    const optionsCloseBtn = document.getElementById('options-close-btn');
    if (optionsCloseBtn) {
      optionsCloseBtn.setAttribute('aria-label', this.language === 'pl' ? 'Zamknij' : 'Close');
    }

    assignText('run-summary-floor-label', 'runSummary.floor');
    assignText('run-summary-dutki-label', 'runSummary.dutki');
    assignText('run-summary-turns-label', 'runSummary.turns');
    assignText('run-summary-relics-title', 'runSummary.relicsTitle');
    assignText('run-summary-deck-title', 'runSummary.deckTitle');
    assignText('run-summary-replay-btn', 'runSummary.replay');
    assignText('run-summary-replay-seed-btn', 'runSummary.replaySeed');
    assignText('run-summary-exit-btn', 'runSummary.exit');

    // Combat UI labels
    assignText('end-turn-btn', 'combat.endTurn');
    assignText('p-hp-label', 'combat.hp');
    assignText('p-block-label', 'combat.block');
    assignText('e-hp-label', 'combat.hp');
    assignText('e-block-label', 'combat.block');
    assignText('energy-label', 'combat.energy');
    assignText('dutki-label', 'combat.currency');
    assignText('relics-label-text', 'combat.relicsLabel');
    assignText('pile-viewer-close', 'common.close');

    const setAria = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('aria-label', this.t(key));
    };
    setAria('relics-wrap', 'combat.relicsAria');
    setAria('pile-controls', 'combat.piles');
    setAria('draw-pile-btn', 'combat.drawPile');
    setAria('discard-pile-btn', 'combat.discardPile');
    setAria('exhaust-pile-btn', 'combat.exhaustPile');
    setAria('seed-hud', 'common.copySeed');

    const seedHud = document.getElementById('seed-hud');
    if (seedHud) seedHud.title = this.t('common.copySeedTitle');

    // Changelog modal
    assignText('release-notes-title', 'changelog.title');

    // Library UI
    assignText('library-title', 'library.title');
    assignText('library-subtitle', 'library.subtitle');
    assignText('library-tab-cards-label', 'library.tabCards');
    assignText('library-tab-relics-label', 'library.tabRelics');
    assignText('library-tab-maryna-label', 'library.tabMaryna');
    assignText('library-filter-all-label', 'library.filterAll');
    assignText('library-filter-common-label', 'library.filterCommon');
    assignText('library-filter-uncommon-label', 'library.filterUncommon');
    assignText('library-filter-rare-label', 'library.filterRare');
    assignText('library-back-label', 'library.backBtn');
    const libraryTabsEl = document.querySelector('.library-tabs');
    if (libraryTabsEl) libraryTabsEl.setAttribute('aria-label', this.t('library.tabsAria'));
    const libraryFiltersEl = document.querySelector('.library-filters');
    if (libraryFiltersEl)
      libraryFiltersEl.setAttribute('aria-label', this.t('library.filtersAria'));

    this._renderReleaseNotesButtonLabel();
  }

  _renderCornerOptionsButton() {
    const btn = document.getElementById('corner-options-btn');
    if (!btn) return;

    const showOutsideTitle = this.state.currentScreen !== 'title';
    btn.classList.toggle('hidden', !showOutsideTitle);
    btn.setAttribute('aria-hidden', String(!showOutsideTitle));
    btn.disabled = !showOutsideTitle;
    this._renderSeedHud();
  }

  _renderSeedHud() {
    const hud = document.getElementById('seed-hud');
    const val = document.getElementById('seed-hud-value');
    if (!hud || !val) return;
    const show = this.state.currentScreen !== 'title' && !!this.state.runSeed;
    hud.classList.toggle('hidden', !show);
    if (show) val.textContent = this.state.runSeed;
  }

  _initSeedHud() {
    document.getElementById('seed-hud')?.addEventListener('click', () => {
      const seed = this.state.runSeed;
      if (!seed) return;
      navigator.clipboard?.writeText(seed).catch(() => {});
      const hud = document.getElementById('seed-hud');
      if (!hud) return;
      hud.classList.add('seed-hud--copied');
      setTimeout(() => hud.classList.remove('seed-hud--copied'), 1200);
    });
  }

  _initSeededRunModal() {
    document.getElementById('title-btn-seeded')?.addEventListener('click', () => {
      const modal = document.getElementById('seeded-run-modal');
      if (!modal) return;
      modal.classList.remove('hidden');
      document.getElementById('seeded-run-input')?.focus();
    });
    document.getElementById('seeded-run-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('seeded-run-modal')?.classList.add('hidden');
    });
    document.getElementById('seeded-run-confirm-btn')?.addEventListener('click', () => {
      this._startSeededRun();
    });
    document.getElementById('seeded-run-input')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this._startSeededRun();
      if (event.key === 'Escape')
        document.getElementById('seeded-run-modal')?.classList.add('hidden');
    });
  }

  _startSeededRun(difficulty = 'normal') {
    const input = /** @type {HTMLInputElement | null} */ (
      document.getElementById('seeded-run-input')
    );
    const errorEl = document.getElementById('seeded-run-error');
    const raw = input?.value?.trim() ?? '';
    if (!/^[0-9a-fA-F]{1,8}$/.test(raw)) {
      errorEl?.classList.remove('hidden');
      input?.focus();
      return;
    }
    errorEl?.classList.add('hidden');
    // Move focus out of the soon-to-be aria-hidden title-screen subtree.
    input?.blur();
    document.getElementById('seeded-run-modal')?.classList.add('hidden');
    this.startSeededRun(raw, difficulty);
  }

  /**
   * Start a seeded run with a pre-validated hex seed. Used by the modal input path
   * and by the ?seed=<hex> URL param handler in main.js.
   * @param {string} seedHex  1–8 hex characters
   * @param {'normal'|'hard'} [difficulty]
   */
  startSeededRun(seedHex, difficulty = 'normal') {
    if (this._isInputLocked()) return;
    if (this.isTutorialMode) {
      this._disableTutorialGuidance();
      this.isTutorialMode = false;
    }
    this._closeReleaseNotesModal();
    this.state.difficulty = difficulty;
    this.state.enemyScaleFactor = 1.0;
    this.mapMessage = '';
    this.state.beginSeededRun(seedHex, startingDeck);
    this.state.currentScreen = 'map';
    this.state.hasStartedFirstBattle = false;
    this.audioManager.setContext('inGame');
    this._openMapOverlay();
    this._onActChange();
    const titleScreen = document.getElementById('title-screen');
    if (!titleScreen || titleScreen.classList.contains('hidden')) return;
    titleScreen.classList.add('is-hiding');
    titleScreen.setAttribute('aria-hidden', 'true');
    setTimeout(() => titleScreen.classList.add('hidden'), 450);
  }

  _handleRunSummaryReplaySeed() {
    if (this._isInputLocked()) return;
    const seed = this.state.runSeed;
    if (!seed) return;
    this._hideOverlay('run-summary-overlay');
    this.audioManager.clearDefeatThemeLock();
    this.state.difficulty = this.state.difficulty ?? 'normal';
    this.state.enemyScaleFactor = 1.0;
    this.state.hasStartedFirstBattle = false;
    this.state.currentScreen = 'map';
    this.mapMessage = '';
    this.state.beginSeededRun(seed, startingDeck);
    this._openMapOverlay();
    this.updateUI();
    this._onActChange();
  }

  /**
   * Re-renders all stat displays, statuses, and the card hand.
   */
  updateUI() {
    const { player, enemy, deck, discard, exhaust } = this.state;
    this._renderEnemyPresentation();
    this._renderWeatherIndicator();
    this._renderRelics();
    document.getElementById('p-hp').textContent = player.hp;
    document.getElementById('p-max-hp').textContent = player.maxHp;
    const hpLine = document.getElementById('p-hp-line');
    hpLine.classList.toggle('low-hp', player.hp / player.maxHp < 0.3);
    document.getElementById('p-block').textContent = player.block;
    document.getElementById('e-hp').textContent = enemy.hp;
    document.getElementById('e-max-hp').textContent = enemy.maxHp;
    document.getElementById('e-block').textContent = enemy.block;
    document.getElementById('energy').textContent = player.energy;
    document.getElementById('dutki').textContent = this.state.dutki;
    const enemyIntentEl = document.getElementById('e-intent');
    enemyIntentEl.textContent = localizeIntentText(this.language, this.state.getEnemyIntentText());
    enemyIntentEl.title =
      this.language === 'en'
        ? 'Damage shown accounts for your current Garda.'
        : 'Wartość zamiaru uwzględnia Twoją aktualną Gardę.';
    document.getElementById('draw-pile-count').textContent = deck.length;
    document.getElementById('discard-pile-count').textContent = discard.length;
    document.getElementById('exhaust-pile-count').textContent = exhaust.length;
    this._renderStatuses('p-statuses', player.status);
    this._renderStatuses('e-statuses', enemy.status);
    this._renderHand();
    const pileControls = document.getElementById('pile-controls');
    if (pileControls) {
      pileControls.classList.toggle('hidden', this.state.currentScreen !== 'battle');
    }
    if (this.state.currentScreen !== 'battle' && this.isPileViewerOpen) {
      this._closePileViewer();
    }
    this._syncEndTurnButtonState();
    this._syncScreenState();
    this._renderCornerOptionsButton();
    const gameWrapper = document.getElementById('game-wrapper');
    if (gameWrapper) {
      gameWrapper.classList.toggle('hard-mode', this.state.difficulty === 'hard');
    }
    this._syncTutorialExitButton();
    this._renderTutorialOverlay();
    this._queueCardDescFit();
  }

  _setupCardDescriptionAutoFit() {
    if (!('ResizeObserver' in window)) return;
    this.cardDescResizeObserver = new ResizeObserver(() => {
      this._queueCardDescFit();
    });

    const hand = document.getElementById('hand');
    const pileGrid = document.getElementById('pile-viewer-grid');
    const gameWrapper = document.getElementById('game-wrapper');

    if (hand) this.cardDescResizeObserver.observe(hand);
    if (pileGrid) this.cardDescResizeObserver.observe(pileGrid);
    if (gameWrapper) this.cardDescResizeObserver.observe(gameWrapper);
  }

  _queueCardDescFit() {
    if (this.cardDescFitRaf !== null) {
      cancelAnimationFrame(this.cardDescFitRaf);
    }

    this.cardDescFitRaf = requestAnimationFrame(() => {
      this.cardDescFitRaf = null;
      this._fitCardDescriptions();
    });
  }

  _fitCardDescriptions() {
    const cardNodes = document.querySelectorAll('.card');
    cardNodes.forEach((cardEl) => {
      this._fitSingleCardDescription(cardEl);
    });
  }

  /**
   * @param {Element} cardNode
   */
  _fitSingleCardDescription(cardNode) {
    if (!(cardNode instanceof HTMLElement)) return;

    const descNode = cardNode.querySelector('.card-desc');
    if (!(descNode instanceof HTMLElement)) return;
    const titleNode = cardNode.querySelector('.card-title');
    const rarityNode = cardNode.querySelector('.card-rarity');
    const iconNode = cardNode.querySelector('.card-icon');

    descNode.classList.remove('card-desc--autoscaled');
    descNode.classList.remove('card-desc--tight');
    descNode.style.removeProperty('font-size');
    titleNode?.style.removeProperty('font-size');
    rarityNode?.style.removeProperty('font-size');
    iconNode?.style.removeProperty('font-size');

    const descStyles = getComputedStyle(descNode);
    const titleStyles = titleNode ? getComputedStyle(titleNode) : null;
    const rarityStyles = rarityNode ? getComputedStyle(rarityNode) : null;
    const iconStyles = iconNode ? getComputedStyle(iconNode) : null;

    const baseFontPx = parseFloat(descStyles.fontSize) || 14;
    const minFromCss = parseFloat(descStyles.getPropertyValue('--card-desc-min-size'));
    const hardMinFromCss = parseFloat(descStyles.getPropertyValue('--card-desc-hard-min-size'));
    const rootFontPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    const minFontPx = Number.isFinite(minFromCss) && minFromCss > 0 ? minFromCss * rootFontPx : 9;
    const hardMinFontPx =
      Number.isFinite(hardMinFromCss) && hardMinFromCss > 0 ? hardMinFromCss * rootFontPx : 8;

    const titleBasePx = titleStyles ? parseFloat(titleStyles.fontSize) || 16 : 0;
    const titleMinRem = titleStyles
      ? parseFloat(titleStyles.getPropertyValue('--card-title-min-size'))
      : NaN;
    const titleHardMinRem = titleStyles
      ? parseFloat(titleStyles.getPropertyValue('--card-title-hard-min-size'))
      : NaN;
    const titleMinPx =
      Number.isFinite(titleMinRem) && titleMinRem > 0 ? titleMinRem * rootFontPx : 12;
    const titleHardMinPx =
      Number.isFinite(titleHardMinRem) && titleHardMinRem > 0 ? titleHardMinRem * rootFontPx : 11;

    const rarityBasePx = rarityStyles ? parseFloat(rarityStyles.fontSize) || 10 : 0;
    const rarityMinRem = rarityStyles
      ? parseFloat(rarityStyles.getPropertyValue('--card-rarity-min-size'))
      : NaN;
    const rarityMinPx =
      Number.isFinite(rarityMinRem) && rarityMinRem > 0 ? rarityMinRem * rootFontPx : 8;

    const iconBasePx = iconStyles ? parseFloat(iconStyles.fontSize) || 24 : 0;
    const iconMinRem = iconStyles
      ? parseFloat(iconStyles.getPropertyValue('--card-icon-min-size'))
      : NaN;
    const iconMinPx = Number.isFinite(iconMinRem) && iconMinRem > 0 ? iconMinRem * rootFontPx : 16;

    let currentFontPx = baseFontPx;
    let currentTitlePx = titleBasePx;
    let currentRarityPx = rarityBasePx;
    let currentIconPx = iconBasePx;

    const step = 0.3;
    const titleStep = 0.25;
    const iconStep = 0.75;

    const hasOverflow = () =>
      descNode.scrollHeight > descNode.clientHeight + 1 ||
      descNode.scrollWidth > descNode.clientWidth + 1;

    const cardHasOverflow = () =>
      cardNode.scrollHeight > cardNode.clientHeight + 1 ||
      cardNode.scrollWidth > cardNode.clientWidth + 1 ||
      hasOverflow();

    while (currentFontPx > minFontPx && cardHasOverflow()) {
      currentFontPx = Math.max(minFontPx, currentFontPx - step);
      descNode.style.fontSize = `${currentFontPx}px`;
    }

    if (cardHasOverflow()) {
      descNode.classList.add('card-desc--tight');

      while (currentFontPx > hardMinFontPx && cardHasOverflow()) {
        currentFontPx = Math.max(hardMinFontPx, currentFontPx - 0.2);
        descNode.style.fontSize = `${currentFontPx}px`;
      }
    }

    if (titleNode) {
      while (currentTitlePx > titleMinPx && cardHasOverflow()) {
        currentTitlePx = Math.max(titleMinPx, currentTitlePx - titleStep);
        titleNode.style.fontSize = `${currentTitlePx}px`;
      }

      while (currentTitlePx > titleHardMinPx && cardHasOverflow()) {
        currentTitlePx = Math.max(titleHardMinPx, currentTitlePx - 0.2);
        titleNode.style.fontSize = `${currentTitlePx}px`;
      }
    }

    if (rarityNode) {
      while (currentRarityPx > rarityMinPx && cardHasOverflow()) {
        currentRarityPx = Math.max(rarityMinPx, currentRarityPx - 0.2);
        rarityNode.style.fontSize = `${currentRarityPx}px`;
      }
    }

    if (iconNode) {
      while (currentIconPx > iconMinPx && cardHasOverflow()) {
        currentIconPx = Math.max(iconMinPx, currentIconPx - iconStep);
        iconNode.style.fontSize = `${currentIconPx}px`;
      }
    }

    if (currentFontPx < baseFontPx) {
      descNode.classList.add('card-desc--autoscaled');
    }
  }

  /**
   * Initialises the PWA install tooltip widget on the title screen.
   */
  _initPwaWidget() {
    const btn = document.getElementById('title-pwa-btn');
    const panel = document.getElementById('title-pwa-panel');
    if (!btn || !panel) return;

    /** @type {BeforeInstallPromptEvent | null} */
    let deferredPrompt = null;

    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobileLike = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const isInStandaloneMode =
      'standalone' in navigator
        ? /** @type {any} */ (navigator).standalone
        : window.matchMedia('(display-mode: standalone)').matches;

    if (isInStandaloneMode) {
      if (!isMobileLike) {
        btn.style.display = 'none';
        return;
      }

      btn.textContent = '↔ Wymuś poziom';
      btn.setAttribute('aria-label', 'Wymuś widok poziomy');
      panel.classList.add('hidden');

      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await this._handleForceLandscapeRequest(panel);
      });

      document.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;
        if (event.target.closest('.title-pwa-widget')) return;
        panel.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      });

      return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = /** @type {BeforeInstallPromptEvent} */ (e);
    });

    window.addEventListener('appinstalled', () => {
      btn.style.display = 'none';
      panel.classList.add('hidden');
    });

    /** @returns {string} */
    const buildPanelHtml = () => {
      if (deferredPrompt) {
        return `<strong>Zainstaluj jako aplikację</strong><br>
Kliknij poniższy przycisk, aby dodać Usiec Cepra do pulpitu – bez sklepu z aplikacjami, działa offline.
<br><button class="pwa-install-btn" id="pwa-native-install-btn">⬇ Zainstaluj</button>`;
      }
      if (isIos) {
        return `<strong>Zainstaluj na iPhone / iPad</strong><ul>
<li>Otwórz w <strong>Safari</strong> (nie Chrome/Firefox)</li>
<li>Stuknij ikonę Udostępnij <strong>□↑</strong> na dole</li>
<li>Wybierz <strong>„Dodaj do ekranu głównego"</strong></li>
<li>Stuknij <strong>„Dodaj"</strong></li>
</ul>
Gra pojawi się jako ikona i będzie działać bez przeglądarki.`;
      }
      return `<strong>Zainstaluj jako aplikację</strong><ul>
<li><strong>Android (Chrome):</strong> menu ⋮ → „Dodaj do ekranu głównego" / „Zainstaluj"</li>
<li><strong>Android (Firefox):</strong> menu ⋮ → „Zainstaluj"</li>
<li><strong>Komputer (Chrome/Edge):</strong> ikona ⊕ w pasku adresu → „Zainstaluj"</li>
</ul>
Po instalacji gra działa offline i bez paska przeglądarki.`;
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.innerHTML = buildPanelHtml();
        panel.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
        const nativeBtn = document.getElementById('pwa-native-install-btn');
        if (nativeBtn && deferredPrompt) {
          nativeBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            panel.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
          });
        }
      } else {
        panel.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.closest('.title-pwa-widget')) return;
      panel.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * Best-effort mobile PWA action to switch gameplay into horizontal view.
   * Attempts fullscreen and landscape orientation request when browser supports it.
   *
   * @param {HTMLElement} panel
   * @returns {Promise<void>}
   */
  async _handleForceLandscapeRequest(panel) {
    const btn = document.getElementById('title-pwa-btn');
    if (!btn) return;

    const orientationQuery = window.matchMedia('(orientation: landscape)');
    if (orientationQuery.matches) {
      panel.innerHTML =
        '<strong>Widok poziomy jest już aktywny.</strong><br>Możesz od razu grać w układzie poziomym.';
      panel.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
      return;
    }

    let requestedFullscreen = false;
    const root = document.documentElement;
    if (!document.fullscreenElement && typeof root.requestFullscreen === 'function') {
      try {
        await root.requestFullscreen();
        requestedFullscreen = true;
      } catch {
        requestedFullscreen = false;
      }
    }

    let requestedLandscape = false;
    if ('orientation' in screen && typeof screen.orientation?.lock === 'function') {
      try {
        await screen.orientation.lock('landscape');
        requestedLandscape = true;
      } catch {
        requestedLandscape = false;
      }
    }

    const isLandscapeNow =
      orientationQuery.matches || window.matchMedia('(min-aspect-ratio: 13/10)').matches;
    if (isLandscapeNow || requestedLandscape) {
      panel.innerHTML =
        '<strong>Próba przejścia do poziomu wykonana.</strong><br>Jeśli ekran nie obrócił się automatycznie, obróć telefon ręcznie.';
    } else {
      const fullscreenHint = requestedFullscreen
        ? 'Uruchomiono pełny ekran.'
        : 'Pełny ekran nie jest dostępny na tym urządzeniu.';
      panel.innerHTML = `<strong>Automatyczne wymuszenie poziomu niedostępne.</strong><br>${fullscreenHint} Obróć telefon ręcznie, aby grać wygodnie.`;
    }

    panel.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
  }

  /**
   * Shows a global update prompt inside the installed PWA when a newer build is waiting.
   */
  _initPwaUpdateWidget() {
    const btn = document.getElementById('pwa-update-btn');
    const panel = document.getElementById('pwa-update-panel');
    const requiredOverlay = document.getElementById('pwa-update-required');
    const requiredBtn = document.getElementById('pwa-update-required-btn');
    if (!btn || !panel || !requiredOverlay || !requiredBtn) return;

    const isInStandaloneMode =
      'standalone' in navigator
        ? /** @type {any} */ (navigator).standalone
        : window.matchMedia('(display-mode: standalone)').matches;

    /**
     * @returns {{ isUpdateAvailable?: boolean, applyUpdate?: (() => Promise<void>) | null, shouldForceUpdate?: boolean }}
     */
    const getUpdateState = () => {
      return /** @type {any} */ (window).__stcPwaUpdateState ?? {};
    };

    /**
     * @param {HTMLButtonElement | null} actionBtn
     * @returns {void}
     */
    const bindUpdateAction = (actionBtn) => {
      actionBtn?.addEventListener('click', async () => {
        const { applyUpdate } = getUpdateState();
        if (!applyUpdate) return;
        actionBtn.setAttribute('disabled', 'true');
        actionBtn.textContent = 'Aktualizowanie...';
        await applyUpdate();
      });
    };

    const renderPanel = () => {
      panel.innerHTML = `
        <strong>Nowa wersja aplikacji jest gotowa</strong><br>
        Zaktualizuj Usiec Cepra, aby pobrać najnowsze poprawki i zawartość.<br>
        <button class="pwa-update-action-btn" id="pwa-update-action-btn" type="button">⬆ Zaktualizuj teraz</button>
      `;

      bindUpdateAction(
        /** @type {HTMLButtonElement | null} */ (document.getElementById('pwa-update-action-btn'))
      );
    };

    const syncVisibility = () => {
      const { isUpdateAvailable, shouldForceUpdate } = getUpdateState();
      const shouldShow = Boolean(isUpdateAvailable) && isInStandaloneMode;
      const isMandatory = shouldShow && Boolean(shouldForceUpdate);

      btn.classList.toggle('hidden', !shouldShow || isMandatory);
      btn.disabled = !shouldShow || isMandatory;
      btn.setAttribute('aria-hidden', String(!shouldShow || isMandatory));

      requiredOverlay.classList.toggle('hidden', !isMandatory);
      requiredOverlay.setAttribute('aria-hidden', String(!isMandatory));
      document.body.classList.toggle('pwa-update-required-active', isMandatory);

      if (!shouldShow) {
        panel.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        requiredBtn.removeAttribute('disabled');
        requiredBtn.textContent = '⬆ Zaktualizuj aplikację';
        return;
      }

      if (isMandatory) {
        panel.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        requiredBtn.removeAttribute('disabled');
        requiredBtn.textContent = '⬆ Zaktualizuj aplikację';
      }

      btn.textContent = '⬆ Aktualizacja';
    };

    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (btn.classList.contains('hidden')) return;

      const isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        renderPanel();
        panel.classList.remove('hidden');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        panel.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    window.addEventListener('stc-pwa-update', syncVisibility);
    bindUpdateAction(/** @type {HTMLButtonElement} */ (requiredBtn));

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('.pwa-update-widget')) return;
      panel.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    });

    syncVisibility();
  }

  /**
   * @param {'normal' | 'hard'} difficulty
   */
  _handleTitleStart(difficulty) {
    if (this._isInputLocked()) return;
    if (this.isTutorialMode) {
      this._disableTutorialGuidance();
      this.isTutorialMode = false;
    }
    const titleScreen = document.getElementById('title-screen');
    if (!titleScreen) return;

    this._closeReleaseNotesModal();

    this.state.difficulty = difficulty;
    this.state.enemyScaleFactor = 1.0;
    this.state.runSeed = _generateRandomSeed();
    this.state.generateMap();
    this.state.hasStartedFirstBattle = false;
    this.state.currentScreen = 'map';
    this.mapMessage = '';
    this.audioManager.setContext('inGame');
    this._openMapOverlay();
    this._syncScreenState();
    this._onActChange();
    titleScreen.classList.add('is-hiding');
    titleScreen.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      titleScreen.classList.add('hidden');
    }, 450);
  }

  _renderReleaseNotes() {
    const container = document.getElementById('release-notes-container');
    if (!container) return;

    container.innerHTML = '';
    releaseNotesData.forEach((entry) => {
      const section = document.createElement('section');

      const version = document.createElement('h3');
      version.className = 'note-version';
      version.textContent = entry.version;

      const date = document.createElement('p');
      date.className = 'note-date';
      date.textContent = entry.date;

      const list = document.createElement('ul');
      list.className = 'note-changes';
      entry.changes.forEach((changeText) => {
        const item = document.createElement('li');
        item.textContent = changeText;
        list.appendChild(item);
      });

      section.append(version, date, list);
      container.appendChild(section);
    });
  }

  _openReleaseNotesModal() {
    const modal = document.getElementById('release-notes-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  _closeReleaseNotesModal() {
    const modal = document.getElementById('release-notes-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  _openOptionsModal() {
    if (this._isInputLocked()) return;
    const modal = document.getElementById('options-modal');
    if (!modal) return;
    this._renderAudioOptions();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  _closeOptionsModal() {
    if (this._isInputLocked()) return;
    const modal = document.getElementById('options-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  _renderAudioOptions() {
    const menuBtn = document.getElementById('option-menu-music-btn');
    const gameBtn = document.getElementById('option-game-music-btn');
    if (!menuBtn || !gameBtn) return;

    this._applyLanguageToStaticUi();

    const menuOn = this.audioManager.isMenuMusicEnabled;
    menuBtn.textContent = menuOn ? this.t('common.on') : this.t('common.off');
    menuBtn.classList.toggle('is-on', menuOn);
    menuBtn.setAttribute('aria-pressed', String(menuOn));

    const gameOn = this.audioManager.isGameMusicEnabled;
    gameBtn.textContent = gameOn ? this.t('common.on') : this.t('common.off');
    gameBtn.classList.toggle('is-on', gameOn);
    gameBtn.setAttribute('aria-pressed', String(gameOn));

    const skipIntroBtn = document.getElementById('option-skip-intro-btn');
    if (skipIntroBtn) {
      const skipOn = getSkipIntro();
      skipIntroBtn.textContent = skipOn ? this.t('common.on') : this.t('common.off');
      skipIntroBtn.classList.toggle('is-on', skipOn);
      skipIntroBtn.setAttribute('aria-pressed', String(skipOn));
    }

    const textSizeBtn = document.getElementById('option-text-size-btn');
    if (textSizeBtn) {
      const preset = getTextSizePreset();
      const label =
        preset === 'xlarge'
          ? this.t('options.textSize.xlarge')
          : preset === 'large'
            ? this.t('options.textSize.large')
            : this.t('options.textSize.normal');
      textSizeBtn.textContent = label;
      textSizeBtn.classList.toggle('is-on', preset !== 'normal');
      textSizeBtn.setAttribute('aria-label', this.t('options.textSizeAria', { label }));
    }

    const languageBtn = document.getElementById('option-language-btn');
    if (languageBtn) {
      const isPolish = this.language === 'pl';
      languageBtn.textContent = isPolish ? this.t('language.pl') : this.t('language.en');
      languageBtn.classList.toggle('is-on', this.language === 'en');
      languageBtn.setAttribute('aria-label', this.t('options.language'));
    }

    this._renderAnalyticsOption();
  }

  _toggleMenuMusicOption() {
    if (this._isInputLocked()) return;
    this.audioManager.toggleMenuMusic(!this.audioManager.isMenuMusicEnabled);
    this._renderAudioOptions();
  }

  _toggleGameMusicOption() {
    if (this._isInputLocked()) return;
    this.audioManager.toggleGameMusic(!this.audioManager.isGameMusicEnabled);
    this._renderAudioOptions();
  }

  _toggleSkipIntroOption() {
    if (this._isInputLocked()) return;
    setSkipIntro(!getSkipIntro());
    this._renderAudioOptions();
  }

  _cycleTextSizeOption() {
    if (this._isInputLocked()) return;
    const current = getTextSizePreset();
    const next = current === 'normal' ? 'large' : current === 'large' ? 'xlarge' : 'normal';
    setTextSizePreset(next);
    this._applyTextSizePreference();
    this._renderAudioOptions();
  }

  _renderAnalyticsOption() {
    const analyticsBtn = document.getElementById('option-analytics-btn');
    if (!analyticsBtn) return;
    const enabled = getAnalyticsEnabled();
    analyticsBtn.textContent = enabled ? this.t('common.on') : this.t('common.off');
    analyticsBtn.classList.toggle('is-on', enabled);
    analyticsBtn.setAttribute('aria-pressed', String(enabled));
  }

  _toggleLanguageOption() {
    if (this._isInputLocked()) return;
    this.language = this.language === 'pl' ? 'en' : 'pl';
    setLanguage(this.language);
    this._renderAudioOptions();
    this._renderReleaseNotesButtonLabel();
    this.updateUI();
  }

  _toggleAnalyticsOption() {
    if (this._isInputLocked()) return;
    const current = getAnalyticsEnabled();
    setAnalyticsEnabled(!current);
    if (this.analytics && this.analytics.setAnalyticsEnabled) {
      this.analytics.setAnalyticsEnabled(!current);
    }
    this._renderAudioOptions();
  }

  _returnToMainMenuFromOptions() {
    if (this._isInputLocked()) return;
    const shouldExit = window.confirm(this.t('confirm.backToMenu'));
    if (!shouldExit) return;

    this._closeOptionsModal();
    this.audioManager.clearDefeatThemeLock();
    this.state.resetForNewRun(startingDeck);
    this.state.currentScreen = 'title';
    this.mapMessage = '';

    this._hideOverlay('run-summary-overlay');
    this._hideOverlay('map-overlay');
    this._hideOverlay('shop-overlay');
    this._hideOverlay('campfire-overlay');
    this._hideOverlay('random-event-overlay');
    this._hideOverlay('maryna-boon-overlay');
    this._hideOverlay('library-overlay');
    this._hideOverlay('pile-viewer-overlay');
    this._hideOverlay('card-zoom-overlay');
    this._hideOverlay('relic-reward-screen');
    this._hideOverlay('card-reward-screen');

    this.updateUI();
    this._syncScreenState();
  }

  _applyTextSizePreference() {
    const preset = getTextSizePreset();
    const scale = getTextSizeScale(preset);
    document.documentElement.style.setProperty('--user-text-scale', String(scale));
  }

  _syncScreenState() {
    const titleScreen = document.getElementById('title-screen');
    if (!titleScreen) return;

    const isTitle = this.state.currentScreen === 'title';
    if (isTitle) {
      titleScreen.classList.remove('is-hiding', 'hidden');
    } else {
      titleScreen.classList.toggle('hidden', !titleScreen.classList.contains('is-hiding'));
    }
    titleScreen.setAttribute('aria-hidden', String(!isTitle));
    this.audioManager.setContext(isTitle ? 'title' : 'inGame');
    if (this.isTutorialMode) {
      document.body.dataset.appScene = 'TUTORIAL_SCENE';
    } else if (isTitle) {
      document.body.dataset.appScene = 'MAIN_MENU';
    } else {
      document.body.dataset.appScene = 'MAIN_GAME';
    }
    this._renderCornerOptionsButton();
  }

  _syncEndTurnButtonState() {
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (!endTurnBtn) return;

    const inBattle = this.state.currentScreen === 'battle';
    endTurnBtn.disabled =
      this.isAnimating || this.isPileViewerOpen || !inBattle || this._isInputLocked();
  }

  /**
   * @param {'draw' | 'discard' | 'exhaust'} pileType
   */
  _openPileViewer(pileType) {
    pileViewerRenderer.openPileViewer(this, pileType);
  }

  _closePileViewer() {
    pileViewerRenderer.closePileViewer(this);
  }

  _renderPileViewer() {
    pileViewerRenderer.renderPileViewer(this);
  }

  /**
   * @param {'draw' | 'discard' | 'exhaust'} pileType
   * @returns {{ title: string, ids: string[] }}
   */
  _buildPileViewerData(pileType) {
    return pileViewerRenderer.buildPileViewerData(this, pileType);
  }

  /**
   * Updates enemy title and SVG sprite when enemy changes.
   */
  _renderEnemyPresentation() {
    statusRenderer.renderEnemyPresentation(this);
  }

  _renderWeatherIndicator() {
    statusRenderer.renderWeatherIndicator(this);
  }

  /**
   * Renders the collected relic bar with tooltip descriptions.
   */
  _renderRelics() {
    statusRenderer.renderRelics(this);
  }

  /**
   * Renders active status icons into a container element.
   * @param {string} containerId
   * @param {import('../data/cards.js').StatusDef} status
   */
  _renderStatuses(containerId, status) {
    statusRenderer.renderStatuses(this, containerId, status);
  }

  /**
   * Rebuilds the card hand in the DOM.
   */
  _getCardDescription(card) {
    return cardRenderer.getCardDescription(this, card);
  }

  /**
   * Rebuilds the card hand in the DOM.
   */
  _renderHand() {
    cardRenderer.renderHand(this);
  }

  /**
   * @param {number} handIndex
   */
  _handlePlayCard(handIndex) {
    combatUI.handlePlayCard(this, handIndex);
  }
  /**
   * Handles the end-of-turn sequence: discard, enemy attack animation, then start next turn.
   */
  _handleEndTurn() {
    combatUI.handleEndTurn(this);
  }

  /**
   * @param {'player_win'|'enemy_win'} outcome
   */
  _showEndGame(outcome) {
    combatUI.showEndGame(this, outcome);
  }

  /**
   * Opens map flow after state-level act transition.
   */
  _handleActTransitionToMap() {
    this.state.hasStartedFirstBattle = false;
    this.state.currentScreen = 'map';
    this.mapMessage = 'Wkraczasz na szlak: MORSKIE OKO.';
    this._openMapOverlay();
    this.updateUI();
    void this._onActChange();
  }

  /**
   * Shows the Act 2 transition relic reward screen (3 choices from act2Only pool).
   * On pick: adds relic, then calls startAct2() and transitions to map.
   * @param {string[]} choices
   */
  _showAct2TransitionRelicReward(choices) {
    rewardRenderer.showAct2TransitionRelicReward(this, choices);
  }

  /**
   * Shows the final victory message after defeating the boss.
   */
  showVictoryScreen() {
    const msg = 'Usiękłeś Króla Krupówek! Giewont zdobyty, a portfel (prawie) bezpieczny!';
    setTimeout(() => alert(msg), 100);

    this.state.generateMap();
    this.state.hasStartedFirstBattle = false;
    this.state.currentScreen = 'map';
    this.mapMessage = 'Nowa perć czeka na kolejnego cepra.';
    this._openMapOverlay();
    document.getElementById('end-turn-btn').disabled = true;
    this.updateUI();
  }

  /**
   * Displays a victory reward overlay with 3 random non-basic cards.
   */
  _showScriptedEventBattleRewards(relicId, droppedDutki) {
    rewardRenderer.showScriptedEventBattleRewards(this, relicId, droppedDutki);
  }

  /**
   * Displays a victory reward overlay with 3 random non-basic cards.
   */
  _showVictoryOverlay(droppedDutki, isBossFight = false) {
    rewardRenderer.showVictoryOverlay(this, droppedDutki, isBossFight);
  }

  /**
   * @param {string} relicId
   * @param {'battle' | 'treasure'} source
   */
  showRelicScreen(relicId, source) {
    rewardRenderer.showRelicScreen(this, relicId, source);
  }

  _showCardRewardScreen(droppedDutki, choices, isBossFight = false, options = {}) {
    rewardRenderer.showCardRewardScreen(this, droppedDutki, choices, isBossFight, options);
  }

  _closeRewardScreens(isBossFight = false) {
    rewardRenderer.closeRewardScreens(this, isBossFight);
  }

  _showRunSummaryOverlay() {
    rewardRenderer.showRunSummaryOverlay(this);
  }

  _handleRunSummaryReplay() {
    if (this._isInputLocked()) return;
    this._hideOverlay('run-summary-overlay');
    this.audioManager.clearDefeatThemeLock();
    this.state.runSeed = _generateRandomSeed();
    this.state.resetForNewRun(startingDeck);
    this.state.currentScreen = 'map';
    this.mapMessage = '';
    this._openMapOverlay();
    this.updateUI();
    this._onActChange();
  }

  _handleRunSummaryExit() {
    this._hideOverlay('run-summary-overlay');
    this._hideOverlay('map-overlay');
    this.audioManager.clearDefeatThemeLock();
    this.state.runSeed = null;
    this.state.resetForNewRun(startingDeck);
    this.state.currentScreen = 'title';
    this.mapMessage = '';
    this.updateUI();
    this._syncScreenState();
  }

  /**
   * @param {number} count
   * @returns {string[]}
   */
  _pickRewardCards(count) {
    return this.state.generateCardRewardChoices(count);
  }

  /**
   * @returns {string | null}
   */
  _pickRewardRelic(forceDrop = false) {
    return this.state.generateRelicReward(forceDrop);
  }

  /**
   * @param {number} count
   * @returns {string[]}
   */
  _pickEliteRewardRelics(count) {
    return this.state.generateRelicChoices(count);
  }

  /**
   * @param {number} count
   * @returns {string[]}
   */
  _pickRareRewardCards(count) {
    const pool = Object.keys(cardLibrary).filter(
      (id) =>
        !cardLibrary[id]?.isStarter &&
        !cardLibrary[id]?.eventOnly &&
        !cardLibrary[id]?.tutorialOnly &&
        cardLibrary[id]?.rarity === 'rare'
    );
    return this.state._pickUniqueItems(pool, cardLibrary, count);
  }

  /**
   * @param {number} droppedDutki
   */
  _showEliteRewardOverlay(droppedDutki) {
    rewardRenderer.showEliteRewardOverlay(this, droppedDutki);
  }

  _handleTutorialStart() {
    tutorialUI.handleTutorialStart(this);
  }

  /** @returns {string[]} */
  _buildTutorialFixedHand() {
    return tutorialUI.buildTutorialFixedHand(this);
  }

  /**
   * @param {number} count
   * @returns {string[]}
   */
  _pickTutorialRandomCards(count) {
    return tutorialUI.pickTutorialRandomCards(this, count);
  }

  _startTutorialRewardPhase() {
    tutorialUI.startTutorialRewardPhase(this);
  }

  /**
   * @param {{ dynamicText?: string, text?: string }} step
   * @returns {string}
   */
  _resolveTutorialStepText(step) {
    return tutorialUI.resolveTutorialStepText(this, step);
  }

  _positionTutorialBubble() {
    tutorialUI.positionTutorialBubble(this);
  }

  _setTutorialMiniMap() {
    tutorialUI.setTutorialMiniMap(this);
  }

  _handleTutorialAcknowledge() {
    tutorialUI.handleTutorialAcknowledge(this);
  }

  _getCurrentTutorialStep() {
    return tutorialUI.getCurrentTutorialStep(this);
  }

  _disableTutorialGuidance() {
    tutorialUI.disableTutorialGuidance(this);
  }

  _syncTutorialExitButton() {
    tutorialUI.syncTutorialExitButton(this);
  }

  _renderTutorialOverlay() {
    tutorialUI.renderTutorialOverlay(this);
  }

  /**
   * @param {EventTarget | null} target
   * @returns {boolean}
   */
  _isTutorialInteractionAllowed(target) {
    return tutorialUI.isTutorialInteractionAllowed(this, target);
  }

  /**
   * @param {string | undefined} cardId
   * @returns {boolean}
   */
  _isTutorialCardPlayAllowed(cardId) {
    return tutorialUI.isTutorialCardPlayAllowed(this, cardId);
  }

  /**
   * @param {string | undefined} cardId
   */
  _handleTutorialCardPlayed(cardId) {
    tutorialUI.handleTutorialCardPlayed(this, cardId);
  }

  /** @returns {boolean} */
  _isTutorialEndTurnAllowed() {
    return tutorialUI.isTutorialEndTurnAllowed(this);
  }

  _handleTutorialEndTurnClicked() {
    tutorialUI.handleTutorialEndTurnClicked(this);
  }

  _handleTutorialRepeat() {
    tutorialUI.handleTutorialRepeat(this);
  }

  _handleTutorialFinish() {
    tutorialUI.handleTutorialFinish(this);
  }

  _finishTutorialMode() {
    tutorialUI.finishTutorialMode(this);
  }

  _setTutorialDoneFlag() {
    tutorialUI.setTutorialDoneFlag();
  }

  _openMapOverlay() {
    mapRenderer.openMapOverlay(this);
  }

  _renderMapTrack() {
    mapRenderer.renderMapTrack(this);
  }

  _drawMapConnections(nodeButtons) {
    mapRenderer.drawMapConnections(this, nodeButtons);
  }

  _handleMapNodeSelect(level, nodeIndex) {
    mapRenderer.handleMapNodeSelect(this, level, nodeIndex);
  }

  _openMarynaBoonOverlay() {
    marynaOverlay.openMarynaBoonOverlay(this);
  }

  _handleMapAdvance() {
    const isOnBoss = this.state.currentLevel === this.state.map.length - 1;
    if (!isOnBoss) return;

    this.state.generateMap();
    this.state.hasStartedFirstBattle = true;
    this.state.currentScreen = 'battle';
    this.mapMessage = '';
    this.state.resetBattle();
    this._hideOverlay('map-overlay');
    this._playEncounterMusic();
    document.getElementById('end-turn-btn').disabled = false;
    this.updateUI();
  }

  _handleTreasureNode() {
    try {
      this.state.currentScreen = 'treasure';
      this._hideOverlay('map-overlay');
      this.state.hasStartedFirstBattle = true;

      const relicId = this.state.generateRelicReward(true);
      if (!relicId) {
        this.mapMessage = 'Skrzynia była pusta...';
        this.state.currentScreen = 'map';
        this._openMapOverlay();
        return;
      }

      this.showRelicScreen(relicId, 'treasure');
      this.updateUI();
    } catch (error) {
      console.error('[UI] BŁĄD SKRZYNI:', error);
      this.mapMessage = 'BŁĄD SKRZYNI: ' + (error.message || 'Nieznany błąd');
      this.state.currentScreen = 'map';
      this._openMapOverlay();
    }
  }

  /**
   * @param {string | null} [forcedEventId]
   */
  _openRandomEvent(forcedEventId = null) {
    eventRenderer.openRandomEvent(this, forcedEventId);
  }

  /**
   * @param {number} choiceIndex
   */
  _handleRandomEventChoice(choiceIndex) {
    eventRenderer.handleRandomEventChoice(this, choiceIndex);
  }

  _continueAfterRandomEvent() {
    eventRenderer.continueAfterRandomEvent(this);
  }

  _openShop() {
    shopRenderer.openShop(this);
  }

  _closeShop() {
    shopRenderer.closeShop(this);
  }

  _renderShopOffers() {
    shopRenderer.renderShopOffers(this);
  }

  /**
   * @returns {HTMLDivElement}
   */
  _createExhaustBadge() {
    return cardRenderer.createExhaustBadge();
  }

  _buyShopHeal() {
    shopRenderer.buyShopHeal(this);
  }

  _buyCardRemoval() {
    shopRenderer.buyCardRemoval(this);
  }

  _populateRemoveCardSelect() {
    shopRenderer.populateRemoveCardSelect(this);
  }

  _openCampfire() {
    campfireOverlay.openCampfire(this);
  }

  _openLibraryOverlay() {
    libraryRenderer.openLibraryOverlay(this);
  }

  _closeLibraryOverlay() {
    libraryRenderer.closeLibraryOverlay(this);
  }

  /**
   * @param {'cards' | 'relics' | 'maryna'} tab
   */
  _setLibraryTab(tab) {
    libraryRenderer.setLibraryTab(this, tab);
  }

  /**
   * @param {'all' | 'common' | 'uncommon' | 'rare'} rarity
   */
  _setLibraryFilter(rarity) {
    libraryRenderer.setLibraryFilter(this, rarity);
  }

  /**
   * @param {string} cardId
   */
  showCardZoom(cardId) {
    const cardDef = getCardDefinition(cardId);
    if (!cardDef) return;
    const cardView = {
      name: cardDef.name,
      emoji: cardDef.emoji,
      rarityLabel: uiHelpers.getFullCardType(cardDef.rarity, cardDef.type),
      cost: this.state.getCardCostInHand ? this.state.getCardCostInHand(cardId) : cardDef.cost,
      description: cardRenderer.getCardDescription(this, cardDef, cardId),
      rarityClass: uiHelpers.rarityClass(cardDef.rarity),
      typeClass: `card-${cardDef.type}`,
      exhaust: Boolean(cardDef.exhaust),
    };
    cardZoomOverlay.openCardZoom(cardView, 'card');
  }

  /**
   * @param {string} relicId
   */
  showRelicZoom(relicId) {
    const relicDef = relicLibrary[relicId];
    if (!relicDef) return;
    const relicView = {
      name: relicDef.name,
      emoji: relicDef.emoji,
      rarityLabel: uiHelpers.rarityLabel(relicDef.rarity, 'relic'),
      description: relicDef.desc,
      rarityClass: uiHelpers.rarityClass(relicDef.rarity),
    };
    cardZoomOverlay.openCardZoom(relicView, 'relic');
  }

  _renderLibrary() {
    libraryRenderer.renderLibrary(this);
  }

  _openHandViewOverlay() {
    const cardViews = this.state.hand
      .map((cardId, index) => {
        const card = getCardDefinition(cardId);
        if (!card) return null;

        const actualCost = this.state.getCardCostInHand(cardId);
        const cardDescription = cardRenderer.getCardDescription(this, card, cardId);

        return {
          cardId,
          handIndex: index,
          name: card.name,
          emoji: card.emoji,
          rarityLabel: uiHelpers.getFullCardType(card.rarity, card.type),
          cost: actualCost,
          description: cardDescription,
          rarityClass: uiHelpers.rarityClass(card.rarity),
          typeClass: `card-${card.type}`,
          exhaust: Boolean(card.exhaust),
        };
      })
      .filter(Boolean);

    if (cardViews.length > 0) {
      const onCardClick = (index) => {
        if (!this.isAnimating) {
          this._handlePlayCard(index);
        }
      };
      handViewOverlay.openHandView(cardViews, onCardClick);
    }
  }

  /**
   * @param {string} overlayId
   */
  _hideOverlay(overlayId) {
    uiHelpers.hideOverlay(overlayId);
  }

  _playEncounterMusic() {
    const currentNode = this.state.getCurrentMapNode();
    const isBossEncounter = currentNode?.type === 'boss' || Boolean(this.state.enemy?.isBoss);
    if (isBossEncounter) {
      this.audioManager.playBossMusic();
      return;
    }
    this.audioManager.playBattleMusic();
  }

  /**
   * @param {string} eventId
   * @returns {boolean}
   */
  launchDebugEvent(eventId) {
    this.state.setActiveEvent(eventId);
    const eventDef = this.state.getActiveEventDef();
    if (!eventDef) {
      this.state.clearActiveEvent();
      return false;
    }

    this.state.currentScreen = 'event';
    this.pendingEventFallbackEnemyId = null;
    this._hideOverlay('map-overlay');
    this._hideOverlay('shop-overlay');
    this._hideOverlay('campfire-overlay');
    this._hideOverlay('random-event-overlay');
    this._openRandomEvent(eventDef.id);
    this.updateUI();
    return true;
  }

  refreshMapOverlay() {
    const overlay = document.getElementById('map-overlay');
    if (!overlay || overlay.classList.contains('hidden')) return;
    this._renderMapTrack();
  }

  /**
   * @param {string} enemyId
   * @returns {boolean}
   */
  launchDebugBattle(enemyId) {
    const started = this.state.startBattleWithEnemyId(enemyId, { battleContext: 'debug' });
    if (!started) return false;

    this.state.currentScreen = 'battle';
    this.state.hasStartedFirstBattle = true;
    this._hideOverlay('map-overlay');
    this._hideOverlay('shop-overlay');
    this._hideOverlay('campfire-overlay');
    this._hideOverlay('random-event-overlay');
    this._playEncounterMusic();
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) endTurnBtn.disabled = false;
    this.updateUI();
    return true;
  }

  /**
   * @param {{ checkWin?: boolean, refreshMap?: boolean }} [options]
   */
  applyDebugRefresh(options = {}) {
    const { checkWin = true, refreshMap = false } = options;
    if (refreshMap) {
      this.refreshMapOverlay();
    }
    if (this.state.consumeLansActivatedEvent()) {
      combatUI.triggerLansOnAnimation();
      combatUI.showFloatingText(this, 'sprite-player', 'JEST LANS!', 'floating-lans');
    }
    const lansBreakText = this.state.consumeLansBreakEvent();
    if (lansBreakText) {
      combatUI.triggerLansOffAnimation();
      combatUI.showFloatingText(this, 'sprite-player', lansBreakText, 'floating-shame');
    }
    this.updateUI();
    if (!checkWin) return;
    const win = this.state.checkWinCondition();
    if (win) {
      this._showEndGame(win);
    }
  }

  /**
   * @param {'common' | 'uncommon' | 'rare' | undefined} rarity
   * @returns {string}
   */
  /**
   * @param {string | undefined} outcome
   * @returns {string}
   */
  _revealedEventEmoji(outcome) {
    return uiHelpers.revealedEventEmoji(outcome);
  }

  _rarityClass(rarity) {
    return uiHelpers.rarityClass(rarity);
  }

  /**
   * @param {'common' | 'uncommon' | 'rare' | undefined} rarity
   * @param {'card' | 'relic'} type
   * @returns {string}
   */
  _rarityLabel(rarity, type) {
    return uiHelpers.rarityLabel(rarity, type);
  }

  /**
   * @param {'common' | 'uncommon' | 'rare' | undefined} rarity
   * @param {'attack' | 'skill' | 'status' | 'power'} type
   * @returns {string}
   */
  getFullCardType(rarity, type) {
    return uiHelpers.getFullCardType(rarity, type);
  }

  _closeStatusTooltips() {
    document.querySelectorAll('.status-tag-hint.is-open').forEach((tag) => {
      tag.classList.remove('is-open');
      tag.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * @param {EventTarget | null} target
   */
  _toggleWeatherTooltip(target) {
    if (this._isInputLocked()) return;
    if (!(target instanceof Element)) return;
    const trigger = target.closest('.weather-hint-trigger');
    if (!trigger) return;

    const isOpen = trigger.classList.contains('is-open');
    this._closeWeatherTooltips();
    if (!isOpen) {
      trigger.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  }

  _closeWeatherTooltips() {
    document.querySelectorAll('.weather-hint-trigger.is-open').forEach((hint) => {
      hint.classList.remove('is-open');
      hint.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * @param {string} elementId
   * @param {string} animClass
   * @param {number} [duration=400]
   */
  _triggerAnim(elementId, animClass, duration = 400) {
    combatUI.triggerAnim(this, elementId, animClass, duration);
  }

  /**
   * @param {string} elementId
   * @param {string} text
   * @param {string} extraClass
   */
  _showFloatingText(elementId, text, extraClass) {
    combatUI.showFloatingText(this, elementId, text, extraClass);
  }

  _showLansDutkiSpentFeedback() {
    combatUI.showLansDutkiSpentFeedback(this);
  }

  _isInputLocked() {
    return uiHelpers.isInputLocked(this.state);
  }

  async _onActChange() {
    if (this.isActIntroPlaying) return;
    // Skip the Act Intro Overlay when the player has disabled intros.
    if (getSkipIntro()) {
      this.refreshMapOverlay();
      return;
    }
    this.isActIntroPlaying = true;
    this.state.isInputLocked = true;
    this.updateUI();

    try {
      await this.playActIntro(this._getActIntroData());
    } finally {
      this.state.isInputLocked = false;
      this.isActIntroPlaying = false;
      this.updateUI();
      this.refreshMapOverlay();
    }
  }

  /**
   * @param {{ partLabel: string, actLabel: string, title: string }} actData
   */
  playActIntro(actData) {
    return this.actIntroOverlay.play(actData);
  }

  _getActIntroData() {
    const actNumber = Number.isFinite(this.state.currentAct)
      ? Math.max(1, this.state.currentAct)
      : 1;
    const rawTitle = this.state.currentActName || 'NIEZNANY SZLAK';
    const title = rawTitle
      .toLocaleLowerCase('pl-PL')
      .replace(/(^|\s)\S/g, (char) => char.toLocaleUpperCase('pl-PL'));

    return {
      partLabel: `CZĘŚĆ ${actNumber}:`,
      actLabel: '',
      title,
    };
  }
}

/** @returns {string} 8-char hex seed */
function _generateRandomSeed() {
  return (Math.floor(Math.random() * 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}
