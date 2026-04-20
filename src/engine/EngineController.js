import { GameState } from '../state/GameState.js';
import { characters } from '../data/characters.js';
import { enemyLibrary } from '../data/enemies.js';
import { cardLibrary } from '../data/cards.js';
import { buildObservation } from './Observation.js';
import { getLegalActions } from './LegalActions.js';
import { dispatch } from './ActionDispatcher.js';
import { createEventBuffer, drain } from './EngineEvents.js';
import { serialize, restore } from './Snapshot.js';
import { mulberry32, parseSeed } from './Rng.js';

/**
 * @typedef {import('./Observation.js').Observation} Observation
 * @typedef {import('./ActionDispatcher.js').Action} Action
 * @typedef {import('./ActionDispatcher.js').ActionResult} ActionResult
 * @typedef {import('./Snapshot.js').SerializedRun} SerializedRun
 * @typedef {import('./EngineEvents.js').EngineEvent} EngineEvent
 * @typedef {{ outcome: 'player_win' | 'enemy_win', floorReached: number, totalTurnsPlayed: number, totalDutkiEarned: number, hpAtDeath: number, maxHp: number, killerName: string | null, finalDeck: string[], finalRelics: string[], finalBoons: string[] } | null} RunSummary
 * @typedef {{ kind: 'card'|'enemy'|'relic'|'boon'|'event'|'weather'|'character', id: string }} EntityRef
 * @typedef {import('./PoolOverrides.js').PoolOverrides} PoolOverrides
 */

/**
 * 10-method headless facade over GameState.
 * One instance = one run. Thread-unsafe (single-call-at-a-time).
 */
export class EngineController {
  /**
   * @private
   * @param {import('../state/GameState.js').GameState} state
   * @param {{ revealAllPiles?: boolean }} rules
   * @param {string | number | null} seed
   */
  constructor(state, rules, seed) {
    /** @private @type {import('../state/GameState.js').GameState} */
    this._state = state;
    /** @private @type {{ revealAllPiles?: boolean }} */
    this._rules = rules;
    /** @private @type {string | number | null} */
    this._seed = seed;
    /** @private @type {(() => number) | null} Active PRNG function replacing Math.random for this run */
    this._rng = null;
    /** @private @type {(() => number) | null} Saved original Math.random, restored on re-seed */
    this._originalRandom = null;
    /** @private @type {boolean} */
    this._started = false;
    /** @private @type {string[]} Relics to re-apply after resetForNewRun */
    this._startingRelics = [];
    /** @private @type {number | null} Scale factor to re-apply after resetForNewRun */
    this._enemyScaleFactor = null;
  }

  /**
   * Create a controller bound to a specific run. Does NOT start the loop.
   * @param {{
   *   characterId: string,
   *   startingDeck?: string[],
   *   seed?: string,
   *   difficulty?: 'normal'|'hard',
   *   rules?: { skipIntro?: boolean, revealAllPiles?: boolean, disableEvents?: boolean },
   *   pools?: PoolOverrides,
   *   startingRelics?: string[],
   *   marynaEnabled?: boolean,
   *   forceEnemy?: { regular?: string, elite?: string, boss?: string },
   *   forceEvent?: string | null,
   *   forceWeather?: string | null,
   *   enemyScaleFactor?: number | null,
   * }} opts
   * @returns {EngineController}
   */
  static create(opts) {
    const character = characters[opts.characterId];
    if (!character) throw new Error(`Unknown character: ${opts.characterId}`);

    const initialEnemy = Object.values(enemyLibrary)[0];
    const state = new GameState(character, initialEnemy);

    // Apply difficulty
    if (opts.difficulty === 'hard') state.difficulty = 'hard';

    // Apply pool overrides
    if (opts.pools) state._poolOverrides = opts.pools;

    // Apply force overrides
    if (opts.forceWeather) state.currentWeather = /** @type {any} */ (opts.forceWeather);

    // Initialize event buffer
    state._engineEvents = createEventBuffer();

    // Store starting deck override on state for startRun to use
    state._startingDeckOverride = opts.startingDeck ?? null;
    state._marynaEnabled = opts.marynaEnabled ?? false;
    state._forceEnemy = opts.forceEnemy ?? null;
    state._forceEvent = opts.forceEvent ?? null;
    state._inShop = false;
    state._inCampfire = false;
    state._rewardOffer = null;
    state._enginePendingBattle = false;

    const rules = opts.rules ?? {};
    const seed = opts.seed ?? null;

    const ctrl = new EngineController(state, rules, seed);
    ctrl._startingRelics = opts.startingRelics ?? [];
    ctrl._enemyScaleFactor = opts.enemyScaleFactor ?? null;
    return ctrl;
  }

  /**
   * Seeds deck, runs first turn, returns first observation.
   * @returns {Observation}
   */
  startRun() {
    if (this._started) throw new Error('Run already started');
    this._started = true;

    const state = this._state;
    const character = state.baseCharacter;

    // Build starting deck
    const startingDeck = state._startingDeckOverride ?? _buildStartingDeck(character);

    if (this._seed != null) {
      this._originalRandom = Math.random;
      this._rng = mulberry32(parseSeed(this._seed));
      Math.random = this._rng;
      state.rng = this._rng;
    }

    state.resetForNewRun(startingDeck);

    // Re-apply opts that resetForNewRun resets
    if (this._enemyScaleFactor != null) state.enemyScaleFactor = this._enemyScaleFactor;
    for (const relicId of this._startingRelics) {
      state.addRelic(relicId);
    }

    // Headless engine always skips the UI intro gate so map travel is immediately available.
    state.hasStartedFirstBattle = true;
    // Signal that the first battle was already initialized by resetForNewRun so _enterNode
    // can skip re-initialization and avoid emitting a duplicate turn_started event.
    state._enginePendingBattle = true;

    // When marynaEnabled, the starting node (level 0, position 1) is a Maryna node.
    // Surface it as the initial screen so the bot can pick a boon before the first
    // battle. The pre-initialized cepr battle is left in place; once the bot picks
    // a boon and travels to the next-level fight node, _enterNode consumes
    // _enginePendingBattle and the existing battle is entered without a reset.
    const startingNode = state.getCurrentMapNode?.();
    if (state._marynaEnabled && startingNode?.type === 'maryna') {
      state.rollMarynaChoices();
      state.currentScreen = 'maryna';
    }

    return this.getObservation();
  }

  /**
   * Returns a fresh immutable snapshot of the current game state.
   * @returns {Observation}
   */
  getObservation() {
    return buildObservation(this._state, this._rules);
  }

  /**
   * Returns the list of legal actions for the current phase.
   * @returns {Action[]}
   */
  getLegalActions() {
    return getLegalActions(this._state);
  }

  /**
   * Apply an action; returns ActionResult with new observation + drained events.
   * @param {Action} action
   * @returns {ActionResult}
   */
  applyAction(action) {
    let result;
    try {
      result = dispatch(
        this._state,
        action,
        (s) => buildObservation(s, this._rules),
        (s) => drain(s)
      );
    } catch (err) {
      // Restore Math.random before rethrowing so downstream batch runs aren't poisoned.
      this.dispose();
      throw err;
    }
    if (result.done) this.dispose();
    return result;
  }

  /**
   * Convenience method — equivalent to applyAction({ type: 'end_turn' }).
   * @returns {ActionResult}
   */
  endTurn() {
    return this.applyAction({ type: 'end_turn' });
  }

  /**
   * Serialize the run to a plain object for save/restore.
   * @returns {SerializedRun}
   */
  snapshot() {
    const snap = serialize(this._state);
    // Capture current RNG position so snapshot/restore is fully deterministic
    if (this._rng && typeof this._rng.getState === 'function') {
      snap.rngState = this._rng.getState();
    }
    return snap;
  }

  /**
   * Restore an EngineController from a SerializedRun snapshot.
   * @param {SerializedRun} snap
   * @returns {EngineController}
   */
  static restore(snap) {
    const state = restore(snap);
    // Re-attach engine-only flags that aren't part of GameState constructor
    if (!state._engineEvents) state._engineEvents = createEventBuffer();
    state._inShop = state._inShop ?? false;
    state._inCampfire = state._inCampfire ?? false;
    state._rewardOffer = state._rewardOffer ?? null;
    state._poolOverrides = state._poolOverrides ?? null;
    state._enginePendingBattle = state._enginePendingBattle ?? false;

    const ctrl = new EngineController(state, {}, null);
    ctrl._started = true;
    // rngState is applied by the caller (SearchBot) to the in-place engine instance,
    // not here, because static restore cannot know if Math.random is currently seeded.
    return ctrl;
  }

  /**
   * Drain all buffered events from the run, clearing the buffer.
   * @returns {EngineEvent[]}
   */
  drainEvents() {
    return drain(this._state);
  }

  /**
   * Returns the run summary if the run is terminal; null otherwise.
   * @returns {RunSummary}
   */
  getRunSummary() {
    const rs = this._state.runSummary;
    if (!rs) return null;
    return {
      outcome: rs.outcome,
      floorReached: rs.runStats?.floorReached ?? 1,
      totalTurnsPlayed: rs.runStats?.totalTurnsPlayed ?? 0,
      totalDutkiEarned: rs.runStats?.totalDutkiEarned ?? 0,
      hpAtDeath: rs.runStats?.hpAtDeath ?? 0,
      maxHp: rs.runStats?.maxHp ?? 1,
      killerName: rs.killerName ?? null,
      finalDeck: (rs.finalDeck ?? []).map((c) => c.id ?? c),
      finalRelics: (rs.finalRelics ?? []).map((r) => r.id ?? r),
      finalBoons: this._state.maryna?.pickedId ? [this._state.maryna.pickedId] : [],
    };
  }

  /**
   * Restore Math.random to its pre-run state. Safe to call multiple times.
   * Called automatically when the run reaches a terminal state.
   */
  dispose() {
    if (this._originalRandom !== null) {
      Math.random = this._originalRandom;
      this._originalRandom = null;
      this._rng = null;
    }
  }

  /**
   * Re-seed the RNG (for MCTS rollouts). Immediately replaces Math.random.
   * @param {string} hex
   */
  seed(hex) {
    const parsed = parseSeed(hex);
    this._seed = parsed;
    if (this._originalRandom === null) this._originalRandom = Math.random;
    this._rng = mulberry32(parsed);
    Math.random = this._rng;
  }
}

/**
 * Build the default starting deck for a character from card library starters.
 * @param {{ id?: string, name?: string }} character
 * @returns {string[]}
 */
function _buildStartingDeck(character) {
  const charId = character.id ?? character.name?.toLowerCase() ?? 'jedrek';
  // Collect starter cards matching this character (or generic starters)
  const starters = Object.entries(cardLibrary)
    .filter(([, def]) => def.isStarter && !def.tutorialOnly && !def.eventOnly)
    .map(([id]) => id);

  // Default: 5 ciupaga + 4 gasior (Jędrek starters)
  if (starters.length === 0 || charId === 'jedrek') {
    return [
      'ciupaga',
      'ciupaga',
      'ciupaga',
      'ciupaga',
      'ciupaga',
      'gasior',
      'gasior',
      'gasior',
      'gasior',
    ];
  }
  return starters;
}
