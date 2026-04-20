/**
 * HeuristicBase — shared scoring engine for all heuristic-family bots.
 *
 * `makeHeuristicBot(weights)` returns a pure `(observation) => Action` function.
 * Override only the weight groups you want to diverge from the baseline.
 */

import { cardLibrary } from '../../data/cards.js';
import { HEURISTIC_WEIGHTS } from './HeuristicBot.constants.js';

/**
 * @typedef {import('../../engine/Observation.js').Observation} Observation
 * @typedef {import('../../engine/Observation.js').CardView} CardView
 * @typedef {import('../../engine/ActionDispatcher.js').Action} Action
 * @typedef {typeof HEURISTIC_WEIGHTS} Weights
 */

/**
 * Deep-merge override weights on top of the baseline HEURISTIC_WEIGHTS.
 * Only provided keys are overridden — unspecified groups stay at baseline.
 * @param {Partial<Weights>} overrides
 * @returns {Weights}
 */
function _mergeWeights(overrides) {
  /** @type {Weights} */
  const merged = {
    statusValue: { ...HEURISTIC_WEIGHTS.statusValue, ...overrides.statusValue },
    blockUrgency: { ...HEURISTIC_WEIGHTS.blockUrgency, ...overrides.blockUrgency },
    cardScore: { ...HEURISTIC_WEIGHTS.cardScore, ...overrides.cardScore },
    mapScore: { ...HEURISTIC_WEIGHTS.mapScore, ...overrides.mapScore },
    reward: { ...HEURISTIC_WEIGHTS.reward, ...overrides.reward },
    endTurn: { ...HEURISTIC_WEIGHTS.endTurn, ...overrides.endTurn },
  };
  return merged;
}

/**
 * Create a heuristic bot with custom weights.
 * @param {Partial<Weights>} [overrides]
 * @returns {(observation: Observation) => Action}
 */
export function makeHeuristicBot(overrides = {}) {
  const W = _mergeWeights(overrides);

  // ── Battle scoring ────────────────────────────────────────────────────────

  /** @param {CardView} card @param {Observation['player']} player @param {Observation['enemy']} enemy @returns {number} */
  function estimateDamage(card, player, enemy) {
    const nums = (card.desc ?? '').match(/\d+/g);
    const base = nums ? Math.max(...nums.map(Number)) : 5;
    const strength = player.status?.strength ?? 0;
    let dmg = base + strength;
    if ((player.status?.weak ?? 0) > 0) dmg = Math.floor(dmg * 0.75);
    if ((enemy?.status?.vulnerable ?? 0) > 0) dmg = Math.floor(dmg * 1.5);
    return Math.max(dmg, 1);
  }

  /**
   * Rachunek-tagged cards either add to or scale with the enemy's bankruptcy
   * counter. Additive cards close the gap toward `enemy.hp` (bankruptcy win);
   * we score the min of the added amount and the remaining gap so the card
   * stops being worth much past the threshold. Cards that don't actually add
   * rachunek (synergy-only) return 0 here — their bonus damage is already
   * captured by estimateDamage via the desc regex.
   * @param {CardView} card @param {Observation['enemy']} enemy @returns {number}
   */
  function estimateRachunekValue(card, enemy) {
    if (!enemy || enemy.rachunekImmune) return 0;
    if (!card.tags?.includes('rachunek')) return 0;
    const desc = card.desc ?? '';
    // Match "Dodaje X do Rachunku" pattern; non-additive synergy cards score 0.
    const addMatch = desc.match(/Dodaj[ea]\s+(\d+)\s+do\s+Rachunk/i);
    if (!addMatch) return 0;
    const added = Number(addMatch[1]);
    const gap = Math.max(0, enemy.hp - enemy.rachunek);
    return Math.min(added, gap);
  }

  /**
   * Lans-tagged cards only fire their listed effect once Lans is active. The
   * very first lans play merely activates the status, so a bot that never
   * plays the setup never gets the payoff. We pay `lansActivationValue`
   * for the activation spend and the full score afterwards.
   * @param {CardView} card @param {Observation['player']} player @returns {number}
   */
  function lansScoreMultiplier(card, player) {
    if (!card.tags?.includes('lans')) return 1;
    const active = (player.status?.lans ?? 0) > 0;
    return active ? 1 : 0;
  }

  /** @param {CardView} card @returns {number} */
  function estimateBlock(card) {
    const desc = card.desc ?? '';
    if (!desc.includes('Gard')) return 0;
    const nums = desc.match(/\d+/g);
    return nums ? Math.max(...nums.map(Number)) : 5;
  }

  /** @param {CardView} card @returns {number} */
  function estimateDraw(card) {
    const desc = card.desc ?? '';
    if (!desc.toLowerCase().includes('dobierz')) return 0;
    const nums = desc.match(/\d+/g);
    return nums ? Math.max(...nums.map(Number)) : 1;
  }

  /** @param {CardView} card @returns {number} */
  function estimateStatus(card) {
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

  /**
   * @param {CardView} card
   * @param {Observation['player']} player
   * @param {Observation['enemy']} enemy
   * @returns {number}
   */
  function scoreCard(card, player, enemy) {
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

    // Lans cards need one setup play before their effect fires; multiplier is 0
    // when lans is inactive so we only count the activation-value line below.
    const lansMult = lansScoreMultiplier(card, player);
    const lansInactive = card.tags?.includes('lans') && lansMult === 0;
    const rachunekValue = estimateRachunekValue(card, enemy);
    const rachunekLethal = rachunekValue > 0 && enemy.rachunek + rachunekValue >= enemy.hp;

    let score = 0;

    if (card.type === 'attack') {
      const dmg = estimateDamage(card, player, enemy);
      const lethal = dmg >= enemy.hp + enemy.block;
      score = lansMult * (dmg / energy) * W.cardScore.damagePerEnergy;
      if (lethal && !lansInactive) score += W.cardScore.lethalBonus;
    } else if (card.type === 'skill') {
      const block = estimateBlock(card);
      const draw = estimateDraw(card);
      const status = estimateStatus(card);
      const blockMult = panic
        ? W.cardScore.blockPerEnergy * (1 + W.blockUrgency.hpDiscount)
        : W.cardScore.blockPerEnergy;
      score =
        lansMult *
        ((block / energy) * blockMult +
          (draw / energy) * W.cardScore.drawPerEnergy +
          (status / energy) * W.cardScore.statusPerEnergy);
      // Glass-cannon archetypes (blockPerEnergy = 0) opt out of self-preservation;
      // for everyone else, a card that survives lethal damage gets the same
      // weight as a finishing attack — saving HP is strictly more valuable.
      if (
        lethalThreat &&
        block > 0 &&
        W.cardScore.blockPerEnergy > 0 &&
        player.block + block > incoming - player.hp &&
        !lansInactive
      ) {
        score += W.cardScore.lethalBonus;
      }
    } else if (card.type === 'power') {
      const status = estimateStatus(card);
      score = lansMult * (Math.max(status, 4) / energy) * W.cardScore.statusPerEnergy;
    }

    // Rachunek contribution is independent of card.type and lans gating (most
    // rachunek cards are attacks that don't rely on lans). Lethal via rachunek
    // is identical to lethal via damage.
    if (rachunekValue > 0) {
      score += (rachunekValue / energy) * W.cardScore.rachunekPerEnergy;
      if (rachunekLethal) score += W.cardScore.lethalBonus;
    }

    // Bootstrap play: if the card is lans-tagged and lans is off, we still
    // want to play it so the setup fires. Pay a fixed activation value rather
    // than 0 to keep lans archetypes off-the-ground.
    if (lansInactive) {
      score += W.cardScore.lansActivationValue / energy;
    }

    if (card.exhaust) score -= W.cardScore.exhaustPenalty;
    return score;
  }

  /** @param {Observation} obs @returns {number} */
  function endTurnScore(obs) {
    const { player, enemy } = obs;
    if (!enemy) return 0;
    const incoming = enemy.intent?.expectedDamageToPlayer ?? 0;
    if (incoming > 0 && incoming >= player.hp) return -W.cardScore.lethalBonus;
    return W.endTurn.minPositiveScore * (player.hp / player.maxHp);
  }

  // ── Battle pick ───────────────────────────────────────────────────────────

  /** @param {Observation} obs @returns {Action} */
  function pickBattle(obs) {
    const { player, enemy, hand, legalActions } = obs;

    let bestAction = /** @type {Action} */ ({ type: 'end_turn' });
    let bestScore = endTurnScore(obs);

    for (const action of legalActions) {
      if (action.type !== 'play_card') continue;
      const card = hand[action.handIndex];
      if (!card || card.unplayable) continue;

      const score = scoreCard(card, player, enemy);
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    return bestAction;
  }

  // ── Map pick ──────────────────────────────────────────────────────────────

  /** @param {string} nodeType @param {number} hpRatio @param {number} dutki @returns {number} */
  function mapScore(nodeType, hpRatio, dutki) {
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

  /** @param {Observation} obs @returns {Action} */
  function pickMap(obs) {
    const { player, legalActions } = obs;
    const hpRatio = player.hp / player.maxHp;
    const dutki = obs.run?.dutki ?? 0;

    let best = legalActions[0];
    let bestScore = -Infinity;

    for (const action of legalActions) {
      if (action.type !== 'travel') continue;
      const score = mapScore('fight', hpRatio, dutki);
      if (score > bestScore) {
        bestScore = score;
        best = action;
      }
    }

    return best;
  }

  // ── Meta pick (reward / shop / campfire / event / maryna) ────────────────

  /** @param {string} cardId @param {number} deckSize @returns {number} */
  function rewardCardScore(cardId, deckSize) {
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
  function pickReward(obs) {
    const { legalActions, run } = obs;
    const deckSize = run?.acquired?.cards?.length ?? 10;
    const skipAction = legalActions.find((a) => a.type === 'reward_pick_card' && a.cardId === null);
    const skipThreshold = deckSize >= W.reward.targetDeckSize ? 0.5 : -0.1;

    let best = skipAction ?? legalActions[0];
    let bestScore = skipThreshold;

    for (const action of legalActions) {
      if (action.type === 'reward_pick_card' && action.cardId) {
        const score = rewardCardScore(action.cardId, deckSize);
        if (score > bestScore) {
          bestScore = score;
          best = action;
        }
      }
      if (action.type === 'reward_pick_relic') {
        if (10 > bestScore) {
          bestScore = 10;
          best = action;
        }
      }
    }

    return best;
  }

  /** @param {Observation} obs @returns {Action} */
  function pickShop(obs) {
    const { legalActions, run } = obs;
    const dutki = run?.dutki ?? 0;
    const deckSize = run?.acquired?.cards?.length ?? 10;
    const leaveAction = legalActions.find((a) => a.type === 'shop_leave') ?? legalActions[0];

    if (deckSize > W.reward.shopRemovalStarterThreshold && dutki >= 75) {
      const remove = legalActions.find((a) => a.type === 'shop_remove_card');
      if (remove) return remove;
    }

    let best = leaveAction;
    let bestScore = 0;

    for (const action of legalActions) {
      if (action.type === 'shop_buy_card') {
        const score = rewardCardScore(action.cardId, deckSize) * W.reward.shopRelicRatio;
        if (score > bestScore) {
          bestScore = score;
          best = action;
        }
      }
      if (action.type === 'shop_buy_relic') {
        if (8 > bestScore) {
          bestScore = 8;
          best = action;
        }
      }
    }

    return best;
  }

  /** @param {Observation} obs @returns {Action} */
  function pickCampfire(obs) {
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

  /** @param {Observation} obs @returns {Action} */
  function pickMeta(obs) {
    const { legalActions } = obs;

    if (legalActions.some((a) => a.type === 'reward_pick_card' || a.type === 'reward_pick_relic')) {
      return pickReward(obs);
    }
    if (legalActions.some((a) => a.type === 'shop_leave')) {
      return pickShop(obs);
    }
    if (legalActions.some((a) => a.type === 'campfire')) {
      return pickCampfire(obs);
    }
    if (legalActions.some((a) => a.type === 'event_choice')) {
      return legalActions.find((a) => a.type === 'event_choice') ?? legalActions[0];
    }
    if (legalActions.some((a) => a.type === 'maryna_pick')) {
      return legalActions.find((a) => a.type === 'maryna_pick') ?? legalActions[0];
    }
    return legalActions[0];
  }

  // ── Public bot function ───────────────────────────────────────────────────

  /** @param {Observation} observation @returns {Action} */
  return function heuristicBot(observation) {
    const { legalActions } = observation;
    if (legalActions.length === 0) throw new Error('HeuristicBot: no legal actions');
    if (legalActions.length === 1) return legalActions[0];

    switch (observation.phase) {
      case 'battle':
        return pickBattle(observation);
      case 'map':
        return pickMap(observation);
      default:
        return pickMeta(observation);
    }
  };
}
