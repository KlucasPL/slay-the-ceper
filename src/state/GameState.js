import { cardLibrary } from '../data/cards.js';

/**
 * @typedef {{ name: string, hp: number, maxHp: number, block: number, energy: number, maxEnergy: number }} PlayerState
 * @typedef {{ name: string, hp: number, maxHp: number, block: number, nextAttack: number }} EnemyState
 *
 * @typedef {{ type: 'attack', cardId: string, damage: { raw: number, blocked: number, dealt: number } }
 *          | { type: 'skill',  cardId: string, blockGained?: number, cardsDrawn?: number }} CardEffect
 *
 * @typedef {{ success: false } | { success: true, effect: CardEffect }} PlayCardResult
 * @typedef {{ enemyAttack: { raw: number, blocked: number, dealt: number } }} EndTurnResult
 */

export class GameState {
  /**
   * @param {import('../data/characters.js').CharacterDef} character
   * @param {import('../data/enemies.js').EnemyDef} enemy
   */
  constructor(character, enemy) {
    /** @type {PlayerState} */
    this.player = { ...character };
    /** @type {EnemyState} */
    this.enemy = { ...enemy };
    /** @type {string[]} */
    this.deck = [];
    /** @type {string[]} */
    this.hand = [];
    /** @type {string[]} */
    this.discard = [];
  }

  /**
   * Seeds the deck, shuffles, and runs the first turn.
   * @param {string[]} startingDeck
   */
  initGame(startingDeck) {
    this.deck = [...startingDeck];
    this._shuffle(this.deck);
    this.startTurn();
  }

  /**
   * @param {string[]} array
   */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * @param {number} amount
   */
  _drawCards(amount) {
    for (let i = 0; i < amount; i++) {
      if (this.deck.length === 0) {
        if (this.discard.length === 0) break;
        this.deck = [...this.discard];
        this.discard = [];
        this._shuffle(this.deck);
      }
      this.hand.push(this.deck.pop());
    }
  }

  /**
   * Restores Oscypki, resets Garda, and draws 5 cards.
   */
  startTurn() {
    this.player.energy = this.player.maxEnergy;
    this.player.block = 0;
    this._drawCards(5);
  }

  /**
   * Plays the card at handIndex. Returns success=false if not enough Oscypki.
   * @param {number} handIndex
   * @returns {PlayCardResult}
   */
  playCard(handIndex) {
    const cardId = this.hand[handIndex];
    const card = cardLibrary[cardId];
    if (!card || this.player.energy < card.cost) return { success: false };

    this.player.energy -= card.cost;
    this.discard.push(this.hand.splice(handIndex, 1)[0]);

    if (card.type === 'attack') {
      const raw = card.val;
      const blocked = Math.min(this.enemy.block, raw);
      const dealt = raw - blocked;
      this.enemy.block -= blocked;
      this.enemy.hp -= dealt;
      return { success: true, effect: { type: 'attack', cardId, damage: { raw, blocked, dealt } } };
    }

    if (card.type === 'skill') {
      if (cardId === 'gasior') {
        this.player.block += card.val;
        return { success: true, effect: { type: 'skill', cardId, blockGained: card.val } };
      }
      if (cardId === 'hej') {
        this._drawCards(2);
        return { success: true, effect: { type: 'skill', cardId, cardsDrawn: 2 } };
      }
    }

    return { success: true, effect: { type: card.type, cardId } };
  }

  /**
   * Discards hand, applies enemy attack to Góral, rolls next enemy attack.
   * @returns {EndTurnResult}
   */
  endTurn() {
    this.discard.push(...this.hand);
    this.hand = [];

    const raw = this.enemy.nextAttack;
    const blocked = Math.min(this.player.block, raw);
    const dealt = raw - blocked;
    this.player.block -= blocked;
    this.player.hp -= dealt;

    this.enemy.block = 0;
    this.enemy.nextAttack = Math.floor(Math.random() * 6) + 5;

    return { enemyAttack: { raw, blocked, dealt } };
  }

  /**
   * @returns {'player_win' | 'enemy_win' | null}
   */
  checkWinCondition() {
    if (this.enemy.hp <= 0) return 'player_win';
    if (this.player.hp <= 0) return 'enemy_win';
    return null;
  }
}
