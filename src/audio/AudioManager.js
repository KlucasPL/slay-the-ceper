

export class AudioManager {
  /**
   * @param {import('../state/GameState.js').GameState} state
   * @param {string} menuTrackUrl
   */
  constructor(state, menuTrackUrl) {
    this.state = state;
    /** @type {'title' | 'inGame'} */
    this.context = 'title';
    /** @type {Map<HTMLAudioElement, number>} */
    this.sounds = new Map();
    /** @type {Record<'title' | 'inGame', number>} */
    this.menuContextVolume = {
      title: 0.72,
      inGame: 0.4,
    };
    /** @type {boolean} */
    this.hasUnlockedPlayback = false;

    this.menuMusic = new Audio(menuTrackUrl);
    this.menuMusic.loop = true;
    this.menuMusic.preload = 'auto';

    this.registerSound(this.menuMusic, 1);
    this._applyVolumes();
  }

  /**
   * @param {HTMLAudioElement} audio
   * @param {number} [baseVolume]
   */
  registerSound(audio, baseVolume = 1) {
    this.sounds.set(audio, baseVolume);
    this._applyVolumes();
  }

  /**
   * @param {HTMLAudioElement} audio
   */
  unregisterSound(audio) {
    this.sounds.delete(audio);
  }

  /**
   * @param {'title' | 'inGame'} context
   */
  setContext(context) {
    this.context = context;
    this._applyVolumes();
  }

  /**
   * @returns {boolean}
   */
  toggleMusicMute() {
    this.state.isMusicMuted = !this.state.isMusicMuted;
    this._applyVolumes();
    return this.state.isMusicMuted;
  }

  setMusicMuted(isMuted) {
    this.state.isMusicMuted = isMuted;
    this._applyVolumes();
  }

  /**
   * Attempts to start menu music after a user interaction.
   * @returns {Promise<boolean>}
   */
  async unlockAndPlayMenu() {
    this.hasUnlockedPlayback = true;
    this._applyVolumes();
    if (!this.menuMusic.paused) return true;
    try {
      await this.menuMusic.play();
      return true;
    } catch {
      return false;
    }
  }

  _applyVolumes() {
    const menuMultiplier = this.menuContextVolume[this.context];
    this.sounds.forEach((baseVolume, audio) => {
      let volume = baseVolume;
      if (audio === this.menuMusic) {
        volume *= menuMultiplier;
        if (this.state.isMusicMuted) volume = 0;
      }
      audio.volume = Math.min(1, Math.max(0, volume));
    });
  }
}