import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../src/state/GameState.js';
import { startingDeck } from '../src/data/cards.js';

const mockPlayer = { name: 'Jędrek', emoji: '🧔‍♂️', hp: 50, maxHp: 50, block: 0, energy: 3, maxEnergy: 3 };
const mockEnemy  = { name: 'Cepr',   emoji: '🧦',     hp: 40, maxHp: 40, block: 0, nextAttack: 8 };

/** @returns {GameState} */
function makeState() {
  const s = new GameState({ ...mockPlayer }, { ...mockEnemy });
  s.initGame([...startingDeck]);
  return s;
}

describe('GameState', () => {
  describe('initGame', () => {
    it('draws 5 cards to hand', () => {
      const s = makeState();
      expect(s.hand).toHaveLength(5);
    });

    it('remaining cards stay in deck', () => {
      const s = makeState();
      expect(s.deck.length + s.hand.length).toBe(startingDeck.length);
    });

    it('discard is empty at start', () => {
      const s = makeState();
      expect(s.discard).toHaveLength(0);
    });
  });

  describe('playCard', () => {
    it('returns success:false when Oscypki are insufficient', () => {
      const s = makeState();
      s.hand = ['kierpce']; // costs 2
      s.player.energy = 1;
      expect(s.playCard(0).success).toBe(false);
    });

    it('deducts Oscypki equal to card cost', () => {
      const s = makeState();
      s.hand = ['ciupaga']; // cost 1
      s.player.energy = 3;
      s.playCard(0);
      expect(s.player.energy).toBe(2);
    });

    it('moves played card to discard', () => {
      const s = makeState();
      s.hand = ['ciupaga'];
      s.playCard(0);
      expect(s.discard).toContain('ciupaga');
      expect(s.hand).not.toContain('ciupaga');
    });

    it('ciupaga deals 6 damage to Ceper', () => {
      const s = makeState();
      s.hand = ['ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(34);
    });

    it('attack damage is reduced by Ceper Garda', () => {
      const s = makeState();
      s.hand = ['ciupaga'];
      s.enemy.block = 4;
      s.enemy.hp = 40;
      s.playCard(0);
      expect(s.enemy.block).toBe(0);
      expect(s.enemy.hp).toBe(38);
    });

    it('attack is fully absorbed when Ceper Garda >= damage', () => {
      const s = makeState();
      s.hand = ['ciupaga'];
      s.enemy.block = 10;
      s.enemy.hp = 40;
      s.playCard(0);
      expect(s.enemy.block).toBe(4);
      expect(s.enemy.hp).toBe(40);
    });

    it('kierpce deals 12 damage', () => {
      const s = makeState();
      s.hand = ['kierpce'];
      s.player.energy = 3;
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(28);
    });

    it('gasior grants 5 Garda to Góral', () => {
      const s = makeState();
      s.hand = ['gasior'];
      s.player.block = 0;
      s.playCard(0);
      expect(s.player.block).toBe(5);
    });

    it('hej draws 2 cards', () => {
      const s = makeState();
      s.hand = ['hej'];
      s.deck = ['ciupaga', 'ciupaga', 'ciupaga'];
      s.playCard(0);
      // used 'hej' (removed), drew 2
      expect(s.hand).toHaveLength(2);
    });

    it('playCard returns correct attack effect', () => {
      const s = makeState();
      s.hand = ['ciupaga'];
      s.enemy.block = 2;
      const result = s.playCard(0);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.effect.type).toBe('attack');
      if (result.effect.type !== 'attack') return;
      expect(result.effect.damage.raw).toBe(6);
      expect(result.effect.damage.blocked).toBe(2);
      expect(result.effect.damage.dealt).toBe(4);
    });

    it('playCard returns correct skill effect for gasior', () => {
      const s = makeState();
      s.hand = ['gasior'];
      const result = s.playCard(0);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.effect.type).toBe('skill');
      if (result.effect.type !== 'skill') return;
      expect(result.effect.blockGained).toBe(5);
    });
  });

  describe('endTurn', () => {
    it('moves entire hand to discard', () => {
      const s = makeState();
      s.hand = ['ciupaga', 'gasior'];
      s.endTurn();
      expect(s.hand).toHaveLength(0);
      expect(s.discard).toContain('ciupaga');
      expect(s.discard).toContain('gasior');
    });

    it('enemy attack deals damage to Góral', () => {
      const s = makeState();
      s.player.hp = 50;
      s.player.block = 0;
      s.enemy.nextAttack = 8;
      s.endTurn();
      expect(s.player.hp).toBe(42);
    });

    it('enemy attack is reduced by Góral Garda', () => {
      const s = makeState();
      s.player.hp = 50;
      s.player.block = 5;
      s.enemy.nextAttack = 8;
      s.endTurn();
      expect(s.player.block).toBe(0);
      expect(s.player.hp).toBe(47);
    });

    it('enemy attack is fully blocked', () => {
      const s = makeState();
      s.player.hp = 50;
      s.player.block = 10;
      s.enemy.nextAttack = 8;
      s.endTurn();
      expect(s.player.block).toBe(2);
      expect(s.player.hp).toBe(50);
    });

    it('returns correct damage breakdown', () => {
      const s = makeState();
      s.player.block = 3;
      s.enemy.nextAttack = 8;
      const result = s.endTurn();
      expect(result.enemyAttack.raw).toBe(8);
      expect(result.enemyAttack.blocked).toBe(3);
      expect(result.enemyAttack.dealt).toBe(5);
    });

    it('resets Ceper Garda after enemy attack', () => {
      const s = makeState();
      s.enemy.block = 5;
      s.endTurn();
      expect(s.enemy.block).toBe(0);
    });

    it('rolls a new nextAttack between 5 and 10', () => {
      const s = makeState();
      s.endTurn();
      expect(s.enemy.nextAttack).toBeGreaterThanOrEqual(5);
      expect(s.enemy.nextAttack).toBeLessThanOrEqual(10);
    });
  });

  describe('startTurn', () => {
    it('restores Oscypki to maxEnergy', () => {
      const s = makeState();
      s.player.energy = 0;
      s.startTurn();
      expect(s.player.energy).toBe(s.player.maxEnergy);
    });

    it('resets Góral Garda to 0', () => {
      const s = makeState();
      s.player.block = 7;
      s.startTurn();
      expect(s.player.block).toBe(0);
    });

    it('draws 5 cards from deck', () => {
      const s = makeState();
      s.hand = [];
      s.deck = [...startingDeck];
      s.startTurn();
      expect(s.hand).toHaveLength(5);
    });
  });

  describe('checkWinCondition', () => {
    it('returns player_win when Ceper Krzepa reaches 0', () => {
      const s = makeState();
      s.enemy.hp = 0;
      expect(s.checkWinCondition()).toBe('player_win');
    });

    it('returns enemy_win when Góral Krzepa reaches 0', () => {
      const s = makeState();
      s.player.hp = 0;
      expect(s.checkWinCondition()).toBe('enemy_win');
    });

    it('returns null when both are still alive', () => {
      const s = makeState();
      expect(s.checkWinCondition()).toBeNull();
    });
  });

  describe('deck recycling', () => {
    it('reshuffles discard into deck when deck is empty', () => {
      const s = makeState();
      s.deck = [];
      s.hand = [];
      s.discard = ['ciupaga', 'gasior', 'ciupaga', 'gasior', 'ciupaga'];
      s._drawCards(3);
      expect(s.hand).toHaveLength(3);
      expect(s.discard).toHaveLength(0);
      expect(s.deck).toHaveLength(2);
    });
  });
});
