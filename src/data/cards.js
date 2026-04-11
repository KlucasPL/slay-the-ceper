/**
 * @typedef {{ strength: number, weak: number, fragile: number, next_double: boolean, energy_next_turn: number }} StatusDef
 * @typedef {{ playerAnim?: string, enemyAnim?: string, damage?: { raw: number, blocked: number, dealt: number } }} CardEffectResult
 * @typedef {{ id: string, name: string, type: 'attack' | 'skill', cost: number, price: number, emoji: string, desc: string, isStarter?: boolean, exhaust?: boolean, effect: (state: import('../state/GameState.js').GameState) => CardEffectResult }} CardDef
 */

/** @type {Record<string, CardDef>} */
export const cardLibrary = {
  ciupaga: {
    id: 'ciupaga',
    name: 'Cios ciupagą',
    type: 'attack',
    cost: 1,
    price: 40,
    isStarter: true,
    emoji: '🪓',
    desc: 'Zadaje 6 obrażeń.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 6 + state.getCardDamageBonus('ciupaga'));
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },
  gasior: {
    id: 'gasior',
    name: 'Łyk z Gąsiora',
    type: 'skill',
    cost: 1,
    price: 35,
    isStarter: true,
    emoji: '🏺',
    desc: 'Zyskujesz 5 Gardy.',
    effect(state) {
      state.gainPlayerBlockFromCard(5);
      return { playerAnim: 'anim-block' };
    },
  },
  kierpce: {
    id: 'kierpce',
    name: 'Rzut kierpcem',
    type: 'attack',
    cost: 2,
    price: 70,
    emoji: '👞',
    desc: 'Zadaje 12 obrażeń. Śmierdzi jak diabli.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 12 + state.getCardDamageBonus('kierpce'));
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },
  hej: {
    id: 'hej',
    name: 'Góralskie Hej!',
    type: 'skill',
    cost: 0,
    price: 60,
    isStarter: true,
    emoji: '🗣️',
    desc: 'Dobierz 2 karty.',
    exhaust: true,
    effect(state) {
      state._drawCards(2);
      return { playerAnim: 'anim-block' };
    },
  },

  // --- New cards ---

  sernik: {
    id: 'sernik',
    name: 'Sernik',
    type: 'skill',
    cost: 0,
    price: 50,
    emoji: '🍰',
    desc: 'Zyskujesz 1 Oscypek. Przepado.',
    exhaust: true,
    effect(state) {
      state.player.energy += 1;
      return { playerAnim: 'anim-block' };
    },
  },
  redyk: {
    id: 'redyk',
    name: 'Redyk',
    type: 'attack',
    cost: 1,
    price: 80,
    emoji: '🐑',
    desc: 'Atakuje 4 razy po 2 obrażenia (+Siła).',
    effect(state) {
      let totalDealt = 0;
      let totalBlocked = 0;
      const baseHit = 2 + state.getCardDamageBonus('redyk');
      for (let i = 0; i < 4; i++) {
        if (state.enemy.hp <= 0) break;
        const dmg = state._calcAttackDamage(state.player, baseHit);
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
    id: 'halny',
    name: 'Halny',
    type: 'skill',
    cost: 2,
    price: 90,
    emoji: '🌬️',
    desc: 'Odrzuć rękę, dobierz 3 karty.',
    effect(state) {
      state.discard.push(...state.hand);
      state.hand = [];
      state._drawCards(3);
      return { playerAnim: 'anim-block' };
    },
  },
  parzenica: {
    id: 'parzenica',
    name: 'Parzenica',
    type: 'skill',
    cost: 1,
    price: 85,
    emoji: '🧶',
    desc: 'Zyskujesz 7 Gardy. Na początku następnej tury +1 Oscypek.',
    effect(state) {
      state.gainPlayerBlockFromCard(7);
      state.player.status.energy_next_turn += 1;
      return { playerAnim: 'anim-block' };
    },
  },
  zadyma: {
    id: 'zadyma',
    name: 'Zadyma',
    type: 'attack',
    cost: 1,
    price: 75,
    emoji: '💥',
    desc: 'Zadaje 8 obrażeń. Jeśli wróg ma Gardę: 12 obrażeń.',
    effect(state) {
      const bonus = state.getCardDamageBonus('zadyma');
      const base = state.enemy.block > 0 ? 12 : 8;
      const dmg = state._calcAttackDamage(state.player, base + bonus);
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },
  zyntyca: {
    id: 'zyntyca',
    name: 'Żyntyca',
    type: 'skill',
    cost: 1,
    price: 65,
    emoji: '🥛',
    desc: 'Leczysz 4 Krzepy.',
    exhaust: true,
    effect(state) {
      state.healPlayer(4);
      return { playerAnim: 'anim-block' };
    },
  },
  janosik: {
    id: 'janosik',
    name: 'Janosikowe',
    type: 'attack',
    cost: 1,
    price: 95,
    emoji: '🗡️',
    desc: 'Zadaje 9 obrażeń. Jeśli Wróg pada: +30 Dutki.',
    exhaust: true,
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 9 + state.getCardDamageBonus('janosik'));
      const damage = state._applyDamageToEnemy(dmg);
      if (state.enemy.hp <= 0) state.dutki += 30;
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },
  echo: {
    id: 'echo',
    name: 'Echo w Tatrach',
    type: 'skill',
    cost: 2,
    price: 100,
    emoji: '🔊',
    desc: 'Twój następny cios zadaje podwójne obrażenia. Dobierz 1 kartę.',
    exhaust: true,
    effect(state) {
      state.player.status.next_double = true;
      state._drawCards(1);
      return { playerAnim: 'anim-block' };
    },
  },
  sandaly: {
    id: 'sandaly',
    name: 'Sandały',
    type: 'attack',
    cost: 1,
    price: 70,
    emoji: '👡',
    desc: 'Zadaje 5 obrażeń. Nakłada Słabość 2 na wroga.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 5 + state.getCardDamageBonus('sandaly'));
      const damage = state._applyDamageToEnemy(dmg);
      state.applyEnemyDebuff('weak', 2);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },
  giewont: {
    id: 'giewont',
    name: 'Gniew Giewontu',
    type: 'attack',
    cost: 3,
    price: 120,
    emoji: '⛰️',
    desc: 'Zadaje 30 obrażeń.',
    exhaust: true,
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 30 + state.getCardDamageBonus('giewont'));
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },
};

/** @type {string[]} */
export const startingDeck = [
  'ciupaga',
  'ciupaga',
  'ciupaga',
  'ciupaga',
  'gasior',
  'gasior',
  'gasior',
  'gasior',
  'kierpce',
  'hej',
];
