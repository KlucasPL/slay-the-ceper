/**
 * @typedef {{ strength: number, weak: number, fragile: number, vulnerable: number, next_double: boolean, energy_next_turn: number }} StatusDef
 * @typedef {{ playerAnim?: string, enemyAnim?: string, damage?: { raw: number, blocked: number, dealt: number } }} CardEffectResult
 * @typedef {'common' | 'uncommon' | 'rare'} RarityDef
 * @typedef {{ id: string, name: string, type: 'attack' | 'skill' | 'status', cost: number, price: number, rarity: RarityDef, emoji: string, desc: string, isStarter?: boolean, exhaust?: boolean, unplayable?: boolean, effect: (state: import('../state/GameState.js').GameState) => CardEffectResult }} CardDef
 */

/** @type {Record<string, CardDef>} */
export const cardLibrary = {
  ciupaga: {
    id: 'ciupaga',
    name: 'Cios ciupagą',
    type: 'attack',
    rarity: 'common',
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
    rarity: 'common',
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
    rarity: 'common',
    cost: 2,
    price: 70,
    isStarter: true,
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
    rarity: 'uncommon',
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
    rarity: 'common',
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
    rarity: 'uncommon',
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
    rarity: 'uncommon',
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
  paragon_za_gofra: {
    id: 'paragon_za_gofra',
    name: 'Paragon za Gofra',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    price: 55,
    emoji: '🧾',
    desc: 'Dodaj 15 do Rachunku wroga.',
    effect(state) {
      state.addEnemyRachunek(15);
      return { playerAnim: 'anim-block' };
    },
  },
  podatek_klimatyczny: {
    id: 'podatek_klimatyczny',
    name: 'Podatek Klimatyczny',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    price: 115,
    emoji: '🌍',
    desc: 'Podwój obecny Rachunek wroga. PRZEPADO.',
    exhaust: true,
    effect(state) {
      state.enemy.rachunek *= 2;
      state._checkEnemyBankruptcy();
      return { playerAnim: 'anim-block' };
    },
  },
  wypozyczone_gogle: {
    id: 'wypozyczone_gogle',
    name: 'Wypożyczone Gogle',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    price: 85,
    emoji: '🥽',
    desc: 'Zyskaj status Lans. Otrzymujesz obrażenia w Dudkach zamiast HP.',
    exhaust: true,
    effect(state) {
      state.player.hasLans = true;
      return { playerAnim: 'anim-block' };
    },
  },
  zdjecie_z_misiem: {
    id: 'zdjecie_z_misiem',
    name: 'Zdjęcie z Misiem',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    price: 80,
    emoji: '📸',
    desc: 'Jeśli masz aktywny Lans, zyskaj 20 Dudków. Inaczej nic się nie dzieje.',
    effect(state) {
      if (state.player.hasLans) {
        state.dutki += 20;
      }
      return { playerAnim: 'anim-block' };
    },
  },
  parzenica: {
    id: 'parzenica',
    name: 'Parzenica',
    type: 'skill',
    rarity: 'uncommon',
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
    rarity: 'common',
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
    rarity: 'common',
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
    rarity: 'rare',
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
    rarity: 'uncommon',
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
    rarity: 'uncommon',
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
    rarity: 'rare',
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

  ulotka: {
    id: 'ulotka',
    name: 'Ulotka',
    type: 'status',
    rarity: 'common',
    cost: 0,
    price: 1,
    isStarter: true,
    exhaust: true,
    unplayable: true,
    emoji: '📄',
    desc: 'Zapycha rękę. PRZEPADO.',
    effect(state) {
      void state;
      return { playerAnim: 'anim-block' };
    },
  },

  spam_tagami: {
    id: 'spam_tagami',
    name: 'Spam Tagami',
    type: 'status',
    rarity: 'common',
    cost: 1,
    price: 1,
    isStarter: true,
    exhaust: true,
    unplayable: true,
    emoji: '🏷️',
    desc: 'Niegrywalna. Póki na ręce, tracisz 2 Dutki co turę.',
    effect(state) {
      void state;
      return {};
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

/**
 * Adds or updates a card in the runtime card library.
 * @param {CardDef} card
 * @returns {CardDef}
 */
export function addCardToLibrary(card) {
  cardLibrary[card.id] = card;
  return cardLibrary[card.id];
}
