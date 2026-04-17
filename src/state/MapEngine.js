const MIN_ELITE_LEVEL = 4;
const MID_NODE_EVENT_CHANCE = 0.34;
const MID_NODE_FIGHT_CHANCE = 0.2;
const MID_NODE_ELITE_CHANCE = 0.08;

/**
 * @typedef {'fight' | 'elite' | 'shop' | 'treasure' | 'event' | 'campfire' | 'boss' | 'maryna'} MapNodeType
 * @typedef {{ x: number, y: number, type: MapNodeType, label: string, emoji: string, weather: import('../data/weather.js').WeatherId, connections: number[], eventOutcome?: 'event' | 'fight' | 'shop', forcedEnemyId?: string }} MapNode
 */

/**
 * @param {{
 *   debugMapRows: number,
 *   midCampfireLevel: number | null,
 *   guaranteedTreasureRow: number | null,
 *   guaranteedTreasureColumn: number,
 *   map: (MapNode | null)[][],
 *   currentLevel: number,
 *   currentNodeIndex: number,
 *   currentNode: { x: number, y: number },
 *   hasStartedFirstBattle: boolean,
 *   _createMapNode: (type: MapNodeType, x: number, y: number) => MapNode,
 *   _rollMidNodeType: (level?: number) => MapNodeType,
 *   _seedRequiredPaths: (map: (MapNode | null)[][]) => void,
 *   _connectOptionalGridNodes: (map: (MapNode | null)[][]) => void,
 *   _removeCrossingConnections: (map: (MapNode | null)[][]) => void,
 *   _pruneUnreachableNodes: (map: (MapNode | null)[][]) => void,
 *   _ensureGuaranteedPathRewards: (map: (MapNode | null)[][]) => void,
 *   _enforceSpecialNodeLimits: (map: (MapNode | null)[][]) => void,
 *   _ensureReachableElite: (map: (MapNode | null)[][]) => void,
 *   _ensureReachableTrueEvent: (map: (MapNode | null)[][]) => void,
 *   _forceRow1CeprFights: (map: (MapNode | null)[][]) => void
 * }} state
 * @param {number} [rows]
 * @returns {(MapNode | null)[][]}
 */
export function generateMap(state, rows = state.debugMapRows) {
  const clampedRows = Math.min(25, Math.max(10, Math.floor(rows)));
  state.debugMapRows = clampedRows;
  /** @type {(MapNode | null)[][]} */
  const generated = Array.from({ length: clampedRows }, () => Array(3).fill(null));
  const midCampfireLevel = Math.floor(generated.length / 2);
  const guaranteedTreasureRow = 3 + Math.floor(Math.random() * 3);
  state.midCampfireLevel = midCampfireLevel;
  state.guaranteedTreasureRow = guaranteedTreasureRow;
  state.guaranteedTreasureColumn = 1;

  generated[0][1] = state._createMapNode('maryna', 1, 0);

  const lastMidLevel = generated.length - 3;
  for (let y = 1; y <= lastMidLevel; y++) {
    if (y === midCampfireLevel) {
      generated[y][1] = state._createMapNode('campfire', 1, y);
      continue;
    }
    if (y === guaranteedTreasureRow) {
      generated[y][state.guaranteedTreasureColumn] = state._createMapNode(
        'treasure',
        state.guaranteedTreasureColumn,
        y
      );
      continue;
    }
    for (let x = 0; x < 3; x++) {
      if (Math.random() < 0.7) {
        generated[y][x] = state._createMapNode(state._rollMidNodeType(y), x, y);
      }
    }
    if (!generated[y].some(Boolean)) {
      const forcedX = Math.floor(Math.random() * 3);
      generated[y][forcedX] = state._createMapNode(state._rollMidNodeType(y), forcedX, y);
    }
  }

  generated[generated.length - 2][1] = state._createMapNode('campfire', 1, generated.length - 2);
  generated[generated.length - 1][1] = state._createMapNode('boss', 1, generated.length - 1);

  state._seedRequiredPaths(generated);
  state._connectOptionalGridNodes(generated);
  state._removeCrossingConnections(generated);
  state._pruneUnreachableNodes(generated);
  state._ensureGuaranteedPathRewards(generated);
  state._enforceSpecialNodeLimits(generated);
  state._ensureReachableElite(generated);
  state._ensureReachableTrueEvent(generated);
  state._forceRow1CeprFights(generated);
  ensureShopPathRules(state, generated);
  // Re-check elite guarantee after shop rewrites to preserve map invariants.
  state._ensureReachableElite(generated);
  ensureEliteRules(state, generated);

  state.map = generated;
  state.currentLevel = 0;
  state.currentNodeIndex = 1;
  state.currentNode = { x: state.currentNodeIndex, y: 0 };
  state.hasStartedFirstBattle = false;
  return state.map;
}

/**
 * @param {{ _rollNodeWeather: (nodeType: MapNodeType) => import('../data/weather.js').WeatherId, rollEventNodeOutcome: () => 'event' | 'fight' | 'shop' }} state
 * @param {MapNodeType} type
 * @param {number} x
 * @param {number} y
 * @returns {MapNode}
 */
export function createMapNode(state, type, x, y) {
  const meta = {
    fight: { label: 'Bitka', emoji: '⚔️' },
    elite: { label: 'Elita', emoji: '🗡️' },
    shop: { label: 'Jarmark', emoji: '🛖' },
    treasure: { label: 'Skarb', emoji: '🎁' },
    event: { label: 'Wydarzenie', emoji: '❓' },
    campfire: { label: 'Watra', emoji: '🔥' },
    boss: { label: 'Herszt', emoji: '👑' },
    maryna: { label: 'Maryna', emoji: '👵' },
  };
  const weather = state._rollNodeWeather(type);
  const node = { ...meta[type], x, y, type, weather, connections: [] };
  if (type === 'event') {
    node.eventOutcome = state.rollEventNodeOutcome();
  }
  return node;
}

/**
 * @param {{ _setNodeType: (node: MapNode | null, type: MapNodeType) => void }} state
 * @param {(MapNode | null)[][]} map
 */
export function forceRow1CeprFights(state, map) {
  const row = map[1] ?? [];
  row.forEach((node) => {
    if (!node) return;
    state._setNodeType(node, 'fight');
    node.forcedEnemyId = 'cepr';
  });
}

/**
 * @param {number} [level]
 * @returns {MapNodeType}
 */
export function rollMidNodeType(level = MIN_ELITE_LEVEL) {
  const roll = Math.random();
  if (roll < MID_NODE_EVENT_CHANCE) return 'event';
  if (roll < MID_NODE_EVENT_CHANCE + MID_NODE_FIGHT_CHANCE) return 'fight';
  if (roll < MID_NODE_EVENT_CHANCE + MID_NODE_FIGHT_CHANCE + MID_NODE_ELITE_CHANCE) {
    return level >= MIN_ELITE_LEVEL ? 'elite' : 'fight';
  }
  return 'shop';
}

/**
 * @param {MapNodeType} nodeType
 * @returns {import('../data/weather.js').WeatherId}
 */
export function rollNodeWeather(nodeType) {
  if (nodeType === 'boss') return 'halny';
  if (nodeType === 'maryna') return 'clear';
  if (nodeType !== 'fight' && nodeType !== 'elite') return 'clear';

  const roll = Math.random();
  if (roll < 0.5) return 'clear';
  if (roll < 0.65) return 'halny';
  if (roll < 0.8) return 'frozen';
  return 'fog';
}

/**
 * @param {{
 *   midCampfireLevel: number | null,
 *   guaranteedTreasureRow: number | null,
 *   _shuffle: (array: number[]) => void,
 *   _createMapNode: (type: MapNodeType, x: number, y: number) => MapNode,
 *   _rollMidNodeType: (level?: number) => MapNodeType,
 *   _linkNode: (node: MapNode | null, targetX: number) => void,
 *   _getAdjacentColumns: (x: number) => number[],
 *   _forcedNodeTypeForLevel: (level: number, mapLength: number) => MapNodeType | null,
 *   _setNodeType: (node: MapNode | null, type: MapNodeType) => void,
 *   _pruneUnreachableNodes: (map: (MapNode | null)[][]) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function seedRequiredPaths(state, map) {
  const startNode = map[0][1];
  if (!startNode) return;
  const campfireLevel = map.length - 2;
  const midCampfireLevel = state.midCampfireLevel ?? Math.floor(map.length / 2);
  const guaranteedTreasureRow = state.guaranteedTreasureRow;
  const lastMidLevel = campfireLevel - 1;

  const firstTargets = [0, 1, 2];
  state._shuffle(firstTargets);
  const branchCount = 2 + Math.floor(Math.random() * 2);
  const seededTargets = firstTargets.slice(0, branchCount).sort((a, b) => a - b);

  seededTargets.forEach((targetX) => {
    if (!map[1][targetX]) {
      map[1][targetX] = state._createMapNode(state._rollMidNodeType(1), targetX, 1);
    }
    state._linkNode(startNode, targetX);
  });

  const usedPerLevel = new Map();
  usedPerLevel.set(1, new Set(seededTargets));

  seededTargets.forEach((startX, branchIndex) => {
    let currentX = startX;
    for (let y = 1; y < campfireLevel; y++) {
      let nextX;
      if (y === lastMidLevel || y + 1 === midCampfireLevel || y + 1 === guaranteedTreasureRow) {
        nextX = 1;
      } else {
        const options = state._getAdjacentColumns(currentX);
        const used = usedPerLevel.get(y + 1) ?? new Set();
        const freshOptions = options.filter((x) => !used.has(x));
        const pool = freshOptions.length > 0 ? freshOptions : options;
        nextX = pool[Math.floor(Math.random() * pool.length)];
      }

      if (!map[y + 1][nextX]) {
        const forcedType = state._forcedNodeTypeForLevel(y + 1, map.length);
        const nextType = forcedType ?? state._rollMidNodeType(y + 1);
        map[y + 1][nextX] = state._createMapNode(nextType, nextX, y + 1);
      }

      state._linkNode(map[y][currentX], nextX);

      if (!usedPerLevel.has(y + 1)) {
        usedPerLevel.set(y + 1, new Set());
      }
      usedPerLevel.get(y + 1).add(nextX);
      currentX = nextX;
    }

    if (branchIndex === 0) {
      state._setNodeType(map[1][startX], 'shop');
    }
  });

  state._pruneUnreachableNodes(map);
}

/**
 * @param {{
 *   _hasInbound: (map: (MapNode | null)[][], y: number, x: number) => boolean,
 *   _getAdjacentColumns: (x: number) => number[],
 *   _linkNode: (node: MapNode | null, targetX: number) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function connectOptionalGridNodes(state, map) {
  const campfireLevel = map.length - 2;
  const lastMidLevel = campfireLevel - 1;

  for (let y = 1; y <= lastMidLevel; y++) {
    for (let x = 0; x < 3; x++) {
      const node = map[y][x];
      if (!node || state._hasInbound(map, y, x)) continue;

      const prevCandidates = state._getAdjacentColumns(x).filter((prevX) => !!map[y - 1][prevX]);
      const nextCandidates =
        y === lastMidLevel
          ? [1]
          : state._getAdjacentColumns(x).filter((nextX) => !!map[y + 1][nextX]);

      if (prevCandidates.length === 0 || nextCandidates.length === 0) {
        map[y][x] = null;
        continue;
      }

      const sourceX = prevCandidates[Math.floor(Math.random() * prevCandidates.length)];
      state._linkNode(map[y - 1][sourceX], x);
      const targetX = nextCandidates[Math.floor(Math.random() * nextCandidates.length)];
      state._linkNode(node, targetX);
    }
  }

  for (let y = 0; y <= lastMidLevel; y++) {
    for (let x = 0; x < 3; x++) {
      const node = map[y][x];
      if (!node) continue;

      const availableTargets =
        y === lastMidLevel
          ? [1]
          : state._getAdjacentColumns(x).filter((nextX) => !!map[y + 1][nextX]);
      if (availableTargets.length === 0) continue;

      if (node.connections.length === 0) {
        state._linkNode(
          node,
          availableTargets[Math.floor(Math.random() * availableTargets.length)]
        );
      }

      if (y < lastMidLevel && availableTargets.length > 1 && Math.random() < 0.45) {
        const extraTargets = availableTargets.filter(
          (targetX) => !node.connections.includes(targetX)
        );
        if (extraTargets.length > 0) {
          state._linkNode(node, extraTargets[Math.floor(Math.random() * extraTargets.length)]);
        }
      }
    }
  }

  if (map[campfireLevel][1]) {
    map[campfireLevel][1].connections = [1];
  }
}

/**
 * @param {{ _linkNode: (node: MapNode | null, targetX: number) => void }} state
 * @param {(MapNode | null)[][]} map
 */
export function removeCrossingConnections(state, map) {
  for (let y = 0; y < map.length - 1; y++) {
    let changed = true;
    while (changed) {
      changed = false;

      for (let leftX = 0; leftX < 2 && !changed; leftX++) {
        const leftNode = map[y][leftX];
        if (!leftNode) continue;

        for (let rightX = leftX + 1; rightX < 3 && !changed; rightX++) {
          const rightNode = map[y][rightX];
          if (!rightNode) continue;

          for (const leftTarget of leftNode.connections) {
            for (const rightTarget of rightNode.connections) {
              if (leftTarget <= rightTarget) continue;

              leftNode.connections = leftNode.connections.filter((x) => x !== leftTarget);
              rightNode.connections = rightNode.connections.filter((x) => x !== rightTarget);
              state._linkNode(leftNode, rightTarget);
              state._linkNode(rightNode, leftTarget);
              changed = true;

              if (changed) break;
            }
            if (changed) break;
          }
        }
      }
    }
  }
}

/**
 * @param {{
 *   _getReachableCoordinates: (map: (MapNode | null)[][]) => Array<{ x: number, y: number }>,
 *   guaranteedTreasureRow: number | null,
 *   _setNodeType: (node: MapNode | null, type: MapNodeType) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function ensureGuaranteedPathRewards(state, map) {
  const reachable = state._getReachableCoordinates(map);
  const reachableNodes = reachable
    .map(({ x, y }) => map[y][x])
    .filter((node) => node && node.y > 0 && node.y < map.length - 2);

  const shopNode = reachableNodes.find((node) => node.type === 'shop');
  if (shopNode) return;

  const rewardCandidates = reachableNodes.filter(
    (node) => node.y <= map.length - 3 && node.y !== state.guaranteedTreasureRow
  );
  const target = rewardCandidates[0];
  if (target) state._setNodeType(target, 'shop');
}

/**
 * Ensures map shop rules:
 * 1) there is at least one reachable path with >= 3 shops,
 * 2) no path can traverse two consecutive shop nodes.
 *
 * @param {{
 *   _getReachableCoordinates: (map: (MapNode | null)[][]) => Array<{ x: number, y: number }>,
 *   _setNodeType: (node: MapNode | null, type: MapNodeType) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function ensureShopPathRules(state, map) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reachableKeys = new Set(
      state._getReachableCoordinates(map).map(({ x, y }) => `${x},${y}`)
    );

    breakConsecutiveShops(state, map, reachableKeys);
    promoteShopsOnBestReachablePath(state, map);
    ensureMinimumReachableShops(state, map, reachableKeys, 5);

    const noConsecutive = !hasConsecutiveReachableShops(map, reachableKeys);
    const bestPath = getBestReachablePathNoConsecutive(map);
    const pathShopCount = countShopsOnPath(bestPath);
    const reachableShopCount = countReachableShops(map, reachableKeys);
    if (noConsecutive && pathShopCount >= 3 && reachableShopCount >= 5) return;
  }
}

/**
 * @param {(MapNode | null)[][]} map
 * @param {Set<string>} reachableKeys
 * @returns {boolean}
 */
function hasConsecutiveReachableShops(map, reachableKeys) {
  for (let y = 0; y < map.length - 1; y++) {
    for (let x = 0; x < 3; x++) {
      const node = map[y]?.[x];
      if (!node || node.type !== 'shop' || !reachableKeys.has(`${x},${y}`)) continue;

      for (const targetX of node.connections) {
        const target = map[y + 1]?.[targetX];
        if (!target || !reachableKeys.has(`${targetX},${y + 1}`)) continue;
        if (target.type === 'shop') return true;
      }
    }
  }
  return false;
}

/**
 * @param {{ _setNodeType: (node: MapNode | null, type: MapNodeType) => void }} state
 * @param {(MapNode | null)[][]} map
 * @param {Set<string>} reachableKeys
 */
function breakConsecutiveShops(state, map, reachableKeys) {
  for (let y = 0; y < map.length - 1; y++) {
    for (let x = 0; x < 3; x++) {
      const node = map[y]?.[x];
      if (!node || node.type !== 'shop' || !reachableKeys.has(`${x},${y}`)) continue;

      for (const targetX of node.connections) {
        const target = map[y + 1]?.[targetX];
        if (!target || !reachableKeys.has(`${targetX},${y + 1}`)) continue;
        if (target.type !== 'shop') continue;
        state._setNodeType(target, 'fight');
      }
    }
  }
}

/**
 * Picks the best reachable path under the no-consecutive-shop rule.
 *
 * @param {(MapNode | null)[][]} map
 * @returns {MapNode[]}
 */
function getBestReachablePathNoConsecutive(map) {
  const rows = map.length;
  const NEG = Number.NEGATIVE_INFINITY;
  const best = Array.from({ length: rows }, () => Array(3).fill(NEG));
  const parent = Array.from({ length: rows }, () => Array(3).fill(null));

  const start = map[0]?.[1];
  if (!start) return [];
  best[0][1] = start.type === 'shop' ? 1 : 0;

  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < 3; x++) {
      const node = map[y]?.[x];
      if (!node || best[y][x] === NEG) continue;

      for (const targetX of node.connections) {
        const target = map[y + 1]?.[targetX];
        if (!target) continue;
        if (node.type === 'shop' && target.type === 'shop') continue;

        const gain = target.type === 'shop' ? 1 : 0;
        const candidate = best[y][x] + gain;
        if (candidate <= best[y + 1][targetX]) continue;

        best[y + 1][targetX] = candidate;
        parent[y + 1][targetX] = { x, y };
      }
    }
  }

  if (best[rows - 1][1] === NEG || !map[rows - 1]?.[1]) return [];

  /** @type {MapNode[]} */
  const reversed = [];
  let cursor = { x: 1, y: rows - 1 };
  while (cursor) {
    const node = map[cursor.y]?.[cursor.x];
    if (!node) break;
    reversed.push(node);
    cursor = parent[cursor.y][cursor.x];
  }

  return reversed.reverse();
}

/**
 * @param {MapNode[]} path
 * @returns {number}
 */
function countShopsOnPath(path) {
  return path.reduce((sum, node) => sum + (node.type === 'shop' ? 1 : 0), 0);
}

/**
 * @param {(MapNode | null)[][]} map
 * @param {Set<string>} reachableKeys
 * @returns {number}
 */
function countReachableShops(map, reachableKeys) {
  let count = 0;
  for (const key of reachableKeys) {
    const [x, y] = key.split(',').map(Number);
    const node = map[y]?.[x];
    if (node?.type === 'shop') count += 1;
  }
  return count;
}

/**
 * @param {{ _setNodeType: (node: MapNode | null, type: MapNodeType) => void }} state
 * @param {(MapNode | null)[][]} map
 */
function promoteShopsOnBestReachablePath(state, map) {
  const path = getBestReachablePathNoConsecutive(map);
  if (path.length === 0) return;

  let shops = countShopsOnPath(path);
  if (shops >= 3) return;

  for (let i = 1; i < path.length - 2 && shops < 3; i++) {
    const node = path[i];
    if (!node) continue;

    // Keep row 1 reserved for forced Ceper fights after Maryna.
    if (node.y <= 1) continue;

    if (node.type === 'shop') continue;
    if (node.type === 'elite') continue;
    if (node.type === 'maryna' || node.type === 'campfire' || node.type === 'boss') continue;
    if (node.type === 'treasure') continue;

    const prev = path[i - 1];
    const next = path[i + 1];
    const prevIsShop = !!prev && prev.type === 'shop';
    const nextIsShop = !!next && next.type === 'shop';
    if (prevIsShop || nextIsShop) continue;

    state._setNodeType(node, 'shop');
    shops += 1;
  }
}

/**
 * Guarantees a minimum number of reachable shops while preserving:
 * - no consecutive shop transitions,
 * - row-1 forced Ceper fights,
 * - elite/treasure/campfire/boss nodes.
 *
 * @param {{ _setNodeType: (node: MapNode | null, type: MapNodeType) => void }} state
 * @param {(MapNode | null)[][]} map
 * @param {Set<string>} reachableKeys
 * @param {number} minCount
 */
function ensureMinimumReachableShops(state, map, reachableKeys, minCount) {
  let currentCount = countReachableShops(map, reachableKeys);
  if (currentCount >= minCount) return;

  const perColumn = [0, 0, 0];
  for (const key of reachableKeys) {
    const [x, y] = key.split(',').map(Number);
    const node = map[y]?.[x];
    if (node?.type === 'shop') perColumn[x] += 1;
  }

  /** @type {MapNode[]} */
  const candidates = [];
  for (const key of reachableKeys) {
    const [x, y] = key.split(',').map(Number);
    const node = map[y]?.[x];
    if (!node) continue;
    if (!canConvertToShop(map, x, y, reachableKeys)) continue;
    candidates.push(node);
  }

  candidates.sort((left, right) => {
    const byColumnNeed = perColumn[left.x] - perColumn[right.x];
    if (byColumnNeed !== 0) return byColumnNeed;
    return left.y - right.y;
  });

  for (const node of candidates) {
    if (currentCount >= minCount) break;
    if (!canConvertToShop(map, node.x, node.y, reachableKeys)) continue;
    state._setNodeType(node, 'shop');
    perColumn[node.x] += 1;
    currentCount += 1;
  }
}

/**
 * @param {(MapNode | null)[][]} map
 * @param {number} x
 * @param {number} y
 * @param {Set<string>} reachableKeys
 * @returns {boolean}
 */
function canConvertToShop(map, x, y, reachableKeys) {
  const node = map[y]?.[x];
  if (!node) return false;
  if (!reachableKeys.has(`${x},${y}`)) return false;

  // Keep row 1 reserved for forced Ceper fights after Maryna.
  if (y <= 1) return false;

  if (node.type === 'shop') return false;
  if (node.type === 'elite') return false;
  if (node.type === 'maryna' || node.type === 'campfire' || node.type === 'boss') return false;
  if (node.type === 'treasure') return false;

  const prevRow = map[y - 1] ?? [];
  for (let prevX = 0; prevX < 3; prevX++) {
    const prev = prevRow[prevX];
    if (!prev || !reachableKeys.has(`${prevX},${y - 1}`)) continue;
    if (!prev.connections.includes(x)) continue;
    if (prev.type === 'shop') return false;
  }

  for (const targetX of node.connections) {
    const next = map[y + 1]?.[targetX];
    if (!next || !reachableKeys.has(`${targetX},${y + 1}`)) continue;
    if (next.type === 'shop') return false;
  }

  return true;
}

/**
 * @param {{
 *   _getReachableCoordinates: (map: (MapNode | null)[][]) => Array<{ x: number, y: number }>,
 *   guaranteedTreasureRow: number | null,
 *   guaranteedTreasureColumn: number,
 *   _trimNodeType: (
 *     map: (MapNode | null)[][],
 *     type: MapNodeType,
 *     maxCount: number,
 *     protectedKeys: Set<string>,
 *     reachableKeys: Set<string>
 *   ) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function enforceSpecialNodeLimits(state, map) {
  const reachableKeys = new Set(state._getReachableCoordinates(map).map(({ x, y }) => `${x},${y}`));
  const protectedKeys = new Set();

  const reachableRewardNodes = [...reachableKeys]
    .map((key) => {
      const [x, y] = key.split(',').map(Number);
      return map[y]?.[x] ?? null;
    })
    .filter((node) => node && node.y > 0 && node.y < map.length - 2);

  const guaranteedShop = reachableRewardNodes.find((node) => node.type === 'shop');
  const guaranteedTreasureRow = state.guaranteedTreasureRow;
  const guaranteedTreasureColumn = state.guaranteedTreasureColumn;

  if (guaranteedShop) protectedKeys.add(`${guaranteedShop.x},${guaranteedShop.y}`);
  if (guaranteedTreasureRow !== null) {
    protectedKeys.add(`${guaranteedTreasureColumn},${guaranteedTreasureRow}`);
  }

  state._trimNodeType(map, 'treasure', 1, protectedKeys, reachableKeys);
  state._trimNodeType(map, 'shop', 8, protectedKeys, reachableKeys);
}

/**
 * @param {{
 *   _getReachableCoordinates: (map: (MapNode | null)[][]) => Array<{ x: number, y: number }>,
 *   _setNodeType: (node: MapNode | null, type: MapNodeType) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function ensureReachableElite(state, map) {
  const reachable = state
    ._getReachableCoordinates(map)
    .map(({ x, y }) => map[y]?.[x] ?? null)
    .filter((node) => node && node.y > 0 && node.y < map.length - 2);

  if (reachable.some((node) => node.type === 'elite' && node.y >= MIN_ELITE_LEVEL)) return;

  const candidate = reachable.find((node) => node.type === 'fight' && node.y >= MIN_ELITE_LEVEL);
  if (candidate) {
    state._setNodeType(candidate, 'elite');
  }
}

/**
 * Ensures at least 3 reachable elite nodes on the map, with at least 3 rows separating
 * any two elites (i.e. row distance >= 4). Converts fight nodes to fill gaps as needed,
 * and breaks apart elites that are too close.
 * @param {{
 *   _getReachableCoordinates: (map: (MapNode | null)[][]) => Array<{ x: number, y: number }>,
 *   _setNodeType: (node: MapNode | null, type: MapNodeType) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function ensureEliteRules(state, map) {
  const MIN_GAP = 3;
  const MIN_COUNT = 3;

  const isEligible = (y) => y >= MIN_ELITE_LEVEL && y < map.length - 2;

  const getReachableElites = () =>
    state
      ._getReachableCoordinates(map)
      .map(({ x, y }) => map[y]?.[x] ?? null)
      .filter((n) => n && n.type === 'elite' && isEligible(n.y))
      .sort((a, b) => a.y - b.y);

  // Step 1: break up elites that are too close to each other
  let elites = getReachableElites();
  let changed = true;
  while (changed) {
    changed = false;
    elites = getReachableElites();
    for (let i = 1; i < elites.length; i++) {
      if (elites[i].y - elites[i - 1].y < MIN_GAP) {
        state._setNodeType(elites[i], 'fight');
        changed = true;
        break;
      }
    }
  }

  // Step 2: promote fight nodes to elites until count >= MIN_COUNT, respecting min gap
  elites = getReachableElites();
  if (elites.length >= MIN_COUNT) return;

  const candidates = state
    ._getReachableCoordinates(map)
    .map(({ x, y }) => map[y]?.[x] ?? null)
    .filter((n) => n && n.type === 'fight' && isEligible(n.y))
    .sort((a, b) => a.y - b.y);

  for (const candidate of candidates) {
    if (elites.length >= MIN_COUNT) break;
    const tooClose = elites.some((e) => Math.abs(e.y - candidate.y) < MIN_GAP);
    if (!tooClose) {
      state._setNodeType(candidate, 'elite');
      elites = getReachableElites();
    }
  }
}

/**
 * @param {{
 *   _getReachableCoordinates: (map: (MapNode | null)[][]) => Array<{ x: number, y: number }>,
 *   _setNodeType: (node: MapNode | null, type: MapNodeType) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function ensureReachableTrueEvent(state, map) {
  const reachable = state
    ._getReachableCoordinates(map)
    .map(({ x, y }) => map[y]?.[x] ?? null)
    .filter((node) => node && node.y > 0 && node.y < map.length - 2);

  if (reachable.some((node) => node.type === 'event' && node.eventOutcome === 'event')) return;

  const existingEventNode = reachable.find((node) => node.type === 'event');
  if (existingEventNode) {
    existingEventNode.eventOutcome = 'event';
    return;
  }

  const promoteCandidate = reachable.find((node) => node.type === 'fight');
  if (!promoteCandidate) return;

  state._setNodeType(promoteCandidate, 'event');
  promoteCandidate.eventOutcome = 'event';
}

/**
 * @param {{
 *   _setNodeType: (node: MapNode | null, type: MapNodeType) => void
 * }} state
 * @param {(MapNode | null)[][]} map
 * @param {MapNodeType} type
 * @param {number} maxCount
 * @param {Set<string>} protectedKeys
 * @param {Set<string>} reachableKeys
 */
export function trimNodeType(state, map, type, maxCount, protectedKeys, reachableKeys) {
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
    state._setNodeType(node, 'fight');
    overflow -= 1;
  });
}

/**
 * @param {(MapNode | null)[][]} map
 * @returns {Array<{ x: number, y: number }>}
 */
export function getReachableCoordinates(map) {
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
 * @param {{
 *   _rollNodeWeather: (nodeType: MapNodeType) => import('../data/weather.js').WeatherId,
 *   rollEventNodeOutcome: () => 'event' | 'fight' | 'shop'
 * }} state
 * @param {MapNode | null} node
 * @param {MapNodeType} type
 */
export function setNodeType(state, node, type) {
  if (!node) return;
  const meta = {
    fight: { label: 'Bitka', emoji: '⚔️' },
    elite: { label: 'Elita', emoji: '🗡️' },
    shop: { label: 'Jarmark', emoji: '🛖' },
    treasure: { label: 'Skarb', emoji: '🎁' },
    event: { label: 'Wydarzenie', emoji: '❓' },
    campfire: { label: 'Watra', emoji: '🔥' },
    boss: { label: 'Herszt', emoji: '👑' },
    maryna: { label: 'Maryna', emoji: '👵' },
  };
  node.type = type;
  node.label = meta[type].label;
  node.emoji = meta[type].emoji;
  node.weather = state._rollNodeWeather(type);
  if (type === 'event') {
    node.eventOutcome = state.rollEventNodeOutcome();
  } else {
    delete node.eventOutcome;
  }
}

/**
 * @param {number} x
 * @returns {number[]}
 */
export function getAdjacentColumns(x) {
  return [x - 1, x, x + 1].filter((candidate) => candidate >= 0 && candidate <= 2);
}

/**
 * @param {{ _getAdjacentColumns: (x: number) => number[] }} state
 * @param {number} x
 * @returns {number}
 */
export function pickNextColumn(state, x) {
  const options = state._getAdjacentColumns(x);
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * @param {MapNode | null} node
 * @param {number} targetX
 */
export function linkNode(node, targetX) {
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
export function hasInbound(map, y, x) {
  if (y === 0) return true;
  return map[y - 1].some((node) => node?.connections.includes(x));
}

/**
 * @param {{
 *   guaranteedTreasureRow: number | null,
 *   guaranteedTreasureColumn: number,
 *   _hasInbound: (map: (MapNode | null)[][], y: number, x: number) => boolean
 * }} state
 * @param {(MapNode | null)[][]} map
 */
export function pruneUnreachableNodes(state, map) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 1; y <= map.length - 3; y++) {
      for (let x = 0; x < 3; x++) {
        const node = map[y][x];
        if (!node) continue;
        if (y === state.guaranteedTreasureRow && x === state.guaranteedTreasureColumn) continue;
        if (!state._hasInbound(map, y, x)) {
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
