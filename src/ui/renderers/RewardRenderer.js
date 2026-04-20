import { cardLibrary } from '../../data/cards.js';
import { relicLibrary } from '../../data/relics.js';
import * as uiHelpers from '../helpers/UIHelpers.js';
import * as cardRenderer from './CardRenderer.js';

// Thematic SVG banner for Treasure Chest (Skrzynia)
export const treasureSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <rect width="300" height="120" fill="#1c130e" />
  <path d="M -20 120 L 50 10 L 160 120 Z" fill="#2c1e16" opacity="0.8" />
  <path d="M 100 120 L 220 20 L 340 120 Z" fill="#3d2314" opacity="0.5" />
  <ellipse cx="150" cy="105" rx="70" ry="15" fill="#0a0502" opacity="0.7"/>
  <circle cx="150" cy="75" r="45" fill="#f4c26a" opacity="0.15" filter="blur(4px)" />
  <path d="M 105 75 L 195 75 L 195 110 L 105 110 Z" fill="#5c3a21" stroke="#1a0f0a" stroke-width="2"/>
  <path d="M 105 75 L 195 75" stroke="#f1c40f" stroke-width="2.5" />
  <path d="M 105 110 L 195 110" stroke="#f1c40f" stroke-width="2.5" />
  <path d="M 105 75 L 105 110" stroke="#f1c40f" stroke-width="2.5" />
  <path d="M 195 75 L 195 110" stroke="#f1c40f" stroke-width="2.5" />
  <line x1="130" y1="75" x2="130" y2="110" stroke="#2c1e16" stroke-width="2" />
  <line x1="170" y1="75" x2="170" y2="110" stroke="#2c1e16" stroke-width="2" />
  <circle cx="150" cy="92" r="10" fill="none" stroke="#e67e22" stroke-width="1.5" />
  <path d="M 150 82 L 150 102 M 140 92 L 160 92 M 143 85 L 157 99 M 143 99 L 157 85" stroke="#e67e22" stroke-width="1.5" opacity="0.8" />
  <path d="M 105 75 L 195 75 L 185 45 L 115 45 Z" fill="#4a2e15" stroke="#1a0f0a" stroke-width="2" />
  <path d="M 115 45 L 185 45" stroke="#f1c40f" stroke-width="2.5" />
  <path d="M 105 75 L 115 45" stroke="#f1c40f" stroke-width="2.5" />
  <path d="M 195 75 L 185 45" stroke="#f1c40f" stroke-width="2.5" />
  <polygon points="115,75 185,75 175,60 125,60" fill="#f1c40f" opacity="0.9" />
  <circle cx="140" cy="70" r="6" fill="#f39c12" />
  <circle cx="150" cy="66" r="8" fill="#fff200" />
  <circle cx="160" cy="72" r="5" fill="#e67e22" />
  <rect x="142" y="70" width="16" height="20" fill="#d35400" rx="2" stroke="#1a0f0a" stroke-width="1.5" />
  <circle cx="150" cy="76" r="2.5" fill="#1a0f0a" />
  <line x1="150" y1="78" x2="150" y2="85" stroke="#1a0f0a" stroke-width="1.5" />
  <path d="M 150 20 L 152 28 L 160 30 L 152 32 L 150 40 L 148 32 L 140 30 L 148 28 Z" fill="#fdf8eb" opacity="0.9" />
  <path d="M 115 35 L 116 39 L 120 40 L 116 41 L 115 45 L 114 41 L 110 40 L 114 39 Z" fill="#fdf8eb" opacity="0.7" />
  <path d="M 185 40 L 186 43 L 189 44 L 186 45 L 185 48 L 184 45 L 181 44 L 184 43 Z" fill="#fdf8eb" opacity="0.7" />
</svg>
`;

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
  if (!relicScreen || !cardScreen) return;

  let panel = relicScreen.querySelector('.victory-panel');
  if (!(panel instanceof HTMLElement)) {
    panel = document.createElement('div');
    panel.className = 'victory-panel relic-reward-panel';
    relicScreen.appendChild(panel);
  }

  let titleEl = panel.querySelector('.victory-title');
  if (!(titleEl instanceof HTMLElement)) {
    titleEl = document.createElement('h2');
    titleEl.className = 'victory-title';
    panel.prepend(titleEl);
  }

  let glowWrap = panel.querySelector('.relic-glow-wrap');
  if (!(glowWrap instanceof HTMLElement)) {
    glowWrap = document.createElement('div');
    glowWrap.className = 'relic-glow-wrap';
    panel.appendChild(glowWrap);
  }

  let claimBtn = panel.querySelector('#claim-relic-btn');
  if (!(claimBtn instanceof HTMLButtonElement)) {
    claimBtn = document.createElement('button');
    claimBtn.id = 'claim-relic-btn';
    claimBtn.className = 'reward-relic-btn';
    claimBtn.textContent = 'Zgarnij Pamiątkę';
    panel.appendChild(claimBtn);
  }

  glowWrap.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare');
  glowWrap.classList.add(uiHelpers.rarityClass(relic.rarity));

  titleEl.textContent = source === 'treasure' ? 'Znalazłeś Skarb!' : 'Łup z wroga!';
  // Conditionally inject the treasure chest banner for treasure nodes
  const currentNode = uiManager.state.getCurrentMapNode();
  panel.querySelector('.treasure-banner-container')?.remove();
  if (currentNode && currentNode.type === 'treasure') {
    const bannerContainer = document.createElement('div');
    bannerContainer.className = 'treasure-banner-container';
    bannerContainer.style.width = '100%';
    bannerContainer.style.maxWidth = '400px';
    bannerContainer.style.height = 'auto';
    bannerContainer.style.aspectRatio = '5 / 2';
    bannerContainer.style.borderRadius = '8px';
    bannerContainer.style.margin = '16px auto 24px auto';
    bannerContainer.style.overflow = 'hidden';
    bannerContainer.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5), inset 0 0 0 2px #5a3800';
    bannerContainer.style.display = 'flex';
    bannerContainer.style.justifyContent = 'center';
    bannerContainer.style.alignItems = 'center';
    bannerContainer.innerHTML = treasureSvg;
    // CRITICAL FIX: The title class is .victory-title, NOT .event-title
    const titleElement = panel.querySelector('.victory-title');
    if (titleElement) {
      titleElement.insertAdjacentElement('afterend', bannerContainer);
    } else {
      // Safe fallback so the game NEVER crashes if the title is missing
      panel.prepend(bannerContainer);
    }
  }

  // Inject standardized relic plate
  glowWrap.innerHTML = `
    <div class="relic-plate ${uiHelpers.rarityClass(relic.rarity)}">
      <h3 class="relic-plate-title">${relic.emoji} ${relic.name}</h3>
      <p class="relic-plate-rarity">${uiHelpers.rarityLabel(relic.rarity, 'relic')}</p>
      <p class="relic-plate-desc">${relic.desc}</p>
    </div>
  `;
  const rewardRelicEl = glowWrap.querySelector('.relic-plate');
  if (rewardRelicEl instanceof HTMLElement) {
    uiHelpers.attachLongPressZoom(rewardRelicEl, () => uiManager.showRelicZoom(relicId));
  }

  claimBtn.onclick = () => {
    uiManager.state.addRelic(relicId);
    relicScreen.classList.add('hidden');
    relicScreen.setAttribute('aria-hidden', 'true');

    if (source === 'battle') {
      const goToCardPhase = uiManager.pendingBattleRelicClaimAction;
      uiManager.pendingBattleRelicClaimAction = null;
      if (goToCardPhase) {
        goToCardPhase();
      } else {
        // Defensive fallback: never leave the player on a finished battle screen.
        uiManager.state.currentScreen = 'map';
        uiManager._openMapOverlay();
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
    // CRITICAL: Added 'reward-phase-card' class for specific CSS sizing
    cardEl.className = `card reward-phase-card ${uiHelpers.rarityClass(card.rarity)} card-${card.type}`;
    cardEl.innerHTML = `
        <div class="card-header">
          <div class="card-title">${card.name}</div>
          <div class="card-cost-oscypek">
            <span class="cost-value">${card.cost}</span>
            <span class="cost-icon">🧀</span>
          </div>
        </div>
        <div class="card-subtitle">${uiHelpers.getFullCardType(card.rarity, card.type)}</div>
        <div class="card-art">
          <span class="card-icon">${card.emoji}</span>
        </div>
        <div class="card-text-box">
          <div class="card-desc">${cardDesc}</div>
        </div>
      `;

    if (card.exhaust) {
      cardEl.classList.add('card-exhaust');
      const exhaustEl = document.createElement('div');
      exhaustEl.className = 'card-exhaust-inline';
      exhaustEl.innerHTML = '<span class="exhaust-fire">🔥</span> PRZEPADO';
      cardEl.querySelector('.card-text-box').appendChild(exhaustEl);
    }

    cardEl.addEventListener('click', () => {
      uiManager.state.deck.push(cardId);
      closeRewardScreens(uiManager, isBossFight);
    });
    uiHelpers.attachLongPressZoom(cardEl, () => uiManager.showCardZoom(cardId));
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

  uiManager.pendingBattleRelicClaimAction = null;
  uiManager.state.currentScreen = 'map';
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

  /** @type {Map<string, number>} */
  const cardCounts = new Map();
  summary.finalDeck.forEach((card) => {
    const next = (cardCounts.get(card.id) ?? 0) + 1;
    cardCounts.set(card.id, next);
  });

  const deckFragment = document.createDocumentFragment();
  cardCounts.forEach((count, cardId) => {
    const cardDef = cardLibrary[cardId];
    if (!cardDef) return;
    const item = document.createElement('div');
    item.className = `run-summary-item ${uiHelpers.rarityClass(cardDef.rarity)}`;
    item.textContent = `${count}x ${cardDef.emoji} ${cardDef.name}`;
    deckFragment.appendChild(item);
  });
  if (deckFragment.childNodes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'run-summary-item';
    empty.textContent = 'Brak kart w talii końcowej.';
    deckFragment.appendChild(empty);
  }
  deck.innerHTML = '';
  deck.appendChild(deckFragment);

  const relicFragment = document.createDocumentFragment();
  summary.finalRelics.forEach((relic) => {
    const item = document.createElement('div');
    item.className = `run-summary-item ${uiHelpers.rarityClass(relic.rarity)}`;
    item.textContent = `${relic.emoji} ${relic.name}`;
    relicFragment.appendChild(item);
  });
  if (relicFragment.childNodes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'run-summary-item';
    empty.textContent = 'Brak zebranych pamiątek.';
    relicFragment.appendChild(empty);
  }
  relics.innerHTML = '';
  relics.appendChild(relicFragment);

  // Seed display
  const seedRow = document.getElementById('run-summary-seed-row');
  const seedVal = document.getElementById('run-summary-seed-value');
  const replaySeedBtn = document.getElementById('run-summary-replay-seed-btn');
  const runSeed = uiManager.state.runSeed ?? null;
  if (seedRow && seedVal) {
    if (runSeed) {
      seedVal.textContent = runSeed;
      seedRow.classList.remove('hidden');
      document.getElementById('run-summary-seed-copy')?.addEventListener(
        'click',
        () => {
          navigator.clipboard?.writeText(runSeed).catch(() => {});
        },
        { once: true }
      );
    } else {
      seedRow.classList.add('hidden');
    }
  }
  if (replaySeedBtn) {
    replaySeedBtn.classList.toggle('hidden', !runSeed);
  }

  uiHelpers.hideOverlay('relic-reward-screen');
  uiHelpers.hideOverlay('card-reward-screen');
  uiHelpers.hideOverlay('map-overlay');
  uiHelpers.hideOverlay('shop-overlay');
  uiHelpers.hideOverlay('campfire-overlay');
  uiHelpers.hideOverlay('random-event-overlay');

  // Inject download button next to the existing action buttons.
  const actionsContainer = overlay.querySelector('.run-summary-actions');
  if (actionsContainer && !actionsContainer.querySelector('.run-summary-download-btn')) {
    const downloadLogBtn = document.createElement('button');
    downloadLogBtn.className = 'btn run-summary-download-btn';
    downloadLogBtn.style.backgroundColor = '#2c3e50';
    downloadLogBtn.style.color = '#ecf0f1';
    downloadLogBtn.textContent = '\uD83D\uDCBE Pobierz Log (JSON)';
    downloadLogBtn.onclick = () => {
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(uiManager.state.getRunTelemetryJSON());
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', 'usiec_cepra_run_log.json');
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    };
    actionsContainer.appendChild(downloadLogBtn);
  }

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
    relicEl.className = `reward-card reward-relic-choice relic-plate ${uiHelpers.rarityClass(relic.rarity)}`;
    relicEl.innerHTML = `
      <h3 class="relic-plate-title">${relic.emoji} ${relic.name}</h3>
      <p class="relic-plate-rarity">${uiHelpers.rarityLabel(relic.rarity, 'relic')}</p>
      <p class="relic-plate-desc">${relic.desc}</p>
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
