import './styles/layout.css';
import './styles/animations.css';

import { GameState } from './state/GameState.js';
import { UIManager } from './ui/UIManager.js';
import { characters } from './data/characters.js';
import { enemyLibrary } from './data/enemies.js';
import { startingDeck } from './data/cards.js';

const state = new GameState(characters.jedrek, enemyLibrary.cepr);
state.initGame(startingDeck);

const ui = new UIManager(state);
ui.init();
