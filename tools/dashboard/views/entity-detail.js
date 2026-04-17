/** @import { MetricsJson, EntityStats } from '../app.js' */

/**
 * Render View 3 — Entity Detail for one entity.
 * @param {HTMLElement} container
 * @param {MetricsJson} metrics
 * @param {typeof Chart} Chart
 * @param {string} entityKey  e.g. "card:ciupaga"
 * @param {() => void} onBack
 */
export function renderEntityDetail(container, metrics, Chart, entityKey, onBack) {
  const entity = metrics.byEntity[entityKey];
  if (!entity) {
    container.innerHTML = `<p class="empty-msg">Entity <code>${_esc(entityKey)}</code> not found.</p>`;
    return;
  }

  container.innerHTML = `
    <section class="view-entity-detail" aria-label="Entity Detail: ${_esc(entity.name)}">
      <header class="view-header">
        <button class="back-btn" aria-label="Back to leaderboard">← Back</button>
        <h2>${_esc(entity.name)} <code class="entity-id">${_esc(entity.id)}</code>
          <span class="kind-badge">${_esc(entity.kind)}</span>
        </h2>
        <span class="tier-badge tier-${_esc(entity.sampleTier)}">${_esc(entity.sampleTier)}</span>
      </header>

      <div class="stats-grid">
        ${_statCard('Win Rate w/', _wrRateStr(entity.winrateWithEntity), 'Win rate when present')}
        ${_statCard('Win Rate w/o', _wrRateStr(entity.winrateWithout), 'Win rate when absent')}
        ${_statCard('Lift', _liftHtml(entity), 'Win rate lift in percentage points')}
        ${_statCard('Floor w/', _floorStr(entity.avgFloorReachedWith), 'Avg floor reached when present — useful signal when winrate is 0')}
        ${_statCard('Floor w/o', _floorStr(entity.avgFloorReachedWithout), 'Avg floor reached when absent')}
        ${_statCard('Floor Lift', _floorLiftHtml(entity), 'Floor-reached lift: +positive → entity helps survival')}
        ${entity.pickRate != null ? _statCard('Pick Rate', `${(entity.pickRate * 100).toFixed(1)}%`, 'Fraction of offers accepted') : ''}
        ${_statCard('Runs w/', entity.runsWithEntity.toLocaleString(), 'Runs where entity was present')}
        ${entity.offeredCount ? _statCard('Offered', entity.offeredCount.toLocaleString(), 'Times offered as a reward') : ''}
      </div>

      <div class="detail-sections">
        ${_bySliceHtml(entity)}
        ${_acquisitionSourcesHtml(entity)}
        ${_kindExtensionsHtml(entity)}
      </div>

      <div class="chart-card" style="margin-top:1.5rem">
        <h3>Win Rate: With vs Without</h3>
        <div class="chart-container" style="max-width:400px;margin:auto">
          <canvas id="chart-wr-compare" aria-label="Win rate comparison bar chart"></canvas>
        </div>
      </div>
    </section>
  `;

  container.querySelector('.back-btn')?.addEventListener('click', onBack);
  _drawWrCompare(container, Chart, entity);
}

/**
 * @param {EntityStats} entity
 * @returns {string}
 */
function _bySliceHtml(entity) {
  const slices = Object.entries(entity.bySlice ?? {});
  if (!slices.length) return '';
  return `
    <div class="detail-card">
      <h3>By Slice</h3>
      <table class="detail-table" aria-label="Win rate by run slice">
        <thead><tr><th>Slice</th><th>Win Rate</th><th>Runs</th></tr></thead>
        <tbody>
          ${slices
            .map(([key, s]) => {
              // Analyzer emits { wins, total } per slice; derive winrate on the fly.
              const wr = s.total > 0 ? s.wins / s.total : null;
              return `
            <tr>
              <td><code>${_esc(key)}</code></td>
              <td>${wr != null ? (wr * 100).toFixed(1) + '%' : '—'}</td>
              <td>${s.total?.toLocaleString() ?? '—'}</td>
            </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * @param {EntityStats} entity
 * @returns {string}
 */
function _acquisitionSourcesHtml(entity) {
  const sources = Object.entries(entity.acquisitionSources ?? {});
  if (!sources.length) return '';
  return `
    <div class="detail-card">
      <h3>Acquisition Sources</h3>
      <ul class="source-list">
        ${sources.map(([src, n]) => `<li><span class="source-label">${_esc(src)}</span> <span class="source-count">${n.toLocaleString()}</span></li>`).join('')}
      </ul>
    </div>
  `;
}

/**
 * Per-kind extended stats section.
 * @param {EntityStats} entity
 * @returns {string}
 */
function _kindExtensionsHtml(entity) {
  /** @type {Array<{label: string, value: string, title?: string}>} */
  const fields = [];

  if (entity.kind === 'card') {
    if (entity.avgPlaysPerBattle != null)
      fields.push({ label: 'Avg Plays/Battle', value: entity.avgPlaysPerBattle.toFixed(2) });
    if (entity.damagePerEnergy != null)
      fields.push({ label: 'Damage/Energy', value: entity.damagePerEnergy.toFixed(1) });
  }
  if (entity.kind === 'enemy') {
    if (entity.avgTurnsToKill != null)
      fields.push({ label: 'Avg Turns to Kill', value: entity.avgTurnsToKill.toFixed(1) });
    const weatherEntries = Object.entries(entity.byWeather ?? {});
    if (weatherEntries.length) {
      fields.push({
        label: 'Kill Rate by Weather',
        value: weatherEntries
          .map(([w, c]) => `${w}: ${c.wins}/${c.total} (${((c.winrate ?? 0) * 100).toFixed(0)}%)`)
          .join(', '),
      });
    }
    const floorEntries = Object.entries(entity.byFloor ?? {});
    if (floorEntries.length) {
      fields.push({
        label: 'Kill Rate by Floor',
        value: floorEntries
          .map(([f, c]) => `F${f}: ${c.wins}/${c.total} (${((c.winrate ?? 0) * 100).toFixed(0)}%)`)
          .join(', '),
      });
    }
  }

  if (!fields.length) return '';
  return `
    <div class="detail-card">
      <h3>${entity.kind.charAt(0).toUpperCase() + entity.kind.slice(1)} Stats</h3>
      <dl class="ext-stats">
        ${fields.map((f) => `<dt title="${_esc(f.title ?? '')}">${_esc(f.label)}</dt><dd>${_esc(f.value)}</dd>`).join('')}
      </dl>
    </div>
  `;
}

/**
 * @param {HTMLElement} container
 * @param {typeof Chart} Chart
 * @param {EntityStats} entity
 */
function _drawWrCompare(container, Chart, entity) {
  const canvas = /** @type {HTMLCanvasElement|null} */ (
    container.querySelector('#chart-wr-compare')
  );
  if (!canvas) return;
  const wrWith = entity.winrateWithEntity?.rate;
  const wrWithout = entity.winrateWithout?.rate;
  if (wrWith == null && wrWithout == null) return;

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['With', 'Without'],
      datasets: [
        {
          data: [
            wrWith != null ? +(wrWith * 100).toFixed(1) : null,
            wrWithout != null ? +(wrWithout * 100).toFixed(1) : null,
          ],
          backgroundColor: ['#4f8ef7', '#888'],
          borderRadius: 4,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#aaa', callback: (v) => `${v}%` },
          grid: { color: '#333' },
        },
        x: { ticks: { color: '#ccc' }, grid: { display: false } },
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

/** @param {string} label @param {string} value @param {string} title @returns {string} */
function _statCard(label, value, title) {
  return `<div class="stat-card" title="${_esc(title)}"><div class="stat-label">${_esc(label)}</div><div class="stat-value">${value}</div></div>`;
}

/** @param {EntityStats} entity @returns {string} */
function _liftHtml(entity) {
  if (entity.winrateLiftPp == null) return '—';
  // Analyzer emits lift as a decimal fraction; scale to percentage points for display.
  const v = entity.winrateLiftPp * 100;
  const cls = v >= 5 ? 'lift-pos' : v <= -5 ? 'lift-neg' : '';
  const str = `${v >= 0 ? '+' : ''}${v.toFixed(1)}pp`;
  const ci = entity.liftCi
    ? ` <span class="ci">[${(entity.liftCi.lo * 100).toFixed(1)}–${(entity.liftCi.hi * 100).toFixed(1)}]</span>`
    : '';
  return `<span class="${cls}">${str}</span>${ci}`;
}

/** @param {{ rate: number } | null | undefined} ci @returns {string} */
function _wrRateStr(ci) {
  return ci != null && ci.rate != null ? `${(ci.rate * 100).toFixed(1)}%` : '—';
}

/** @param {number | null | undefined} v @returns {string} */
function _floorStr(v) {
  return v != null ? v.toFixed(2) : '—';
}

/** @param {EntityStats} entity @returns {string} */
function _floorLiftHtml(entity) {
  if (entity.floorReachedLift == null) return '—';
  const v = entity.floorReachedLift;
  const cls = v >= 0.5 ? 'lift-pos' : v <= -0.5 ? 'lift-neg' : '';
  const str = `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
  const ci = entity.floorReachedLiftCi
    ? ` <span class="ci">[${entity.floorReachedLiftCi.lo.toFixed(2)}–${entity.floorReachedLiftCi.hi.toFixed(2)}]</span>`
    : '';
  return `<span class="${cls}">${str}</span>${ci}`;
}
