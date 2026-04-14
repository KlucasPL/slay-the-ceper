import { cardLibrary, startingDeck } from '../data/cards.js';
import { marynaBoonLibrary, marynaSvg } from '../data/marynaBoons.js';
import { enemyLibrary } from '../data/enemies.js';
import { relicLibrary } from '../data/relics.js';
import {
  tutorialFixedRelicId,
  tutorialFixedCardRewardIds,
  tutorialMapSequence,
} from '../data/tutorialConfig.js';
import { releaseNotesData } from '../data/releaseNotes.js';
import { weatherLibrary } from '../data/weather.js';
import { statusTooltipRegistry } from './statusTooltips.js';
import { ActIntroOverlay } from './ActIntroOverlay.js';
import { getSkipIntro, setSkipIntro } from '../logic/settings.js';
import {
  TUTORIAL_DONE_KEY,
  tutorialPlayerStatus,
  tutorialSteps,
  buildTutorialMapExplanationText,
  buildTutorialFinaleText,
  createTutorialMiniMap,
} from './tutorialFlow.js';

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
      .addEventListener('click', () => this._toggleMenuMusicOption());
    document
      .getElementById('option-game-music-btn')
      .addEventListener('click', () => this._toggleGameMusicOption());
    document
      .getElementById('option-skip-intro-btn')
      ?.addEventListener('click', () => this._toggleSkipIntroOption());
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
    document.getElementById('shop-exit-btn').addEventListener('click', () => this._closeShop());
    document.getElementById('shop-heal-btn').addEventListener('click', () => this._buyShopHeal());
    document
      .getElementById('shop-remove-btn')
      .addEventListener('click', () => this._buyCardRemoval());
    document.getElementById('camp-exit-btn').addEventListener('click', () => this._closeCampfire());
    document
      .getElementById('random-event-continue-btn')
      .addEventListener('click', () => this._continueAfterRandomEvent());
    document
      .getElementById('camp-heal-btn')
      .addEventListener('click', () => this._useCampfireHeal());
    document
      .getElementById('camp-upgrade-btn')
      .addEventListener('click', () => this._useCampfireUpgrade());
    document
      .getElementById('library-tab-cards')
      .addEventListener('click', () => this._setLibraryTab('cards'));
    document
      .getElementById('library-tab-relics')
      .addEventListener('click', () => this._setLibraryTab('relics'));
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
        if (!this._isInputLocked()) return;
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
    window.addEventListener('resize', () => this._scaleGame());
    window.addEventListener('resize', () => this._renderTutorialOverlay());
    window.addEventListener('resize', () => this._queueCardDescFit());
    this._scaleGame();
    this._setupCardDescriptionAutoFit();
    this._renderReleaseNotesButtonLabel();
    this._renderReleaseNotes();
    this._renderAudioOptions();
    this.updateUI();
    this._syncScreenState();
    if (this.state.currentScreen === 'battle') {
      this._playEncounterMusic();
    }
    this._renderCornerOptionsButton();
  }

  _renderReleaseNotesButtonLabel() {
    const releaseNotesBtn = document.getElementById('btn-release-notes');
    if (!releaseNotesBtn) return;

    const latestVersion = releaseNotesData[0]?.version?.split(' - ')[0];
    releaseNotesBtn.textContent = latestVersion
      ? `📜 Co nowego? (${latestVersion})`
      : '📜 Co nowego?';
  }

  _renderCornerOptionsButton() {
    const btn = document.getElementById('corner-options-btn');
    if (!btn) return;

    const showOutsideTitle = this.state.currentScreen !== 'title';
    btn.classList.toggle('hidden', !showOutsideTitle);
    btn.setAttribute('aria-hidden', String(!showOutsideTitle));
    btn.disabled = !showOutsideTitle;
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
    enemyIntentEl.textContent = this.state.getEnemyIntentText();
    enemyIntentEl.title = 'Wartość zamiaru uwzględnia Twoją aktualną Gardę.';
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
    const descNodes = document.querySelectorAll('.card .card-desc');
    descNodes.forEach((descEl) => {
      this._fitSingleCardDescription(descEl);
    });
  }

  /**
   * @param {Element} descNode
   */
  _fitSingleCardDescription(descNode) {
    if (!(descNode instanceof HTMLElement)) return;

    descNode.classList.remove('card-desc--autoscaled');
    descNode.classList.remove('card-desc--tight');
    descNode.style.removeProperty('font-size');

    const styles = getComputedStyle(descNode);
    const baseFontPx = parseFloat(styles.fontSize) || 14;
    const minFromCss = parseFloat(styles.getPropertyValue('--card-desc-min-size'));
    const hardMinFromCss = parseFloat(styles.getPropertyValue('--card-desc-hard-min-size'));
    const rootFontPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const minFontPx = Number.isFinite(minFromCss) && minFromCss > 0 ? minFromCss * rootFontPx : 9;
    const hardMinFontPx =
      Number.isFinite(hardMinFromCss) && hardMinFromCss > 0 ? hardMinFromCss * rootFontPx : 8;

    let currentFontPx = baseFontPx;
    const step = 0.5;
    const hasOverflow = () =>
      descNode.scrollHeight > descNode.clientHeight + 1 ||
      descNode.scrollWidth > descNode.clientWidth + 1;

    while (currentFontPx > minFontPx && hasOverflow()) {
      currentFontPx = Math.max(minFontPx, currentFontPx - step);
      descNode.style.fontSize = `${currentFontPx}px`;
    }

    if (hasOverflow()) {
      descNode.classList.add('card-desc--tight');
      while (currentFontPx > hardMinFontPx && hasOverflow()) {
        currentFontPx = Math.max(hardMinFontPx, currentFontPx - 0.25);
        descNode.style.fontSize = `${currentFontPx}px`;
      }
    }

    if (currentFontPx < baseFontPx) {
      descNode.classList.add('card-desc--autoscaled');
    }
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
    this.state.generateMap();
    this.state.hasStartedFirstBattle = false;
    this.state.currentScreen = 'map';
    this.mapMessage = '';
    this.audioManager.setContext('inGame');
    this._openMapOverlay();
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

    const menuOn = this.audioManager.isMenuMusicEnabled;
    menuBtn.textContent = menuOn ? 'ON' : 'OFF';
    menuBtn.classList.toggle('is-on', menuOn);
    menuBtn.setAttribute('aria-pressed', String(menuOn));

    const gameOn = this.audioManager.isGameMusicEnabled;
    gameBtn.textContent = gameOn ? 'ON' : 'OFF';
    gameBtn.classList.toggle('is-on', gameOn);
    gameBtn.setAttribute('aria-pressed', String(gameOn));

    const skipIntroBtn = document.getElementById('option-skip-intro-btn');
    if (skipIntroBtn) {
      const skipOn = getSkipIntro();
      skipIntroBtn.textContent = skipOn ? 'ON' : 'OFF';
      skipIntroBtn.classList.toggle('is-on', skipOn);
      skipIntroBtn.setAttribute('aria-pressed', String(skipOn));
    }
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
    if (this._isInputLocked()) return;
    if (this.state.currentScreen !== 'battle') return;
    this.isPileViewerOpen = true;
    this.activePileViewer = pileType;
    this._renderPileViewer();
    this._syncEndTurnButtonState();
  }

  _closePileViewer() {
    if (this._isInputLocked()) return;
    const overlay = document.getElementById('pile-viewer-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    this.isPileViewerOpen = false;
    this.activePileViewer = null;
    this._syncEndTurnButtonState();
  }

  _renderPileViewer() {
    const overlay = document.getElementById('pile-viewer-overlay');
    const title = document.getElementById('pile-viewer-title');
    const grid = document.getElementById('pile-viewer-grid');
    if (!overlay || !title || !grid || !this.activePileViewer) return;

    /** @type {{ title: string, ids: string[] }} */
    const view = this._buildPileViewerData(this.activePileViewer);
    title.textContent = view.title;
    grid.innerHTML = '';

    if (view.ids.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'pile-viewer-empty';
      empty.textContent = 'Brak kart w tym stosie.';
      grid.appendChild(empty);
    } else {
      view.ids.forEach((cardId) => {
        const card = cardLibrary[cardId];
        if (!card) return;

        const cardEl = document.createElement('article');
        cardEl.className = `card pile-viewer-card ${this._rarityClass(card.rarity)} card-${card.type}`;

        const costEl = document.createElement('div');
        costEl.className = 'card-cost';
        costEl.textContent = String(card.cost);

        const titleEl = document.createElement('div');
        titleEl.className = 'card-title';
        titleEl.textContent = card.name;

        const rarityEl = document.createElement('div');
        rarityEl.className = 'card-rarity';
        rarityEl.textContent = this.getFullCardType(card.rarity, card.type);

        const imgEl = document.createElement('div');
        imgEl.className = 'card-img';
        const iconEl = document.createElement('span');
        iconEl.className = 'card-icon';
        iconEl.textContent = card.emoji;
        imgEl.appendChild(iconEl);

        const descEl = document.createElement('div');
        descEl.className = 'card-desc';
        descEl.textContent = this._getCardDescription(card);

        cardEl.append(costEl, titleEl, rarityEl, imgEl, descEl);

        if (card.exhaust) {
          cardEl.classList.add('card-exhaust');
          cardEl.appendChild(this._createExhaustBadge());
        }

        grid.appendChild(cardEl);
      });
    }

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  /**
   * @param {'draw' | 'discard' | 'exhaust'} pileType
   * @returns {{ title: string, ids: string[] }}
   */
  _buildPileViewerData(pileType) {
    const drawSource =
      this.state?.combatState?.drawPile ?? this.state.deck ?? this.state.drawPile ?? [];
    const discardSource =
      this.state?.combatState?.discardPile ?? this.state.discard ?? this.state.discardPile ?? [];
    const exhaustSource =
      this.state?.combatState?.exhaustPile ?? this.state.exhaust ?? this.state.exhaustPile ?? [];

    const toIds = (source) => {
      if (!Array.isArray(source)) return [];
      return source
        .map((entry) => {
          if (typeof entry === 'string') return entry;
          if (entry && typeof entry === 'object' && typeof entry.id === 'string') return entry.id;
          return null;
        })
        .filter((id) => typeof id === 'string');
    };

    const drawIds = toIds(drawSource)
      .filter((id) => Boolean(cardLibrary[id]))
      .sort((a, b) => {
        const cardA = cardLibrary[a];
        const cardB = cardLibrary[b];
        return cardA.cost - cardB.cost || cardA.name.localeCompare(cardB.name, 'pl');
      });

    const discardIds = toIds(discardSource)
      .filter((id) => Boolean(cardLibrary[id]))
      .reverse();

    const exhaustIds = toIds(exhaustSource)
      .filter((id) => Boolean(cardLibrary[id]))
      .reverse();

    if (pileType === 'draw') {
      return { title: 'Talia Dociągu', ids: drawIds };
    }
    if (pileType === 'discard') {
      return { title: 'Karty Odrzucone', ids: discardIds };
    }
    return { title: 'Przepadło', ids: exhaustIds };
  }

  /**
   * Updates enemy title and SVG sprite when enemy changes.
   */
  _renderEnemyPresentation() {
    const enemyName = document.getElementById('enemy-name');
    const enemySprite = document.getElementById('sprite-enemy');
    const enemyId = this.state.enemy.id;
    enemyName.textContent = `${this.state.enemy.name} ${this.state.enemy.emoji}`;
    if (
      enemySprite.dataset.enemyId !== enemyId ||
      enemySprite.dataset.enemySpriteSvg !== this.state.enemy.spriteSvg
    ) {
      enemySprite.innerHTML = this.state.enemy.spriteSvg;
      enemySprite.dataset.enemyId = enemyId;
      enemySprite.dataset.enemySpriteSvg = this.state.enemy.spriteSvg;
    }
    if (this.state.enemy.isBankrupt && this.state.enemy.rachunek > 0) {
      enemySprite.classList.add('bankrupt-animation');
    } else {
      enemySprite.classList.remove('bankrupt-animation');
    }
  }

  _renderWeatherIndicator() {
    const weather = this.state.getCurrentWeather();
    const badge = document.getElementById('weather-indicator');
    const tip = document.getElementById('weather-tooltip');
    if (!badge || !tip || !weather) return;

    badge.textContent = `${weather.emoji} ${weather.name}`;
    badge.appendChild(tip);
    badge.setAttribute('aria-label', `${weather.name}: ${weather.desc}`);
    tip.textContent = weather.desc;
  }

  /**
   * Renders the collected relic bar with tooltip descriptions.
   */
  _renderRelics() {
    const bar = document.getElementById('relic-bar');
    if (!bar) return;

    bar.innerHTML = '';
    this.state.relics.forEach((relicId) => {
      const relic = relicLibrary[relicId];
      if (!relic) return;
      const chip = document.createElement('button');
      chip.className = 'relic-chip';
      chip.classList.add(this._rarityClass(relic.rarity));
      chip.type = 'button';
      chip.textContent = relic.emoji;
      chip.title = `${relic.name}: ${relic.desc}`;
      chip.setAttribute('aria-label', `${relic.name}: ${relic.desc}`);

      const tooltip = document.createElement('span');
      tooltip.className = 'relic-tooltip';
      tooltip.textContent = `${relic.name}: ${relic.desc}`;
      chip.appendChild(tooltip);

      bar.appendChild(chip);
    });
  }

  /**
   * Renders active status icons into a container element.
   * @param {string} containerId
   * @param {import('../data/cards.js').StatusDef} status
   */
  _renderStatuses(containerId, status) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';

    /**
     * @param {string} icon
     * @param {string} label
     * @param {string|number|null} value
     * @param {string} tooltip
     */
    const tag = (icon, label, value, tooltip) => {
      const chipText = value != null ? `${icon}\u2009${value}` : icon;
      const ariaLabel = value != null ? `${label}: ${value}` : label;
      const element = document.createElement('button');
      element.className = 'status-tag status-tag-hint';
      element.type = 'button';
      element.textContent = chipText;
      element.setAttribute('aria-label', `${ariaLabel}: ${tooltip}`);
      element.setAttribute('aria-expanded', 'false');

      const tip = document.createElement('span');
      tip.className = 'status-tooltip';
      tip.textContent = `${label}${value != null ? ` (${value})` : ''}: ${tooltip}`;
      element.appendChild(tip);

      element.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = element.classList.contains('is-open');
        this._closeStatusTooltips();
        if (!isOpen) {
          element.classList.add('is-open');
          element.setAttribute('aria-expanded', 'true');
        }
      });

      el.appendChild(element);
    };

    Object.entries(status).forEach(([key, rawValue]) => {
      const numericValue =
        typeof rawValue === 'boolean' ? (rawValue ? 1 : 0) : Number(rawValue ?? 0);
      if (numericValue <= 0) return;

      const def = statusTooltipRegistry[key] ?? {
        icon: '🔹',
        label: key,
        tooltip: `Aktywny status: ${key}`,
      };
      const isBoolean = typeof rawValue === 'boolean';
      const shouldShowValue = def.showNumericValue ?? !isBoolean;

      let displayValue = null;
      if (shouldShowValue) {
        if (key === 'energy_next_turn') {
          displayValue = `+${numericValue}`;
        } else {
          displayValue = numericValue;
        }
      }

      tag(def.icon, def.label, displayValue, def.tooltip);
    });

    if (containerId === 'p-statuses' && this.state.player.stunned) {
      const stunnedDef = statusTooltipRegistry.stunned;
      if (stunnedDef) {
        tag(stunnedDef.icon, stunnedDef.label, null, stunnedDef.tooltip);
      }
    }

    if (containerId === 'e-statuses') {
      this.state.getEnemySpecialStatuses().forEach((special) => {
        tag(special.icon, special.label, special.value, special.tooltip);
      });
    }
  }

  /**
   * Rebuilds the card hand in the DOM.
   */
  _getCardDescription(card) {
    if (card.id === 'prestiz_na_kredyt') {
      return `Zyskujesz ${this.state.getPrestizNaKredytBlock()} Gardy (bazowo 6, +2 za każde 20 dutków, max +14).`;
    }
    return card.desc;
  }

  /**
   * Rebuilds the card hand in the DOM.
   */
  _renderHand() {
    const { hand, player, enemy } = this.state;
    const handDiv = document.getElementById('hand');
    handDiv.innerHTML = '';

    hand.forEach((cardId, index) => {
      const card = cardLibrary[cardId];
      const actualCost = this.state.getCardCostInHand(cardId);
      const canPlay = player.energy >= actualCost && !card.unplayable;

      const cardEl = document.createElement('div');
      const isKept = this.state.smyczKeptHandIndex === index;
      cardEl.className = `card ${this._rarityClass(card.rarity)} card-${card.type}${canPlay ? '' : ' disabled'}${isKept ? ' card--kept' : ''}`;
      cardEl.dataset.cardId = cardId;

      if (card.exhaust) {
        cardEl.classList.add('card-exhaust');
        cardEl.appendChild(this._createExhaustBadge());
      }

      if (canPlay && player.hp > 0 && enemy.hp > 0) {
        cardEl.addEventListener('click', () => {
          if (!this.isAnimating) this._handlePlayCard(index);
        });
      }

      const costEl = document.createElement('div');
      costEl.className = 'card-cost';
      costEl.textContent = actualCost;
      const titleEl = document.createElement('div');
      titleEl.className = 'card-title';
      titleEl.textContent = card.name;
      const rarityEl = document.createElement('div');
      rarityEl.className = 'card-rarity';
      rarityEl.textContent = this.getFullCardType(card.rarity, card.type);
      const imgEl = document.createElement('div');
      imgEl.className = 'card-img';
      const iconEl = document.createElement('span');
      iconEl.className = 'card-icon';
      iconEl.textContent = card.emoji;
      imgEl.appendChild(iconEl);
      const descEl = document.createElement('div');
      descEl.className = 'card-desc';
      descEl.textContent = this._getCardDescription(card);

      cardEl.append(costEl, titleEl, rarityEl, imgEl, descEl);

      if (this.state.hasRelic('smycz_zakopane') && player.hp > 0 && enemy.hp > 0) {
        const keepBtn = document.createElement('button');
        keepBtn.type = 'button';
        keepBtn.className = 'card-keep-btn';
        keepBtn.textContent = '📿';
        keepBtn.title = isKept ? 'Anuluj zachowanie' : 'Zachowaj na następną turę';
        keepBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.state.setSmyczKeptCard(index);
          this.updateUI();
        });
        cardEl.appendChild(keepBtn);
      }

      handDiv.appendChild(cardEl);
    });
  }

  /**
   * @param {number} handIndex
   */
  _handlePlayCard(handIndex) {
    if (this._isInputLocked()) return;
    const selectedCardId = this.state.hand[handIndex];
    if (!this._isTutorialCardPlayAllowed(selectedCardId)) {
      this._showFloatingText('sprite-player', 'Najpierw zagraj wskazaną kartę.', 'floating-shame');
      return;
    }
    const result = this.state.playCard(handIndex);
    if (!result.success) {
      if (result.reason === 'stunned_attack') {
        this._showFloatingText('sprite-player', 'OGŁUSZONY! Ataki zablokowane', 'floating-shame');
      } else if (result.reason === 'blokada') {
        this._showFloatingText('sprite-enemy', 'PARKINGOWY: LIMIT 3 KART!', 'floating-shame');
      }
      return;
    }

    const { effect } = result;
    this._handleTutorialCardPlayed(selectedCardId);
    const missEvent = this.state.consumeWeatherMissEvent();
    if (missEvent) {
      this.audioManager.playMissSound();
      const targetSprite = missEvent.target === 'enemy' ? 'sprite-enemy' : 'sprite-player';
      this._showFloatingText(targetSprite, missEvent.text, 'floating-damage');
    }
    if (this.state.consumeEnemyEvasionEvent()) {
      this.audioManager.playMissSound();
      this._showFloatingText('sprite-enemy', 'UNIK!', 'floating-damage');
    }
    const phaseTransitionText = this.state.consumeEnemyPhaseTransitionMessage();
    if (phaseTransitionText) {
      this._showFloatingText('sprite-enemy', phaseTransitionText, 'floating-shame');
    }
    const rachunekResistEvent = this.state.consumeRachunekResistEvent();
    if (rachunekResistEvent) {
      const targetSprite =
        rachunekResistEvent.target === 'enemy' ? 'sprite-enemy' : 'sprite-player';
      this._showFloatingText(targetSprite, rachunekResistEvent.text, 'floating-shame');
    }
    this._showLansDutkiSpentFeedback();

    if (effect.enemyAnim) {
      // Attack card: player lunges, then enemy reacts
      this.isAnimating = true;
      if (effect.playerAnim) this._triggerAnim('sprite-player', effect.playerAnim, 300);
      this.updateUI();

      setTimeout(() => {
        this._triggerAnim('sprite-enemy', effect.enemyAnim);
        this.updateUI();

        setTimeout(() => {
          this.isAnimating = false;
          const win = this.state.checkWinCondition();
          if (win) {
            this._showEndGame(win);
          } else {
            this.updateUI();
          }
        }, 400);
      }, 150);
    } else {
      // Skill / utility card: instant feedback on player
      if (effect.playerAnim) this._triggerAnim('sprite-player', effect.playerAnim);
      this.updateUI();
      const win = this.state.checkWinCondition();
      if (win) this._showEndGame(win);
    }
  }
  /**
   * Handles the end-of-turn sequence: discard, enemy attack animation, then start next turn.
   */
  _handleEndTurn() {
    if (this._isInputLocked()) return;
    if (!this._isTutorialEndTurnAllowed()) {
      if (this.isTutorialGuidanceActive) {
        this._showFloatingText('sprite-player', 'Jeszcze nie kończ tury.', 'floating-shame');
      }
      return;
    }
    if (this.isAnimating || this.state.currentScreen !== 'battle') return;
    if (this.state.enemy.hp <= 0 || this.state.player.hp <= 0) return;

    this._handleTutorialEndTurnClicked();

    this.isAnimating = true;
    this._syncEndTurnButtonState();

    const result = this.state.endTurn();
    this.updateUI();
    const missEvent = this.state.consumeWeatherMissEvent();
    if (missEvent) {
      this.audioManager.playMissSound();
      const targetSprite = missEvent.target === 'enemy' ? 'sprite-enemy' : 'sprite-player';
      this._showFloatingText(targetSprite, missEvent.text, 'floating-damage');
    }
    if (this.state.consumeEnemyEvasionEvent()) {
      this.audioManager.playMissSound();
      this._showFloatingText('sprite-enemy', 'UNIK!', 'floating-damage');
    }
    const phaseTransitionText = this.state.consumeEnemyPhaseTransitionMessage();
    if (phaseTransitionText) {
      this._showFloatingText('sprite-enemy', phaseTransitionText, 'floating-shame');
    }
    if (result.enemyPassiveHeal) {
      this._showFloatingText('sprite-enemy', result.enemyPassiveHeal.text, 'floating-heal');
    }
    if (result.playerPassiveHeal) {
      this._showFloatingText('sprite-player', result.playerPassiveHeal.text, 'floating-heal');
    }
    const lansBreakText = this.state.consumeLansBreakEvent();
    if (lansBreakText) {
      this._showFloatingText('sprite-player', lansBreakText, 'floating-shame');
    }
    this._showLansDutkiSpentFeedback();

    const immediateWin = this.state.checkWinCondition();
    if (immediateWin) {
      this.isAnimating = false;
      this._syncEndTurnButtonState();
      this._showEndGame(immediateWin);
      return;
    }

    setTimeout(() => {
      this._triggerAnim('sprite-enemy', 'anim-attack-e', 300);

      setTimeout(() => {
        const anim = result.enemyAttack.dealt > 0 ? 'anim-damage' : 'anim-block';
        this._triggerAnim('sprite-player', anim);
        this.updateUI();

        setTimeout(() => {
          this.isAnimating = false;
          const win = this.state.checkWinCondition();
          if (win) {
            this._showEndGame(win);
          } else {
            this.state.startTurn();
            this.updateUI();
          }
        }, 500);
      }, 150);
    }, 300);
  }

  /**
   * @param {'player_win'|'enemy_win'} outcome
   */
  _showEndGame(outcome) {
    if (this.isTutorialMode) {
      if (outcome === 'player_win') {
        this._startTutorialRewardPhase();
      } else {
        // Player lost in tutorial — restart from step 1
        this._handleTutorialStart();
      }
      return;
    }
    if (outcome === 'player_win') {
      const droppedDutki = this.state.grantBattleDutki();
      const currentNode = this.state.getCurrentMapNode();
      const isBossFight = this.state.enemy.id === 'boss' || this.state.enemy.id === 'fiakier';
      const isEliteFight = currentNode?.type === 'elite';
      const isBankrupt = this.state.enemy.isBankrupt;
      const bankruptBonus = this.state.enemyBankruptcyBonus;
      const scriptedEventRewardRelic = this.state.consumePendingEventVictoryRelicReward();

      if (isBossFight) {
        this.audioManager.playVictoryTheme();
        this.updateUI();
        const showSummary = () => {
          this.state.captureRunSummary('player_win');
          this._showRunSummaryOverlay();
        };

        if (isBankrupt && bankruptBonus > 0) {
          this._showFloatingText(
            'sprite-enemy',
            `+${bankruptBonus} ${this.state.getDutkiLabel(bankruptBonus)}!`,
            'floating-dutki'
          );
          setTimeout(showSummary, 2500);
        } else {
          setTimeout(showSummary, 700);
        }
        return;
      }

      if (isBankrupt) {
        this.updateUI();
        if (bankruptBonus > 0) {
          this._showFloatingText(
            'sprite-enemy',
            `+${bankruptBonus} ${this.state.getDutkiLabel(bankruptBonus)}!`,
            'floating-dutki'
          );
        }
        setTimeout(() => {
          if (scriptedEventRewardRelic) {
            this._showScriptedEventBattleRewards(scriptedEventRewardRelic, droppedDutki);
            return;
          }
          if (isEliteFight) {
            this._showEliteRewardOverlay(droppedDutki);
          } else {
            this._showVictoryOverlay(droppedDutki, isBossFight);
          }
        }, 2500);
        return;
      }

      if (scriptedEventRewardRelic) {
        this._showScriptedEventBattleRewards(scriptedEventRewardRelic, droppedDutki);
        return;
      }

      if (isEliteFight) {
        this._showEliteRewardOverlay(droppedDutki);
        return;
      }

      this._showVictoryOverlay(droppedDutki, isBossFight);
      return;
    }
    this.audioManager.playDefeatTheme();
    this.state.captureRunSummary('enemy_win');
    setTimeout(() => this._showRunSummaryOverlay(), 700);
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
    const choices = this._pickRewardCards(3);
    this.pendingBattleRelicClaimAction = () => {
      this._showCardRewardScreen(droppedDutki, choices, false);
    };
    this.showRelicScreen(relicId, 'battle');
    document.getElementById('end-turn-btn').disabled = true;
  }

  /**
   * Displays a victory reward overlay with 3 random non-basic cards.
   */
  _showVictoryOverlay(droppedDutki, isBossFight = false) {
    const relicScreen = document.getElementById('relic-reward-screen');
    const choices = this._pickRewardCards(3);
    const relicChoice = this._pickRewardRelic(isBossFight);

    const goToCardPhase = () => {
      this._showCardRewardScreen(droppedDutki, choices, isBossFight);
    };

    if (relicChoice) {
      this.pendingBattleRelicClaimAction = goToCardPhase;
      this.showRelicScreen(relicChoice, 'battle');
    } else {
      this.pendingBattleRelicClaimAction = null;
      relicScreen.classList.add('hidden');
      relicScreen.setAttribute('aria-hidden', 'true');
      goToCardPhase();
    }

    document.getElementById('end-turn-btn').disabled = true;
  }

  /**
   * @param {string} relicId
   * @param {'battle' | 'treasure'} source
   */
  showRelicScreen(relicId, source) {
    const relic = relicLibrary[relicId];
    if (!relic) return;

    const relicScreen = document.getElementById('relic-reward-screen');
    const cardScreen = document.getElementById('card-reward-screen');
    const titleEl = relicScreen?.querySelector('.victory-title');
    const glowWrap = relicScreen?.querySelector('.relic-glow-wrap');
    const rewardRelic = document.getElementById('reward-relic');
    const rewardRelicName = document.getElementById('reward-relic-name');
    const rewardRelicDesc = document.getElementById('reward-relic-desc');
    const claimBtn = document.getElementById('claim-relic-btn');
    if (
      !relicScreen ||
      !cardScreen ||
      !titleEl ||
      !glowWrap ||
      !rewardRelic ||
      !rewardRelicName ||
      !rewardRelicDesc ||
      !claimBtn
    ) {
      return;
    }

    glowWrap.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare');
    glowWrap.classList.add(this._rarityClass(relic.rarity));

    titleEl.textContent = source === 'treasure' ? 'Znalazłeś Skarb!' : 'Łup z wroga!';
    rewardRelic.textContent = relic.emoji;
    rewardRelicName.textContent = relic.name;
    rewardRelicDesc.textContent = relic.desc;

    claimBtn.onclick = () => {
      this.state.addRelic(relicId);
      relicScreen.classList.add('hidden');
      relicScreen.setAttribute('aria-hidden', 'true');

      if (source === 'battle') {
        const goToCardPhase = this.pendingBattleRelicClaimAction;
        this.pendingBattleRelicClaimAction = null;
        if (goToCardPhase) {
          goToCardPhase();
        }
      } else {
        this.pendingBattleRelicClaimAction = null;
        this.state.currentScreen = 'map';
        this._openMapOverlay();
      }

      this.updateUI();
    };

    this._hideOverlay('map-overlay');
    cardScreen.classList.add('hidden');
    cardScreen.setAttribute('aria-hidden', 'true');
    relicScreen.classList.remove('hidden');
    relicScreen.setAttribute('aria-hidden', 'false');
  }

  _showCardRewardScreen(droppedDutki, choices, isBossFight = false, options = {}) {
    const { title = 'Cepr usieczony! Wybierz łup:', allowSkip = true } = options;
    const cardScreen = document.getElementById('card-reward-screen');
    const titleEl = cardScreen?.querySelector('.victory-title');
    const rewardDutki = document.getElementById('victory-dutki');
    const rewardCards = document.getElementById('reward-cards');
    const skipBtn = document.getElementById('reward-skip-btn');
    if (titleEl) {
      titleEl.textContent = title;
    }

    const lines = [];
    if (this.state.lastVictoryMessage) {
      lines.push(this.state.lastVictoryMessage);
    }
    if (droppedDutki > 0) {
      lines.push(`Łup z bitki: +${droppedDutki} ${this.state.getDutkiLabel(droppedDutki)}`);
    }
    rewardDutki.textContent = lines.join(' | ');
    rewardCards.innerHTML = '';

    choices.forEach((cardId) => {
      const card = cardLibrary[cardId];
      const cardDesc = this._getCardDescription(card);
      const cardEl = document.createElement('button');
      cardEl.type = 'button';
      cardEl.className = `reward-card ${this._rarityClass(card.rarity)}`;
      cardEl.innerHTML = `
        <div class="reward-cost">${card.cost} Osc.</div>
        <div class="reward-emoji">${card.emoji}</div>
        <div class="reward-name">${card.name}</div>
        <div class="reward-rarity">${this.getFullCardType(card.rarity, card.type)}</div>
        <div class="reward-desc">${cardDesc}</div>
      `;
      if (card.exhaust) {
        cardEl.classList.add('card-exhaust');
        cardEl.prepend(this._createExhaustBadge());
      }
      cardEl.addEventListener('click', () => {
        this.state.deck.push(cardId);
        this._closeRewardScreens(isBossFight);
      });
      rewardCards.appendChild(cardEl);
    });

    if (allowSkip) {
      skipBtn.classList.remove('hidden');
      skipBtn.onclick = () => this._closeRewardScreens(isBossFight);
    } else {
      skipBtn.classList.add('hidden');
      skipBtn.onclick = null;
    }

    cardScreen.classList.remove('hidden');
    cardScreen.setAttribute('aria-hidden', 'false');
  }

  _closeRewardScreens(isBossFight = false) {
    const relicScreen = document.getElementById('relic-reward-screen');
    const cardScreen = document.getElementById('card-reward-screen');
    const skipBtn = document.getElementById('reward-skip-btn');

    relicScreen.classList.add('hidden');
    relicScreen.setAttribute('aria-hidden', 'true');
    cardScreen.classList.add('hidden');
    cardScreen.setAttribute('aria-hidden', 'true');
    const cardTitle = cardScreen.querySelector('.victory-title');
    if (cardTitle) {
      cardTitle.textContent = 'Cepr usieczony! Wybierz łup:';
    }
    if (skipBtn) {
      skipBtn.classList.remove('hidden');
    }

    if (this.isTutorialMode) {
      // Step 9 (index 8) — show map with tutorial overlay
      this.tutorialStepIndex = 8;
      this.isTutorialGuidanceActive = true;
      this._setTutorialMiniMap();
      this._openMapOverlay();
      this.updateUI();
      requestAnimationFrame(() => this._renderTutorialOverlay());
      return;
    }

    if (isBossFight) {
      this.state.captureRunSummary('player_win');
      this._showRunSummaryOverlay();
      return;
    }

    this._openMapOverlay();
    this.updateUI();
  }

  _showRunSummaryOverlay() {
    const overlay = document.getElementById('run-summary-overlay');
    const title = document.getElementById('run-summary-title');
    const killer = document.getElementById('run-summary-killer');
    const killerLine = document.getElementById('run-summary-killer-line');
    const floor = document.getElementById('run-summary-floor');
    const dutki = document.getElementById('run-summary-dutki');
    const turns = document.getElementById('run-summary-turns');
    const relics = document.getElementById('run-summary-relics');
    const deck = document.getElementById('run-summary-deck');
    if (
      !overlay ||
      !title ||
      !killer ||
      !killerLine ||
      !floor ||
      !dutki ||
      !turns ||
      !relics ||
      !deck
    ) {
      return;
    }

    const summary = this.state.runSummary;
    if (!summary) return;

    const isVictory = summary.outcome === 'player_win';
    title.textContent = isVictory ? '🏔️ ZWYCIĘSTWO!' : '💀 KONIEC PRZYGODY';

    if (summary.killerName) {
      killer.classList.remove('hidden');
      killerLine.textContent = `Zgładzony przez: ${summary.killerName}`;
    } else {
      killer.classList.add('hidden');
      killerLine.textContent = '';
    }

    floor.textContent = String(summary.runStats.floorReached);
    dutki.textContent = String(summary.runStats.totalDutkiEarned);
    turns.textContent = String(summary.runStats.totalTurnsPlayed);

    relics.innerHTML = '';
    summary.finalRelics.forEach((relic, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `relic-chip run-summary-relic ${this._rarityClass(relic.rarity)}`;
      chip.textContent = relic.emoji;
      chip.title = `${relic.name}: ${relic.desc}`;
      chip.style.animationDelay = `${index * 60}ms`;
      const tip = document.createElement('span');
      tip.className = 'relic-tooltip';
      tip.textContent = `${relic.name}: ${relic.desc}`;
      chip.appendChild(tip);
      relics.appendChild(chip);
    });

    deck.innerHTML = '';
    /** @type {Map<string, { card: import('../data/cards.js').CardDef, count: number }>} */
    const grouped = new Map();
    summary.finalDeck.forEach((card) => {
      const existing = grouped.get(card.id);
      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(card.id, { card, count: 1 });
      }
    });

    [...grouped.values()].forEach(({ card, count }, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = `run-summary-card ${this._rarityClass(card.rarity)}`;
      cardEl.style.animationDelay = `${index * 40}ms`;
      cardEl.innerHTML = `
        <div class="run-summary-card-head">
          <span class="run-summary-card-emoji">${card.emoji}</span>
          <span class="run-summary-card-name">${card.name}</span>
          <span class="run-summary-card-count">x${count}</span>
        </div>
        <div class="run-summary-card-desc">${card.desc}</div>
      `;
      deck.appendChild(cardEl);
    });

    this._hideOverlay('relic-reward-screen');
    this._hideOverlay('card-reward-screen');
    this._hideOverlay('map-overlay');
    this._hideOverlay('shop-overlay');
    this._hideOverlay('campfire-overlay');
    this._hideOverlay('random-event-overlay');

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    this.state.currentScreen = 'event';
    this.updateUI();
  }

  _handleRunSummaryReplay() {
    if (this._isInputLocked()) return;
    this._hideOverlay('run-summary-overlay');
    this.audioManager.clearDefeatThemeLock();
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
    const eliteCardChoices = this._pickRareRewardCards(3);
    const hasThreeRareChoices = eliteCardChoices.length >= 3;
    const cardChoices = hasThreeRareChoices ? eliteCardChoices : this._pickRewardCards(3);
    const cardTitle = hasThreeRareChoices
      ? 'Elita pokonana! Wybierz kartę rare:'
      : 'Elita pokonana! Wybierz kartę:';
    const goToCardPhase = () => {
      this._showCardRewardScreen(droppedDutki, cardChoices, false, {
        title: cardTitle,
        allowSkip: false,
      });
      document.getElementById('end-turn-btn').disabled = true;
    };

    const relicChoices = this._pickEliteRewardRelics(3);
    if (relicChoices.length < 3) {
      goToCardPhase();
      return;
    }

    const cardScreen = document.getElementById('card-reward-screen');
    const rewardDutki = document.getElementById('victory-dutki');
    const rewardCards = document.getElementById('reward-cards');
    const skipBtn = document.getElementById('reward-skip-btn');
    const titleEl = cardScreen?.querySelector('.victory-title');
    if (!cardScreen || !rewardDutki || !rewardCards || !skipBtn || !titleEl) return;

    const lines = [];
    if (this.state.lastVictoryMessage) {
      lines.push(this.state.lastVictoryMessage);
    }
    if (droppedDutki > 0) {
      lines.push(`Łup z bitki: +${droppedDutki} ${this.state.getDutkiLabel(droppedDutki)}`);
    }
    rewardDutki.textContent = lines.join(' | ');
    titleEl.textContent = 'Elita pokonana! Wybierz pamiątkę:';
    rewardCards.innerHTML = '';

    relicChoices.forEach((relicId) => {
      const relic = relicLibrary[relicId];
      if (!relic) return;
      const relicEl = document.createElement('button');
      relicEl.type = 'button';
      relicEl.className = `reward-card reward-relic-choice ${this._rarityClass(relic.rarity)}`;
      relicEl.innerHTML = `
        <div class="reward-emoji">${relic.emoji}</div>
        <div class="reward-name">${relic.name}</div>
        <div class="reward-rarity">${this._rarityLabel(relic.rarity, 'relic')}</div>
        <div class="reward-desc">${relic.desc}</div>
      `;
      relicEl.addEventListener('click', () => {
        this.state.addRelic(relicId);
        goToCardPhase();
      });
      rewardCards.appendChild(relicEl);
    });

    skipBtn.classList.add('hidden');
    skipBtn.onclick = null;
    cardScreen.classList.remove('hidden');
    cardScreen.setAttribute('aria-hidden', 'false');
    document.getElementById('end-turn-btn').disabled = true;
  }

  _handleTutorialStart() {
    if (this._isInputLocked()) return;

    this._closeReleaseNotesModal();
    this._closeOptionsModal();
    this._hideOverlay('library-overlay');
    this._hideOverlay('map-overlay');
    this._hideOverlay('shop-overlay');
    this._hideOverlay('campfire-overlay');
    this._hideOverlay('random-event-overlay');
    this._hideOverlay('relic-reward-screen');
    this._hideOverlay('card-reward-screen');
    this._hideOverlay('run-summary-overlay');
    this._hideOverlay('pile-viewer-overlay');

    this.state.resetForNewRun(startingDeck);
    this.state.currentScreen = 'battle';
    this.state.hasStartedFirstBattle = true;
    this.mapMessage = '';

    this.state.player.hp = this.state.player.maxHp;
    this.state.player.energy = 3;
    this.state.player.block = 0;
    this.state.player.status = tutorialPlayerStatus();
    this.state.player.stunned = false;
    this.state.player.cardsPlayedThisTurn = 0;

    this.state.enemy = this.state._createEnemyState(enemyLibrary.zagubiony_ceper);
    this.state.enemy.currentIntent = {
      type: 'attack',
      name: 'Niezdarny Cios',
      damage: 5,
      hits: 1,
    };
    this.state.enemy.nextAttack = 5;
    this.state.currentWeather = 'clear';
    this.state.relics = ['ciupaga_dlugopis'];

    this.state.deck = [];
    this.state.discard = [];
    this.state.exhaust = [];
    this.state.hand = this._buildTutorialFixedHand();
    this.state.pendingBattleDutki = false;

    this.isAnimating = false;
    this.isTutorialMode = true;
    this.isTutorialGuidanceActive = true;
    this.tutorialStepIndex = 0;

    this._playEncounterMusic();
    this.updateUI();
    this._syncScreenState();
  }

  /** @returns {string[]} */
  _buildTutorialFixedHand() {
    return ['ciupaga', 'goralska_obrona', ...this._pickTutorialRandomCards(3)];
  }

  /**
   * @param {number} count
   * @returns {string[]}
   */
  _pickTutorialRandomCards(count) {
    const pool = Object.keys(cardLibrary).filter((cardId) => {
      if (cardId === 'ciupaga' || cardId === 'goralska_obrona') return false;
      const card = cardLibrary[cardId];
      if (!card) return false;
      if (card.type === 'status' || card.unplayable) return false;
      if (card.eventOnly || card.rarity === 'rare' || card.tutorialOnly) return false;
      return true;
    });

    const picks = [];
    const clonedPool = [...pool];
    while (picks.length < count && clonedPool.length > 0) {
      const roll = Math.floor(Math.random() * clonedPool.length);
      picks.push(clonedPool.splice(roll, 1)[0]);
    }
    return picks;
  }

  _startTutorialRewardPhase() {
    // Step 7 (index 6) — fixed, existing non-event/non-rare relic
    const tutorialRelicId = tutorialFixedRelicId;
    // Step 8 (index 7) — fixed starter-deck cards only
    const tutorialCardChoices = [...tutorialFixedCardRewardIds];

    this.tutorialStepIndex = 6;
    this.isTutorialGuidanceActive = true;

    this.pendingBattleRelicClaimAction = () => {
      // Step 8 (index 7) — show card reward
      this.tutorialStepIndex = 7;
      this.isTutorialGuidanceActive = true;
      this._showCardRewardScreen(0, tutorialCardChoices, false, {
        title: 'Zdobyłeś kartę! Wybierz jedną:',
        allowSkip: false,
      });
      this.updateUI();
      requestAnimationFrame(() => this._renderTutorialOverlay());
    };

    this.showRelicScreen(tutorialRelicId, 'battle');
    this.updateUI();
    requestAnimationFrame(() => this._renderTutorialOverlay());
  }

  /**
   * @param {{ dynamicText?: string, text?: string }} step
   * @returns {string}
   */
  _resolveTutorialStepText(step) {
    if (step.dynamicText === 'map_explain') {
      return buildTutorialMapExplanationText((type) => this.state.getMapNodeMeta(type));
    }
    if (step.dynamicText === 'finale_text') {
      return buildTutorialFinaleText((type) => this.state.getMapNodeMeta(type));
    }
    return step.text ?? '';
  }

  _positionTutorialBubble() {
    const bubble = document.querySelector('#tutorial-overlay .tutorial-bubble');
    if (!(bubble instanceof HTMLElement)) return;
    const step = this._getCurrentTutorialStep();

    const playerSprite = document.querySelector('#player .sprite');
    const isBattleTutorial = this.isTutorialMode && this.state.currentScreen === 'battle';

    if (!(playerSprite instanceof HTMLElement) || !isBattleTutorial) {
      bubble.classList.remove('tutorial-bubble--player');
      bubble.style.left = '';
      bubble.style.top = '';
      bubble.style.bottom = '';
      bubble.style.transform = '';
      bubble.style.setProperty('--tutorial-tail-left', '44px');
      return;
    }

    const spriteRect = playerSprite.getBoundingClientRect();
    const maxWidth = Math.min(560, window.innerWidth - 20);
    const bubbleWidth = Math.min(maxWidth, bubble.offsetWidth || maxWidth);
    const bubbleHeight = bubble.offsetHeight || 180;

    const left = Math.max(
      10,
      Math.min(
        spriteRect.left + spriteRect.width / 2 - bubbleWidth / 2,
        window.innerWidth - bubbleWidth - 10
      )
    );
    const isRelicExplanationStep = Boolean(step?.selectors?.includes('.relics-wrap'));
    const top = isRelicExplanationStep
      ? Math.max(10, Math.min(spriteRect.bottom + 14, window.innerHeight - bubbleHeight - 10))
      : Math.max(10, spriteRect.top - bubbleHeight - 16);

    bubble.classList.add('tutorial-bubble--player');
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    bubble.style.bottom = 'auto';
    bubble.style.transform = 'none';

    const tailLeft = Math.max(
      24,
      Math.min(spriteRect.left + spriteRect.width / 2 - left, bubbleWidth - 24)
    );
    bubble.style.setProperty('--tutorial-tail-left', `${tailLeft}px`);
  }

  _setTutorialMiniMap() {
    const sequence = tutorialMapSequence;

    this.state.map = createTutorialMiniMap(sequence, (type) => this.state.getMapNodeMeta(type));

    this.state.currentLevel = 0;
    this.state.currentNodeIndex = 1;
    this.state.currentNode = { x: 1, y: 0 };
    this.state.hasStartedFirstBattle = true;
  }

  _handleTutorialAcknowledge() {
    const step = this._getCurrentTutorialStep();
    if (!step) return;
    if (step.action !== 'ack') return;
    this.tutorialStepIndex += 1;
    this.updateUI();
  }

  _getCurrentTutorialStep() {
    if (!this.isTutorialGuidanceActive) return null;
    if (this.tutorialStepIndex >= tutorialSteps.length) {
      this.isTutorialGuidanceActive = false;
      return null;
    }
    return tutorialSteps[this.tutorialStepIndex] ?? null;
  }

  _disableTutorialGuidance() {
    this.isTutorialGuidanceActive = false;
    this.tutorialStepIndex = tutorialSteps.length;
    this._renderTutorialOverlay();
  }

  _syncTutorialExitButton() {
    const exitBtn = document.getElementById('tutorial-exit-btn');
    if (!exitBtn) return;
    const shouldShow = this.isTutorialMode;
    exitBtn.classList.toggle('hidden', !shouldShow);
    exitBtn.setAttribute('aria-hidden', String(!shouldShow));
  }

  _renderTutorialOverlay() {
    const overlay = document.getElementById('tutorial-overlay');
    const text = document.getElementById('tutorial-text');
    const ackBtn = document.getElementById('tutorial-ack-btn');
    const layer = document.getElementById('tutorial-highlight-layer');
    const concludeBtns = document.getElementById('tutorial-conclude-btns');
    const bubble = overlay?.querySelector('.tutorial-bubble');
    const dim = overlay?.querySelector('.tutorial-dim');
    if (!overlay || !text || !ackBtn || !layer) return;

    this.tutorialFocusedElements.forEach((element) => {
      element.classList.remove('tutorial-focus-target');
    });
    this.tutorialFocusedElements = [];
    layer.innerHTML = '';

    const step = this._getCurrentTutorialStep();
    if (!step) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      if (concludeBtns) concludeBtns.classList.add('hidden');
      if (bubble) bubble.classList.remove('tutorial-bubble--conclude');
      overlay.classList.remove('tutorial-overlay--map-explain');
      if (bubble) bubble.classList.remove('tutorial-bubble--map-explain');
      return;
    }

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    text.textContent = this._resolveTutorialStepText(step);

    // Control ack button text and visibility
    const showAck = step.action === 'ack';
    ackBtn.classList.toggle('hidden', !showAck);
    if (showAck) {
      ackBtn.textContent = step.btnText ?? 'Zrozumiałem';
    }

    // Control conclude buttons (step 10 - conclusion)
    if (concludeBtns) {
      concludeBtns.classList.toggle('hidden', step.action !== 'conclude');
    }
    if (bubble) {
      bubble.classList.toggle('tutorial-bubble--conclude', step.action === 'conclude');
    }

    const isMapExplainStep = step.dynamicText === 'map_explain';
    overlay.classList.toggle('tutorial-overlay--map-explain', isMapExplainStep);
    if (bubble) {
      bubble.classList.toggle('tutorial-bubble--map-explain', isMapExplainStep);
    }

    // Control dim transparency for reward-phase steps (noDim flag)
    if (dim) {
      dim.style.opacity = step.noDim ? '0' : '';
    }

    const targets = step.selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector)).filter(
        (element) => !element.classList.contains('hidden')
      )
    );

    targets.forEach((element) => {
      element.classList.add('tutorial-focus-target');
      this.tutorialFocusedElements.push(element);

      const rect = element.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.className = 'tutorial-highlight';
      const padding = 6;
      highlight.style.left = `${Math.max(0, rect.left - padding)}px`;
      highlight.style.top = `${Math.max(0, rect.top - padding)}px`;
      highlight.style.width = `${rect.width + padding * 2}px`;
      highlight.style.height = `${rect.height + padding * 2}px`;
      layer.appendChild(highlight);
    });

    this._positionTutorialBubble();
  }

  /**
   * @param {EventTarget | null} target
   * @returns {boolean}
   */
  _isTutorialInteractionAllowed(target) {
    if (!this.isTutorialGuidanceActive) return true;
    if (!(target instanceof Element)) return false;
    if (target.closest('#tutorial-ack-btn')) return true;
    if (target.closest('#tutorial-exit-btn')) return true;
    if (target.closest('#tutorial-repeat-btn')) return true;
    if (target.closest('#tutorial-finish-btn')) return true;
    // Never allow map node clicks while tutorial guidance is active
    if (target.closest('.map-node-btn')) return false;
    return this.tutorialFocusedElements.some((element) => element.contains(target));
  }

  /**
   * @param {string | undefined} cardId
   * @returns {boolean}
   */
  _isTutorialCardPlayAllowed(cardId) {
    if (!this.isTutorialGuidanceActive) return true;
    const step = this._getCurrentTutorialStep();
    if (!step) return true;
    if (step.action !== 'play_card') return false;
    return cardId === step.requiredCardId;
  }

  /**
   * @param {string | undefined} cardId
   */
  _handleTutorialCardPlayed(cardId) {
    if (!this.isTutorialGuidanceActive) return;
    const step = this._getCurrentTutorialStep();
    if (!step || step.action !== 'play_card') return;
    if (cardId !== step.requiredCardId) return;
    this.tutorialStepIndex += 1;
  }

  /** @returns {boolean} */
  _isTutorialEndTurnAllowed() {
    if (!this.isTutorialGuidanceActive) return true;
    const step = this._getCurrentTutorialStep();
    if (!step) return true;
    return step.action === 'end_turn';
  }

  _handleTutorialEndTurnClicked() {
    if (!this.isTutorialGuidanceActive) return;
    const step = this._getCurrentTutorialStep();
    if (!step || step.action !== 'end_turn') return;
    this.tutorialStepIndex += 1;
    // Disable guidance so the player finishes combat freely; reward phase will re-enable it.
    this._disableTutorialGuidance();
  }

  _handleTutorialRepeat() {
    // Reset to step 1 — restart the full tutorial from combat
    this._handleTutorialStart();
  }

  _handleTutorialFinish() {
    this._setTutorialDoneFlag();
    // Transition to title screen but show finale message first
    this.audioManager.clearDefeatThemeLock();

    this._hideOverlay('map-overlay');
    this._hideOverlay('shop-overlay');
    this._hideOverlay('campfire-overlay');
    this._hideOverlay('random-event-overlay');
    this._hideOverlay('relic-reward-screen');
    this._hideOverlay('card-reward-screen');
    this._hideOverlay('run-summary-overlay');
    this._hideOverlay('pile-viewer-overlay');

    this.state.resetForNewRun(startingDeck);
    this.state.currentScreen = 'title';
    this.mapMessage = '';
    // isTutorialMode=false hides exit button; keep guidance active for finale step
    this.isTutorialMode = false;
    this.tutorialStepIndex = tutorialSteps.length - 1; // finale step (index 10)
    this.isTutorialGuidanceActive = true;
    this.updateUI();
    this._syncScreenState();
    this._renderTutorialOverlay();
  }

  _finishTutorialMode() {
    this._setTutorialDoneFlag();
    this._disableTutorialGuidance();
    this.isTutorialMode = false;
    this.audioManager.clearDefeatThemeLock();

    this._hideOverlay('map-overlay');
    this._hideOverlay('shop-overlay');
    this._hideOverlay('campfire-overlay');
    this._hideOverlay('random-event-overlay');
    this._hideOverlay('relic-reward-screen');
    this._hideOverlay('card-reward-screen');
    this._hideOverlay('run-summary-overlay');
    this._hideOverlay('pile-viewer-overlay');

    this.state.resetForNewRun(startingDeck);
    this.state.currentScreen = 'title';
    this.mapMessage = '';
    this.updateUI();
    this._syncScreenState();
  }

  _setTutorialDoneFlag() {
    try {
      localStorage.setItem(TUTORIAL_DONE_KEY, 'true');
    } catch {
      // Ignore blocked localStorage.
    }
  }

  _openMapOverlay() {
    this._renderMapTrack();
    const overlay = document.getElementById('map-overlay');
    const panel = overlay?.querySelector('.event-panel');
    const mapTree = document.getElementById('map-tree');

    overlay?.classList.toggle('map-overlay--tutorial', this.isTutorialMode);
    panel?.classList.toggle('map-panel--tutorial', this.isTutorialMode);
    mapTree?.classList.toggle('map-tree--tutorial', this.isTutorialMode);

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    this.audioManager.playMapMusic();
  }

  _renderMapTrack() {
    const levels = document.getElementById('map-levels');
    const message = document.getElementById('map-message');
    const continueBtn = document.getElementById('map-continue-btn');
    const mapHpCurrent = document.getElementById('map-hp-current');
    const mapHpMax = document.getElementById('map-hp-max');
    const mapDutki = document.getElementById('map-dutki');
    if (!levels || !message || !continueBtn) return;

    if (mapHpCurrent) mapHpCurrent.textContent = String(this.state.player.hp);
    if (mapHpMax) mapHpMax.textContent = String(this.state.player.maxHp);
    if (mapDutki) mapDutki.textContent = String(this.state.dutki);

    const mapTitle = document.querySelector('#map-overlay .event-title');
    if (mapTitle) {
      const isHard = this.state.difficulty === 'hard';
      mapTitle.innerHTML = isHard
        ? `Perć przez Tatry <span class="hard-badge">🌶️ HARD</span>`
        : 'Perć przez Tatry';
    }

    levels.innerHTML = '';
    message.textContent = this.mapMessage;

    const reachable = new Set(this.state.getReachableNodes());
    const canStartFirstFight = !this.state.hasStartedFirstBattle && this.state.currentLevel === 0;
    const revealAllMap = this.state.debugRevealAllMap;
    const isLocked = this._isInputLocked();
    /** @type {HTMLElement[][]} */
    const nodeButtons = [];

    this.state.map.forEach((levelNodes, levelIndex) => {
      const row = document.createElement('div');
      row.className = 'map-level';
      nodeButtons[levelIndex] = [];

      levelNodes.forEach((node, nodeIndex) => {
        if (!node) {
          const placeholder = document.createElement('div');
          placeholder.className = 'map-node-placeholder';
          row.appendChild(placeholder);
          nodeButtons[levelIndex][nodeIndex] = null;
          return;
        }

        const wrap = document.createElement('div');
        wrap.className = 'map-node-wrap';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-node-btn';
        btn.classList.add(`map-node-type-${node.type}`);

        const isCurrent =
          levelIndex === this.state.currentLevel && nodeIndex === this.state.currentNodeIndex;
        const isDone = levelIndex < this.state.currentLevel;
        const isInitialFight =
          canStartFirstFight && isCurrent && (node.type === 'fight' || node.type === 'maryna');
        const isSelectable =
          isInitialFight ||
          (this.state.hasStartedFirstBattle &&
            levelIndex === this.state.currentLevel + 1 &&
            reachable.has(nodeIndex));

        if (isCurrent) btn.classList.add('current');
        if (isDone) btn.classList.add('done');
        if (isSelectable && !isLocked) {
          btn.classList.add('available');
          btn.addEventListener('click', () => this._handleMapNodeSelect(levelIndex, nodeIndex));
        } else {
          btn.classList.add('locked');
          btn.disabled = !isCurrent;
          if (isLocked) btn.disabled = true;
        }

        const revealedEmoji =
          node.type === 'event' && (this.state.hasRelic('mapa_zakopanego') || revealAllMap)
            ? this._revealedEventEmoji(node.eventOutcome)
            : node.emoji;
        btn.innerHTML = `
          <span class="map-node-emoji">${revealedEmoji}</span>
          <span class="map-node-label">${node.label}</span>
        `;

        wrap.appendChild(btn);

        if (node.weather !== 'clear') {
          const weather = weatherLibrary[node.weather];
          const hint = document.createElement('button');
          hint.type = 'button';
          hint.className = 'map-weather-hint weather-hint-trigger';
          hint.textContent = weather?.emoji ?? '🌤️';
          hint.title = weather ? `${weather.name}: ${weather.desc}` : 'Pogoda';
          hint.setAttribute(
            'aria-label',
            weather
              ? `Pogoda na polu ${node.label}: ${weather.name}. ${weather.desc}`
              : 'Pogoda na polu'
          );
          hint.setAttribute('aria-expanded', 'false');

          const tooltip = document.createElement('span');
          tooltip.className = 'weather-tooltip';
          tooltip.textContent = weather
            ? `${weather.name}: ${weather.desc}`
            : 'Brak danych o pogodzie.';
          hint.appendChild(tooltip);

          hint.addEventListener('click', (event) => {
            event.stopPropagation();
            this._toggleWeatherTooltip(hint);
          });

          wrap.appendChild(hint);
        }

        row.appendChild(wrap);
        nodeButtons[levelIndex][nodeIndex] = btn;
      });

      levels.appendChild(row);
    });

    const isOnBoss = this.state.currentLevel === this.state.map.length - 1;
    continueBtn.textContent = isOnBoss ? 'Nowa perć' : 'Idź dalej';
    continueBtn.classList.toggle('hidden', !isOnBoss);
    continueBtn.disabled = isLocked;

    requestAnimationFrame(() => this._drawMapConnections(nodeButtons));
  }

  _drawMapConnections(nodeButtons) {
    const tree = document.getElementById('map-tree');
    const svg = document.getElementById('map-lines');
    if (!tree || !svg) return;

    const width = tree.clientWidth;
    const height = tree.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.innerHTML = '';

    const reachableTargets = this.state.getReachableNodes();
    const revealAllMap = this.state.debugRevealAllMap;

    const treeRect = tree.getBoundingClientRect();
    for (let level = 0; level < this.state.map.length - 1; level++) {
      this.state.map[level].forEach((node, nodeIndex) => {
        const fromEl = nodeButtons[level]?.[nodeIndex];
        if (!fromEl) return;
        const fromRect = fromEl.getBoundingClientRect();
        const x1 = fromRect.left - treeRect.left + fromRect.width / 2;
        const y1 = fromRect.top - treeRect.top + fromRect.height / 2;

        node.connections.forEach((targetIndex) => {
          const toEl = nodeButtons[level + 1]?.[targetIndex];
          if (!toEl) return;
          const toRect = toEl.getBoundingClientRect();
          const x2 = toRect.left - treeRect.left + toRect.width / 2;
          const y2 = toRect.top - treeRect.top + toRect.height / 2;

          const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const dy = Math.max(14, Math.abs(y2 - y1) * 0.35);
          curve.setAttribute('d', `M ${x1} ${y1} C ${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`);
          curve.classList.add('map-link');

          const isCurrent =
            level === this.state.currentLevel && nodeIndex === this.state.currentNodeIndex;
          const isReachable =
            this.state.hasStartedFirstBattle &&
            level + 1 === this.state.currentLevel + 1 &&
            reachableTargets.includes(targetIndex);
          const isDonePath = level < this.state.currentLevel;
          const isFuturePath = level > this.state.currentLevel;

          if (isDonePath) {
            curve.classList.add('done');
          } else if (isFuturePath) {
            curve.classList.add('future');
          }
          if (isReachable || revealAllMap) {
            curve.classList.add('available');
          }
          if (isCurrent && isReachable) {
            curve.classList.add('active');
          }

          svg.appendChild(curve);
        });
      });
    }
  }

  _handleMapNodeSelect(level, nodeIndex) {
    if (this._isInputLocked()) return;
    const isInitialFight =
      !this.state.hasStartedFirstBattle &&
      level === 0 &&
      this.state.currentLevel === 0 &&
      nodeIndex === this.state.currentNodeIndex;

    if (isInitialFight) {
      const currentNode = this.state.map[this.state.currentLevel][this.state.currentNodeIndex];
      if (currentNode?.type === 'maryna') {
        this._openMarynaBoonOverlay();
        return;
      }
      this.state.hasStartedFirstBattle = true;
      this.state.currentScreen = 'battle';
      this._hideOverlay('map-overlay');
      this._playEncounterMusic();
      document.getElementById('end-turn-btn').disabled = false;
      this.updateUI();
      return;
    }

    const node = this.state.travelTo(level, nodeIndex);
    if (!node) return;
    this.mapMessage = '';

    if (node.type === 'fight' || node.type === 'elite' || node.type === 'boss') {
      this.state.hasStartedFirstBattle = true;
      this.state.currentScreen = 'battle';
      this.state.resetBattle();
      this._hideOverlay('map-overlay');
      this._playEncounterMusic();
      document.getElementById('end-turn-btn').disabled = false;
      this.updateUI();
      return;
    }

    if (node.type === 'shop') {
      this.state.currentScreen = 'map';
      this._openShop();
      return;
    }

    if (node.type === 'event') {
      const outcome = node.eventOutcome ?? this.state.rollEventNodeOutcome();
      if (outcome === 'fight') {
        this.state.hasStartedFirstBattle = true;
        this.state.currentScreen = 'battle';
        this.state.resetBattle();
        this._hideOverlay('map-overlay');
        this._playEncounterMusic();
        document.getElementById('end-turn-btn').disabled = false;
        this.updateUI();
        return;
      }
      if (outcome === 'shop') {
        this.state.currentScreen = 'map';
        this._openShop();
        return;
      }
      this.state.currentScreen = 'event';
      this._openRandomEvent();
      return;
    }

    if (node.type === 'treasure') {
      this.state.currentScreen = 'map';
      this._handleTreasureNode();
      return;
    }

    this.state.currentScreen = 'map';
    this._openCampfire();
  }

  _openMarynaBoonOverlay() {
    const overlay = document.getElementById('maryna-boon-overlay');
    if (!overlay) return;

    const imageEl = document.getElementById('maryna-boon-image');
    if (imageEl) imageEl.innerHTML = marynaSvg;

    const choiceIds = this.state.rollMarynaChoices(3);
    const choicesEl = document.getElementById('maryna-boon-choices');
    if (!choicesEl) return;
    choicesEl.innerHTML = '';

    choiceIds.forEach((boonId) => {
      const boon = marynaBoonLibrary[boonId];
      if (!boon) return;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'maryna-boon-card';
      card.innerHTML = `
        <span class="maryna-boon-emoji">${boon.emoji}</span>
        <strong class="maryna-boon-name">${boon.name}</strong>
        <em class="maryna-boon-flavor">${boon.flavor}</em>
        <span class="maryna-boon-effect">${boon.effectDesc}</span>
      `;

      card.addEventListener('click', () => {
        this.state.pickMarynaBoon(boonId);
        this.state.hasStartedFirstBattle = true;
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
        this._openMapOverlay();
      });

      choicesEl.appendChild(card);
    });

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  _handleMapAdvance() {
    if (this._isInputLocked()) return;
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
    const relicId = this.state.generateRelicReward(true);
    if (!relicId) {
      this.mapMessage = 'Skrzynia była pusta... ani jednej pamiątki.';
      this._openMapOverlay();
      return;
    }

    this.showRelicScreen(relicId, 'treasure');
    this.updateUI();
  }

  /**
   * @param {string | null} [forcedEventId]
   */
  _openRandomEvent(forcedEventId = null) {
    const overlay = document.getElementById('random-event-overlay');
    const title = document.getElementById('random-event-title');
    const image = document.getElementById('random-event-image');
    const description = document.getElementById('random-event-description');
    const choicesContainer = document.getElementById('random-event-choices');
    const result = document.getElementById('random-event-result');
    const continueBtn = document.getElementById('random-event-continue-btn');
    if (
      !overlay ||
      !title ||
      !image ||
      !description ||
      !choicesContainer ||
      !result ||
      !continueBtn
    ) {
      return;
    }

    let eventDef = null;
    if (forcedEventId) {
      this.state.setActiveEvent(forcedEventId);
      eventDef = this.state.getActiveEventDef();
    } else {
      eventDef = this.state.pickRandomEventDef();
    }
    if (!eventDef) {
      this.mapMessage = 'Cisza na szlaku... dziś nic się nie wydarzyło.';
      this.state.currentScreen = 'map';
      this._openMapOverlay();
      return;
    }

    if (!forcedEventId) {
      this.state.setActiveEvent(eventDef.id);
    }

    if (
      eventDef.id === 'fiakier_event' ||
      eventDef.id === 'event_karykaturzysta' ||
      eventDef.id === 'event_hazard_karton'
    ) {
      this.audioManager.playEventMusic(eventDef.id);
    }

    const fallbackFight = eventDef.fallbackFight;
    if (fallbackFight && this.state.dutki < fallbackFight.minDutki) {
      this.pendingEventFallbackEnemyId = fallbackFight.enemyId;
      title.textContent = eventDef.title;
      image.innerHTML = eventDef.image;
      description.textContent = fallbackFight.message;
      result.textContent = 'Przedzierasz się przez tłum i szykujesz do walki.';
      continueBtn.classList.remove('hidden');
      continueBtn.textContent = 'Stań do walki';
      choicesContainer.innerHTML = '';

      this._hideOverlay('map-overlay');
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
      this.updateUI();
      return;
    }

    this.pendingEventFallbackEnemyId = null;
    continueBtn.textContent = 'Kontynuuj';

    title.textContent = eventDef.title;
    image.innerHTML = eventDef.image;
    description.textContent = eventDef.description;
    result.textContent = '';
    continueBtn.classList.add('hidden');

    choicesContainer.innerHTML = '';
    eventDef.choices.forEach((choice, choiceIndex) => {
      const choiceBtn = document.createElement('button');
      choiceBtn.type = 'button';
      choiceBtn.className = 'random-event-choice';
      choiceBtn.disabled = this.state.dutki < choice.cost;
      const fallbackConsequence =
        choice.cost > 0
          ? `Koszt: ${choice.cost} ${this.state.getDutkiLabel(choice.cost)}.`
          : 'Koszt: brak.';
      const consequence = choice.consequence ?? fallbackConsequence;
      choiceBtn.innerHTML = `
        <span class="random-event-choice-title">${choice.text}</span>
        <span class="random-event-choice-desc">${choice.description}</span>
        <span class="random-event-choice-impact">Skutek: ${consequence}</span>
      `;
      choiceBtn.addEventListener('click', () => this._handleRandomEventChoice(choiceIndex));
      choicesContainer.appendChild(choiceBtn);
    });

    this._hideOverlay('map-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    this.updateUI();
  }

  /**
   * @param {number} choiceIndex
   */
  _handleRandomEventChoice(choiceIndex) {
    if (this._isInputLocked()) return;
    const result = this.state.applyActiveEventChoice(choiceIndex);
    const resultEl = document.getElementById('random-event-result');
    const continueBtn = document.getElementById('random-event-continue-btn');
    if (!resultEl || !continueBtn) return;

    resultEl.textContent = result.message;
    if (!result.success) return;

    document.querySelectorAll('#random-event-choices .random-event-choice').forEach((btn) => {
      if (btn instanceof HTMLButtonElement) {
        btn.disabled = true;
      }
    });
    continueBtn.classList.remove('hidden');
    this.updateUI();
  }

  _continueAfterRandomEvent() {
    if (this._isInputLocked()) return;
    this._hideOverlay('random-event-overlay');

    const queuedEventBattle = this.state.consumeQueuedEventBattle();
    if (queuedEventBattle) {
      this.state.clearActiveEvent();
      this.state.currentScreen = 'battle';
      const started = this.state.startBattleWithEnemyId(queuedEventBattle.enemyId, {
        battleContext: 'event',
        rewardRelicId: queuedEventBattle.rewardRelicId,
      });
      if (!started) {
        this.mapMessage = 'Nie udało się rozpocząć walki eventowej.';
        this.state.currentScreen = 'map';
        this._openMapOverlay();
        this.updateUI();
        return;
      }
      this._playEncounterMusic();
      document.getElementById('end-turn-btn').disabled = false;
      this.updateUI();
      return;
    }

    if (this.pendingEventFallbackEnemyId) {
      this.state.clearActiveEvent();
      this.state.currentScreen = 'battle';
      const started = this.state.startBattleWithEnemyId(this.pendingEventFallbackEnemyId, {
        battleContext: 'event',
      });
      this.pendingEventFallbackEnemyId = null;
      if (!started) {
        const emergencyEnemy = enemyLibrary.pomocnik_fiakra;
        if (emergencyEnemy) {
          this.state.enemy = this.state._createEnemyState(emergencyEnemy);
        }
      }
      this._playEncounterMusic();
      document.getElementById('end-turn-btn').disabled = false;
      this.updateUI();
      return;
    }

    if (this.state.applyJumpToBossShortcut()) {
      this.mapMessage = 'Fiakier skrócił drogę. Następny przystanek: finał wyprawy.';
    } else {
      this.mapMessage = '';
    }

    this.state.clearActiveEvent();
    this.state.currentScreen = 'map';
    this._openMapOverlay();
    this.updateUI();
  }

  _openShop() {
    if (this._isInputLocked()) return;
    this._hideOverlay('map-overlay');
    const overlay = document.getElementById('shop-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    this.state.generateShopStock();
    this._renderShopOffers();
    this.audioManager.playShopMusic();
  }

  _closeShop() {
    if (this._isInputLocked()) return;
    this._hideOverlay('shop-overlay');
    this.audioManager.stopShopMusic();
    this._openMapOverlay();
    this.updateUI();
  }

  _renderShopOffers() {
    const cardContainer = document.getElementById('shop-cards');
    const relicContainer = document.getElementById('shop-relic');
    const healBtn = document.getElementById('shop-heal-btn');
    const removeBtn = document.getElementById('shop-remove-btn');
    const message = document.getElementById('shop-message');
    const cards = this.state.shopStock.cards;

    cardContainer.innerHTML = '';
    cards.forEach((cardId) => {
      const card = cardLibrary[cardId];
      if (!card) return;
      const cardDesc = this._getCardDescription(card);

      const cardBox = document.createElement('div');
      cardBox.className = `shop-item ${this._rarityClass(card.rarity)}`;
      if (card.exhaust) {
        cardBox.classList.add('card-exhaust');
        cardBox.appendChild(this._createExhaustBadge());
      }

      const title = document.createElement('div');
      title.className = 'shop-item-title';
      title.textContent = `${card.emoji} ${card.name}`;
      title.title = cardDesc;
      title.setAttribute('aria-label', `${card.name}: ${cardDesc}`);

      const desc = document.createElement('div');
      desc.className = 'shop-item-desc';
      desc.textContent = cardDesc;

      const rarity = document.createElement('div');
      rarity.className = 'shop-item-rarity';
      rarity.textContent = this.getFullCardType(card.rarity, card.type);

      const price = document.createElement('div');
      price.className = 'shop-item-price';
      const cardShopPrice = this.state.getCardShopPrice(cardId);
      price.textContent = `${cardShopPrice} 💰`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-card-btn';
      btn.textContent = 'Kup';
      btn.title = `${card.name}: ${cardDesc}`;
      btn.setAttribute('aria-label', `Kup kartę ${card.name}. ${cardDesc}`);
      btn.disabled = this.state.dutki < cardShopPrice;
      btn.addEventListener('click', () => {
        if (this._isInputLocked()) return;
        const cardWithPrice = { ...card, price: cardShopPrice };
        const result = this.state.buyItem(cardWithPrice, 'card');
        message.textContent = result.message;
        this._renderShopOffers();
        this.updateUI();
      });

      cardBox.append(title, rarity, desc, price, btn);
      cardContainer.appendChild(cardBox);
    });

    relicContainer.innerHTML = '';
    if (this.state.shopStock.relic) {
      const relic = relicLibrary[this.state.shopStock.relic];
      if (relic) {
        const relicBox = document.createElement('div');
        relicBox.className = `shop-item ${this._rarityClass(relic.rarity)}`;

        const title = document.createElement('div');
        title.className = 'shop-item-title';
        title.textContent = `${relic.emoji} ${relic.name}`;
        title.title = relic.desc;
        title.setAttribute('aria-label', `${relic.name}: ${relic.desc}`);

        const desc = document.createElement('div');
        desc.className = 'shop-item-desc';
        desc.textContent = relic.desc;

        const rarity = document.createElement('div');
        rarity.className = 'shop-item-rarity';
        rarity.textContent = this._rarityLabel(relic.rarity, 'relic');

        const price = document.createElement('div');
        price.className = 'shop-item-price';
        price.textContent = `${relic.price} 💰`;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shop-card-btn';
        btn.textContent = 'Kup';
        btn.title = `${relic.name}: ${relic.desc}`;
        btn.setAttribute('aria-label', `Kup pamiątkę ${relic.name}. ${relic.desc}`);
        btn.disabled = this.state.dutki < relic.price;
        btn.addEventListener('click', () => {
          if (this._isInputLocked()) return;
          const result = this.state.buyItem(relic, 'relic');
          message.textContent = result.message;
          this._renderShopOffers();
          this.updateUI();
        });

        relicBox.append(title, rarity, desc, price, btn);
        relicContainer.appendChild(relicBox);
      }
    }

    healBtn.disabled = this.state.dutki < 75 || this.state.player.hp >= this.state.player.maxHp;
    this._populateRemoveCardSelect();
    const select = document.getElementById('shop-remove-select');
    const removalPrice = this.state.getShopRemovalPrice();
    removeBtn.textContent = `Usuń kartę (${removalPrice} 💰)`;
    removeBtn.disabled = this.state.dutki < removalPrice || !select.value;

    if (!message.textContent) {
      message.textContent = this.state.lastShopMessage;
    }
  }

  /**
   * @returns {HTMLDivElement}
   */
  _createExhaustBadge() {
    const badge = document.createElement('div');
    badge.className = 'card-exhaust-badge';
    badge.innerHTML = '<span class="card-exhaust-fire">🔥</span> <b>PRZEPADO</b>';
    return badge;
  }

  _buyShopHeal() {
    if (this._isInputLocked()) return;
    const message = document.getElementById('shop-message');
    if (!this.state.spendDutki(75)) {
      message.textContent = 'Ni mos tela dutków, synek!';
      return;
    }
    this.state.healPlayer(15);
    message.textContent = 'Baca dał oscypek na ratunek.';
    this._renderShopOffers();
    this.updateUI();
  }

  _buyCardRemoval() {
    if (this._isInputLocked()) return;
    const select = document.getElementById('shop-remove-select');
    const message = document.getElementById('shop-message');
    const cardId = select.value;
    if (!cardId) return;
    const removalPrice = this.state.getShopRemovalPrice();
    if (!this.state.spendDutki(removalPrice)) {
      message.textContent = 'Ni mos tela dutków, synek!';
      return;
    }
    const removed = this.state.removeCardFromDeck(cardId);
    if (!removed) {
      message.textContent = 'Nie ma tej karty do usunięcia.';
      return;
    }
    message.textContent = `Usunięto kartę: ${cardLibrary[cardId]?.name ?? cardId}`;
    this.state.afterShopCardRemoval();
    this._renderShopOffers();
    this.updateUI();
  }

  _populateRemoveCardSelect() {
    const select = document.getElementById('shop-remove-select');
    const pool = [
      ...this.state.deck,
      ...this.state.hand,
      ...this.state.discard,
      ...this.state.exhaust,
    ];
    const unique = [...new Set(pool)];
    select.innerHTML = '';
    unique.forEach((cardId) => {
      const option = document.createElement('option');
      option.value = cardId;
      option.textContent = cardLibrary[cardId]?.name ?? cardId;
      select.appendChild(option);
    });
  }

  _openCampfire() {
    if (this._isInputLocked()) return;
    this.campfireUsed = false;
    this._hideOverlay('map-overlay');
    const overlay = document.getElementById('campfire-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    this.audioManager.playCampfireMusic();

    const campHpCurrent = document.getElementById('camp-hp-current');
    const campHpMax = document.getElementById('camp-hp-max');
    if (campHpCurrent) campHpCurrent.textContent = String(this.state.player.hp);
    if (campHpMax) campHpMax.textContent = String(this.state.player.maxHp);

    const select = document.getElementById('camp-card-select');
    select.innerHTML = '';
    const options = this.state.getUpgradeableAttackCards();
    options.forEach((cardId) => {
      const option = document.createElement('option');
      option.value = cardId;
      option.textContent = cardLibrary[cardId]?.name ?? cardId;
      select.appendChild(option);
    });

    document.getElementById('camp-upgrade-btn').disabled = options.length === 0;
  }

  _openLibraryOverlay() {
    if (this._isInputLocked()) return;
    this.libraryTab = 'cards';
    this.libraryRarityFilter = 'all';
    this._renderLibrary();
    const overlay = document.getElementById('library-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  _closeLibraryOverlay() {
    if (this._isInputLocked()) return;
    this._hideOverlay('library-overlay');
    this._syncScreenState();
  }

  /**
   * @param {'cards' | 'relics'} tab
   */
  _setLibraryTab(tab) {
    if (this._isInputLocked()) return;
    this.libraryTab = tab;
    this._renderLibrary();
  }

  /**
   * @param {'all' | 'common' | 'uncommon' | 'rare'} rarity
   */
  _setLibraryFilter(rarity) {
    if (this._isInputLocked()) return;
    this.libraryRarityFilter = rarity;
    this._renderLibrary();
  }

  _renderLibrary() {
    const grid = document.getElementById('library-grid');
    const cardsTabBtn = document.getElementById('library-tab-cards');
    const relicsTabBtn = document.getElementById('library-tab-relics');
    if (!grid || !cardsTabBtn || !relicsTabBtn) return;

    cardsTabBtn.classList.toggle('is-active', this.libraryTab === 'cards');
    cardsTabBtn.setAttribute('aria-selected', String(this.libraryTab === 'cards'));
    relicsTabBtn.classList.toggle('is-active', this.libraryTab === 'relics');
    relicsTabBtn.setAttribute('aria-selected', String(this.libraryTab === 'relics'));

    document.querySelectorAll('.library-filter').forEach((btn) => {
      if (!(btn instanceof HTMLButtonElement)) return;
      const isActive = btn.dataset.rarity === this.libraryRarityFilter;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    grid.innerHTML = '';
    const entries =
      this.libraryTab === 'cards'
        ? Object.values(cardLibrary)
            .filter((card) => !card.eventOnly && !card.tutorialOnly)
            .filter((card) =>
              this.libraryRarityFilter === 'all' ? true : card.rarity === this.libraryRarityFilter
            )
            .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'pl'))
        : Object.values(relicLibrary)
            .filter((relic) =>
              this.libraryRarityFilter === 'all' ? true : relic.rarity === this.libraryRarityFilter
            )
            .sort((a, b) => a.name.localeCompare(b.name, 'pl'));

    entries.forEach((item) => {
      const card = document.createElement('article');
      card.className = `library-item ${this._rarityClass(item.rarity)}`;

      if (this.libraryTab === 'cards') {
        const cardDef = /** @type {import('../data/cards.js').CardDef} */ (item);
        card.className = `library-item card ${this._rarityClass(cardDef.rarity)} card-${cardDef.type}`;

        const cost = document.createElement('div');
        cost.className = 'card-cost';
        cost.textContent = String(cardDef.cost);

        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = cardDef.name;

        const rarity = document.createElement('div');
        rarity.className = 'card-rarity';
        rarity.textContent = this.getFullCardType(cardDef.rarity, cardDef.type);

        const emoji = document.createElement('div');
        emoji.className = 'card-img';
        const iconEl = document.createElement('span');
        iconEl.className = 'card-icon';
        iconEl.textContent = cardDef.emoji;
        emoji.appendChild(iconEl);

        const desc = document.createElement('div');
        desc.className = 'card-desc';
        desc.textContent = this._getCardDescription(cardDef);

        card.append(cost, title, rarity, emoji, desc);

        if (cardDef.exhaust) {
          card.classList.add('card-exhaust');
          card.appendChild(this._createExhaustBadge());
        }
      } else {
        const title = document.createElement('h3');
        title.className = 'library-item-title';
        title.textContent = `${item.emoji} ${item.name}`;

        const rarity = document.createElement('p');
        rarity.className = 'library-item-rarity';
        rarity.textContent = this._rarityLabel(item.rarity, 'relic');

        const desc = document.createElement('p');
        desc.className = 'library-item-desc';
        desc.textContent = item.desc;

        card.append(title, rarity, desc);
      }

      grid.appendChild(card);
    });
  }

  _closeCampfire() {
    if (this._isInputLocked()) return;
    this._hideOverlay('campfire-overlay');
    this.audioManager.stopCampfireMusic();
    this._openMapOverlay();
    this.updateUI();
  }

  _useCampfireHeal() {
    if (this._isInputLocked()) return;
    if (this.campfireUsed) return;
    const healAmount = Math.max(1, Math.floor(this.state.player.maxHp * 0.2));
    this.state.healPlayer(healAmount);
    this.campfireUsed = true;
    this._closeCampfire();
  }

  _useCampfireUpgrade() {
    if (this._isInputLocked()) return;
    if (this.campfireUsed) return;
    const select = document.getElementById('camp-card-select');
    const cardId = select.value;
    if (!cardId) return;
    this.state.upgradeCardDamage(cardId, 3);
    this.campfireUsed = true;
    this._closeCampfire();
  }

  /**
   * @param {string} overlayId
   */
  _hideOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
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
    if (outcome === 'fight') return '⚔️';
    if (outcome === 'shop') return '🛖';
    return '❓';
  }

  _rarityClass(rarity) {
    return `rarity-${rarity ?? 'common'}`;
  }

  /**
   * @param {'common' | 'uncommon' | 'rare' | undefined} rarity
   * @param {'card' | 'relic'} type
   * @returns {string}
   */
  _rarityLabel(rarity, type) {
    const labels = {
      common: type === 'card' ? 'Powszechna karta' : 'Powszechna pamiątka',
      uncommon: type === 'card' ? 'Niepowszechna karta' : 'Niepowszechna pamiątka',
      rare: type === 'card' ? 'Rzadka karta' : 'Rzadka pamiątka',
    };
    return labels[rarity ?? 'common'];
  }

  /**
   * @param {'common' | 'uncommon' | 'rare' | undefined} rarity
   * @param {'attack' | 'skill' | 'status' | 'power'} type
   * @returns {string}
   */
  getFullCardType(rarity, type) {
    const typeLabelMap = {
      attack: { label: 'Atak', gender: 'm' },
      status: { label: 'Stan', gender: 'm' },
      skill: { label: 'Umiejętność', gender: 'f' },
      power: { label: 'Moc', gender: 'f' },
    };

    const selectedType = typeLabelMap[type] ?? typeLabelMap.attack;
    const rarityByGender = {
      common: selectedType.gender === 'f' ? 'Powszechna' : 'Powszechny',
      uncommon: selectedType.gender === 'f' ? 'Niepowszechna' : 'Niepowszechny',
      rare: selectedType.gender === 'f' ? 'Rzadka' : 'Rzadki',
    };

    return `${rarityByGender[rarity ?? 'common']} ${selectedType.label}`;
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
    const el = document.getElementById(elementId);
    el.classList.remove(animClass);
    void el.offsetWidth;
    el.classList.add(animClass);
    setTimeout(() => el.classList.remove(animClass), duration);
  }

  /**
   * @param {string} elementId
   * @param {string} text
   * @param {string} extraClass
   */
  _showFloatingText(elementId, text, extraClass) {
    const anchor = document.getElementById(elementId);
    if (!anchor) return;

    const float = document.createElement('div');
    float.className = `floating-text ${extraClass}`;
    float.textContent = text;
    anchor.appendChild(float);

    setTimeout(() => {
      float.remove();
    }, 1100);
  }

  _showLansDutkiSpentFeedback() {
    const spent = this.state.consumeLansDutkiSpentEvent();
    if (spent <= 0) return;
    this._showFloatingText(
      'sprite-player',
      `LANS: -${spent} ${this.state.getDutkiLabel(spent)}`,
      'floating-dutki-loss'
    );
  }

  /**
   * Scales the game wrapper to fit the viewport height on small screens.
   */
  _scaleGame() {
    const wrapper = document.getElementById('game-wrapper');
    wrapper.style.zoom = '';
    const scale = Math.min(1, window.innerHeight / wrapper.offsetHeight);
    if (scale < 1) wrapper.style.zoom = scale;
  }

  _isInputLocked() {
    return Boolean(this.state.isInputLocked);
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
    const ordinals = ['PIERWSZA', 'DRUGA', 'TRZECIA', 'CZWARTA', 'PIĄTA'];
    const ordinal = ordinals[actNumber - 1] ?? `${actNumber}.`;

    return {
      partLabel: `CZĘŚĆ ${ordinal}`,
      actLabel: '',
      title: this.state.currentActName || 'NIEZNANY SZLAK',
    };
  }
}
