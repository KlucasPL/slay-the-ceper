/** @import { MetricsJson, EntityStats } from '../app.js' */

const KIND_LABELS = {
  card: 'Cards',
  relic: 'Relics',
  boon: 'Boons',
  enemy: 'Enemies',
  event: 'Events',
  weather: 'Weather',
  character: 'Characters',
};

const TIER_RANK = { green: 3, yellow: 2, red: 1 };

/**
 * @typedef {{ key: string, label: string, title: string, type: 'string' | 'number',
 *            getValue: (r: EntityStats) => any, render: (r: EntityStats) => string }} ColumnDef
 *
 * @typedef {{ kind: string, search: string, tierFilter: 'all' | 'yellow' | 'green',
 *            sortKey: string, sortDir: 'asc' | 'desc' }} ViewState
 */

/**
 * Render View 2 — Leaderboard (parameterized by entity kind).
 * @param {HTMLElement} container
 * @param {MetricsJson} metrics
 * @param {typeof Chart} Chart
 * @param {(entityKey: string) => void} onSelectEntity
 */
export function renderLeaderboard(container, metrics, Chart, onSelectEntity) {
  const kinds = _availableKinds(metrics.byEntity);

  container.innerHTML = `
    <section class="view-leaderboard" aria-label="Entity Leaderboard">
      <header class="view-header">
        <h2>Leaderboard</h2>
        <nav class="kind-tabs" role="tablist" aria-label="Entity kind">
          ${kinds
            .map(
              (k, i) => `
            <button role="tab" class="kind-tab${i === 0 ? ' active' : ''}" data-kind="${k}" aria-selected="${i === 0}">
              ${KIND_LABELS[k] ?? k}
            </button>`
            )
            .join('')}
        </nav>
        <div class="leaderboard-controls" role="group" aria-label="Filter and search">
          <label class="leaderboard-control">
            <span>Search</span>
            <input id="leaderboard-search" type="search" placeholder="name or id…" autocomplete="off" />
          </label>
          <label class="leaderboard-control">
            <span>Tier</span>
            <select id="leaderboard-tier">
              <option value="all">All</option>
              <option value="yellow">Green + Yellow</option>
              <option value="green">Green only</option>
            </select>
          </label>
        </div>
      </header>
      <div id="leaderboard-body"></div>
    </section>
  `;

  /** @type {ViewState} */
  const view = {
    kind: kinds[0] ?? 'card',
    search: '',
    tierFilter: 'all',
    sortKey: 'winrateLiftPp',
    sortDir: 'desc',
  };

  const body = /** @type {HTMLElement} */ (container.querySelector('#leaderboard-body'));
  const searchInput = /** @type {HTMLInputElement} */ (
    container.querySelector('#leaderboard-search')
  );
  const tierSelect = /** @type {HTMLSelectElement} */ (
    container.querySelector('#leaderboard-tier')
  );

  const rerender = () => {
    const allRows = _rowsForKind(metrics.byEntity, view.kind);
    const columns = _columnsForKind(view.kind, allRows);
    // Default sort heuristic: when winrate carries no signal (everything ≈ 0),
    // surface floor lift instead so the table always has a meaningful order.
    if (view.sortKey === 'winrateLiftPp' && _allWinratesZero(allRows)) {
      view.sortKey = 'floorReachedLift';
    }
    const visible = _filterAndSort(allRows, view, columns);
    body.innerHTML = _tableHtml(visible, view, columns);
    _drawLiftChart(body, Chart, visible);
    _bindRowClicks(body, onSelectEntity);
    _bindHeaderSorts(body, view, rerender);
  };

  rerender();

  container.addEventListener('click', (e) => {
    const tab = /** @type {HTMLElement} */ (e.target);
    if (!tab.classList.contains('kind-tab')) return;
    const kind = tab.dataset.kind ?? '';
    if (kind === view.kind) return;
    view.kind = kind;
    view.sortKey = 'winrateLiftPp';
    view.sortDir = 'desc';
    container.querySelectorAll('.kind-tab').forEach((t) => {
      const el = /** @type {HTMLElement} */ (t);
      el.classList.toggle('active', el.dataset.kind === kind);
      el.setAttribute('aria-selected', String(el.dataset.kind === kind));
    });
    rerender();
  });

  searchInput?.addEventListener('input', () => {
    view.search = searchInput.value.trim().toLowerCase();
    rerender();
  });

  tierSelect?.addEventListener('change', () => {
    view.tierFilter = /** @type {ViewState['tierFilter']} */ (tierSelect.value);
    rerender();
  });
}

/**
 * @param {Record<string, EntityStats>} byEntity
 * @param {string} kind
 * @returns {EntityStats[]}
 */
function _rowsForKind(byEntity, kind) {
  return Object.values(byEntity).filter((e) => e.kind === kind);
}

/**
 * @param {EntityStats[]} rows
 */
function _allWinratesZero(rows) {
  return rows.length > 0 && rows.every((r) => (r.winrateWithEntity?.rate ?? 0) === 0);
}

/**
 * @param {EntityStats[]} rows
 * @param {ViewState} view
 * @param {ColumnDef[]} columns
 */
function _filterAndSort(rows, view, columns) {
  const minTier =
    view.tierFilter === 'green'
      ? TIER_RANK.green
      : view.tierFilter === 'yellow'
        ? TIER_RANK.yellow
        : 0;
  const search = view.search;
  const filtered = rows.filter((r) => {
    if (TIER_RANK[r.sampleTier] < minTier) return false;
    if (!search) return true;
    return (
      (r.name ?? '').toLowerCase().includes(search) || (r.id ?? '').toLowerCase().includes(search)
    );
  });

  const col = columns.find((c) => c.key === view.sortKey) ?? columns[0];
  const dir = view.sortDir === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    const va = col.getValue(a);
    const vb = col.getValue(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // nulls always sink
    if (vb == null) return -1;
    if (col.type === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
  return filtered;
}

/**
 * Build the column set for a given kind. Hides pick-rate for kinds where it
 * is always null (events, enemies, weather, characters in current pipelines).
 *
 * @param {string} kind
 * @param {EntityStats[]} rows
 * @returns {ColumnDef[]}
 */
function _columnsForKind(kind, rows) {
  /** @type {ColumnDef[]} */
  const cols = [
    {
      key: 'name',
      label: 'Name',
      title: 'Entity name + id',
      type: 'string',
      getValue: (r) => r.name ?? r.id,
      render: (r) =>
        `<span class="entity-name">${_esc(r.name)}</span><code class="entity-id">${_esc(r.id)}</code>`,
    },
  ];

  const hasAnyPickRate = rows.some((r) => r.pickRate != null);
  if (hasAnyPickRate) {
    cols.push({
      key: 'pickRate',
      label: 'Pick Rate',
      title: 'Acquired / offered (cards) or acquired / runs (relics, boons)',
      type: 'number',
      getValue: (r) => r.pickRate,
      render: (r) => (r.pickRate != null ? `${(r.pickRate * 100).toFixed(1)}%` : '—'),
    });
  }

  cols.push(
    {
      key: 'winrateWith',
      label: 'WR w/',
      title: 'Win rate in runs where entity was present',
      type: 'number',
      getValue: (r) => r.winrateWithEntity?.rate ?? null,
      render: (r) =>
        r.winrateWithEntity?.rate != null ? `${(r.winrateWithEntity.rate * 100).toFixed(1)}%` : '—',
    },
    {
      key: 'winrateWithout',
      label: 'WR w/o',
      title: 'Win rate in runs without entity',
      type: 'number',
      getValue: (r) => r.winrateWithout?.rate ?? null,
      render: (r) =>
        r.winrateWithout?.rate != null ? `${(r.winrateWithout.rate * 100).toFixed(1)}%` : '—',
    },
    {
      key: 'winrateLiftPp',
      label: 'Lift pp',
      title: 'Win-rate lift in percentage points (with – without)',
      type: 'number',
      getValue: (r) => r.winrateLiftPp,
      render: (r) => _renderLift(r.winrateLiftPp, r.liftCi),
    },
    {
      key: 'avgFloorReachedWith',
      label: 'Floor w/',
      title: 'Average deepest floor reached when entity was present',
      type: 'number',
      getValue: (r) => r.avgFloorReachedWith,
      render: (r) => (r.avgFloorReachedWith != null ? r.avgFloorReachedWith.toFixed(1) : '—'),
    },
    {
      key: 'floorReachedLift',
      label: 'Floor lift',
      title: 'Floor-reached lift (with – without)',
      type: 'number',
      getValue: (r) => r.floorReachedLift,
      render: (r) => _renderFloorLift(r.floorReachedLift, r.floorReachedLiftCi),
    },
    {
      key: 'sampleTier',
      label: 'Tier',
      title: 'Sample tier — green = ≥2k runs, yellow = ≥500, red = under',
      type: 'number',
      getValue: (r) => TIER_RANK[r.sampleTier] ?? 0,
      render: (r) => _tierBadge(r.sampleTier),
    }
  );

  return cols;
}

/**
 * @param {EntityStats[]} rows
 * @param {ViewState} view
 * @param {ColumnDef[]} columns
 * @returns {string}
 */
function _tableHtml(rows, view, columns) {
  if (!rows.length)
    return `<p class="empty-msg">No matching ${KIND_LABELS[view.kind] ?? view.kind} rows.</p>`;

  return `
    <div class="leaderboard-meta">${rows.length} row${rows.length === 1 ? '' : 's'}</div>
    <div class="table-wrapper">
      <table class="leaderboard-table" aria-label="${KIND_LABELS[view.kind] ?? view.kind} leaderboard">
        <thead>
          <tr>
            ${columns.map((c) => _headerCell(c, view)).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr class="leaderboard-row" data-entity-key="${r.kind}:${r.id}" tabindex="0" role="button" aria-label="Detail for ${_esc(r.name)}">
              ${columns.map((c) => `<td>${c.render(r)}</td>`).join('')}
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="chart-card" style="margin-top:1.5rem">
      <h3>Lift pp — ${KIND_LABELS[view.kind] ?? view.kind}</h3>
      <div class="chart-container">
        <canvas id="chart-lift" aria-label="Lift in percentage points bar chart"></canvas>
      </div>
    </div>
  `;
}

/**
 * @param {ColumnDef} col
 * @param {ViewState} view
 */
function _headerCell(col, view) {
  const active = col.key === view.sortKey;
  const arrow = active ? (view.sortDir === 'asc' ? ' ▲' : ' ▼') : '';
  return `<th scope="col" class="${active ? 'sort-active' : ''}" data-sort-key="${col.key}" title="${_esc(col.title)}" tabindex="0">${_esc(col.label)}${arrow}</th>`;
}

/** @param {number | null} liftPp @param {{ lo: number, hi: number } | null} ci */
function _renderLift(liftPp, ci) {
  if (liftPp == null) return '—';
  const pp = liftPp * 100;
  const cls = pp >= 5 ? 'lift-pos' : pp <= -5 ? 'lift-neg' : '';
  const ciStr = ci
    ? ` <span class="ci">[${(ci.lo * 100).toFixed(1)}–${(ci.hi * 100).toFixed(1)}]</span>`
    : '';
  return `<span class="${cls}">${pp >= 0 ? '+' : ''}${pp.toFixed(1)}pp${ciStr}</span>`;
}

/** @param {number | null} lift @param {{ lo: number, hi: number } | null} ci */
function _renderFloorLift(lift, ci) {
  if (lift == null) return '—';
  const cls = lift >= 0.5 ? 'lift-pos' : lift <= -0.5 ? 'lift-neg' : '';
  const ciStr = ci ? ` <span class="ci">[${ci.lo.toFixed(2)}–${ci.hi.toFixed(2)}]</span>` : '';
  return `<span class="${cls}">${lift >= 0 ? '+' : ''}${lift.toFixed(2)}${ciStr}</span>`;
}

/**
 * @param {HTMLElement} container
 * @param {typeof Chart} Chart
 * @param {EntityStats[]} rows
 */
function _drawLiftChart(container, Chart, rows) {
  const canvas = /** @type {HTMLCanvasElement|null} */ (container.querySelector('#chart-lift'));
  if (!canvas || !rows.length) return;

  const labels = rows.map((r) => r.name);
  const values = rows.map((r) => (r.winrateLiftPp ?? 0) * 100);
  const colors = values.map((v) => (v >= 0 ? '#6bcf82' : '#e06060'));

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Lift pp',
          data: values,
          backgroundColor: colors,
          borderRadius: 3,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: '#aaa', callback: (v) => `${v}pp` },
          grid: { color: '#333' },
        },
        y: { ticks: { color: '#ccc' }, grid: { display: false } },
      },
    },
  });
}

/**
 * @param {HTMLElement} body
 * @param {(key: string) => void} onSelect
 */
function _bindRowClicks(body, onSelect) {
  body.querySelectorAll('.leaderboard-row').forEach((row) => {
    const el = /** @type {HTMLElement} */ (row);
    const handler = () => onSelect(el.dataset.entityKey ?? '');
    el.addEventListener('click', handler);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  });
}

/**
 * @param {HTMLElement} body
 * @param {ViewState} view
 * @param {() => void} rerender
 */
function _bindHeaderSorts(body, view, rerender) {
  body.querySelectorAll('th[data-sort-key]').forEach((th) => {
    const el = /** @type {HTMLElement} */ (th);
    const apply = () => {
      const key = el.dataset.sortKey;
      if (!key) return;
      if (view.sortKey === key) {
        view.sortDir = view.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        view.sortKey = key;
        view.sortDir = key === 'name' ? 'asc' : 'desc';
      }
      rerender();
    };
    el.addEventListener('click', apply);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        apply();
      }
    });
  });
}

/**
 * @param {Record<string, EntityStats>} byEntity
 * @returns {string[]}
 */
function _availableKinds(byEntity) {
  const seen = new Set();
  for (const e of Object.values(byEntity)) seen.add(e.kind);
  const order = ['card', 'relic', 'boon', 'enemy', 'event', 'weather', 'character'];
  return order.filter((k) => seen.has(k));
}

/** @param {string} s @returns {string} */
function _esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}

/** @param {string} tier @returns {string} */
function _tierBadge(tier) {
  return `<span class="tier-badge tier-${_esc(tier)}">${_esc(tier)}</span>`;
}
