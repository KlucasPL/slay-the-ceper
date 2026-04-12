import { cardLibrary, startingDeck } from '../data/cards.js';
import { enemyLibrary } from '../data/enemies.js';
import { relicLibrary } from '../data/relics.js';
import { releaseNotesData } from '../data/releaseNotes.js';
import { weatherLibrary } from '../data/weather.js';
import { statusTooltipRegistry } from './statusTooltips.js';

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
    if (cornerOptionsBtn) cornerOptionsBtn.addEventListener('click', () => this._openOptionsModal());

    document
      .getElementById('title-btn-normal')
      .addEventListener('click', () => this._handleTitleStart('normal'));
    document
      .getElementById('title-btn-hard')
      .addEventListener('click', () => this._handleTitleStart('hard'));
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
    document
      .querySelectorAll('.library-filter')
      .forEach((filterBtn) => {
        filterBtn.addEventListener('click', () => {
          const rarity = filterBtn.dataset.rarity;
          if (
            rarity === 'all' ||
            rarity === 'common' ||
            rarity === 'uncommon' ||
            rarity === 'rare'
          ) {
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
    window.addEventListener('resize', () => this._scaleGame());
    this._scaleGame();
    this._renderReleaseNotesButtonLabel();
    this._renderReleaseNotes();
    this._renderAudioOptions();
    this.updateUI();
    this._syncScreenState();
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
    this._syncEndTurnButtonState();
    this._syncScreenState();
    this._renderCornerOptionsButton();
    const gameWrapper = document.getElementById('game-wrapper');
    if (gameWrapper) {
      gameWrapper.classList.toggle('hard-mode', this.state.difficulty === 'hard');
    }
  }

  /**
   * @param {'normal' | 'hard'} difficulty
   */
  _handleTitleStart(difficulty) {
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
    const modal = document.getElementById('options-modal');
    if (!modal) return;
    this._renderAudioOptions();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  _closeOptionsModal() {
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
  }

  _toggleMenuMusicOption() {
    this.audioManager.toggleMenuMusic(!this.audioManager.isMenuMusicEnabled);
    this._renderAudioOptions();
  }

  _toggleGameMusicOption() {
    this.audioManager.toggleGameMusic(!this.audioManager.isGameMusicEnabled);
    this._renderAudioOptions();
  }

  _syncScreenState() {
    const titleScreen = document.getElementById('title-screen');
    if (!titleScreen) return;

    const isTitle = this.state.currentScreen === 'title';
    if (isTitle) {
      titleScreen.classList.remove('is-hiding', 'hidden');
    } else {
      titleScreen.classList.toggle(
        'hidden',
        !titleScreen.classList.contains('is-hiding')
      );
    }
    titleScreen.setAttribute('aria-hidden', String(!isTitle));
    this.audioManager.setContext(isTitle ? 'title' : 'inGame');
    this._renderCornerOptionsButton();
  }

  _syncEndTurnButtonState() {
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (!endTurnBtn) return;

    const inBattle = this.state.currentScreen === 'battle';
    endTurnBtn.disabled = this.isAnimating || !inBattle;
  }

  /**
   * Updates enemy title and SVG sprite when enemy changes.
   */
  _renderEnemyPresentation() {
    const enemyName = document.getElementById('enemy-name');
    const enemySprite = document.getElementById('sprite-enemy');
    const enemyId = this.state.enemy.id;
    enemyName.textContent = `${this.state.enemy.name} ${this.state.enemy.emoji}`;
    if (enemySprite.dataset.enemyId !== enemyId) {
      enemySprite.innerHTML = this.state.enemy.spriteSvg;
      enemySprite.dataset.enemyId = enemyId;
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
      rarityEl.textContent = this._rarityLabel(card.rarity, 'card');
      const imgEl = document.createElement('div');
      imgEl.className = 'card-img';
      imgEl.textContent = card.emoji;
      const descEl = document.createElement('div');
      descEl.className = 'card-desc';
      descEl.textContent = card.desc;

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
    const missEvent = this.state.consumeWeatherMissEvent();
    if (missEvent) {
      this.audioManager.playMissSound();
      const targetSprite = missEvent.target === 'enemy' ? 'sprite-enemy' : 'sprite-player';
      this._showFloatingText(targetSprite, missEvent.text, 'floating-damage');
    }
    const rachunekResistEvent = this.state.consumeRachunekResistEvent();
    if (rachunekResistEvent) {
      const targetSprite =
        rachunekResistEvent.target === 'enemy' ? 'sprite-enemy' : 'sprite-player';
      this._showFloatingText(targetSprite, rachunekResistEvent.text, 'floating-shame');
    }

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
    if (this.isAnimating || this.state.currentScreen !== 'battle') return;
    if (this.state.enemy.hp <= 0 || this.state.player.hp <= 0) return;

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
    if (outcome === 'player_win') {
      const droppedDutki = this.state.grantBattleDutki();
      const isBossFight = this.state.enemy.id === 'boss' || this.state.enemy.id === 'fiakier';
      const isBankrupt = this.state.enemy.isBankrupt;
      const bankruptBonus = this.state.enemyBankruptcyBonus;

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
          this._showVictoryOverlay(droppedDutki, isBossFight);
        }, 2500);
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

  _showCardRewardScreen(droppedDutki, choices, isBossFight = false) {
    const cardScreen = document.getElementById('card-reward-screen');
    const rewardDutki = document.getElementById('victory-dutki');
    const rewardCards = document.getElementById('reward-cards');
    const skipBtn = document.getElementById('reward-skip-btn');

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
      const cardEl = document.createElement('button');
      cardEl.type = 'button';
      cardEl.className = `reward-card ${this._rarityClass(card.rarity)}`;
      cardEl.innerHTML = `
        <div class="reward-cost">${card.cost} Osc.</div>
        <div class="reward-emoji">${card.emoji}</div>
        <div class="reward-name">${card.name}</div>
        <div class="reward-rarity">${this._rarityLabel(card.rarity, 'card')}</div>
        <div class="reward-desc">${card.desc}</div>
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

    skipBtn.onclick = () => this._closeRewardScreens(isBossFight);

    cardScreen.classList.remove('hidden');
    cardScreen.setAttribute('aria-hidden', 'false');
  }

  _closeRewardScreens(isBossFight = false) {
    const relicScreen = document.getElementById('relic-reward-screen');
    const cardScreen = document.getElementById('card-reward-screen');

    relicScreen.classList.add('hidden');
    relicScreen.setAttribute('aria-hidden', 'true');
    cardScreen.classList.add('hidden');
    cardScreen.setAttribute('aria-hidden', 'true');

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
    this._hideOverlay('run-summary-overlay');
    this.audioManager.clearDefeatThemeLock();
    this.state.resetForNewRun(startingDeck);
    this.state.currentScreen = 'map';
    this.mapMessage = '';
    this._openMapOverlay();
    this.updateUI();
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

  _openMapOverlay() {
    this._renderMapTrack();
    const overlay = document.getElementById('map-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  _renderMapTrack() {
    const levels = document.getElementById('map-levels');
    const message = document.getElementById('map-message');
    const continueBtn = document.getElementById('map-continue-btn');
    if (!levels || !message || !continueBtn) return;

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

        const isCurrent =
          levelIndex === this.state.currentLevel && nodeIndex === this.state.currentNodeIndex;
        const isDone = levelIndex < this.state.currentLevel;
        const isInitialFight = canStartFirstFight && isCurrent && node.type === 'fight';
        const isSelectable =
          isInitialFight ||
          (this.state.hasStartedFirstBattle &&
            levelIndex === this.state.currentLevel + 1 &&
            reachable.has(nodeIndex));

        if (isCurrent) btn.classList.add('current');
        if (isDone) btn.classList.add('done');
        if (isSelectable) {
          btn.classList.add('available');
          btn.addEventListener('click', () => this._handleMapNodeSelect(levelIndex, nodeIndex));
        } else {
          btn.classList.add('locked');
          btn.disabled = !isCurrent;
        }

        const revealedEmoji =
          node.type === 'event' && this.state.hasRelic('mapa_zakopanego')
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
            weather ? `Pogoda na polu ${node.label}: ${weather.name}. ${weather.desc}` : 'Pogoda na polu'
          );
          hint.setAttribute('aria-expanded', 'false');

          const tooltip = document.createElement('span');
          tooltip.className = 'weather-tooltip';
          tooltip.textContent = weather ? `${weather.name}: ${weather.desc}` : 'Brak danych o pogodzie.';
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
          const controlY = (y1 + y2) / 2;
          curve.setAttribute('d', `M ${x1} ${y1} Q ${x1} ${controlY} ${x2} ${y2}`);
          curve.classList.add('map-link');

          const isCurrent =
            level === this.state.currentLevel && nodeIndex === this.state.currentNodeIndex;
          const isReachable =
            this.state.hasStartedFirstBattle &&
            level + 1 === this.state.currentLevel + 1 &&
            this.state.getReachableNodes().includes(targetIndex);
          if (isCurrent && isReachable) {
            curve.classList.add('active');
          }

          svg.appendChild(curve);
        });
      });
    }
  }

  _handleMapNodeSelect(level, nodeIndex) {
    const isInitialFight =
      !this.state.hasStartedFirstBattle &&
      level === 0 &&
      this.state.currentLevel === 0 &&
      nodeIndex === this.state.currentNodeIndex;

    if (isInitialFight) {
      this.state.hasStartedFirstBattle = true;
      this.state.currentScreen = 'battle';
      this._hideOverlay('map-overlay');
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
      this.audioManager.playBattleMusic();
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
        this.audioManager.playBattleMusic();
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

  _handleMapAdvance() {
    const isOnBoss = this.state.currentLevel === this.state.map.length - 1;
    if (!isOnBoss) return;

    this.state.generateMap();
    this.state.hasStartedFirstBattle = true;
    this.state.currentScreen = 'battle';
    this.mapMessage = '';
    this.state.resetBattle();
    this._hideOverlay('map-overlay');
    this.audioManager.playBattleMusic();
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

  _openRandomEvent() {
    const overlay = document.getElementById('random-event-overlay');
    const title = document.getElementById('random-event-title');
    const image = document.getElementById('random-event-image');
    const description = document.getElementById('random-event-description');
    const choicesContainer = document.getElementById('random-event-choices');
    const result = document.getElementById('random-event-result');
    const continueBtn = document.getElementById('random-event-continue-btn');
    if (!overlay || !title || !image || !description || !choicesContainer || !result || !continueBtn) {
      return;
    }

    const eventDef = this.state.pickRandomEventDef();
    if (!eventDef) {
      this.mapMessage = 'Cisza na szlaku... dziś nic się nie wydarzyło.';
      this.state.currentScreen = 'map';
      this._openMapOverlay();
      return;
    }

    this.state.setActiveEvent(eventDef.id);

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
      choiceBtn.innerHTML = `
        <span class="random-event-choice-title">${choice.text}</span>
        <span class="random-event-choice-desc">${choice.description}</span>
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
    this._hideOverlay('random-event-overlay');

    if (this.pendingEventFallbackEnemyId) {
      this.state.clearActiveEvent();
      this.state.currentScreen = 'battle';
      const started = this.state.startBattleWithEnemyId(this.pendingEventFallbackEnemyId);
      this.pendingEventFallbackEnemyId = null;
      if (!started) {
        const emergencyEnemy = enemyLibrary.pomocnik_fiakra;
        if (emergencyEnemy) {
          this.state.enemy = this.state._createEnemyState(emergencyEnemy);
        }
      }
      this.audioManager.playBattleMusic();
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
    this._hideOverlay('map-overlay');
    const overlay = document.getElementById('shop-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    this.state.generateShopStock();
    this._renderShopOffers();
    this.audioManager.playShopMusic();
  }

  _closeShop() {
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

      const cardBox = document.createElement('div');
      cardBox.className = `shop-item ${this._rarityClass(card.rarity)}`;
      if (card.exhaust) {
        cardBox.classList.add('card-exhaust');
        cardBox.appendChild(this._createExhaustBadge());
      }

      const title = document.createElement('div');
      title.className = 'shop-item-title';
      title.textContent = `${card.emoji} ${card.name}`;
      title.title = card.desc;
      title.setAttribute('aria-label', `${card.name}: ${card.desc}`);

      const desc = document.createElement('div');
      desc.className = 'shop-item-desc';
      desc.textContent = card.desc;

      const rarity = document.createElement('div');
      rarity.className = 'shop-item-rarity';
      rarity.textContent = this._rarityLabel(card.rarity, 'card');

      const price = document.createElement('div');
      price.className = 'shop-item-price';
      const cardShopPrice = this.state.getCardShopPrice(cardId);
      price.textContent = `${cardShopPrice} 💰`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-card-btn';
      btn.textContent = 'Kup';
      btn.title = `${card.name}: ${card.desc}`;
      btn.setAttribute('aria-label', `Kup kartę ${card.name}. ${card.desc}`);
      btn.disabled = this.state.dutki < cardShopPrice;
      btn.addEventListener('click', () => {
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
    this.campfireUsed = false;
    this._hideOverlay('map-overlay');
    const overlay = document.getElementById('campfire-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    this.audioManager.playCampfireMusic();

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
    this.libraryTab = 'cards';
    this.libraryRarityFilter = 'all';
    this._renderLibrary();
    const overlay = document.getElementById('library-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  _closeLibraryOverlay() {
    this._hideOverlay('library-overlay');
    this._syncScreenState();
  }

  /**
   * @param {'cards' | 'relics'} tab
   */
  _setLibraryTab(tab) {
    this.libraryTab = tab;
    this._renderLibrary();
  }

  /**
   * @param {'all' | 'common' | 'uncommon' | 'rare'} rarity
   */
  _setLibraryFilter(rarity) {
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
            .filter((card) =>
              this.libraryRarityFilter === 'all' ? true : card.rarity === this.libraryRarityFilter
            )
            .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'pl'))
        : Object.values(relicLibrary)
            .filter((relic) =>
              this.libraryRarityFilter === 'all'
                ? true
                : relic.rarity === this.libraryRarityFilter
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
        rarity.textContent = this._rarityLabel(cardDef.rarity, 'card');

        const emoji = document.createElement('div');
        emoji.className = 'card-img';
        emoji.textContent = cardDef.emoji;

        const desc = document.createElement('div');
        desc.className = 'card-desc';
        desc.textContent = cardDef.desc;

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
    this._hideOverlay('campfire-overlay');
    this.audioManager.stopCampfireMusic();
    this._openMapOverlay();
    this.updateUI();
  }

  _useCampfireHeal() {
    if (this.campfireUsed) return;
    const healAmount = Math.max(1, Math.floor(this.state.player.maxHp * 0.2));
    this.state.healPlayer(healAmount);
    this.campfireUsed = true;
    this._closeCampfire();
  }

  _useCampfireUpgrade() {
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

  /**
   * Scales the game wrapper to fit the viewport height on small screens.
   */
  _scaleGame() {
    const wrapper = document.getElementById('game-wrapper');
    wrapper.style.zoom = '';
    const scale = Math.min(1, window.innerHeight / wrapper.offsetHeight);
    if (scale < 1) wrapper.style.zoom = scale;
  }
}
