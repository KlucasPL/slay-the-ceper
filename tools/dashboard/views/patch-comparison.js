/** @import { MetricsJson, EntityStats } from '../app.js' */

/**
 * Render View 7 — Patch Comparison.
 * Diffs two MetricsJson files side-by-side on winrate, liftPp, pickRate per entity.
 * Refuses to render if configHash or poolOverridesHash differ between the two files.
 * @param {HTMLElement} container
 * @param {MetricsJson} metricsA
 * @param {MetricsJson | null} metricsB
 */
export function renderPatchComparison(container, metricsA, metricsB) {
  if (!metricsB) {
    container.innerHTML = `
      <section class="view-patch-comparison" aria-label="Patch Comparison">
        <header class="view-header">
          <h2>Patch Comparison</h2>
        </header>
        <div class="patch-drop-zone" id="patch-drop-b">
          <p>Drop or load a second <code>metrics.json</code> to compare against the current file.</p>
          <label class="file-label" for="patch-file-b-input" style="margin-top:0.75rem;display:inline-block">
            📂 Load second metrics.json
          </label>
          <input type="file" id="patch-file-b-input" accept=".json" aria-label="Load second metrics JSON for comparison" />
        </div>
      </section>
      <style>
        .patch-drop-zone {
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          padding: 2.5rem;
          text-align: center;
          color: var(--text-muted);
          margin-top: 1rem;
        }
      </style>
    `;
    return;
  }

  // Guard: refuse diff when config or pool hashes differ
  if (
    metricsA.configHash !== metricsB.configHash ||
    metricsA.poolOverridesHash !== metricsB.poolOverridesHash
  ) {
    const hashDiffs = [];
    if (metricsA.configHash !== metricsB.configHash) {
      hashDiffs.push(
        `configHash: <code>${_esc(metricsA.configHash)}</code> vs <code>${_esc(metricsB.configHash)}</code>`
      );
    }
    if (metricsA.poolOverridesHash !== metricsB.poolOverridesHash) {
      hashDiffs.push(
        `poolOverridesHash: <code>${_esc(metricsA.poolOverridesHash)}</code> vs <code>${_esc(metricsB.poolOverridesHash)}</code>`
      );
    }
    container.innerHTML = `
      <section class="view-patch-comparison" aria-label="Patch Comparison">
        <header class="view-header">
          <h2>Patch Comparison — Refused</h2>
        </header>
        <div class="diagnostic-warn" role="alert" style="margin-top:1rem">
          <strong>Cannot compare: configuration mismatch.</strong><br>
          Diffing runs with different configs or pool overrides would produce misleading results.<br><br>
          ${hashDiffs.map((d) => `<div>${d}</div>`).join('')}
        </div>
      </section>
    `;
    return;
  }

  const allKeys = new Set([...Object.keys(metricsA.byEntity), ...Object.keys(metricsB.byEntity)]);

  const rows = [...allKeys]
    .map((key) => {
      const a = metricsA.byEntity[key] ?? null;
      const b = metricsB.byEntity[key] ?? null;
      return { key, a, b };
    })
    .sort((x, y) => {
      const diffA = _wrDiff(x.a, x.b);
      const diffB = _wrDiff(y.a, y.b);
      return Math.abs(diffB ?? 0) - Math.abs(diffA ?? 0);
    });

  const headerA = `${_esc(metricsA.batchName)} <span class="ci">(${metricsA.runCount.toLocaleString()} runs)</span>`;
  const headerB = `${_esc(metricsB.batchName)} <span class="ci">(${metricsB.runCount.toLocaleString()} runs)</span>`;

  const tableRows = rows
    .map(({ key, a, b }) => {
      const name = a?.name ?? b?.name ?? key;
      const kind = a?.kind ?? b?.kind ?? '?';
      const wrA = a?.winrateWithEntity?.rate ?? null;
      const wrB = b?.winrateWithEntity?.rate ?? null;
      const liftA = a?.winrateLiftPp ?? null;
      const liftB = b?.winrateLiftPp ?? null;
      const prA = a?.pickRate;
      const prB = b?.pickRate;

      const wrDiff = wrA != null && wrB != null ? wrB - wrA : null;
      const liftDiff = liftA != null && liftB != null ? liftB - liftA : null;
      const prDiff = prA != null && prB != null ? prB - prA : null;

      return `
      <tr>
        <td>
          <span class="entity-name">${_esc(name)}</span>
          <code class="entity-id">${_esc(key)}</code>
        </td>
        <td><span class="kind-badge">${_esc(kind)}</span></td>
        <td>${_pct(wrA)}</td>
        <td>${_pct(wrB)}</td>
        <td class="${_diffClass(wrDiff, 0.02)}">${_diffPct(wrDiff)}</td>
        <td>${_pp(liftA)}</td>
        <td>${_pp(liftB)}</td>
        <td class="${_diffClass(liftDiff, 0.02)}">${_diffPp(liftDiff)}</td>
        <td>${_pct(prA)}</td>
        <td>${_pct(prB)}</td>
        <td class="${_diffClass(prDiff, 0.05)}">${_diffPct(prDiff)}</td>
      </tr>`;
    })
    .join('');

  container.innerHTML = `
    <section class="view-patch-comparison" aria-label="Patch Comparison">
      <header class="view-header">
        <h2>Patch Comparison</h2>
      </header>
      <div class="patch-headers">
        <div class="patch-header-a"><strong>A:</strong> ${headerA}</div>
        <div class="patch-header-b"><strong>B:</strong> ${headerB}</div>
      </div>
      <div class="patch-meta">
        <span class="meta-item">configHash: <code>${_esc(metricsA.configHash)}</code></span>
        <span class="meta-item">poolOverridesHash: <code>${_esc(metricsA.poolOverridesHash)}</code></span>
      </div>
      <div class="table-wrapper" style="margin-top:1rem">
        <table class="patch-table" aria-label="Patch comparison by entity">
          <thead>
            <tr>
              <th rowspan="2" scope="col">Entity</th>
              <th rowspan="2" scope="col">Kind</th>
              <th colspan="3" scope="colgroup" class="group-head">Win Rate w/</th>
              <th colspan="3" scope="colgroup" class="group-head">Lift pp</th>
              <th colspan="3" scope="colgroup" class="group-head">Pick Rate</th>
            </tr>
            <tr>
              <th scope="col" class="sub-head">A</th>
              <th scope="col" class="sub-head">B</th>
              <th scope="col" class="sub-head">Δ</th>
              <th scope="col" class="sub-head">A</th>
              <th scope="col" class="sub-head">B</th>
              <th scope="col" class="sub-head">Δ</th>
              <th scope="col" class="sub-head">A</th>
              <th scope="col" class="sub-head">B</th>
              <th scope="col" class="sub-head">Δ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </section>
    <style>
      .patch-headers { display: flex; gap: 2rem; font-size: 0.875rem; margin-bottom: 0.5rem; }
      .patch-header-a, .patch-header-b { color: var(--text-muted); }
      .patch-meta { display: flex; gap: 1.5rem; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem; }
      .patch-table { border-collapse: collapse; font-size: 0.875rem; width: 100%; }
      .patch-table th, .patch-table td { padding: 0.5rem 0.7rem; border: 1px solid var(--border); }
      .patch-table thead th { background: var(--surface2); color: var(--text-muted); text-align: center; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
      .patch-table thead th:first-child { text-align: left; }
      .group-head { border-bottom: none !important; }
      .sub-head { font-size: 0.7rem; }
      .patch-table td { text-align: center; vertical-align: middle; }
      .patch-table td:first-child { text-align: left; }
      .diff-pos { color: var(--green); font-weight: 600; }
      .diff-neg { color: var(--red); font-weight: 600; }
      .diff-neutral { color: var(--text-muted); }
    </style>
  `;
}

/** @param {EntityStats|null} a @param {EntityStats|null} b @returns {number|null} */
function _wrDiff(a, b) {
  const wrA = a?.winrateWithEntity?.rate ?? null;
  const wrB = b?.winrateWithEntity?.rate ?? null;
  return wrA != null && wrB != null ? wrB - wrA : null;
}

/** @param {number|null|undefined} v @returns {string} */
function _pct(v) {
  return v != null ? `${(v * 100).toFixed(1)}%` : '—';
}

/**
 * @param {number|null|undefined} v lift as decimal fraction (analyzer output)
 * @returns {string}
 */
function _pp(v) {
  if (v == null) return '—';
  const pp = v * 100;
  return `${pp >= 0 ? '+' : ''}${pp.toFixed(1)}pp`;
}

/** @param {number|null} d @returns {string} */
function _diffPct(d) {
  if (d == null) return '—';
  const s = (d * 100).toFixed(1);
  return d >= 0 ? `+${s}%` : `${s}%`;
}

/**
 * @param {number|null} d delta of lift fractions (analyzer output)
 * @returns {string}
 */
function _diffPp(d) {
  if (d == null) return '—';
  const pp = d * 100;
  return pp >= 0 ? `+${pp.toFixed(1)}pp` : `${pp.toFixed(1)}pp`;
}

/**
 * @param {number|null} diff
 * @param {number} threshold absolute value threshold for colouring
 * @returns {string}
 */
function _diffClass(diff, threshold) {
  if (diff == null) return '';
  if (diff > threshold) return 'diff-pos';
  if (diff < -threshold) return 'diff-neg';
  return 'diff-neutral';
}

/** @param {string} s @returns {string} */
function _esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}
