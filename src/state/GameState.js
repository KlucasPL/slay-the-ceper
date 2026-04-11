import { cardLibrary } from '../data/cards.js';
import { enemyLibrary } from '../data/enemies.js';
import { relicLibrary } from '../data/relics.js';

/**
 * @typedef {import('../data/cards.js').StatusDef} StatusDef
 * @typedef {{ name: string, hp: number, maxHp: number, block: number, energy: number, maxEnergy: number, status: StatusDef }} PlayerState
 * @typedef {import('../data/enemies.js').EnemyMoveDef} EnemyMoveDef
 * @typedef {'fight' | 'shop' | 'treasure' | 'campfire' | 'boss'} MapNodeType
 * @typedef {{ x: number, y: number, type: MapNodeType, label: string, emoji: string, connections: number[] }} MapNode
 * @typedef {{ id: string, name: string, emoji: string, hp: number, maxHp: number, block: number, nextAttack: number, baseAttack: number, status: StatusDef, spriteSvg: string, patternType: 'random'|'loop', pattern: EnemyMoveDef[], patternIndex: number, currentIntent: EnemyMoveDef, tookHpDamageThisTurn: boolean, bossArtifact?: number }} EnemyState
 * @typedef {{ success: false } | { success: true, effect: import('../data/cards.js').CardEffectResult }} PlayCardResult
 * @typedef {{ enemyAttack: { raw: number, blocked: number, dealt: number }, enemyPassiveHeal: { amount: number, text: string } | null, playerPassiveHeal: { amount: number, text: string } | null }} EndTurnResult
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
    /** @type {string[]} Relics that have already appeared as offers/rewards in this run */
    this.seenRelicOffers = [];
    /** @type {boolean} Whether the first hard-mode shop guarantee has been consumed */
    this.hardFirstShopRolled = false;
    /** @type {Record<string, number>} */
    this.cardDamageBonus = {};
    /** @type {(MapNode | null)[][]} */
    this.map = [];
    /** @type {number} */
    this.currentLevel = 0;
    /** @type {number} */
    this.currentNodeIndex = 0;
    /** @type {{ x: number, y: number }} */
    this.currentNode = { x: 0, y: 0 };
    /** @type {boolean} */
    this.pendingBattleDutki = true;
    /** @type {'normal' | 'hard'} */
    this.difficulty = 'normal';
    /** @type {number} Cumulative HP/damage multiplier for hard mode scaling */
    this.enemyScaleFactor = 1.0;
    /** @type {number} Attack cards played this battle (bilet_tpn) */
    this.attackCardsPlayedThisBattle = 0;
    /** @type {boolean} Whether pocztowka_giewont effect has fired this battle */
    this.pocztowkaUsedThisBattle = false;
    /** @type {string | null} Card ID being kept by smycz_zakopane for next turn */
    this.smyczKeptCardId = null;
    /** @type {Record<string, number>} Random cost overrides for cards in hand (flaszka_sliwowicy) */
    this.flaszkaCostSeed = {};
    /** @type {number} Parity for zepsuty_termometr: 0=tick enemy status, 1=skip */
    this.termometerTurnParity = 0;
    /** @type {ShopStock} */
    this.shopStock = { cards: [], relic: null };
    /** @type {string} */
    this.lastShopMessage = '';
    /** @type {'title' | 'map' | 'battle'} */
    this.currentScreen = 'title';
    /** @type {boolean} Global audio mute flag */
    this.isMuted = false;
    /** @type {boolean} */
    this.hasStartedFirstBattle = false;
    /** @type {EnemyState} */
    this.enemy = this._createEnemyState(enemy);
    this.generateMap();
  }

  /** @returns {(MapNode | null)[][]} */
  generateMap() {
    /** @type {(MapNode | null)[][]} */
    const generated = Array.from({ length: 10 }, () => Array(3).fill(null));
    generated[0][1] = this._createMapNode('fight', 1, 0);

    const lastMidLevel = generated.length - 3;
    for (let y = 1; y <= lastMidLevel; y++) {
      for (let x = 0; x < 3; x++) {
        if (Math.random() < 0.7) {
          generated[y][x] = this._createMapNode(this._rollMidNodeType(), x, y);
        }
      }
      if (!generated[y].some(Boolean)) {
        const forcedX = Math.floor(Math.random() * 3);
        generated[y][forcedX] = this._createMapNode(this._rollMidNodeType(), forcedX, y);
      }
    }

    generated[generated.length - 2][1] = this._createMapNode('campfire', 1, generated.length - 2);
    generated[generated.length - 1][1] = this._createMapNode('boss', 1, generated.length - 1);

    this._seedRequiredPaths(generated);
    this._connectOptionalGridNodes(generated);
    this._ensureGuaranteedPathRewards(generated);
    this._enforceSpecialNodeLimits(generated);

    this.map = generated;
    this.currentLevel = 0;
    this.currentNodeIndex = 1;
    this.currentNode = { x: this.currentNodeIndex, y: 0 };
    this.hasStartedFirstBattle = false;
    return this.map;
  }

  /**
   * @param {MapNodeType} type
   * @param {number} x
   * @param {number} y
   * @returns {MapNode}
   */
  _createMapNode(type, x, y) {
    const meta = {
      fight: { label: 'Bitka', emoji: '⚔️' },
      shop: { label: 'Kram', emoji: '🛖' },
      treasure: { label: 'Skarb', emoji: '🎁' },
      campfire: { label: 'Watra', emoji: '🔥' },
      boss: { label: 'Boss', emoji: '👑' },
    };
    return { ...meta[type], x, y, type, connections: [] };
  }

  /** @returns {MapNodeType} */
  _rollMidNodeType() {
    const roll = Math.random();
    if (roll < 0.6) return 'fight';
    if (roll < 0.85) return 'shop';
    return 'treasure';
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _seedRequiredPaths(map) {
    const startNode = map[0][1];
    if (!startNode) return;
    const campfireLevel = map.length - 2;
    const lastMidLevel = campfireLevel - 1;

    const firstTargets = [0, 1, 2];
    this._shuffle(firstTargets);
    const branchCount = 2 + Math.floor(Math.random() * 2);
    const seededTargets = firstTargets.slice(0, branchCount).sort((a, b) => a - b);

    seededTargets.forEach((targetX) => {
      if (!map[1][targetX]) {
        map[1][targetX] = this._createMapNode(this._rollMidNodeType(), targetX, 1);
      }
      this._linkNode(startNode, targetX);
    });

    const usedPerLevel = new Map();
    usedPerLevel.set(1, new Set(seededTargets));

    seededTargets.forEach((startX, branchIndex) => {
      let currentX = startX;
      for (let y = 1; y < campfireLevel; y++) {
        let nextX;
        if (y === lastMidLevel) {
          nextX = 1;
        } else {
          const options = this._getAdjacentColumns(currentX);
          const used = usedPerLevel.get(y + 1) ?? new Set();
          const freshOptions = options.filter((x) => !used.has(x));
          const pool = freshOptions.length > 0 ? freshOptions : options;
          nextX = pool[Math.floor(Math.random() * pool.length)];
        }

        if (!map[y + 1][nextX]) {
          const nextType = y + 1 === campfireLevel ? 'campfire' : this._rollMidNodeType();
          map[y + 1][nextX] = this._createMapNode(nextType, nextX, y + 1);
        }

        this._linkNode(map[y][currentX], nextX);

        if (!usedPerLevel.has(y + 1)) {
          usedPerLevel.set(y + 1, new Set());
        }
        usedPerLevel.get(y + 1).add(nextX);
        currentX = nextX;
      }

      if (branchIndex === 0) {
        this._setNodeType(map[1][startX], 'shop');
      }
    });

    this._pruneUnreachableNodes(map);
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _connectOptionalGridNodes(map) {
    const campfireLevel = map.length - 2;
    const lastMidLevel = campfireLevel - 1;

    for (let y = 1; y <= lastMidLevel; y++) {
      for (let x = 0; x < 3; x++) {
        const node = map[y][x];
        if (!node || this._hasInbound(map, y, x)) continue;

        const prevCandidates = this._getAdjacentColumns(x).filter((prevX) => !!map[y - 1][prevX]);
        const nextCandidates =
          y === lastMidLevel
            ? [1]
            : this._getAdjacentColumns(x).filter((nextX) => !!map[y + 1][nextX]);

        if (prevCandidates.length === 0 || nextCandidates.length === 0) {
          map[y][x] = null;
          continue;
        }

        const sourceX = prevCandidates[Math.floor(Math.random() * prevCandidates.length)];
        this._linkNode(map[y - 1][sourceX], x);
        const targetX = nextCandidates[Math.floor(Math.random() * nextCandidates.length)];
        this._linkNode(node, targetX);
      }
    }

    for (let y = 0; y <= lastMidLevel; y++) {
      for (let x = 0; x < 3; x++) {
        const node = map[y][x];
        if (!node) continue;

        const availableTargets =
          y === lastMidLevel
            ? [1]
            : this._getAdjacentColumns(x).filter((nextX) => !!map[y + 1][nextX]);
        if (availableTargets.length === 0) continue;

        if (node.connections.length === 0) {
          this._linkNode(
            node,
            availableTargets[Math.floor(Math.random() * availableTargets.length)]
          );
        }

        if (y < lastMidLevel && availableTargets.length > 1 && Math.random() < 0.45) {
          const extraTargets = availableTargets.filter(
            (targetX) => !node.connections.includes(targetX)
          );
          if (extraTargets.length > 0) {
            this._linkNode(node, extraTargets[Math.floor(Math.random() * extraTargets.length)]);
          }
        }
      }
    }

    if (map[campfireLevel][1]) {
      map[campfireLevel][1].connections = [1];
    }
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _ensureGuaranteedPathRewards(map) {
    const reachable = this._getReachableCoordinates(map);
    const reachableNodes = reachable
      .map(({ x, y }) => map[y][x])
      .filter((node) => node && node.y > 0 && node.y < map.length - 2);

    const shopNode = reachableNodes.find((node) => node.type === 'shop');
    const treasureNode = reachableNodes.find((node) => node.type === 'treasure');
    if (shopNode && treasureNode) return;

    const rewardCandidates = reachableNodes.filter((node) => node.y <= map.length - 3);
    if (!shopNode) {
      const target = rewardCandidates[0];
      if (target) this._setNodeType(target, 'shop');
    }

    if (!treasureNode) {
      const target = rewardCandidates.find((node) => node.type !== 'shop') ?? rewardCandidates[1];
      if (target) this._setNodeType(target, 'treasure');
    }
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _enforceSpecialNodeLimits(map) {
    const reachableKeys = new Set(
      this._getReachableCoordinates(map).map(({ x, y }) => `${x},${y}`)
    );
    const protectedKeys = new Set();

    const reachableRewardNodes = [...reachableKeys]
      .map((key) => {
        const [x, y] = key.split(',').map(Number);
        return map[y]?.[x] ?? null;
      })
      .filter((node) => node && node.y > 0 && node.y < map.length - 2);

    const guaranteedShop = reachableRewardNodes.find((node) => node.type === 'shop');
    const guaranteedTreasure = reachableRewardNodes.find((node) => node.type === 'treasure');

    if (guaranteedShop) protectedKeys.add(`${guaranteedShop.x},${guaranteedShop.y}`);
    if (guaranteedTreasure) protectedKeys.add(`${guaranteedTreasure.x},${guaranteedTreasure.y}`);

    this._trimNodeType(map, 'treasure', 1, protectedKeys, reachableKeys);
    this._trimNodeType(map, 'shop', 2, protectedKeys, reachableKeys);
  }

  /**
   * @param {(MapNode | null)[][]} map
   * @param {MapNodeType} type
   * @param {number} maxCount
   * @param {Set<string>} protectedKeys
   * @param {Set<string>} reachableKeys
   */
  _trimNodeType(map, type, maxCount, protectedKeys, reachableKeys) {
    const nodes = [];

    for (let y = 1; y < map.length - 2; y++) {
      for (let x = 0; x < 3; x++) {
        const node = map[y][x];
        if (node?.type === type) {
          nodes.push(node);
        }
      }
    }

    if (nodes.length <= maxCount) return;

    const removable = nodes
      .filter((node) => !protectedKeys.has(`${node.x},${node.y}`))
      .sort((left, right) => {
        const leftReachable = reachableKeys.has(`${left.x},${left.y}`) ? 1 : 0;
        const rightReachable = reachableKeys.has(`${right.x},${right.y}`) ? 1 : 0;
        if (leftReachable !== rightReachable) {
          return leftReachable - rightReachable;
        }
        return right.y - left.y;
      });

    let overflow = nodes.length - maxCount;
    removable.forEach((node) => {
      if (overflow <= 0) return;
      this._setNodeType(node, 'fight');
      overflow -= 1;
    });
  }

  /**
   * @param {(MapNode | null)[][]} map
   * @returns {Array<{ x: number, y: number }>}
   */
  _getReachableCoordinates(map) {
    const visited = new Set();
    const queue = [{ x: 1, y: 0 }];
    const output = [];

    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const node = map[current.y]?.[current.x];
      if (!node) continue;
      output.push(current);

      node.connections.forEach((targetX) => {
        if (map[current.y + 1]?.[targetX]) {
          queue.push({ x: targetX, y: current.y + 1 });
        }
      });
    }

    return output;
  }

  /**
   * @param {MapNode | null} node
   * @param {MapNodeType} type
   */
  _setNodeType(node, type) {
    if (!node) return;
    const meta = {
      fight: { label: 'Bitka', emoji: '⚔️' },
      shop: { label: 'Kram', emoji: '🛖' },
      treasure: { label: 'Skarb', emoji: '🎁' },
      campfire: { label: 'Watra', emoji: '🔥' },
      boss: { label: 'Boss', emoji: '👑' },
    };
    node.type = type;
    node.label = meta[type].label;
    node.emoji = meta[type].emoji;
  }

  /**
   * @param {number} x
   * @returns {number[]}
   */
  _getAdjacentColumns(x) {
    return [x - 1, x, x + 1].filter((candidate) => candidate >= 0 && candidate <= 2);
  }

  /**
   * @param {number} x
   * @returns {number}
   */
  _pickNextColumn(x) {
    const options = this._getAdjacentColumns(x);
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * @param {MapNode | null} node
   * @param {number} targetX
   */
  _linkNode(node, targetX) {
    if (!node) return;
    if (!node.connections.includes(targetX)) {
      node.connections.push(targetX);
      node.connections.sort((a, b) => a - b);
    }
  }

  /**
   * @param {(MapNode | null)[][]} map
   * @param {number} y
   * @param {number} x
   * @returns {boolean}
   */
  _hasInbound(map, y, x) {
    if (y === 0) return true;
    return map[y - 1].some((node) => node?.connections.includes(x));
  }

  /**
   * @param {(MapNode | null)[][]} map
   */
  _pruneUnreachableNodes(map) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let y = 1; y <= map.length - 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = map[y][x];
          if (!node) continue;
          if (!this._hasInbound(map, y, x)) {
            map[y][x] = null;
            changed = true;
          }
        }
      }

      for (let y = 0; y <= map.length - 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = map[y][x];
          if (!node) continue;
          node.connections = node.connections.filter((targetX) => !!map[y + 1]?.[targetX]);
        }
      }
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
    if (!this.hasStartedFirstBattle) return false;
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
    this.currentNode = { x: nodeIndex, y: level };
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
    const pool = this._buildAvailableRelicPool();
    if (pool.length === 0) return null;
    const relicId = this._pickRelicFromPool(pool);
    if (!relicId) return null;
    this._markRelicAsSeen(relicId);
    this.addRelic(relicId);
    return relicId;
  }

  /**
   * @param {boolean} [forceDrop=false]
   * @returns {string | null}
   */
  generateRelicReward(forceDrop = false) {
    const relicChance = 0.33;
    if (!forceDrop && Math.random() >= relicChance) return null;

    const pool = this._buildAvailableRelicPool();
    if (pool.length === 0) return null;
    const relicId = this._pickRelicFromPool(pool);
    if (!relicId) return null;
    this._markRelicAsSeen(relicId);
    return relicId;
  }

  /**
   * @returns {string[]}
   */
  _buildAvailableRelicPool() {
    return Object.keys(relicLibrary).filter(
      (id) => !this.relics.includes(id) && !this.seenRelicOffers.includes(id)
    );
  }

  /**
   * @param {string} relicId
   */
  _markRelicAsSeen(relicId) {
    if (!this.seenRelicOffers.includes(relicId)) {
      this.seenRelicOffers.push(relicId);
    }
  }

  /**
   * @param {string[]} pool
   * @returns {string | null}
   */
  _pickRelicFromPool(pool) {
    if (!pool || pool.length === 0) return null;
    const shuffled = [...pool];
    this._shuffle(shuffled);

    const picked = shuffled[0];
    if (picked !== 'papryczka_marka' || this.difficulty !== 'normal') {
      return picked;
    }

    if (Math.random() <= 0.05) {
      return picked;
    }

    const withoutPapryczka = shuffled.filter((id) => id !== 'papryczka_marka');
    if (withoutPapryczka.length === 0) {
      return null;
    }
    return withoutPapryczka[0];
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
    const cardPool = Object.keys(cardLibrary).filter((id) => !cardLibrary[id]?.isStarter);
    for (let i = cardPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
    }

    const relicPool = this._buildAvailableRelicPool();
    let relicId = null;
    const shouldForceHardPapryczka = this.difficulty === 'hard' && !this.hardFirstShopRolled;

    if (shouldForceHardPapryczka) {
      this.hardFirstShopRolled = true;
      if (relicPool.includes('papryczka_marka')) {
        relicId = 'papryczka_marka';
      }
    }

    if (!relicId) {
      relicId = this._pickRelicFromPool(relicPool);
    }

    if (relicId) {
      this._markRelicAsSeen(relicId);
    }

    this.shopStock = {
      cards: cardPool.slice(0, 3),
      relic: relicId,
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
      this.lastShopMessage = 'Tej pamiątki nie ma.';
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
    this._markRelicAsSeen(relicId);

    return true;
  }

  /**
   * @param {number} amount
   */
  healPlayer(amount) {
    if (this.hasRelic('dzwonek_owcy')) return;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
  }

  /**
   * Applies negative status to enemy, consuming boss artifact charges first.
   * @param {'weak' | 'fragile'} key
   * @param {number} amount
   */
  applyEnemyDebuff(key, amount) {
    if (amount <= 0) return;
    if (this.enemy.id === 'boss' && (this.enemy.bossArtifact ?? 0) > 0) {
      this.enemy.bossArtifact -= 1;
      return;
    }
    this.enemy.status[key] += amount;
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
   * Returns the effective cost of a card in hand, accounting for flaszka_sliwowicy overrides.
   * @param {string} cardId
   * @returns {number}
   */
  getCardCostInHand(cardId) {
    if (this.hasRelic('flaszka_sliwowicy') && cardId in this.flaszkaCostSeed) {
      return this.flaszkaCostSeed[cardId];
    }
    return cardLibrary[cardId]?.cost ?? 0;
  }

  /**
   * Marks a card to be kept for next turn (smycz_zakopane). Toggles if same card clicked again.
   * @param {string} cardId
   */
  setSmyczKeptCard(cardId) {
    if (!this.hasRelic('smycz_zakopane')) return;
    this.smyczKeptCardId = this.smyczKeptCardId === cardId ? null : cardId;
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
    return 5;
  }

  /**
   * Applies one-time effects that should trigger at the start of each battle.
   */
  _applyBattleStartRelics() {
    if (this.hasRelic('flaszka_sliwowicy')) {
      this.player.status.strength += 5;
    }

    if (this.hasRelic('papryczka_marka')) {
      this.player.status.strength += 3;
    }
  }

  /**
   * @param {number} amount
   */
  gainPlayerBlockFromCard(amount) {
    this.player.block += amount;
  }

  /**
   * @param {import('../data/enemies.js').EnemyDef} enemyDef
   * @returns {EnemyState}
   */
  _createEnemyState(enemyDef) {
    const isFinalBoss = enemyDef.id === 'boss';
    const scale = isFinalBoss ? 1 : this.enemyScaleFactor;
    const pattern = enemyDef.pattern
      ? enemyDef.pattern.map((move) => {
          if (move.type !== 'attack') return { ...move };
          return { ...move, damage: Math.round(move.damage * scale) };
        })
      : [];
    const bossBaseHp = this.difficulty === 'hard' ? 350 : 250;
    const baseMaxHp = isFinalBoss ? bossBaseHp : enemyDef.maxHp;
    const dzwonekMod = this.hasRelic('dzwonek_owcy') ? 0.8 : 1.0;
    const maxHp = Math.round(baseMaxHp * scale * dzwonekMod);
    /** @type {EnemyState} */
    const enemyState = {
      id: enemyDef.id,
      name: enemyDef.name,
      emoji: enemyDef.emoji,
      hp: maxHp,
      maxHp,
      block: enemyDef.block,
      nextAttack: 0,
      baseAttack: Math.round((enemyDef.baseAttack ?? 0) * scale),
      status: defaultStatus(),
      spriteSvg: enemyDef.spriteSvg,
      patternType: enemyDef.patternType,
      pattern,
      patternIndex: 0,
      currentIntent: { type: 'attack', name: 'Atak', damage: 0, hits: 1 },
      tookHpDamageThisTurn: false,
      bossArtifact: isFinalBoss ? 3 : 0,
    };
    enemyState.currentIntent = this._buildEnemyIntent(enemyState);
    enemyState.nextAttack =
      enemyState.currentIntent.type === 'attack' ? enemyState.currentIntent.damage : 0;
    return enemyState;
  }

  /** @returns {import('../data/enemies.js').EnemyDef} */
  _pickRandomEnemyDef() {
    const enemyIds = Object.keys(enemyLibrary).filter((id) => id !== 'boss');
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
    this.attackCardsPlayedThisBattle = 0;
    this.pocztowkaUsedThisBattle = false;
    this.smyczKeptCardId = null;
    this.flaszkaCostSeed = {};
    this.termometerTurnParity = 0;
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
    if (enemyState.id === 'boss') {
      const phase = this._getBossPhase(enemyState.hp);
      if (phase === 1) {
        return { type: 'attack', name: 'Podatek od zdjęcia', damage: 12, hits: 1 };
      }
      if (phase === 2) {
        return {
          type: 'attack',
          name: 'Agresywny Marketing',
          damage: 15,
          hits: 1,
          applyFragile: 2,
        };
      }
      return { type: 'attack', name: 'Furia Zdziśka', damage: 10, hits: 2 };
    }

    if (enemyState.patternType === 'loop') {
      const move = enemyState.pattern[enemyState.patternIndex % enemyState.pattern.length];
      return { ...move };
    }

    return {
      type: 'attack',
      name: 'Pstryka fotkę',
      damage: this._rollEnemyAttack(enemyState),
      hits: 1,
    };
  }

  /**
   * @param {number} currentHp
   * @returns {1 | 2 | 3}
   */
  _getBossPhase(currentHp) {
    if (currentHp > 150) return 1;
    if (currentHp >= 80) return 2;
    return 3;
  }

  /**
   * @returns {number}
   */
  _bossFinancialMultiplier() {
    return this.dutki > 200 ? 1.5 : 1;
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
    if (dealt > 0 && this.hasRelic('kierpce_wyprzedazy')) {
      this._drawCards(1);
    }
    return { raw: dmg, blocked, dealt };
  }

  /**
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  _applyEnemyIntent() {
    if (this.enemy.id === 'boss') {
      return this.executeBossTurn();
    }

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
   * Executes Król Krupówek turn with phase-based logic.
   * @returns {{ raw: number, blocked: number, dealt: number }}
   */
  executeBossTurn() {
    const phase = this._getBossPhase(this.enemy.hp);
    const intent = this._buildEnemyIntent(this.enemy);

    let raw = 0;
    let blocked = 0;
    let dealt = 0;
    const hits = intent.hits ?? 1;
    const multiplier = this._bossFinancialMultiplier();

    if (phase === 2 && intent.applyFragile) {
      this.player.status.fragile += intent.applyFragile;
    }

    for (let hitIndex = 0; hitIndex < hits; hitIndex++) {
      const baseHit = this.calculateDamage(intent.damage, this.enemy, this.player);
      const hitDamage = Math.floor(baseHit * multiplier);
      const result = this._applyDamageToPlayer(hitDamage);
      raw += result.raw;
      blocked += result.blocked;
      dealt += result.dealt;

      if (phase === 1) {
        if (this.dutki > 0) {
          this.dutki = Math.max(0, this.dutki - 15);
        } else {
          this.enemy.block += 5;
        }
      }
    }

    if (phase === 2) {
      this.enemy.status.strength += 1;
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
    let perHit = this.calculateDamage(intent.damage, this.enemy, this.player);
    if (this.enemy.id === 'boss') {
      perHit = Math.floor(perHit * this._bossFinancialMultiplier());
    }
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
    if (this.enemy.id === 'baba') {
      return [
        {
          text: '🧀 Świeży oscypek',
          tooltip:
            'Na końcu tury gracza Gaździna leczy 5 Krzepy, jeśli nie dostała obrażeń w tej turze.',
        },
      ];
    }

    if (this.enemy.id === 'boss') {
      return [
        {
          text: `🛡️ Artefakt: ${this.enemy.bossArtifact ?? 0}`,
          tooltip: 'Blokuje pierwsze 3 negatywne statusy nałożone przez gracza.',
        },
        {
          text: '💰 Motywacja Finansowa',
          tooltip: 'Gdy masz ponad 200 dutków, ataki bossa zadają o 50% więcej obrażeń.',
        },
      ];
    }

    return [];
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
    this.player.energy = this.player.maxEnergy + this.player.status.energy_next_turn;
    this.player.status.energy_next_turn = 0;
    this.player.block = 0;
    this._drawCards(this._drawPerTurn());

    // Smycz Zakopane: re-add kept card to front of hand
    if (this.smyczKeptCardId) {
      this.hand.unshift(this.smyczKeptCardId);
      this.smyczKeptCardId = null;
    }

    // Wiatr Halny: 50% draw +2, 50% discard random card from hand
    if (this.hasRelic('wiatr_halny')) {
      if (Math.random() < 0.5) {
        this._drawCards(2);
      } else if (this.hand.length > 0) {
        const idx = Math.floor(Math.random() * this.hand.length);
        this.discard.push(this.hand.splice(idx, 1)[0]);
      }
    }

    // Flaszka Śliwowicy: randomize card costs per card type in hand this turn
    if (this.hasRelic('flaszka_sliwowicy')) {
      this.flaszkaCostSeed = {};
      for (const cardId of this.hand) {
        if (!(cardId in this.flaszkaCostSeed)) {
          this.flaszkaCostSeed[cardId] = Math.floor(Math.random() * 4); // 0–3
        }
      }
    } else {
      this.flaszkaCostSeed = {};
    }

    // Papryczka Marka: –2 HP per turn (min 1)
    if (this.hasRelic('papryczka_marka')) {
      this.player.hp = Math.max(1, this.player.hp - 2);
    }
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
    const actualCost = this.getCardCostInHand(cardId);
    if (!card || this.player.energy < actualCost) return { success: false };

    this.player.energy -= actualCost;

    const isFirstCardThisBattle =
      this.hasRelic('pocztowka_giewont') && !this.pocztowkaUsedThisBattle;
    this.pocztowkaUsedThisBattle = true;

    this.hand.splice(handIndex, 1);
    if (card.exhaust) {
      this.exhaust.push(cardId);
    } else {
      this.discard.push(cardId);
    }

    const effect = card.effect(this);

    // Pocztówka z Giewontem: first card in battle fires twice
    if (isFirstCardThisBattle) {
      card.effect(this);
    }

    // Ciupaga-Długopis: every skill card deals 4 bonus dmg
    if (this.hasRelic('ciupaga_dlugopis') && card.type === 'skill') {
      this._applyDamageToEnemy(4);
    }

    // Bilet TPN: every 3rd attack card this battle grants +1 energy
    if (card.type === 'attack') {
      this.attackCardsPlayedThisBattle += 1;
      if (this.attackCardsPlayedThisBattle % 3 === 0 && this.hasRelic('bilet_tpn')) {
        this.player.energy += 1;
      }
    }

    return { success: true, effect };
  }

  /**
   * Discards hand, Ceper attacks Góral, ticks enemy statuses, rolls next enemy attack.
   * @returns {EndTurnResult}
   */
  endTurn() {
    // Smycz Zakopane: extract kept card from hand before discarding
    if (this.hasRelic('smycz_zakopane') && this.smyczKeptCardId) {
      const keptIdx = this.hand.indexOf(this.smyczKeptCardId);
      if (keptIdx >= 0) {
        this.hand.splice(keptIdx, 1);
        // smyczKeptCardId stays set so startTurn can re-add it
      } else {
        this.smyczKeptCardId = null;
      }
    }

    this.discard.push(...this.hand);
    this.hand = [];

    // End of player turn.
    this._tickStatus(this.player.status);

    // Krokus pod Ochroną: heal 2 HP if block > 10 (before enemy attacks clear block)
    /** @type {{ amount: number, text: string } | null} */
    let playerPassiveHeal = null;
    if (this.hasRelic('krokus') && this.player.block > 10) {
      const hpBefore = this.player.hp;
      this.healPlayer(2);
      const healed = this.player.hp - hpBefore;
      if (healed > 0) {
        playerPassiveHeal = { amount: healed, text: `+${healed} HP (Krokus)` };
      }
    }

    /** @type {{ amount: number, text: string } | null} */
    let enemyPassiveHeal = null;
    if (this.enemy.id === 'baba' && !this.enemy.tookHpDamageThisTurn) {
      const hpBefore = this.enemy.hp;
      this.enemy.hp = Math.min(this.enemy.maxHp, this.enemy.hp + 5);
      const healedAmount = this.enemy.hp - hpBefore;
      if (healedAmount > 0) {
        enemyPassiveHeal = {
          amount: healedAmount,
          text: `+${healedAmount} Krzepy (Świeży oscypek)`,
        };
      }
    }

    // Enemy loses old block at the start of its own turn, before taking a new action.
    this.enemy.block = 0;
    const enemyAttack = this._applyEnemyIntent();

    // Zepsuty Termometr: enemy status ticks every other turn
    if (!this.hasRelic('zepsuty_termometr') || this.termometerTurnParity === 0) {
      this._tickStatus(this.enemy.status);
    }
    if (this.hasRelic('zepsuty_termometr')) {
      this.termometerTurnParity = 1 - this.termometerTurnParity;
    }

    if (this.enemy.id === 'busiarz') {
      this.enemy.status.strength += 1;
    }

    if (this.enemy.patternType === 'loop') {
      this.enemy.patternIndex = (this.enemy.patternIndex + 1) % this.enemy.pattern.length;
    }
    this._refreshEnemyIntent();

    return { enemyAttack, enemyPassiveHeal, playerPassiveHeal };
  }

  /**
   * Resets combat after victory with fixed enemy stats from enemyLibrary.
   * - Keep player HP between battles (no auto-heal)
   * - Boss node: spawn final boss (Król Krupówek)
   * - Clear blocks and statuses
   * - Move hand/discard/exhaust back to deck and shuffle
   * - Start a fresh turn
   */
  resetBattle() {
    this.battleWins += 1;

    if (this.difficulty === 'hard') {
      this.enemyScaleFactor = Math.round(this.enemyScaleFactor * 1.1 * 100) / 100;
    }

    this.player.block = 0;

    this.attackCardsPlayedThisBattle = 0;
    this.pocztowkaUsedThisBattle = false;
    this.smyczKeptCardId = null;
    this.flaszkaCostSeed = {};
    this.termometerTurnParity = 0;

    this.player.status = defaultStatus();

    this.deck.push(...this.hand, ...this.discard, ...this.exhaust);
    this.hand = [];
    this.discard = [];
    this.exhaust = [];
    this._shuffle(this.deck);

    const currentNode = this.getCurrentMapNode();
    const isBossNode = currentNode?.type === 'boss';
    const nextEnemy = isBossNode ? enemyLibrary.boss : this._pickRandomEnemyDef();
    this.enemy = this._createEnemyState(nextEnemy);
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
