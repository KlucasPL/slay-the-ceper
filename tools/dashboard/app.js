/**
 * @typedef {{ rate: number, lo: number, hi: number, n: number }} RateCi
 * @typedef {{ mean: number, lo: number, hi: number, n: number }} MeanCi
 * @typedef {{
 *   kind: string, id: string, name: string,
 *   offeredCount: number, acquiredCount: number, runsWithEntity: number,
 *   pickRate: number | null,
 *   winrateWithEntity: RateCi | null, winrateWithout: RateCi | null,
 *   winrateLiftPp: number | null, liftCi: { lo: number, hi: number } | null,
 *   sampleTier: string,
 *   bySlice: Record<string, { wins: number, total: number }>,
 *   acquisitionSources: Record<string, number>,
 *   avgPlaysPerBattle?: number | null, damagePerEnergy?: number | null,
 *   avgTurnsToKill?: number | null,
 *   byFloor?: Record<string, { wins: number, total: number, winrate: number }>,
 *   byWeather?: Record<string, { wins: number, total: number, winrate: number }>,
 *   avgFloorReachedWith?: number | null,
 *   avgFloorReachedWithout?: number | null,
 *   floorReachedLift?: number | null,
 * }} EntityStats
 * @typedef {{
 *   schemaVersion: number, batchId: string, batchName: string, gitSha: string,
 *   runCount: number, dateRun: string, configHash: string, poolOverridesHash: string,
 *   agentMix: Record<string, number>,
 *   overall: { winrate: RateCi, avgFloorReached: MeanCi, avgTurnsPlayed: MeanCi, avgDutkiEarned: MeanCi },
 *   bySlice: Record<string, { winrate: RateCi, runCount: number }>,
 *   byEntity: Record<string, EntityStats>,
 *   diagnostic?: { belowMinSample?: number, ciMethodology?: string, schemaDrift?: { unknownEventKinds: string[] }, coverage?: Record<string, number> },
 * }} MetricsJson
 */

import { renderBatchSummary } from './views/batch-summary.js';
import { renderLeaderboard } from './views/leaderboard.js';
import { renderEntityDetail } from './views/entity-detail.js';
import { renderEnemyHeatmap } from './views/enemy-heatmap.js';
import { renderWeatherEnemyMatrix } from './views/weather-enemy-matrix.js';
import { renderPatchComparison } from './views/patch-comparison.js';
import { renderRunReplay } from './views/run-replay.js';

/** @type {typeof import('./vendor/chart.min.js')} */
const Chart = /** @type {any} */ (window.Chart);

/** @type {MetricsJson | null} */
let metrics = null;

/** @type {'summary' | 'leaderboard' | 'detail' | 'enemy-heatmap' | 'weather-enemy' | 'patch-comparison' | 'run-replay'} */
let currentView = 'summary';

/** @type {MetricsJson | null} */
let metricsB = null;

/** @type {string | null} */
let selectedEntity = null;

const main = /** @type {HTMLElement} */ (document.getElementById('main-content'));
const navBtns = /** @type {NodeListOf<HTMLButtonElement>} */ (
  document.querySelectorAll('.nav-btn')
);
const loadInput = /** @type {HTMLInputElement} */ (document.getElementById('metrics-file-input'));
const loadStatus = /** @type {HTMLElement} */ (document.getElementById('load-status'));

// ── nav ───────────────────────────────────────────────────────────────────────

navBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const view = /** @type {typeof currentView} */ (btn.dataset.view ?? 'summary');
    navigateTo(view);
  });
});

// Delegate: patch-comparison internal file loader
document.addEventListener('change', (e) => {
  const target = /** @type {HTMLInputElement} */ (e.target);
  if (target.id !== 'patch-file-b-input') return;
  const file = target.files?.[0];
  if (!file || !metrics) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      metricsB = JSON.parse(/** @type {string} */ (ev.target?.result));
      navigateTo('patch-comparison');
    } catch {
      alert('Invalid JSON for second metrics file');
    }
  };
  reader.readAsText(file);
});

/**
 * @param {'summary' | 'leaderboard' | 'detail' | 'enemy-heatmap' | 'weather-enemy' | 'patch-comparison' | 'run-replay'} view
 * @param {string} [entityKey]
 */
function navigateTo(view, entityKey) {
  // run-replay is standalone — works without a metrics file loaded
  if (!metrics && view !== 'run-replay') return;
  currentView = view;
  if (entityKey) selectedEntity = entityKey;

  navBtns.forEach((b) => b.classList.toggle('active', b.dataset.view === currentView));

  // Destroy any existing Chart instances to avoid canvas reuse errors
  Chart.getChart(main.querySelector('canvas'))?.destroy?.();
  main.querySelectorAll('canvas').forEach((c) => Chart.getChart(c)?.destroy());

  switch (view) {
    case 'summary':
      renderBatchSummary(main, metrics, Chart);
      break;
    case 'leaderboard':
      renderLeaderboard(main, metrics, Chart, (key) => navigateTo('detail', key));
      break;
    case 'detail':
      if (selectedEntity) {
        renderEntityDetail(main, metrics, Chart, selectedEntity, () => navigateTo('leaderboard'));
      }
      break;
    case 'enemy-heatmap':
      renderEnemyHeatmap(main, metrics);
      break;
    case 'weather-enemy':
      renderWeatherEnemyMatrix(main, metrics, Chart);
      break;
    case 'patch-comparison':
      renderPatchComparison(main, metrics, metricsB);
      break;
    case 'run-replay':
      renderRunReplay(main);
      break;
  }
}

// ── metrics loading ───────────────────────────────────────────────────────────

async function loadDefault() {
  try {
    const res = await fetch('./metrics.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // Race guard: a user-supplied file may have loaded while fetch was pending.
    if (metrics) return;
    metrics = json;
    setLoadStatus(`Loaded metrics (${metrics.runCount.toLocaleString()} runs)`, 'ok');
    navigateTo('summary');
  } catch (err) {
    if (metrics) return;
    setLoadStatus(`Could not auto-load metrics: ${err.message}`, 'warn');
    main.innerHTML = `<p class="empty-msg">Drop a <code>metrics.json</code> file or use the file picker above to load data.</p>`;
  }
}

loadInput?.addEventListener('change', () => {
  const file = loadInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      metrics = JSON.parse(/** @type {string} */ (e.target?.result));
      setLoadStatus(`Loaded ${file.name} (${metrics.runCount.toLocaleString()} runs)`, 'ok');
      navigateTo('summary');
    } catch {
      setLoadStatus('Invalid JSON', 'error');
    }
  };
  reader.readAsText(file);
});

// Drag-and-drop on the whole page
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      metrics = JSON.parse(/** @type {string} */ (ev.target?.result));
      setLoadStatus(`Loaded ${file.name} (${metrics.runCount.toLocaleString()} runs)`, 'ok');
      navigateTo('summary');
    } catch {
      setLoadStatus('Invalid JSON', 'error');
    }
  };
  reader.readAsText(file);
});

/**
 * @param {string} msg
 * @param {'ok'|'warn'|'error'} level
 */
function setLoadStatus(msg, level) {
  if (!loadStatus) return;
  loadStatus.textContent = msg;
  loadStatus.className = `load-status load-status--${level}`;
}

loadDefault();
