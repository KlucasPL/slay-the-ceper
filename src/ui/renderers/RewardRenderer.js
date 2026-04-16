import { cardLibrary } from '../../data/cards.js';
import { relicLibrary } from '../../data/relics.js';
import * as uiHelpers from '../helpers/UIHelpers.js';
import * as cardRenderer from './CardRenderer.js';

/**
 * @param {any} uiManager
 * @param {string} relicId
 * @param {number} droppedDutki
 */
export function showScriptedEventBattleRewards(uiManager, relicId, droppedDutki) {
  const choices = uiManager._pickRewardCards(3);
  uiManager.pendingBattleRelicClaimAction = () => {
    showCardRewardScreen(uiManager, droppedDutki, choices, false);
  };
  showRelicScreen(uiManager, relicId, 'battle');
  document.getElementById('end-turn-btn').disabled = true;
}

/**
 * @param {any} uiManager
 * @param {number} droppedDutki
 * @param {boolean} [isBossFight=false]
 */
export function showVictoryOverlay(uiManager, droppedDutki, isBossFight = false) {
  const relicScreen = document.getElementById('relic-reward-screen');
  const choices = uiManager._pickRewardCards(3);
  const relicChoice = uiManager._pickRewardRelic(isBossFight);

  const goToCardPhase = () => {
    showCardRewardScreen(uiManager, droppedDutki, choices, isBossFight);
  };

  if (relicChoice) {
    uiManager.pendingBattleRelicClaimAction = goToCardPhase;
    showRelicScreen(uiManager, relicChoice, 'battle');
  } else {
    uiManager.pendingBattleRelicClaimAction = null;
    relicScreen.classList.add('hidden');
    relicScreen.setAttribute('aria-hidden', 'true');
    goToCardPhase();
  }

  document.getElementById('end-turn-btn').disabled = true;
}

/**
 * @param {any} uiManager
 * @param {string} relicId
 * @param {'battle' | 'treasure'} source
 */
export function showRelicScreen(uiManager, relicId, source) {
  const relic = relicLibrary[relicId];
  if (!relic) return;

  const relicScreen = document.getElementById('relic-reward-screen');
  const cardScreen = document.getElementById('card-reward-screen');
  const titleEl = relicScreen?.querySelector('.victory-title');
  const glowWrap = relicScreen?.querySelector('.relic-glow-wrap');
  const rewardRelic = document.getElementById('reward-relic');
  const rewardRelicName = document.getElementById('reward-relic-name');
  const rewardRelicDesc = document.getElementById('reward-relic-desc');
  const claimBtn = document.getElementById('claim-relic-btn');
  if (
    !relicScreen ||
    !cardScreen ||
    !titleEl ||
    !glowWrap ||
    !rewardRelic ||
    !rewardRelicName ||
    !rewardRelicDesc ||
    !claimBtn
  ) {
    return;
  }

  glowWrap.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare');
  glowWrap.classList.add(uiHelpers.rarityClass(relic.rarity));

  titleEl.textContent = source === 'treasure' ? 'Znalazłeś Skarb!' : 'Łup z wroga!';
  rewardRelic.textContent = relic.emoji;
  rewardRelicName.textContent = relic.name;
  rewardRelicDesc.textContent = relic.desc;

  claimBtn.onclick = () => {
    uiManager.state.addRelic(relicId);
    relicScreen.classList.add('hidden');
    relicScreen.setAttribute('aria-hidden', 'true');

    if (source === 'battle') {
      const goToCardPhase = uiManager.pendingBattleRelicClaimAction;
      uiManager.pendingBattleRelicClaimAction = null;
      if (goToCardPhase) {
        goToCardPhase();
      }
    } else {
      uiManager.pendingBattleRelicClaimAction = null;
      uiManager.state.currentScreen = 'map';
      uiManager._openMapOverlay();
    }

    uiManager.updateUI();
  };

  uiHelpers.hideOverlay('map-overlay');
  cardScreen.classList.add('hidden');
  cardScreen.setAttribute('aria-hidden', 'true');
  relicScreen.classList.remove('hidden');
  relicScreen.setAttribute('aria-hidden', 'false');
}

/**
 * @param {any} uiManager
 * @param {number} droppedDutki
 * @param {string[]} choices
 * @param {boolean} [isBossFight=false]
 * @param {{ title?: string, allowSkip?: boolean }} [options={}]
 */
export function showCardRewardScreen(
  uiManager,
  droppedDutki,
  choices,
  isBossFight = false,
  options = {}
) {
  const { title = 'Cepr usieczony! Wybierz łup:', allowSkip = true } = options;
  const cardScreen = document.getElementById('card-reward-screen');
  const titleEl = cardScreen?.querySelector('.victory-title');
  const rewardDutki = document.getElementById('victory-dutki');
  const rewardCards = document.getElementById('reward-cards');
  const skipBtn = document.getElementById('reward-skip-btn');
  if (titleEl) {
    titleEl.textContent = title;
  }

  const lines = [];
  if (uiManager.state.lastVictoryMessage) {
    lines.push(uiManager.state.lastVictoryMessage);
  }
  if (droppedDutki > 0) {
    lines.push(`Łup z bitki: +${droppedDutki} ${uiManager.state.getDutkiLabel(droppedDutki)}`);
  }
  rewardDutki.textContent = lines.join(' | ');
  rewardCards.innerHTML = '';

  choices.forEach((cardId) => {
    const card = cardLibrary[cardId];
    const cardDesc = cardRenderer.getCardDescription(uiManager, card);
    const cardEl = document.createElement('button');
    cardEl.type = 'button';
    cardEl.className = `reward-card ${uiHelpers.rarityClass(card.rarity)}`;
    cardEl.innerHTML = `
        <div class="reward-cost">${card.cost} Osc.</div>
        <div class="reward-emoji">${card.emoji}</div>
        <div class="reward-name">${card.name}</div>
        <div class="reward-rarity">${uiHelpers.getFullCardType(card.rarity, card.type)}</div>
        <div class="reward-desc">${cardDesc}</div>
      `;
    if (card.exhaust) {
      cardEl.classList.add('card-exhaust');
      cardEl.prepend(cardRenderer.createExhaustBadge());
    }
    cardEl.addEventListener('click', () => {
      uiManager.state.deck.push(cardId);
      closeRewardScreens(uiManager, isBossFight);
    });
    rewardCards.appendChild(cardEl);
  });

  if (allowSkip) {
    skipBtn.classList.remove('hidden');
    skipBtn.onclick = () => closeRewardScreens(uiManager, isBossFight);
  } else {
    skipBtn.classList.add('hidden');
    skipBtn.onclick = null;
  }

  cardScreen.classList.remove('hidden');
  cardScreen.setAttribute('aria-hidden', 'false');
}

/**
 * @param {any} uiManager
 * @param {boolean} [isBossFight=false]
 */
export function closeRewardScreens(uiManager, isBossFight = false) {
  const relicScreen = document.getElementById('relic-reward-screen');
  const cardScreen = document.getElementById('card-reward-screen');
  const skipBtn = document.getElementById('reward-skip-btn');

  relicScreen.classList.add('hidden');
  relicScreen.setAttribute('aria-hidden', 'true');
  cardScreen.classList.add('hidden');
  cardScreen.setAttribute('aria-hidden', 'true');
  const cardTitle = cardScreen.querySelector('.victory-title');
  if (cardTitle) {
    cardTitle.textContent = 'Cepr usieczony! Wybierz łup:';
  }
  if (skipBtn) {
    skipBtn.classList.remove('hidden');
  }

  if (uiManager.isTutorialMode) {
    uiManager.tutorialStepIndex = 8;
    uiManager.isTutorialGuidanceActive = true;
    uiManager._setTutorialMiniMap();
    uiManager._openMapOverlay();
    uiManager.updateUI();
    requestAnimationFrame(() => uiManager._renderTutorialOverlay());
    return;
  }

  if (isBossFight) {
    uiManager.state.captureRunSummary('player_win');
    showRunSummaryOverlay(uiManager);
    return;
  }

  uiManager._openMapOverlay();
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 */
export function showRunSummaryOverlay(uiManager) {
  const overlay = document.getElementById('run-summary-overlay');
  const title = document.getElementById('run-summary-title');
  const killer = document.getElementById('run-summary-killer');
  const killerLine = document.getElementById('run-summary-killer-line');
  const floor = document.getElementById('run-summary-floor');
  const dutki = document.getElementById('run-summary-dutki');
  const turns = document.getElementById('run-summary-turns');
  const relics = document.getElementById('run-summary-relics');
  const deck = document.getElementById('run-summary-deck');
  if (
    !overlay ||
    !title ||
    !killer ||
    !killerLine ||
    !floor ||
    !dutki ||
    !turns ||
    !relics ||
    !deck
  ) {
    return;
  }

  const summary = uiManager.state.runSummary;
  if (!summary) return;

  const isVictory = summary.outcome === 'player_win';
  title.textContent = isVictory ? '🏔️ ZWYCIĘSTWO!' : '💀 KONIEC PRZYGODY';

  if (summary.killerName) {
    killer.classList.remove('hidden');
    killerLine.textContent = `Zgładzony przez: ${summary.killerName}`;
  } else {
    killer.classList.add('hidden');
    killerLine.textContent = '';
  }

  floor.textContent = String(summary.runStats.floorReached);
  dutki.textContent = String(summary.runStats.totalDutkiEarned);
  turns.textContent = String(summary.runStats.totalTurnsPlayed);

  relics.innerHTML = '';
  summary.finalRelics.forEach((relic, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `relic-chip run-summary-relic ${uiHelpers.rarityClass(relic.rarity)}`;
    chip.textContent = relic.emoji;
    chip.title = `${relic.name}: ${relic.desc}`;
    chip.style.animationDelay = `${index * 60}ms`;
    const tip = document.createElement('span');
    tip.className = 'relic-tooltip';
    tip.textContent = `${relic.name}: ${relic.desc}`;
    chip.appendChild(tip);
    relics.appendChild(chip);
  });

  deck.innerHTML = '';
  /** @type {Map<string, { card: import('../../data/cards.js').CardDef, count: number }>} */
  const grouped = new Map();
  summary.finalDeck.forEach((card) => {
    const existing = grouped.get(card.id);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(card.id, { card, count: 1 });
    }
  });

  [...grouped.values()].forEach(({ card, count }, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = `run-summary-card ${uiHelpers.rarityClass(card.rarity)}`;
    cardEl.style.animationDelay = `${index * 40}ms`;
    cardEl.innerHTML = `
        <div class="run-summary-card-head">
          <span class="run-summary-card-emoji">${card.emoji}</span>
          <span class="run-summary-card-name">${card.name}</span>
          <span class="run-summary-card-count">x${count}</span>
        </div>
        <div class="run-summary-card-desc">${card.desc}</div>
      `;
    deck.appendChild(cardEl);
  });

  uiHelpers.hideOverlay('relic-reward-screen');
  uiHelpers.hideOverlay('card-reward-screen');
  uiHelpers.hideOverlay('map-overlay');
  uiHelpers.hideOverlay('shop-overlay');
  uiHelpers.hideOverlay('campfire-overlay');
  uiHelpers.hideOverlay('random-event-overlay');

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  uiManager.state.currentScreen = 'event';
  uiManager.updateUI();
}

/**
 * @param {any} uiManager
 * @param {number} droppedDutki
 */
export function showEliteRewardOverlay(uiManager, droppedDutki) {
  const eliteCardChoices = uiManager._pickRareRewardCards(3);
  const hasThreeRareChoices = eliteCardChoices.length >= 3;
  const cardChoices = hasThreeRareChoices ? eliteCardChoices : uiManager._pickRewardCards(3);
  const cardTitle = hasThreeRareChoices
    ? 'Elita pokonana! Wybierz kartę rare:'
    : 'Elita pokonana! Wybierz kartę:';
  const goToCardPhase = () => {
    showCardRewardScreen(uiManager, droppedDutki, cardChoices, false, {
      title: cardTitle,
      allowSkip: false,
    });
    document.getElementById('end-turn-btn').disabled = true;
  };

  const relicChoices = uiManager._pickEliteRewardRelics(3);
  if (relicChoices.length < 3) {
    goToCardPhase();
    return;
  }

  const cardScreen = document.getElementById('card-reward-screen');
  const rewardDutki = document.getElementById('victory-dutki');
  const rewardCards = document.getElementById('reward-cards');
  const skipBtn = document.getElementById('reward-skip-btn');
  const titleEl = cardScreen?.querySelector('.victory-title');
  if (!cardScreen || !rewardDutki || !rewardCards || !skipBtn || !titleEl) return;

  const lines = [];
  if (uiManager.state.lastVictoryMessage) {
    lines.push(uiManager.state.lastVictoryMessage);
  }
  if (droppedDutki > 0) {
    lines.push(`Łup z bitki: +${droppedDutki} ${uiManager.state.getDutkiLabel(droppedDutki)}`);
  }
  rewardDutki.textContent = lines.join(' | ');
  titleEl.textContent = 'Elita pokonana! Wybierz pamiątkę:';
  rewardCards.innerHTML = '';

  relicChoices.forEach((relicId) => {
    const relic = relicLibrary[relicId];
    if (!relic) return;
    const relicEl = document.createElement('button');
    relicEl.type = 'button';
    relicEl.className = `reward-card reward-relic-choice ${uiHelpers.rarityClass(relic.rarity)}`;
    relicEl.innerHTML = `
        <div class="reward-emoji">${relic.emoji}</div>
        <div class="reward-name">${relic.name}</div>
        <div class="reward-rarity">${uiHelpers.rarityLabel(relic.rarity, 'relic')}</div>
        <div class="reward-desc">${relic.desc}</div>
      `;
    relicEl.addEventListener('click', () => {
      uiManager.state.addRelic(relicId);
      goToCardPhase();
    });
    rewardCards.appendChild(relicEl);
  });

  skipBtn.classList.add('hidden');
  skipBtn.onclick = null;
  cardScreen.classList.remove('hidden');
  cardScreen.setAttribute('aria-hidden', 'false');
  document.getElementById('end-turn-btn').disabled = true;
}
