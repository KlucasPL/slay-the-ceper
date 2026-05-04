import { weatherLibrary } from '../../data/weather.js';
import { localizeWeatherName, localizeWeatherDesc } from '../helpers/WeatherI18n.js';

/**
 * @param {any} uiManager
 */
export function openMapOverlay(uiManager) {
  renderMapTrack(uiManager);
  const overlay = document.getElementById('map-overlay');
  const panel = overlay?.querySelector('.event-panel');
  const mapTree = document.getElementById('map-tree');

  overlay?.classList.toggle('map-overlay--tutorial', uiManager.isTutorialMode);
  panel?.classList.toggle('map-panel--tutorial', uiManager.isTutorialMode);
  mapTree?.classList.toggle('map-tree--tutorial', uiManager.isTutorialMode);

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  uiManager.audioManager.playMapMusic();
}

/**
 * @param {any} uiManager
 */
export function renderMapTrack(uiManager) {
  const levels = document.getElementById('map-levels');
  const message = document.getElementById('map-message');
  const continueBtn = document.getElementById('map-continue-btn');
  const mapHpCurrent = document.getElementById('map-hp-current');
  const mapHpMax = document.getElementById('map-hp-max');
  const mapDutki = document.getElementById('map-dutki');
  if (!levels || !message || !continueBtn) return;

  if (mapHpCurrent) mapHpCurrent.textContent = String(uiManager.state.player.hp);
  if (mapHpMax) mapHpMax.textContent = String(uiManager.state.player.maxHp);
  if (mapDutki) mapDutki.textContent = String(uiManager.state.dutki);

  const mapTitle = document.querySelector('#map-overlay .event-title');
  if (mapTitle) {
    const isHard = uiManager.state.difficulty === 'hard';
    mapTitle.innerHTML = isHard
      ? `${uiManager.t('map.title')} <span class="hard-badge">🌶️ ${uiManager.t('map.hardBadge')}</span>`
      : uiManager.t('map.title');
  }

  levels.innerHTML = '';
  message.textContent = uiManager.localizeText(uiManager.mapMessage);

  const reachable = new Set(uiManager.state.getReachableNodes());
  const canStartFirstFight =
    !uiManager.state.hasStartedFirstBattle && uiManager.state.currentLevel === 0;
  const revealAllMap = uiManager.state.debugRevealAllMap;
  const isActIntroPlaying = Boolean(uiManager.isActIntroPlaying);
  /** @type {HTMLElement[][]} */
  const nodeButtons = [];

  uiManager.state.map.forEach((levelNodes, levelIndex) => {
    const row = document.createElement('div');
    row.className = 'map-level';
    nodeButtons[levelIndex] = [];

    levelNodes.forEach((node, nodeIndex) => {
      if (!node) {
        const placeholder = document.createElement('div');
        placeholder.className = 'map-node-placeholder';
        row.appendChild(placeholder);
        nodeButtons[levelIndex][nodeIndex] = null;
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'map-node-wrap';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-node-btn';
      btn.classList.add(`map-node-type-${node.type}`);

      const isCurrent =
        levelIndex === uiManager.state.currentLevel &&
        nodeIndex === uiManager.state.currentNodeIndex;
      const isDone = levelIndex < uiManager.state.currentLevel;
      const isInitialFight =
        canStartFirstFight && isCurrent && (node.type === 'fight' || node.type === 'maryna');
      const isSelectable =
        isInitialFight ||
        (uiManager.state.hasStartedFirstBattle &&
          levelIndex === uiManager.state.currentLevel + 1 &&
          reachable.has(nodeIndex));

      if (isCurrent) btn.classList.add('current');
      if (isDone) btn.classList.add('done');
      const canClickNode = isSelectable || isCurrent;
      if (canClickNode && !isActIntroPlaying) {
        if (isSelectable) btn.classList.add('available');
        btn.addEventListener('click', () => handleMapNodeSelect(uiManager, levelIndex, nodeIndex));
      } else {
        btn.classList.add('locked');
        btn.disabled = !isCurrent;
        if (isActIntroPlaying) btn.disabled = true;
      }

      const revealedEmoji =
        node.type === 'event' && (uiManager.state.hasRelic('mapa_zakopanego') || revealAllMap)
          ? uiManager._revealedEventEmoji(node.eventOutcome)
          : node.emoji;
      btn.innerHTML = `
          <span class="map-node-emoji">${revealedEmoji}</span>
          <span class="map-node-label">${node.label}</span>
        `;

      wrap.appendChild(btn);

      if (node.weather !== 'clear') {
        const weather = weatherLibrary[node.weather];
        const hint = document.createElement('button');
        hint.type = 'button';
        hint.className = 'map-weather-hint weather-hint-trigger';
        hint.textContent = weather?.emoji ?? '🌤️';
        hint.title = weather
          ? `${localizeWeatherName(uiManager.language, weather.name)}: ${localizeWeatherDesc(uiManager.language, weather.desc)}`
          : uiManager.localizeText('Pogoda');
        hint.setAttribute(
          'aria-label',
          weather
            ? `${uiManager.language === 'en' ? 'Weather for' : 'Pogoda na polu'} ${node.label}: ${localizeWeatherName(uiManager.language, weather.name)}. ${localizeWeatherDesc(uiManager.language, weather.desc)}`
            : uiManager.localizeText('Pogoda na polu')
        );
        hint.setAttribute('aria-expanded', 'false');

        const tooltip = document.createElement('span');
        tooltip.className = 'weather-tooltip';
        tooltip.textContent = weather
          ? `${localizeWeatherName(uiManager.language, weather.name)}: ${localizeWeatherDesc(uiManager.language, weather.desc)}`
          : uiManager.localizeText('Brak danych o pogodzie.');
        hint.appendChild(tooltip);

        hint.addEventListener('click', (event) => {
          event.stopPropagation();
          uiManager._toggleWeatherTooltip(hint);
        });

        wrap.appendChild(hint);
      }

      row.appendChild(wrap);
      nodeButtons[levelIndex][nodeIndex] = btn;
    });

    levels.appendChild(row);
  });

  const isOnBoss = uiManager.state.currentLevel === uiManager.state.map.length - 1;
  continueBtn.textContent = isOnBoss ? uiManager.t('map.newPath') : uiManager.t('map.goNext');
  continueBtn.classList.toggle('hidden', !isOnBoss);
  continueBtn.disabled = isActIntroPlaying;

  requestAnimationFrame(() => drawMapConnections(uiManager, nodeButtons));
}

/**
 * @param {any} uiManager
 * @param {HTMLElement[][]} nodeButtons
 */
export function drawMapConnections(uiManager, nodeButtons) {
  const tree = document.getElementById('map-tree');
  const svg = document.getElementById('map-lines');
  if (!tree || !svg) return;

  const width = tree.clientWidth;
  const height = tree.clientHeight;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.innerHTML = '';

  const reachableTargets = uiManager.state.getReachableNodes();
  const revealAllMap = uiManager.state.debugRevealAllMap;

  const treeRect = tree.getBoundingClientRect();
  // map-tree is rendered inside a globally scaled canvas; convert visual (scaled)
  // rect deltas back to map-tree local coordinates for correct SVG alignment.
  const scaleX = treeRect.width > 0 ? treeRect.width / width : 1;
  const scaleY = treeRect.height > 0 ? treeRect.height / height : 1;
  for (let level = 0; level < uiManager.state.map.length - 1; level++) {
    uiManager.state.map[level].forEach((node, nodeIndex) => {
      const fromEl = nodeButtons[level]?.[nodeIndex];
      if (!fromEl) return;
      const fromRect = fromEl.getBoundingClientRect();
      const x1 = (fromRect.left - treeRect.left + fromRect.width / 2) / scaleX;
      const y1 = (fromRect.top - treeRect.top + fromRect.height / 2) / scaleY;

      node.connections.forEach((targetIndex) => {
        const toEl = nodeButtons[level + 1]?.[targetIndex];
        if (!toEl) return;
        const toRect = toEl.getBoundingClientRect();
        const x2 = (toRect.left - treeRect.left + toRect.width / 2) / scaleX;
        const y2 = (toRect.top - treeRect.top + toRect.height / 2) / scaleY;

        const curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dy = Math.max(14, Math.abs(y2 - y1) * 0.35);
        curve.setAttribute('d', `M ${x1} ${y1} C ${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`);
        curve.classList.add('map-link');

        const isCurrent =
          level === uiManager.state.currentLevel && nodeIndex === uiManager.state.currentNodeIndex;
        const isReachable =
          uiManager.state.hasStartedFirstBattle &&
          level + 1 === uiManager.state.currentLevel + 1 &&
          reachableTargets.includes(targetIndex);
        const isDonePath = level < uiManager.state.currentLevel;
        const isFuturePath = level > uiManager.state.currentLevel;

        if (isDonePath) {
          curve.classList.add('done');
        } else if (isFuturePath) {
          curve.classList.add('future');
        }
        if (isReachable || revealAllMap) {
          curve.classList.add('available');
        }
        if (isCurrent && isReachable) {
          curve.classList.add('active');
        }

        svg.appendChild(curve);
      });
    });
  }
}

/**
 * @param {any} uiManager
 * @param {number} level
 * @param {number} nodeIndex
 */
export function handleMapNodeSelect(uiManager, level, nodeIndex) {
  const isInitialFight =
    !uiManager.state.hasStartedFirstBattle &&
    level === 0 &&
    uiManager.state.currentLevel === 0 &&
    nodeIndex === uiManager.state.currentNodeIndex;

  if (isInitialFight) {
    const currentNode =
      uiManager.state.map[uiManager.state.currentLevel][uiManager.state.currentNodeIndex];
    if (currentNode?.type === 'maryna') {
      // Player is always healed to full health when entering Maryna
      uiManager.state.healPlayer(uiManager.state.player.maxHp);
      uiManager._openMarynaBoonOverlay();
      return;
    }
    uiManager.state.hasStartedFirstBattle = true;
    uiManager.state.currentScreen = 'battle';
    uiManager._hideOverlay('map-overlay');
    uiManager._playEncounterMusic();
    document.getElementById('end-turn-btn').disabled = false;
    uiManager.updateUI();
    return;
  }

  const node = uiManager.state.travelTo(level, nodeIndex);
  if (!node) {
    console.warn(`[MAP] Travel rejected by NavigationState for node at L:${level} I:${nodeIndex}`);
    return;
  }
  uiManager.mapMessage = '';

  // Telemetry: close previous floor log and open a new one for this node.
  if (uiManager.state.currentFloorLog) uiManager.state.endFloorLog();
  uiManager.state.startFloorLog(node);

  if (node.type === 'fight' || node.type === 'elite' || node.type === 'boss') {
    uiManager.state.hasStartedFirstBattle = true;
    uiManager.state.currentScreen = 'battle';
    uiManager.state.resetBattle();
    uiManager._hideOverlay('map-overlay');
    uiManager._playEncounterMusic();
    document.getElementById('end-turn-btn').disabled = false;
    uiManager.updateUI();
    return;
  }

  if (node.type === 'shop') {
    uiManager.state.currentScreen = 'map';
    uiManager._openShop();
    return;
  }

  if (node.type === 'event') {
    let outcome = node.eventOutcome ?? uiManager.state.rollEventNodeOutcome();
    if (outcome === 'event' && !uiManager.state.hasUnseenEventsThisAct()) {
      // Event pool exhausted for this act: remap to remaining outcomes.
      outcome = uiManager.state.rollEventNodeOutcome();
      node.eventOutcome = outcome;
    }
    if (outcome === 'fight') {
      uiManager.state.hasStartedFirstBattle = true;
      uiManager.state.currentScreen = 'battle';
      uiManager.state.resetBattle();
      uiManager._hideOverlay('map-overlay');
      uiManager._playEncounterMusic();
      document.getElementById('end-turn-btn').disabled = false;
      uiManager.updateUI();
      return;
    }
    if (outcome === 'shop') {
      uiManager.state.currentScreen = 'map';
      uiManager._openShop();
      return;
    }
    uiManager.state.currentScreen = 'event';
    uiManager._openRandomEvent();
    return;
  }

  if (node.type === 'treasure') {
    uiManager.state.currentScreen = 'treasure';
    uiManager._handleTreasureNode();
    return;
  }

  uiManager.state.currentScreen = 'campfire';
  uiManager._openCampfire();
}
