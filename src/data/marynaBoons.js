/**
 * @typedef {{
 *   id: string,
 *   relicId: string,
 *   name: string,
 *   flavor: string,
 *   effectDesc: string,
 *   emoji: string,
 * }} MarynaBoonDef
 */

/** @type {Record<string, MarynaBoonDef>} */
export const marynaBoonLibrary = {
  mokra_sciera: {
    id: 'mokra_sciera',
    relicId: 'relic_boon_mokra_sciera',
    name: 'Mokra Ściera Maryny',
    flavor: 'Wstawaj. Najpierw zimny okład, potem wielkie czyny.',
    effectDesc: '+12 maks. Krzepy i +12 Krzepy (do nowego limitu).',
    emoji: '🧹',
  },
  kiesa: {
    id: 'kiesa',
    relicId: 'relic_boon_kiesa',
    name: 'Kiesa na Pierwszy Dzień',
    flavor: 'Masz, ale nie przewal wszystkiego na jarmarku.',
    effectDesc: '+80 Dutków od razu; +20 Dutków po pierwszym zwycięstwie (jednorazowo).',
    emoji: '💰',
  },
  przeglad_plecaka: {
    id: 'przeglad_plecaka',
    relicId: 'relic_boon_przeglad_plecaka',
    name: 'Przegląd Plecaka Maryny',
    flavor: 'Ten złom wyrzuć, to ci zostawiam.',
    effectDesc: 'Usuń 1 losową kartę startową z talii; dodaj 1 losową kartę niepowszechną.',
    emoji: '🎒',
  },
  sloik_rosolu: {
    id: 'sloik_rosolu',
    relicId: 'relic_boon_sloik_rosolu',
    name: 'Słoik Rosołu na Drogę',
    flavor: 'Na trzy pierwsze bitki starczy ci mocy i ciepła.',
    effectDesc: 'Przez pierwsze 3 walki na starcie: +6 Gardy i +1 Siły.',
    emoji: '🍲',
  },
  zloty_rozaniec: {
    id: 'zloty_rozaniec',
    relicId: 'relic_boon_zloty_rozaniec',
    name: 'Złoty Różaniec Maryny',
    flavor: 'Pomódl się i bij dwa razy mocniej!',
    effectDesc: 'Na starcie każdej walki: pierwsze trafienie atakiem zadaje podwójne obrażenia.',
    emoji: '📿',
  },
  lista_zakupow: {
    id: 'lista_zakupow',
    relicId: 'relic_boon_lista_zakupow',
    name: 'Lista Zakupów',
    flavor: 'Kup mądrze, nie jak ceper na Krupówkach.',
    effectDesc: 'Pierwszy sklep: karty -30%. Pierwsze usunięcie karty w wyprawie za 0 Dutków.',
    emoji: '📜',
  },
  tajny_skladnik: {
    id: 'tajny_skladnik',
    relicId: 'relic_boon_tajny_skladnik',
    name: 'Tajny Składnik Maryny',
    flavor: 'Najpierw ich osłabi, potem ich dobij.',
    effectDesc: 'Na starcie każdej walki wróg dostaje 1 Słaby i 1 Kruchy.',
    emoji: '🌿',
  },
};

/**
 * Returns `count` unique random boon IDs from the library.
 * @param {number} [count]
 * @returns {string[]}
 */
export function rollMarynaChoices(count = 3) {
  const ids = Object.keys(marynaBoonLibrary);
  const result = [];
  const pool = [...ids];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

export const marynaSvg = `
<svg viewBox="0 0 240 140" width="220" height="130" aria-hidden="true">
  <!-- Sky and mountain silhouette -->
  <rect width="240" height="140" fill="#cedbe8"/>
  <polygon points="0,95 40,55 80,80 120,35 160,65 200,45 240,70 240,140 0,140" fill="#8fa8bf"/>
  <polygon points="0,110 40,75 80,95 120,55 160,80 200,65 240,85 240,140 0,140" fill="#a8bfcf"/>
  <!-- Ground / doorstep -->
  <rect x="0" y="118" width="240" height="22" rx="0" fill="#8b6a45"/>
  <rect x="30" y="112" width="180" height="12" rx="4" fill="#a07c55"/>

  <!-- Skirt -->
  <polygon points="90,140 102,94 138,94 150,140" fill="#2c2c3a"/>
  <!-- Blouse body -->
  <rect x="100" y="72" width="40" height="26" rx="6" fill="#f5f0e8"/>
  <!-- Gorsetka (embroidered vest) -->
  <rect x="103" y="73" width="34" height="24" rx="4" fill="#8b1a1a"/>
  <line x1="120" y1="74" x2="120" y2="96" stroke="#f5f0e8" stroke-width="1.5"/>
  <circle cx="111" cy="79" r="2" fill="#f5c842"/>
  <circle cx="111" cy="86" r="2" fill="#f5c842"/>
  <circle cx="111" cy="93" r="2" fill="#f5c842"/>
  <circle cx="129" cy="79" r="2" fill="#f5c842"/>
  <circle cx="129" cy="86" r="2" fill="#f5c842"/>
  <circle cx="129" cy="93" r="2" fill="#f5c842"/>
  <!-- Red embroidery detail on blouse sleeves -->
  <path d="M100,78 Q93,82 92,90" fill="none" stroke="#f5f0e8" stroke-width="5" stroke-linecap="round"/>
  <path d="M140,78 Q147,82 148,90" fill="none" stroke="#f5f0e8" stroke-width="5" stroke-linecap="round"/>
  <path d="M100,78 Q93,82 92,90" fill="none" stroke="#c0392b" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,2"/>
  <path d="M140,78 Q147,82 148,90" fill="none" stroke="#c0392b" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,2"/>

  <!-- Head -->
  <circle cx="120" cy="58" r="14" fill="#e1b48e"/>
  <!-- Wrinkle lines -->
  <path d="M112,54 Q113,52 116,54" fill="none" stroke="#c8956a" stroke-width="1"/>
  <path d="M124,54 Q127,52 128,54" fill="none" stroke="#c8956a" stroke-width="1"/>
  <path d="M113,60 Q120,63 127,60" fill="none" stroke="#c8956a" stroke-width="1"/>
  <!-- Eyes -->
  <circle cx="114" cy="56" r="2" fill="#3a2010"/>
  <circle cx="126" cy="56" r="2" fill="#3a2010"/>
  <!-- Friendly smile -->
  <path d="M114,63 Q120,67 126,63" fill="none" stroke="#3a2010" stroke-width="1.5" stroke-linecap="round"/>
  <!-- White chusta (headscarf) -->
  <path d="M106,50 Q108,40 120,38 Q132,40 134,50 L134,58 Q120,52 106,58 Z" fill="#f5f0e8"/>
  <path d="M107,58 Q112,62 120,60 Q128,62 133,58" fill="none" stroke="#dedbd0" stroke-width="1"/>
  <!-- Chusta knot under chin -->
  <ellipse cx="120" cy="68" rx="7" ry="4" fill="#f5f0e8"/>

  <!-- Left arm holding Slazyk (herb bundle), reaching toward viewer -->
  <line x1="100" y1="82" x2="78" y2="100" stroke="#e1b48e" stroke-width="8" stroke-linecap="round"/>
  <!-- Slazyk (small bundle of herbs) -->
  <line x1="78" y1="100" x2="62" y2="92" stroke="#5a8a3a" stroke-width="3" stroke-linecap="round"/>
  <line x1="78" y1="100" x2="58" y2="97" stroke="#5a8a3a" stroke-width="3" stroke-linecap="round"/>
  <line x1="78" y1="100" x2="60" y2="104" stroke="#5a8a3a" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="70" cy="96" rx="10" ry="6" fill="#4a7a2a" opacity="0.7"/>
  <line x1="72" y1="100" x2="80" y2="106" stroke="#8b6a45" stroke-width="2" stroke-linecap="round"/>
  <!-- Twine around herb bundle -->
  <path d="M70,100 Q75,102 80,100" fill="none" stroke="#c0392b" stroke-width="1.5"/>

  <!-- Right arm -->
  <line x1="140" y1="82" x2="158" y2="96" stroke="#e1b48e" stroke-width="8" stroke-linecap="round"/>
  <!-- Right hand -->
  <circle cx="158" cy="96" r="5" fill="#e1b48e"/>
</svg>`;
