import { cardLibrary } from '../data/cards.js';

export class UIManager {
  /**
   * @param {import('../state/GameState.js').GameState} state
   */
  constructor(state) {
    this.state = state;
    /** @type {boolean} */
    this.isAnimating = false;
  }

  /**
   * Binds DOM events and performs the initial render.
   */
  init() {
    document.getElementById('end-turn-btn').addEventListener('click', () => this._handleEndTurn());
    window.addEventListener('resize', () => this._scaleGame());
    this._scaleGame();
    this.updateUI();
  }

  /**
   * Re-renders all stat displays, statuses, and the card hand.
   */
  updateUI() {
    const { player, enemy, deck, discard } = this.state;
    const enemyAttackRaw = this.state.calculateDamage(enemy.nextAttack, enemy, player);
    const enemyAttackAfterBlock = Math.max(0, enemyAttackRaw - player.block);
    document.getElementById('p-hp').textContent = player.hp;
    document.getElementById('p-max-hp').textContent = player.maxHp;
    document.getElementById('p-block').textContent = player.block;
    document.getElementById('e-hp').textContent = enemy.hp;
    document.getElementById('e-max-hp').textContent = enemy.maxHp;
    document.getElementById('e-block').textContent = enemy.block;
    document.getElementById('energy').textContent = player.energy;
    document.getElementById('e-intent').textContent = `Zamiar: Atak (⚔️ ${enemyAttackAfterBlock})`;
    document.getElementById('draw-pile-count').textContent = deck.length;
    document.getElementById('discard-pile-count').textContent = discard.length;
    this._renderStatuses('p-statuses', player.status);
    this._renderStatuses('e-statuses', enemy.status);
    this._renderHand();
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

    /** @param {number} turns */
    const turnLabel = (turns) => (turns === 1 ? 'tura' : 'tury');

    /** @param {string} text */
    const tag = (text) => {
      const span = document.createElement('span');
      span.className = 'status-tag';
      span.textContent = text;
      el.appendChild(span);
    };

    if (status.strength > 0) tag(`💢 Siła: ${status.strength}`);
    if (status.weak > 0) tag(`🤢 Słabość: ${status.weak} ${turnLabel(status.weak)}`);
    if (status.fragile > 0) tag(`🫧 Kruchość: ${status.fragile} ${turnLabel(status.fragile)}`);
    if (status.next_double) tag('✨ Następny atak: x2');
    if (status.energy_next_turn > 0) tag(`⚡ Nast. tura: +${status.energy_next_turn} Oscypek`);
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
      const canPlay = player.energy >= card.cost;

      const cardEl = document.createElement('div');
      cardEl.className = `card${canPlay ? '' : ' disabled'}`;

      if (canPlay && player.hp > 0 && enemy.hp > 0) {
        cardEl.addEventListener('click', () => {
          if (!this.isAnimating) this._handlePlayCard(index);
        });
      }

      const costEl = document.createElement('div');
      costEl.className = 'card-cost';
      costEl.textContent = card.cost;
      const titleEl = document.createElement('div');
      titleEl.className = 'card-title';
      titleEl.textContent = card.name;
      const imgEl = document.createElement('div');
      imgEl.className = 'card-img';
      imgEl.textContent = card.emoji;
      const descEl = document.createElement('div');
      descEl.className = 'card-desc';
      descEl.textContent = card.desc;

      cardEl.append(costEl, titleEl, imgEl, descEl);
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
      this._showVictoryOverlay();
      return;
    }
    const msg = 'Koniec gry! Tłum turystów poprosił Cię o zrobienie im grupowego zdjęcia.';
    setTimeout(() => alert(msg), 100);
  }

  /**
   * Displays a victory reward overlay with 3 random non-basic cards.
   */
  _showVictoryOverlay() {
    const overlay = document.getElementById('victory-overlay');
    const rewardCards = document.getElementById('reward-cards');
    const choices = this._pickRewardCards(3);

    rewardCards.innerHTML = '';
    choices.forEach((cardId) => {
      const card = cardLibrary[cardId];
      const cardEl = document.createElement('button');
      cardEl.type = 'button';
      cardEl.className = 'reward-card';
      cardEl.innerHTML = `
        <div class="reward-cost">${card.cost} Osc.</div>
        <div class="reward-emoji">${card.emoji}</div>
        <div class="reward-name">${card.name}</div>
        <div class="reward-desc">${card.desc}</div>
      `;
      cardEl.addEventListener('click', () => {
        this.state.deck.push(cardId);
        this.state.resetBattle();
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
        document.getElementById('end-turn-btn').disabled = false;
        this.updateUI();
      });
      rewardCards.appendChild(cardEl);
    });

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  /**
   * @param {number} count
   * @returns {string[]}
   */
  _pickRewardCards(count) {
    const basic = new Set(['ciupaga', 'gasior']);
    const pool = Object.keys(cardLibrary).filter((id) => !basic.has(id));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
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
   * Scales the game wrapper to fit the viewport height on small screens.
   */
  _scaleGame() {
    const wrapper = document.getElementById('game-wrapper');
    wrapper.style.zoom = '';
    const scale = Math.min(1, window.innerHeight / wrapper.offsetHeight);
    if (scale < 1) wrapper.style.zoom = scale;
  }
}
