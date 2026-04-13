/**
 * Central manager for background music and runtime audio options.
 */
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

    this.storageKeyMenu = 'slay-the-ceper:menu-music';
    this.storageKeyGame = 'slay-the-ceper:game-music';

    /** @type {boolean} */
    this.menuMusicEnabled = this._readBool(this.storageKeyMenu, true);
    /** @type {boolean} */
    this.gameMusicEnabled = this._readBool(this.storageKeyGame, true);

    const menuUrl = new URL('../audio/menu_theme.mp3', import.meta.url).href;
    const mapUrl = new URL('../audio/summit_sprint.mp3', import.meta.url).href;
    const gameUrl = new URL('../audio/battle.mp3', import.meta.url).href;
    const bossUrl = new URL('../audio/boss.mp3', import.meta.url).href;
    const victoryUrl = new URL('../audio/summit_stomp.mp3', import.meta.url).href;
    const defeatUrl = new URL('../audio/echoes_mourning_valley.mp3', import.meta.url).href;
    const shopUrl = new URL('../audio/shop.mp3', import.meta.url).href;
    const watraUrl = new URL('../audio/watra.mp3', import.meta.url).href;
    const fiakierEventUrl = new URL('../audio/fiakier_event.mp3', import.meta.url).href;

    /** @type {HTMLAudioElement} */
    this.menuTrack = this._createTrack(menuUrl, true, 0.7);
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
    this.fiakierEventTrack = this._createTrack(fiakierEventUrl, true, 0.5);

    /** @type {'title' | 'inGame'} */
    this.context = 'title';
    /** @type {'none' | 'defeat'} */
    this.themeLock = 'none';
    /** @type {'battle' | 'boss' | 'shop' | 'campfire' | 'map' | 'event'} */
    this.gameScene = 'map';

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
   * @param {string} key
   * @param {boolean} fallback
   * @returns {boolean}
   */
  _readBool(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return raw === 'true';
    } catch {
      return fallback;
    }
  }

  /**
   * @param {string} key
   * @param {boolean} value
   */
  _writeBool(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Ignore localStorage write failures.
    }
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
      this._stopInGameSceneTracks();
      this._stopOneShotThemes();
      if (this.menuMusicEnabled) {
        this._play(this.menuTrack);
      } else {
        this.menuTrack.pause();
        this.menuTrack.currentTime = 0;
      }
      return;
    }

    if (this.themeLock === 'defeat') return;

    this.menuTrack.pause();
    this.menuTrack.currentTime = 0;
    this._stopOneShotThemes();
    this.gameScene = 'map';
    if (this.gameMusicEnabled) {
      this.playMapMusic();
    } else {
      this._stopInGameSceneTracks();
    }
  }

  playMapMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'map';
    this.menuTrack.pause();
    this._stopInGameSceneTracks();
    if (this.gameMusicEnabled) {
      this._play(this.mapTrack);
    }
  }

  playBattleMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'battle';
    this.menuTrack.pause();
    this._stopInGameSceneTracks();
    if (this.gameMusicEnabled) {
      this._play(this.gameTrack);
    }
  }

  playFiakierEventMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'event';
    this.menuTrack.pause();
    this._stopInGameSceneTracks();
    if (this.gameMusicEnabled) {
      this._play(this.fiakierEventTrack);
    }
  }

  playBossMusic() {
    if (this.themeLock === 'defeat') return;
    this.gameScene = 'boss';
    this.menuTrack.pause();

    const gameWasPlaying = !this.gameTrack.paused;

    this.shopTrack.pause();
    this.shopTrack.currentTime = 0;
    this.watraTrack.pause();
    this.watraTrack.currentTime = 0;
    this.mapTrack.pause();
    this.mapTrack.currentTime = 0;
    this.fiakierEventTrack.pause();
    this.fiakierEventTrack.currentTime = 0;
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
    this.menuTrack.pause();
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
    this.menuTrack.pause();
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
    this.fiakierEventTrack.pause();
    this.fiakierEventTrack.currentTime = 0;
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

  _stopGameFlowTracks() {
    this.menuTrack.pause();
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
    this._writeBool(this.storageKeyMenu, enabled);
    if (!enabled) {
      this.menuTrack.pause();
      this.menuTrack.currentTime = 0;
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
    this._writeBool(this.storageKeyGame, enabled);
    if (!enabled) {
      this._stopInGameSceneTracks();
      this._stopOneShotThemes();
    } else if (this.themeLock === 'defeat') {
      this._play(this.defeatTrack);
    } else if (this.context === 'inGame') {
      if (this.gameScene === 'map') this.playMapMusic();
      else if (this.gameScene === 'battle') this.playBattleMusic();
      else if (this.gameScene === 'boss') this.playBossMusic();
      else if (this.gameScene === 'event') this.playFiakierEventMusic();
      else if (this.gameScene === 'shop') this.playShopMusic();
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
