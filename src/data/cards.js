/**
 * @typedef {{ strength: number, weak: number, fragile: number, vulnerable: number, next_double: boolean, energy_next_turn: number, lans: number, duma_podhala: number, furia_turysty: number }} StatusDef
 * @typedef {{ playerAnim?: string, enemyAnim?: string, damage?: { raw: number, blocked: number, dealt: number } }} CardEffectResult
 * @typedef {'common' | 'uncommon' | 'rare'} RarityDef
 * @typedef {{ id: string, name: string, type: 'attack' | 'skill' | 'status' | 'power', cost: number, price: number, rarity: RarityDef, emoji: string, desc: string, tags?: string[], isStarter?: boolean, eventOnly?: boolean, tutorialOnly?: boolean, exhaust?: boolean, unplayable?: boolean, effect: (state: import('../state/GameState.js').GameState) => CardEffectResult }} CardDef
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
  goralska_obrona: {
    id: 'goralska_obrona',
    name: 'Góralska Obrona',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    price: 35,
    tutorialOnly: true,
    emoji: '🛡️',
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
    desc: 'Zadaje 12 obrażeń i nakłada 1 Słabości. Śmierdzi jak diabli.',
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 12 + state.getCardDamageBonus('kierpce'));
      const damage = state._applyDamageToEnemy(dmg);
      state.applyEnemyDebuff('weak', 1);
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
    desc: 'Zyskujesz 1 Oscypek.',
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
    desc: 'Dodaj 10 do Rachunku wroga.',
    exhaust: true,
    effect(state) {
      state.addEnemyRachunek(10);
      return { playerAnim: 'anim-block' };
    },
  },
  podatek_klimatyczny: {
    id: 'podatek_klimatyczny',
    name: 'Podatek Klimatyczny',
    type: 'skill',
    rarity: 'rare',
    cost: 3,
    price: 115,
    emoji: '🌍',
    desc: 'Podwój obecny Rachunek wroga.',
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
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    price: 85,
    emoji: '🥽',
    desc: 'Zyskaj status Lans (obrażenia najpierw w dutki, potem w Krzepę).',
    exhaust: true,
    effect(state) {
      const wasActive = state.player.status.lans > 0;
      state._setLansActive(true);
      if (!wasActive) {
        state.lansActivatedEvent = true;
      }
      return { playerAnim: 'anim-block' };
    },
  },
  zdjecie_z_misiem: {
    id: 'zdjecie_z_misiem',
    name: 'Zdjęcie z Misiem',
    type: 'skill',
    rarity: 'uncommon',
    tags: ['lans'],
    cost: 1,
    price: 80,
    emoji: '📸',
    desc: 'Jeśli masz aktywny Lans, zyskaj 20 dutków. Inaczej nic się nie dzieje.',
    effect(state) {
      if (state.player.status.lans > 0) {
        state.addDutki(20);
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
    desc: 'Zadaje 9 obrażeń. Jeśli wróg pada: +30 dutków.',
    exhaust: true,
    effect(state) {
      const dmg = state._calcAttackDamage(state.player, 9 + state.getCardDamageBonus('janosik'));
      const damage = state._applyDamageToEnemy(dmg);
      if (state.enemy.hp <= 0) state.addDutki(30);
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
  mocny_organizm: {
    id: 'mocny_organizm',
    name: 'Mocny Organizm',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    price: 130,
    emoji: '💪',
    desc: 'Zadaje 10 obrażeń. Jeśli wróg pada: na stałe +2 do maksymalnej Krzepy.',
    exhaust: true,
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        10 + state.getCardDamageBonus('mocny_organizm')
      );
      const damage = state._applyDamageToEnemy(dmg);
      if (state.enemy.hp <= 0) {
        state.gainMaxHp(2);
      }
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  pchniecie_ciupaga: {
    id: 'pchniecie_ciupaga',
    name: 'Pchnięcie Ciupagą',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    price: 70,
    emoji: '🪓',
    desc: 'Zadaje 8 obrażeń. Jeśli wróg nie ma Gardy, zadaje 12 obrażeń.',
    effect(state) {
      const base = state.enemy.block > 0 ? 8 : 12;
      const dmg = state._calcAttackDamage(
        state.player,
        base + state.getCardDamageBonus('pchniecie_ciupaga')
      );
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },
  barchanowe_gacie: {
    id: 'barchanowe_gacie',
    name: 'Barchanowe Gacie',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    price: 65,
    emoji: '🩳',
    desc: 'Zyskujesz 7 Gardy. Jeśli masz Lans, zyskujesz 10 Gardy.',
    effect(state) {
      state.gainPlayerBlockFromCard(state.player.status.lans > 0 ? 10 : 7);
      return { playerAnim: 'anim-block' };
    },
  },
  szukanie_okazji: {
    id: 'szukanie_okazji',
    name: 'Szukanie Okazji',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    price: 95,
    emoji: '🔎',
    desc: 'Odrzuć 1 kartę, dobierz 2 karty.',
    effect(state) {
      if (state.hand.length > 0) {
        const idx = Math.floor(Math.random() * state.hand.length);
        state.discard.push(state.hand.splice(idx, 1)[0]);
      }
      state._drawCards(2);
      return { playerAnim: 'anim-block' };
    },
  },
  lodolamacz: {
    id: 'lodolamacz',
    name: 'Lodołamacz',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    price: 100,
    emoji: '🧊',
    desc: 'Zadaje 8 obrażeń. Dodatkowo zadaje obrażenia równe połowie Twojej aktualnej Gardy.',
    exhaust: true,
    effect(state) {
      const bonus = Math.floor(state.player.block / 2);
      const dmg = state._calcAttackDamage(
        state.player,
        8 + bonus + state.getCardDamageBonus('lodolamacz')
      );
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },
  duma_podhala: {
    id: 'duma_podhala',
    name: 'Duma Podhala',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    price: 140,
    emoji: '🏔️',
    desc: 'Do końca walki: za każde 10 Gardy straconej od ataku wroga zadajesz mu 5 obrażeń.',
    exhaust: true,
    effect(state) {
      state.player.status.duma_podhala = 1;
      return { playerAnim: 'anim-block' };
    },
  },
  zemsta_gorala: {
    id: 'zemsta_gorala',
    name: 'Zemsta Górala',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    price: 130,
    emoji: '⚔️',
    desc: 'Zadaje 15 obrażeń. Jeśli to ostatnia karta na ręce, zadaje podwójne obrażenia.',
    effect(state) {
      const isLastCardInHand = state.hand.length === 0;
      const base = isLastCardInHand ? 30 : 15;
      const dmg = state._calcAttackDamage(
        state.player,
        base + state.getCardDamageBonus('zemsta_gorala')
      );
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  prestiz_na_kredyt: {
    id: 'prestiz_na_kredyt',
    name: 'Prestiż na Kredyt',
    type: 'skill',
    rarity: 'rare',
    eventOnly: true,
    cost: 1,
    price: 135,
    emoji: '⛓️',
    desc: 'Zyskujesz 6 Gardy. +2 Gardy za każde 20 dutków (max +14).',
    effect(state) {
      state.gainPlayerBlockFromCard(state.getPrestizNaKredytBlock());
      return { playerAnim: 'anim-block' };
    },
  },

  furia_turysty: {
    id: 'furia_turysty',
    name: 'Furia Turysty',
    type: 'skill',
    rarity: 'uncommon',
    eventOnly: true,
    cost: 0,
    price: 90,
    emoji: '😡',
    desc: 'Do końca tury: +50% zadawanych obrażeń. Tracisz 3 Krzepy.',
    exhaust: true,
    effect(state) {
      state.player.status.furia_turysty = 1;
      state.player.hp = Math.max(1, state.player.hp - 3);
      return { playerAnim: 'anim-block' };
    },
  },

  spostrzegawczosc: {
    id: 'spostrzegawczosc',
    name: 'Spostrzegawczość',
    type: 'skill',
    rarity: 'rare',
    eventOnly: true,
    cost: 0,
    price: 135,
    emoji: '👁️',
    desc: 'Dobierz 1. Jeśli to Atak, następny Atak w tej turze zadaje +2 obrażenia.',
    exhaust: true,
    effect(state) {
      const drawn = state._drawCards(1);
      const drawnCardId = drawn[0] ?? null;
      if (drawnCardId && cardLibrary[drawnCardId]?.type === 'attack') {
        state.queueNextAttackCardBonus(2);
      }
      return { playerAnim: 'anim-block' };
    },
  },

  pocieszenie: {
    id: 'pocieszenie',
    name: 'Pocieszenie',
    type: 'status',
    rarity: 'common',
    eventOnly: true,
    cost: 0,
    price: 1,
    emoji: '🩹',
    desc: 'Dobierz 1.',
    exhaust: true,
    effect(state) {
      state._drawCards(1);
      return { playerAnim: 'anim-block' };
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
    desc: 'Zapycha rękę.',
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
    desc: 'Niegrywalna. Póki na ręce, tracisz 2 dutki co turę.',
    effect(state) {
      void state;
      return {};
    },
  },

  wydruk_z_kasy: {
    id: 'wydruk_z_kasy',
    name: 'Wydruk z Kasy',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    price: 50,
    emoji: '💸',
    desc: 'Zadaje 6 obrażeń. Dodaje 4 do Rachunku wroga.',
    tags: ['rachunek'],
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        6 + state.getCardDamageBonus('wydruk_z_kasy')
      );
      const damage = state._applyDamageToEnemy(dmg);
      state.addEnemyRachunek(4);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  nadplacony_bilet: {
    id: 'nadplacony_bilet',
    name: 'Nadplacony Bilet',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    price: 55,
    emoji: '📋',
    desc: 'Zadaje 7 obrażeń. +1 obrażenia za każde 5 Rachunku na wrogu (maks. +5).',
    tags: ['rachunek'],
    effect(state) {
      const bonus = Math.min(5, Math.floor(state.enemy.rachunek / 5));
      const baseDmg = 7 + bonus + state.getCardDamageBonus('nadplacony_bilet');
      const dmg = state._calcAttackDamage(state.player, baseDmg);
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  eksmisja_z_kwatery: {
    id: 'eksmisja_z_kwatery',
    name: 'Eksmisja z Kwatery',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    price: 100,
    emoji: '🚪',
    desc: 'Zadaje 12 obrażeń. Jeśli wróg ma Słabość, dodaje 10 do Rachunku.',
    tags: ['rachunek'],
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        12 + state.getCardDamageBonus('eksmisja_z_kwatery')
      );
      const damage = state._applyDamageToEnemy(dmg);
      if (state.enemy.status.weak > 0) {
        state.addEnemyRachunek(10);
      }
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  rachunek_za_oddychanie: {
    id: 'rachunek_za_oddychanie',
    name: 'Rachunek za Oddychanie',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    price: 110,
    emoji: '💨',
    desc: 'Zadaje 8 obrażeń. Zwiększa aktualny Rachunek wroga o 25% (zaokrąglając w górę).',
    tags: ['rachunek'],
    exhaust: true,
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        8 + state.getCardDamageBonus('rachunek_za_oddychanie')
      );
      const damage = state._applyDamageToEnemy(dmg);
      const increase = Math.ceil(state.enemy.rachunek * 0.25);
      state.addEnemyRachunek(increase);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  skrupulatne_wyliczenie: {
    id: 'skrupulatne_wyliczenie',
    name: 'Skrupulatne Wyliczenie',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    price: 60,
    emoji: '📊',
    desc: 'Zadaje obrażenia równe połowie Twojej aktualnej Gardy. Jeśli Rachunek > 15, dodaje +5 obrażeń.',
    tags: ['rachunek'],
    effect(state) {
      const baseFromBlock = Math.floor(state.player.block / 2);
      const bonus = state.enemy.rachunek > 15 ? 5 : 0;
      const baseDmg = baseFromBlock + bonus + state.getCardDamageBonus('skrupulatne_wyliczenie');
      const dmg = state._calcAttackDamage(state.player, baseDmg);
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  tatrzanski_szpan: {
    id: 'tatrzanski_szpan',
    name: 'Tatrzański Szpan',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    price: 95,
    emoji: '👤',
    desc: 'LANS: Zadaje 16 obrażeń.',
    tags: ['lans'],
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        16 + state.getCardDamageBonus('tatrzanski_szpan')
      );
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  paradny_zwyrt: {
    id: 'paradny_zwyrt',
    name: 'Paradny Zwyrt',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    price: 75,
    emoji: '🎩',
    desc: 'LANS: Zadaje 12 obrażeń, dobiera 1 kartę.',
    tags: ['lans'],
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        12 + state.getCardDamageBonus('paradny_zwyrt')
      );
      const damage = state._applyDamageToEnemy(dmg);
      state._drawCards(1);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  cios_z_telemarkiem: {
    id: 'cios_z_telemarkiem',
    name: 'Cios z Telemarkiem',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    price: 60,
    emoji: '☎️',
    desc: 'LANS: Zadaje 9 obrażeń.',
    tags: ['lans'],
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        9 + state.getCardDamageBonus('cios_z_telemarkiem')
      );
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  mlynek_ciupaga: {
    id: 'mlynek_ciupaga',
    name: 'Młynek Ciupagą',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    price: 115,
    emoji: '🌀',
    desc: 'LANS: Atakuje 3x4 obrażenia i nakłada 2 Słabości.',
    tags: ['lans'],
    effect(state) {
      let totalDealt = 0;
      let totalBlocked = 0;
      const baseHit = 4 + state.getCardDamageBonus('mlynek_ciupaga');
      for (let i = 0; i < 3; i++) {
        if (state.enemy.hp <= 0) break;
        const dmg = state._calcAttackDamage(state.player, baseHit);
        const damage = state._applyDamageToEnemy(dmg);
        totalDealt += damage.dealt;
        totalBlocked += damage.blocked;
      }
      state.applyEnemyDebuff('weak', 2);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: totalDealt > 0 ? 'anim-damage' : 'anim-block',
        damage: { raw: totalDealt + totalBlocked, blocked: totalBlocked, dealt: totalDealt },
      };
    },
  },

  wepchniecie_w_kolejke: {
    id: 'wepchniecie_w_kolejke',
    name: 'Wepchniecie w Kolejkę',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    price: 65,
    emoji: '🤜',
    desc: 'LANS: Nakłada 1 Podatność i dobiera 1 kartę.',
    tags: ['lans'],
    effect(state) {
      state.applyEnemyDebuff('vulnerable', 1);
      state._drawCards(1);
      return { playerAnim: 'anim-attack-p', enemyAnim: 'anim-block' };
    },
  },

  rozped_z_rowni: {
    id: 'rozped_z_rowni',
    name: 'Rozpęd z Równi',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    price: 75,
    emoji: '🛷',
    desc: 'Zadaje 3x3 obrażenia. Jeśli wróg ma Słabość, zadaje 4x3.',
    effect(state) {
      let totalDealt = 0;
      let totalBlocked = 0;
      const baseHit =
        (state.enemy.status.weak > 0 ? 4 : 3) + state.getCardDamageBonus('rozped_z_rowni');
      for (let i = 0; i < 3; i++) {
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

  z_rozmachu: {
    id: 'z_rozmachu',
    name: 'Z Rozmachu',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    price: 65,
    emoji: '🪵',
    desc: 'Zadaje 7 obrażeń. Jeśli masz status następnego podwójnego ciosu, dobierz 1 kartę.',
    effect(state) {
      const hadNextDouble = state.player.status.next_double;
      const dmg = state._calcAttackDamage(state.player, 7 + state.getCardDamageBonus('z_rozmachu'));
      const damage = state._applyDamageToEnemy(dmg);
      if (hadNextDouble) {
        state._drawCards(1);
      }
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  beczenie_redyku: {
    id: 'beczenie_redyku',
    name: 'Beczenie Redyku',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    price: 70,
    emoji: '🐏',
    desc: 'Zadaje 5 obrażeń. Zyskuje +4 obrażenia za każdy punkt Twojej Siły.',
    effect(state) {
      const strengthBonus = Math.max(0, state.player.status.strength) * 4;
      const dmg = state._calcAttackDamage(
        state.player,
        5 + strengthBonus + state.getCardDamageBonus('beczenie_redyku')
      );
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  krzesany: {
    id: 'krzesany',
    name: 'Krzesany',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    price: 90,
    emoji: '💃',
    desc: 'Atakuje 2x6 obrażeń. Jeśli drugi cios przebije pancerz, zyskujesz 1 Oscypek.',
    effect(state) {
      let totalDealt = 0;
      let totalBlocked = 0;
      const baseHit = 6 + state.getCardDamageBonus('krzesany');
      for (let i = 0; i < 2; i++) {
        if (state.enemy.hp <= 0) break;
        const dmg = state._calcAttackDamage(state.player, baseHit);
        const damage = state._applyDamageToEnemy(dmg);
        totalDealt += damage.dealt;
        totalBlocked += damage.blocked;
        if (i === 1 && damage.dealt > 0) {
          state.player.energy += 1;
        }
      }
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: totalDealt > 0 ? 'anim-damage' : 'anim-block',
        damage: { raw: totalDealt + totalBlocked, blocked: totalBlocked, dealt: totalDealt },
      };
    },
  },

  wymuszony_napiwek: {
    id: 'wymuszony_napiwek',
    name: 'Wymuszony Napiwek',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    price: 80,
    emoji: '💰',
    desc: 'Zadaje 9 obrażeń. Jeśli wróg padnie od tej karty, zyskujesz 15 dutków.',
    exhaust: true,
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        9 + state.getCardDamageBonus('wymuszony_napiwek')
      );
      const damage = state._applyDamageToEnemy(dmg);
      if (state.enemy.hp <= 0) {
        state.addDutki(15);
      }
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  paragon_grozy: {
    id: 'paragon_grozy',
    name: 'Paragon Grozy',
    type: 'attack',
    rarity: 'rare',
    cost: 3,
    price: 120,
    emoji: '🧨',
    desc: 'Zadaje 25 obrażeń. Jeśli wróg ma co najmniej 25 Rachunku, kosztuje 1 Oscypek.',
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        25 + state.getCardDamageBonus('paragon_grozy')
      );
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  pogodzenie_sporow: {
    id: 'pogodzenie_sporow',
    name: 'Pogodzenie Sporów',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    price: 55,
    emoji: '🤝',
    desc: 'Dodaj 10 do Rachunku i dobierz 1 kartę.',
    effect(state) {
      state.addEnemyRachunek(10);
      state._drawCards(1);
      return { playerAnim: 'anim-block' };
    },
  },

  przymusowy_napiwek: {
    id: 'przymusowy_napiwek',
    name: 'Przymusowy Napiwek',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    price: 70,
    emoji: '🫴',
    desc: 'Dodaj 5 do Rachunku. Jeśli wróg ma Podatność, dodaj jeszcze 5.',
    effect(state) {
      state.addEnemyRachunek(5);
      if (state.enemy.status.vulnerable > 0) {
        state.addEnemyRachunek(5);
      }
      return { playerAnim: 'anim-block' };
    },
  },

  list_od_maryny: {
    id: 'list_od_maryny',
    name: 'List od Maryny',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    price: 75,
    emoji: '💌',
    desc: 'Dobierz 1 kartę. Jeśli wróg ma Słabość lub Kruchość, dobierz jeszcze 1.',
    effect(state) {
      state._drawCards(1);
      if (state.enemy.status.weak > 0 || state.enemy.status.fragile > 0) {
        state._drawCards(1);
      }
      return { playerAnim: 'anim-block' };
    },
  },

  zapas_oscypkow: {
    id: 'zapas_oscypkow',
    name: 'Zapas Oscypków',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    price: 55,
    emoji: '🧀',
    desc: 'Zyskaj 1 Oscypek na następną turę i 4 Gardy.',
    effect(state) {
      state.player.status.energy_next_turn += 1;
      state.gainPlayerBlockFromCard(4);
      return { playerAnim: 'anim-block' };
    },
  },

  wdech_halnego: {
    id: 'wdech_halnego',
    name: 'Wdech Halnego',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    price: 60,
    emoji: '🌪️',
    desc: 'Odrzuć 1 kartę z ręki i dobierz 2 karty.',
    effect(state) {
      if (state.hand.length > 0) {
        const idx = Math.floor(Math.random() * state.hand.length);
        state.discard.push(state.hand.splice(idx, 1)[0]);
      }
      state._drawCards(2);
      return { playerAnim: 'anim-block' };
    },
  },

  dutki_na_stole: {
    id: 'dutki_na_stole',
    name: 'Dutki na Stole',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    price: 65,
    emoji: '🪙',
    desc: 'Zyskujesz 10 dutków i dodajesz 4 do Rachunku.',
    exhaust: true,
    effect(state) {
      state.addDutki(10);
      state.addEnemyRachunek(4);
      return { playerAnim: 'anim-block' };
    },
  },

  pan_na_wlosciach: {
    id: 'pan_na_wlosciach',
    name: 'Pan na Włościach',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    price: 85,
    emoji: '🏰',
    desc: 'Za każdym razem, gdy aktywujesz Lans, zyskujesz 3 Gardy.',
    exhaust: true,
    effect(state) {
      state.player.pan_na_wlosciach = true;
      return { playerAnim: 'anim-block' };
    },
  },

  zimna_krew: {
    id: 'zimna_krew',
    name: 'Zimna Krew',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    price: 85,
    emoji: '🥶',
    desc: 'Ilekroć nakładasz Słabość, nakładasz dodatkowo +1 Słabości.',
    exhaust: true,
    effect(state) {
      state.player.zimna_krew = true;
      return { playerAnim: 'anim-block' };
    },
  },

  baciarka_ciesy: {
    id: 'baciarka_ciesy',
    name: 'Baciarka Ciesy',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    price: 90,
    emoji: '🧗',
    desc: 'Zyskujesz +2 Siły na całą walkę.',
    exhaust: true,
    effect(state) {
      state.player.status.strength += 2;
      return { playerAnim: 'anim-block' };
    },
  },

  czas_na_fajke: {
    id: 'czas_na_fajke',
    name: 'Czas na Fajkę',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    price: 120,
    emoji: '🚬',
    desc: 'Na koniec Twojej tury, jeśli masz ponad 10 Gardy, leczysz 2 Krzepy.',
    exhaust: true,
    effect(state) {
      state.player.czas_na_fajke = true;
      return { playerAnim: 'anim-block' };
    },
  },

  goralska_goscinnosc: {
    id: 'goralska_goscinnosc',
    name: 'Góralska Gościnność',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    price: 120,
    emoji: '🏡',
    desc: 'Za każdą zagraną kartę Ataku dodajesz 2 do Rachunku wroga.',
    exhaust: true,
    effect(state) {
      state.player.goralska_goscinnosc = true;
      return { playerAnim: 'anim-block' };
    },
  },

  koncesja_na_oscypki: {
    id: 'koncesja_na_oscypki',
    name: 'Koncesja na Oscypki',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    price: 125,
    emoji: '🧾',
    desc: 'Na początku tury, jeśli wróg ma co najmniej 25 Rachunku, zyskujesz 1 Oscypek i dobierasz 1 kartę.',
    exhaust: true,
    effect(state) {
      state.player.koncesja_na_oscypki = true;
      return { playerAnim: 'anim-block' };
    },
  },

  ciupaga_we_mgle: {
    id: 'ciupaga_we_mgle',
    name: 'Ciupaga we Mgle',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    price: 65,
    emoji: '🌫️',
    desc: 'Zadaje 6 obrażeń i nakłada 1 Słabość. Jeśli pogoda to mgła, nakłada też 1 Kruchość.',
    tags: ['weather'],
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        6 + state.getCardDamageBonus('ciupaga_we_mgle')
      );
      const damage = state._applyDamageToEnemy(dmg);
      state.applyEnemyDebuff('weak', 1);
      if (state.currentWeather === 'fog') {
        state.applyEnemyDebuff('fragile', 1);
      }
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  przymusowe_morsowanie: {
    id: 'przymusowe_morsowanie',
    name: 'Przymusowe Morsowanie',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    price: 60,
    emoji: '❄️',
    desc: 'Zadaje 7 obrażeń. Jeśli pogoda to mróz, zadaje dodatkowo 7 obrażeń i dobiera 1 kartę.',
    tags: ['weather'],
    effect(state) {
      const baseDmg = 7 + state.getCardDamageBonus('przymusowe_morsowanie');
      let dmg = state._calcAttackDamage(state.player, baseDmg);
      let damage = state._applyDamageToEnemy(dmg);

      if (state.currentWeather === 'frozen') {
        if (state.enemy.hp > 0) {
          const dmg2 = state._calcAttackDamage(state.player, baseDmg);
          const damage2 = state._applyDamageToEnemy(dmg2);
          damage.dealt += damage2.dealt;
          damage.blocked += damage2.blocked;
          damage.raw += damage2.raw;
        }
        state._drawCards(1);
      }
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  lawina_z_morskiego_oka: {
    id: 'lawina_z_morskiego_oka',
    name: 'Lawina z Morskiego Oka',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    price: 95,
    emoji: '🏔️',
    desc: 'Zadaje 16 obrażeń. Jeśli pogoda to mróz, karta kosztuje 1 Oscypek.',
    tags: ['weather'],
    effect(state) {
      const dmg = state._calcAttackDamage(
        state.player,
        16 + state.getCardDamageBonus('lawina_z_morskiego_oka')
      );
      const damage = state._applyDamageToEnemy(dmg);
      return {
        playerAnim: 'anim-attack-p',
        enemyAnim: damage.dealt > 0 ? 'anim-damage' : 'anim-block',
        damage,
      };
    },
  },

  punkt_widokowy: {
    id: 'punkt_widokowy',
    name: 'Punkt Widokowy',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    price: 50,
    emoji: '👁️',
    desc: 'Dobierz 1 kartę. Jeśli pogoda to słonecznie, dobierz jeszcze 1 kartę.',
    tags: ['weather'],
    effect(state) {
      state._drawCards(1);
      if (state.currentWeather === 'clear') {
        state._drawCards(1);
      }
      return { playerAnim: 'anim-block' };
    },
  },

  zgubieni_we_mgle: {
    id: 'zgubieni_we_mgle',
    name: 'Zgubieni we Mgle',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    price: 70,
    emoji: '🌫️',
    desc: 'Jeśli pogoda to mgła, nakłada na wroga 2 Słabości. W innym wypadku zyskujesz 8 Gardy.',
    tags: ['weather'],
    effect(state) {
      if (state.currentWeather === 'fog') {
        state.applyEnemyDebuff('weak', 2);
      } else {
        state.gainPlayerBlockFromCard(8);
      }
      return { playerAnim: 'anim-block' };
    },
  },

  znajomosc_szlaku: {
    id: 'znajomosc_szlaku',
    name: 'Znajomość Szlaku',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    price: 80,
    emoji: '🗺️',
    desc: 'W pogodzie mgły zyskujesz 5 Gardy na starcie swojej tury.',
    tags: ['weather'],
    exhaust: true,
    effect(state) {
      state.player.weather_fog_garda = true;
      return { playerAnim: 'anim-block' };
    },
  },

  kapiel_w_bialce: {
    id: 'kapiel_w_bialce',
    name: 'Kąpiel w Białce',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    price: 80,
    emoji: '🧊',
    desc: 'W pogodzie mrozu nakładasz na wroga 1 Podatność na starcie swojej tury.',
    tags: ['weather'],
    exhaust: true,
    effect(state) {
      state.player.weather_frozen_vulnerable = true;
      return { playerAnim: 'anim-block' };
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
