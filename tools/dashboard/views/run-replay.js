/**
 * @typedef {{
 *   step: number,
 *   phase: string,
 *   floor: number,
 *   turn: number,
 *   action: Record<string, unknown>,
 * }} TraceEntry
 *
 * @typedef {{
 *   seq?: number,
 *   kind: string,
 *   payload?: Record<string, unknown>,
 * }} EntityEvent
 *
 * @typedef {{
 *   seed?: number | string,
 *   agent?: string,
 *   character?: string,
 *   difficulty?: string,
 *   outcome?: string,
 *   floorReached?: number,
 *   turnsPlayed?: number,
 *   agentTrace?: TraceEntry[],
 *   entityEvents?: EntityEvent[],
 * }} ReplayRecord
 */

/** @type {ReplayRecord | null} */
let _record = null;
/** @type {number} current step index into agentTrace */
let _step = 0;

/**
 * Render View 6 — Run Replay.
 * Accepts a full-tier JSONL record (from runOneGame verbosity=full) and renders
 * the agentTrace step-by-step with a slider, plus a synced event timeline strip.
 *
 * No engine re-execution — pure trace rendering from recorded data.
 *
 * @param {HTMLElement} container
 */
export function renderRunReplay(container) {
  container.innerHTML = `
    <section class="view-run-replay" aria-label="Run Replay">
      <header class="view-header">
        <h2>Run Replay</h2>
      </header>

      <div class="rr-load-area">
        <p class="rr-hint">Load a single <code>full</code>-verbosity JSONL record to replay it step-by-step.</p>
        <div class="rr-load-btns">
          <label class="file-label" for="rr-file-input">📂 Load JSONL record</label>
          <input type="file" id="rr-file-input" accept=".jsonl,.json" aria-label="Load full-tier JSONL record" />
          <button class="rr-paste-btn" id="rr-paste-btn">📋 Paste JSON line</button>
        </div>
        <div id="rr-paste-area" class="rr-paste-area" style="display:none">
          <textarea id="rr-paste-input" class="rr-paste-input" rows="4" placeholder="Paste a single JSONL line here…" aria-label="Paste JSONL record"></textarea>
          <button class="rr-btn" id="rr-paste-confirm">Load</button>
        </div>
        <div id="rr-load-msg" class="rr-load-msg" aria-live="polite"></div>
      </div>

      <div id="rr-player" class="rr-player" style="display:none">
        <div class="rr-meta" id="rr-meta"></div>

        <div class="rr-controls">
          <button class="rr-ctrl-btn" id="rr-first" aria-label="Jump to first step" title="First">&#x23EE;</button>
          <button class="rr-ctrl-btn" id="rr-prev"  aria-label="Previous step"       title="Previous">&#x25C0;</button>
          <input type="range" id="rr-slider" class="rr-slider" min="0" step="1" aria-label="Step" />
          <button class="rr-ctrl-btn" id="rr-next"  aria-label="Next step"           title="Next">&#x25B6;</button>
          <button class="rr-ctrl-btn" id="rr-last"  aria-label="Jump to last step"   title="Last">&#x23ED;</button>
          <span class="rr-step-label" id="rr-step-label"></span>
        </div>

        <div class="rr-main-grid">
          <div class="rr-step-card" id="rr-step-card">
            <h3>Current Step</h3>
            <div id="rr-step-body"></div>
          </div>
          <div class="rr-event-col">
            <h3>Event Timeline <span class="rr-sync-hint">(synced to step)</span></h3>
            <div class="rr-timeline" id="rr-timeline" role="list" aria-label="Event timeline"></div>
          </div>
        </div>
      </div>
    </section>

    <style>
      .rr-hint { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.75rem; }
      .rr-load-btns { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
      #rr-file-input { display: none; }
      .rr-paste-btn {
        background: var(--surface2); border: 1px solid var(--border); color: var(--text-muted);
        border-radius: var(--radius); padding: 0.3rem 0.75rem; cursor: pointer; font-size: 0.8rem;
      }
      .rr-paste-btn:hover { color: var(--text); }
      .rr-paste-area { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
      .rr-paste-input {
        width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text);
        border-radius: var(--radius); padding: 0.5rem; font-family: monospace; font-size: 0.8rem; resize: vertical;
      }
      .rr-btn {
        align-self: flex-start; background: var(--accent); border: none; color: #fff;
        border-radius: var(--radius); padding: 0.35rem 0.9rem; cursor: pointer; font-size: 0.875rem;
      }
      .rr-btn:hover { opacity: 0.85; }
      .rr-load-msg { margin-top: 0.5rem; font-size: 0.825rem; min-height: 1.2em; }
      .rr-load-msg--ok   { color: var(--green); }
      .rr-load-msg--warn { color: var(--yellow); }
      .rr-load-msg--err  { color: var(--red); }

      .rr-player { margin-top: 1.5rem; }

      .rr-meta {
        display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; font-size: 0.825rem;
        color: var(--text-muted); margin-bottom: 1rem;
        background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
        padding: 0.6rem 1rem;
      }
      .rr-meta strong { color: var(--text); }

      .rr-controls {
        display: flex; align-items: center; gap: 0.5rem;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--radius); padding: 0.6rem 0.75rem; margin-bottom: 1rem;
      }
      .rr-ctrl-btn {
        background: transparent; border: 1px solid var(--border); color: var(--text-muted);
        border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer; font-size: 1rem; line-height: 1;
      }
      .rr-ctrl-btn:hover { background: var(--surface2); color: var(--text); }
      .rr-slider { flex: 1; accent-color: var(--accent); cursor: pointer; min-width: 0; }
      .rr-step-label { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; min-width: 80px; text-align: right; }

      .rr-main-grid {
        display: grid; grid-template-columns: 1fr 320px; gap: 1rem;
      }
      @media (max-width: 760px) { .rr-main-grid { grid-template-columns: 1fr; } }

      .rr-step-card {
        background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem;
      }
      .rr-step-card h3, .rr-event-col h3 {
        font-size: 0.85rem; font-weight: 600; color: var(--text-muted);
        text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.75rem;
      }
      .rr-sync-hint { font-size: 0.7rem; font-weight: 400; text-transform: none; letter-spacing: 0; }

      .rr-step-grid {
        display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 1rem; font-size: 0.875rem; align-items: baseline;
      }
      .rr-step-grid dt { color: var(--text-muted); }
      .rr-step-grid dd { font-weight: 500; }
      .rr-action-badge {
        display: inline-block; background: var(--surface2); border: 1px solid var(--accent);
        border-radius: 4px; padding: 0.15rem 0.4rem; font-family: monospace;
        font-size: 0.8rem; color: var(--accent);
      }
      .rr-action-details {
        margin-top: 0.75rem; background: var(--surface2); border-radius: var(--radius);
        padding: 0.6rem 0.75rem; font-family: monospace; font-size: 0.78rem;
        color: var(--text-muted); white-space: pre-wrap; word-break: break-all;
      }

      .rr-event-col {
        background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
        padding: 1rem; display: flex; flex-direction: column;
      }
      .rr-timeline {
        flex: 1; overflow-y: auto; max-height: 420px; display: flex; flex-direction: column; gap: 2px;
      }
      .rr-ev {
        font-size: 0.78rem; padding: 0.3rem 0.5rem; border-radius: 4px; border-left: 3px solid transparent;
        color: var(--text-muted); background: var(--surface2); cursor: default;
        transition: background 0.1s;
      }
      .rr-ev--active { border-left-color: var(--accent); color: var(--text); background: #1e2540; }
      .rr-ev--past   { opacity: 0.55; }
      .rr-ev-kind  { font-weight: 600; color: var(--text); }
      .rr-ev--active .rr-ev-kind { color: var(--accent); }
      .rr-ev-seq   { font-size: 0.7rem; color: var(--text-muted); margin-left: 0.3rem; }
      .rr-ev-payload { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }

      .rr-empty { color: var(--text-muted); font-size: 0.875rem; padding: 0.5rem 0; }
    </style>
  `;

  // ── wire file picker ────────────────────────────────────────────────────────
  const fileInput = /** @type {HTMLInputElement} */ (container.querySelector('#rr-file-input'));
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) =>
      _loadText(/** @type {string} */ (e.target?.result ?? ''), container, file.name);
    reader.readAsText(file);
  });

  // ── wire paste area ─────────────────────────────────────────────────────────
  const pasteBtn = container.querySelector('#rr-paste-btn');
  const pasteArea = /** @type {HTMLElement} */ (container.querySelector('#rr-paste-area'));
  const pasteConfirm = container.querySelector('#rr-paste-confirm');
  const pasteInput = /** @type {HTMLTextAreaElement} */ (
    container.querySelector('#rr-paste-input')
  );

  pasteBtn?.addEventListener('click', () => {
    pasteArea.style.display = pasteArea.style.display === 'none' ? 'flex' : 'none';
  });
  pasteConfirm?.addEventListener('click', () => {
    _loadText(pasteInput.value.trim(), container, 'pasted');
  });

  // ── wire playback controls ──────────────────────────────────────────────────
  container.querySelector('#rr-first')?.addEventListener('click', () => _seek(container, 0));
  container.querySelector('#rr-prev')?.addEventListener('click', () => _seek(container, _step - 1));
  container.querySelector('#rr-next')?.addEventListener('click', () => _seek(container, _step + 1));
  container.querySelector('#rr-last')?.addEventListener('click', () => {
    _seek(container, (_record?.agentTrace?.length ?? 1) - 1);
  });
  container.querySelector('#rr-slider')?.addEventListener('input', (e) => {
    _seek(container, parseInt(/** @type {HTMLInputElement} */ (e.target).value, 10));
  });
}

// ── loading ───────────────────────────────────────────────────────────────────

/**
 * @param {string} text
 * @param {HTMLElement} container
 * @param {string} sourceName
 */
function _loadText(text, container, sourceName) {
  const msg = /** @type {HTMLElement} */ (container.querySelector('#rr-load-msg'));

  // Try each non-empty line until we find one with agentTrace
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  /** @type {ReplayRecord | null} */
  let found = null;

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (Array.isArray(parsed.agentTrace) && parsed.agentTrace.length > 0) {
        found = parsed;
        break;
      }
    } catch {
      // skip non-JSON lines
    }
  }

  if (!found) {
    _setMsg(
      msg,
      `No record with agentTrace[] found in "${sourceName}". Re-run sim with --verbosity full.`,
      'err'
    );
    return;
  }

  _record = found;
  _step = 0;
  _setMsg(msg, `Loaded "${sourceName}" — ${found.agentTrace.length} steps`, 'ok');
  _initPlayer(container);
}

// ── player init ───────────────────────────────────────────────────────────────

/** @param {HTMLElement} container */
function _initPlayer(container) {
  if (!_record) return;
  const trace = _record.agentTrace ?? [];
  const player = /** @type {HTMLElement} */ (container.querySelector('#rr-player'));
  player.style.display = 'block';

  // Meta bar
  const meta = /** @type {HTMLElement} */ (container.querySelector('#rr-meta'));
  meta.innerHTML = [
    `<span>Seed: <strong>${_esc(String(_record.seed ?? '?'))}</strong></span>`,
    `<span>Agent: <strong>${_esc(_record.agent ?? '?')}</strong></span>`,
    `<span>Character: <strong>${_esc(_record.character ?? '?')}</strong></span>`,
    `<span>Difficulty: <strong>${_esc(_record.difficulty ?? 'normal')}</strong></span>`,
    `<span>Outcome: <strong class="${_record.outcome === 'player_win' ? 'lift-pos' : 'lift-neg'}">${_esc(_record.outcome ?? '?')}</strong></span>`,
    `<span>Floor reached: <strong>${_esc(String(_record.floorReached ?? '?'))}</strong></span>`,
    `<span>Steps: <strong>${trace.length}</strong></span>`,
  ].join('');

  // Slider
  const slider = /** @type {HTMLInputElement} */ (container.querySelector('#rr-slider'));
  slider.max = String(Math.max(0, trace.length - 1));
  slider.value = '0';

  // Build timeline once
  _buildTimeline(container);

  _renderStep(container, 0);
}

// ── step rendering ────────────────────────────────────────────────────────────

/**
 * @param {HTMLElement} container
 * @param {number} step
 */
function _seek(container, step) {
  if (!_record) return;
  const max = (_record.agentTrace?.length ?? 1) - 1;
  _step = Math.max(0, Math.min(max, step));
  const slider = /** @type {HTMLInputElement} */ (container.querySelector('#rr-slider'));
  if (slider) slider.value = String(_step);
  _renderStep(container, _step);
}

/**
 * @param {HTMLElement} container
 * @param {number} step
 */
function _renderStep(container, step) {
  if (!_record) return;
  const trace = _record.agentTrace ?? [];
  const entry = trace[step];
  const label = /** @type {HTMLElement} */ (container.querySelector('#rr-step-label'));
  const body = /** @type {HTMLElement} */ (container.querySelector('#rr-step-body'));

  if (label) label.textContent = `Step ${step + 1} / ${trace.length}`;

  if (!entry) {
    if (body) body.innerHTML = `<p class="rr-empty">No step data.</p>`;
    return;
  }

  const actionType = String(entry.action?.type ?? '?');
  const actionDetails = _formatAction(entry.action);

  if (body) {
    body.innerHTML = `
      <dl class="rr-step-grid">
        <dt>Phase</dt>   <dd>${_esc(entry.phase ?? '?')}</dd>
        <dt>Floor</dt>   <dd>${_esc(String(entry.floor ?? '?'))}</dd>
        <dt>Turn</dt>    <dd>${_esc(String(entry.turn ?? '?'))}</dd>
        <dt>Action</dt>  <dd><span class="rr-action-badge">${_esc(actionType)}</span></dd>
      </dl>
      ${actionDetails ? `<pre class="rr-action-details">${_esc(actionDetails)}</pre>` : ''}
    `;
  }

  _syncTimeline(container, step);
}

// ── action formatting ─────────────────────────────────────────────────────────

/** @param {Record<string, unknown>} action @returns {string} */
function _formatAction(action) {
  if (!action) return '';
  const { type: _type, ...rest } = action;
  void _type;
  if (Object.keys(rest).length === 0) return '';
  return JSON.stringify(rest, null, 2);
}

// ── timeline ──────────────────────────────────────────────────────────────────

/** @param {HTMLElement} container */
function _buildTimeline(container) {
  const timeline = /** @type {HTMLElement} */ (container.querySelector('#rr-timeline'));
  if (!timeline || !_record) return;

  const events = _record.entityEvents ?? [];
  if (!events.length) {
    timeline.innerHTML = `<p class="rr-empty">No entityEvents in this record.</p>`;
    return;
  }

  timeline.innerHTML = events
    .map((ev, i) => {
      const payload = ev.payload ? _summarisePayload(ev.payload) : '';
      return `
      <div class="rr-ev" data-ev-idx="${i}" role="listitem">
        <span class="rr-ev-kind">${_esc(ev.kind)}</span>${ev.seq != null ? `<span class="rr-ev-seq">#${ev.seq}</span>` : ''}
        ${payload ? `<div class="rr-ev-payload" title="${_esc(payload)}">${_esc(payload)}</div>` : ''}
      </div>
    `;
    })
    .join('');
}

/**
 * Highlight events whose seq falls within the range of steps already played.
 * Since entityEvents carry `seq` (global monotonic) and trace entries carry
 * step index, we approximate by marking events up to the fraction of trace
 * consumed — or by matching battle/phase events to floor/turn in the entry.
 *
 * Strategy: events with seq <= (step / traceLen * totalSeq) are "past",
 * the nearest one above that threshold is "active".
 *
 * @param {HTMLElement} container
 * @param {number} step
 */
function _syncTimeline(container, step) {
  const timeline = /** @type {HTMLElement} */ (container.querySelector('#rr-timeline'));
  if (!timeline || !_record) return;

  const events = _record.entityEvents ?? [];
  if (!events.length) return;

  const trace = _record.agentTrace ?? [];
  const traceLen = trace.length;
  if (!traceLen) return;

  // Determine the max seq we've "reached" proportionally
  const seqs = events.map((ev) => ev.seq ?? 0).filter((s) => s > 0);
  const maxSeq = seqs.length ? Math.max(...seqs) : 0;
  const threshold = maxSeq > 0 ? (step / Math.max(1, traceLen - 1)) * maxSeq : -1;

  const evEls = timeline.querySelectorAll('.rr-ev');
  let activeIdx = -1;
  // Find the last event at or before the threshold
  for (let i = 0; i < events.length; i++) {
    const seq = events[i].seq ?? 0;
    if (seq <= threshold) activeIdx = i;
  }

  evEls.forEach((el, i) => {
    const div = /** @type {HTMLElement} */ (el);
    div.classList.remove('rr-ev--active', 'rr-ev--past');
    if (i < activeIdx) div.classList.add('rr-ev--past');
    else if (i === activeIdx) div.classList.add('rr-ev--active');
  });

  // Scroll active event into view within the timeline
  if (activeIdx >= 0) {
    const activeEl = /** @type {HTMLElement | null} */ (evEls[activeIdx]);
    activeEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

/** @param {Record<string, unknown>} payload @returns {string} */
function _summarisePayload(payload) {
  const parts = [];
  for (const [k, v] of Object.entries(payload)) {
    if (v == null) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      const inner = v;
      if (typeof inner.id === 'string') {
        parts.push(`${k}:${inner.id}`);
        continue;
      }
      if (typeof inner.name === 'string') {
        parts.push(`${k}:${inner.name}`);
        continue;
      }
    }
    if (typeof v === 'string' || typeof v === 'number') parts.push(`${k}=${v}`);
  }
  return parts.slice(0, 4).join(' ');
}

/**
 * @param {HTMLElement} el
 * @param {string} msg
 * @param {'ok'|'warn'|'err'} level
 */
function _setMsg(el, msg, level) {
  if (!el) return;
  el.textContent = msg;
  el.className = `rr-load-msg rr-load-msg--${level}`;
}

/** @param {string} s @returns {string} */
function _esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}
