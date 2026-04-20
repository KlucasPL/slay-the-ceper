/** @import { MetricsJson } from '../app.js' */

/**
 * Render View 1 — Batch Summary into the given container element.
 * @param {HTMLElement} container
 * @param {MetricsJson} metrics
 * @param {typeof Chart} Chart
 */
export function renderBatchSummary(container, metrics, Chart) {
  const {
    overall,
    agentMix,
    agentStats,
    agentDivergence,
    bySlice,
    runCount,
    batchName,
    dateRun,
    gitSha,
    diagnostic,
  } = metrics;

  const sampleTier = _sampleTier(runCount);
  const tierBadge = _tierBadge(sampleTier);

  container.innerHTML = `
    <section class="view-batch-summary" aria-label="Batch Summary">
      <header class="view-header">
        <h2>${_esc(batchName)}</h2>
        <div class="meta-row">
          <span class="meta-item">📅 ${_esc(dateRun)}</span>
          <span class="meta-item">🔖 <code>${_esc(gitSha)}</code></span>
          <span class="meta-item">🎮 ${runCount.toLocaleString()} runs</span>
          ${tierBadge}
        </div>
      </header>

      <div class="stats-grid">
        ${_statCard('Win Rate', _pctCi(overall.winrate), 'Fraction of runs ending in player_win')}
        ${_statCard('Avg Floor', _meanCi(overall.avgFloorReached, 1), 'Average deepest floor reached')}
        ${_statCard('Avg Turns', _meanCi(overall.avgTurnsPlayed, 1), 'Average total player turns across run')}
        ${_statCard('Avg Dutki', _meanCi(overall.avgDutkiEarned, 0), 'Average Dutki earned per run')}
        ${overall.avgSurvivalScore ? _statCard('Survival Score', _meanCi(overall.avgSurvivalScore, 2), 'Mean floorReached + hpAtDeath/maxHp — ranks runs that died on same floor by HP margin') : ''}
        ${overall.avgHpAtDeath ? _statCard('Avg HP @ End', _meanCi(overall.avgHpAtDeath, 1), 'Player HP at run-end (0 on death)') : ''}
        ${overall.floorReached ? _statCard('Floor p10/p50/p90', _percentiles(overall.floorReached), 'Floor reached percentiles — survival distribution shape') : ''}
        ${overall.floorReached ? _statCard('Floor max', String(overall.floorReached.max ?? 0), 'Deepest floor any run reached') : ''}
      </div>

      ${_renderAgentDivergence(agentDivergence, agentStats)}

      <div class="charts-row">
        <div class="chart-card">
          <h3>Agent Mix</h3>
          <div class="chart-container" style="max-width:260px;margin:auto">
            <canvas id="chart-agent-mix" aria-label="Agent mix donut chart"></canvas>
          </div>
        </div>
        <div class="chart-card chart-card--wide">
          <h3>Win Rate by Slice</h3>
          <div class="chart-container">
            <canvas id="chart-by-slice" aria-label="Win rate by run slice bar chart"></canvas>
          </div>
        </div>
      </div>

      ${
        diagnostic?.belowMinSample
          ? `
        <aside class="diagnostic-warn" role="note">
          <strong>Low sample:</strong> ${diagnostic.belowMinSample.toLocaleString()} entities have &lt; 500 runs — treat lift estimates with caution.
        </aside>`
          : ''
      }
    </section>
  `;

  _drawAgentMix(container, Chart, agentMix);
  _drawBySlice(container, Chart, bySlice);
}

/**
 * @param {HTMLElement} container
 * @param {typeof Chart} Chart
 * @param {Record<string, number>} agentMix
 */
function _drawAgentMix(container, Chart, agentMix) {
  const canvas = /** @type {HTMLCanvasElement|null} */ (
    container.querySelector('#chart-agent-mix')
  );
  if (!canvas) return;
  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(agentMix),
      datasets: [
        {
          data: Object.values(agentMix),
          backgroundColor: ['#4f8ef7', '#f7a44f', '#6bcf82', '#e06060'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { color: '#ccc' } } },
    },
  });
}

/**
 * @param {HTMLElement} container
 * @param {typeof Chart} Chart
 * @param {Record<string, { winrate: { rate: number }, runCount: number }>} bySlice
 */
function _drawBySlice(container, Chart, bySlice) {
  const canvas = /** @type {HTMLCanvasElement|null} */ (container.querySelector('#chart-by-slice'));
  if (!canvas) return;
  const labels = Object.keys(bySlice);
  const values = labels.map((k) => +(bySlice[k].winrate.rate * 100).toFixed(1));
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Win Rate %',
          data: values,
          backgroundColor: '#4f8ef7',
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { color: '#aaa', callback: (v) => `${v}%` },
          grid: { color: '#333' },
        },
        y: { ticks: { color: '#ccc' }, grid: { display: false } },
      },
    },
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** @param {string} s @returns {string} */
function _esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}

/** @param {{ rate: number, lo: number, hi: number }} ci @returns {string} */
function _pctCi(ci) {
  return `<strong>${(ci.rate * 100).toFixed(1)}%</strong> <span class="ci">[${(ci.lo * 100).toFixed(1)}–${(ci.hi * 100).toFixed(1)}%]</span>`;
}

/** @param {{ mean: number, lo: number, hi: number }} ci @param {number} dp @returns {string} */
function _meanCi(ci, dp) {
  return `<strong>${ci.mean.toFixed(dp)}</strong> <span class="ci">[${ci.lo.toFixed(dp)}–${ci.hi.toFixed(dp)}]</span>`;
}

/** @param {{ p10: number, p50: number, p90: number }} dist @returns {string} */
function _percentiles(dist) {
  const fmt = (v) => (v ?? 0).toFixed(1);
  return `<strong>${fmt(dist.p10)}/${fmt(dist.p50)}/${fmt(dist.p90)}</strong>`;
}

/** @param {string} label @param {string} value @param {string} title @returns {string} */
function _statCard(label, value, title) {
  return `<div class="stat-card" title="${_esc(title)}"><div class="stat-label">${_esc(label)}</div><div class="stat-value">${value}</div></div>`;
}

/** @param {number} n @returns {'green'|'yellow'|'red'} */
function _sampleTier(n) {
  if (n >= 2000) return 'green';
  if (n >= 500) return 'yellow';
  return 'red';
}

/** @param {'green'|'yellow'|'red'} tier @returns {string} */
function _tierBadge(tier) {
  const label = { green: 'Good sample', yellow: 'Borderline sample', red: 'Low sample' }[tier];
  return `<span class="tier-badge tier-${tier}" aria-label="${label}">${label}</span>`;
}

/**
 * Render the agent divergence card: stddev + spread of winrate / floor across
 * agents, plus a compact per-agent breakdown table. Hidden when only one agent
 * participated (divergence is undefined).
 *
 * @param {{ agents: number, winrateStdDev: number, winrateSpread: number, winrateMin: number, winrateMax: number, floorStdDev: number, floorSpread: number, survivalScoreStdDev: number, survivalScoreSpread: number } | undefined} div
 * @param {Record<string, { runCount: number, winrate: { rate: number }, avgFloorReached: { mean: number }, avgSurvivalScore?: { mean: number } }> | undefined} agentStats
 * @returns {string}
 */
function _renderAgentDivergence(div, agentStats) {
  if (!div || div.agents < 2 || !agentStats) return '';

  const rows = Object.entries(agentStats)
    .map(
      ([name, s]) => `
        <tr>
          <td>${_esc(name)}</td>
          <td class="num">${s.runCount.toLocaleString()}</td>
          <td class="num">${(s.winrate.rate * 100).toFixed(1)}%</td>
          <td class="num">${s.avgFloorReached.mean.toFixed(2)}</td>
          <td class="num">${(s.avgSurvivalScore?.mean ?? 0).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `
    <section class="agent-divergence" aria-label="Bot divergence">
      <h3>Bot Divergence</h3>
      <p class="hint">Stddev and spread across ${div.agents} agents — large values mean bots
      disagree on this build's difficulty (useful when winrate itself carries no signal).</p>
      <div class="stats-grid">
        ${_statCard('Winrate σ', `${(div.winrateStdDev * 100).toFixed(2)} pp`, 'Standard deviation of winrate across agents')}
        ${_statCard('Winrate spread', `${(div.winrateSpread * 100).toFixed(1)} pp`, 'max − min winrate across agents')}
        ${_statCard('Floor σ', div.floorStdDev.toFixed(2), 'Standard deviation of avg floor reached across agents')}
        ${_statCard('Floor spread', div.floorSpread.toFixed(2), 'max − min avg floor across agents')}
        ${_statCard('Survival σ', div.survivalScoreStdDev.toFixed(2), 'Standard deviation of avg survival score across agents')}
      </div>
      <table class="agent-table">
        <thead>
          <tr>
            <th>Agent</th><th class="num">Runs</th><th class="num">Winrate</th>
            <th class="num">Avg Floor</th><th class="num">Avg Survival</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}
