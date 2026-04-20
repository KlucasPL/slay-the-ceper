/**
 * @typedef {'fight' | 'elite' | 'shop' | 'treasure' | 'event' | 'campfire' | 'boss' | 'maryna'} MapNodeType
 * @typedef {{ x: number, y: number, type: MapNodeType, label: string, emoji: string, weather: import('../data/weather.js').WeatherId, connections: number[] }} MapNode
 */

/**
 * @param {MapNodeType} type
 * @returns {{ label: string, emoji: string }}
 */
export function getMapNodeMeta(type) {
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
  return meta[type] ?? { label: 'Pole', emoji: '•' };
}

/**
 * @param {{ getCurrentMapNode: () => MapNode | null }} state
 * @returns {number[]}
 */
export function getReachableNodes(state) {
  const node = state.getCurrentMapNode();
  return node ? [...node.connections] : [];
}

/**
 * @param {{ hasStartedFirstBattle: boolean, currentLevel: number, map: (MapNode | null)[][], getCurrentMapNode: () => MapNode | null }} state
 * @param {number} level
 * @param {number} nodeIndex
 * @returns {boolean}
 */
export function canTravelTo(state, level, nodeIndex) {
  if (!state.hasStartedFirstBattle) {
    console.warn('[NAV] canTravelTo: Denied - First battle not started.');
    return false;
  }
  if (level !== state.currentLevel + 1) {
    console.warn(
      `[NAV] canTravelTo: Denied - Wrong level. Target: ${level}, Current: ${state.currentLevel}`
    );
    return false;
  }
  const nextLevel = state.map[level];
  if (!nextLevel || !nextLevel[nodeIndex]) {
    console.warn(`[NAV] canTravelTo: Denied - No such node at L:${level} I:${nodeIndex}`);
    return false;
  }
  const currentNode = state.getCurrentMapNode();
  if (!currentNode) {
    console.warn('[NAV] canTravelTo: Denied - No current node.');
    return false;
  }
  const isConnected = currentNode.connections.includes(nodeIndex);
  if (!isConnected)
    console.warn(`[NAV] canTravelTo: Denied - Node ${nodeIndex} not connected to current node.`);
  return isConnected;
}

/**
 * @param {{
 *   canTravelTo: (level: number, nodeIndex: number) => boolean,
 *   currentLevel: number,
 *   currentNodeIndex: number,
 *   currentNode: { x: number, y: number },
 *   maxFloorReached: number,
 *   debugForcedNextNodeType: MapNodeType | null,
 *   _setNodeType: (node: MapNode | null, type: MapNodeType) => void,
 *   getCurrentMapNode: () => MapNode | null
 * }} state
 * @param {number} level
 * @param {number} nodeIndex
 * @returns {MapNode | null}
 */
export function travelTo(state, level, nodeIndex) {
  if (!state.canTravelTo(level, nodeIndex)) {
    return null;
  }
  state.currentLevel = level;
  state.currentNodeIndex = nodeIndex;
  state.currentNode = { x: nodeIndex, y: level };
  state.maxFloorReached = Math.max(state.maxFloorReached, level + 1);
  const node = state.getCurrentMapNode();
  if (node && state.debugForcedNextNodeType && node.type !== 'boss' && node.type !== 'campfire') {
    state._setNodeType(node, state.debugForcedNextNodeType);
    state.debugForcedNextNodeType = null;
  }
  return node;
}

/**
 * @param {{ map: (MapNode | null)[][], currentLevel: number, currentNodeIndex: number }} state
 * @returns {MapNode | null}
 */
export function getCurrentMapNode(state) {
  return state.map[state.currentLevel]?.[state.currentNodeIndex] ?? null;
}

/**
 * @param {{ map: (MapNode | null)[][], currentLevel: number }} state
 * @returns {'I' | 'II' | 'III'}
 */
export function getCurrentAct(state) {
  const rows = Math.max(1, state.map.length);
  const ratio = state.currentLevel / rows;
  if (ratio < 1 / 3) return 'I';
  if (ratio < 2 / 3) return 'II';
  return 'III';
}

/**
 * @param {{
 *   jumpToBoss: boolean,
 *   map: (MapNode | null)[][],
 *   currentLevel: number,
 *   currentNodeIndex: number,
 *   currentNode: { x: number, y: number },
 *   maxFloorReached: number,
 *   hasStartedFirstBattle: boolean,
 *   _setCurrentWeatherFromNode: () => void
 * }} state
 * @returns {boolean}
 */
export function applyJumpToBossShortcut(state) {
  if (!state.jumpToBoss) return false;
  const campfireLevel = state.map.length - 2;
  const campfireNode = state.map[campfireLevel]?.[1];
  if (!campfireNode) return false;

  state.currentLevel = campfireLevel;
  state.currentNodeIndex = 1;
  state.currentNode = { x: 1, y: campfireLevel };
  state.maxFloorReached = Math.max(state.maxFloorReached, campfireLevel + 1);
  state.jumpToBoss = false;
  state.hasStartedFirstBattle = true;
  state._setCurrentWeatherFromNode();
  return true;
}

/**
 * @param {{ getCurrentMapNode: () => MapNode | null, currentWeather: import('../data/weather.js').WeatherId }} state
 */
export function setCurrentWeatherFromNode(state) {
  const node = state.getCurrentMapNode();
  state.currentWeather = node?.weather ?? 'clear';
}
