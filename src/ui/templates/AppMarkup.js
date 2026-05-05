import titleScreenHtml from './titleScreen.html?raw';
import releaseNotesModalHtml from './releaseNotesModal.html?raw';
import gameWrapperHtml from './gameWrapper.html?raw';
import overlaysHtml from './overlays.html?raw';
import hudWidgetsHtml from './hudWidgets.html?raw';
import optionsModalHtml from './optionsModal.html?raw';

const APP_MARKUP = `
<div id="game-canvas">
${titleScreenHtml}
${releaseNotesModalHtml}
${gameWrapperHtml}
${overlaysHtml}
</div>
${hudWidgetsHtml}
${optionsModalHtml}
`;

/**
 * Mounts prebuilt HTML templates into the static app root.
 *
 * @returns {void}
 */
export function mountAppMarkup() {
  const appRoot = document.getElementById('app-root');
  if (!appRoot) return;

  appRoot.innerHTML = APP_MARKUP;
}
