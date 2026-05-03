import gameanalytics from 'gameanalytics';

/**
 * @typedef {'run_started'|'run_ended'|'map_generated'|'node_entered'|'weather_entered'|
 *   'battle_started'|'battle_ended'|'phase_transition'|'turn_started'|'turn_ended'|
 *   'card_drawn'|'card_played'|'card_skipped'|'card_exhausted'|'enemy_move'|
 *   'status_applied'|'shop_opened'|'shop_purchase'|'event_entered'|'event_resolved'|
 *   'reward_offered'|'reward_picked'|'campfire_choice'|'relic_gained'|'boon_offered'|
 *   'boon_picked'|'deck_mutation'|'card_stolen'} EngineEventKind
 */

/**
 * @typedef {{
 *   gameKey: string,
 *   secretKey: string,
 *   build: string,
 *   enableInfoLog?: boolean,
 * }} AnalyticsConfig
 */

/**
 * Resolves GameAnalytics API from multiple runtime shapes:
 * - object API (sdk.initialize, sdk.addDesignEvent, ...)
 * - command API function (GameAnalytics('initialize', ...))
 * @returns {any}
 */
function resolveSdk() {
  const g = /** @type {any} */ (globalThis);
  return (
    g?.GameAnalytics ??
    g?.gameanalytics?.GameAnalytics ??
    gameanalytics?.GameAnalytics ??
    gameanalytics ??
    null
  );
}

/** @type {any} */
const sdk = resolveSdk();
/** @type {any} */
const enums = gameanalytics ?? {};

/**
 * Sanitizes IDs used inside analytics event names to keep a predictable format.
 * @param {unknown} value
 * @returns {string}
 */
function sanitizeEventPart(value) {
  return String(value ?? 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 48);
}

export class AnalyticsManager {
  /**
   * @param {AnalyticsConfig} config
   */
  constructor(config) {
    this.config = config;
    this.enabled = false;
    this.debugEnabled = Boolean(config.enableInfoLog);
  }

  /**
   * @param {string} message
   * @param {Record<string, unknown>} [data]
   * @returns {void}
   */
  debug(message, data) {
    if (!this.debugEnabled) return;
    if (data) {
      console.info(`[Analytics] ${message}`, data);
      return;
    }
    console.info(`[Analytics] ${message}`);
  }

  /**
   * Calls SDK method across supported API shapes.
   * @param {string} method
   * @param {...any} args
   * @returns {boolean}
   */
  call(method, ...args) {
    if (!sdk) return false;
    if (typeof sdk[method] === 'function') {
      sdk[method](...args);
      return true;
    }
    if (typeof sdk === 'function') {
      sdk(method, ...args);
      return true;
    }
    return false;
  }

  /** @returns {boolean} */
  init() {
    if (!sdk) {
      this.debug('init skipped: GameAnalytics SDK unavailable in this runtime');
      return false;
    }
    if (!this.config.gameKey || !this.config.secretKey) {
      this.debug('init skipped: missing game key or secret key');
      return false;
    }

    try {
      this.call('setEnabledInfoLog', Boolean(this.config.enableInfoLog));
      this.call('setEnabledVerboseLog', false);
      this.call('configureBuild', this.config.build);
      this.call('configureAvailableResourceCurrencies', ['dutki']);
      this.call('configureAvailableResourceItemTypes', ['shop', 'event', 'reward', 'battle']);
      const initialized = this.call('initialize', this.config.gameKey, this.config.secretKey);
      if (!initialized) {
        this.debug('init failed: SDK initialize method not available', {
          sdkType: typeof sdk,
          sdkKeys: Object.keys(sdk).slice(0, 20),
        });
        this.enabled = false;
        return false;
      }
      this.enabled = true;
      this.debug('init success', {
        build: this.config.build,
        hasGameKey: Boolean(this.config.gameKey),
        hasSecretKey: Boolean(this.config.secretKey),
      });
      return true;
    } catch (error) {
      this.enabled = false;
      this.debug('init failed: SDK threw during initialization', {
        name: error instanceof Error ? error.name : 'unknown',
        message: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * @param {EngineEventKind} kind
   * @param {Record<string, unknown>} payload
   * @param {{ currentAct?: number, currentLevel?: number }} state
   * @returns {void}
   */
  trackEngineEvent(kind, payload, state) {
    if (!this.enabled || !sdk) return;
    const hasProgression =
      typeof sdk.addProgressionEvent === 'function' || typeof sdk === 'function';
    const hasDesign = typeof sdk.addDesignEvent === 'function' || typeof sdk === 'function';
    if (!hasProgression || !hasDesign) {
      this.debug('trackEngineEvent skipped: SDK event methods unavailable', {
        hasProgression,
        hasDesign,
      });
      return;
    }

    try {
      switch (kind) {
        case 'run_started': {
          this.call(
            'addProgressionEvent',
            enums.EGAProgressionStatus?.Start ?? 1,
            'run',
            `act_${sanitizeEventPart(state.currentAct ?? 1)}`
          );
          return;
        }
        case 'run_ended': {
          const status =
            payload.outcome === 'player_win'
              ? enums.EGAProgressionStatus.Complete
              : enums.EGAProgressionStatus.Fail;
          this.call(
            'addProgressionEvent',
            status,
            'run',
            `act_${sanitizeEventPart(state.currentAct ?? 1)}`,
            `floor_${sanitizeEventPart((state.currentLevel ?? 0) + 1)}`
          );
          return;
        }
        case 'battle_started': {
          const enemyId = sanitizeEventPart(payload?.enemy?.id);
          this.call(
            'addProgressionEvent',
            enums.EGAProgressionStatus?.Start ?? 1,
            'battle',
            enemyId
          );
          return;
        }
        case 'battle_ended': {
          const enemyId = sanitizeEventPart(payload?.enemy?.id);
          const status =
            payload.outcome === 'player_win'
              ? enums.EGAProgressionStatus.Complete
              : enums.EGAProgressionStatus.Fail;
          this.call('addProgressionEvent', status, 'battle', enemyId);
          return;
        }
        case 'shop_purchase': {
          const amount = Number(payload.price ?? 0);
          if (
            amount > 0 &&
            (typeof sdk.addResourceEvent === 'function' || typeof sdk === 'function')
          ) {
            this.call(
              'addResourceEvent',
              enums.EGAResourceFlowType?.Sink ?? 2,
              'dutki',
              amount,
              'shop',
              sanitizeEventPart(payload?.entity?.id)
            );
          }
          return;
        }
        case 'reward_picked': {
          this.call(
            'addDesignEvent',
            `reward_picked:${sanitizeEventPart(payload?.entity?.kind)}:${sanitizeEventPart(payload?.entity?.id)}`
          );
          return;
        }
        case 'event_resolved': {
          this.call(
            'addDesignEvent',
            `event_resolved:${sanitizeEventPart(payload?.event?.id)}:choice_${sanitizeEventPart(payload.choiceIndex)}`
          );
          return;
        }
        case 'node_entered': {
          this.call(
            'addDesignEvent',
            `node_entered:act_${sanitizeEventPart(state.currentAct ?? 1)}:${sanitizeEventPart(payload.nodeType)}`
          );
          return;
        }
        default:
          return;
      }
    } catch {
      // Never break gameplay due to analytics transport failures.
    }
  }

  /**
   * @param {{ outcome: string, floorReached: number, actReached: number, hasAct2Data: boolean }} meta
   * @returns {void}
   */
  trackTelemetryDownload(meta) {
    if (!this.enabled || !sdk) {
      this.debug('telemetry_download skipped: analytics disabled or SDK unavailable');
      return;
    }
    if (!(typeof sdk.addDesignEvent === 'function' || typeof sdk === 'function')) {
      this.debug('telemetry_download skipped: addDesignEvent unavailable');
      return;
    }

    try {
      const outcome = sanitizeEventPart(meta.outcome || 'unknown');
      const actReached = sanitizeEventPart(meta.actReached || 1);
      const act2Flag = meta.hasAct2Data ? 'act2_yes' : 'act2_no';

      this.debug('sending telemetry_download events', {
        outcome,
        actReached,
        floorReached: Number(meta.floorReached || 0),
        act2Flag,
      });

      this.call(
        'addDesignEvent',
        `telemetry_downloaded:outcome_${outcome}:act_${actReached}:${act2Flag}`
      );
      this.call(
        'addDesignEvent',
        'telemetry_downloaded:floor_reached',
        Number(meta.floorReached || 0)
      );
    } catch {
      // Never break gameplay due to analytics transport failures.
    }
  }

  /**
   * @param {Record<string, any>} payload
   * @returns {void}
   */
  trackRunTelemetry(payload) {
    if (!this.enabled || !sdk) {
      this.debug('run_telemetry skipped: analytics disabled or SDK unavailable');
      return;
    }
    if (!(typeof sdk.addDesignEvent === 'function' || typeof sdk === 'function')) {
      this.debug('run_telemetry skipped: addDesignEvent unavailable');
      return;
    }

    try {
      const outcome = sanitizeEventPart(payload?.run?.outcome || 'unknown');
      const actReached = sanitizeEventPart(payload?.run?.actReached || 1);
      const floorReached = Number(payload?.run?.floorReached || 0);
      const turns = Number(
        payload?.runSummary?.totalTurnsPlayed || payload?.run?.totalTurnsPlayed || 0
      );
      const totalDutki = Number(payload?.finalDutki || 0);
      const act2FloorCount = Number(payload?.act2?.floorCount || 0);

      this.debug('sending run_telemetry events', {
        outcome,
        actReached,
        floorReached,
        turns,
        totalDutki,
        act2FloorCount,
      });

      this.call('addDesignEvent', `run_telemetry:outcome_${outcome}:act_${actReached}`);
      this.call('addDesignEvent', 'run_telemetry:floor_reached', floorReached);
      this.call('addDesignEvent', 'run_telemetry:total_turns', turns);
      this.call('addDesignEvent', 'run_telemetry:total_dutki', totalDutki);
      this.call('addDesignEvent', 'run_telemetry:act2_floor_count', act2FloorCount);

      const act2Battles = Array.isArray(payload?.act2?.battles) ? payload.act2.battles : [];
      act2Battles.slice(0, 10).forEach((battle) => {
        const enemy = sanitizeEventPart(battle?.enemyId || 'unknown');
        const battleOutcome = sanitizeEventPart(battle?.outcome || 'unknown');
        this.call('addDesignEvent', `run_telemetry:act2_battle:${enemy}:${battleOutcome}`);
      });

      const act2Events = Array.isArray(payload?.act2?.events) ? payload.act2.events : [];
      act2Events.slice(0, 10).forEach((eventId) => {
        const eventPart = sanitizeEventPart(eventId);
        this.call('addDesignEvent', `run_telemetry:act2_event:${eventPart}`);
      });
    } catch {
      // Never break gameplay due to analytics transport failures.
    }
  }
}
