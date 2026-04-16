const spekulantSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- legs -->
  <line x1="44" y1="82" x2="40" y2="97" stroke="#111827" stroke-width="7"/>
  <line x1="56" y1="82" x2="60" y2="97" stroke="#111827" stroke-width="7"/>
  <rect x="34" y="94" width="14" height="5" rx="2" fill="#0a0a14"/>
  <rect x="52" y="94" width="14" height="5" rx="2" fill="#0a0a14"/>
  <!-- suit body -->
  <rect x="34" y="50" width="32" height="32" rx="6" fill="#1a2a4a" stroke="#0f1a30" stroke-width="2"/>
  <!-- shirt + tie -->
  <rect x="45" y="50" width="10" height="32" fill="#f5f5f0"/>
  <polygon points="50,54 47,58 50,74 53,58" fill="#cc3300"/>
  <!-- tie pin -->
  <rect x="48" y="64" width="4" height="2" rx="1" fill="#d4a520"/>
  <!-- lapels -->
  <polygon points="34,50 45,50 40,62" fill="#142038"/>
  <polygon points="66,50 55,50 60,62" fill="#142038"/>
  <!-- left arm — pointing gesture -->
  <line x1="34" y1="58" x2="16" y2="70" stroke="#f0c090" stroke-width="6" stroke-linecap="round"/>
  <rect x="8" y="66" width="12" height="8" rx="2" fill="#1a2a4a"/>
  <line x1="10" y1="70" x2="19" y2="70" stroke="#f0c090" stroke-width="3" stroke-linecap="round"/>
  <!-- right arm + briefcase -->
  <line x1="66" y1="60" x2="80" y2="68" stroke="#f0c090" stroke-width="6" stroke-linecap="round"/>
  <rect x="76" y="64" width="18" height="14" rx="3" fill="#5a3010" stroke="#3a1a00" stroke-width="2"/>
  <rect x="83" y="62" width="4" height="4" rx="1" fill="#8a5020" stroke="#3a1a00" stroke-width="1"/>
  <line x1="76" y1="71" x2="94" y2="71" stroke="#8a5020" stroke-width="1.5"/>
  <circle cx="85" cy="68" r="2" fill="#d4a520"/>
  <!-- watch -->
  <rect x="75" y="76" width="7" height="5" rx="1" fill="#f5f5f0" stroke="#3a1a00" stroke-width="1"/>
  <!-- head -->
  <circle cx="50" cy="31" r="13" fill="#f0c090"/>
  <!-- slight baldness -->
  <path d="M 38,26 Q 50,14 62,26 L 62,30 Q 50,22 38,30 Z" fill="#e0b080"/>
  <!-- eyes — squinting confident -->
  <line x1="44" y1="28" x2="47" y2="27" stroke="#111" stroke-width="2" stroke-linecap="round"/>
  <line x1="53" y1="27" x2="56" y2="28" stroke="#111" stroke-width="2" stroke-linecap="round"/>
  <!-- smirk -->
  <path d="M 45,36 Q 50,39 56,36" fill="none" stroke="#5a3020" stroke-width="2"/>
  <!-- moustache -->
  <path d="M 44,33 Q 47,31 50,33 Q 53,31 56,33" fill="#5a3020"/>
  <!-- floating dutki coins -->
  <circle cx="18" cy="28" r="4" fill="#d4a520" opacity="0.7"/>
  <text x="18" y="31" text-anchor="middle" font-size="5" font-weight="bold" fill="#7a5500">D</text>
  <circle cx="82" cy="22" r="3.5" fill="#d4a520" opacity="0.6"/>
  <text x="82" y="25" text-anchor="middle" font-size="4.5" font-weight="bold" fill="#7a5500">D</text>
  <circle cx="12" cy="44" r="3" fill="#d4a520" opacity="0.5"/>
  <text x="12" y="47" text-anchor="middle" font-size="4" font-weight="bold" fill="#7a5500">D</text>
</svg>`;

const mistrzRedykuSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- legs — stocky -->
  <line x1="43" y1="82" x2="38" y2="97" stroke="#111" stroke-width="9"/>
  <line x1="57" y1="82" x2="62" y2="97" stroke="#111" stroke-width="9"/>
  <rect x="30" y="93" width="16" height="5" rx="2" fill="#0a0a0a"/>
  <rect x="54" y="93" width="16" height="5" rx="2" fill="#0a0a0a"/>
  <!-- white trousers with embroidery lines -->
  <rect x="34" y="67" width="32" height="18" rx="3" fill="#f8f8f0"/>
  <line x1="34" y1="72" x2="50" y2="72" stroke="#111" stroke-width="1.5" stroke-dasharray="2,2"/>
  <line x1="50" y1="72" x2="66" y2="72" stroke="#111" stroke-width="1.5" stroke-dasharray="2,2"/>
  <line x1="34" y1="78" x2="66" y2="78" stroke="#b8000a" stroke-width="1.2"/>
  <!-- leather belt -->
  <rect x="34" y="64" width="32" height="5" rx="1" fill="#5a3010"/>
  <rect x="47" y="64" width="6" height="5" fill="#d4a520"/>
  <!-- body — broad, white shirt + black vest -->
  <rect x="30" y="42" width="40" height="26" rx="7" fill="#f5f5f0" stroke="#c8c0b0" stroke-width="1.5"/>
  <rect x="30" y="42" width="15" height="26" rx="5" fill="#111" opacity="0.85"/>
  <rect x="55" y="42" width="15" height="26" rx="5" fill="#111" opacity="0.85"/>
  <!-- shirt embroidery -->
  <line x1="45" y1="45" x2="55" y2="45" stroke="#b8000a" stroke-width="1.2"/>
  <line x1="45" y1="49" x2="55" y2="49" stroke="#b8000a" stroke-width="1.2"/>
  <!-- left arm — relaxed -->
  <line x1="30" y1="50" x2="14" y2="62" stroke="#f2c6a3" stroke-width="7" stroke-linecap="round"/>
  <line x1="14" y1="62" x2="10" y2="75" stroke="#f2c6a3" stroke-width="6" stroke-linecap="round"/>
  <!-- right arm — ciupaga raised -->
  <line x1="70" y1="50" x2="84" y2="36" stroke="#f2c6a3" stroke-width="7" stroke-linecap="round"/>
  <line x1="82" y1="38" x2="78" y2="14" stroke="#5a3010" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="77" cy="11" rx="5" ry="3" fill="#4a2808" transform="rotate(-30 77 11)"/>
  <!-- head — broad face -->
  <circle cx="50" cy="26" r="15" fill="#c49a6c"/>
  <!-- grey moustache -->
  <path d="M 40,31 Q 45,27 50,30 Q 55,27 60,31" fill="#888"/>
  <!-- frown brows -->
  <line x1="42" y1="21" x2="47" y2="23" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="58" y1="21" x2="53" y2="23" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
  <!-- eyes -->
  <circle cx="45" cy="25" r="2" fill="#111"/>
  <circle cx="55" cy="25" r="2" fill="#111"/>
  <!-- chin scar -->
  <line x1="49" y1="34" x2="52" y2="37" stroke="#a07040" stroke-width="1.5"/>
  <!-- góralski hat -->
  <rect x="36" y="13" width="28" height="9" rx="2" fill="#111"/>
  <rect x="33" y="21" width="34" height="3" rx="1" fill="#0a0a0a"/>
  <rect x="33" y="20" width="34" height="2" fill="#b8000a"/>
  <path d="M 61,14 Q 67,10 65,6 Q 62,9 60,14" fill="#228b22"/>
  <!-- sheep silhouettes -->
  <ellipse cx="10" cy="82" rx="7" ry="4" fill="#e8e8e0" opacity="0.7"/>
  <circle cx="10" cy="78" r="3" fill="#e8e8e0" opacity="0.7"/>
  <ellipse cx="22" cy="86" rx="6" ry="3.5" fill="#e8e8e0" opacity="0.6"/>
  <circle cx="22" cy="83" r="2.5" fill="#e8e8e0" opacity="0.6"/>
</svg>`;

const ceprzyca_vipSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- legs -->
  <line x1="44" y1="82" x2="41" y2="97" stroke="#3a5f8a" stroke-width="7"/>
  <line x1="56" y1="82" x2="59" y2="97" stroke="#3a5f8a" stroke-width="7"/>
  <!-- sandals -->
  <rect x="34" y="94" width="14" height="4" rx="1" fill="#cc6633"/>
  <rect x="52" y="94" width="14" height="4" rx="1" fill="#cc6633"/>
  <!-- jeans -->
  <rect x="36" y="66" width="28" height="18" rx="4" fill="#3a5f8a"/>
  <!-- blouse -->
  <rect x="34" y="44" width="32" height="24" rx="6" fill="#f5f0e8" stroke="#d8cfc0" stroke-width="1.5"/>
  <!-- blouse pattern dots -->
  <circle cx="42" cy="50" r="1.5" fill="#e84393" opacity="0.7"/>
  <circle cx="50" cy="47" r="1.5" fill="#e84393" opacity="0.7"/>
  <circle cx="58" cy="51" r="1.5" fill="#e84393" opacity="0.7"/>
  <circle cx="45" cy="57" r="1.5" fill="#e84393" opacity="0.6"/>
  <circle cx="55" cy="55" r="1.5" fill="#e84393" opacity="0.6"/>
  <!-- left arm -->
  <line x1="34" y1="52" x2="18" y2="62" stroke="#f5c6a0" stroke-width="6" stroke-linecap="round"/>
  <!-- designer bag -->
  <rect x="9" y="58" width="13" height="10" rx="3" fill="#e84393" stroke="#9a1a53" stroke-width="1.5"/>
  <path d="M 12,58 Q 15,54 19,58" fill="none" stroke="#9a1a53" stroke-width="1.5"/>
  <!-- right arm — phone -->
  <line x1="66" y1="52" x2="80" y2="44" stroke="#f5c6a0" stroke-width="6" stroke-linecap="round"/>
  <rect x="76" y="36" width="9" height="14" rx="2" fill="#111" stroke="#333" stroke-width="1"/>
  <rect x="77" y="37" width="7" height="11" rx="1" fill="#4af"/>
  <!-- head -->
  <circle cx="50" cy="28" r="13" fill="#f5c6a0"/>
  <!-- sunglasses on forehead -->
  <rect x="40" y="18" width="8" height="4" rx="2" fill="#111" opacity="0.8"/>
  <rect x="51" y="18" width="8" height="4" rx="2" fill="#111" opacity="0.8"/>
  <line x1="48" y1="20" x2="51" y2="20" stroke="#333" stroke-width="1.5"/>
  <!-- eyes — slightly annoyed -->
  <line x1="43" y1="26" x2="46" y2="25" stroke="#333" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="54" y1="25" x2="57" y2="26" stroke="#333" stroke-width="1.8" stroke-linecap="round"/>
  <!-- lip gloss mouth — pursed -->
  <path d="M 46,33 Q 50,36 54,33" fill="none" stroke="#e84393" stroke-width="2"/>
  <!-- straw hat -->
  <ellipse cx="50" cy="17" rx="18" ry="4" fill="#e8d070" stroke="#9a8020" stroke-width="1.5"/>
  <rect x="39" y="10" width="22" height="8" rx="4" fill="#e8d070" stroke="#9a8020" stroke-width="1.5"/>
  <!-- hat ribbon with dots -->
  <rect x="39" y="16" width="22" height="2.5" fill="#fff" opacity="0.8"/>
  <circle cx="42" cy="17.2" r="1" fill="#e84393"/>
  <circle cx="46" cy="17.2" r="1" fill="#e84393"/>
  <circle cx="50" cy="17.2" r="1" fill="#e84393"/>
  <circle cx="54" cy="17.2" r="1" fill="#e84393"/>
  <circle cx="58" cy="17.2" r="1" fill="#e84393"/>
  <!-- social media aura: stars / hearts -->
  <text x="16" y="30" font-size="7" opacity="0.65">❤️</text>
  <text x="78" y="26" font-size="6" opacity="0.6">⭐</text>
  <text x="22" y="16" font-size="5" opacity="0.5">✨</text>
</svg>`;

/**
 * @typedef {{ type: 'attack', name: string, damage: number, hits?: number, applyWeak?: number, applyFrail?: number, applyVulnerable?: number, damagePerCardInHand?: boolean, gainPed?: number, usePed?: boolean, stealDutki?: number } | { type: 'block', name: string, block: number, heal?: number, gainEvasion?: number } | { type: 'buff', name: string, strengthGain?: number, block?: number } | { type: 'status', name: string, addStatusCard?: string, amount?: number, applyStun?: number }} EnemyMoveDef
 * @typedef {{ id: string, name: string, emoji: string, hp: number, maxHp: number, block: number, baseAttack?: number, passive?: string, spriteSvg: string, phase2SpriteSvg?: string, patternType: 'random'|'loop', pattern?: EnemyMoveDef[], phaseTwoPattern?: EnemyMoveDef[], elite?: boolean, isBoss?: boolean, eventOnly?: boolean, tutorialOnly?: boolean }} EnemyDef
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

const influencerkaSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <line x1="44" y1="82" x2="40" y2="97" stroke="#9900cc" stroke-width="7"/>
  <line x1="56" y1="82" x2="60" y2="97" stroke="#9900cc" stroke-width="7"/>
  <rect x="33" y="92" width="15" height="6" rx="3" fill="#220044"/>
  <rect x="52" y="92" width="15" height="6" rx="3" fill="#220044"/>
  <rect x="36" y="52" width="28" height="30" rx="8" fill="#ff00cc"/>
  <line x1="36" y1="62" x2="64" y2="62" stroke="#ffff00" stroke-width="2"/>
  <line x1="36" y1="70" x2="64" y2="70" stroke="#ffff00" stroke-width="2"/>
  <line x1="36" y1="58" x2="18" y2="48" stroke="#f5c6a0" stroke-width="6" stroke-linecap="round"/>
  <line x1="17" y1="47" x2="9" y2="20" stroke="#555" stroke-width="2"/>
  <rect x="3" y="12" width="12" height="16" rx="2" fill="#1a1a30"/>
  <rect x="4" y="13" width="10" height="12" rx="1" fill="#88ddff"/>
  <circle cx="9" cy="27" r="1.5" fill="#555"/>
  <line x1="64" y1="58" x2="80" y2="64" stroke="#f5c6a0" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="85" cy="67" rx="8" ry="5" fill="#c8882e" transform="rotate(-15 85 67)"/>
  <path d="M 78,63 C 86,59 92,64 90,70 C 88,74 80,71 78,65 Z" fill="#a06020" opacity="0.6"/>
  <ellipse cx="50" cy="31" rx="18" ry="16" fill="#f5ecd8"/>
  <circle cx="50" cy="31" r="12" fill="#f5c6a0"/>
  <rect x="37" y="26" width="10" height="7" rx="3" fill="#111"/>
  <rect x="51" y="26" width="10" height="7" rx="3" fill="#111"/>
  <line x1="47" y1="29" x2="51" y2="29" stroke="#777" stroke-width="1.5"/>
  <path d="M 44,38 Q 50,43 56,38 Q 53,41 47,41 Z" fill="#e84393"/>
  <path d="M 32,26 Q 40,16 50,14 Q 60,16 68,26" fill="none" stroke="#e8d8b0" stroke-width="4" stroke-linecap="round"/>
</svg>`;

const fiakierSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- Left wheel -->
  <circle cx="22" cy="82" r="14" fill="none" stroke="#3a1800" stroke-width="3"/>
  <circle cx="22" cy="82" r="4" fill="#3a1800"/>
  <line x1="22" y1="68" x2="22" y2="96" stroke="#3a1800" stroke-width="1.8"/>
  <line x1="8" y1="82" x2="36" y2="82" stroke="#3a1800" stroke-width="1.8"/>
  <line x1="12" y1="72" x2="32" y2="92" stroke="#3a1800" stroke-width="1.8"/>
  <line x1="12" y1="92" x2="32" y2="72" stroke="#3a1800" stroke-width="1.8"/>
  <circle cx="22" cy="82" r="10" fill="none" stroke="#cc3300" stroke-width="1.5" stroke-dasharray="3,3"/>
  <!-- Right wheel -->
  <circle cx="78" cy="82" r="14" fill="none" stroke="#3a1800" stroke-width="3"/>
  <circle cx="78" cy="82" r="4" fill="#3a1800"/>
  <line x1="78" y1="68" x2="78" y2="96" stroke="#3a1800" stroke-width="1.8"/>
  <line x1="64" y1="82" x2="92" y2="82" stroke="#3a1800" stroke-width="1.8"/>
  <line x1="68" y1="72" x2="88" y2="92" stroke="#3a1800" stroke-width="1.8"/>
  <line x1="68" y1="92" x2="88" y2="72" stroke="#3a1800" stroke-width="1.8"/>
  <circle cx="78" cy="82" r="10" fill="none" stroke="#cc3300" stroke-width="1.5" stroke-dasharray="3,3"/>
  <!-- Axle -->
  <line x1="22" y1="78" x2="78" y2="78" stroke="#3a1800" stroke-width="2"/>
  <!-- Carriage body -->
  <rect x="18" y="54" width="64" height="26" rx="5" fill="#5a2f0a" stroke="#3a1800" stroke-width="2"/>
  <!-- Góralskie zigzag on carriage -->
  <polyline points="22,60 26,56 30,60 34,56 38,60 42,56 46,60 50,56 54,60 58,56 62,60 66,56 70,60 74,56 78,60" fill="none" stroke="#e8c420" stroke-width="1.5"/>
  <!-- Windows -->
  <rect x="24" y="60" width="20" height="13" rx="3" fill="#aad4ee" opacity="0.8" stroke="#3a1800" stroke-width="1"/>
  <rect x="56" y="60" width="20" height="13" rx="3" fill="#aad4ee" opacity="0.8" stroke="#3a1800" stroke-width="1"/>
  <!-- Coachman seat -->
  <rect x="8" y="48" width="24" height="8" rx="3" fill="#7a4520"/>
  <!-- Body (seated) -->
  <rect x="10" y="28" width="20" height="22" rx="5" fill="#1a3a80" stroke="#0f244a" stroke-width="2"/>
  <!-- Jacket buttons -->
  <circle cx="20" cy="33" r="1" fill="#ffd700"/>
  <circle cx="20" cy="38" r="1" fill="#ffd700"/>
  <circle cx="20" cy="43" r="1" fill="#ffd700"/>
  <!-- Left arm (reins) -->
  <line x1="10" y1="38" x2="2" y2="50" stroke="#f0c090" stroke-width="5" stroke-linecap="round"/>
  <line x1="2" y1="50" x2="2" y2="55" stroke="#7a4520" stroke-width="1.5"/>
  <!-- Right arm (whip) -->
  <line x1="30" y1="34" x2="60" y2="16" stroke="f0c090" stroke-width="5" stroke-linecap="round"/>
  <line x1="30" y1="34" x2="60" y2="16" stroke="#f0c090" stroke-width="5" stroke-linecap="round"/>
  <!-- Whip handle -->
  <line x1="60" y1="16" x2="74" y2="8" stroke="#7a4520" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Whip lash -->
  <path d="M 74,8 Q 88,4 90,14" fill="none" stroke="#5a3010" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Head -->
  <circle cx="20" cy="21" r="11" fill="#f0c090"/>
  <!-- Mustache (big, góralski) -->
  <path d="M 12,26 Q 16,22 20,24 Q 24,22 28,26" fill="#4a2a00"/>
  <!-- Eyes (squinting) -->
  <line x1="16" y1="20" x2="19" y2="19" stroke="#222" stroke-width="2" stroke-linecap="round"/>
  <line x1="21" y1="19" x2="24" y2="20" stroke="#222" stroke-width="2" stroke-linecap="round"/>
  <!-- Hat (wide-brimmed black) -->
  <rect x="10" y="11" width="20" height="9" rx="2" fill="#111"/>
  <rect x="7" y="19" width="26" height="3" rx="1" fill="#0a0a0a"/>
  <!-- Hat band - góralskie red -->
  <rect x="7" y="18" width="26" height="2" fill="#cc3300"/>
  <!-- Feather -->
  <path d="M 31,12 Q 38,8 36,4 Q 33,7 30,12" fill="#22aa22"/>
</svg>`;

const parkingowySprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <polygon points="84,98 90,98 89,80 85,80" fill="#ff6600"/>
  <line x1="83" y1="88" x2="91" y2="88" stroke="white" stroke-width="2"/>
  <rect x="82" y="95" width="10" height="4" rx="1" fill="#dd4400"/>
  <line x1="44" y1="80" x2="40" y2="97" stroke="#3a3020" stroke-width="7"/>
  <line x1="56" y1="80" x2="60" y2="97" stroke="#3a3020" stroke-width="7"/>
  <rect x="33" y="93" width="14" height="5" rx="2" fill="#1a1a1a"/>
  <rect x="53" y="93" width="14" height="5" rx="2" fill="#1a1a1a"/>
  <rect x="36" y="50" width="28" height="30" rx="5" fill="#6a5540"/>
  <path d="M 36,58 Q 50,55 64,58" fill="none" stroke="#4a3520" stroke-width="1.2"/>
  <path d="M 36,64 Q 50,61 64,64" fill="none" stroke="#4a3520" stroke-width="1.2"/>
  <path d="M 36,70 Q 50,67 64,70" fill="none" stroke="#4a3520" stroke-width="1.2"/>
  <polygon points="36,50 36,80 44,80 44,62 56,62 56,80 64,80 64,50" fill="#ff8800" opacity="0.88" stroke="#cc5500" stroke-width="1.5"/>
  <line x1="37" y1="67" x2="43" y2="67" stroke="#ffff00" stroke-width="3"/>
  <line x1="57" y1="67" x2="63" y2="67" stroke="#ffff00" stroke-width="3"/>
  <line x1="36" y1="55" x2="22" y2="68" stroke="#c49a6c" stroke-width="6" stroke-linecap="round"/>
  <rect x="8" y="63" width="18" height="22" rx="2" fill="#d4b896"/>
  <rect x="12" y="59" width="10" height="6" rx="2" fill="#888"/>
  <line x1="11" y1="71" x2="23" y2="71" stroke="#555" stroke-width="1.2"/>
  <line x1="11" y1="75" x2="23" y2="75" stroke="#555" stroke-width="1.2"/>
  <line x1="11" y1="79" x2="18" y2="79" stroke="#555" stroke-width="1.2"/>
  <line x1="64" y1="55" x2="78" y2="44" stroke="#c49a6c" stroke-width="6" stroke-linecap="round"/>
  <rect x="74" y="32" width="13" height="16" rx="5" fill="#c49a6c"/>
  <line x1="77" y1="32" x2="76" y2="25" stroke="#c49a6c" stroke-width="4" stroke-linecap="round"/>
  <line x1="81" y1="32" x2="81" y2="23" stroke="#c49a6c" stroke-width="4" stroke-linecap="round"/>
  <line x1="85" y1="32" x2="85" y2="25" stroke="#c49a6c" stroke-width="4" stroke-linecap="round"/>
  <circle cx="50" cy="30" r="14" fill="#c49a6c"/>
  <path d="M 36,28 Q 50,17 64,28 L 64,34 L 36,34 Z" fill="#2a3a70"/>
  <rect x="30" y="34" width="40" height="5" rx="2" fill="#3a4a80"/>
  <path d="M 42,32 L 48,30" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="45" cy="35" r="2.5" fill="#111"/>
  <path d="M 58,32 L 52,30" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="55" cy="35" r="2.5" fill="#111"/>
  <path d="M 42,42 Q 46,46 50,43 Q 54,46 58,42 Q 54,40 50,42 Q 46,40 42,42 Z" fill="#4a2a10"/>
</svg>`;

const kolejkarzSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <rect x="10" y="12" width="80" height="20" rx="8" fill="#d8ecff" stroke="#2f5f8a" stroke-width="2"/>
  <line x1="18" y1="22" x2="82" y2="22" stroke="#2f5f8a" stroke-width="1.5"/>
  <text x="50" y="27" text-anchor="middle" font-size="8" font-weight="bold" fill="#1f4060">Kolejka</text>
  <line x1="44" y1="81" x2="40" y2="96" stroke="#2e2e2e" stroke-width="7"/>
  <line x1="56" y1="81" x2="60" y2="96" stroke="#2e2e2e" stroke-width="7"/>
  <rect x="34" y="93" width="14" height="5" rx="2" fill="#161616"/>
  <rect x="52" y="93" width="14" height="5" rx="2" fill="#161616"/>
  <rect x="36" y="50" width="28" height="31" rx="6" fill="#3f6da3" stroke="#1f3e63" stroke-width="2"/>
  <rect x="39" y="56" width="22" height="14" rx="3" fill="#8ec0e8" opacity="0.85"/>
  <line x1="50" y1="50" x2="50" y2="81" stroke="#f0f6ff" stroke-width="2" opacity="0.5"/>
  <line x1="36" y1="58" x2="20" y2="68" stroke="#f1c39e" stroke-width="6" stroke-linecap="round"/>
  <rect x="12" y="62" width="10" height="14" rx="2" fill="#f7f3e8" stroke="#a99f87" stroke-width="1.5"/>
  <line x1="14" y1="67" x2="20" y2="67" stroke="#7a725f" stroke-width="1"/>
  <line x1="64" y1="58" x2="79" y2="48" stroke="#f1c39e" stroke-width="6" stroke-linecap="round"/>
  <rect x="76" y="42" width="12" height="10" rx="2" fill="#ffe07a" stroke="#9f7a1f" stroke-width="1.5"/>
  <line x1="78" y1="46" x2="86" y2="46" stroke="#9f7a1f" stroke-width="1"/>
  <circle cx="50" cy="31" r="14" fill="#f1c39e"/>
  <path d="M 36,29 Q 50,17 64,29 L 64,35 L 36,35 Z" fill="#2c4f74"/>
  <rect x="34" y="35" width="32" height="4" rx="2" fill="#1c3550"/>
  <circle cx="45" cy="31" r="2" fill="#101010"/>
  <circle cx="55" cy="31" r="2" fill="#101010"/>
  <path d="M 44,39 Q 50,42 56,39" fill="none" stroke="#5c3421" stroke-width="2"/>
</svg>`;

const naganiaczTermSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <defs>
    <linearGradient id="krupowkiJacket" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#db3434"/>
      <stop offset="100%" stop-color="#8e1616"/>
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="88" rx="33" ry="8" fill="#1f2428" opacity="0.24"/>
  <line x1="44" y1="82" x2="40" y2="97" stroke="#2f3337" stroke-width="7"/>
  <line x1="56" y1="82" x2="60" y2="97" stroke="#2f3337" stroke-width="7"/>
  <rect x="34" y="94" width="14" height="5" rx="2" fill="#141516"/>
  <rect x="52" y="94" width="14" height="5" rx="2" fill="#141516"/>
  <rect x="35" y="50" width="30" height="32" rx="7" fill="url(#krupowkiJacket)" stroke="#541010" stroke-width="2"/>
  <rect x="44" y="50" width="12" height="32" fill="#111" opacity="0.2"/>
  <line x1="35" y1="60" x2="20" y2="70" stroke="#efc5a2" stroke-width="6" stroke-linecap="round"/>
  <rect x="11" y="61" width="15" height="19" rx="2" fill="#fff7dd" stroke="#9c8d5f" stroke-width="1.5"/>
  <line x1="14" y1="66" x2="23" y2="66" stroke="#a78b36" stroke-width="1.2"/>
  <line x1="14" y1="70" x2="23" y2="70" stroke="#a78b36" stroke-width="1.2"/>
  <line x1="14" y1="74" x2="21" y2="74" stroke="#a78b36" stroke-width="1.2"/>
  <line x1="65" y1="60" x2="80" y2="52" stroke="#efc5a2" stroke-width="6" stroke-linecap="round"/>
  <rect x="73" y="44" width="18" height="13" rx="3" fill="#ffd45c" stroke="#8f6713" stroke-width="1.8"/>
  <text x="82" y="53" text-anchor="middle" font-size="5" font-weight="bold" fill="#69490a">PROMO</text>
  <circle cx="50" cy="31" r="14" fill="#efc5a2"/>
  <path d="M 35,28 Q 50,12 65,28 L 64,39 L 36,39 Z" fill="#191b1d"/>
  <rect x="34" y="35" width="32" height="4" rx="2" fill="#0f1112"/>
  <circle cx="45" cy="32" r="2" fill="#0f0f0f"/>
  <circle cx="55" cy="32" r="2" fill="#0f0f0f"/>
  <path d="M 42,39 Q 50,44 58,39" fill="none" stroke="#5b3622" stroke-width="2"/>
  <path d="M 43,26 Q 50,24 57,26" fill="none" stroke="#0f1112" stroke-width="1.5"/>
  <circle cx="18" cy="19" r="3" fill="#ffe8a3" opacity="0.8"/>
  <circle cx="80" cy="18" r="2.5" fill="#ffe8a3" opacity="0.75"/>
</svg>`;

const naganiaczeDuoPhase1Sprite = `
<svg viewBox="0 0 120 100" width="120" height="120">
  <rect x="16" y="86" width="88" height="8" rx="4" fill="#1f1f1f" opacity="0.45"/>

  <g transform="translate(20,6)">
    <line x1="20" y1="80" x2="16" y2="95" stroke="#252525" stroke-width="7"/>
    <line x1="32" y1="80" x2="36" y2="95" stroke="#252525" stroke-width="7"/>
    <rect x="10" y="48" width="28" height="34" rx="7" fill="#333"/>
    <path d="M 10,54 Q 24,42 38,54 L 38,62 Q 24,56 10,62 Z" fill="#2a2a2a"/>
    <line x1="10" y1="58" x2="-4" y2="66" stroke="#5a5a5a" stroke-width="6" stroke-linecap="round"/>
    <line x1="38" y1="60" x2="52" y2="50" stroke="#5a5a5a" stroke-width="6" stroke-linecap="round"/>
    <circle cx="24" cy="36" r="13" fill="#444"/>
    <rect x="12" y="22" width="24" height="12" rx="4" fill="#2f2f2f"/>
    <circle cx="20" cy="36" r="2" fill="#111"/>
    <circle cx="28" cy="36" r="2" fill="#111"/>
  </g>

  <g transform="translate(64,16)">
    <line x1="12" y1="72" x2="8" y2="94" stroke="#2e2e2e" stroke-width="6"/>
    <line x1="22" y1="72" x2="26" y2="94" stroke="#2e2e2e" stroke-width="6"/>
    <rect x="4" y="45" width="24" height="28" rx="6" fill="#444"/>
    <line x1="4" y1="52" x2="-8" y2="62" stroke="#666" stroke-width="5" stroke-linecap="round"/>
    <line x1="28" y1="54" x2="40" y2="44" stroke="#666" stroke-width="5" stroke-linecap="round"/>
    <circle cx="16" cy="31" r="11" fill="#555"/>
    <circle cx="12" cy="31" r="1.7" fill="#111"/>
    <circle cx="20" cy="31" r="1.7" fill="#111"/>
    <path d="M 10,37 Q 16,40 22,37" fill="none" stroke="#1d1d1d" stroke-width="2"/>
  </g>
</svg>`;

const naganiaczeDuoPhase2Sprite = `
<svg viewBox="0 0 120 100" width="120" height="120">
  <rect x="28" y="86" width="64" height="8" rx="4" fill="#1f1f1f" opacity="0.45"/>

  <g transform="translate(46,10)">
    <line x1="14" y1="76" x2="10" y2="95" stroke="#2e2e2e" stroke-width="7"/>
    <line x1="26" y1="76" x2="30" y2="95" stroke="#2e2e2e" stroke-width="7"/>
    <rect x="6" y="45" width="28" height="32" rx="7" fill="#444"/>
    <line x1="6" y1="54" x2="-8" y2="62" stroke="#777" stroke-width="6" stroke-linecap="round"/>
    <line x1="34" y1="54" x2="44" y2="64" stroke="#777" stroke-width="6" stroke-linecap="round"/>
    <polygon points="42,64 54,58 52,72" fill="#888" stroke="#1a1a1a" stroke-width="1.5"/>
    <circle cx="20" cy="30" r="12" fill="#5a5a5a"/>
    <path d="M 11,22 Q 20,16 29,22" fill="none" stroke="#2a2a2a" stroke-width="2"/>
    <circle cx="16" cy="30" r="2" fill="#111"/>
    <circle cx="24" cy="30" r="2" fill="#111"/>
    <path d="M 14,37 Q 20,41 26,37" fill="none" stroke="#1d1d1d" stroke-width="2"/>
  </g>
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
  zagubiony_ceper: {
    id: 'zagubiony_ceper',
    name: 'Zagubiony Ceper',
    emoji: '🧭',
    tutorialOnly: true,
    hp: 30,
    maxHp: 30,
    block: 0,
    baseAttack: 0,
    spriteSvg: ceprSprite,
    patternType: 'loop',
    pattern: [{ type: 'attack', name: 'Niezdarny Cios', damage: 5, hits: 1 }],
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
      { type: 'attack', name: 'Wyprzedzanie na trzeciego', damage: 8, hits: 1, applyFrail: 2 },
      { type: 'block', name: 'Zbieranie kompletu', block: 10, heal: 3 },
    ],
  },
  baba: {
    id: 'baba',
    name: 'Handlara oscypkami',
    emoji: '🧀',
    hp: 88,
    maxHp: 88,
    block: 0,
    baseAttack: 0,
    spriteSvg: babaSprite,
    patternType: 'loop',
    passive: 'targowanie_sie',
    pattern: [
      { type: 'block', name: 'Darmowa degustacja', block: 12 },
      { type: 'attack', name: 'Cena z kosmosu', damage: 8, hits: 1, applyWeak: 1 },
      { type: 'attack', name: 'Rzut redykołką', damage: 14, hits: 1 },
    ],
  },
  influencerka: {
    id: 'influencerka',
    name: 'Influencerka',
    emoji: '🤳',
    hp: 60,
    maxHp: 60,
    block: 0,
    baseAttack: 0,
    spriteSvg: influencerkaSprite,
    patternType: 'loop',
    passive: 'parcie_na_szklo',
    pattern: [
      { type: 'attack', name: 'Selfie z zaskoczenia', damage: 12, hits: 1, applyVulnerable: 2 },
      { type: 'status', name: 'Oznaczenie w relacji', addStatusCard: 'spam_tagami', amount: 2 },
      { type: 'block', name: 'Filtr upiększający', block: 12, heal: 4 },
    ],
  },
  parkingowy: {
    id: 'parkingowy',
    name: 'Parkingowy z Palenicy',
    emoji: '🚧',
    hp: 95,
    maxHp: 95,
    block: 0,
    baseAttack: 0,
    spriteSvg: parkingowySprite,
    patternType: 'loop',
    passive: 'blokada_parkingowa',
    pattern: [
      {
        type: 'attack',
        name: 'Bilet za wycieraczką',
        damage: 5,
        hits: 1,
        damagePerCardInHand: true,
      },
      { type: 'attack', name: 'Kłótnia o rezerwację', damage: 0, hits: 0, applyFrail: 2 },
      { type: 'status', name: 'Blokada na koło', applyStun: 1 },
    ],
  },
  konik_spod_kuznic: {
    id: 'konik_spod_kuznic',
    name: 'Konik spod Kuźnic',
    emoji: '🚠',
    hp: 74,
    maxHp: 74,
    block: 0,
    baseAttack: 0,
    spriteSvg: kolejkarzSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Szturchanie w kolejce', damage: 5, hits: 2 },
      { type: 'status', name: 'Zmiana regulaminu', addStatusCard: 'ulotka', amount: 1 },
      { type: 'attack', name: 'Priorytet VIP', damage: 10, hits: 1, applyWeak: 1 },
    ],
  },
  naganiacz_z_krupowek: {
    id: 'naganiacz_z_krupowek',
    name: 'Naganiacz z Krupówek',
    emoji: '♨️',
    eventOnly: true,
    hp: 82,
    maxHp: 82,
    block: 0,
    baseAttack: 0,
    spriteSvg: naganiaczTermSprite,
    patternType: 'loop',
    pattern: [
      { type: 'buff', name: 'Krzykliwa zachęta', strengthGain: 1, block: 8 },
      { type: 'attack', name: 'Promka spod budki', damage: 9, hits: 1, applyVulnerable: 1 },
      { type: 'attack', name: 'Zasyp ulotkami', damage: 4, hits: 2, applyFrail: 1 },
    ],
  },
  naganiacze_duo: {
    id: 'naganiacze_duo',
    name: 'Naganiacze z Krupówek',
    emoji: '🕴️',
    eventOnly: true,
    hp: 80,
    maxHp: 80,
    block: 0,
    baseAttack: 0,
    spriteSvg: naganiaczeDuoPhase1Sprite,
    phase2SpriteSvg: naganiaczeDuoPhase2Sprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Podpuszczanie', damage: 6, hits: 1, applyWeak: 1 },
      { type: 'attack', name: 'Szybkie Palce', damage: 4, hits: 2, stealDutki: 2 },
    ],
    phaseTwoPattern: [
      { type: 'attack', name: 'Desperackie Cięcie', damage: 3, hits: 3 },
      { type: 'block', name: 'Unik w Tłumie', block: 12, gainEvasion: 1 },
    ],
  },
  spekulant: {
    id: 'spekulant',
    name: 'Spekulant z Zakopanego',
    emoji: '💼',
    hp: 92,
    maxHp: 92,
    block: 0,
    baseAttack: 0,
    spriteSvg: spekulantSprite,
    patternType: 'loop',
    passive: 'lichwa',
    elite: true,
    pattern: [
      { type: 'attack', name: 'Umowa wstępna', damage: 8, hits: 1, applyVulnerable: 1 },
      { type: 'attack', name: 'Podwyżka czynszu', damage: 11, hits: 1, stealDutki: 5 },
      { type: 'buff', name: 'Kancelaria prawna', strengthGain: 1, block: 12 },
      { type: 'attack', name: 'Eksmisja Odwrócona', damage: 6, hits: 2, applyWeak: 1 },
    ],
  },
  mistrz_redyku: {
    id: 'mistrz_redyku',
    name: 'Mistrz Redyku',
    emoji: '🐑',
    hp: 88,
    maxHp: 88,
    block: 0,
    baseAttack: 0,
    spriteSvg: mistrzRedykuSprite,
    patternType: 'loop',
    passive: 'hart_ducha',
    elite: true,
    pattern: [
      { type: 'buff', name: 'Poświst', strengthGain: 1, block: 8 },
      { type: 'attack', name: 'Uderzenie Bacówką', damage: 12, hits: 1, applyFrail: 1 },
      { type: 'attack', name: 'Redyk przez dolinę', damage: 4, hits: 3 },
      { type: 'attack', name: 'Zbójnicki taniec', damage: 15, hits: 1 },
    ],
  },
  ceprzyca_vip: {
    id: 'ceprzyca_vip',
    name: 'Ceprzyca VIP',
    emoji: '👒',
    hp: 85,
    maxHp: 85,
    block: 0,
    baseAttack: 0,
    spriteSvg: ceprzyca_vipSprite,
    patternType: 'loop',
    passive: 'influencer_aura',
    elite: true,
    pattern: [
      { type: 'attack', name: 'Zdjęcie z widokiem', damage: 6, hits: 1, applyVulnerable: 2 },
      { type: 'status', name: 'Rezerwacja VIP', addStatusCard: 'ulotka', amount: 1 },
      { type: 'attack', name: 'Awantura o cenę', damage: 11, hits: 1, applyWeak: 2 },
      { type: 'block', name: 'Concierge na ratunek', block: 10, heal: 3 },
    ],
  },
  fiakier: {
    id: 'fiakier',
    name: 'Fiakier spod Krupówek',
    emoji: '🐴',
    hp: 180,
    maxHp: 180,
    block: 0,
    baseAttack: 0,
    spriteSvg: fiakierSprite,
    patternType: 'loop',
    passive: 'rachunek_za_kurs',
    isBoss: true,
    pattern: [
      { type: 'attack', name: 'Batogiem po grzbiecie', damage: 12, hits: 1, gainPed: 3 },
      { type: 'buff', name: 'Rozped', strengthGain: 2, block: 8 },
      { type: 'attack', name: 'Przyspieszenie', damage: 16, hits: 1, usePed: true },
      {
        type: 'attack',
        name: 'Zamach Batem',
        damage: 14,
        hits: 1,
        applyVulnerable: 2,
        stealDutki: 6,
      },
    ],
  },
  pomocnik_fiakra: {
    id: 'pomocnik_fiakra',
    name: 'Pomocnik Fiakra',
    emoji: '🧢',
    hp: 58,
    maxHp: 58,
    block: 0,
    baseAttack: 0,
    spriteSvg: fiakierSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Bat po łydkach', damage: 9, hits: 1 },
      { type: 'attack', name: 'Szarpnięcie lejców', damage: 7, hits: 1, applyFrail: 1 },
      { type: 'block', name: 'Zbieranie oddechu', block: 6 },
    ],
  },
  boss: {
    id: 'boss',
    name: 'Król Krupówek - Biały Misiek (Zdzisiek)',
    emoji: '🐻‍❄️',
    hp: 180,
    maxHp: 180,
    block: 0,
    baseAttack: 0,
    spriteSvg: bossSprite,
    patternType: 'loop',
    passive: 'ochrona_wizerunku',
    isBoss: true,
    pattern: [
      { type: 'buff', name: 'Górski Ryk', strengthGain: 2, block: 10 },
      { type: 'attack', name: 'Agresywne pozowanie', damage: 4, hits: 3 },
      { type: 'attack', name: 'Podatek od zdjęcia', damage: 15, hits: 1, applyFrail: 2 },
      { type: 'attack', name: 'Uścisk Krupówek', damage: 20, hits: 1 },
    ],
  },
};

export const enemies = enemyLibrary;
