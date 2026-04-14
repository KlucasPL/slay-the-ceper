import { relicLibrary } from '../../data/relics.js';
import { statusTooltipRegistry } from '../statusTooltips.js';
import * as uiHelpers from '../helpers/UIHelpers.js';

/**
 * @param {any} uiManager
 */
export function renderEnemyPresentation(uiManager) {
  const enemyName = document.getElementById('enemy-name');
  const enemySprite = document.getElementById('sprite-enemy');
  const enemyId = uiManager.state.enemy.id;
  enemyName.textContent = `${uiManager.state.enemy.name} ${uiManager.state.enemy.emoji}`;
  if (
    enemySprite.dataset.enemyId !== enemyId ||
    enemySprite.dataset.enemySpriteSvg !== uiManager.state.enemy.spriteSvg
  ) {
    enemySprite.innerHTML = uiManager.state.enemy.spriteSvg;
    enemySprite.dataset.enemyId = enemyId;
    enemySprite.dataset.enemySpriteSvg = uiManager.state.enemy.spriteSvg;
  }
  if (uiManager.state.enemy.isBankrupt && uiManager.state.enemy.rachunek > 0) {
    enemySprite.classList.add('bankrupt-animation');
  } else {
    enemySprite.classList.remove('bankrupt-animation');
  }
}

/**
 * @param {any} uiManager
 */
export function renderWeatherIndicator(uiManager) {
  const weather = uiManager.state.getCurrentWeather();
  const badge = document.getElementById('weather-indicator');
  const tip = document.getElementById('weather-tooltip');
  if (!badge || !tip || !weather) return;

  badge.textContent = `${weather.emoji} ${weather.name}`;
  badge.appendChild(tip);
  badge.setAttribute('aria-label', `${weather.name}: ${weather.desc}`);
  tip.textContent = weather.desc;
}

/**
 * @param {any} uiManager
 */
export function renderRelics(uiManager) {
  const bar = document.getElementById('relic-bar');
  if (!bar) return;

  bar.innerHTML = '';
  uiManager.state.relics.forEach((relicId) => {
    const relic = relicLibrary[relicId];
    if (!relic) return;
    const chip = document.createElement('button');
    chip.className = 'relic-chip';
    chip.classList.add(uiHelpers.rarityClass(relic.rarity));
    chip.type = 'button';
    chip.textContent = relic.emoji;
    chip.title = `${relic.name}: ${relic.desc}`;
    chip.setAttribute('aria-label', `${relic.name}: ${relic.desc}`);

    const tooltip = document.createElement('span');
    tooltip.className = 'relic-tooltip';
    tooltip.textContent = `${relic.name}: ${relic.desc}`;
    chip.appendChild(tooltip);

    bar.appendChild(chip);
  });
}

/**
 * @param {any} uiManager
 * @param {string} containerId
 * @param {import('../../data/cards.js').StatusDef} status
 */
export function renderStatuses(uiManager, containerId, status) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';

  /**
   * @param {string} icon
   * @param {string} label
   * @param {string|number|null} value
   * @param {string} tooltip
   */
  const tag = (icon, label, value, tooltip) => {
    const chipText = value != null ? `${icon}\u2009${value}` : icon;
    const ariaLabel = value != null ? `${label}: ${value}` : label;
    const element = document.createElement('button');
    element.className = 'status-tag status-tag-hint';
    element.type = 'button';
    element.textContent = chipText;
    element.setAttribute('aria-label', `${ariaLabel}: ${tooltip}`);
    element.setAttribute('aria-expanded', 'false');

    const tip = document.createElement('span');
    tip.className = 'status-tooltip';
    tip.textContent = `${label}${value != null ? ` (${value})` : ''}: ${tooltip}`;
    element.appendChild(tip);

    element.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = element.classList.contains('is-open');
      uiManager._closeStatusTooltips();
      if (!isOpen) {
        element.classList.add('is-open');
        element.setAttribute('aria-expanded', 'true');
      }
    });

    el.appendChild(element);
  };

  Object.entries(status).forEach(([key, rawValue]) => {
    const numericValue = typeof rawValue === 'boolean' ? (rawValue ? 1 : 0) : Number(rawValue ?? 0);
    if (numericValue <= 0) return;

    const def = statusTooltipRegistry[key] ?? {
      icon: '🔹',
      label: key,
      tooltip: `Aktywny status: ${key}`,
    };
    const isBoolean = typeof rawValue === 'boolean';
    const shouldShowValue = def.showNumericValue ?? !isBoolean;

    let displayValue = null;
    if (shouldShowValue) {
      if (key === 'energy_next_turn') {
        displayValue = `+${numericValue}`;
      } else {
        displayValue = numericValue;
      }
    }

    tag(def.icon, def.label, displayValue, def.tooltip);
  });

  if (containerId === 'p-statuses' && uiManager.state.player.stunned) {
    const stunnedDef = statusTooltipRegistry.stunned;
    if (stunnedDef) {
      tag(stunnedDef.icon, stunnedDef.label, null, stunnedDef.tooltip);
    }
  }

  if (containerId === 'e-statuses') {
    uiManager.state.getEnemySpecialStatuses().forEach((special) => {
      tag(special.icon, special.label, special.value, special.tooltip);
    });
  }
}
