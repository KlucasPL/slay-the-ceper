/**
 * @typedef {{ type: 'attack', name: string, damage: number, hits?: number, applyWeak?: number, applyFrail?: number } | { type: 'block', name: string, block: number, heal?: number } | { type: 'buff', name: string, strengthGain?: number, block?: number } | { type: 'status', name: string, addStatusCard: string, amount?: number }} EnemyMoveDef
 * @typedef {{ id: string, name: string, emoji: string, hp: number, maxHp: number, block: number, baseAttack?: number, passive?: string, spriteSvg: string, patternType: 'random'|'loop', pattern?: EnemyMoveDef[] }} EnemyDef
 */

const ceprSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <line x1="50" y1="65" x2="35" y2="75" stroke="#ffccaa" stroke-width="6" stroke-linecap="round"/>
  <line x1="45" y1="80" x2="40" y2="95" stroke="#ffccaa" stroke-width="6"/>
  <line x1="55" y1="80" x2="60" y2="95" stroke="#ffccaa" stroke-width="6"/>
  <rect x="36" y="90" width="8" height="5" fill="white"/>
  <rect x="56" y="90" width="8" height="5" fill="white"/>
  <line x1="34" y1="95" x2="44" y2="95" stroke="#444" stroke-width="3"/>
  <line x1="54" y1="95" x2="64" y2="95" stroke="#444" stroke-width="3"/>
  <rect x="38" y="70" width="24" height="15" fill="#0066cc"/>
  <rect x="38" y="45" width="24" height="25" rx="4" fill="#ff66b2"/>
  <circle cx="50" cy="32" r="14" fill="#ffccaa"/>
  <rect x="40" y="28" width="8" height="6" fill="#111" rx="2"/>
  <rect x="52" y="28" width="8" height="6" fill="#111" rx="2"/>
  <line x1="48" y1="31" x2="52" y2="31" stroke="#111" stroke-width="2"/>
  <path d="M 45,40 Q 50,43 55,40" fill="none" stroke="#222" stroke-width="2"/>
  <polygon points="35,25 42,15 58,15 65,25" fill="#dddd88"/>
  <line x1="50" y1="65" x2="65" y2="60" stroke="#ffccaa" stroke-width="6" stroke-linecap="round"/>
  <rect x="58" y="54" width="16" height="12" fill="#333" rx="2"/>
  <circle cx="66" cy="60" r="4" fill="#888"/>
  <path d="M 45,35 Q 50,60 60,54" fill="none" stroke="#222" stroke-width="1.5"/>
</svg>`;

const busiarzSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <rect x="35" y="6" width="30" height="12" rx="5" fill="#ffe07a" stroke="#533514" stroke-width="2"/>
  <text x="50" y="15" text-anchor="middle" font-size="8" font-weight="bold" fill="#533514">Bus</text>
  <line x1="50" y1="64" x2="33" y2="75" stroke="#f2c6a3" stroke-width="6" stroke-linecap="round"/>
  <line x1="45" y1="82" x2="40" y2="98" stroke="#2f2f2f" stroke-width="7"/>
  <line x1="55" y1="82" x2="60" y2="98" stroke="#2f2f2f" stroke-width="7"/>
  <ellipse cx="40" cy="98" rx="8" ry="4" fill="#1e1e1e"/>
  <ellipse cx="60" cy="98" rx="8" ry="4" fill="#1e1e1e"/>
  <rect x="34" y="48" width="32" height="35" rx="6" fill="#3d5fa8" stroke="#1e2f55" stroke-width="3"/>
  <rect x="31" y="48" width="10" height="32" rx="4" fill="#556b2f" stroke="#2d3d16" stroke-width="2"/>
  <rect x="59" y="48" width="10" height="32" rx="4" fill="#556b2f" stroke="#2d3d16" stroke-width="2"/>
  <circle cx="50" cy="33" r="15" fill="#f2c6a3"/>
  <path d="M 39,40 Q 50,49 61,40" fill="#8b4b24"/>
  <path d="M 40,40 Q 50,36 60,40" fill="none" stroke="#6d3817" stroke-width="3"/>
  <circle cx="45" cy="31" r="2" fill="#111"/>
  <circle cx="55" cy="31" r="2" fill="#111"/>
  <path d="M 35,24 Q 50,12 65,24" fill="#6d3817"/>
  <line x1="50" y1="64" x2="68" y2="56" stroke="#f2c6a3" stroke-width="6" stroke-linecap="round"/>
  <circle cx="71" cy="60" r="9" fill="none" stroke="#222" stroke-width="5"/>
  <circle cx="71" cy="60" r="2" fill="#222"/>
  <line x1="71" y1="51" x2="71" y2="69" stroke="#222" stroke-width="2"/>
  <line x1="62" y1="60" x2="80" y2="60" stroke="#222" stroke-width="2"/>
</svg>`;

const babaSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <line x1="50" y1="66" x2="36" y2="77" stroke="#f4cfb0" stroke-width="6" stroke-linecap="round"/>
  <line x1="44" y1="82" x2="39" y2="98" stroke="#3b2f28" stroke-width="7"/>
  <line x1="56" y1="82" x2="61" y2="98" stroke="#3b2f28" stroke-width="7"/>
  <ellipse cx="39" cy="98" rx="8" ry="4" fill="#171717"/>
  <ellipse cx="61" cy="98" rx="8" ry="4" fill="#171717"/>

  <ellipse cx="50" cy="75" rx="18" ry="12" fill="#184a2f" stroke="#0f2f1d" stroke-width="2"/>
  <rect x="36" y="48" width="28" height="18" rx="5" fill="#f7efe0" stroke="#cdb89b" stroke-width="2"/>
  <path d="M 38,51 C 40,45 45,43 50,43 C 55,43 60,45 62,51" fill="#f7efe0"/>
  <path d="M 35,49 Q 28,60 34,72 L 39,67 Q 36,59 40,52 Z" fill="#f7efe0" stroke="#cdb89b" stroke-width="1.5"/>
  <path d="M 65,49 Q 72,60 66,72 L 61,67 Q 64,59 60,52 Z" fill="#f7efe0" stroke="#cdb89b" stroke-width="1.5"/>

  <path d="M 40,48 L 60,48 L 64,66 L 36,66 Z" fill="#b1363f" stroke="#6d1e24" stroke-width="2"/>
  <path d="M 42,51 L 58,51 M 41,56 L 59,56 M 43,61 L 57,61" stroke="#f0c65f" stroke-width="1.4"/>
  <circle cx="50" cy="58" r="2" fill="#f0c65f"/>

  <rect x="38" y="66" width="24" height="20" rx="4" fill="#f2e4ca" stroke="#b48c57" stroke-width="2"/>
  <path d="M 38,73 Q 44,70 50,73 Q 56,76 62,73" fill="none" stroke="#b45a3d" stroke-width="1.5"/>
  <path d="M 40,80 Q 45,77 50,80 Q 55,83 60,80" fill="none" stroke="#b45a3d" stroke-width="1.5"/>

  <circle cx="50" cy="32" r="13" fill="#f4cfb0"/>
  <path d="M 34,30 Q 39,18 50,16 Q 61,18 66,30 L 63,42 Q 50,47 37,42 Z" fill="#8c1f4f" stroke="#5e1233" stroke-width="2"/>
  <path d="M 36,30 Q 40,26 44,30 Q 48,26 52,30 Q 56,26 60,30 Q 64,26 66,30" fill="none" stroke="#efcf6f" stroke-width="1.2"/>
  <circle cx="45" cy="31" r="2" fill="#161616"/>
  <circle cx="55" cy="31" r="2" fill="#161616"/>
  <path d="M 42,39 Q 50,34 58,39" fill="none" stroke="#5a2b16" stroke-width="3"/>

  <line x1="50" y1="66" x2="68" y2="53" stroke="#f4cfb0" stroke-width="6" stroke-linecap="round"/>
  <path d="M 62,47 C 71,39 83,41 87,51 C 83,61 71,63 62,57 Z" fill="#ecb22c" stroke="#92521a" stroke-width="2"/>
  <path d="M 65,47 L 82,51 L 65,57" fill="none" stroke="#be761a" stroke-width="2"/>
  <path d="M 67,44 L 81,47" stroke="#be761a" stroke-width="1.5"/>
  <path d="M 67,60 L 81,57" stroke="#be761a" stroke-width="1.5"/>

  <line x1="50" y1="66" x2="35" y2="58" stroke="#f4cfb0" stroke-width="6" stroke-linecap="round"/>
  <path d="M 31,55 L 31,42" stroke="#f4cfb0" stroke-width="4" stroke-linecap="round"/>
  <circle cx="31" cy="39" r="3" fill="#f4cfb0"/>
</svg>`;

const bossSprite = `
<svg viewBox="0 0 100 120" width="130" height="150">
  <g transform="translate(50,8) rotate(-12)">
    <polygon points="-16,12 -8,0 0,10 8,0 16,12" fill="#d4b24b" stroke="#7a5a16" stroke-width="2"/>
    <circle cx="-8" cy="10" r="2" fill="#f6df8a"/>
    <circle cx="0" cy="8" r="2" fill="#f6df8a"/>
    <circle cx="8" cy="10" r="2" fill="#f6df8a"/>
  </g>

  <ellipse cx="50" cy="72" rx="24" ry="33" fill="#f5f8fa" stroke="#cfd8de" stroke-width="2"/>
  <ellipse cx="31" cy="50" rx="10" ry="10" fill="#f8fbfd" stroke="#cfd8de" stroke-width="2"/>
  <ellipse cx="69" cy="50" rx="10" ry="10" fill="#f8fbfd" stroke="#cfd8de" stroke-width="2"/>
  <ellipse cx="50" cy="42" rx="20" ry="18" fill="#ffffff" stroke="#cfd8de" stroke-width="2"/>

  <ellipse cx="50" cy="44" rx="11" ry="11" fill="#e2c2a4" stroke="#9d6f4c" stroke-width="1.5"/>
  <path d="M 40,42 Q 44,37 48,42" fill="none" stroke="#2a2a2a" stroke-width="1.8"/>
  <path d="M 52,42 Q 56,37 60,42" fill="none" stroke="#2a2a2a" stroke-width="1.8"/>
  <circle cx="45" cy="44" r="1.6" fill="#1a1a1a"/>
  <circle cx="55" cy="44" r="1.6" fill="#1a1a1a"/>
  <path d="M 44,50 Q 50,53 56,50" fill="none" stroke="#5f3a28" stroke-width="1.8"/>
  <rect x="58" y="49" width="8" height="2" rx="1" fill="#cfd4d8"/>
  <rect x="64" y="48.7" width="8" height="2.6" rx="1" fill="#f2efe7" stroke="#8d7b69" stroke-width="0.8"/>
  <circle cx="72" cy="50" r="1.2" fill="#f18f8f"/>

  <rect x="34" y="66" width="32" height="33" rx="11" fill="#f9fcff" stroke="#cfd8de" stroke-width="2"/>
  <ellipse cx="50" cy="86" rx="10" ry="7" fill="#eef3f7"/>

  <line x1="42" y1="98" x2="38" y2="114" stroke="#f7fbff" stroke-width="6"/>
  <line x1="58" y1="98" x2="62" y2="114" stroke="#f7fbff" stroke-width="6"/>
  <ellipse cx="37" cy="116" rx="8" ry="3.5" fill="#2d2d2d"/>
  <ellipse cx="63" cy="116" rx="8" ry="3.5" fill="#2d2d2d"/>

  <line x1="31" y1="72" x2="18" y2="84" stroke="#f7fbff" stroke-width="6" stroke-linecap="round"/>
  <line x1="69" y1="72" x2="82" y2="84" stroke="#f7fbff" stroke-width="6" stroke-linecap="round"/>
</svg>`;

/** @type {Record<string, EnemyDef>} */
export const enemyLibrary = {
  cepr: {
    id: 'cepr',
    name: 'Cepr',
    emoji: '🧦',
    hp: 70,
    maxHp: 70,
    block: 0,
    baseAttack: 0,
    spriteSvg: ceprSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Rzut klapkiem', damage: 6, hits: 1 },
      { type: 'status', name: 'Pytanie o drogę', addStatusCard: 'ulotka', amount: 2 },
      { type: 'attack', name: 'Złość turysty', damage: 10, hits: 1 },
    ],
  },
  busiarz: {
    id: 'busiarz',
    name: 'Wąsaty Busiarz',
    emoji: '🚐',
    hp: 65,
    maxHp: 65,
    block: 0,
    baseAttack: 0,
    spriteSvg: busiarzSprite,
    patternType: 'loop',
    passive: 'brak_reszty',
    pattern: [
      { type: 'attack', name: 'Trąbienie na pieszych', damage: 4, hits: 2 },
      { type: 'attack', name: 'Wyprzedzanie na trzeciego', damage: 8, hits: 1, applyFrail: 1 },
      { type: 'block', name: 'Zbieranie kompletu', block: 10, heal: 5 },
    ],
  },
  baba: {
    id: 'baba',
    name: 'Gaździna Maryna',
    emoji: '🧀',
    hp: 95,
    maxHp: 95,
    block: 0,
    baseAttack: 0,
    spriteSvg: babaSprite,
    patternType: 'loop',
    passive: 'targowanie_sie',
    pattern: [
      { type: 'block', name: 'Darmowa degustacja', block: 15 },
      { type: 'attack', name: 'Cena z kosmosu', damage: 8, hits: 1, applyWeak: 2 },
      { type: 'attack', name: 'Rzut redykołką', damage: 14, hits: 1 },
    ],
  },
  boss: {
    id: 'boss',
    name: 'Król Krupówek - Biały Misiek (Zdzisiek)',
    emoji: '🐻‍❄️',
    hp: 300,
    maxHp: 300,
    block: 0,
    baseAttack: 0,
    spriteSvg: bossSprite,
    patternType: 'loop',
    passive: 'ochrona_wizerunku',
    pattern: [
      { type: 'buff', name: 'Górski Ryk', strengthGain: 2, block: 10 },
      { type: 'attack', name: 'Agresywne pozowanie', damage: 5, hits: 3 },
      { type: 'attack', name: 'Podatek od zdjęcia', damage: 15, hits: 1, applyFrail: 2 },
      { type: 'attack', name: 'Uścisk Krupówek', damage: 25, hits: 1 },
    ],
  },
};

export const enemies = enemyLibrary;
