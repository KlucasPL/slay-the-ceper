/**
 * Full-screen motion-comic intro shown before the main game UI is initialized.
 */
const MOTION_COMIC_DURATION_MS = 30000;
const MOTION_COMIC_FALLBACK_BUFFER_MS = 100;

export class MotionComicIntro {
  constructor() {
    /** @type {HTMLElement | null} */
    this.root = null;
    /** @type {HTMLElement | null} */
    this.track = null;
    /** @type {number | null} */
    this.fallbackTimer = null;
    /** @type {boolean} */
    this.isActive = false;
    /** @type {(() => void) | null} */
    this.cleanupListeners = null;
  }

  /**
   * @returns {Promise<void>}
   */
  play() {
    this._mount();
    if (!this.root || !this.track) return Promise.resolve();

    this.isActive = true;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.root.style.setProperty('--motion-comic-duration', `${MOTION_COMIC_DURATION_MS}ms`);

    this.track.classList.remove('motion-comic-track--animate');
    void this.track.offsetWidth;
    this.track.classList.add('motion-comic-track--animate');

    return new Promise((resolve) => {
      const finish = () => {
        if (!this.isActive) return;
        this.isActive = false;

        if (this.fallbackTimer !== null) {
          window.clearTimeout(this.fallbackTimer);
          this.fallbackTimer = null;
        }

        this.track?.removeEventListener('animationend', onAnimationEnd);
        this.cleanupListeners?.();
        this.cleanupListeners = null;

        this._destroy();
        resolve();
      };

      const onAnimationEnd = (event) => {
        if (event.target !== this.track || event.animationName !== 'motionComicPan') return;
        finish();
      };

      const onKeyDown = (event) => {
        if (!this.isActive) return;
        if (event.code !== 'Escape') return;
        event.preventDefault();
        finish();
      };

      const onPointerDown = (event) => {
        if (!this.isActive) return;
        if (event.button !== 0) return;
        event.preventDefault();
        finish();
      };

      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('pointerdown', onPointerDown, true);
      this.cleanupListeners = () => {
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('pointerdown', onPointerDown, true);
      };

      this.track.addEventListener('animationend', onAnimationEnd);
      this.fallbackTimer = window.setTimeout(
        finish,
        MOTION_COMIC_DURATION_MS + MOTION_COMIC_FALLBACK_BUFFER_MS
      );
    });
  }

  _mount() {
    if (this.root) return;

    const root = document.createElement('section');
    root.id = 'motion-comic-intro';
    root.className = 'motion-comic-intro hidden';
    root.setAttribute('aria-hidden', 'true');

    const imageUrl = new URL('../pictures/intro.png', import.meta.url).href;
    root.innerHTML = `
      <div class="motion-comic-viewport" aria-label="Intro komiksowy">
        <img class="motion-comic-track" src="${imageUrl}" alt="Komiksowy prolog Slay the Ceper" />
      </div>
      <p class="motion-comic-skip">Naciśnij ESC lub kliknij, aby pominąć</p>
    `;

    document.body.appendChild(root);
    this.root = root;
    this.track = root.querySelector('.motion-comic-track');
  }

  _destroy() {
    if (!this.root) return;
    this.root.remove();
    this.root = null;
    this.track = null;
  }
}
