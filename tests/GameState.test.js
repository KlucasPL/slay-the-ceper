import { describe, it, expect } from 'vitest';
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

/** Returns a clean state with empty hand/deck/discard and given Oscypki */
function freshState(energy = 3) {
  const s = new GameState({ ...mockPlayer }, { ...mockEnemy });
  s.player.energy = energy;
  s.hand = [];
  s.deck = [];
  s.discard = [];
  return s;
}

describe('GameState', () => {
  // ── initGame ──────────────────────────────────────────────────────────────
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

  // ── playCard — basics ─────────────────────────────────────────────────────
  describe('playCard basics', () => {
    it('returns success:false when Oscypki are insufficient', () => {
      const s = freshState(1);
      s.hand = ['kierpce']; // costs 2
      expect(s.playCard(0).success).toBe(false);
    });
    it('deducts Oscypki equal to card cost', () => {
      const s = freshState(3);
      s.hand = ['ciupaga'];
      s.playCard(0);
      expect(s.player.energy).toBe(2);
    });
    it('moves played card to discard', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.playCard(0);
      expect(s.discard).toContain('ciupaga');
      expect(s.hand).not.toContain('ciupaga');
    });
    it('returns effect with playerAnim and damage', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.block = 2;
      const result = s.playCard(0);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.effect.playerAnim).toBe('anim-attack-p');
      expect(result.effect.damage?.raw).toBe(6);
      expect(result.effect.damage?.blocked).toBe(2);
      expect(result.effect.damage?.dealt).toBe(4);
    });
  });

  // ── Original cards ────────────────────────────────────────────────────────
  describe('ciupaga', () => {
    it('deals 6 damage to Ceper', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(34);
    });
    it('damage is reduced by Ceper Garda', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.block = 4; s.enemy.hp = 40;
      s.playCard(0);
      expect(s.enemy.block).toBe(0);
      expect(s.enemy.hp).toBe(38);
    });
    it('fully absorbed when Ceper Garda >= damage', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.block = 10; s.enemy.hp = 40;
      s.playCard(0);
      expect(s.enemy.block).toBe(4);
      expect(s.enemy.hp).toBe(40);
    });
  });

  describe('kierpce', () => {
    it('deals 12 damage', () => {
      const s = freshState(3);
      s.hand = ['kierpce'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(28);
    });
  });

  describe('gasior', () => {
    it('grants 5 Garda to Góral', () => {
      const s = freshState();
      s.hand = ['gasior'];
      s.player.block = 0;
      s.playCard(0);
      expect(s.player.block).toBe(5);
    });
    it('returns playerAnim but no enemyAnim', () => {
      const s = freshState();
      s.hand = ['gasior'];
      const result = s.playCard(0);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.effect.playerAnim).toBeTruthy();
      expect(result.effect.enemyAnim).toBeUndefined();
    });
  });

  describe('hej', () => {
    it('draws 2 cards', () => {
      const s = freshState();
      s.hand = ['hej'];
      s.deck = ['ciupaga', 'ciupaga', 'ciupaga'];
      s.playCard(0);
      expect(s.hand).toHaveLength(2);
    });
  });

  // ── Status effects ────────────────────────────────────────────────────────
  describe('strength status', () => {
    it('adds to attack damage', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.player.status.strength = 3;
      s.playCard(0);
      expect(s.enemy.hp).toBe(31); // 6 + 3 = 9 damage
    });
    it('applies to every hit of redyk', () => {
      const s = freshState(3);
      s.hand = ['redyk'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.player.status.strength = 1;
      s.playCard(0);
      expect(s.enemy.hp).toBe(28); // 4 × (2+1) = 12 damage
    });
  });

  describe('weak status', () => {
    it('reduces player attack damage by 25%', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.player.status.weak = 1;
      s.playCard(0);
      expect(s.enemy.hp).toBe(36); // floor(6 × 0.75) = 4 damage
    });
    it('does not decrement weak mid-card (_calcAttackDamage is pure)', () => {
      const s = freshState(3);
      s.hand = ['ciupaga'];
      s.player.status.weak = 2;
      s.playCard(0);
      expect(s.player.status.weak).toBe(2); // ticks only at startTurn
    });
    it('reduces enemy attack when enemy has weak', () => {
      const s = freshState();
      s.player.hp = 50; s.player.block = 0;
      s.enemy.nextAttack = 8;
      s.enemy.status.weak = 1;
      s.endTurn();
      expect(s.player.hp).toBe(44); // floor(8 × 0.75) = 6 damage
    });
    it('ticks enemy weak down after endTurn', () => {
      const s = freshState();
      s.enemy.status.weak = 2;
      s.endTurn();
      expect(s.enemy.status.weak).toBe(1);
    });
    it('ticks player weak down at startTurn', () => {
      const s = freshState();
      s.hand = []; s.deck = [];
      s.player.status.weak = 2;
      s.startTurn();
      expect(s.player.status.weak).toBe(1);
    });
  });

  describe('next_double status', () => {
    it('doubles next attack damage and resets', () => {
      const s = freshState(3);
      s.player.status.next_double = true;
      s.hand = ['ciupaga'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(28); // 6 × 2 = 12 damage
      expect(s.player.status.next_double).toBe(false);
    });
    it('only doubles the first hit of redyk, then resets', () => {
      const s = freshState(3);
      s.player.status.next_double = true;
      s.hand = ['redyk'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      // Hit 1: 2×2=4; Hits 2-4: 2 each → total 4+2+2+2=10
      expect(s.enemy.hp).toBe(30);
      expect(s.player.status.next_double).toBe(false);
    });
  });

  // ── New cards ─────────────────────────────────────────────────────────────
  describe('sernik', () => {
    it('gives +1 Oscypek and exhausts', () => {
      const s = freshState(2);
      s.hand = ['sernik'];
      s.playCard(0);
      expect(s.player.energy).toBe(3);
      expect(s.exhaust).toContain('sernik');
      expect(s.discard).not.toContain('sernik');
    });
  });

  describe('redyk', () => {
    it('deals 4×2 = 8 damage with no status', () => {
      const s = freshState(3);
      s.hand = ['redyk'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(32);
    });
    it('stops early if enemy hp reaches 0', () => {
      const s = freshState(3);
      s.hand = ['redyk'];
      s.enemy.hp = 3; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThanOrEqual(0);
    });
  });

  describe('halny', () => {
    it('discards remaining hand and draws 3', () => {
      const s = freshState(3);
      s.hand = ['halny', 'ciupaga', 'gasior'];
      s.deck = ['hej', 'hej', 'hej', 'hej'];
      s.playCard(0); // play halny at index 0
      // halny goes to discard, remaining [ciupaga, gasior] discarded, 3 drawn
      expect(s.hand).toHaveLength(3);
      expect(s.discard).toContain('ciupaga');
      expect(s.discard).toContain('gasior');
      expect(s.discard).toContain('halny');
    });
  });

  describe('parzenica', () => {
    it('grants 7 Garda', () => {
      const s = freshState();
      s.hand = ['parzenica'];
      s.player.block = 0;
      s.playCard(0);
      expect(s.player.block).toBe(7);
    });
    it('sets energy_next_turn +1', () => {
      const s = freshState();
      s.hand = ['parzenica'];
      s.playCard(0);
      expect(s.player.status.energy_next_turn).toBe(1);
    });
    it('energy_next_turn bonus is consumed on startTurn', () => {
      const s = freshState(3);
      s.hand = []; s.deck = [];
      s.player.status.energy_next_turn = 1;
      s.startTurn();
      expect(s.player.energy).toBe(4); // 3 + 1
      expect(s.player.status.energy_next_turn).toBe(0);
    });
  });

  describe('zadyma', () => {
    it('deals 8 damage when enemy has no Garda', () => {
      const s = freshState();
      s.hand = ['zadyma'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(32);
    });
    it('deals 12 damage when enemy has Garda', () => {
      const s = freshState();
      s.hand = ['zadyma'];
      s.enemy.hp = 40; s.enemy.block = 5;
      s.playCard(0);
      // 12 - 5 blocked = 7 dealt
      expect(s.enemy.hp).toBe(33);
      expect(s.enemy.block).toBe(0);
    });
  });

  describe('zyntyca', () => {
    it('heals 4 Krzepa', () => {
      const s = freshState();
      s.hand = ['zyntyca'];
      s.player.hp = 30;
      s.playCard(0);
      expect(s.player.hp).toBe(34);
    });
    it('does not exceed maxHp', () => {
      const s = freshState();
      s.hand = ['zyntyca'];
      s.player.hp = 49;
      s.playCard(0);
      expect(s.player.hp).toBe(50);
    });
  });

  describe('janosik', () => {
    it('deals 7 damage', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(33);
    });
    it('grants +20 Dutki if enemy dies', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 5; s.enemy.block = 0;
      s.gold = 0;
      s.playCard(0);
      expect(s.gold).toBe(20);
    });
    it('does not grant Dutki if enemy survives', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.gold = 0;
      s.playCard(0);
      expect(s.gold).toBe(0);
    });
  });

  describe('echo', () => {
    it('sets next_double on player', () => {
      const s = freshState(3);
      s.hand = ['echo'];
      s.playCard(0);
      expect(s.player.status.next_double).toBe(true);
    });
  });

  describe('sandaly', () => {
    it('deals 5 damage', () => {
      const s = freshState();
      s.hand = ['sandaly'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(35);
    });
    it('applies weak:2 to enemy', () => {
      const s = freshState();
      s.hand = ['sandaly'];
      s.enemy.status.weak = 0;
      s.playCard(0);
      expect(s.enemy.status.weak).toBe(2);
    });
  });

  describe('giewont', () => {
    it('deals 25 damage', () => {
      const s = freshState(3);
      s.hand = ['giewont'];
      s.enemy.hp = 40; s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(15);
    });
  });

  // ── endTurn ───────────────────────────────────────────────────────────────
  describe('endTurn', () => {
    it('moves entire hand to discard', () => {
      const s = freshState();
      s.hand = ['ciupaga', 'gasior'];
      s.endTurn();
      expect(s.hand).toHaveLength(0);
      expect(s.discard).toContain('ciupaga');
      expect(s.discard).toContain('gasior');
    });
    it('enemy attack deals damage to Góral', () => {
      const s = freshState();
      s.player.hp = 50; s.player.block = 0;
      s.enemy.nextAttack = 8;
      s.endTurn();
      expect(s.player.hp).toBe(42);
    });
    it('enemy attack is reduced by Góral Garda', () => {
      const s = freshState();
      s.player.hp = 50; s.player.block = 5;
      s.enemy.nextAttack = 8;
      s.endTurn();
      expect(s.player.block).toBe(0);
      expect(s.player.hp).toBe(47);
    });
    it('enemy attack is fully blocked', () => {
      const s = freshState();
      s.player.hp = 50; s.player.block = 10;
      s.enemy.nextAttack = 8;
      s.endTurn();
      expect(s.player.block).toBe(2);
      expect(s.player.hp).toBe(50);
    });
    it('returns correct damage breakdown', () => {
      const s = freshState();
      s.player.block = 3; s.enemy.nextAttack = 8;
      const result = s.endTurn();
      expect(result.enemyAttack.raw).toBe(8);
      expect(result.enemyAttack.blocked).toBe(3);
      expect(result.enemyAttack.dealt).toBe(5);
    });
    it('resets Ceper Garda after enemy attack', () => {
      const s = freshState();
      s.enemy.block = 5;
      s.endTurn();
      expect(s.enemy.block).toBe(0);
    });
    it('rolls a new nextAttack between 5 and 10', () => {
      const s = freshState();
      s.endTurn();
      expect(s.enemy.nextAttack).toBeGreaterThanOrEqual(5);
      expect(s.enemy.nextAttack).toBeLessThanOrEqual(10);
    });
  });

  // ── startTurn ─────────────────────────────────────────────────────────────
  describe('startTurn', () => {
    it('restores Oscypki to maxEnergy', () => {
      const s = freshState(0);
      s.hand = []; s.deck = [];
      s.startTurn();
      expect(s.player.energy).toBe(s.player.maxEnergy);
    });
    it('resets Góral Garda to 0', () => {
      const s = freshState();
      s.hand = []; s.deck = [];
      s.player.block = 7;
      s.startTurn();
      expect(s.player.block).toBe(0);
    });
    it('draws 5 cards from deck', () => {
      const s = freshState();
      s.deck = [...startingDeck];
      s.startTurn();
      expect(s.hand).toHaveLength(5);
    });
  });

  // ── checkWinCondition ─────────────────────────────────────────────────────
  describe('checkWinCondition', () => {
    it('returns player_win when Ceper Krzepa reaches 0', () => {
      const s = freshState();
      s.enemy.hp = 0;
      expect(s.checkWinCondition()).toBe('player_win');
    });
    it('returns enemy_win when Góral Krzepa reaches 0', () => {
      const s = freshState();
      s.player.hp = 0;
      expect(s.checkWinCondition()).toBe('enemy_win');
    });
    it('returns null when both are still alive', () => {
      const s = freshState();
      expect(s.checkWinCondition()).toBeNull();
    });
  });

  // ── deck recycling ────────────────────────────────────────────────────────
  describe('deck recycling', () => {
    it('reshuffles discard into deck when deck is empty', () => {
      const s = freshState();
      s.discard = ['ciupaga', 'gasior', 'ciupaga', 'gasior', 'ciupaga'];
      s._drawCards(3);
      expect(s.hand).toHaveLength(3);
      expect(s.discard).toHaveLength(0);
      expect(s.deck).toHaveLength(2);
    });
  });
});
