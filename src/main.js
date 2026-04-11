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

const state = new GameState(characters.jedrek, enemyLibrary.cepr);
state.initGame(startingDeck);

const audioManager = new AudioManager({ menuTrackUrl, state });

const ui = new UIManager(state, audioManager);
ui.init();
