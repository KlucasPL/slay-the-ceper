/** @import { MetricsJson, EntityStats } from '../app.js' */

/**
 * Render View 5 — Weather × Enemy Win-Rate Matrix.
 * Rows = enemies, cols = weather ids sourced from enemies' byWeather keys.
 * @param {HTMLElement} container
 * @param {MetricsJson} metrics
 * @param {typeof Chart} Chart
 */
export function renderWeatherEnemyMatrix(container, metrics, Chart) {
  const enemies = Object.values(metrics.byEntity).filter((e) => e.kind === 'enemy');

  if (!enemies.length) {
    container.innerHTML = `<p class="empty-msg">No enemy data available.</p>`;
    return;
  }

  // Collect all weather ids across all enemies, preserving insertion order then sorting
  const weatherSet = new Set();
  for (const e of enemies) {
    if (e.byWeather) Object.keys(e.byWeather).forEach((w) => weatherSet.add(w));
  }
  const weathers = [...weatherSet].sort();

  if (!weathers.length) {
    container.innerHTML = `<p class="empty-msg">No byWeather data in this metrics file. Run with writer verbosity "full" to collect weather-level stats.</p>`;
    return;
  }

  // Build colour-coded cells per (enemy, weather)
  const tableRows = enemies
    .map((e) => {
      const cells = weathers
        .map((w) => {
          const cell = e.byWeather?.[w];
          if (cell == null || cell.total === 0)
            return `<td class="wm-cell wm-cell--empty" title="${_esc(w)}: no data">—</td>`;
          const wr = cell.winrate ?? 0;
          const bg = _wrColor(wr);
          const textColor = wr > 0.55 ? '#0d1a0d' : wr < 0.45 ? '#1a0d0d' : '#1a1a0d';
          return `<td class="wm-cell" style="background:${bg};color:${textColor}" title="${_esc(w)}: ${cell.wins}/${cell.total} battles won (${(wr * 100).toFixed(1)}%)">${(wr * 100).toFixed(0)}%</td>`;
        })
        .join('');

      const killRate = _aggregateKillRate(e.byWeather);
      const avgFloor = e.avgFloorReachedWith != null ? e.avgFloorReachedWith.toFixed(1) : '—';
      return `
      <tr>
        <td class="wm-label">
          <span class="entity-name">${_esc(e.name)}</span>
          <code class="entity-id">${_esc(e.id)}</code>
        </td>
        ${cells}
        <td class="wm-overall" title="Battles won / battles fought across all weather conditions">${killRate}</td>
        <td class="wm-overall" title="Average floor reached by runs that fought this enemy">${avgFloor}</td>
      </tr>`;
    })
    .join('');

  const headerCols = weathers
    .map((w) => `<th scope="col" class="wm-col-head">${_esc(w)}</th>`)
    .join('');

  container.innerHTML = `
    <section class="view-weather-enemy" aria-label="Weather × Enemy Matrix">
      <header class="view-header">
        <h2>Weather × Enemy Win-Rate</h2>
      </header>
      <p class="wm-desc">Per-battle kill rate for each (enemy, weather) pairing (wins ÷ battles fought). Green = player kills enemy, Red = enemy kills player.</p>
      <div class="table-wrapper" style="margin-top:1rem">
        <table class="weather-matrix-table" aria-label="Weather by enemy kill-rate matrix">
          <thead>
            <tr>
              <th scope="col" class="wm-label-head">Enemy</th>
              ${headerCols}
              <th scope="col" class="wm-col-head" title="Total wins / total battles across all weather">Kills</th>
              <th scope="col" class="wm-col-head" title="Average floor reached by runs that fought this enemy">Floor w/</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="wm-legend">
        <span class="wm-legend-label">0%</span>
        <div class="wm-legend-bar"></div>
        <span class="wm-legend-label">100%</span>
      </div>
    </section>
    <style>
      .wm-desc { font-size: 0.85rem; color: var(--text-muted); }
      .weather-matrix-table { border-collapse: collapse; font-size: 0.875rem; }
      .weather-matrix-table th, .weather-matrix-table td { padding: 0.5rem 0.65rem; border: 1px solid var(--border); }
      .weather-matrix-table thead th { background: var(--surface2); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
      .wm-label { min-width: 140px; }
      .wm-label-head { min-width: 140px; text-align: left; }
      .wm-col-head { text-align: center; min-width: 60px; }
      .wm-cell { text-align: center; font-weight: 600; font-size: 0.8rem; }
      .wm-cell--empty { text-align: center; color: var(--text-muted); background: var(--surface); }
      .wm-overall { text-align: center; font-weight: 600; color: var(--text-muted); }
      .wm-legend { display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; }
      .wm-legend-label { font-size: 0.75rem; color: var(--text-muted); }
      .wm-legend-bar {
        flex: 1; max-width: 200px; height: 10px; border-radius: 4px;
        background: linear-gradient(to right, #c0392b, #e67e22, #f1c40f, #6bcf82);
      }
    </style>
  `;

  // Chart: grouped bar — one group per enemy, one bar per weather
  _drawGroupedBar(container, Chart, enemies, weathers);
}

/**
 * @param {HTMLElement} container
 * @param {typeof Chart} Chart
 * @param {EntityStats[]} enemies
 * @param {string[]} weathers
 */
function _drawGroupedBar(container, Chart, enemies, weathers) {
  const section = container.querySelector('section');
  if (!section) return;

  const chartWrap = document.createElement('div');
  chartWrap.className = 'chart-card';
  chartWrap.style.marginTop = '1.5rem';
  chartWrap.innerHTML = `
    <h3>Win Rate by Weather Condition</h3>
    <div class="chart-container" style="height:260px">
      <canvas id="chart-weather-enemy" aria-label="Grouped bar chart: win rate by weather per enemy"></canvas>
    </div>
  `;
  section.appendChild(chartWrap);

  const canvas = /** @type {HTMLCanvasElement|null} */ (
    section.querySelector('#chart-weather-enemy')
  );
  if (!canvas) return;

  const PALETTE = ['#4f8ef7', '#6bcf82', '#f7c84f', '#e06060', '#b07aff', '#4fcfcf'];
  const datasets = weathers.map((w, i) => ({
    label: w,
    data: enemies.map((e) => {
      const cell = e.byWeather?.[w];
      if (cell == null || cell.total === 0) return null;
      return Math.round((cell.winrate ?? 0) * 1000) / 10;
    }),
    backgroundColor: PALETTE[i % PALETTE.length] + 'cc',
    borderColor: PALETTE[i % PALETTE.length],
    borderWidth: 1,
    borderRadius: 3,
  }));

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: enemies.map((e) => e.name),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#aaa', font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw != null ? ctx.raw + '%' : 'N/A'}`,
          },
        },
      },
      scales: {
        x: { ticks: { color: '#ccc' }, grid: { color: '#333' } },
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#aaa', callback: (v) => `${v}%` },
          grid: { color: '#333' },
        },
      },
    },
  });
}

/**
 * Sum battles across a byWeather record into a "wins/total" label.
 *
 * @param {Record<string, { wins: number, total: number }> | undefined} byWeather
 * @returns {string}
 */
function _aggregateKillRate(byWeather) {
  if (!byWeather) return '—';
  let wins = 0;
  let total = 0;
  for (const cell of Object.values(byWeather)) {
    wins += cell.wins ?? 0;
    total += cell.total ?? 0;
  }
  if (total === 0) return '—';
  return `${wins}/${total}`;
}

/**
 * Map win-rate [0,1] to a CSS colour string (red→amber→green).
 * @param {number} wr
 * @returns {string}
 */
function _wrColor(wr) {
  const clamped = Math.max(0, Math.min(1, wr));
  if (clamped < 0.4) {
    const t = clamped / 0.4;
    return `rgb(${Math.round(192 + t * 38)},${Math.round(57 + t * 69)},${Math.round(43 - t * 9)})`;
  }
  if (clamped < 0.6) {
    const t = (clamped - 0.4) / 0.2;
    return `rgb(${Math.round(230 + t * 11)},${Math.round(126 + t * 70)},${Math.round(34 - t * 19)})`;
  }
  const t = (clamped - 0.6) / 0.4;
  return `rgb(${Math.round(241 - t * 134)},${Math.round(196 + t * 11)},${Math.round(15 + t * 115)})`;
}

/** @param {string} s @returns {string} */
function _esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}
