/** @import { MetricsJson, EntityStats } from '../app.js' */

/**
 * Render View 4 — Enemy Win-Rate Heatmap.
 * Rows = enemies (byEntity where kind==='enemy'), cols = floors (byFloor keys).
 * Colour: green (wr≈1) → red (wr≈0) via CSS background interpolation.
 * @param {HTMLElement} container
 * @param {MetricsJson} metrics
 */
export function renderEnemyHeatmap(container, metrics) {
  const enemies = Object.values(metrics.byEntity).filter((e) => e.kind === 'enemy');

  if (!enemies.length) {
    container.innerHTML = `<p class="empty-msg">No enemy data available.</p>`;
    return;
  }

  // Collect all floor keys across all enemies, sorted numerically
  const floorSet = new Set();
  for (const e of enemies) {
    if (e.byFloor) Object.keys(e.byFloor).forEach((f) => floorSet.add(f));
  }
  const floors = [...floorSet].sort((a, b) => Number(a) - Number(b));

  if (!floors.length) {
    container.innerHTML = `<p class="empty-msg">No byFloor data in this metrics file. Run with writer verbosity "full" to collect floor-level stats.</p>`;
    return;
  }

  const tableRows = enemies
    .map((e) => {
      const cells = floors
        .map((f) => {
          const cell = e.byFloor?.[f];
          if (cell == null || cell.total === 0)
            return `<td class="hm-cell hm-cell--empty" title="Floor ${f}: no data">—</td>`;
          const wr = cell.winrate ?? 0;
          const bg = _wrColor(wr);
          const textColor = wr > 0.55 ? '#0d1a0d' : wr < 0.45 ? '#1a0d0d' : '#1a1a0d';
          return `<td class="hm-cell" style="background:${bg};color:${textColor}" title="Floor ${f}: ${cell.wins}/${cell.total} battles won (${(wr * 100).toFixed(1)}%)">${(wr * 100).toFixed(0)}%</td>`;
        })
        .join('');

      // Aggregate kill rate across all floors — a live signal even when full-run
      // winrate is 0. Reported as wins/total so the reader can judge sample size.
      const killRate = _aggregateKillRate(e.byFloor);
      const avgFloor = e.avgFloorReachedWith != null ? e.avgFloorReachedWith.toFixed(1) : '—';
      return `
      <tr>
        <td class="hm-label">
          <span class="entity-name">${_esc(e.name)}</span>
          <code class="entity-id">${_esc(e.id)}</code>
        </td>
        ${cells}
        <td class="hm-overall" title="Battles won / battles fought across all floors">${killRate}</td>
        <td class="hm-overall" title="Average floor reached by runs that encountered this enemy">${avgFloor}</td>
      </tr>`;
    })
    .join('');

  const headerCols = floors
    .map((f) => `<th scope="col" class="hm-col-head">F${_esc(f)}</th>`)
    .join('');

  container.innerHTML = `
    <section class="view-enemy-heatmap" aria-label="Enemy Heatmap">
      <header class="view-header">
        <h2>Enemy Heatmap</h2>
      </header>
      <p class="hm-desc">Per-battle kill rate by enemy and floor (wins ÷ battles fought). Green = high kill rate, Red = low. Full-run winrate sits in the per-entity views — this heatmap surfaces the battle-level signal even when runs never complete.</p>
      <div class="table-wrapper" style="margin-top:1rem">
        <table class="heatmap-table" aria-label="Enemy kill-rate heatmap by floor">
          <thead>
            <tr>
              <th scope="col" class="hm-label-head">Enemy</th>
              ${headerCols}
              <th scope="col" class="hm-col-head" title="Total wins / total battles across all floors">Kills</th>
              <th scope="col" class="hm-col-head" title="Average floor reached by runs that fought this enemy">Floor w/</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="hm-legend">
        <span class="hm-legend-label">0%</span>
        <div class="hm-legend-bar"></div>
        <span class="hm-legend-label">100%</span>
      </div>
    </section>
    <style>
      .hm-desc { font-size: 0.85rem; color: var(--text-muted); }
      .heatmap-table { border-collapse: collapse; font-size: 0.875rem; }
      .heatmap-table th, .heatmap-table td { padding: 0.5rem 0.65rem; border: 1px solid var(--border); }
      .heatmap-table thead th { background: var(--surface2); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
      .hm-label { min-width: 140px; }
      .hm-label-head { min-width: 140px; text-align: left; }
      .hm-col-head { text-align: center; min-width: 52px; }
      .hm-cell { text-align: center; font-weight: 600; font-size: 0.8rem; }
      .hm-cell--empty { text-align: center; color: var(--text-muted); background: var(--surface); }
      .hm-overall { text-align: center; font-weight: 600; color: var(--text-muted); }
      .hm-legend { display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; }
      .hm-legend-label { font-size: 0.75rem; color: var(--text-muted); }
      .hm-legend-bar {
        flex: 1; max-width: 200px; height: 10px; border-radius: 4px;
        background: linear-gradient(to right, #c0392b, #e67e22, #f1c40f, #6bcf82);
      }
    </style>
  `;
}

/**
 * Aggregate a byFloor record into a "wins/total" string, totalling across floors.
 * Returns "—" when no battles were recorded.
 *
 * @param {Record<string, { wins: number, total: number }> | undefined} byFloor
 * @returns {string}
 */
function _aggregateKillRate(byFloor) {
  if (!byFloor) return '—';
  let wins = 0;
  let total = 0;
  for (const cell of Object.values(byFloor)) {
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
    const r = Math.round(192 + t * (230 - 192));
    const g = Math.round(57 + t * (126 - 57));
    const b = Math.round(43 + t * (34 - 43));
    return `rgb(${r},${g},${b})`;
  }
  if (clamped < 0.6) {
    const t = (clamped - 0.4) / 0.2;
    const r = Math.round(230 + t * (241 - 230));
    const g = Math.round(126 + t * (196 - 126));
    const b = Math.round(34 + t * (15 - 34));
    return `rgb(${r},${g},${b})`;
  }
  const t = (clamped - 0.6) / 0.4;
  const r = Math.round(241 + t * (107 - 241));
  const g = Math.round(196 + t * (207 - 196));
  const b = Math.round(15 + t * (130 - 15));
  return `rgb(${r},${g},${b})`;
}

/** @param {string} s @returns {string} */
function _esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}
