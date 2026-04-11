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
    if (this.menuTrack.paused) {
      void this.menuTrack.play().catch(() => {
        // Browser may still block playback in edge cases until a stronger gesture.
      });
    }
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
