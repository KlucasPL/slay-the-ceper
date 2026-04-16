import { enemyLibrary } from '../../data/enemies.js';
import { eventLibrary } from '../../data/events.js';
import { relicLibrary } from '../../data/relics.js';

const STYLE_ID = 'debug-overlay-style';

export class DebugOverlay {
  /**
   * @param {{ state: import('../../state/GameState.js').GameState, ui: import('../UIManager.js').UIManager }} options
   */
  constructor({ state, ui }) {
    this.state = state;
    this.ui = ui;
    /** @type {HTMLElement | null} */
    this.root = null;
    /** @type {HTMLElement | null} */
    this.logEl = null;
    /** @type {'map' | 'battle' | 'player'} */
    this.activeTab = 'map';
  }

  mount() {
    this._ensureStyles();
    this.root = this._buildUI();
    document.body.appendChild(this.root);
    this._bindToggleKeys();
    this._log('Debug overlay ready. Use ~ or F9 to toggle.');
  }

  _ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .debug-overlay {
        position: fixed;
        top: 0;
        right: 0;
        width: min(420px, 92vw);
        height: 100vh;
        z-index: 99999;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        background: rgba(10, 14, 20, 0.88);
        border-left: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: -10px 0 24px rgba(0, 0, 0, 0.45);
        color: #ecf3ff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .debug-overlay.hidden { display: none; }
      .debug-overlay-header {
        padding: 10px 12px;
        font-size: 13px;
        letter-spacing: 0.4px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.04);
      }
      .debug-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 10px 12px; }
      .debug-tab {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.06);
        color: #e7f1ff;
        padding: 6px 8px;
        cursor: pointer;
        font-size: 12px;
      }
      .debug-tab.active { background: rgba(95, 189, 255, 0.24); border-color: rgba(95, 189, 255, 0.55); }
      .debug-body { overflow-y: auto; padding: 0 12px 8px; }
      .debug-panel { display: none; }
      .debug-panel.active { display: block; }
      .debug-group { border: 1px solid rgba(255, 255, 255, 0.14); margin-bottom: 10px; padding: 8px; }
      .debug-group-title { font-size: 12px; margin-bottom: 8px; color: #cde6ff; }
      .debug-row { display: grid; gap: 6px; margin-bottom: 8px; }
      .debug-row.inline { grid-template-columns: 1fr auto; align-items: center; }
      .debug-row.triple { grid-template-columns: 1fr 1fr 1fr; }
      .debug-input, .debug-select, .debug-button {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: #f2f7ff;
        padding: 6px 8px;
        font-size: 12px;
      }
      .debug-button { cursor: pointer; }
      .debug-toggle { display: flex; align-items: center; gap: 8px; font-size: 12px; }
      .debug-log {
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(0, 0, 0, 0.35);
        height: 140px;
        overflow-y: auto;
        padding: 8px 10px;
        font-size: 11px;
        line-height: 1.4;
      }
      .debug-log-line { margin-bottom: 4px; color: #c8e7ff; }
    `;
    document.head.appendChild(style);
  }

  _bindToggleKeys() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F9' || event.key === '`' || event.key === '~') {
        event.preventDefault();
        this.root?.classList.toggle('hidden');
      }
    });
  }

  _buildUI() {
    const root = document.createElement('aside');
    root.className = 'debug-overlay hidden';

    const header = document.createElement('div');
    header.className = 'debug-overlay-header';
    header.textContent = 'DEBUG OVERLAY';

    const tabs = document.createElement('div');
    tabs.className = 'debug-tabs';

    const mapTabBtn = this._makeTabButton('MAP', 'map');
    const battleTabBtn = this._makeTabButton('BATTLE', 'battle');
    const playerTabBtn = this._makeTabButton('PLAYER', 'player');
    tabs.append(mapTabBtn, battleTabBtn, playerTabBtn);

    const body = document.createElement('div');
    body.className = 'debug-body';

    const mapPanel = this._buildMapPanel();
    const battlePanel = this._buildBattlePanel();
    const playerPanel = this._buildPlayerPanel();
    body.append(mapPanel, battlePanel, playerPanel);

    this._setActiveTab(
      'map',
      [mapTabBtn, battleTabBtn, playerTabBtn],
      [mapPanel, battlePanel, playerPanel]
    );

    this.logEl = document.createElement('div');
    this.logEl.className = 'debug-log';

    root.append(header, tabs, body, this.logEl);
    return root;
  }

  _buildMapPanel() {
    const panel = document.createElement('section');
    panel.className = 'debug-panel';
    panel.dataset.tab = 'map';

    const mapRowsGroup = this._group('Map Rows');
    const rowsLabel = document.createElement('div');
    rowsLabel.textContent = `Rows: ${this.state.debugMapRows}`;
    const rowsSlider = document.createElement('input');
    rowsSlider.className = 'debug-input';
    rowsSlider.type = 'range';
    rowsSlider.min = '10';
    rowsSlider.max = '25';
    rowsSlider.value = String(this.state.debugMapRows);
    rowsSlider.addEventListener('input', () => {
      rowsLabel.textContent = `Rows: ${rowsSlider.value}`;
      this.state.setDebugMapRows(Number(rowsSlider.value));
    });

    const regenBtn = this._button('Regenerate Map', () => {
      this.state.generateMap(this.state.debugMapRows);
      this.ui.applyDebugRefresh({ checkWin: false, refreshMap: true });
      this._log(`Regenerated map with ${this.state.debugMapRows} rows.`);
    });

    mapRowsGroup.append(rowsLabel, rowsSlider, regenBtn);

    const overrideGroup = this._group('Node Override');
    const overrideSelect = document.createElement('select');
    overrideSelect.className = 'debug-select';
    [
      { value: '', label: 'Disabled' },
      { value: 'elite', label: 'Elite' },
      { value: 'shop', label: 'Shop' },
      { value: 'campfire', label: 'Watra' },
      { value: 'treasure', label: 'Treasure' },
      { value: 'boss', label: 'Boss' },
    ].forEach((entry) => {
      const opt = document.createElement('option');
      opt.value = entry.value;
      opt.textContent = entry.label;
      overrideSelect.appendChild(opt);
    });
    overrideSelect.addEventListener('change', () => {
      const value = overrideSelect.value || null;
      this.state.setDebugNextNodeType(value);
      this._log(value ? `Next node override: ${value}` : 'Next node override disabled.');
    });

    const fogToggleWrap = document.createElement('label');
    fogToggleWrap.className = 'debug-toggle';
    const fogToggle = document.createElement('input');
    fogToggle.type = 'checkbox';
    fogToggle.checked = this.state.debugRevealAllMap;
    fogToggle.addEventListener('change', () => {
      this.state.setDebugRevealAllMap(fogToggle.checked);
      this.ui.applyDebugRefresh({ checkWin: false, refreshMap: true });
      this._log(`Fog of war: ${fogToggle.checked ? 'revealed' : 'default'}.`);
    });
    const fogLabel = document.createElement('span');
    fogLabel.textContent = 'Reveal all nodes and paths';
    fogToggleWrap.append(fogToggle, fogLabel);

    overrideGroup.append(overrideSelect, fogToggleWrap);

    const eventGroup = this._group('Event Tools');
    const eventSelect = document.createElement('select');
    eventSelect.className = 'debug-select';
    Object.values(eventLibrary)
      .sort((a, b) => a.title.localeCompare(b.title, 'pl'))
      .forEach((eventDef) => {
        const opt = document.createElement('option');
        opt.value = eventDef.id;
        opt.textContent = `${eventDef.title} (${eventDef.id})`;
        eventSelect.appendChild(opt);
      });
    const spawnEventBtn = this._button('Spawn Selected Event', () => {
      const eventId = eventSelect.value;
      const started = this.ui.launchDebugEvent(eventId);
      const eventTitle = eventLibrary[eventId]?.title ?? eventId;
      this._log(started ? `Spawned event: ${eventTitle}` : `Failed to spawn event: ${eventTitle}`);
    });
    eventGroup.append(eventSelect, spawnEventBtn);

    panel.append(mapRowsGroup, overrideGroup, eventGroup);
    return panel;
  }

  _buildBattlePanel() {
    const panel = document.createElement('section');
    panel.className = 'debug-panel';
    panel.dataset.tab = 'battle';

    const spawnGroup = this._group('Enemy Spawner');
    const enemySelect = document.createElement('select');
    enemySelect.className = 'debug-select';
    Object.keys(enemyLibrary)
      .filter((enemyId) => !enemyLibrary[enemyId]?.tutorialOnly)
      .sort((a, b) => a.localeCompare(b))
      .forEach((enemyId) => {
        const opt = document.createElement('option');
        opt.value = enemyId;
        opt.textContent = enemyId;
        enemySelect.appendChild(opt);
      });
    const spawnBtn = this._button('Launch Battle', () => {
      const started = this.ui.launchDebugBattle(enemySelect.value);
      if (started) {
        this._syncEnemyHpControl(enemyHpSlider, enemyHpLabel);
        this._log(`Spawned enemy: ${enemySelect.value}`);
      }
    });
    spawnGroup.append(enemySelect, spawnBtn);

    const statusGroup = this._group('Status Injector');
    const weakBtn = this._button('Weak (2)', () => this._applyBattleStatus('weak', 2));
    const vulnBtn = this._button('Vulnerable (2)', () => this._applyBattleStatus('vulnerable', 2));
    const frailBtn = this._button('Frail (2)', () => this._applyBattleStatus('fragile', 2));
    const stunBtn = this._button('Stun (1)', () => this._applyBattleStatus('stun', 1));
    const statusRow = document.createElement('div');
    statusRow.className = 'debug-row triple';
    statusRow.append(weakBtn, vulnBtn, frailBtn);
    statusGroup.append(statusRow, stunBtn);

    const hpGroup = this._group('Enemy HP');
    const enemyHpLabel = document.createElement('div');
    const enemyHpSlider = document.createElement('input');
    enemyHpSlider.className = 'debug-input';
    enemyHpSlider.type = 'range';
    enemyHpSlider.min = '0';
    enemyHpSlider.addEventListener('input', () => {
      this.state.enemy.hp = Number(enemyHpSlider.value);
      if (typeof this.state._checkEnemyBankruptcy === 'function') {
        this.state._checkEnemyBankruptcy();
      }
      this.ui.applyDebugRefresh();
      this._syncEnemyHpControl(enemyHpSlider, enemyHpLabel);
      this._log(`Set enemy HP to ${this.state.enemy.hp}.`);
    });
    const killBtn = this._button('Insta-Kill', () => {
      this.state.enemy.hp = 0;
      this.ui.applyDebugRefresh();
      this._syncEnemyHpControl(enemyHpSlider, enemyHpLabel);
      this._log('Enemy HP set to 0.');
    });
    hpGroup.append(enemyHpLabel, enemyHpSlider, killBtn);

    const actionGroup = this._group('Actions');
    const resetBtn = this._button('Reset Current Turn Actions', () => {
      this.state.resetCurrentTurnActions();
      this.ui.applyDebugRefresh({ checkWin: false });
      this._log('Reset current turn actions.');
    });
    actionGroup.append(resetBtn);

    panel.append(spawnGroup, statusGroup, hpGroup, actionGroup);
    this._syncEnemyHpControl(enemyHpSlider, enemyHpLabel);
    return panel;
  }

  _buildPlayerPanel() {
    const panel = document.createElement('section');
    panel.className = 'debug-panel';
    panel.dataset.tab = 'player';

    const goldGroup = this._group('Economy');
    const goldInput = document.createElement('input');
    goldInput.className = 'debug-input';
    goldInput.type = 'number';
    goldInput.value = String(this.state.dutki);
    const setGoldBtn = this._button('Set Dutki', () => {
      this.state.dutki = Math.max(0, Math.floor(Number(goldInput.value) || 0));
      this.ui.applyDebugRefresh({ checkWin: false });
      this._log(`Set dutki to ${this.state.dutki}.`);
    });
    goldGroup.append(goldInput, setGoldBtn);

    const relicGroup = this._group('Relic Grant');
    const relicSelect = document.createElement('select');
    relicSelect.className = 'debug-select';
    Object.keys(relicLibrary)
      .sort((a, b) => a.localeCompare(b))
      .forEach((relicId) => {
        const opt = document.createElement('option');
        opt.value = relicId;
        opt.textContent = relicId;
        relicSelect.appendChild(opt);
      });

    const grantRelicBtn = this._button('Grant Selected Relic', () => {
      const added = this.state.addRelic(relicSelect.value);
      this.ui.applyDebugRefresh({ checkWin: false });
      this._log(
        added ? `Granted relic: ${relicSelect.value}` : `Relic not added: ${relicSelect.value}`
      );
    });

    const randomRelicBtn = this._button('Grant Random Relic', () => {
      const available = Object.keys(relicLibrary).filter((id) => !this.state.relics.includes(id));
      if (available.length === 0) {
        this._log('No relics left to grant.');
        return;
      }
      const randomId = available[Math.floor(Math.random() * available.length)];
      this.state.addRelic(randomId);
      this.ui.applyDebugRefresh({ checkWin: false });
      this._log(`Granted random relic: ${randomId}`);
    });

    relicGroup.append(relicSelect, grantRelicBtn, randomRelicBtn);

    const playerGroup = this._group('Player');
    const godModeWrap = document.createElement('label');
    godModeWrap.className = 'debug-toggle';
    const godModeToggle = document.createElement('input');
    godModeToggle.type = 'checkbox';
    godModeToggle.checked = this.state.debugGodMode;
    godModeToggle.addEventListener('change', () => {
      this.state.setDebugGodMode(godModeToggle.checked);
      this._log(`God mode: ${godModeToggle.checked ? 'ON' : 'OFF'}.`);
    });
    const godModeLabel = document.createElement('span');
    godModeLabel.textContent = 'God Mode (player takes 0 damage)';
    godModeWrap.append(godModeToggle, godModeLabel);

    const fullHealBtn = this._button('Full Heal', () => {
      this.state.player.hp = this.state.player.maxHp;
      this.ui.applyDebugRefresh({ checkWin: false });
      this._log(`Player healed to ${this.state.player.maxHp}.`);
    });

    playerGroup.append(godModeWrap, fullHealBtn);

    const playerStatusGroup = this._group('Player Status Injector');
    /** @type {Array<{value: string, label: string, numeric: boolean}>} */
    const playerStatuses = [
      { value: 'lans', label: 'Lans', numeric: false },
      { value: 'strength', label: 'Siła +1', numeric: true },
      { value: 'weak', label: 'Słaby +2', numeric: true },
      { value: 'fragile', label: 'Kruchy +2', numeric: true },
      { value: 'vulnerable', label: 'Wrażliwy +2', numeric: true },
      { value: 'next_double', label: 'Next Double', numeric: false },
      { value: 'energy_next_turn', label: 'Energia +1', numeric: true },
      { value: 'duma_podhala', label: 'Duma Podhala +1', numeric: true },
      { value: 'furia_turysty', label: 'Furia Turysty +1', numeric: true },
    ];

    const playerStatusSelect = document.createElement('select');
    playerStatusSelect.className = 'debug-select';
    playerStatuses.forEach(({ value, label }) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      playerStatusSelect.appendChild(opt);
    });

    const playerStatusAmountInput = document.createElement('input');
    playerStatusAmountInput.className = 'debug-input';
    playerStatusAmountInput.type = 'number';
    playerStatusAmountInput.min = '0';
    playerStatusAmountInput.max = '10';
    playerStatusAmountInput.value = '1';

    const playerStatusAmountRow = document.createElement('div');
    playerStatusAmountRow.className = 'debug-row inline';
    const playerStatusAmountLabel = document.createElement('span');
    playerStatusAmountLabel.textContent = 'Amount';
    playerStatusAmountLabel.style.fontSize = '11px';

    const syncAmountVisibility = () => {
      const selected = playerStatuses.find((s) => s.value === playerStatusSelect.value);
      playerStatusAmountRow.style.display = selected?.numeric === false ? 'none' : '';
    };
    playerStatusSelect.addEventListener('change', syncAmountVisibility);
    syncAmountVisibility();

    playerStatusAmountRow.append(playerStatusAmountLabel, playerStatusAmountInput);

    const applyPlayerStatusBtn = this._button('Apply to Player', () => {
      if (this.state.currentScreen !== 'battle') {
        this._log('Player status: only in battle.');
        return;
      }
      const statusKey = playerStatusSelect.value;
      const selected = playerStatuses.find((s) => s.value === statusKey);
      const amount =
        selected?.numeric === false ? 1 : Math.max(0, Number(playerStatusAmountInput.value) || 1);
      this.state.applyPlayerDebugStatus(statusKey, amount);
      this.ui.applyDebugRefresh({ checkWin: false });
      this._log(`Applied player status: ${statusKey} (${amount}).`);
    });

    const clearPlayerStatusBtn = this._button('Clear All Player Statuses', () => {
      if (this.state.currentScreen !== 'battle') {
        this._log('Player status: only in battle.');
        return;
      }
      this.state.applyPlayerDebugStatus('strength', 0);
      this.state.applyPlayerDebugStatus('weak', 0);
      this.state.applyPlayerDebugStatus('fragile', 0);
      this.state.applyPlayerDebugStatus('vulnerable', 0);
      this.state.applyPlayerDebugStatus('next_double', 0);
      this.state.applyPlayerDebugStatus('energy_next_turn', 0);
      this.state.applyPlayerDebugStatus('lans', 0);
      this.state.applyPlayerDebugStatus('duma_podhala', 0);
      this.state.applyPlayerDebugStatus('furia_turysty', 0);
      this.ui.applyDebugRefresh({ checkWin: false });
      this._log('Cleared all player statuses.');
    });

    playerStatusGroup.append(
      playerStatusSelect,
      playerStatusAmountRow,
      applyPlayerStatusBtn,
      clearPlayerStatusBtn
    );

    panel.append(goldGroup, relicGroup, playerGroup, playerStatusGroup);
    return panel;
  }

  _applyBattleStatus(status, amount) {
    this.state.applyEnemyDebugStatus(status, amount);
    this.ui.applyDebugRefresh({ checkWin: false });
    this._log(`Applied ${status} (${amount}) to enemy.`);
  }

  _syncEnemyHpControl(slider, label) {
    const max = Math.max(1, this.state.enemy.maxHp);
    slider.max = String(max);
    slider.value = String(Math.max(0, Math.min(this.state.enemy.hp, max)));
    label.textContent = `Enemy HP: ${this.state.enemy.hp} / ${this.state.enemy.maxHp}`;
  }

  _group(title) {
    const group = document.createElement('section');
    group.className = 'debug-group';
    const heading = document.createElement('div');
    heading.className = 'debug-group-title';
    heading.textContent = title;
    group.appendChild(heading);
    return group;
  }

  _button(text, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'debug-button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  _makeTabButton(label, tabId) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'debug-tab';
    button.textContent = label;
    button.dataset.tab = tabId;
    button.addEventListener('click', () => {
      if (!this.root) return;
      const tabs = [...this.root.querySelectorAll('.debug-tab')];
      const panels = [...this.root.querySelectorAll('.debug-panel')];
      this._setActiveTab(tabId, tabs, panels);
    });
    return button;
  }

  _setActiveTab(tabId, tabButtons, tabPanels) {
    this.activeTab = tabId;
    tabButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === tabId);
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.tab === tabId);
    });
  }

  _log(text) {
    if (!this.logEl) return;
    const line = document.createElement('div');
    line.className = 'debug-log-line';
    const timestamp = new Date().toLocaleTimeString();
    line.textContent = `[${timestamp}] ${text}`;
    this.logEl.appendChild(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
}
