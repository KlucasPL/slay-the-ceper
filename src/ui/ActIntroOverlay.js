/**
 * @typedef {{ partLabel: string, actLabel: string, title: string }} ActIntroData
 */

export class ActIntroOverlay {
  constructor() {
    /** @type {HTMLElement | null} */
    this.root = null;
    /** @type {number | null} */
    this.fallbackTimer = null;
  }

  /**
   * @param {ActIntroData} data
   * @returns {Promise<void>}
   */
  play(data) {
    this._ensureRoot();
    if (!this.root) return Promise.resolve();

    const partEl = this.root.querySelector('[data-act-part]');
    const actEl = this.root.querySelector('[data-act-label]');
    const titleEl = this.root.querySelector('[data-act-title]');
    const panel = this.root.querySelector('[data-act-panel]');

    if (!(partEl instanceof HTMLElement)) return Promise.resolve();
    if (!(actEl instanceof HTMLElement)) return Promise.resolve();
    if (!(titleEl instanceof HTMLElement)) return Promise.resolve();
    if (!(panel instanceof HTMLElement)) return Promise.resolve();

    partEl.textContent = data.partLabel;
    actEl.textContent = data.actLabel;
    actEl.classList.toggle('hidden', !data.actLabel?.trim());
    titleEl.textContent = data.title;

    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');

    panel.classList.remove('act-intro-panel--animate');
    void panel.offsetWidth;
    panel.classList.add('act-intro-panel--animate');

    return new Promise((resolve) => {
      const cleanup = () => {
        if (this.fallbackTimer !== null) {
          window.clearTimeout(this.fallbackTimer);
          this.fallbackTimer = null;
        }
        panel.removeEventListener('animationend', onEnd);
        panel.classList.remove('act-intro-panel--animate');
        this.root?.classList.add('hidden');
        this.root?.setAttribute('aria-hidden', 'true');
        resolve();
      };

      const onEnd = (event) => {
        if (event.target !== panel || event.animationName !== 'actIntroReveal') return;
        cleanup();
      };

      panel.addEventListener('animationend', onEnd);
      this.fallbackTimer = window.setTimeout(cleanup, 3700);
    });
  }

  _ensureRoot() {
    if (this.root) return;

    const overlay = document.createElement('div');
    overlay.id = 'act-intro-overlay';
    overlay.className = 'act-intro-overlay hidden';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="act-intro-backdrop"></div>
      <div class="act-intro-panel" data-act-panel>
        <svg class="act-intro-motif" viewBox="0 0 320 64" role="img" aria-label="Góralski motyw dekoracyjny">
          <path d="M12 52 L48 18 L84 52 L120 24 L156 52 L192 18 L228 52 L264 28 L308 52" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M34 52 L48 40 L62 52" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          <path d="M178 52 L192 40 L206 52" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          <circle cx="120" cy="24" r="4" fill="currentColor"/>
          <circle cx="264" cy="28" r="4" fill="currentColor"/>
        </svg>
        <p class="act-intro-part" data-act-part>CZĘŚĆ PIERWSZA</p>
        <p class="act-intro-act" data-act-label>AKT I</p>
        <h2 class="act-intro-title" data-act-title>KRUPÓWKI</h2>
      </div>
    `;

    document.body.appendChild(overlay);
    this.root = overlay;
  }
}
