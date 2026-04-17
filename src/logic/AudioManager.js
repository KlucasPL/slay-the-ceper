/**
 * Central manager for background music and runtime audio options.
 */
import {
  getMenuMusicEnabled,
  setMenuMusicEnabled,
  getGameMusicEnabled,
  setGameMusicEnabled,
} from './settings.js';

export class AudioManager {
  /**
   * @param {{ state: import('../state/GameState.js').GameState }} options
   */
  constructor({ state }) {
    this.state = state;

    /** @type {Set<HTMLAudioElement>} */
    this.tracks = new Set();
    /** @type {Map<HTMLAudioElement, number>} */
    this.trackBaseVolume = new Map();

    /** @type {boolean} */
    this.hasUnlocked = false;

    /** @type {boolean} */
    this.menuMusicEnabled = getMenuMusicEnabled();
    /** @type {boolean} */
    this.gameMusicEnabled = getGameMusicEnabled();

    // Two interchangeable menu BGM tracks — one is chosen at random each session.
    const menuUrls = [
      new URL('../audio/main_menu.mp3', import.meta.url).href,
      new URL('../audio/main_menu_2.mp3', import.meta.url).href,
    ];
    const mapUrl = new URL('../audio/summit_sprint.mp3', import.meta.url).href;
    const gameUrl = new URL('../audio/battle.mp3', import.meta.url).href;
    const bossUrl = new URL('../audio/boss.mp3', import.meta.url).href;
    const victoryUrl = new URL('../audio/summit_stomp.mp3', import.meta.url).href;
    const defeatUrl = new URL('../audio/echoes_mourning_valley.mp3', import.meta.url).href;
    const shopUrl = new URL('../audio/shop.mp3', import.meta.url).href;
    const watraUrl = new URL('../audio/watra.mp3', import.meta.url).href;
    const marynaUrl = new URL('../audio/maryna.mp3', import.meta.url).href;
    const fiakierEventUrl = new URL('../audio/fiakier_event.mp3', import.meta.url).href;
    const karykaturaEventUrl = new URL('../audio/karykatura_event.mp3', import.meta.url).href;
    const trzyKubkiEventUrl = new URL('../audio/event_trzy_kubki.mp3', import.meta.url).href;

    /** @type {HTMLAudioElement[]} Menu BGM pool — both tracks are pre-loaded; one is active at a time. */
    this.menuTrackPool = menuUrls.map((url) => this._createTrack(url, true, 0.7));
    /** @type {HTMLAudioElement} Randomly selected active menu track (re-randomized on each title entry). */
    this.menuTrack = this._getRandomMenuTrack();
    /** @type {HTMLAudioElement} */
    this.mapTrack = this._createTrack(mapUrl, true, 0.45);
    /** @type {HTMLAudioElement} */
    this.gameTrack = this._createTrack(gameUrl, true, 0.45);
    /** @type {HTMLAudioElement} */
    this.bossTrack = this._createTrack(bossUrl, true, 0.52);
    /** @type {HTMLAudioElement} */
    this.victoryTrack = this._createTrack(victoryUrl, false, 0.65);
    /** @type {HTMLAudioElement} */
    this.defeatTrack = this._createTrack(defeatUrl, true, 0.62);
    /** @type {HTMLAudioElement} */
    this.shopTrack = this._createTrack(shopUrl, true, 0.5);
    /** @type {HTMLAudioElement} */
    this.watraTrack = this._createTrack(watraUrl, true, 0.5);
    /** @type {HTMLAudioElement} */
    this.marynaTrack = this._createTrack(marynaUrl, true, 0.5);
    /** @type {HTMLAudioElement} */
    this.fiakierEventTrack = this._createTrack(fiakierEventUrl, true, 0.5);
    /** @type {HTMLAudioElement} */
    this.karykaturaEventTrack = this._createTrack(karykaturaEventUrl, true, 0.5);
    /** @type {HTMLAudioElement} */
    this.trzyKubkiEventTrack = this._createTrack(trzyKubkiEventUrl, true, 0.5);

    /** @type {'title' | 'inGame'} */
    this.context = 'title';
    /** @type {'none' | 'defeat'} */
    this.themeLock = 'none';
    /** @type {'battle' | 'boss' | 'shop' | 'campfire' | 'map' | 'event' | 'maryna'} */
    this.gameScene = 'map';
    /** @type {'fiakier' | 'karykatura' | 'trzy_kubki' | null} */
    this.eventSceneTrack = null;

    /** @type {AudioContext | null} */
    this.sfxContext = null;

    this._applyMuteToAll();
    this.playMenuOnLoad();
  }

  /** @returns {boolean} */
  get isMuted() {
    return this.state.isMuted;
  }

  /** @returns {boolean} */
  get isMenuMusicEnabled() {
    return this.menuMusicEnabled;
  }

  /** @returns {boolean} */
  get isGameMusicEnabled() {
    return this.gameMusicEnabled;
  }

  /**
   * @param {string} src
   * @param {boolean} loop
   * @param {number} volume
   * @returns {HTMLAudioElement}
   */
  _createTrack(src, loop, volume) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.loop = loop;
    audio.volume = volume;
    this.tracks.add(audio);
    this.trackBaseVolume.set(audio, volume);
    return audio;
  }

  playMenuOnLoad() {
    if (!this.menuMusicEnabled) return;
    this._stopGameFlowTracks();
    this._play(this.menuTrack);
  }

  unlockAndPlayMenu() {
    this.hasUnlocked = true;
    this._ensureSfxContext();
    // Only restart menu music if we are still on the title screen and it is actually paused.
    if (this.context === 'title' && this.menuMusicEnabled && this.menuTrack.paused) {
      this._stopGameFlowTracks();
      this._play(this.menuTrack);
    }
  }

  /**
   * @param {'title' | 'inGame'} context
   */
  setContext(context) {
    if (this.context === context) {
      return;
    }

    this.context = context;
    if (context === 'title') {
      this.themeLock = 'none';
      this.gameScene = 'map';
      this.eventSceneTrack = null;
      this._stopInGameSceneTracks();
      this._stopOneShotThemes();
      // Pick a fresh random track each time the player returns to the title screen.
      this._stopAllMenuTracks();
      this.menuTrack = this._getRandomMenuTrack();
      if (this.menuMusicEnabled) {
        this._play(this.menuTrack);
      }
      return;
    }

    if (this.themeLock === 'defeat') return;

    this._stopAllMenuTracks();
    this._stopOneShotThemes();
    this.gameScene = 'map';
    this.eventSceneTrack = null;
    if (this.gameMusicEnabled) {
      this.playMapMusic();
    } else {
      this._stopInGameSceneTracks();
    }
  }

  playMapMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'map';
    this._stopAllMenuTracks();
    this._stopInGameSceneTracks();
    if (this.gameMusicEnabled) {
      this._play(this.mapTrack);
    }
  }

  playBattleMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'battle';
    this._stopAllMenuTracks();
    this._stopInGameSceneTracks();
    if (this.gameMusicEnabled) {
      this._play(this.gameTrack);
    }
  }

  /**
   * @param {string} eventId
   */
  playEventMusic(eventId) {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'event';
    this._stopAllMenuTracks();
    this._stopInGameSceneTracks();

    let eventTrack = this.fiakierEventTrack;
    if (eventId === 'event_karykaturzysta') {
      this.eventSceneTrack = 'karykatura';
      eventTrack = this.karykaturaEventTrack;
    } else if (eventId === 'event_hazard_karton') {
      this.eventSceneTrack = 'trzy_kubki';
      eventTrack = this.trzyKubkiEventTrack;
    } else {
      this.eventSceneTrack = 'fiakier';
    }

    if (this.gameMusicEnabled) {
      this._play(eventTrack);
    }
  }

  playFiakierEventMusic() {
    this.playEventMusic('fiakier_event');
  }

  playKarykaturaEventMusic() {
    this.playEventMusic('event_karykaturzysta');
  }

  playBossMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'boss';
    this._stopAllMenuTracks();

    const gameWasPlaying = !this.gameTrack.paused;

    this.shopTrack.pause();
    this.shopTrack.currentTime = 0;
    this.watraTrack.pause();
    this.watraTrack.currentTime = 0;
    this.marynaTrack.pause();
    this.marynaTrack.currentTime = 0;
    this.mapTrack.pause();
    this.mapTrack.currentTime = 0;
    this.fiakierEventTrack.pause();
    this.fiakierEventTrack.currentTime = 0;
    this.karykaturaEventTrack.pause();
    this.karykaturaEventTrack.currentTime = 0;
    this.trzyKubkiEventTrack.pause();
    this.trzyKubkiEventTrack.currentTime = 0;
    this.bossTrack.pause();
    this.bossTrack.currentTime = 0;

    if (!this.gameMusicEnabled) {
      this.gameTrack.pause();
      this.gameTrack.currentTime = 0;
      return;
    }

    if (gameWasPlaying) {
      this._fadeOutTrack(this.gameTrack, 500, () => {
        if (this.themeLock === 'defeat') return;
        if (!this.gameMusicEnabled || this.gameScene !== 'boss') return;
        this._play(this.bossTrack);
      });
      return;
    }

    this.gameTrack.pause();
    this.gameTrack.currentTime = 0;
    this._play(this.bossTrack);
  }

  startInGameMusic() {
    this.playBattleMusic();
  }

  playShopMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'shop';
    this._stopAllMenuTracks();
    this._stopInGameSceneTracks();
    if (this.gameMusicEnabled) {
      this._play(this.shopTrack);
    }
  }

  stopShopMusic() {
    this.shopTrack.pause();
    this.shopTrack.currentTime = 0;
    if (this.gameScene === 'shop') {
      this.gameScene = 'map';
    }
  }

  playCampfireMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'campfire';
    this._stopAllMenuTracks();
    this._stopInGameSceneTracks();
    if (this.gameMusicEnabled) {
      this._play(this.watraTrack);
    }
  }

  stopCampfireMusic() {
    this.watraTrack.pause();
    this.watraTrack.currentTime = 0;
    if (this.gameScene === 'campfire') {
      this.gameScene = 'map';
    }
  }

  playMarynaMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'maryna';
    this._stopAllMenuTracks();
    this._stopInGameSceneTracks();
    if (this.gameMusicEnabled) {
      this._play(this.marynaTrack);
    }
  }

  stopMarynaMusic() {
    this.marynaTrack.pause();
    this.marynaTrack.currentTime = 0;
    if (this.gameScene === 'maryna') {
      this.gameScene = 'map';
    }
  }

  stopInGameMusic() {
    this._stopInGameSceneTracks();
  }

  _stopInGameSceneTracks() {
    this.mapTrack.pause();
    this.mapTrack.currentTime = 0;
    this.gameTrack.pause();
    this.gameTrack.currentTime = 0;
    this.bossTrack.pause();
    this.bossTrack.currentTime = 0;
    this.shopTrack.pause();
    this.shopTrack.currentTime = 0;
    this.watraTrack.pause();
    this.watraTrack.currentTime = 0;
    this.marynaTrack.pause();
    this.marynaTrack.currentTime = 0;
    this.fiakierEventTrack.pause();
    this.fiakierEventTrack.currentTime = 0;
    this.karykaturaEventTrack.pause();
    this.karykaturaEventTrack.currentTime = 0;
    this.trzyKubkiEventTrack.pause();
    this.trzyKubkiEventTrack.currentTime = 0;
  }

  playVictoryTheme() {
    this.themeLock = 'none';
    this.stopInGameMusic();
    this._stopOneShotThemes();
    if (this.gameMusicEnabled) {
      this._play(this.victoryTrack);
    }
  }

  playDefeatTheme() {
    this.themeLock = 'defeat';
    this.stopInGameMusic();
    this._stopOneShotThemes();
    if (this.gameMusicEnabled) {
      this._play(this.defeatTrack);
    }
  }

  /**
   * Returns a randomly picked track from the menu BGM pool.
   * @returns {HTMLAudioElement}
   */
  _getRandomMenuTrack() {
    return this.menuTrackPool[Math.floor(Math.random() * this.menuTrackPool.length)];
  }

  /**
   * Stops and rewinds every track in the menu BGM pool.
   * Call this instead of `this.menuTrack.pause()` when you need a hard stop
   * (e.g. entering the game, returning to a fresh title screen).
   */
  _stopAllMenuTracks() {
    this.menuTrackPool.forEach((track) => {
      track.pause();
      track.currentTime = 0;
    });
  }

  _stopGameFlowTracks() {
    this._stopAllMenuTracks();
    this._stopInGameSceneTracks();
    this._stopOneShotThemes();
  }

  _stopOneShotThemes() {
    this.victoryTrack.pause();
    this.victoryTrack.currentTime = 0;
    this.defeatTrack.pause();
    this.defeatTrack.currentTime = 0;
  }

  /**
   * @param {boolean} enabled
   * @returns {boolean}
   */
  toggleMenuMusic(enabled) {
    this.menuMusicEnabled = enabled;
    setMenuMusicEnabled(enabled);
    if (!enabled) {
      this._stopAllMenuTracks();
    } else if (this.context === 'title') {
      this._play(this.menuTrack);
    }
    return this.menuMusicEnabled;
  }

  /**
   * @param {boolean} enabled
   * @returns {boolean}
   */
  toggleGameMusic(enabled) {
    this.gameMusicEnabled = enabled;
    setGameMusicEnabled(enabled);
    if (!enabled) {
      this._stopInGameSceneTracks();
      this._stopOneShotThemes();
    } else if (this.themeLock === 'defeat') {
      this._play(this.defeatTrack);
    } else if (this.context === 'inGame') {
      if (this.gameScene === 'map') this.playMapMusic();
      else if (this.gameScene === 'battle') this.playBattleMusic();
      else if (this.gameScene === 'boss') this.playBossMusic();
      else if (this.gameScene === 'event') {
        if (this.eventSceneTrack === 'karykatura') this.playKarykaturaEventMusic();
        else if (this.eventSceneTrack === 'trzy_kubki') this.playEventMusic('event_hazard_karton');
        else this.playFiakierEventMusic();
      } else if (this.gameScene === 'shop') this.playShopMusic();
      else if (this.gameScene === 'campfire') this.playCampfireMusic();
    }
    return this.gameMusicEnabled;
  }

  clearDefeatThemeLock() {
    this.themeLock = 'none';
    this.gameScene = 'map';
    this.defeatTrack.pause();
    this.defeatTrack.currentTime = 0;
  }

  toggleMute() {
    this.state.isMuted = !this.state.isMuted;
    this._applyMuteToAll();
  }

  _applyMuteToAll() {
    const muted = this.state.isMuted;
    this.tracks.forEach((track) => {
      track.muted = muted;
    });
  }

  _ensureSfxContext() {
    if (this.sfxContext) return;
    try {
      this.sfxContext = new AudioContext();
    } catch {
      this.sfxContext = null;
    }
  }

  playMissSound() {
    if (this.state.isMuted) return;
    this._ensureSfxContext();
    if (!this.sfxContext) return;

    const ctx = this.sfxContext;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.12);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * @param {HTMLAudioElement} track
   */
  _play(track) {
    if (!track) return;
    void track.play().catch(() => {
      // Autoplay can fail before user gesture. We retry on next interaction.
    });
  }

  /**
   * @param {HTMLAudioElement} track
   * @param {number} durationMs
   * @param {(() => void) | undefined} onComplete
   */
  _fadeOutTrack(track, durationMs, onComplete) {
    if (track.paused) {
      track.currentTime = 0;
      track.volume = this.trackBaseVolume.get(track) ?? track.volume;
      onComplete?.();
      return;
    }

    const originalVolume = this.trackBaseVolume.get(track) ?? track.volume;
    const startVolume = track.volume;
    const startedAt = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      track.volume = Math.max(0, startVolume * (1 - progress));
      if (progress < 1) {
        requestAnimationFrame(step);
        return;
      }
      track.pause();
      track.currentTime = 0;
      track.volume = originalVolume;
      onComplete?.();
    };

    requestAnimationFrame(step);
  }
}
