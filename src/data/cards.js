/**
 * @typedef {{ strength: number, weak: number, fragile: number, next_double: boolean, energy_next_turn: number }} StatusDef
 * @typedef {{ playerAnim?: string, enemyAnim?: string, damage?: { raw: number, blocked: number, dealt: number } }} CardEffectResult
 * @typedef {{ id: string, name: string, cost: number, emoji: string, desc: string, exhaust?: boolean, effect: (state: import('../state/GameState.js').GameState) => CardEffectResult }} CardDef
 */

/** @type {Record<string, CardDef>} */
export const cardLibrary = {
  ciupaga: {
    id: 'ciupaga', name: 'Cios Ciupagą', cost: 1, emoji: '🪓', desc: 'Zadaje 6 obrażeń.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 6);
      const damage = state._applyDamageToEnemy(dmg);
      return { playerAnim: 'anim-attack-p', enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block', damage };
    },
  },
  gasior: {
    id: 'gasior', name: 'Łyk z Gąsiora', cost: 1, emoji: '🏺', desc: 'Zyskujesz 5 Gardy.',
    effect(state) {
      state.player.block += 5;
      return { playerAnim: 'anim-block' };
    },
  },
  kierpce: {
    id: 'kierpce', name: 'Rzut Kierpcem', cost: 2, emoji: '👞', desc: 'Zadaje 12 obrażeń. Śmierdzi.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 12);
      const damage = state._applyDamageToEnemy(dmg);
      return { playerAnim: 'anim-attack-p', enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block', damage };
    },
  },
  hej: {
    id: 'hej', name: 'Góralskie Hej!', cost: 0, emoji: '🗣️', desc: 'Dobierz 2 karty. Hej!',
    effect(state) {
      state._drawCards(2);
      return { playerAnim: 'anim-block' };
    },
  },

  // --- New cards ---

  sernik: {
    id: 'sernik', name: 'Sernik', cost: 0, emoji: '🍰',
    desc: 'Zyskujesz 1 Oscypek. Exhaust.',
    exhaust: true,
    effect(state) {
      state.player.energy += 1;
      return { playerAnim: 'anim-block' };
    },
  },
  redyk: {
    id: 'redyk', name: 'Redyk', cost: 1, emoji: '🐑',
    desc: 'Atakuje 4 razy po 2 obrażenia (+Siła).',
    effect(state) {
      let totalDealt = 0;
      let totalBlocked = 0;
      for (let i = 0; i < 4; i++) {
        if (state.enemy.hp <= 0) break;
        const dmg = state._calcAttackDamage(state.player, 2);
        const damage = state._applyDamageToEnemy(dmg);
        totalDealt += damage.dealt;
        totalBlocked += damage.blocked;
      }
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: totalDealt > 0 ? 'anim-damage' : 'anim-block',
        damage: { raw: totalDealt + totalBlocked, blocked: totalBlocked, dealt: totalDealt },
      };
    },
  },
  halny: {
    id: 'halny', name: 'Halny', cost: 2, emoji: '🌬️',
    desc: 'Odrzuć rękę, dobierz 3 karty.',
    effect(state) {
      state.discard.push(...state.hand);
      state.hand = [];
      state._drawCards(3);
      return { playerAnim: 'anim-block' };
    },
  },
  parzenica: {
    id: 'parzenica', name: 'Parzenica', cost: 1, emoji: '🧶',
    desc: 'Zyskujesz 7 Gardy. Na początku kolejnej tury +1 Oscypek.',
    effect(state) {
      state.player.block += 7;
      state.player.status.energy_next_turn += 1;
      return { playerAnim: 'anim-block' };
    },
  },
  zadyma: {
    id: 'zadyma', name: 'Zadyma', cost: 1, emoji: '💥',
    desc: 'Zadaje 8 obrażeń. Jeśli wróg ma Gardę: 12 obrażeń.',
    effect(state) {
      const base = state.enemy.block > 0 ? 12 : 8;
      const dmg = state._calcAttackDamage(state.player, base);
      const damage = state._applyDamageToEnemy(dmg);
      return { playerAnim: 'anim-attack-p', enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block', damage };
    },
  },
  zyntyca: {
    id: 'zyntyca', name: 'Żyntyca', cost: 1, emoji: '🥛',
    desc: 'Leczysz 4 Krzepa.',
    effect(state) {
      state.player.hp = Math.min(state.player.hp + 4, state.player.maxHp);
      return { playerAnim: 'anim-block' };
    },
  },
  janosik: {
    id: 'janosik', name: 'Janosik', cost: 1, emoji: '🗡️',
    desc: 'Zadaje 7 obrażeń. Jeśli Cepr pada: +20 Dutki.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 7);
      const damage = state._applyDamageToEnemy(dmg);
      if (state.enemy.hp <= 0) state.gold += 20;
      return { playerAnim: 'anim-attack-p', enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block', damage };
    },
  },
  echo: {
    id: 'echo', name: 'Echo', cost: 2, emoji: '🔊',
    desc: 'Twój następny atak zadaje podwójne obrażenia.',
    effect(state) {
      state.player.status.next_double = true;
      return { playerAnim: 'anim-block' };
    },
  },
  sandaly: {
    id: 'sandaly', name: 'Sandały', cost: 1, emoji: '👡',
    desc: 'Zadaje 5 obrażeń. Nakłada Słabość 2 na wroga.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 5);
      const damage = state._applyDamageToEnemy(dmg);
      state.enemy.status.weak += 2;
      return { playerAnim: 'anim-attack-p', enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block', damage };
    },
  },
  giewont: {
    id: 'giewont', name: 'Giewont', cost: 3, emoji: '⛰️',
    desc: 'Zadaje 25 obrażeń.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 25);
      const damage = state._applyDamageToEnemy(dmg);
      return { playerAnim: 'anim-attack-p', enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block', damage };
    },
  },
};

/** @type {string[]} */
export const startingDeck = [
  'ciupaga', 'ciupaga', 'ciupaga', 'ciupaga',
  'gasior',  'gasior',  'gasior',  'gasior',
  'kierpce', 'hej',
];
