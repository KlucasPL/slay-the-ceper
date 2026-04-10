import { cardLibrary } from '../data/cards.js';
import { enemyLibrary } from '../data/enemies.js';
import { relicLibrary } from '../data/relics.js';

/**
 * @typedef {import('../data/cards.js').StatusDef} StatusDef
 * @typedef {{ name: string, hp: number, maxHp: number, block: number, energy: number, maxEnergy: number, status: StatusDef }} PlayerState
 * @typedef {import('../data/enemies.js').EnemyMoveDef} EnemyMoveDef
 * @typedef {'fight' | 'shop' | 'treasure' | 'campfire' | 'boss'} MapNodeType
 * @typedef {{ type: MapNodeType, label: string, emoji: string, connections: number[] }} MapNode
 * @typedef {{ id: string, name: string, emoji: string, hp: number, maxHp: number, block: number, nextAttack: number, baseAttack: number, status: StatusDef, spriteSvg: string, patternType: 'random'|'loop', pattern: EnemyMoveDef[], patternIndex: number, currentIntent: EnemyMoveDef, tookHpDamageThisTurn: boolean }} EnemyState
 * @typedef {{ success: false } | { success: true, effect: import('../data/cards.js').CardEffectResult }} PlayCardResult
 * @typedef {{ enemyAttack: { raw: number, blocked: number, dealt: number }, enemyPassiveHeal: { amount: number, text: string } | null }} EndTurnResult
 * @typedef {{ cards: string[], relic: string | null }} ShopStock
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
    /** @type {number} */
    this.dutki = 50;
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
    /** @type {string[]} */
    this.relics = [];
    /** @type {Record<string, number>} */
    this.cardDamageBonus = {};
    /** @type {MapNode[][]} */
    this.map = [];
    /** @type {number} */
    this.currentLevel = 0;
    /** @type {number} */
    this.currentNodeIndex = 0;
    /** @type {boolean} */
    this.pendingBattleDutki = true;
    /** @type {boolean} */
    this.firstAttackUsedThisTurn = false;
    /** @type {ShopStock} */
    this.shopStock = { cards: [], relic: null };
    /** @type {string} */
    this.lastShopMessage = '';
    /** @type {EnemyState} */
    this.enemy = this._createEnemyState(enemy);
    this.generateMap();
  }

  /** @returns {MapNode[][]} */
  generateMap() {
    /** @type {MapNode[][]} */
    const generated = [];
    generated.push([this._createMapNode('fight')]);

    for (let level = 1; level <= 4; level++) {
      const count = 2 + Math.floor(Math.random() * 2);
      const nodes = Array.from({ length: count }, () => this._createMapNode(this._rollMidNodeType()));
      generated.push(nodes);
    }

    generated.push([this._createMapNode('campfire')]);
    generated.push([this._createMapNode('boss')]);

    this._connectMapLevels(generated);

    this.map = generated;
    this.currentLevel = 0;
    this.currentNodeIndex = 0;
    return this.map;
  }

  /**
   * @param {MapNodeType} type
   * @returns {MapNode}
   */
  _createMapNode(type) {
    const meta = {
      fight: { label: 'Walka', emoji: '⚔️' },
      shop: { label: 'Sklep', emoji: '🛖' },
      treasure: { label: 'Skarb', emoji: '🎁' },
      campfire: { label: 'Watra', emoji: '🔥' },
      boss: { label: 'Boss', emoji: '💀' },
    };
    return { ...meta[type], type, connections: [] };
  }

  /** @returns {MapNodeType} */
  _rollMidNodeType() {
    const roll = Math.random();
    if (roll < 0.6) return 'fight';
    if (roll < 0.85) return 'shop';
    return 'treasure';
  }

  /**
   * @param {MapNode[][]} map
   */
  _connectMapLevels(map) {
    for (let level = 0; level < map.length - 1; level++) {
      const currentLevel = map[level];
      const nextLevel = map[level + 1];

      currentLevel.forEach((node) => {
        const firstTarget = Math.floor(Math.random() * nextLevel.length);
        node.connections = [firstTarget];

        if (nextLevel.length > 1 && Math.random() < 0.5) {
          let secondTarget = Math.floor(Math.random() * nextLevel.length);
          while (secondTarget === firstTarget) {
            secondTarget = Math.floor(Math.random() * nextLevel.length);
          }
          node.connections.push(secondTarget);
        }
      });

      nextLevel.forEach((_, targetIndex) => {
        const hasInbound = currentLevel.some((node) => node.connections.includes(targetIndex));
        if (!hasInbound) {
          const sourceIndex = Math.floor(Math.random() * currentLevel.length);
          currentLevel[sourceIndex].connections.push(targetIndex);
        }
      });

      currentLevel.forEach((node) => {
        node.connections = [...new Set(node.connections)].sort((a, b) => a - b);
      });
    }
  }

  /** @returns {number[]} */
  getReachableNodes() {
    const node = this.getCurrentMapNode();
    return node ? [...node.connections] : [];
  }

  /**
   * @param {number} level
   * @param {number} nodeIndex
   * @returns {boolean}
   */
  canTravelTo(level, nodeIndex) {
    if (level !== this.currentLevel + 1) return false;
    const nextLevel = this.map[level];
    if (!nextLevel || !nextLevel[nodeIndex]) return false;
    const currentNode = this.getCurrentMapNode();
    if (!currentNode) return false;
    return currentNode.connections.includes(nodeIndex);
  }

  /**
   * @param {number} level
   * @param {number} nodeIndex
   * @returns {MapNode | null}
   */
  travelTo(level, nodeIndex) {
    if (!this.canTravelTo(level, nodeIndex)) return null;
    this.currentLevel = level;
    this.currentNodeIndex = nodeIndex;
    return this.getCurrentMapNode();
  }

  /**
   * @returns {MapNode | null}
   */
  getCurrentMapNode() {
    return this.map[this.currentLevel]?.[this.currentNodeIndex] ?? null;
  }

  /** @returns {string | null} */
  grantTreasureRelic() {
    const pool = Object.keys(relicLibrary).filter((id) => !this.relics.includes(id));
    if (pool.length === 0) return null;
    const relicId = pool[Math.floor(Math.random() * pool.length)];
    this.addRelic(relicId);
    return relicId;
  }

  /**
   * @param {string} relicId
   * @returns {boolean}
   */
  hasRelic(relicId) {
    return this.relics.includes(relicId);
  }

  /**
   * @param {number} cost
   * @returns {boolean}
   */
  spendDutki(cost) {
    if (this.dutki < cost) return false;
    this.dutki -= cost;
    return true;
  }

  /**
   * @returns {ShopStock}
   */
  generateShopStock() {
    const cardPool = Object.keys(cardLibrary);
    for (let i = cardPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
    }

    const relicPool = Object.keys(relicLibrary).filter((id) => !this.relics.includes(id));
    for (let i = relicPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [relicPool[i], relicPool[j]] = [relicPool[j], relicPool[i]];
    }

    this.shopStock = {
      cards: cardPool.slice(0, 3),
      relic: relicPool.length > 0 ? relicPool[0] : null,
    };
    this.lastShopMessage = '';
    return this.shopStock;
  }

  /**
   * @param {import('../data/cards.js').CardDef | import('../data/relics.js').RelicDef} item
   * @param {'card' | 'relic'} type
   * @returns {{ success: boolean, message: string }}
   */
  buyItem(item, type) {
    if (this.dutki < item.price) {
      this.lastShopMessage = 'Ni mos tela dutków, synek!';
      return { success: false, message: this.lastShopMessage };
    }

    if (type === 'card') {
      if (!this.shopStock.cards.includes(item.id)) {
        this.lastShopMessage = 'To już wykupione.';
        return { success: false, message: this.lastShopMessage };
      }
      this.dutki -= item.price;
      this.deck.push(item.id);
      this.shopStock.cards = this.shopStock.cards.filter((id) => id !== item.id);
      this.lastShopMessage = `Kupiono kartę: ${item.name}`;
      return { success: true, message: this.lastShopMessage };
    }

    if (this.shopStock.relic !== item.id || this.hasRelic(item.id)) {
      this.lastShopMessage = 'Ta pamiątka nie jest dostępna.';
      return { success: false, message: this.lastShopMessage };
    }
    this.dutki -= item.price;
    this.addRelic(item.id);
    this.shopStock.relic = null;
    this.lastShopMessage = `Kupiono pamiątkę: ${item.name}`;
    return { success: true, message: this.lastShopMessage };
  }

  /**
   * @param {string} cardId
   * @returns {boolean}
   */
  removeCardFromDeck(cardId) {
    const removeFrom = (arr) => {
      const idx = arr.indexOf(cardId);
      if (idx >= 0) {
        arr.splice(idx, 1);
        return true;
      }
      return false;
    };

    return (
      removeFrom(this.deck) ||
      removeFrom(this.hand) ||
      removeFrom(this.discard) ||
      removeFrom(this.exhaust)
    );
  }

  /**
   * @param {string} relicId
   * @returns {boolean}
   */
  addRelic(relicId) {
    if (!relicLibrary[relicId] || this.hasRelic(relicId)) return false;

    this.relics.push(relicId);

    if (relicId === 'zloty_oscypek') {
      this.player.maxEnergy += 1;
      this.player.energy += 1;
    }

    if (relicId === 'pas_zbojnicki') {
      this.player.maxHp += 15;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
    }

    return true;
  }

  /**
   * @param {number} amount
   */
  healPlayer(amount) {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
  }

  /**
   * @param {string} cardId
   * @param {number} amount
   */
  upgradeCardDamage(cardId, amount = 3) {
    this.cardDamageBonus[cardId] = (this.cardDamageBonus[cardId] ?? 0) + amount;
  }

  /**
   * @param {string} cardId
   * @returns {number}
   */
  getCardDamageBonus(cardId) {
    return this.cardDamageBonus[cardId] ?? 0;
  }

  /**
   * @returns {string[]}
   */
  getUpgradeableAttackCards() {
    const pool = [...this.deck, ...this.hand, ...this.discard, ...this.exhaust];
    const attackIds = new Set([
      'ciupaga',
      'kierpce',
      'redyk',
      'zadyma',
      'janosik',
      'sandaly',
      'giewont',
    ]);
    return [...new Set(pool.filter((id) => attackIds.has(id)))];
  }

  /**
   * @returns {number}
   */
  grantBattleDutki() {
    if (!this.pendingBattleDutki) return 0;
    const drop = 30 + Math.floor(Math.random() * 11);
    this.dutki += drop;
    this.pendingBattleDutki = false;
    return drop;
  }

  /**
   * @returns {number}
   */
  _drawPerTurn() {
    return 5 + (this.hasRelic('kierpce') ? 1 : 0);
  }

  /**
   * Applies one-time effects that should trigger at the start of each battle.
   */
  _applyBattleStartRelics() {
    if (this.hasRelic('ciupaga_dziadka')) {
      this.player.status.strength += 1;
    }

    if (this.hasRelic('termos')) {
      this.player.block += 6;
    }

    if (this.hasRelic('klisza')) {
      this.enemy.status.weak += 1;
    }
  }

  /**
   * @param {number} amount
   */
  gainPlayerBlockFromCard(amount) {
    const relicBonus = this.hasRelic('sol') ? 1 : 0;
    this.player.block += amount + relicBonus;
  }

  /**
   * @param {import('../data/enemies.js').EnemyDef} enemyDef
   * @returns {EnemyState}
   */
  _createEnemyState(enemyDef, isBoss = false) {
    const pattern = enemyDef.pattern
      ? enemyDef.pattern.map((move) => {
          if (!isBoss || move.type !== 'attack') return { ...move };
          return { ...move, damage: move.damage + 5 };
        })
      : [];
    const maxHp = isBoss ? enemyDef.maxHp * 2 : enemyDef.maxHp;
    /** @type {EnemyState} */
    const enemyState = {
      id: enemyDef.id,
      name: isBoss ? `ELITARNY ${enemyDef.name}` : enemyDef.name,
      emoji: enemyDef.emoji,
      hp: maxHp,
      maxHp,
      block: enemyDef.block,
      nextAttack: 0,
      baseAttack: (enemyDef.baseAttack ?? 0) + (isBoss ? 5 : 0),
      status: defaultStatus(),
      spriteSvg: enemyDef.spriteSvg,
      patternType: enemyDef.patternType,
      pattern,
      patternIndex: 0,
      currentIntent: { type: 'attack', name: 'Atak', damage: 0, hits: 1 },
      tookHpDamageThisTurn: false,
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
    this._applyBattleStartRelics();
    this.pendingBattleDutki = true;
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

    if (sourceEntity === this.player && targetEntity === this.enemy && this.hasRelic('bat')) {
      dmg += 1;
    }

    if (
      sourceEntity === this.player &&
      targetEntity === this.enemy &&
      this.hasRelic('zakopane') &&
      !this.firstAttackUsedThisTurn
    ) {
      dmg = Math.floor(dmg * 1.5);
      this.firstAttackUsedThisTurn = true;
    }

    if (
      sourceEntity === this.player &&
      targetEntity === this.enemy &&
      sourceEntity.status.next_double
    ) {
      dmg *= 2;
      sourceEntity.status.next_double = false;
    }

    if (targetEntity === this.player && this.hasRelic('giewont')) {
      dmg -= 1;
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
    const hpBefore = this.enemy.hp;
    const blocked = Math.min(this.enemy.block, dmg);
    const dealt = dmg - blocked;
    this.enemy.block -= blocked;
    this.enemy.hp -= dealt;
    if (this.enemy.hp < hpBefore) {
      this.enemy.tookHpDamageThisTurn = true;
    }
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

    if (intent.applyWeak && intent.applyWeak > 0) {
      this.player.status.weak += intent.applyWeak;
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
   * @returns {Array<{ text: string, tooltip: string }>}
   */
  getEnemySpecialStatuses() {
    if (this.enemy.id !== 'baba') return [];

    return [
      {
        text: '🧀 Świeży łoscypek',
        tooltip:
          'Na końcu tury gracza Gaździna leczy 5 HP, jeśli nie dostała obrażeń HP w tej turze.',
      },
    ];
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
    this.enemy.tookHpDamageThisTurn = false;
    this.firstAttackUsedThisTurn = false;
    this.player.energy = this.player.maxEnergy + this.player.status.energy_next_turn;
    this.player.status.energy_next_turn = 0;
    this.player.block = 0;
    this._drawCards(this._drawPerTurn());
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
    if (this.hasRelic('parzenica') && this.player.energy > 0) {
      const healAmount = this.player.energy * 2;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
    }

    this.discard.push(...this.hand);
    this.hand = [];

    // End of player turn.
    this._tickStatus(this.player.status);

    /** @type {{ amount: number, text: string } | null} */
    let enemyPassiveHeal = null;
    if (this.enemy.id === 'baba' && !this.enemy.tookHpDamageThisTurn) {
      const hpBefore = this.enemy.hp;
      this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + 5);
      const healedAmount = this.enemy.hp - hpBefore;
      if (healedAmount > 0) {
        enemyPassiveHeal = { amount: healedAmount, text: `+${healedAmount} HP (Świeży łoscypek)` };
      }
    }

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

    return { enemyAttack, enemyPassiveHeal };
  }

  /**
   * Resets combat after victory with fixed enemy stats from enemyLibrary.
   * - Keep player HP between battles (no auto-heal)
   * - Boss node only: spawn ELITARNY enemy (HP x2, attacks +5)
   * - Clear blocks and statuses
   * - Move hand/discard/exhaust back to deck and shuffle
   * - Start a fresh turn
   */
  resetBattle() {
    this.battleWins += 1;

    this.player.block = 0;

    this.player.status = defaultStatus();

    this.deck.push(...this.hand, ...this.discard, ...this.exhaust);
    this.hand = [];
    this.discard = [];
    this.exhaust = [];
    this._shuffle(this.deck);

    const currentNode = this.getCurrentMapNode();
    const isBossNode = currentNode?.type === 'boss';
    this.enemy = this._createEnemyState(this._pickRandomEnemyDef(), isBossNode);
    this.pendingBattleDutki = true;

    this.startTurn();
    this._applyBattleStartRelics();
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
