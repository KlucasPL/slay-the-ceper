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
   * Re-renders all stat displays and the card hand.
   */
  updateUI() {
    const { player, enemy, deck, discard } = this.state;
    document.getElementById('p-hp').textContent      = player.hp;
    document.getElementById('p-block').textContent   = player.block;
    document.getElementById('e-hp').textContent      = enemy.hp;
    document.getElementById('e-block').textContent   = enemy.block;
    document.getElementById('energy').textContent    = player.energy;
    document.getElementById('e-intent').textContent  = `Zamiar: Atak (⚔️ ${enemy.nextAttack})`;
    document.getElementById('draw-pile-count').textContent    = deck.length;
    document.getElementById('discard-pile-count').textContent = discard.length;
    this._renderHand();
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

      const costEl   = document.createElement('div'); costEl.className   = 'card-cost';  costEl.textContent  = card.cost;
      const titleEl  = document.createElement('div'); titleEl.className  = 'card-title'; titleEl.textContent = card.name;
      const imgEl    = document.createElement('div'); imgEl.className    = 'card-img';   imgEl.textContent   = card.emoji;
      const descEl   = document.createElement('div'); descEl.className   = 'card-desc';  descEl.textContent  = card.desc;

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

    if (effect.type === 'attack') {
      this.isAnimating = true;
      this._triggerAnim('sprite-player', 'anim-attack-p', 300);
      this.updateUI();

      setTimeout(() => {
        const anim = effect.damage.dealt > 0 ? 'anim-damage' : 'anim-block';
        this._triggerAnim('sprite-enemy', anim);
        this.updateUI();

        setTimeout(() => {
          this.isAnimating = false;
          const win = this.state.checkWinCondition();
          if (win) this._showEndGame(win);
        }, 400);
      }, 150);

    } else {
      this._triggerAnim('sprite-player', 'anim-block');
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
    const msg = outcome === 'player_win'
      ? 'Wygrana! Ceper pogubił sandały w panice!'
      : 'Koniec gry! Tłum turystów poprosił Cię o zrobienie im grupowego zdjęcia.';
    setTimeout(() => alert(msg), 100);
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
