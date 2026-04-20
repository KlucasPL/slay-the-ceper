/**
 * HeuristicBot — greedy policy bot for balance sims.
 * Pure function: same observation → same action. No hidden state.
 *
 * Dependency note: imports cardLibrary from src/data/ directly (same as src/engine/ does).
 * Never touches src/state/ or src/ui/.
 */

import { cardLibrary } from '../../data/cards.js';
import { HEURISTIC_WEIGHTS as W } from './HeuristicBot.constants.js';

/**
 * @typedef {import('../../engine/Observation.js').Observation} Observation
 * @typedef {import('../../engine/Observation.js').CardView} CardView
 * @typedef {import('../../engine/ActionDispatcher.js').Action} Action
 */

/**
 * @param {Observation} observation
 * @returns {Action}
 */
export function HeuristicBot(observation) {
  const { legalActions } = observation;
  if (legalActions.length === 0) throw new Error('HeuristicBot: no legal actions');
  if (legalActions.length === 1) return legalActions[0];

  switch (observation.phase) {
    case 'battle':
      return _pickBattle(observation);
    case 'map':
      return _pickMap(observation);
    default:
      return _pickMeta(observation);
  }
}

// ---------------------------------------------------------------------------
// Battle phase
// ---------------------------------------------------------------------------

/** @param {Observation} obs @returns {Action} */
function _pickBattle(obs) {
  const { player, enemy, hand, legalActions } = obs;

  let bestAction = /** @type {Action} */ ({ type: 'end_turn' });
  let bestScore = _endTurnScore(obs);

  for (const action of legalActions) {
    if (action.type !== 'play_card') continue;
    const card = hand[action.handIndex];
    if (!card || card.unplayable) continue;

    const score = _scoreCard(card, player, enemy);
    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  return bestAction;
}

/**
 * @param {CardView} card
 * @param {Observation['player']} player
 * @param {Observation['enemy']} enemy
 * @returns {number}
 */
function _scoreCard(card, player, enemy) {
  if (!enemy) return 0;
  // 0-cost cards are strictly cheaper than 1-cost cards with identical effect;
  // clamping to 0.5 (not 1) gives them the 2x valuation they deserve without
  // dividing by zero.
  const energy = Math.max(card.effectiveCost, 0.5);
  const hpRatio = player.hp / player.maxHp;
  const incoming = enemy.intent?.expectedDamageToPlayer ?? 0;
  const lethalThreat = incoming > 0 && incoming >= player.hp;
  const twoTurnThreat = incoming * 2 > player.hp + player.block + 5;
  const panic = lethalThreat || twoTurnThreat || hpRatio < W.blockUrgency.panicThreshold;

  const lansMult = _lansScoreMultiplier(card, player);
  const lansInactive = card.tags?.includes('lans') && lansMult === 0;
  const rachunekValue = _estimateRachunekValue(card, enemy);
  const rachunekLethal = rachunekValue > 0 && enemy.rachunek + rachunekValue >= enemy.hp;

  let score = 0;

  if (card.type === 'attack') {
    const dmg = _estimateDamage(card, player, enemy);
    const lethal = dmg >= enemy.hp + enemy.block;
    score = lansMult * (dmg / energy) * W.cardScore.damagePerEnergy;
    if (lethal && !lansInactive) score += W.cardScore.lethalBonus;
  } else if (card.type === 'skill') {
    const block = _estimateBlock(card);
    const draw = _estimateDraw(card);
    const status = _estimateStatus(card);
    const blockMult = panic
      ? W.cardScore.blockPerEnergy * (1 + W.blockUrgency.hpDiscount)
      : W.cardScore.blockPerEnergy;
    score =
      lansMult *
      ((block / energy) * blockMult +
        (draw / energy) * W.cardScore.drawPerEnergy +
        (status / energy) * W.cardScore.statusPerEnergy);
    if (lethalThreat && block > 0 && player.block + block > incoming - player.hp && !lansInactive) {
      score += W.cardScore.lethalBonus;
    }
  } else if (card.type === 'power') {
    const status = _estimateStatus(card);
    score = lansMult * (Math.max(status, 4) / energy) * W.cardScore.statusPerEnergy;
  }

  if (rachunekValue > 0) {
    score += (rachunekValue / energy) * W.cardScore.rachunekPerEnergy;
    if (rachunekLethal) score += W.cardScore.lethalBonus;
  }

  if (lansInactive) {
    score += W.cardScore.lansActivationValue / energy;
  }

  if (card.exhaust) score -= W.cardScore.exhaustPenalty;
  return score;
}

/** @param {CardView} card @param {Observation['enemy']} enemy @returns {number} */
function _estimateRachunekValue(card, enemy) {
  if (!enemy || enemy.rachunekImmune) return 0;
  if (!card.tags?.includes('rachunek')) return 0;
  const desc = card.desc ?? '';
  const addMatch = desc.match(/Dodaj[ea]\s+(\d+)\s+do\s+Rachunk/i);
  if (!addMatch) return 0;
  const added = Number(addMatch[1]);
  const gap = Math.max(0, enemy.hp - enemy.rachunek);
  return Math.min(added, gap);
}

/** @param {CardView} card @param {Observation['player']} player @returns {number} */
function _lansScoreMultiplier(card, player) {
  if (!card.tags?.includes('lans')) return 1;
  return (player.status?.lans ?? 0) > 0 ? 1 : 0;
}

/** @param {CardView} card @param {Observation['player']} player @param {Observation['enemy']} enemy @returns {number} */
function _estimateDamage(card, player, enemy) {
  const nums = (card.desc ?? '').match(/\d+/g);
  const base = nums ? Math.max(...nums.map(Number)) : 5;
  const strength = player.status?.strength ?? 0;
  let dmg = base + strength;
  if ((player.status?.weak ?? 0) > 0) dmg = Math.floor(dmg * 0.75);
  if ((enemy?.status?.vulnerable ?? 0) > 0) dmg = Math.floor(dmg * 1.5);
  return Math.max(dmg, 1);
}

/** @param {CardView} card @returns {number} */
function _estimateBlock(card) {
  const desc = card.desc ?? '';
  if (!desc.includes('Gard')) return 0;
  const nums = desc.match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : 5;
}

/** @param {CardView} card @returns {number} */
function _estimateDraw(card) {
  const desc = card.desc ?? '';
  if (!desc.toLowerCase().includes('dobierz')) return 0;
  const nums = desc.match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : 1;
}

/** @param {CardView} card @returns {number} */
function _estimateStatus(card) {
  const desc = card.desc ?? '';
  let v = 0;
  if (desc.includes('Słab')) v += W.statusValue.weak;
  if (desc.includes('Kruch')) v += W.statusValue.fragile;
  if (desc.includes('Podatn')) v += W.statusValue.vulnerable;
  if (desc.includes('Sił')) v += W.statusValue.strength;
  if (desc.includes('podwójne') || desc.includes('Podwójne')) v += W.statusValue.nextDouble;
  if (desc.includes('Lans')) v += W.statusValue.lans;
  if (desc.includes('Duma')) v += W.statusValue.dumaPodhala;
  if (desc.includes('Furia')) v += W.statusValue.furiaTurysty;
  return v;
}

/** @param {Observation} obs @returns {number} */
function _endTurnScore(obs) {
  const { player, enemy } = obs;
  if (!enemy) return 0;
  const incoming = enemy.intent?.expectedDamageToPlayer ?? 0;
  // intent damage is already block-subtracted, so incoming >= hp = death this turn
  if (incoming > 0 && incoming >= player.hp) return -W.cardScore.lethalBonus;
  return W.endTurn.minPositiveScore * (player.hp / player.maxHp);
}

// ---------------------------------------------------------------------------
// Map phase
// ---------------------------------------------------------------------------

/** @param {Observation} obs @returns {Action} */
function _pickMap(obs) {
  const { player, legalActions } = obs;
  const hpRatio = player.hp / player.maxHp;
  const dutki = obs.run?.dutki ?? 0;

  let best = legalActions[0];
  let bestScore = -Infinity;

  for (const action of legalActions) {
    if (action.type !== 'travel') continue;
    // Without node-type in the travel action we score generically;
    // node type info isn't in summary-mode observation travel actions.
    const score = _mapScore('fight', hpRatio, dutki);
    if (score > bestScore) {
      bestScore = score;
      best = action;
    }
  }

  return best;
}

/**
 * @param {string} nodeType
 * @param {number} hpRatio
 * @param {number} dutki
 * @returns {number}
 */
function _mapScore(nodeType, hpRatio, dutki) {
  const m = W.mapScore;
  switch (nodeType) {
    case 'campfire':
      return hpRatio < W.blockUrgency.panicThreshold ? m.campfireLowHp : 5;
    case 'shop':
      return dutki >= 80 ? m.shopIfAffordable : 3;
    case 'treasure':
      return m.treasure;
    case 'event':
      return m.event;
    case 'elite':
      return hpRatio > 0.6 ? m.eliteHealthyHp : m.elitePenaltyLowHp;
    case 'boss':
      return 0;
    default:
      return m.fight;
  }
}

// ---------------------------------------------------------------------------
// Meta phases: reward, shop, campfire, event, maryna
// ---------------------------------------------------------------------------

/** @param {Observation} obs @returns {Action} */
function _pickMeta(obs) {
  const { legalActions } = obs;

  if (legalActions.some((a) => a.type === 'reward_pick_card' || a.type === 'reward_pick_relic')) {
    return _pickReward(obs);
  }
  if (legalActions.some((a) => a.type === 'shop_leave')) {
    return _pickShop(obs);
  }
  if (legalActions.some((a) => a.type === 'campfire')) {
    return _pickCampfire(obs);
  }
  if (legalActions.some((a) => a.type === 'event_choice')) {
    return legalActions.find((a) => a.type === 'event_choice') ?? legalActions[0];
  }
  if (legalActions.some((a) => a.type === 'maryna_pick')) {
    return legalActions.find((a) => a.type === 'maryna_pick') ?? legalActions[0];
  }
  return legalActions[0];
}

/** @param {Observation} obs @returns {Action} */
function _pickReward(obs) {
  const { legalActions, run } = obs;
  const deckSize = run?.acquired?.cards?.length ?? 10;
  const skipAction = legalActions.find((a) => a.type === 'reward_pick_card' && a.cardId === null);
  const skipThreshold = deckSize >= W.reward.targetDeckSize ? 0.5 : -0.1;

  let best = skipAction ?? legalActions[0];
  let bestScore = skipThreshold;

  for (const action of legalActions) {
    if (action.type === 'reward_pick_card' && action.cardId) {
      const score = _rewardCardScore(action.cardId, deckSize);
      if (score > bestScore) {
        bestScore = score;
        best = action;
      }
    }
    if (action.type === 'reward_pick_relic') {
      const score = 10;
      if (score > bestScore) {
        bestScore = score;
        best = action;
      }
    }
  }

  return best;
}

/**
 * @param {string} cardId
 * @param {number} deckSize
 * @returns {number}
 */
function _rewardCardScore(cardId, deckSize) {
  const sizePenalty = Math.max(0, deckSize - W.reward.targetDeckSize) * 0.5;
  const def = cardLibrary[cardId];
  const rarityBonus =
    def?.rarity === 'rare'
      ? W.reward.rareMultiplier * 3
      : def?.rarity === 'uncommon'
        ? W.reward.rareMultiplier
        : 1;
  return rarityBonus - sizePenalty;
}

/** @param {Observation} obs @returns {Action} */
function _pickShop(obs) {
  const { legalActions, run } = obs;
  const dutki = run?.dutki ?? 0;
  const deckSize = run?.acquired?.cards?.length ?? 10;
  const leaveAction = legalActions.find((a) => a.type === 'shop_leave') ?? legalActions[0];

  // Removal is high value when deck is bloated
  if (deckSize > W.reward.shopRemovalStarterThreshold && dutki >= 75) {
    const remove = legalActions.find((a) => a.type === 'shop_remove_card');
    if (remove) return remove;
  }

  let best = leaveAction;
  let bestScore = 0;

  for (const action of legalActions) {
    if (action.type === 'shop_buy_card') {
      const score = _rewardCardScore(action.cardId, deckSize) * W.reward.shopRelicRatio;
      if (score > bestScore) {
        bestScore = score;
        best = action;
      }
    }
    if (action.type === 'shop_buy_relic') {
      const score = 8;
      if (score > bestScore) {
        bestScore = score;
        best = action;
      }
    }
  }

  return best;
}

/** @param {Observation} obs @returns {Action} */
function _pickCampfire(obs) {
  const { legalActions, player } = obs;
  const hpRatio = player.hp / player.maxHp;

  if (hpRatio < W.blockUrgency.panicThreshold) {
    const rest = legalActions.find((a) => a.type === 'campfire' && a.option === 'rest');
    if (rest) return rest;
  }

  const upgrade = legalActions.find((a) => a.type === 'campfire' && a.option === 'upgrade');
  if (upgrade) return upgrade;

  return (
    legalActions.find((a) => a.type === 'campfire' && a.option === 'rest') ??
    legalActions.find((a) => a.type === 'campfire' && a.option === 'leave') ??
    legalActions[0]
  );
}
