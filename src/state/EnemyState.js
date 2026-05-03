import { enemyLibrary } from '../data/enemies.js';
import { defaultStatus } from './StatusEffects.js';

/** @param {any} state @param {string} kind @param {Record<string, unknown>} payload */
function emitS(state, kind, payload) {
  state.emit(kind, payload);
}

/** @param {any} state @param {string} kind @param {Record<string, unknown>} payload */
function emitF(state, kind, payload) {
  if (state._eventVerbosity === 'full') state.emit(kind, payload);
}

/**
 * @typedef {import('../data/cards.js').StatusDef} StatusDef
 * @typedef {import('../data/enemies.js').EnemyMoveDef} EnemyMoveDef
 * @typedef {{ name: string, hp: number, maxHp: number, block: number, energy: number, maxEnergy: number, status: StatusDef, stunned: boolean, cardsPlayedThisTurn: number }} PlayerState
 * @typedef {{ id: string, name: string, emoji: string, hp: number, maxHp: number, block: number, nextAttack: number, baseAttack: number, status: StatusDef, rachunek: number, ped: number, spriteSvg: string, phase2SpriteSvg?: string, patternType: 'random'|'loop'|'weather_loop', pattern: EnemyMoveDef[], phaseTwoPattern: EnemyMoveDef[], weatherPatterns?: Record<string, EnemyMoveDef[]>, patternIndex: number, harnasWeatherPatternIndex: number, currentIntent: EnemyMoveDef, tookHpDamageThisTurn: boolean, bossArtifact?: number, passive: string | null, isElite: boolean, isBoss: boolean, stunnedTurns: number, lichwaTriggeredThisTurn: boolean, hartDuchaTriggered: boolean, portraitShameTurns: number, phaseTwoTriggered: boolean, evasionCharges: number, isBankrupt?: boolean }} EnemyState
 */

/**
 * @param {{ enemyBankruptFlag: boolean, enemyBankruptcyPending: boolean, _isEnemyBankruptcyConditionMet: () => boolean }} state
 */
export function checkEnemyBankruptcy(state) {
  if (state.enemyBankruptFlag) {
    state.enemyBankruptcyPending = false;
    return;
  }
  state.enemyBankruptcyPending = state._isEnemyBankruptcyConditionMet();
}

/**
 * @param {{ enemy: EnemyState }} state
 * @returns {boolean}
 */
export function isEnemyBankruptcyConditionMet(state) {
  if (state.enemy.passive === 'targowanie_sie') return false;
  if (state.enemy.rachunek <= 0) return false;
  return state.enemy.rachunek >= state.enemy.hp;
}

/**
 * @param {{ _checkEnemyBankruptcy: () => void, enemyBankruptcyPending: boolean, enemyBankrupt: () => void }} state
 * @returns {boolean}
 */
export function resolveEnemyBankruptcyAtTurnStart(state) {
  state._checkEnemyBankruptcy();
  if (!state.enemyBankruptcyPending) return false;
  state.enemyBankrupt();
  state.enemyBankruptcyPending = false;
  return true;
}

/**
 * @param {{ enemyBankruptFlag: boolean, enemy: EnemyState, enemyBankruptcyBonus: number, addDutki: (amount: number) => void, getDutkiLabel: (amount: number) => string, lastVictoryMessage: string, enemyBankruptcyPending: boolean }} state
 */
export function enemyBankrupt(state) {
  if (state.enemyBankruptFlag) return;
  state.enemyBankruptFlag = true;
  state.enemy.hp = 0;
  state.enemy.isBankrupt = true;
  const bonus = Math.min(25, Math.floor(state.enemy.rachunek / 3));
  state.enemyBankruptcyBonus = bonus;
  if (bonus > 0) {
    state.addDutki(bonus);
    state.lastVictoryMessage = `Wróg zbankrutował! +${bonus} ${state.getDutkiLabel(bonus)}`;
  } else {
    state.lastVictoryMessage = 'Wróg zbankrutował!';
  }
  state.enemyBankruptcyPending = false;
  // bankructwo_z_bonusem: bonus heal + Dutki on bankruptcy
  if (state.hasRelic('bankructwo_z_bonusem')) {
    state.healPlayer(6);
    state.addDutki(20);
  }
}

/**
 * @param {{ enemy: EnemyState, rachunekResistEvent: boolean, _checkEnemyBankruptcy: () => void, hasRelic: (relicId: string) => boolean, player: PlayerState }} state
 * @param {number} amount
 */
export function addEnemyRachunek(state, amount) {
  if (amount <= 0) return;
  if (state.enemy.passive === 'targowanie_sie') {
    state.rachunekResistEvent = true;
    state.enemy.rachunek = 0;
    state._checkEnemyBankruptcy();
    return;
  }
  let appliedAmount = amount;
  if (state.enemy.id === 'fiakier') {
    appliedAmount = Math.max(1, Math.floor(amount * 0.7));
  }
  state.enemy.rachunek += appliedAmount;
  if (state.hasRelic('pekniete_liczydlo')) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
  }
  state._checkEnemyBankruptcy();
}

/**
 * @param {{ enemy: EnemyState, _checkEnemyBankruptcy: () => void }} state
 * @param {'weak' | 'fragile'} key
 * @param {number} amount
 */
export function applyEnemyDebuff(state, key, amount) {
  if (amount <= 0) return;
  if (state.enemy.id === 'boss' && (state.enemy.bossArtifact ?? 0) > 0) {
    state.enemy.bossArtifact -= 1;
    return;
  }
  state.enemy.status[key] += amount;
  emitF(state, 'status_applied', {
    target: 'enemy',
    enemy: { kind: 'enemy', id: state.enemy.id },
    status: key,
    amount,
  });
  state._checkEnemyBankruptcy();
}

/**
 * @param {{
 *   enemyScaleFactor: number,
 *   difficulty: 'normal' | 'hard',
 *   hasRelic: (relicId: string) => boolean,
 *   _buildEnemyIntent: (enemyState: EnemyState) => EnemyMoveDef
 * }} state
 * @param {import('../data/enemies.js').EnemyDef} enemyDef
 * @returns {EnemyState}
 */
export function createEnemyState(state, enemyDef) {
  const isFinalBossVariant =
    enemyDef.id === 'boss' ||
    enemyDef.id === 'fiakier' ||
    enemyDef.id === 'krolowa_schroniska' ||
    enemyDef.id === 'harnas_pogodynka';
  const isMainBoss = enemyDef.id === 'boss';
  const scale = isFinalBossVariant ? 1 : state.enemyScaleFactor;
  const eliteDamageScale = enemyDef.elite ? 1.15 : 1;
  const pattern = enemyDef.pattern
    ? enemyDef.pattern.map((move) => {
        if (move.type !== 'attack') return { ...move };
        return { ...move, damage: Math.round(move.damage * scale * eliteDamageScale) };
      })
    : [];
  const phaseTwoPattern = enemyDef.phaseTwoPattern
    ? enemyDef.phaseTwoPattern.map((move) => {
        if (move.type !== 'attack') return { ...move };
        return { ...move, damage: Math.round(move.damage * scale * eliteDamageScale) };
      })
    : [];
  const bossBaseHp = 330;
  const baseMaxHp = state.difficulty === 'hard' && isFinalBossVariant ? bossBaseHp : enemyDef.maxHp;
  const dzwonekMod = state.hasRelic('dzwonek_owcy') ? 0.85 : 1.0;
  const eliteHpScale = enemyDef.elite ? 1.25 : 1;
  const maxHp = Math.round(baseMaxHp * scale * dzwonekMod * eliteHpScale);
  /** @type {EnemyState} */
  const builtEnemyState = {
    id: enemyDef.id,
    name: enemyDef.name,
    emoji: enemyDef.emoji,
    hp: maxHp,
    maxHp,
    block: enemyDef.block,
    nextAttack: 0,
    baseAttack: Math.round((enemyDef.baseAttack ?? 0) * scale * eliteDamageScale),
    status: defaultStatus(),
    rachunek: 0,
    ped: 0,
    spriteSvg: enemyDef.spriteSvg,
    phase2SpriteSvg: enemyDef.phase2SpriteSvg,
    patternType: enemyDef.patternType,
    pattern,
    phaseTwoPattern,
    weatherPatterns: enemyDef.weatherPatterns ?? {},
    patternIndex: 0,
    currentIntent: { type: 'attack', name: 'Atak', damage: 0, hits: 1 },
    tookHpDamageThisTurn: false,
    bossArtifact: isMainBoss ? 2 : 0,
    passive: enemyDef.passive ?? null,
    isElite: Boolean(enemyDef.elite),
    isBoss: Boolean(enemyDef.isBoss) || isFinalBossVariant,
    stunnedTurns: 0,
    lichwaTriggeredThisTurn: false,
    hartDuchaTriggered: false,
    drugiOddechTriggered: false,
    gazDoDechyStacks: 0,
    naporWodyPressure: 0,
    kolejkaCounter: 0,
    harnasWeatherPatternIndex: 0,
    portraitShameTurns: 0,
    phaseTwoTriggered: false,
    evasionCharges: 0,
    stolenCards: [],
  };
  builtEnemyState.currentIntent = state._buildEnemyIntent(builtEnemyState);
  builtEnemyState.nextAttack =
    builtEnemyState.currentIntent.type === 'attack' ? builtEnemyState.currentIntent.damage : 0;
  return builtEnemyState;
}

/**
 * @param {{ lastRegularEnemyId: string | null }} state
 * @param {boolean} [isElite=false]
 * @returns {import('../data/enemies.js').EnemyDef}
 */
export function pickRandomEnemyDef(state, isElite = false) {
  const filterKind = isElite ? 'enemy_elite' : 'enemy_regular';
  const currentAct = state.currentAct ?? 1;
  let enemyIds = Object.keys(enemyLibrary).filter(
    (id) =>
      id !== 'boss' &&
      id !== 'fiakier' &&
      id !== 'pomocnik_fiakra' &&
      !enemyLibrary[id]?.eventOnly &&
      !enemyLibrary[id]?.tutorialOnly &&
      !enemyLibrary[id]?.isBoss
  );

  enemyIds = enemyIds.filter((id) => Boolean(enemyLibrary[id]?.elite) === isElite);
  // filter by act: enemies without act field default to act 1
  enemyIds = enemyIds.filter((id) => (enemyLibrary[id]?.act ?? 1) === currentAct);
  enemyIds = state.filterPool(filterKind, enemyIds);

  if (enemyIds.length === 0) {
    enemyIds = Object.keys(enemyLibrary).filter(
      (id) =>
        id !== 'boss' &&
        id !== 'fiakier' &&
        id !== 'pomocnik_fiakra' &&
        !enemyLibrary[id]?.eventOnly &&
        !enemyLibrary[id]?.tutorialOnly &&
        !enemyLibrary[id]?.isBoss &&
        Boolean(enemyLibrary[id]?.elite) !== isElite &&
        (enemyLibrary[id]?.act ?? 1) === currentAct
    );
  }

  if (!isElite && state.lastRegularEnemyId && enemyIds.length > 1) {
    enemyIds = enemyIds.filter((id) => id !== state.lastRegularEnemyId);
  }

  const enemyId = enemyIds[Math.floor(state.rng() * enemyIds.length)];
  if (!isElite) {
    state.lastRegularEnemyId = enemyId;
  }
  return enemyLibrary[enemyId];
}

/**
 * @param {{ filterPool: (kind: string, ids: string[]) => string[] }} state
 * @returns {import('../data/enemies.js').EnemyDef}
 */
export function pickFinalBossDef(state) {
  const currentAct = state.currentAct ?? 1;
  const act1BossPool = ['boss', 'fiakier'];
  const act2BossPool = ['krolowa_schroniska', 'harnas_pogodynka'];
  const pool = currentAct === 2 ? act2BossPool : act1BossPool;
  const bossIds = state.filterPool('enemy_boss', pool);
  const fallback = currentAct === 2 ? 'krolowa_schroniska' : 'boss';
  const bossId = bossIds[Math.floor(state.rng() * bossIds.length)] ?? fallback;
  return enemyLibrary[bossId];
}

/**
 * @param {{ enemy: EnemyState }} state
 * @param {EnemyState} [enemyState=state.enemy]
 * @returns {number}
 */
export function rollEnemyAttack(state, enemyState = state.enemy) {
  return Math.max(1, enemyState.baseAttack - 3 + Math.floor(state.rng() * 6));
}

/**
 * @param {{ _rollEnemyAttack: (enemyState?: EnemyState) => number }} state
 * @param {EnemyState} enemyState
 * @returns {EnemyMoveDef}
 */
export function buildEnemyIntent(state, enemyState) {
  if (enemyState.patternType === 'weather_loop') {
    const wp = enemyState.weatherPatterns ?? {};
    const weather = state.currentWeather ?? 'clear';
    const activePattern = wp[weather] && wp[weather].length > 0 ? wp[weather] : (wp['clear'] ?? []);
    const move = activePattern[enemyState.harnasWeatherPatternIndex % activePattern.length];
    return { ...move };
  }

  if (enemyState.patternType === 'loop') {
    const activePattern =
      enemyState.phaseTwoTriggered && enemyState.phaseTwoPattern.length > 0
        ? enemyState.phaseTwoPattern
        : enemyState.pattern;
    const move = activePattern[enemyState.patternIndex % activePattern.length];
    return { ...move };
  }

  return {
    type: 'attack',
    name: 'Pstryka fotkę',
    damage: state._rollEnemyAttack(enemyState),
    hits: 1,
  };
}

/**
 * @param {{ enemy: EnemyState, _buildEnemyIntent: (enemyState: EnemyState) => EnemyMoveDef }} state
 */
export function refreshEnemyIntent(state) {
  state.enemy.currentIntent = state._buildEnemyIntent(state.enemy);
  state.enemy.nextAttack =
    state.enemy.currentIntent.type === 'attack' ? state.enemy.currentIntent.damage : 0;
}

/**
 * @param {{ enemy: EnemyState, enemyPhaseTransitionMessage: string | null, _refreshEnemyIntent: () => void }} state
 */
export function handleEnemyPhaseTransitions(state) {
  if (state.enemy.id !== 'naganiacze_duo') return;
  if (state.enemy.phaseTwoTriggered) return;
  if (state.enemy.hp > 40 || state.enemy.hp <= 0) return;

  state.enemy.phaseTwoTriggered = true;
  state.enemy.patternIndex = 0;
  state.enemy.status.weak = 0;
  state.enemy.status.fragile = 0;
  state.enemy.status.vulnerable = 0;
  state.enemy.status.strength += 2;
  state.enemy.block += 8;
  if (state.enemy.phase2SpriteSvg) {
    state.enemy.spriteSvg = state.enemy.phase2SpriteSvg;
  }
  state.enemyPhaseTransitionMessage = 'Seba ucieka! Mati wpada w furię!';
  emitS(state, 'phase_transition', { enemy: { kind: 'enemy', id: state.enemy.id }, phase: 2 });
  state._refreshEnemyIntent();
}

/**
 * @param {{ enemy: EnemyState }} state
 * @param {'weak' | 'vulnerable' | 'fragile' | 'stun'} status
 * @param {number} amount
 */
export function applyEnemyDebugStatus(state, status, amount) {
  const value = Math.max(0, Math.floor(amount));
  if (value <= 0) return;
  if (status === 'stun') {
    state.enemy.stunnedTurns += value;
    return;
  }
  state.enemy.status[status] += value;
}
