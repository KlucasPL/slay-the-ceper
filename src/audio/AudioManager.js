/**
 * Central manager for background music and global mute state.
 */
export class AudioManager {
  /**
   * @param {{ menuTrackUrl: string, state: import('../state/GameState.js').GameState }} options
   */
  constructor({ menuTrackUrl, state }) {
    this.state = state;

    /** @type {Set<HTMLAudioElement>} */
    this.tracks = new Set();

    /** @type {boolean} */
    this.hasUnlocked = false;

    /** @type {number} */
    this.titleVolume = 0.75;

    /** @type {number} */
    this.inGameVolume = 0.4;

    /** @type {'title' | 'inGame'} */
    this.context = 'title';

    /** @type {HTMLAudioElement} */
    this.menuTrack = this._createTrack(menuTrackUrl, true);

    /** @type {AudioContext | null} */
    this.sfxContext = null;
  }

  /**
   * @returns {boolean}
   */
  get isMuted() {
    return this.state.isMuted;
  }

  /**
   * @param {string} src
   * @param {boolean} [loop=false]
   * @returns {HTMLAudioElement}
   */
  _createTrack(src, loop = false) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.loop = loop;
    this.registerTrack(audio);
    return audio;
  }

  /**
   * @param {HTMLAudioElement} track
   */
  registerTrack(track) {
    this.tracks.add(track);
    this._applyVolumes();
  }

  /**
   * Starts title music after user interaction unlock.
   */
  unlockAndPlayMenu() {
    if (!this.hasUnlocked) {
      this.hasUnlocked = true;
    }
    this._ensureSfxContext();
    if (this.menuTrack.paused) {
      void this.menuTrack.play().catch(() => {
        // Browser may still block playback in edge cases until a stronger gesture.
      });
    }
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
   * @param {'title' | 'inGame'} context
   */
  setContext(context) {
    this.context = context;
    this._applyVolumes();
  }

  /**
   * Toggles global mute and applies volume to all registered tracks.
   */
  toggleMute() {
    this.state.isMuted = !this.state.isMuted;
    this._applyVolumes();
  }

  /**
   * Applies current context/mute volume to all tracks.
   */
  _applyVolumes() {
    const baseVolume = this.context === 'title' ? this.titleVolume : this.inGameVolume;
    const volume = this.state.isMuted ? 0 : baseVolume;
    this.tracks.forEach((track) => {
      track.volume = volume;
    });
  }
}
