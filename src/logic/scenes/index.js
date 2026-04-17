import { cardLibrary, startingDeck } from '../../data/cards.js';
import { enemyLibrary } from '../../data/enemies.js';
import { relicLibrary } from '../../data/relics.js';

/**
 * @typedef {import('../../state/GameState.js').GameState} GameState
 * @typedef {{ name: string, description: string, currentScreen: 'title'|'map'|'battle'|'event', build(state: GameState): void }} SceneDef
 */

/** @type {Record<string, SceneDef>} */
export const sceneLibrary = {
  'combat-opening': {
    name: 'combat-opening',
    description: 'Turn 1 of first fight, full hand, no status',
    currentScreen: 'battle',
    build(state) {
      state.currentScreen = 'battle';
      state.hasStartedFirstBattle = true;
      state.deck = [...startingDeck];
      state.hand = ['ciupaga', 'ciupaga', 'gasior', 'kierpce', 'hej'];
      state.discard = [];
      state.exhaust = [];
      state.player.hp = state.player.maxHp;
      state.player.block = 0;
      state.player.energy = state.player.maxEnergy;
      state.enemy = state._createEnemyState(enemyLibrary.cepr);
      state.enemy.hp = state.enemy.maxHp;
    },
  },

  'combat-boss': {
    name: 'combat-boss',
    description: 'Boss fight at floor 15 with loaded relics',
    currentScreen: 'battle',
    build(state) {
      state.currentScreen = 'battle';
      state.hasStartedFirstBattle = true;
      state.currentLevel = 14;
      state.maxFloorReached = 15;
      state.deck = [...startingDeck, 'halny', 'redyk', 'giewont'];
      state.hand = ['ciupaga', 'ciupaga', 'halny', 'gasior', 'giewont'];
      state.discard = [];
      state.exhaust = [];
      state.relics = ['bilet_tpn', 'zepsuty_termometr'];
      state.player.hp = Math.floor(state.player.maxHp * 0.7);
      state.player.block = 0;
      state.player.energy = state.player.maxEnergy;
      state.enemy = state._createEnemyState(enemyLibrary.boss);
      state.enemy.hp = state.enemy.maxHp;
    },
  },

  'combat-lethal': {
    name: 'combat-lethal',
    description: 'Player one action from winning a battle',
    currentScreen: 'battle',
    build(state) {
      state.currentScreen = 'battle';
      state.hasStartedFirstBattle = true;
      state.deck = [...startingDeck];
      state.hand = ['ciupaga', 'ciupaga', 'gasior'];
      state.discard = [];
      state.exhaust = [];
      state.player.hp = state.player.maxHp;
      state.player.block = 0;
      state.player.energy = state.player.maxEnergy;
      state.enemy = state._createEnemyState(enemyLibrary.cepr);
      state.enemy.hp = 6;
      state.enemy.block = 0;
    },
  },

  'combat-lose': {
    name: 'combat-lose',
    description: 'Player at 1 HP vs full enemy',
    currentScreen: 'battle',
    build(state) {
      state.currentScreen = 'battle';
      state.hasStartedFirstBattle = true;
      state.deck = ['ciupaga'];
      state.hand = ['gasior'];
      state.discard = [];
      state.exhaust = [];
      state.player.hp = 1;
      state.player.block = 0;
      state.player.energy = state.player.maxEnergy;
      state.enemy = state._createEnemyState(enemyLibrary.spekulant);
      state.enemy.hp = state.enemy.maxHp;
    },
  },

  'reward-card': {
    name: 'reward-card',
    description: 'Post-battle card reward screen',
    currentScreen: 'battle',
    build(state) {
      state.currentScreen = 'battle';
      state.hasStartedFirstBattle = true;
      state.deck = [...startingDeck];
      state.hand = [];
      state.discard = [...startingDeck];
      state.player.hp = state.player.maxHp;
      state.enemy = state._createEnemyState(enemyLibrary.cepr);
      state.enemy.hp = 0;
      state._pendingScene = 'reward-card';
    },
  },

  'reward-relic': {
    name: 'reward-relic',
    description: 'Elite reward with card + relic',
    currentScreen: 'battle',
    build(state) {
      state.currentScreen = 'battle';
      state.hasStartedFirstBattle = true;
      state.deck = [...startingDeck];
      state.hand = [];
      state.discard = [...startingDeck];
      state.player.hp = state.player.maxHp;
      state.enemy = state._createEnemyState(enemyLibrary.konik_spod_kuznic);
      state.enemy.hp = 0;
      state._pendingScene = 'reward-relic';
    },
  },

  'shop-stocked': {
    name: 'shop-stocked',
    description: 'Shop with cards + 1 relic + enough dutki',
    currentScreen: 'map',
    build(state) {
      state.currentScreen = 'map';
      state.hasStartedFirstBattle = true;
      state.dutki = 200;
      state.deck = [...startingDeck];
      state.hand = [];
      state.discard = [];
      state._pendingScene = 'shop-stocked';
    },
  },

  'shop-broke': {
    name: 'shop-broke',
    description: 'Shop with 0 dutki',
    currentScreen: 'map',
    build(state) {
      state.currentScreen = 'map';
      state.hasStartedFirstBattle = true;
      state.dutki = 0;
      state.deck = [...startingDeck];
      state.hand = [];
      state.discard = [];
      state._pendingScene = 'shop-broke';
    },
  },

  'campfire-ready': {
    name: 'campfire-ready',
    description: 'Campfire at 50% HP with upgradable cards',
    currentScreen: 'map',
    build(state) {
      state.currentScreen = 'map';
      state.hasStartedFirstBattle = true;
      state.player.hp = Math.floor(state.player.maxHp / 2);
      state.deck = [...startingDeck, 'halny'];
      state.hand = [];
      state.discard = [];
      state._pendingScene = 'campfire-ready';
    },
  },

  'event-branch': {
    name: 'event-branch',
    description: 'Event screen with 3 choices',
    currentScreen: 'event',
    build(state) {
      state.currentScreen = 'event';
      state.hasStartedFirstBattle = true;
      state.activeEventId = 'event_karykaturzysta';
      state.deck = [...startingDeck];
      state.hand = [];
      state.discard = [];
      state._pendingScene = 'event-branch';
    },
  },

  'map-midway': {
    name: 'map-midway',
    description: 'Map screen at floor 6, multiple paths visible',
    currentScreen: 'map',
    build(state) {
      state.currentScreen = 'map';
      state.hasStartedFirstBattle = true;
      state.currentLevel = 5;
      state.maxFloorReached = 6;
      state.deck = [...startingDeck, 'giewont'];
      state.hand = [];
      state.discard = [];
      state.player.hp = Math.floor(state.player.maxHp * 0.8);
      state.relics = ['ciupaga_dlugopis'];
    },
  },

  'maryna-offer': {
    name: 'maryna-offer',
    description: 'Maryna boon offer at run start',
    currentScreen: 'map',
    build(state) {
      state.currentScreen = 'map';
      state.hasStartedFirstBattle = false;
      state.deck = [...startingDeck];
      state.hand = [];
      state.discard = [];
      state.maryna = {
        offeredIds: ['mokra_sciera', 'kiesa', 'przeglad_plecaka'],
        pickedId: null,
        flags: {},
        counters: {},
      };
      state._pendingScene = 'maryna-offer';
    },
  },

  'run-ended-win': {
    name: 'run-ended-win',
    description: 'Run summary overlay, player won',
    currentScreen: 'battle',
    build(state) {
      state.currentScreen = 'battle';
      state.maxFloorReached = 15;
      state.totalTurnsPlayed = 42;
      state.totalDutkiEarned = 300;
      state.deck = [...startingDeck, 'halny'];
      state.hand = [];
      state.discard = [];
      state.relics = ['bilet_tpn'];
      state.runSummary = {
        outcome: 'player_win',
        finalDeck: [cardLibrary.ciupaga, cardLibrary.halny],
        finalRelics: [relicLibrary.bilet_tpn],
        killerName: null,
        runStats: { totalDutkiEarned: 300, floorReached: 15, totalTurnsPlayed: 42 },
      };
      state._pendingScene = 'run-ended-win';
    },
  },

  'run-ended-loss': {
    name: 'run-ended-loss',
    description: 'Run summary overlay, player lost',
    currentScreen: 'battle',
    build(state) {
      state.currentScreen = 'battle';
      state.maxFloorReached = 3;
      state.totalTurnsPlayed = 8;
      state.totalDutkiEarned = 50;
      state.deck = [...startingDeck];
      state.hand = [];
      state.discard = [];
      state.runSummary = {
        outcome: 'enemy_win',
        finalDeck: [cardLibrary.ciupaga],
        finalRelics: [],
        killerName: 'Cepr',
        runStats: { totalDutkiEarned: 50, floorReached: 3, totalTurnsPlayed: 8 },
      };
      state._pendingScene = 'run-ended-loss';
    },
  },
};

/**
 * Returns true when ?scene= loading is permitted.
 * Permitted on localhost or when the test harness flag is set.
 * @returns {boolean}
 */
export function isSceneLoadAllowed() {
  if (typeof window === 'undefined') return false;
  if (window.__SCENE_TEST__) return true;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}
