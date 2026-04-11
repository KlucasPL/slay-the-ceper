import './styles/layout.css';
import './styles/animations.css';

import menuMusicTrack from './audio/Jędrek_s_Fury_Tatra_Stomp_.mp3';
import { AudioManager } from './audio/AudioManager.js';
import { GameState } from './state/GameState.js';
import { UIManager } from './ui/UIManager.js';
import { characters } from './data/characters.js';
import { enemyLibrary } from './data/enemies.js';
import { startingDeck } from './data/cards.js';

const state = new GameState(characters.jedrek, enemyLibrary.cepr);
state.initGame(startingDeck);

const audioManager = new AudioManager(state, menuMusicTrack);
window.audioManager = audioManager;

const ui = new UIManager(state, audioManager);
ui.init();
