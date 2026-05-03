/**
 * Text projection of Observation → human-readable string for LLM agents.
 *
 * @typedef {'pl' | 'en' | 'compact'} RenderStyle
 */

/**
 * @typedef {import('../Observation.js').Observation} Observation
 * @typedef {import('../Observation.js').CardView} CardView
 */

// ─── Label tables ────────────────────────────────────────────────────────────

const LABELS = {
  pl: {
    battle: '## BITKA',
    map: '## MAPA',
    reward: '## NAGRODA',
    shop: '## JARMARK',
    campfire: '## OGNISKO',
    event: '## WYDARZENIE',
    maryna: '## MARYNA',
    terminal: '## KONIEC',
    hand: '## RĘKA',
    legal: '## AKCJE',
    player: 'Góral',
    enemy: 'Ceper',
    hp: 'Krzepa',
    block: 'Garda',
    energy: 'Oscypki',
    dutki: 'Dutki',
    floor: 'Piętro',
    act: 'Akt',
    deck: 'talia',
    discard: 'odrzucone',
    exhaust: 'zniszczone',
    stunned: 'OGŁUSZONY',
    intent: 'zamiar',
    weather: 'pogoda',
    skip: 'Pomiń nagrody',
    rest: 'Odpocząć (+30% Krzepy)',
    leave: 'Odejść',
    upgrade: 'Ulepszyć',
    status: {
      strength: 'Siła',
      weak: 'Słabość',
      fragile: 'Kruchość',
      vulnerable: 'Podatność',
      next_double: 'Podwójny cios',
      energy_next_turn: 'Bonus Oscypek',
      lans: 'Lans',
      duma_podhala: 'Duma Podhala',
      furia_turysty: 'Furia Turysty',
    },
    win: 'Zwycięstwo',
    loss: 'Porażka',
    outcome: 'Wynik',
    relics: 'Pamiątki',
    boon: 'Błogosławieństwo',
  },
  en: {
    battle: '## WALKA',
    map: '## MAPA',
    reward: '## NAGRODA',
    shop: '## SKLEP',
    campfire: '## WATRA',
    event: '## WYDARZENIE',
    maryna: '## MARYNA',
    terminal: '## TERMINAL',
    hand: '## RĘKA',
    legal: '## DOZWOLONE',
    player: 'Gracz',
    enemy: 'Wróg',
    hp: 'Krzepa',
    block: 'Garda',
    energy: 'Oscypki',
    dutki: 'Dutki',
    floor: 'Piętro',
    act: 'Akt',
    deck: 'talia',
    discard: 'odrzut',
    exhaust: 'przepad',
    stunned: 'OGŁUSZONY',
    intent: 'zamiarem',
    weather: 'pogoda',
    skip: 'Pomiń nagrody',
    rest: 'Odpocznij (+30% Krzepy)',
    leave: 'Wyjdź',
    upgrade: 'Ulepsz',
    status: {
      strength: 'Siła',
      weak: 'Słabość',
      fragile: 'Kruchość',
      vulnerable: 'Podatność',
      next_double: 'Następny Podwójny',
      energy_next_turn: 'Bonus Energii',
      lans: 'Lans',
      duma_podhala: 'Duma Podhala',
      furia_turysty: 'Furia Turysty',
    },
    win: 'Zwycięstwo',
    loss: 'Porażka',
    outcome: 'Wynik',
    relics: 'Pamiątki',
    boon: 'Dar',
  },
  compact: {
    battle: '## WALKA',
    map: '## MAPA',
    reward: '## NAGRODA',
    shop: '## SKLEP',
    campfire: '## WATRA',
    event: '## WYDARZENIE',
    maryna: '## MARYNA',
    terminal: '## TERMINAL',
    hand: '## RĘKA',
    legal: '## DOZWOLONE',
    player: 'P',
    enemy: 'E',
    hp: 'hp',
    block: 'blk',
    energy: 'en',
    dutki: 'dk',
    floor: 'fl',
    act: 'act',
    deck: 'dk',
    discard: 'dc',
    exhaust: 'ex',
    stunned: 'STN',
    intent: 'int',
    weather: 'wx',
    skip: 'skip',
    rest: 'rest',
    leave: 'leave',
    upgrade: 'upg',
    status: {
      strength: 'str',
      weak: 'wk',
      fragile: 'fr',
      vulnerable: 'vul',
      next_double: 'x2',
      energy_next_turn: 'en+',
      lans: 'lns',
      duma_podhala: 'dum',
      furia_turysty: 'fur',
    },
    win: 'WIN',
    loss: 'LOSS',
    outcome: 'out',
    relics: 'rel',
    boon: 'boon',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * @param {Record<string, number>} status
 * @param {Record<string, string>} statusLabels
 * @returns {string}
 */
function renderStatus(status, statusLabels) {
  const parts = [];
  for (const [key, val] of Object.entries(status)) {
    if (!val) continue;
    const label = statusLabels[key] ?? key;
    if (val === true) {
      parts.push(label);
    } else {
      parts.push(`${label}:${val}`);
    }
  }
  return parts.join(' ');
}

/**
 * @param {object} player
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderPlayer(player, L, compact) {
  const statusStr = renderStatus(player.status ?? {}, L.status);
  const stunnedStr = player.stunned ? ` [${L.stunned}]` : '';
  if (compact) {
    const base = `${L.player} ${L.hp}:${player.hp}/${player.maxHp} ${L.block}:${player.block} ${L.energy}:${player.energy}/${player.maxEnergy}`;
    const extra = [statusStr, stunnedStr.trim()].filter(Boolean).join(' ');
    return extra ? `${base} ${extra}` : base;
  }
  const base = `${L.player}: ${L.hp} ${player.hp}/${player.maxHp} | ${L.block} ${player.block} | ${L.energy} ${player.energy}/${player.maxEnergy}`;
  const extras = [statusStr, stunnedStr.trim()].filter(Boolean).join(' ');
  return extras ? `${base} | ${extras}` : base;
}

/**
 * @param {object} enemy
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderEnemy(enemy, L, compact) {
  const statusStr = renderStatus(enemy.status ?? {}, L.status);
  const intentStr = enemy.intent?.text
    ? `${L.intent}: ${enemy.intent.text}`
    : enemy.intent?.type
      ? `${L.intent}: ${enemy.intent.type}`
      : '';
  if (compact) {
    const base = `${L.enemy}(${enemy.name}) ${L.hp}:${enemy.hp}/${enemy.maxHp} ${L.block}:${enemy.block}`;
    const extra = [statusStr, intentStr].filter(Boolean).join(' ');
    return extra ? `${base} ${extra}` : base;
  }
  const base = `${L.enemy}: ${enemy.name} | ${L.hp} ${enemy.hp}/${enemy.maxHp} | ${L.block} ${enemy.block}`;
  const extras = [statusStr, intentStr].filter(Boolean).join(' ');
  return extras ? `${base} | ${extras}` : base;
}

/**
 * @param {CardView[]} hand
 * @param {object} L
 * @param {boolean} compact
 * @returns {string[]}
 */
function renderHand(hand, L, compact) {
  return hand.map((card, i) => {
    const idx = i + 1;
    const costStr = card.effectiveCost !== card.cost ? `${card.effectiveCost}*` : String(card.cost);
    if (compact) {
      return `${idx}.${card.name}(${costStr})`;
    }
    const exhaust = card.exhaust ? ' [exhaust]' : '';
    return `  ${idx}. [${costStr}] ${card.name}${exhaust} — ${card.desc}`;
  });
}

/**
 * Build the legal actions block as numbered lines.
 * @param {import('../LegalActions.js').Action[]} actions
 * @param {CardView[]} hand
 * @param {object} L
 * @param {boolean} compact
 * @returns {string[]}
 */
function renderLegalActions(actions, hand, L, compact) {
  return actions.map((a, i) => {
    const n = i + 1;
    const desc = describeAction(a, hand, L);
    if (compact) return `${n}.${desc}`;
    return `  ${n}. ${desc}`;
  });
}

/**
 * @param {import('../LegalActions.js').Action} action
 * @param {CardView[]} hand
 * @param {object} L
 * @returns {string}
 */
function describeAction(action, hand, L) {
  switch (action.type) {
    case 'play_card': {
      const card = action.handIndex != null ? hand[action.handIndex] : null;
      return card
        ? `play_card #${action.handIndex + 1} "${card.name}"`
        : `play_card #${action.handIndex + 1}`;
    }
    case 'end_turn':
      return 'end_turn';
    case 'travel':
      return `travel floor:${action.level} node:${action.nodeIndex}`;
    case 'reward_pick_card':
      return action.cardId
        ? `reward_pick_card "${action.cardId}"`
        : `reward_pick_card null (${L.skip})`;
    case 'reward_pick_relic':
      return `reward_pick_relic "${action.relicId}"`;
    case 'shop_buy_card':
      return `shop_buy_card "${action.cardId}"`;
    case 'shop_buy_relic':
      return `shop_buy_relic "${action.relicId}"`;
    case 'shop_remove_card':
      return `shop_remove_card "${action.cardId}"`;
    case 'shop_leave':
      return 'shop_leave';
    case 'campfire':
      if (action.option === 'rest') return `campfire rest`;
      if (action.option === 'leave') return `campfire leave`;
      return `campfire upgrade "${action.cardId}"`;
    case 'event_choice':
      return `event_choice ${action.choiceIndex}`;
    case 'maryna_pick':
      return `maryna_pick "${action.boonId}"`;
    case 'smycz_toggle':
      return action.handIndex != null
        ? `smycz_toggle #${action.handIndex + 1}`
        : 'smycz_toggle clear';
    default:
      return JSON.stringify(action);
  }
}

// ─── Screen renderers ────────────────────────────────────────────────────────

/**
 * @param {Observation} obs
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderBattle(obs, L, compact) {
  const lines = [L.battle];

  // Context line
  const ctx = compact
    ? `${L.floor}:${obs.floor} ${L.act}:${obs.act} ${L.weather}:${obs.weather?.name ?? ''}`
    : `${L.floor}: ${obs.floor} | ${L.act}: ${obs.act} | ${L.weather}: ${obs.weather?.name ?? ''}`;
  lines.push(ctx);

  lines.push(renderPlayer(obs.player, L, compact));

  if (obs.enemy) {
    lines.push(renderEnemy(obs.enemy, L, compact));
  }

  // Pile counts
  const piles = compact
    ? `${L.deck}:${obs.deckCount} ${L.discard}:${obs.discardCount} ${L.exhaust}:${obs.exhaustCount}`
    : `${L.deck}: ${obs.deckCount} | ${L.discard}: ${obs.discardCount} | ${L.exhaust}: ${obs.exhaustCount}`;
  lines.push(piles);

  lines.push('');
  lines.push(L.hand);
  if (compact) {
    lines.push(renderHand(obs.hand, L, compact).join(' '));
  } else {
    lines.push(...renderHand(obs.hand, L, compact));
  }

  lines.push('');
  lines.push(L.legal);
  if (compact) {
    lines.push(renderLegalActions(obs.legalActions, obs.hand, L, compact).join(' '));
  } else {
    lines.push(...renderLegalActions(obs.legalActions, obs.hand, L, compact));
  }

  return lines.join('\n');
}

/**
 * @param {Observation} obs
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderMap(obs, L, compact) {
  const lines = [L.map];

  const ctx = compact
    ? `${L.floor}:${obs.floor} ${L.act}:${obs.act} ${L.dutki}:${obs.run.dutki}`
    : `${L.floor}: ${obs.floor} | ${L.act}: ${obs.act} | ${L.dutki}: ${obs.run.dutki}`;
  lines.push(ctx);

  if (obs.map) {
    const { currentLevel, totalLevels, currentNode } = obs.map;
    const nodeType = currentNode?.type ?? '?';
    if (compact) {
      lines.push(`node:${nodeType} lvl:${currentLevel}/${totalLevels}`);
    } else {
      lines.push(`Current node: ${nodeType} (level ${currentLevel}/${totalLevels})`);
    }
  }

  if (obs.run.relics?.length) {
    const relicStr = obs.run.relics.join(', ');
    lines.push(compact ? `${L.relics}:${relicStr}` : `${L.relics}: ${relicStr}`);
  }

  lines.push('');
  lines.push(L.legal);
  if (compact) {
    lines.push(renderLegalActions(obs.legalActions, obs.hand, L, compact).join(' '));
  } else {
    lines.push(...renderLegalActions(obs.legalActions, obs.hand, L, compact));
  }

  return lines.join('\n');
}

/**
 * @param {Observation} obs
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderReward(obs, L, compact) {
  const lines = [L.reward];

  if (obs.rewardOffer) {
    const cards = obs.rewardOffer.cards ?? [];
    const relicId = obs.rewardOffer.relicId ?? null;

    if (!compact) {
      if (cards.length) lines.push(`Cards: ${cards.join(', ')}`);
      if (relicId) lines.push(`Relic: ${relicId}`);
    } else {
      const parts = [];
      if (cards.length) parts.push(`cards:${cards.join(',')}`);
      if (relicId) parts.push(`relic:${relicId}`);
      lines.push(parts.join(' '));
    }
  }

  lines.push('');
  lines.push(L.legal);
  if (compact) {
    lines.push(renderLegalActions(obs.legalActions, obs.hand, L, compact).join(' '));
  } else {
    lines.push(...renderLegalActions(obs.legalActions, obs.hand, L, compact));
  }

  return lines.join('\n');
}

/**
 * @param {Observation} obs
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderShop(obs, L, compact) {
  const lines = [L.shop];

  const dutki = compact ? `${L.dutki}:${obs.run.dutki}` : `${L.dutki}: ${obs.run.dutki}`;
  lines.push(dutki);

  if (obs.shopStock) {
    const cards = obs.shopStock.cards ?? [];
    const relic = obs.shopStock.relic ?? null;
    if (!compact) {
      if (cards.length) lines.push(`Cards: ${cards.join(', ')}`);
      if (relic) lines.push(`Relic: ${relic}`);
    } else {
      const parts = [];
      if (cards.length) parts.push(`cards:${cards.join(',')}`);
      if (relic) parts.push(`relic:${relic}`);
      lines.push(parts.join(' '));
    }
  }

  lines.push('');
  lines.push(L.legal);
  if (compact) {
    lines.push(renderLegalActions(obs.legalActions, obs.hand, L, compact).join(' '));
  } else {
    lines.push(...renderLegalActions(obs.legalActions, obs.hand, L, compact));
  }

  return lines.join('\n');
}

/**
 * @param {Observation} obs
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderCampfire(obs, L, compact) {
  const lines = [L.campfire];

  if (obs.campfire) {
    const upgradeable = obs.campfire.upgradeable ?? [];
    if (!compact) {
      if (upgradeable.length) lines.push(`Upgradeable: ${upgradeable.join(', ')}`);
    } else {
      if (upgradeable.length) lines.push(`upg:${upgradeable.join(',')}`);
    }
  }

  lines.push('');
  lines.push(L.legal);
  if (compact) {
    lines.push(renderLegalActions(obs.legalActions, obs.hand, L, compact).join(' '));
  } else {
    lines.push(...renderLegalActions(obs.legalActions, obs.hand, L, compact));
  }

  return lines.join('\n');
}

/**
 * @param {Observation} obs
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderEvent(obs, L, compact) {
  const lines = [L.event];

  if (obs.activeEvent) {
    const ev = obs.activeEvent;
    if (!compact) {
      lines.push(`${ev.name}`);
      if (ev.description) lines.push(ev.description);
      (ev.choices ?? []).forEach((c, i) => {
        lines.push(`  ${i}. ${c.text}`);
      });
    } else {
      lines.push(`${ev.name}`);
      (ev.choices ?? []).forEach((c, i) => {
        lines.push(`${i}.${c.text}`);
      });
    }
  }

  lines.push('');
  lines.push(L.legal);
  if (compact) {
    lines.push(renderLegalActions(obs.legalActions, obs.hand, L, compact).join(' '));
  } else {
    lines.push(...renderLegalActions(obs.legalActions, obs.hand, L, compact));
  }

  return lines.join('\n');
}

/**
 * @param {Observation} obs
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderMaryna(obs, L, compact) {
  const lines = [L.maryna];

  if (obs.marynaOffer?.length) {
    if (!compact) {
      lines.push(`Choose a ${L.boon}:`);
      obs.marynaOffer.forEach((id) => lines.push(`  - ${id}`));
    } else {
      lines.push(`${L.boon}:${obs.marynaOffer.join(',')}`);
    }
  }

  lines.push('');
  lines.push(L.legal);
  if (compact) {
    lines.push(renderLegalActions(obs.legalActions, obs.hand, L, compact).join(' '));
  } else {
    lines.push(...renderLegalActions(obs.legalActions, obs.hand, L, compact));
  }

  return lines.join('\n');
}

/**
 * @param {Observation} obs
 * @param {object} L
 * @param {boolean} compact
 * @returns {string}
 */
function renderTerminal(obs, L, compact) {
  const lines = [L.terminal];

  const outcome = obs.outcome ?? 'unknown';
  const outcomeLabel = outcome === 'win' ? L.win : outcome === 'loss' ? L.loss : outcome;

  if (compact) {
    lines.push(`${L.outcome}:${outcomeLabel}`);
  } else {
    lines.push(`${L.outcome}: ${outcomeLabel}`);
  }

  return lines.join('\n');
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Render an Observation to a human-readable string for LLM agents.
 *
 * @param {Observation} observation
 * @param {RenderStyle} [style]
 * @returns {string}
 */
export function renderObservation(observation, style = 'pl') {
  const L = LABELS[style] ?? LABELS.pl;
  const compact = style === 'compact';

  if (observation.done) {
    return renderTerminal(observation, L, compact);
  }

  switch (observation.phase) {
    case 'battle':
      return renderBattle(observation, L, compact);
    case 'map':
      return renderMap(observation, L, compact);
    default:
      break;
  }

  // Non-battle, non-map screens are determined by what's active
  if (observation.rewardOffer) return renderReward(observation, L, compact);
  if (observation.shopStock != null) return renderShop(observation, L, compact);
  if (observation.campfire != null) return renderCampfire(observation, L, compact);
  if (observation.activeEvent != null) return renderEvent(observation, L, compact);
  if (observation.marynaOffer?.length) return renderMaryna(observation, L, compact);

  // Fallback: map screen without map data
  return renderMap(observation, L, compact);
}
