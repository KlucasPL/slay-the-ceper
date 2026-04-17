import './styles/layout.css';
import './styles/animations.css';

import { AudioManager } from './logic/AudioManager.js';
import { getSkipIntro } from './logic/settings.js';
import { GameState } from './state/GameState.js';
import { UIManager } from './ui/UIManager.js';
import { MotionComicIntro } from './ui/intro/MotionComicIntro.js';
import { characters } from './data/characters.js';
import { enemyLibrary } from './data/enemies.js';
import { startingDeck } from './data/cards.js';
import { sceneLibrary, isSceneLoadAllowed } from './logic/scenes/index.js';

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
const isDebugEnemyAllowed =
  debugBoss !== null &&
  Boolean(enemyLibrary[debugBoss]) &&
  !enemyLibrary[debugBoss]?.eventOnly &&
  !enemyLibrary[debugBoss]?.tutorialOnly;
const hasValidDebugBoss =
  debugBoss === 'random-boss' || debugBoss === 'random-elite' || isDebugEnemyAllowed;

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
} else if (isDebugEnemyAllowed) {
  initialEnemy = enemyLibrary[debugBoss];
}

const sceneParam = params.get('scene');
const sceneDef = sceneParam && isSceneLoadAllowed() ? (sceneLibrary[sceneParam] ?? null) : null;

const seedParam = params.get('seed');
const seedFromUrl =
  !sceneDef && seedParam && /^[0-9a-fA-F]{1,8}$/.test(seedParam) ? seedParam.toLowerCase() : null;

const state = new GameState(characters.jedrek, initialEnemy);
state.initGame(startingDeck);

if (sceneDef) {
  sceneDef.build(state);
}

async function bootstrap() {
  document.body.dataset.appScene = 'INTRO_SCENE';

  // Skip intro for scenes, seeded-URL launches, direct debug encounters, or when player disabled it in Options.
  if (!sceneDef && !seedFromUrl && !hasValidDebugBoss && !getSkipIntro()) {
    const intro = new MotionComicIntro();
    await intro.play();
  }

  document.body.dataset.appScene = 'MAIN_GAME';

  // Jump to battle screen in debug mode
  if (hasValidDebugBoss) {
    state.currentScreen = 'battle';
  }

  const audioManager = new AudioManager({ state });
  const ui = new UIManager(state, audioManager);
  ui.init();

  if (sceneDef) {
    _activateScene(sceneDef, ui);
    console.log(`[scene] loaded: ${sceneDef.name}`);
  } else if (seedFromUrl) {
    ui.startSeededRun(seedFromUrl);
  }

  const { DebugOverlay } = await import('./ui/debug/DebugOverlay.js');
  const debugOverlay = new DebugOverlay({ state, ui });
  debugOverlay.mount();
}

/**
 * Route the UI to the correct overlay after a scene's state has been loaded.
 * @param {import('./logic/scenes/index.js').SceneDef & { _pendingScene?: string }} scene
 * @param {UIManager} ui
 */
function _activateScene(scene, ui) {
  const pending = state._pendingScene;
  if (pending === 'reward-card') {
    const choices = state.generateCardRewardChoices(3);
    ui._showCardRewardScreen(20, choices, false, { allowSkip: true });
  } else if (pending === 'reward-relic') {
    const relicId = state.generateRelicReward(true) ?? 'bilet_tpn';
    ui.showRelicScreen(relicId, 'battle');
  } else if (pending === 'shop-stocked' || pending === 'shop-broke') {
    ui._openShop();
  } else if (pending === 'campfire-ready') {
    ui._openCampfire();
  } else if (pending === 'event-branch') {
    ui._openRandomEvent(state.activeEventId);
  } else if (pending === 'maryna-offer') {
    ui._openMarynaBoonOverlay();
  } else if (pending === 'run-ended-win' || pending === 'run-ended-loss') {
    ui._showRunSummaryOverlay();
  } else if (scene.currentScreen === 'map') {
    ui._openMapOverlay();
  }
}

bootstrap();
