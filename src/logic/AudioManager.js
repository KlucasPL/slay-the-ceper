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

    /** @type {boolean} */
    this.hasUnlocked = false;

    this.storageKeyMenu = 'slay-the-ceper:menu-music';
    this.storageKeyGame = 'slay-the-ceper:game-music';

    /** @type {boolean} */
    this.menuMusicEnabled = this._readBool(this.storageKeyMenu, true);
    /** @type {boolean} */
    this.gameMusicEnabled = this._readBool(this.storageKeyGame, true);

    const menuUrl = new URL('../audio/menu_theme.mp3', import.meta.url).href;
    const gameUrl = new URL('../audio/summit_sprint.mp3', import.meta.url).href;
    const victoryUrl = new URL('../audio/summit_stomp.mp3', import.meta.url).href;
    const defeatUrl = new URL('../audio/echoes_mourning_valley.mp3', import.meta.url).href;
    const shopUrl = new URL('../audio/shop.mp3', import.meta.url).href;
    const watraUrl = new URL('../audio/watra.mp3', import.meta.url).href;

    /** @type {HTMLAudioElement} */
    this.menuTrack = this._createTrack(menuUrl, true, 0.7);
    /** @type {HTMLAudioElement} */
    this.gameTrack = this._createTrack(gameUrl, true, 0.45);
    /** @type {HTMLAudioElement} */
    this.victoryTrack = this._createTrack(victoryUrl, false, 0.65);
    /** @type {HTMLAudioElement} */
    this.defeatTrack = this._createTrack(defeatUrl, true, 0.62);
    /** @type {HTMLAudioElement} */
    this.shopTrack = this._createTrack(shopUrl, true, 0.5);
    /** @type {HTMLAudioElement} */
    this.watraTrack = this._createTrack(watraUrl, true, 0.5);

    /** @type {'title' | 'inGame'} */
    this.context = 'title';
    /** @type {'none' | 'defeat'} */
    this.themeLock = 'none';
    /** @type {'battle' | 'shop' | 'campfire' | 'map'} */
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
    this.gameScene = 'battle';
    if (this.gameMusicEnabled) {
      this.playBattleMusic();
    } else {
      this._stopInGameSceneTracks();
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
      this.gameScene = 'battle';
      if (this.context === 'inGame' && this.gameMusicEnabled && this.themeLock !== 'defeat') {
        this.playBattleMusic();
      }
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
      this.gameScene = 'battle';
      if (this.context === 'inGame' && this.gameMusicEnabled && this.themeLock !== 'defeat') {
        this.playBattleMusic();
      }
    }
  }

  stopInGameMusic() {
    this._stopInGameSceneTracks();
  }

  _stopInGameSceneTracks() {
    this.gameTrack.pause();
    this.gameTrack.currentTime = 0;
    this.shopTrack.pause();
    this.shopTrack.currentTime = 0;
    this.watraTrack.pause();
    this.watraTrack.currentTime = 0;
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
      if (this.gameScene === 'battle') this.playBattleMusic();
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
}
