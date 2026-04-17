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

const state = new GameState(characters.jedrek, initialEnemy);
state.initGame(startingDeck);

/**
 * Attempts to lock the screen orientation to portrait on supported mobile browsers.
 * Browsers may reject this unless the page is installed or in fullscreen mode.
 *
 * @returns {Promise<boolean>} True when lock request succeeds.
 */
async function tryLockPortraitOrientation() {
  if (!('orientation' in screen) || typeof screen.orientation?.lock !== 'function') {
    return false;
  }

  try {
    await screen.orientation.lock('portrait');
    return true;
  } catch {
    return false;
  }
}

/**
 * Sets up repeated portrait-lock attempts on mobile-like devices.
 * This is a best-effort fallback and stays silent when unsupported.
 *
 * @returns {void}
 */
function setupMobilePortraitLock() {
  const isMobileLike = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isMobileLike) return;

  const requestLock = () => {
    void tryLockPortraitOrientation();
  };

  requestLock();
  window.addEventListener('orientationchange', requestLock);
  window.addEventListener('resize', requestLock);
  window.addEventListener('pointerdown', requestLock, { once: true });
}

/**
 * Prevents browser-level zoom gestures on mobile devices.
 * Keeps in-game taps and drags functional while blocking pinch-to-zoom.
 *
 * @returns {void}
 */
function setupMobileZoomGuards() {
  const isMobileLike = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isMobileLike) return;

  const preventGesture = (event) => {
    event.preventDefault();
  };

  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });
  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}

/**
 * Wraps the app in a viewport container and shows a blocking overlay on mobile
 * landscape, forcing the user to rotate the device back to portrait.
 *
 * @returns {void}
 */
function setupMobilePortraitViewportFallback() {
  const isMobileLike = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isMobileLike) return;

  let appViewport = document.getElementById('app-viewport');
  if (!appViewport) {
    appViewport = document.createElement('div');
    appViewport.id = 'app-viewport';

    const bodyNodes = Array.from(document.body.childNodes);
    bodyNodes.forEach((node) => {
      appViewport.appendChild(node);
    });

    document.body.appendChild(appViewport);
  }

  let orientationOverlay = document.getElementById('orientation-lock-overlay');
  if (!orientationOverlay) {
    orientationOverlay = document.createElement('div');
    orientationOverlay.id = 'orientation-lock-overlay';
    orientationOverlay.setAttribute('role', 'dialog');
    orientationOverlay.setAttribute('aria-modal', 'true');
    orientationOverlay.setAttribute('aria-live', 'polite');
    orientationOverlay.innerHTML = `
      <div class="orientation-lock-card">
        <div class="orientation-lock-icon" aria-hidden="true">📱</div>
        <h2 class="orientation-lock-title">Obróć telefon do pionu</h2>
        <p class="orientation-lock-text">
          Ta gra działa tylko w orientacji pionowej. Obróć urządzenie, aby kontynuować.
        </p>
      </div>
    `;
    document.body.appendChild(orientationOverlay);
  }

  const updateOrientationClass = () => {
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    document.body.classList.toggle('mobile-orientation-blocked', isLandscape);
    orientationOverlay?.setAttribute('aria-hidden', String(!isLandscape));
  };

  updateOrientationClass();
  window.addEventListener('orientationchange', updateOrientationClass);
  window.addEventListener('resize', updateOrientationClass);
}

/**
 * Shows a blocking overlay on desktop when the viewport is extremely wide but too short
 * to render the game without collapsing into the low-height fallback layout.
 *
 * @returns {void}
 */
function setupDesktopViewportGuard() {
  const isDesktopLike = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isDesktopLike) return;

  let appViewport = document.getElementById('app-viewport');
  if (!appViewport) {
    appViewport = document.createElement('div');
    appViewport.id = 'app-viewport';

    const bodyNodes = Array.from(document.body.childNodes);
    bodyNodes.forEach((node) => {
      appViewport.appendChild(node);
    });

    document.body.appendChild(appViewport);
  }

  let desktopViewportOverlay = document.getElementById('desktop-viewport-overlay');
  if (!desktopViewportOverlay) {
    desktopViewportOverlay = document.createElement('div');
    desktopViewportOverlay.id = 'desktop-viewport-overlay';
    desktopViewportOverlay.setAttribute('role', 'dialog');
    desktopViewportOverlay.setAttribute('aria-modal', 'true');
    desktopViewportOverlay.setAttribute('aria-live', 'polite');
    desktopViewportOverlay.innerHTML = `
      <div class="orientation-lock-card orientation-lock-card--desktop">
        <div class="orientation-lock-icon" aria-hidden="true">🖥️</div>
        <h2 class="orientation-lock-title">Okno jest za niskie</h2>
        <p class="orientation-lock-text">
          Ten widok jest zbyt szeroki i zbyt niski dla wygodnej gry. Zwiększ wysokość okna
          albo zmniejsz jego szerokość, aby wrócić do rozgrywki.
        </p>
      </div>
    `;
    document.body.appendChild(desktopViewportOverlay);
  }

  const updateDesktopViewportClass = () => {
    const isTooShortDesktop =
      window.innerHeight <= 720 && window.innerWidth / window.innerHeight >= 1.9;
    document.body.classList.toggle('desktop-viewport-blocked', isTooShortDesktop);
    desktopViewportOverlay?.setAttribute('aria-hidden', String(!isTooShortDesktop));
  };

  updateDesktopViewportClass();
  window.addEventListener('resize', updateDesktopViewportClass);
}

async function bootstrap() {
  document.body.dataset.appScene = 'INTRO_SCENE';

  // Skip intro when launching direct debug encounters, or when player disabled it in Options.
  if (!hasValidDebugBoss && !getSkipIntro()) {
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

  const { DebugOverlay } = await import('./ui/debug/DebugOverlay.js');
  const debugOverlay = new DebugOverlay({ state, ui });
  debugOverlay.mount();
}

/** @type {number} Internal game width authored for 16:9 layout. */
const GAME_BASE_WIDTH = 1920;

/** @type {number} Internal game height authored for 16:9 layout. */
const GAME_BASE_HEIGHT = 1080;

/** @type {ReturnType<typeof setTimeout> | null} */
let _resizeDebounceId = null;

/** @type {boolean} Toggle for the temporary desktop low-height blocking overlay. */
const ENABLE_DESKTOP_VIEWPORT_GUARD = false;

/** @type {boolean} Toggle for the mobile portrait blocking overlay. */
const ENABLE_MOBILE_ORIENTATION_OVERLAY = false;

/** @type {boolean} Toggle for mobile orientation lock attempts. */
const ENABLE_MOBILE_PORTRAIT_LOCK = false;

/**
 * Scales #game-canvas uniformly so it fits the current browser window.
 * Uses position: fixed + explicit top/left offsets so the transform does not
 * disturb document layout flow.
 *
 * @returns {void}
 */
function scaleGameContainer() {
  const container = document.getElementById('game-canvas');
  if (!container) return;
  container.style.width = `${GAME_BASE_WIDTH}px`;
  container.style.height = `${GAME_BASE_HEIGHT}px`;

  const scale = Math.min(
    window.innerWidth / GAME_BASE_WIDTH,
    window.innerHeight / GAME_BASE_HEIGHT
  );
  const offsetX = (window.innerWidth - GAME_BASE_WIDTH * scale) / 2;
  const offsetY = (window.innerHeight - GAME_BASE_HEIGHT * scale) / 2;
  container.style.transform = `scale(${scale})`;
  container.style.left = `${offsetX}px`;
  container.style.top = `${offsetY}px`;
}

/**
 * Debounced resize handler — avoids thrashing layout recalculations on every
 * pixel change while the user drags the window edge.
 *
 * @returns {void}
 */
function onWindowResize() {
  if (_resizeDebounceId !== null) clearTimeout(_resizeDebounceId);
  _resizeDebounceId = setTimeout(scaleGameContainer, 50);
}

window.addEventListener('resize', onWindowResize);
scaleGameContainer();
setupMobileZoomGuards();

if (ENABLE_MOBILE_ORIENTATION_OVERLAY) {
  setupMobilePortraitViewportFallback();
}
if (ENABLE_DESKTOP_VIEWPORT_GUARD) {
  setupDesktopViewportGuard();
}
bootstrap();
if (ENABLE_MOBILE_PORTRAIT_LOCK) {
  setupMobilePortraitLock();
}
