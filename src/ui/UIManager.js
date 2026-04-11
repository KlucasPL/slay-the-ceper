import { cardLibrary } from '../data/cards.js';
import { relicLibrary } from '../data/relics.js';

export class UIManager {
  /**
   * @param {import('../state/GameState.js').GameState} state
   * @param {import('../audio/AudioManager.js').AudioManager} audioManager
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

    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) muteBtn.addEventListener('click', () => this._toggleMute());

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
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('.status-tag-hint')) {
        this._closeStatusTooltips();
      }
    });
    window.addEventListener('resize', () => this._scaleGame());
    this._scaleGame();
    this.updateUI();
    this._syncScreenState();
    this._renderMuteButton();
  }

  _toggleMute() {
    this.audioManager.toggleMute();
    this._renderMuteButton();
  }

  _renderMuteButton() {
    const muteBtn = document.getElementById('mute-btn');
    if (!muteBtn) return;
    const muted = this.audioManager.isMuted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.classList.toggle('is-muted', muted);
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Włącz dźwięk' : 'Wycisz dźwięk');
    muteBtn.title = muted ? 'Dźwięk wyłączony' : 'Dźwięk włączony';
  }

  /**
   * Re-renders all stat displays, statuses, and the card hand.
   */
  updateUI() {
    const { player, enemy, deck, discard, exhaust } = this.state;
    this._renderEnemyPresentation();
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
    document.getElementById('e-intent').textContent = this.state.getEnemyIntentText();
    document.getElementById('draw-pile-count').textContent = deck.length;
    document.getElementById('discard-pile-count').textContent = discard.length;
    document.getElementById('exhaust-pile-count').textContent = exhaust.length;
    this._renderStatuses('p-statuses', player.status);
    this._renderStatuses('e-statuses', enemy.status);
    this._renderHand();
    this._syncScreenState();
    this._renderMuteButton();
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

  _syncScreenState() {
    const titleScreen = document.getElementById('title-screen');
    if (!titleScreen) return;

    const isTitle = this.state.currentScreen === 'title';
    titleScreen.classList.toggle(
      'hidden',
      !isTitle && !titleScreen.classList.contains('is-hiding')
    );
    titleScreen.setAttribute('aria-hidden', String(!isTitle));
    this.audioManager.setContext(isTitle ? 'title' : 'inGame');
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

    const tooltipMap = {
      strength: 'Każdy punkt Siły dodaje +1 do obrażeń ataków.',
      weak: 'Słabość zmniejsza zadawane obrażenia o 25% i spada o 1 co turę.',
      fragile: 'Kruchość to status czasowy: schodzi co turę i czeka na kolejne mechaniki.',
      next_double: 'Następny cios zada podwójne obrażenia, a potem efekt zniknie.',
      energy_next_turn: 'Na początku następnej tury dostaniesz dodatkowy Oscypek.',
    };

    /** @param {number} turns */
    const turnLabel = (turns) => (turns === 1 ? 'tura' : 'tury');

    /**
     * @param {string} text
     * @param {string} [tooltip]
     */
    const tag = (text, tooltip) => {
      const element = tooltip ? document.createElement('button') : document.createElement('span');
      element.className = 'status-tag';
      element.textContent = text;
      if (tooltip) {
        element.classList.add('status-tag-hint');
        element.type = 'button';
        element.setAttribute('aria-label', `${text}: ${tooltip}`);
        element.setAttribute('aria-expanded', 'false');

        const tip = document.createElement('span');
        tip.className = 'status-tooltip';
        tip.textContent = tooltip;
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
      }
      el.appendChild(element);
    };

    if (status.strength > 0) tag(`💢 Siła: ${status.strength}`, tooltipMap.strength);
    if (status.weak > 0)
      tag(`🤢 Słabość: ${status.weak} ${turnLabel(status.weak)}`, tooltipMap.weak);
    if (status.fragile > 0)
      tag(`🫧 Kruchość: ${status.fragile} ${turnLabel(status.fragile)}`, tooltipMap.fragile);
    if (status.next_double) tag('✨ Następny cios: x2', tooltipMap.next_double);
    if (status.energy_next_turn > 0)
      tag(`⚡ Nast. tura: +${status.energy_next_turn} Oscypek`, tooltipMap.energy_next_turn);

    if (containerId === 'e-statuses') {
      this.state.getEnemySpecialStatuses().forEach((special) => {
        tag(special.text, special.tooltip);
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
      const canPlay = player.energy >= actualCost;

      const cardEl = document.createElement('div');
      const isKept = this.state.smyczKeptCardId === cardId;
      cardEl.className = `card ${this._rarityClass(card.rarity)}${canPlay ? '' : ' disabled'}${isKept ? ' card--kept' : ''}`;

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
          this.state.setSmyczKeptCard(cardId);
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
    if (!result.success) return;

    const { effect } = result;

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
          if (win) this._showEndGame(win);
        }, 400);
      }, 150);
    } else {
      // Skill / utility card: instant feedback on player
      if (effect.playerAnim) this._triggerAnim('sprite-player', effect.playerAnim);
      this.updateUI();
    }
  }
  /**
   * Handles the end-of-turn sequence: discard, enemy attack animation, then start next turn.
   */
  _handleEndTurn() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    document.getElementById('end-turn-btn').disabled = true;

    const result = this.state.endTurn();
    this.updateUI();
    if (result.enemyPassiveHeal) {
      this._showFloatingText('sprite-enemy', result.enemyPassiveHeal.text, 'floating-heal');
    }
    if (result.playerPassiveHeal) {
      this._showFloatingText('sprite-player', result.playerPassiveHeal.text, 'floating-heal');
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
            document.getElementById('end-turn-btn').disabled = false;
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
      const isBossFight = this.state.enemy.id === 'boss';
      this._showVictoryOverlay(droppedDutki, isBossFight);
      return;
    }
    const msg = 'Koniec gry! Tłum ceprów poprosił Cię o wspólną fotkę.';
    setTimeout(() => alert(msg), 100);
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

    rewardDutki.textContent = droppedDutki > 0 ? `Łup z bitki: +${droppedDutki} dutków` : '';
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
      this.showVictoryScreen();
      return;
    }

    this._openMapOverlay();
    this.updateUI();
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

        btn.innerHTML = `
          <span class="map-node-emoji">${node.emoji}</span>
          <span class="map-node-label">${node.label}</span>
        `;

        row.appendChild(btn);
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

    if (node.type === 'fight' || node.type === 'boss') {
      this.state.hasStartedFirstBattle = true;
      this.state.currentScreen = 'battle';
      this.state.resetBattle();
      this._hideOverlay('map-overlay');
      document.getElementById('end-turn-btn').disabled = false;
      this.updateUI();
      return;
    }

    if (node.type === 'shop') {
      this.state.currentScreen = 'map';
      this._openShop();
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

  _openShop() {
    this._hideOverlay('map-overlay');
    const overlay = document.getElementById('shop-overlay');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    this.state.generateShopStock();
    this._renderShopOffers();
  }

  _closeShop() {
    this._hideOverlay('shop-overlay');
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
      price.textContent = `${card.price} 💰`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-card-btn';
      btn.textContent = 'Kup';
      btn.title = `${card.name}: ${card.desc}`;
      btn.setAttribute('aria-label', `Kup kartę ${card.name}. ${card.desc}`);
      btn.disabled = this.state.dutki < card.price;
      btn.addEventListener('click', () => {
        const result = this.state.buyItem(card, 'card');
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
    removeBtn.disabled = this.state.dutki < 100 || !select.value;

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
    if (!this.state.spendDutki(100)) {
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

      const title = document.createElement('h3');
      title.className = 'library-item-title';
      title.textContent = `${item.emoji} ${item.name}`;

      const rarity = document.createElement('p');
      rarity.className = 'library-item-rarity';
      rarity.textContent = this._rarityLabel(item.rarity, this.libraryTab === 'cards' ? 'card' : 'relic');

      const desc = document.createElement('p');
      desc.className = 'library-item-desc';
      desc.textContent = item.desc;

      card.append(title, rarity, desc);

      if (this.libraryTab === 'cards') {
        const cardDef = /** @type {import('../data/cards.js').CardDef} */ (item);
        const cost = document.createElement('span');
        cost.className = 'library-item-cost';
        cost.textContent = `${cardDef.cost} Osc.`;
        card.prepend(cost);

        if (cardDef.exhaust) {
          card.classList.add('card-exhaust');
          card.appendChild(this._createExhaustBadge());
        }
      }

      grid.appendChild(card);
    });
  }

  _closeCampfire() {
    this._hideOverlay('campfire-overlay');
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
