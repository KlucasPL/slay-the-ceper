import { cardLibrary } from '../data/cards.js';
import { enemyLibrary } from '../data/enemies.js';

/**
 * @typedef {import('../data/cards.js').StatusDef} StatusDef
 * @typedef {{ name: string, hp: number, maxHp: number, block: number, energy: number, maxEnergy: number, status: StatusDef }} PlayerState
 * @typedef {import('../data/enemies.js').EnemyMoveDef} EnemyMoveDef
 * @typedef {{ id: string, name: string, emoji: string, hp: number, maxHp: number, block: number, nextAttack: number, baseAttack: number, attackScale: number, status: StatusDef, spriteSvg: string, patternType: 'random'|'loop', pattern: EnemyMoveDef[], patternIndex: number, currentIntent: EnemyMoveDef }} EnemyState
 * @typedef {{ success: false } | { success: true, effect: import('../data/cards.js').CardEffectResult }} PlayCardResult
 * @typedef {{ enemyAttack: { raw: number, blocked: number, dealt: number } }} EndTurnResult
 */

/** @returns {StatusDef} */
function defaultStatus() {
  return { strength: 0, weak: 0, fragile: 0, next_double: false, energy_next_turn: 0 };
}

export class GameState {
  /**
   * @param {import('../data/characters.js').CharacterDef} character
   * @param {import('../data/enemies.js').EnemyDef} enemy
   */
  constructor(character, enemy) {
    /** @type {PlayerState} */
    this.player = { ...character, status: defaultStatus() };
    /** @type {number} Dutki (gold) */
    this.gold = 0;
    /** @type {number} Number of won battles used for scaling */
    this.battleWins = 0;
    /** @type {string[]} */
    this.deck = [];
    /** @type {string[]} */
    this.hand = [];
    /** @type {string[]} */
    this.discard = [];
    /** @type {string[]} Exhausted cards — removed from combat */
    this.exhaust = [];
    /** @type {EnemyState} */
    this.enemy = this._createEnemyState(enemy);
  }

  /**
   * @param {import('../data/enemies.js').EnemyDef} enemyDef
   * @returns {EnemyState}
   */
  _createEnemyState(enemyDef) {
    const pattern = enemyDef.pattern ? enemyDef.pattern.map((move) => ({ ...move })) : [];
    const maxHp = enemyDef.maxHp + this.battleWins * 10;
    /** @type {EnemyState} */
    const enemyState = {
      id: enemyDef.id,
      name: enemyDef.name,
      emoji: enemyDef.emoji,
      hp: maxHp,
      maxHp,
      block: enemyDef.block,
      nextAttack: 0,
      baseAttack: (enemyDef.baseAttack ?? 0) + this.battleWins * 2,
      attackScale: enemyDef.patternType === 'loop' ? this.battleWins * 2 : 0,
      status: defaultStatus(),
      spriteSvg: enemyDef.spriteSvg,
      patternType: enemyDef.patternType,
      pattern,
      patternIndex: 0,
      currentIntent: { type: 'attack', name: 'Atak', damage: 0, hits: 1 },
    };
    enemyState.currentIntent = this._buildEnemyIntent(enemyState);
    enemyState.nextAttack =
      enemyState.currentIntent.type === 'attack' ? enemyState.currentIntent.damage : 0;
    return enemyState;
  }

  /** @returns {import('../data/enemies.js').EnemyDef} */
  _pickRandomEnemyDef() {
    const enemyIds = Object.keys(enemyLibrary);
    const enemyId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
    return enemyLibrary[enemyId];
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
   * Rolls enemy intent around baseAttack with a spread of 6 values.
   * Base 8 yields range 5..10.
   * @returns {number}
   */
  _rollEnemyAttack(enemyState = this.enemy) {
    return Math.max(1, enemyState.baseAttack - 3 + Math.floor(Math.random() * 6));
  }

  /**
   * @param {EnemyState} enemyState
   * @returns {EnemyMoveDef}
   */
  _buildEnemyIntent(enemyState) {
    if (enemyState.patternType === 'loop') {
      const move = enemyState.pattern[enemyState.patternIndex % enemyState.pattern.length];
      return { ...move };
    }

    return {
      type: 'attack',
      name: 'Robi zdjęcie',
      damage: this._rollEnemyAttack(enemyState),
      hits: 1,
    };
  }

  /**
   * Refreshes the enemy intent after state changes.
   */
  _refreshEnemyIntent() {
    this.enemy.currentIntent = this._buildEnemyIntent(this.enemy);
    this.enemy.nextAttack =
      this.enemy.currentIntent.type === 'attack' ? this.enemy.currentIntent.damage : 0;
  }

  /**
   * Calculates final outgoing damage with status modifiers.
   * Rules:
   * - weak: -25% outgoing damage (floor)
   * - strength: flat bonus
   * - next_double: only for player attacking enemy, then consumed
   * @param {number} baseDmg
   * @param {PlayerState | EnemyState} sourceEntity
   * @param {PlayerState | EnemyState} targetEntity
   * @returns {number}
   */
  calculateDamage(baseDmg, sourceEntity, targetEntity) {
    let dmg = baseDmg;

    if (sourceEntity.status.weak > 0) {
      dmg = Math.floor(dmg * 0.75);
    }

    if (sourceEntity.status.strength > 0) {
      dmg += sourceEntity.status.strength;
    }

    if (
      sourceEntity === this.player &&
      targetEntity === this.enemy &&
      sourceEntity.status.next_double
    ) {
      dmg *= 2;
      sourceEntity.status.next_double = false;
    }

    return Math.max(0, dmg);
  }

  /**
   * Calculates effective attack damage: applies strength bonus, next_double, and weak penalty.
   * Mutates attacker.status.next_double (resets it when consumed).
   * @param {PlayerState | EnemyState} attacker
   * @param {number} baseDmg
   * @returns {number}
   */
  _calcAttackDamage(attacker, baseDmg) {
    const target = attacker === this.player ? this.enemy : this.player;
    return this.calculateDamage(baseDmg, attacker, target);
  }

  /**
   * Applies damage to the Ceper (enemy), accounting for their Garda.
   * @param {number} dmg
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  _applyDamageToEnemy(dmg) {
    const blocked = Math.min(this.enemy.block, dmg);
    const dealt = dmg - blocked;
    this.enemy.block -= blocked;
    this.enemy.hp -= dealt;
    return { raw: dmg, blocked, dealt };
  }

  /**
   * Applies damage to the Góral (player), accounting for their Garda.
   * @param {number} dmg
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  _applyDamageToPlayer(dmg) {
    const blocked = Math.min(this.player.block, dmg);
    const dealt = dmg - blocked;
    this.player.block -= blocked;
    this.player.hp -= dealt;
    return { raw: dmg, blocked, dealt };
  }

  /**
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  _applyEnemyIntent() {
    const intent = this.enemy.currentIntent;

    if (intent.type === 'block') {
      this.enemy.block += intent.block;
      return { raw: 0, blocked: 0, dealt: 0 };
    }

    let raw = 0;
    let blocked = 0;
    let dealt = 0;
    const hits = intent.hits ?? 1;

    for (let hitIndex = 0; hitIndex < hits; hitIndex++) {
      const hitDamage = this.calculateDamage(intent.damage, this.enemy, this.player);
      const result = this._applyDamageToPlayer(hitDamage);
      raw += result.raw;
      blocked += result.blocked;
      dealt += result.dealt;
    }

    return { raw, blocked, dealt };
  }

  /**
   * @returns {number}
   */
  getEnemyIntentDamage() {
    const intent = this.enemy.currentIntent;
    if (intent.type === 'block') return 0;

    const hits = intent.hits ?? 1;
    const perHit = this.calculateDamage(intent.damage, this.enemy, this.player);
    return Math.max(0, perHit * hits - this.player.block);
  }

  /**
   * @returns {string}
   */
  getEnemyIntentText() {
    const intent = this.enemy.currentIntent;
    if (intent.type === 'block') {
      return `Zamiar: ${intent.name} (🛡️ ${intent.block})`;
    }

    const hits = intent.hits ?? 1;
    const totalDamage = this.getEnemyIntentDamage();
    if (hits > 1) {
      return `Zamiar: ${intent.name} (⚔️ ${totalDamage}, ${hits}x)`;
    }

    return `Zamiar: ${intent.name} (⚔️ ${totalDamage})`;
  }

  /**
   * Ticks down duration-based status debuffs (weak, fragile) by 1 each.
   * @param {StatusDef} status
   */
  _tickStatus(status) {
    if (status.weak > 0) status.weak--;
    if (status.fragile > 0) status.fragile--;
  }

  /**
   * Restores Oscypki (+energy_next_turn bonus), ticks player statuses, resets Garda, draws 5 cards.
   */
  startTurn() {
    this.player.energy = this.player.maxEnergy + this.player.status.energy_next_turn;
    this.player.status.energy_next_turn = 0;
    this.player.block = 0;
    this._drawCards(5);
  }

  /**
   * Plays the card at handIndex. Returns success=false if not enough Oscypki.
   * Exhausted cards are removed from combat; others go to discard.
   * @param {number} handIndex
   * @returns {PlayCardResult}
   */
  playCard(handIndex) {
    const cardId = this.hand[handIndex];
    const card = cardLibrary[cardId];
    if (!card || this.player.energy < card.cost) return { success: false };

    this.player.energy -= card.cost;
    this.hand.splice(handIndex, 1);
    if (card.exhaust) {
      this.exhaust.push(cardId);
    } else {
      this.discard.push(cardId);
    }

    const effect = card.effect(this);
    return { success: true, effect };
  }

  /**
   * Discards hand, Ceper attacks Góral, ticks enemy statuses, rolls next enemy attack.
   * @returns {EndTurnResult}
   */
  endTurn() {
    this.discard.push(...this.hand);
    this.hand = [];

    // End of player turn.
    this._tickStatus(this.player.status);

    // Enemy loses old block at the start of its own turn, before taking a new action.
    this.enemy.block = 0;
    const enemyAttack = this._applyEnemyIntent();

    this._tickStatus(this.enemy.status);
    if (this.enemy.id === 'busiarz') {
      this.enemy.status.strength += 1;
    }

    if (this.enemy.patternType === 'loop') {
      this.enemy.patternIndex = (this.enemy.patternIndex + 1) % this.enemy.pattern.length;
    }
    this._refreshEnemyIntent();

    return { enemyAttack };
  }

  /**
   * Resets combat after victory and scales difficulty for the next Ceper.
   * - Enemy maxHp +10 and baseAttack +2 (permanently for this run)
   * - Heal player by 15 (up to maxHp)
   * - Clear blocks and statuses
   * - Move hand/discard/exhaust back to deck and shuffle
   * - Start a fresh turn
   */
  resetBattle() {
    this.battleWins += 1;

    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);

    this.player.block = 0;

    this.player.status = defaultStatus();

    this.deck.push(...this.hand, ...this.discard, ...this.exhaust);
    this.hand = [];
    this.discard = [];
    this.exhaust = [];
    this._shuffle(this.deck);

    this.enemy = this._createEnemyState(this._pickRandomEnemyDef());

    this.startTurn();
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
