import './styles/layout.css';
import './styles/animations.css';

import { AudioManager } from './logic/AudioManager.js';
import { GameState } from './state/GameState.js';
import { UIManager } from './ui/UIManager.js';
import { characters } from './data/characters.js';
import { enemyLibrary } from './data/enemies.js';
import { startingDeck } from './data/cards.js';

const params = new URLSearchParams(window.location.search);
const debugEnemyRaw = params.get('debugBoss') ?? params.get('debugEnemy');
const debugEnemyAliases = {
  konik: 'konik_spod_kuznic',
  naganiacz: 'naganiacz_z_krupowek',
  spekulant: 'spekulant',
  mistrz: 'mistrz_redyku',
  redyk: 'mistrz_redyku',
  ceprzyca: 'ceprzyca_vip',
  vip: 'ceprzyca_vip',
};
const debugBoss = debugEnemyAliases[debugEnemyRaw] ?? debugEnemyRaw;
const hasValidDebugBoss =
  debugBoss === 'random-boss' ||
  debugBoss === 'random-elite' ||
  (debugBoss !== null && Boolean(enemyLibrary[debugBoss]));

/** @type {import('./data/enemies.js').EnemyDef} */
let initialEnemy = enemyLibrary.cepr;

// Debug mode: ?debugBoss=<enemyId> or ?debugEnemy=<enemyId> jumps directly to that enemy
// Shortcuts: ?debugEnemy=konik, ?debugEnemy=naganiacz, ?debugEnemy=spekulant,
// ?debugEnemy=mistrz, ?debugEnemy=redyk, ?debugEnemy=ceprzyca, ?debugEnemy=vip
// Random: ?debugEnemy=random-boss or ?debugEnemy=random-elite
if (debugBoss === 'random-boss') {
  initialEnemy = Math.random() < 0.5 ? enemyLibrary.boss : enemyLibrary.fiakier;
  // Draw one enemy from the elite pool for fast testing of elite-specific flows.
} else if (debugBoss === 'random-elite') {
  const eliteIds = Object.keys(enemyLibrary).filter((id) => Boolean(enemyLibrary[id]?.elite));
  const randomEliteId = eliteIds[Math.floor(Math.random() * eliteIds.length)];
  if (randomEliteId) {
    initialEnemy = enemyLibrary[randomEliteId];
  }
} else if (debugBoss && enemyLibrary[debugBoss]) {
  initialEnemy = enemyLibrary[debugBoss];
}

const state = new GameState(characters.jedrek, initialEnemy);
state.initGame(startingDeck);

// Jump to battle screen in debug mode
if (hasValidDebugBoss) {
  state.currentScreen = 'battle';
}

const audioManager = new AudioManager({ state });

const ui = new UIManager(state, audioManager);
ui.init();

const isDevEnvironment = import.meta.env.DEV;

if (isDevEnvironment) {
  const { DebugOverlay } = await import('./ui/DebugOverlay.js');
  const debugOverlay = new DebugOverlay({ state, ui });
  debugOverlay.mount();
}
