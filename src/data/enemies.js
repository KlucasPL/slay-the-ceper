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
 * @typedef {{ id: string, name: string, emoji: string, hp: number, maxHp: number, block: number, baseAttack?: number, passive?: string, spriteSvg: string, phase2SpriteSvg?: string, patternType: 'random'|'loop'|'weather_loop', pattern?: EnemyMoveDef[], phaseTwoPattern?: EnemyMoveDef[], weatherPatterns?: Record<string, EnemyMoveDef[]>, elite?: boolean, isBoss?: boolean, eventOnly?: boolean, tutorialOnly?: boolean, act?: number }} EnemyDef
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

// ─── Act 2: Morskie Oko sprites ──────────────────────────────────────────────

const turystaSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- flip-flops -->
  <ellipse cx="39" cy="97" rx="10" ry="3" fill="#ff6600"/>
  <ellipse cx="61" cy="97" rx="10" ry="3" fill="#ff6600"/>
  <!-- legs -->
  <line x1="43" y1="80" x2="39" y2="97" stroke="#f5c0a0" stroke-width="6"/>
  <line x1="57" y1="80" x2="61" y2="97" stroke="#f5c0a0" stroke-width="6"/>
  <!-- shorts -->
  <rect x="36" y="62" width="28" height="20" rx="3" fill="#ff9900"/>
  <!-- t-shirt -->
  <rect x="33" y="42" width="34" height="22" rx="5" fill="#ffffff" stroke="#ddd" stroke-width="1"/>
  <text x="50" y="55" text-anchor="middle" font-size="5.5" fill="#cc0000">I ❤ ZKP</text>
  <!-- arms -->
  <line x1="33" y1="48" x2="18" y2="60" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <line x1="67" y1="48" x2="80" y2="58" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <!-- plastic bag -->
  <ellipse cx="85" cy="68" rx="7" ry="9" fill="#ddeeff" opacity="0.85" stroke="#aabbcc" stroke-width="1"/>
  <line x1="80" y1="60" x2="81" y2="59" stroke="#aabbcc" stroke-width="1"/>
  <line x1="90" y1="60" x2="89" y2="59" stroke="#aabbcc" stroke-width="1"/>
  <!-- head -->
  <circle cx="50" cy="29" r="14" fill="#f5c0a0"/>
  <!-- sunglasses -->
  <rect x="39" y="26" width="9" height="5" rx="2" fill="#222"/>
  <rect x="52" y="26" width="9" height="5" rx="2" fill="#222"/>
  <line x1="48" y1="28" x2="52" y2="28" stroke="#111" stroke-width="1.5"/>
  <!-- smile -->
  <path d="M 44,36 Q 50,40 56,36" fill="none" stroke="#994422" stroke-width="2"/>
  <!-- straw hat -->
  <ellipse cx="50" cy="16" rx="18" ry="4" fill="#ddbb55"/>
  <ellipse cx="50" cy="13" rx="10" ry="6" fill="#ccaa44"/>
</svg>`;

const glosnikSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- legs -->
  <line x1="44" y1="80" x2="41" y2="97" stroke="#f5c0a0" stroke-width="6"/>
  <line x1="56" y1="80" x2="59" y2="97" stroke="#f5c0a0" stroke-width="6"/>
  <!-- pants -->
  <rect x="37" y="62" width="26" height="20" rx="3" fill="#3355aa"/>
  <!-- body -->
  <rect x="33" y="42" width="34" height="22" rx="5" fill="#ee4444"/>
  <!-- arm left -->
  <line x1="33" y1="50" x2="18" y2="60" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <!-- arm right holds speaker high -->
  <line x1="67" y1="48" x2="80" y2="38" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <!-- bluetooth speaker box -->
  <rect x="76" y="26" width="20" height="16" rx="4" fill="#1a1a1a"/>
  <circle cx="82" cy="34" r="5" fill="#333" stroke="#555" stroke-width="1"/>
  <circle cx="82" cy="34" r="2.5" fill="#111"/>
  <circle cx="90" cy="34" r="5" fill="#333" stroke="#555" stroke-width="1"/>
  <circle cx="90" cy="34" r="2.5" fill="#111"/>
  <!-- led bar -->
  <rect x="77" y="40" width="18" height="2" rx="1" fill="#00ff88" opacity="0.8"/>
  <!-- sound waves -->
  <path d="M 98,28 Q 105,34 98,40" fill="none" stroke="#ffcc00" stroke-width="2" opacity="0.7"/>
  <!-- head -->
  <circle cx="50" cy="29" r="13" fill="#f5c0a0"/>
  <!-- open mouth singing -->
  <ellipse cx="50" cy="36" rx="5" ry="3" fill="#cc5544"/>
  <!-- eyes closed happy -->
  <path d="M 43,27 Q 46,25 49,27" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"/>
  <path d="M 51,27 Q 54,25 57,27" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"/>
  <!-- hair -->
  <path d="M 38,23 Q 50,13 62,23" fill="#886644" stroke="#886644" stroke-width="3"/>
</svg>`;

const polmaratonczykSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- running legs -->
  <line x1="48" y1="78" x2="36" y2="97" stroke="#f5c0a0" stroke-width="6"/>
  <line x1="52" y1="78" x2="68" y2="90" stroke="#f5c0a0" stroke-width="6"/>
  <!-- shoes -->
  <ellipse cx="34" cy="97" rx="9" ry="3" fill="#ff4400"/>
  <ellipse cx="70" cy="92" rx="9" ry="3" fill="#ff4400"/>
  <!-- compression shorts -->
  <rect x="37" y="62" width="26" height="18" rx="2" fill="#0033cc"/>
  <!-- running shirt with bib -->
  <rect x="33" y="40" width="34" height="24" rx="5" fill="#44aaff"/>
  <rect x="40" y="46" width="20" height="13" rx="1" fill="#fff"/>
  <text x="50" y="55" text-anchor="middle" font-size="8" font-weight="bold" fill="#333">42</text>
  <!-- arms pumping -->
  <line x1="33" y1="48" x2="14" y2="42" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <line x1="67" y1="48" x2="86" y2="56" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <!-- head forward lean -->
  <circle cx="53" cy="27" r="13" fill="#f5c0a0"/>
  <!-- sweat drops -->
  <ellipse cx="20" cy="27" rx="2.5" ry="4" fill="#66bbff" opacity="0.8"/>
  <ellipse cx="16" cy="36" rx="2" ry="3" fill="#66bbff" opacity="0.7"/>
  <ellipse cx="78" cy="22" rx="2" ry="3" fill="#66bbff" opacity="0.7"/>
  <!-- determined face -->
  <line x1="46" y1="24" x2="50" y2="25" stroke="#333" stroke-width="2" stroke-linecap="round"/>
  <line x1="56" y1="25" x2="60" y2="24" stroke="#333" stroke-width="2" stroke-linecap="round"/>
  <rect x="47" y="31" width="12" height="4" rx="1" fill="#fff" stroke="#994422" stroke-width="1"/>
  <!-- headband -->
  <rect x="41" y="16" width="24" height="5" rx="2" fill="#ff4400"/>
</svg>`;

const instaTaterniczkaSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- legs -->
  <line x1="44" y1="80" x2="42" y2="97" stroke="#f5c0a0" stroke-width="6"/>
  <line x1="56" y1="80" x2="58" y2="97" stroke="#f5c0a0" stroke-width="6"/>
  <!-- hiking boots -->
  <rect x="36" y="93" width="12" height="5" rx="2" fill="#6b4226"/>
  <rect x="52" y="93" width="12" height="5" rx="2" fill="#6b4226"/>
  <!-- leggings -->
  <rect x="37" y="62" width="26" height="20" rx="3" fill="#882288"/>
  <!-- jacket -->
  <rect x="33" y="40" width="34" height="24" rx="6" fill="#aa44bb"/>
  <!-- arm left balance -->
  <line x1="33" y1="50" x2="16" y2="54" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <!-- arm right: selfie stick -->
  <line x1="67" y1="46" x2="84" y2="28" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <line x1="84" y1="28" x2="92" y2="8" stroke="#aaa" stroke-width="2.5" stroke-linecap="round"/>
  <!-- phone -->
  <rect x="86" y="3" width="12" height="8" rx="2" fill="#222"/>
  <rect x="87" y="4" width="10" height="6" rx="1" fill="#55aaff"/>
  <!-- flash -->
  <circle cx="92" cy="7" r="6" fill="#ffffcc" opacity="0.55"/>
  <!-- head -->
  <circle cx="50" cy="27" r="13" fill="#f5c0a0"/>
  <!-- duck lips dzióbek -->
  <ellipse cx="50" cy="34" rx="5" ry="3" fill="#ff6688"/>
  <!-- eyes with lashes -->
  <circle cx="44" cy="25" r="3" fill="#222"/>
  <circle cx="56" cy="25" r="3" fill="#222"/>
  <line x1="41" y1="22" x2="44" y2="23" stroke="#222" stroke-width="1.5"/>
  <line x1="56" y1="23" x2="59" y2="22" stroke="#222" stroke-width="1.5"/>
  <!-- hair bun -->
  <circle cx="50" cy="16" r="8" fill="#774422"/>
  <circle cx="50" cy="13" r="5" fill="#885533"/>
</svg>`;

const januszSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- legs -->
  <line x1="44" y1="80" x2="42" y2="97" stroke="#f5c0a0" stroke-width="7"/>
  <line x1="56" y1="80" x2="58" y2="97" stroke="#f5c0a0" stroke-width="7"/>
  <!-- sandals -->
  <rect x="36" y="93" width="12" height="5" rx="2" fill="#8b4513"/>
  <rect x="52" y="93" width="12" height="5" rx="2" fill="#8b4513"/>
  <!-- cargo shorts khaki -->
  <rect x="36" y="62" width="28" height="20" rx="3" fill="#8fbc5a"/>
  <rect x="37" y="66" width="8" height="6" rx="1" fill="#7aaa4a" stroke="#6a9a3a" stroke-width="0.5"/>
  <!-- polo shirt -->
  <rect x="32" y="40" width="36" height="24" rx="6" fill="#ddcc88"/>
  <!-- arm left pointing -->
  <line x1="32" y1="50" x2="14" y2="56" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <!-- arm right holds map -->
  <line x1="68" y1="50" x2="84" y2="50" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <!-- map -->
  <rect x="82" y="43" width="14" height="12" rx="1" fill="#eedd99" stroke="#8b7333" stroke-width="1"/>
  <line x1="84" y1="47" x2="94" y2="47" stroke="#aaa" stroke-width="0.8"/>
  <line x1="84" y1="50" x2="92" y2="50" stroke="#aaa" stroke-width="0.8"/>
  <!-- head stocky -->
  <circle cx="50" cy="27" r="14" fill="#f0b090"/>
  <!-- receding hair -->
  <path d="M 37,22 Q 50,10 63,22 L 63,26 Q 50,16 37,26 Z" fill="#887766"/>
  <!-- big moustache -->
  <path d="M 40,33 Q 45,30 50,33 Q 55,30 60,33" fill="#777755"/>
  <!-- eyebrows skeptical -->
  <line x1="42" y1="24" x2="47" y2="25" stroke="#555" stroke-width="2" stroke-linecap="round"/>
  <line x1="53" y1="25" x2="58" y2="24" stroke="#555" stroke-width="2" stroke-linecap="round"/>
  <circle cx="44" cy="28" r="2" fill="#4a3020"/>
  <circle cx="56" cy="28" r="2" fill="#4a3020"/>
</svg>`;

const kaczkaSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- water hint -->
  <ellipse cx="50" cy="96" rx="34" ry="6" fill="#88bbff" opacity="0.35"/>
  <!-- tail feathers -->
  <ellipse cx="73" cy="72" rx="13" ry="6" fill="#228b22" transform="rotate(-30 73 72)"/>
  <!-- body white -->
  <ellipse cx="50" cy="72" rx="24" ry="18" fill="#f8f8f0"/>
  <!-- wing line -->
  <path d="M 30,70 Q 50,58 70,68" fill="none" stroke="#ddd" stroke-width="2"/>
  <!-- neck -->
  <ellipse cx="34" cy="55" rx="10" ry="14" fill="#f8f8f0"/>
  <!-- head green -->
  <circle cx="28" cy="44" r="14" fill="#228b22"/>
  <!-- white collar -->
  <ellipse cx="31" cy="58" rx="9" ry="4" fill="#f8f8f0"/>
  <!-- beak with food -->
  <polygon points="16,44 8,41 8,47" fill="#ffcc00"/>
  <!-- bread in beak -->
  <rect x="2" y="39" width="8" height="6" rx="2" fill="#ddb060"/>
  <!-- beady eye -->
  <circle cx="22" cy="41" r="3" fill="#111"/>
  <circle cx="21" cy="40" r="1" fill="#fff"/>
  <!-- angry brow -->
  <line x1="18" y1="37" x2="24" y2="38" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <!-- feet -->
  <line x1="44" y1="88" x2="36" y2="97" stroke="#ffaa00" stroke-width="4"/>
  <line x1="56" y1="88" x2="64" y2="97" stroke="#ffaa00" stroke-width="4"/>
  <line x1="30" y1="97" x2="42" y2="97" stroke="#ffaa00" stroke-width="3"/>
  <line x1="58" y1="97" x2="70" y2="97" stroke="#ffaa00" stroke-width="3"/>
</svg>`;

const swistakSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- ground hint -->
  <ellipse cx="50" cy="97" rx="28" ry="4" fill="#88aa44" opacity="0.45"/>
  <!-- body fat marmot -->
  <ellipse cx="50" cy="74" rx="20" ry="20" fill="#aa8844"/>
  <!-- belly -->
  <ellipse cx="50" cy="78" rx="12" ry="13" fill="#cc9955"/>
  <!-- paws raised -->
  <ellipse cx="28" cy="62" rx="8" ry="6" fill="#aa8844" transform="rotate(-35 28 62)"/>
  <ellipse cx="72" cy="62" rx="8" ry="6" fill="#aa8844" transform="rotate(35 72 62)"/>
  <!-- claws left -->
  <line x1="21" y1="56" x2="19" y2="52" stroke="#665533" stroke-width="2"/>
  <line x1="24" y1="54" x2="22" y2="50" stroke="#665533" stroke-width="2"/>
  <!-- claws right -->
  <line x1="79" y1="56" x2="81" y2="52" stroke="#665533" stroke-width="2"/>
  <line x1="76" y1="54" x2="78" y2="50" stroke="#665533" stroke-width="2"/>
  <!-- tail -->
  <ellipse cx="68" cy="88" rx="10" ry="6" fill="#887733" transform="rotate(20 68 88)"/>
  <!-- head -->
  <circle cx="50" cy="46" r="18" fill="#aa8844"/>
  <!-- chubby cheeks -->
  <ellipse cx="36" cy="50" rx="8" ry="7" fill="#cc9955"/>
  <ellipse cx="64" cy="50" rx="8" ry="7" fill="#cc9955"/>
  <!-- greedy eyes -->
  <circle cx="42" cy="43" r="3.5" fill="#222"/>
  <circle cx="58" cy="43" r="3.5" fill="#222"/>
  <circle cx="43" cy="42" r="1" fill="#fff"/>
  <circle cx="59" cy="42" r="1" fill="#fff"/>
  <!-- nose -->
  <ellipse cx="50" cy="51" rx="4" ry="2.5" fill="#884422"/>
  <!-- whiskers -->
  <line x1="30" y1="50" x2="44" y2="51" stroke="#555" stroke-width="1" opacity="0.7"/>
  <line x1="30" y1="53" x2="44" y2="53" stroke="#555" stroke-width="1" opacity="0.7"/>
  <line x1="56" y1="51" x2="70" y2="50" stroke="#555" stroke-width="1" opacity="0.7"/>
  <line x1="56" y1="53" x2="70" y2="53" stroke="#555" stroke-width="1" opacity="0.7"/>
  <!-- buck teeth -->
  <rect x="46" y="55" width="5" height="6" rx="1" fill="#fff" stroke="#ccc" stroke-width="0.5"/>
  <rect x="52" y="55" width="5" height="6" rx="1" fill="#fff" stroke="#ccc" stroke-width="0.5"/>
  <!-- ears -->
  <circle cx="35" cy="31" r="6" fill="#aa8844"/>
  <circle cx="65" cy="31" r="6" fill="#aa8844"/>
  <circle cx="35" cy="31" r="3.5" fill="#cc9966"/>
  <circle cx="65" cy="31" r="3.5" fill="#cc9966"/>
</svg>`;

const bileterSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- legs -->
  <line x1="43" y1="82" x2="41" y2="97" stroke="#111" stroke-width="7"/>
  <line x1="57" y1="82" x2="59" y2="97" stroke="#111" stroke-width="7"/>
  <!-- boots -->
  <rect x="35" y="93" width="12" height="5" rx="2" fill="#111"/>
  <rect x="53" y="93" width="12" height="5" rx="2" fill="#111"/>
  <!-- dark trousers -->
  <rect x="36" y="64" width="28" height="20" rx="3" fill="#1a3050"/>
  <!-- TPN uniform green -->
  <rect x="32" y="42" width="36" height="24" rx="6" fill="#2a5a30"/>
  <!-- badge -->
  <rect x="36" y="47" width="12" height="8" rx="1" fill="#d4a520"/>
  <text x="42" y="53" text-anchor="middle" font-size="5" font-weight="bold" fill="#1a3050">TPN</text>
  <!-- arm left holding clipboard -->
  <line x1="32" y1="52" x2="16" y2="60" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <rect x="8" y="56" width="12" height="16" rx="2" fill="#eee" stroke="#666" stroke-width="1"/>
  <rect x="9" y="55" width="10" height="3" rx="1" fill="#aaa"/>
  <line x1="10" y1="62" x2="18" y2="62" stroke="#888" stroke-width="1"/>
  <line x1="10" y1="65" x2="18" y2="65" stroke="#888" stroke-width="1"/>
  <line x1="10" y1="68" x2="16" y2="68" stroke="#888" stroke-width="1"/>
  <!-- arm right raised pointing -->
  <line x1="68" y1="50" x2="84" y2="44" stroke="#f5c0a0" stroke-width="6" stroke-linecap="round"/>
  <!-- head -->
  <circle cx="50" cy="28" r="14" fill="#f0b090"/>
  <!-- TPN cap -->
  <rect x="36" y="16" width="28" height="10" rx="2" fill="#2a5a30"/>
  <rect x="34" y="24" width="32" height="3" rx="1" fill="#1a4020"/>
  <rect x="34" y="25" width="32" height="2" fill="#d4a520"/>
  <!-- stern face -->
  <line x1="42" y1="26" x2="46" y2="27" stroke="#333" stroke-width="2" stroke-linecap="round"/>
  <line x1="54" y1="27" x2="58" y2="26" stroke="#333" stroke-width="2" stroke-linecap="round"/>
  <circle cx="44" cy="30" r="2" fill="#333"/>
  <circle cx="56" cy="30" r="2" fill="#333"/>
  <!-- frown -->
  <path d="M 44,37 Q 50,34 56,37" fill="none" stroke="#994422" stroke-width="2"/>
</svg>`;

const meleksiarzSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- meleks / golf cart body -->
  <rect x="12" y="58" width="76" height="30" rx="8" fill="#ffdd00" stroke="#ccaa00" stroke-width="2"/>
  <!-- roof -->
  <rect x="18" y="43" width="64" height="18" rx="4" fill="#ffdd00" stroke="#ccaa00" stroke-width="1.5"/>
  <!-- roof posts -->
  <line x1="20" y1="43" x2="20" y2="61" stroke="#ccaa00" stroke-width="3"/>
  <line x1="80" y1="43" x2="80" y2="61" stroke="#ccaa00" stroke-width="3"/>
  <!-- wheels -->
  <circle cx="28" cy="90" r="9" fill="#333" stroke="#222" stroke-width="2"/>
  <circle cx="28" cy="90" r="4" fill="#888"/>
  <circle cx="72" cy="90" r="9" fill="#333" stroke="#222" stroke-width="2"/>
  <circle cx="72" cy="90" r="4" fill="#888"/>
  <!-- klakson/horn -->
  <ellipse cx="88" cy="68" rx="8" ry="5" fill="#ff4400"/>
  <text x="88" y="71" text-anchor="middle" font-size="7" font-weight="bold" fill="#fff">!</text>
  <!-- driver torso -->
  <rect x="28" y="46" width="24" height="14" rx="4" fill="#ee6600"/>
  <!-- driver head -->
  <circle cx="40" cy="36" r="12" fill="#f5c0a0"/>
  <!-- cap -->
  <rect x="29" y="27" width="24" height="9" rx="3" fill="#ee6600"/>
  <rect x="27" y="35" width="28" height="3" rx="1" fill="#cc4400"/>
  <!-- grumpy face -->
  <circle cx="36" cy="37" r="2" fill="#222"/>
  <circle cx="46" cy="37" r="2" fill="#222"/>
  <path d="M 36,43 Q 40,40 45,43" fill="none" stroke="#994422" stroke-width="2"/>
  <!-- arm on steering wheel -->
  <line x1="28" y1="54" x2="16" y2="64" stroke="#f5c0a0" stroke-width="5" stroke-linecap="round"/>
  <!-- steering wheel -->
  <circle cx="14" cy="66" r="7" fill="none" stroke="#aa8800" stroke-width="2.5"/>
</svg>`;

const boberSprite = `
<svg viewBox="0 0 100 100" width="120" height="120">
  <!-- tourist junk dam -->
  <rect x="4" y="70" width="92" height="7" rx="2" fill="#aaaaaa" opacity="0.4"/>
  <ellipse cx="18" cy="72" rx="8" ry="3" fill="#ff6600" opacity="0.65"/>
  <rect x="68" y="66" width="5" height="12" rx="2" fill="#88ccff" opacity="0.55"/>
  <!-- body large -->
  <ellipse cx="50" cy="76" rx="28" ry="16" fill="#7a4a1a"/>
  <!-- belly -->
  <ellipse cx="50" cy="79" rx="18" ry="10" fill="#aa7733"/>
  <!-- flat paddle tail -->
  <ellipse cx="75" cy="85" rx="18" ry="8" fill="#5a3010" stroke="#3a1a00" stroke-width="1"/>
  <line x1="60" y1="81" x2="91" y2="83" stroke="#3a1a00" stroke-width="1" opacity="0.6"/>
  <line x1="60" y1="85" x2="91" y2="87" stroke="#3a1a00" stroke-width="1" opacity="0.6"/>
  <!-- front paws raised -->
  <ellipse cx="22" cy="62" rx="9" ry="7" fill="#7a4a1a" transform="rotate(-40 22 62)"/>
  <ellipse cx="78" cy="62" rx="9" ry="7" fill="#7a4a1a" transform="rotate(40 78 62)"/>
  <!-- claws -->
  <line x1="15" y1="56" x2="12" y2="52" stroke="#3a1a00" stroke-width="2"/>
  <line x1="18" y1="54" x2="16" y2="50" stroke="#3a1a00" stroke-width="2"/>
  <line x1="82" y1="56" x2="85" y2="52" stroke="#3a1a00" stroke-width="2"/>
  <line x1="79" y1="54" x2="81" y2="50" stroke="#3a1a00" stroke-width="2"/>
  <!-- head -->
  <circle cx="50" cy="50" r="20" fill="#7a4a1a"/>
  <!-- muzzle / cheeks -->
  <ellipse cx="50" cy="56" rx="13" ry="9" fill="#aa7733"/>
  <!-- wide angry eyes -->
  <circle cx="39" cy="45" r="5" fill="#fff" stroke="#3a1a00" stroke-width="1"/>
  <circle cx="61" cy="45" r="5" fill="#fff" stroke="#3a1a00" stroke-width="1"/>
  <circle cx="40" cy="46" r="3" fill="#222"/>
  <circle cx="62" cy="46" r="3" fill="#222"/>
  <circle cx="41" cy="45" r="1" fill="#fff"/>
  <circle cx="63" cy="45" r="1" fill="#fff"/>
  <!-- angry brows -->
  <line x1="33" y1="40" x2="41" y2="42" stroke="#3a1a00" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="59" y1="42" x2="67" y2="40" stroke="#3a1a00" stroke-width="2.5" stroke-linecap="round"/>
  <!-- nose -->
  <ellipse cx="50" cy="56" rx="5" ry="3" fill="#5a2a00"/>
  <!-- beaver teeth -->
  <rect x="45" y="62" width="5" height="7" rx="1" fill="#fff" stroke="#ddd" stroke-width="0.5"/>
  <rect x="51" y="62" width="5" height="7" rx="1" fill="#fff" stroke="#ddd" stroke-width="0.5"/>
  <!-- round ears -->
  <circle cx="33" cy="33" r="8" fill="#7a4a1a"/>
  <circle cx="67" cy="33" r="8" fill="#7a4a1a"/>
  <circle cx="33" cy="33" r="4" fill="#aa6633"/>
  <circle cx="67" cy="33" r="4" fill="#aa6633"/>
</svg>`;

const krolowaSchroniskaSprite = `
<svg viewBox="0 0 100 100" width="140" height="140">
  <!-- counter -->
  <rect x="0" y="72" width="100" height="28" fill="#8b5a2b"/>
  <rect x="0" y="70" width="100" height="5" fill="#a0692e"/>
  <!-- items on counter -->
  <rect x="8" y="61" width="8" height="12" rx="2" fill="#ddaa55"/>
  <rect x="22" y="63" width="14" height="9" rx="3" fill="#cc4444"/>
  <ellipse cx="55" cy="68" rx="10" ry="4" fill="#ddeeff"/>
  <!-- body + apron -->
  <rect x="26" y="40" width="48" height="32" rx="6" fill="#cc4444"/>
  <rect x="36" y="44" width="28" height="28" rx="3" fill="#ffffff"/>
  <!-- apron strings -->
  <line x1="36" y1="46" x2="26" y2="49" stroke="#eee" stroke-width="2"/>
  <line x1="64" y1="46" x2="74" y2="49" stroke="#eee" stroke-width="2"/>
  <!-- arm left -->
  <line x1="26" y1="52" x2="8" y2="62" stroke="#f5c0a0" stroke-width="7" stroke-linecap="round"/>
  <!-- arm right wagging finger -->
  <line x1="74" y1="52" x2="90" y2="44" stroke="#f5c0a0" stroke-width="7" stroke-linecap="round"/>
  <line x1="90" y1="44" x2="96" y2="36" stroke="#f5c0a0" stroke-width="4" stroke-linecap="round"/>
  <!-- head -->
  <circle cx="50" cy="24" r="18" fill="#f0b090"/>
  <!-- hair dark bun -->
  <path d="M 33,20 Q 50,6 67,20 L 67,26 Q 50,14 33,26 Z" fill="#3a2a1a"/>
  <circle cx="50" cy="12" r="8" fill="#3a2a1a"/>
  <line x1="44" y1="10" x2="56" y2="10" stroke="#d4a520" stroke-width="2"/>
  <!-- commanding face -->
  <line x1="40" y1="22" x2="44" y2="23" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="56" y1="23" x2="60" y2="22" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="42" cy="27" r="2.5" fill="#3a2010"/>
  <circle cx="58" cy="27" r="2.5" fill="#3a2010"/>
  <!-- thin pursed lips -->
  <line x1="43" y1="33" x2="57" y2="33" stroke="#994422" stroke-width="2.5" stroke-linecap="round"/>
  <!-- steam lines -->
  <path d="M 18,57 Q 12,48 18,40" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.55"/>
  <path d="M 14,57 Q 8,46 14,36" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.35"/>
</svg>`;

const harnasPogodynkaSprite = `
<svg viewBox="0 0 100 100" width="140" height="140">
  <!-- halny wind lines -->
  <path d="M 2,18 Q 14,13 8,8" fill="none" stroke="#88aacc" stroke-width="2" opacity="0.6"/>
  <path d="M 0,28 Q 14,20 8,14" fill="none" stroke="#88aacc" stroke-width="1.5" opacity="0.5"/>
  <path d="M 98,16 Q 86,11 92,6" fill="none" stroke="#88aacc" stroke-width="2" opacity="0.6"/>
  <!-- snowflake symbols -->
  <text x="84" y="34" font-size="10" fill="#88ddff" opacity="0.8">❄</text>
  <text x="7" y="48" font-size="8" fill="#88ddff" opacity="0.7">❄</text>
  <!-- fog wisps -->
  <ellipse cx="14" cy="72" rx="12" ry="5" fill="#cccccc" opacity="0.35"/>
  <ellipse cx="84" cy="78" rx="13" ry="5" fill="#cccccc" opacity="0.3"/>
  <!-- legs -->
  <line x1="43" y1="82" x2="40" y2="97" stroke="#111" stroke-width="8"/>
  <line x1="57" y1="82" x2="60" y2="97" stroke="#111" stroke-width="8"/>
  <!-- kierpce shoes -->
  <rect x="33" y="93" width="14" height="5" rx="2" fill="#111"/>
  <rect x="53" y="93" width="14" height="5" rx="2" fill="#111"/>
  <!-- white trousers with red stripe -->
  <rect x="36" y="64" width="28" height="20" rx="3" fill="#f8f8f0"/>
  <line x1="36" y1="70" x2="64" y2="70" stroke="#cc2200" stroke-width="1.5"/>
  <!-- broad body: vest over shirt -->
  <rect x="30" y="42" width="40" height="24" rx="6" fill="#f5f5f0" stroke="#ccc" stroke-width="1"/>
  <rect x="30" y="42" width="15" height="24" rx="4" fill="#2a3a1a" opacity="0.9"/>
  <rect x="55" y="42" width="15" height="24" rx="4" fill="#2a3a1a" opacity="0.9"/>
  <!-- arms spread commanding weather -->
  <line x1="30" y1="50" x2="8" y2="37" stroke="#f5c0a0" stroke-width="7" stroke-linecap="round"/>
  <line x1="70" y1="50" x2="92" y2="37" stroke="#f5c0a0" stroke-width="7" stroke-linecap="round"/>
  <!-- weather orbs in hands -->
  <circle cx="5" cy="35" r="8" fill="#88ccff" opacity="0.7"/>
  <circle cx="95" cy="35" r="8" fill="#ffcc44" opacity="0.7"/>
  <!-- head -->
  <circle cx="50" cy="28" r="15" fill="#c49a6c"/>
  <!-- grey beard -->
  <path d="M 37,35 Q 42,43 50,45 Q 58,43 63,35" fill="#aaaaaa"/>
  <!-- bushy eyebrows -->
  <path d="M 37,22 Q 44,19 48,22" fill="none" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 52,22 Q 56,19 63,22" fill="none" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>
  <!-- eyes piercing -->
  <circle cx="43" cy="26" r="3" fill="#333"/>
  <circle cx="57" cy="26" r="3" fill="#333"/>
  <!-- góralski hat -->
  <rect x="36" y="14" width="28" height="10" rx="2" fill="#111"/>
  <rect x="34" y="22" width="32" height="3" rx="1" fill="#0a0a0a"/>
  <rect x="34" y="21" width="32" height="2" fill="#cc2200"/>
  <path d="M 60,15 Q 70,8 68,2 Q 64,7 62,15" fill="#228b22"/>
  <path d="M 62,15 Q 74,5 72,0 Q 67,6 64,15" fill="#33aa33"/>
</svg>`;

/** @type {Record<string, EnemyDef>} */
export const enemyLibrary = {
  cepr: {
    id: 'cepr',
    name: 'Cepr',
    emoji: '🧦',
    hp: 81,
    maxHp: 81,
    block: 0,
    baseAttack: 0,
    spriteSvg: ceprSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Rzut klapkiem', damage: 7, hits: 1 },
      { type: 'status', name: 'Pytanie o drogę', addStatusCard: 'ulotka', amount: 2 },
      { type: 'attack', name: 'Złość turysty', damage: 12, hits: 1 },
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
    hp: 75,
    maxHp: 75,
    block: 0,
    baseAttack: 0,
    spriteSvg: busiarzSprite,
    patternType: 'loop',
    passive: 'brak_reszty',
    pattern: [
      { type: 'attack', name: 'Trąbienie na pieszych', damage: 4, hits: 2 },
      { type: 'attack', name: 'Wyprzedzanie na trzeciego', damage: 9, hits: 1, applyFrail: 2 },
      { type: 'block', name: 'Zbieranie kompletu', block: 10, heal: 3 },
    ],
  },
  baba: {
    id: 'baba',
    name: 'Handlara oscypkami',
    emoji: '🧀',
    hp: 90,
    maxHp: 90,
    block: 0,
    baseAttack: 0,
    spriteSvg: babaSprite,
    patternType: 'loop',
    passive: 'targowanie_sie',
    pattern: [
      { type: 'block', name: 'Darmowa degustacja', block: 8 },
      { type: 'attack', name: 'Cena z kosmosu', damage: 8, hits: 1, applyWeak: 1 },
      { type: 'attack', name: 'Rzut redykołką', damage: 13, hits: 1 },
    ],
  },
  influencerka: {
    id: 'influencerka',
    name: 'Influencerka',
    emoji: '🤳',
    hp: 69,
    maxHp: 69,
    block: 0,
    baseAttack: 0,
    spriteSvg: influencerkaSprite,
    patternType: 'loop',
    passive: 'parcie_na_szklo',
    pattern: [
      { type: 'attack', name: 'Selfie z zaskoczenia', damage: 14, hits: 1, applyVulnerable: 2 },
      { type: 'status', name: 'Oznaczenie w relacji', addStatusCard: 'spam_tagami', amount: 2 },
      { type: 'block', name: 'Filtr upiększający', block: 12, heal: 4 },
    ],
  },
  parkingowy: {
    id: 'parkingowy',
    name: 'Parkingowy z Palenicy',
    emoji: '🚧',
    hp: 110,
    maxHp: 110,
    block: 0,
    baseAttack: 0,
    spriteSvg: parkingowySprite,
    patternType: 'loop',
    passive: 'blokada_parkingowa',
    pattern: [
      {
        type: 'attack',
        name: 'Bilet za wycieraczką',
        damage: 7,
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
    hp: 86,
    maxHp: 86,
    block: 0,
    baseAttack: 0,
    spriteSvg: kolejkarzSprite,
    patternType: 'loop',
    passive: 'blokada_parkingowa',
    pattern: [
      { type: 'attack', name: 'Szturchanie w kolejce', damage: 6, hits: 2 },
      { type: 'status', name: 'Zmiana regulaminu', addStatusCard: 'ulotka', amount: 1 },
      { type: 'attack', name: 'Priorytet VIP', damage: 12, hits: 1, applyWeak: 1 },
    ],
  },
  naganiacz_z_krupowek: {
    id: 'naganiacz_z_krupowek',
    name: 'Naganiacz z Krupówek',
    emoji: '♨️',
    eventOnly: true,
    hp: 81,
    maxHp: 81,
    block: 0,
    baseAttack: 0,
    spriteSvg: naganiaczTermSprite,
    patternType: 'loop',
    pattern: [
      { type: 'buff', name: 'Krzykliwa zachęta', strengthGain: 1, block: 8 },
      { type: 'attack', name: 'Promka spod budki', damage: 10, hits: 1, applyVulnerable: 1 },
      { type: 'attack', name: 'Zasyp ulotkami', damage: 4, hits: 2, applyFrail: 1 },
    ],
  },
  naganiacze_duo: {
    id: 'naganiacze_duo',
    name: 'Naganiacze z Krupówek',
    emoji: '🕴️',
    eventOnly: true,
    hp: 88,
    maxHp: 88,
    block: 0,
    baseAttack: 0,
    spriteSvg: naganiaczeDuoPhase1Sprite,
    phase2SpriteSvg: naganiaczeDuoPhase2Sprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Podpuszczanie', damage: 7, hits: 1, applyWeak: 1 },
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
      { type: 'buff', name: 'Kancelaria prawna', strengthGain: 1, block: 10 },
      { type: 'attack', name: 'Umowa wstępna', damage: 8, hits: 1, applyVulnerable: 1 },
      { type: 'attack', name: 'Podwyżka czynszu', damage: 10, hits: 1, stealDutki: 3 },
      { type: 'attack', name: 'Eksmisja Odwrócona', damage: 6, hits: 2, applyWeak: 1 },
    ],
  },
  mistrz_redyku: {
    id: 'mistrz_redyku',
    name: 'Mistrz Redyku',
    emoji: '🐑',
    hp: 90,
    maxHp: 90,
    block: 0,
    baseAttack: 0,
    spriteSvg: mistrzRedykuSprite,
    patternType: 'loop',
    passive: 'hart_ducha',
    elite: true,
    pattern: [
      { type: 'buff', name: 'Poświst', strengthGain: 1, block: 5 },
      { type: 'attack', name: 'Uderzenie Bacówką', damage: 11, hits: 1, applyFrail: 1 },
      { type: 'attack', name: 'Redyk przez dolinę', damage: 3, hits: 3 },
      { type: 'attack', name: 'Zbójnicki taniec', damage: 13, hits: 1 },
    ],
  },
  ceprzyca_vip: {
    id: 'ceprzyca_vip',
    name: 'Ceprzyca VIP',
    emoji: '👒',
    hp: 94,
    maxHp: 94,
    block: 0,
    baseAttack: 0,
    spriteSvg: ceprzyca_vipSprite,
    patternType: 'loop',
    passive: 'influencer_aura',
    elite: true,
    pattern: [
      { type: 'attack', name: 'Zdjęcie z widokiem', damage: 7, hits: 1, applyVulnerable: 2 },
      { type: 'status', name: 'Rezerwacja VIP', addStatusCard: 'ulotka', amount: 1 },
      { type: 'attack', name: 'Awantura o cenę', damage: 12, hits: 1, applyWeak: 2 },
      { type: 'block', name: 'Concierge na ratunek', block: 10, heal: 3 },
    ],
  },
  fiakier: {
    id: 'fiakier',
    name: 'Fiakier spod Krupówek',
    emoji: '🐴',
    hp: 165,
    maxHp: 165,
    block: 0,
    baseAttack: 0,
    spriteSvg: fiakierSprite,
    patternType: 'loop',
    passive: 'rachunek_za_kurs',
    isBoss: true,
    pattern: [
      { type: 'attack', name: 'Batogiem po grzbiecie', damage: 10, hits: 1, gainPed: 2 },
      { type: 'buff', name: 'Rozped', strengthGain: 1, block: 6 },
      { type: 'attack', name: 'Przyspieszenie', damage: 14, hits: 1, usePed: true },
      {
        type: 'attack',
        name: 'Zamach Batem',
        damage: 12,
        hits: 1,
        applyVulnerable: 1,
        stealDutki: 4,
      },
    ],
  },
  pomocnik_fiakra: {
    id: 'pomocnik_fiakra',
    name: 'Pomocnik Fiakra',
    emoji: '🧢',
    hp: 64,
    maxHp: 64,
    block: 0,
    baseAttack: 0,
    spriteSvg: fiakierSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Bat po łydkach', damage: 10, hits: 1 },
      { type: 'attack', name: 'Szarpnięcie lejców', damage: 8, hits: 1, applyFrail: 1 },
      { type: 'block', name: 'Zbieranie oddechu', block: 6 },
    ],
  },
  boss: {
    id: 'boss',
    name: 'Król Krupówek - Biały Misiek (Zdzisiek)',
    emoji: '🐻‍❄️',
    hp: 155,
    maxHp: 155,
    block: 0,
    baseAttack: 0,
    spriteSvg: bossSprite,
    patternType: 'loop',
    passive: 'ochrona_wizerunku',
    isBoss: true,
    pattern: [
      { type: 'buff', name: 'Górski Ryk', strengthGain: 1, block: 5 },
      { type: 'attack', name: 'Agresywne pozowanie', damage: 2, hits: 3 },
      { type: 'attack', name: 'Podatek od zdjęcia', damage: 9, hits: 1, applyFrail: 1 },
      { type: 'attack', name: 'Uścisk Krupówek', damage: 12, hits: 1 },
    ],
  },

  // ─── Act 2: Morskie Oko — regular enemies ──────────────────────────────────
  turysta_w_klapkach: {
    id: 'turysta_w_klapkach',
    name: 'Turysta w Klapkach',
    emoji: '🩴',
    hp: 111,
    maxHp: 111,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: turystaSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Rzut kabanosem', damage: 11, hits: 1 },
      { type: 'attack', name: 'Plask klapkiem', damage: 8, hits: 2, applyFrail: 1 },
      { type: 'attack', name: 'Otarcia pięty', damage: 14, hits: 1 },
    ],
  },
  rodzina_z_glosnikiem: {
    id: 'rodzina_z_glosnikiem',
    name: 'Rodzina z Głośnikiem',
    emoji: '📢',
    hp: 109,
    maxHp: 109,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: glosnikSprite,
    patternType: 'loop',
    pattern: [
      { type: 'status', name: 'Bas drop', addStatusCard: 'halas', amount: 2 },
      { type: 'attack', name: 'Zgubione dziecko', damage: 8, hits: 2, applyWeak: 1 },
      { type: 'attack', name: 'Krzyk o loda', damage: 12, hits: 1 },
    ],
  },
  spocony_polmaratonczyk: {
    id: 'spocony_polmaratonczyk',
    name: 'Spocony Półmaratończyk',
    emoji: '🏃',
    hp: 106,
    maxHp: 106,
    block: 0,
    baseAttack: 0,
    act: 2,
    passive: 'drugi_oddech',
    spriteSvg: polmaratonczykSprite,
    patternType: 'loop',
    pattern: [
      { type: 'buff', name: 'Łapanie oddechu', strengthGain: 2, block: 6 },
      { type: 'attack', name: 'Pot na czole', damage: 9, hits: 1 },
      { type: 'attack', name: 'Ślepa szarża', damage: 14, hits: 1 },
    ],
  },
  insta_taterniczka: {
    id: 'insta_taterniczka',
    name: 'Insta-Taterniczka',
    emoji: '🤳',
    hp: 113,
    maxHp: 113,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: instaTaterniczkaSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Błysk flesza', damage: 9, hits: 1, applyVulnerable: 2 },
      { type: 'status', name: 'Selfie z hasztagiem', addStatusCard: 'spam_tagami', amount: 3 },
      { type: 'attack', name: 'Selfie z widokiem', damage: 12, hits: 1 },
      { type: 'block', name: 'Dzióbek', block: 14, heal: 6 },
    ],
  },
  janusz_znawca_szlakow: {
    id: 'janusz_znawca_szlakow',
    name: 'Janusz Znawca Szlaków',
    emoji: '🗺️',
    hp: 112,
    maxHp: 112,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: januszSprite,
    patternType: 'loop',
    pattern: [
      { type: 'block', name: 'Zjedz kanapkę', block: 16, heal: 6 },
      { type: 'attack', name: 'Dobra rada', damage: 9, hits: 1, applyWeak: 2 },
      { type: 'attack', name: 'Wykład o mapie', damage: 12, hits: 1 },
    ],
  },
  zlodziejska_kaczka: {
    id: 'zlodziejska_kaczka',
    name: 'Złodziejska Kaczka',
    emoji: '🦆',
    hp: 109,
    maxHp: 109,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: kaczkaSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Uszczypnięcie', damage: 7, hits: 2 },
      { type: 'block', name: 'Unik wodny', block: 11, gainEvasion: 1 },
      { type: 'attack', name: 'Kradzież kanapki', damage: 10, hits: 1, stealCard: true },
    ],
  },
  glodny_swistak: {
    id: 'glodny_swistak',
    name: 'Głodny Świstak',
    emoji: '🐿️',
    hp: 106,
    maxHp: 106,
    block: 0,
    baseAttack: 0,
    act: 2,
    passive: 'wiecznie_glodny',
    spriteSvg: swistakSprite,
    patternType: 'loop',
    pattern: [
      { type: 'attack', name: 'Krótki pazur', damage: 7, hits: 2, applyWeak: 1 },
      { type: 'buff', name: 'Pisk rozpaczy', strengthGain: 2, block: 6 },
      { type: 'attack', name: 'Ucieczka w nory', damage: 10, hits: 1, applyFrail: 1 },
    ],
  },

  // ─── Act 2: Morskie Oko — elite enemies ────────────────────────────────────
  bileter_z_tpn: {
    id: 'bileter_z_tpn',
    name: 'Bileter z TPN',
    emoji: '🎫',
    hp: 132,
    maxHp: 132,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: bileterSprite,
    patternType: 'loop',
    passive: 'kontrola_stempla',
    elite: true,
    pattern: [
      { type: 'status', name: 'Brak biletu', addStatusCard: 'mandat', amount: 2 },
      { type: 'attack', name: 'Inspekcja paragonu', damage: 14, hits: 1, applyWeak: 1 },
      { type: 'buff', name: 'Wezwanie straży', strengthGain: 2, block: 16 },
      { type: 'attack', name: 'Mandat za wydeptanie', damage: 18, hits: 1, applyFrail: 1 },
    ],
  },
  meleksiarz_pirat_drogowy: {
    id: 'meleksiarz_pirat_drogowy',
    name: 'Meleksiarz Pirat Drogowy',
    emoji: '🛺',
    hp: 109,
    maxHp: 109,
    block: 0,
    baseAttack: 0,
    act: 2,
    passive: 'gaz_do_dechy',
    spriteSvg: meleksiarzSprite,
    patternType: 'loop',
    elite: true,
    pattern: [
      { type: 'attack', name: 'Boczkiem, boczkiem!', damage: 6, hits: 2, applyVulnerable: 1 },
      { type: 'attack', name: 'Klakson z zaskoczenia', damage: 11, hits: 1, applyFrail: 1 },
      { type: 'attack', name: 'Wjazd w tłum', damage: 17, hits: 1 },
      { type: 'attack', name: 'Priorytet dla meleksa', damage: 7, hits: 2, applyVulnerable: 1 },
    ],
  },
  bober_z_morskiego_oka: {
    id: 'bober_z_morskiego_oka',
    name: 'Bober z Morskiego Oka',
    emoji: '🦫',
    hp: 114,
    maxHp: 114,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: boberSprite,
    patternType: 'loop',
    passive: 'napor_wody',
    elite: true,
    pattern: [
      { type: 'block', name: 'Budowa tamy', block: 22 },
      { type: 'attack', name: 'Plask ogonem', damage: 15, hits: 1 },
      { type: 'attack', name: 'Podgryzanie kijka', damage: 8, hits: 1, applyFrail: 2 },
      { type: 'buff', name: 'Inspekcja tamy', strengthGain: 1, block: 8 },
    ],
  },

  // ─── Act 2: Morskie Oko — bosses ───────────────────────────────────────────
  krolowa_schroniska: {
    id: 'krolowa_schroniska',
    name: 'Królowa Schroniska',
    emoji: '👑',
    hp: 240,
    maxHp: 240,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: krolowaSchroniskaSprite,
    patternType: 'loop',
    passive: 'kolejka_do_toalety',
    isBoss: true,
    pattern: [
      { type: 'status', name: 'Gorąca zupa', addStatusCard: 'numerek_do_toalety', amount: 2 },
      { type: 'attack', name: 'Wrzątek płatny', damage: 11, hits: 1, applyWeak: 2 },
      { type: 'buff', name: 'Obsługa kolejki', strengthGain: 4, block: 20 },
      { type: 'attack', name: 'Koniec wydawki', damage: 25, hits: 1 },
    ],
  },
  harnas_pogodynka: {
    id: 'harnas_pogodynka',
    name: 'Harnaś Pogodynka',
    emoji: '⛈️',
    hp: 232,
    maxHp: 232,
    block: 0,
    baseAttack: 0,
    act: 2,
    spriteSvg: harnasPogodynkaSprite,
    patternType: 'weather_loop',
    isBoss: true,
    passive: 'zmiana_pogody',
    weatherPatterns: {
      clear: [
        { type: 'buff', name: 'Przygotowanie do prognozy', strengthGain: 2, block: 14 },
        { type: 'attack', name: 'Wiatr wstępny', damage: 12, hits: 1, applyWeak: 1 },
        { type: 'attack', name: 'Zmiana frontów', damage: 16, hits: 1, applyVulnerable: 1 },
        { type: 'attack', name: 'Prognoza burzy', damage: 21, hits: 1 },
      ],
      halny: [
        { type: 'attack', name: 'Powiew halnego', damage: 6, hits: 3 },
        { type: 'buff', name: 'Taniec w wichurze', strengthGain: 3, block: 8 },
        { type: 'attack', name: 'Wicher tatrzański', damage: 8, hits: 3 },
        { type: 'attack', name: 'Podmuch szczytowy', damage: 10, hits: 2, applyWeak: 1 },
      ],
      frozen: [
        { type: 'attack', name: 'Lód na szlaku', damage: 11, hits: 1, applyWeak: 2 },
        { type: 'attack', name: 'Mroźne uderzenie', damage: 18, hits: 1 },
        { type: 'buff', name: 'Zamarznięty wicher', strengthGain: 2, block: 10 },
        { type: 'attack', name: 'Zamrożenie', damage: 14, hits: 1, applyWeak: 2 },
      ],
      fog: [
        { type: 'attack', name: 'Uderzenie we mgle', damage: 19, hits: 1, applyVulnerable: 2 },
        { type: 'buff', name: 'Mglisty manewr', strengthGain: 3, block: 12 },
        { type: 'attack', name: 'Mglisty cios', damage: 24, hits: 1 },
        {
          type: 'attack',
          name: 'Gęsta mgła',
          damage: 14,
          hits: 1,
          applyWeak: 1,
          applyVulnerable: 1,
        },
      ],
    },
  },
};

export const enemies = enemyLibrary;
