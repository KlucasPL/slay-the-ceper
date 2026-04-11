import './styles/layout.css';
import './styles/animations.css';

import { AudioManager } from './audio/AudioManager.js';
import { GameState } from './state/GameState.js';
import { UIManager } from './ui/UIManager.js';
import { characters } from './data/characters.js';
import { enemyLibrary } from './data/enemies.js';
import { startingDeck } from './data/cards.js';

const menuTracks = import.meta.glob('./audio/*.mp3', {
	eager: true,
	import: 'default',
});
const [menuTrackUrl] = Object.values(menuTracks);

const params = new URLSearchParams(window.location.search);
const debugBoss = params.get('debugBoss');

/** @type {import('./data/enemies.js').EnemyDef} */
let initialEnemy = enemyLibrary.cepr;
if (debugBoss === 'boss') {
	initialEnemy = enemyLibrary.boss;
} else if (debugBoss === 'fiakier') {
	initialEnemy = enemyLibrary.fiakier;
} else if (debugBoss === 'random-boss') {
	initialEnemy = Math.random() < 0.5 ? enemyLibrary.boss : enemyLibrary.fiakier;
}

const state = new GameState(characters.jedrek, initialEnemy);
state.initGame(startingDeck);

if (debugBoss === 'boss' || debugBoss === 'fiakier' || debugBoss === 'random-boss') {
	state.currentScreen = 'battle';
}

const audioManager = new AudioManager({ menuTrackUrl, state });

const ui = new UIManager(state, audioManager);
ui.init();
