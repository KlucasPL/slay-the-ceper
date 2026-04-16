import { describe, it, expect, vi, afterEach } from 'vitest';
import { GameState } from '../src/state/GameState.js';
import { cardLibrary, startingDeck } from '../src/data/cards.js';
import { enemyLibrary } from '../src/data/enemies.js';
import { eventLibrary } from '../src/data/events.js';
import { relicLibrary, addRelicToLibrary } from '../src/data/relics.js';
import { marynaBoonLibrary } from '../src/data/marynaBoons.js';

const mockPlayer = {
  name: 'Jędrek',
  emoji: '🧔‍♂️',
  hp: 50,
  maxHp: 50,
  block: 0,
  energy: 3,
  maxEnergy: 3,
};
const mockEnemy = enemyLibrary.cepr;

afterEach(() => {
  vi.restoreAllMocks();
});

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

/** @returns {GameState} */
function freshBusiarzState() {
  const s = new GameState({ ...mockPlayer }, enemyLibrary.busiarz);
  s.player.energy = 3;
  s.hand = [];
  s.deck = [];
  s.discard = [];
  return s;
}

/** @returns {GameState} */
function freshInfluencerkaState() {
  const s = new GameState({ ...mockPlayer }, enemyLibrary.influencerka);
  s.player.energy = 3;
  s.hand = [];
  s.deck = [];
  s.discard = [];
  return s;
}

/** @returns {GameState} */
function freshBabaState() {
  const s = new GameState({ ...mockPlayer }, enemyLibrary.baba);
  s.player.energy = 3;
  s.hand = [];
  s.deck = [];
  s.discard = [];
  return s;
}

/**
 * @param {GameState} state
 * @param {import('../src/data/enemies.js').EnemyMoveDef} intent
 */
function setEnemyIntent(state, intent) {
  state.enemy.currentIntent = { ...intent };
  state.enemy.nextAttack = intent.type === 'attack' ? intent.damage : 0;
}

describe('GameState', () => {
  // ── initGame ──────────────────────────────────────────────────────────────
  describe('initGame', () => {
    it('starts on the title screen', () => {
      const s = new GameState({ ...mockPlayer }, { ...mockEnemy });
      expect(s.currentScreen).toBe('title');
    });

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

    it('returns reason:blokada when Parkingowy card limit is exceeded', () => {
      const s = freshState(3);
      s.enemy = structuredClone(enemyLibrary.parkingowy);
      s.player.cardsPlayedThisTurn = 3;
      s.hand = ['ciupaga'];

      const result = s.playCard(0);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('blokada');
      expect(s.hand).toEqual(['ciupaga']);
      expect(s.player.energy).toBe(3);
    });
  });

  // ── Original cards ────────────────────────────────────────────────────────
  describe('ciupaga', () => {
    it('deals 6 damage to Ceper', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(34);
    });
    it('damage is reduced by Ceper Garda', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.block = 4;
      s.enemy.hp = 40;
      s.playCard(0);
      expect(s.enemy.block).toBe(0);
      expect(s.enemy.hp).toBe(38);
    });
    it('fully absorbed when Ceper Garda >= damage', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.block = 10;
      s.enemy.hp = 40;
      s.playCard(0);
      expect(s.enemy.block).toBe(4);
      expect(s.enemy.hp).toBe(40);
    });
  });

  describe('kierpce', () => {
    it('deals 12 damage and applies 1 weak', () => {
      const s = freshState(3);
      s.hand = ['kierpce'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(28);
      expect(s.enemy.status.weak).toBe(1);
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
    it('draws 2 cards and exhausts', () => {
      const s = freshState(1);
      s.hand = ['hej'];
      s.deck = ['ciupaga', 'gasior', 'ciupaga'];
      s.playCard(0);
      expect(s.hand).toHaveLength(2);
      expect(s.exhaust).toContain('hej');
      expect(s.discard).not.toContain('hej');
    });
  });

  describe('prestiz_na_kredyt', () => {
    it('grants 6 base block plus scaling from Dutki', () => {
      const s = freshState();
      s.hand = ['prestiz_na_kredyt'];
      s.dutki = 60; // +6 bonus
      s.player.block = 0;

      s.playCard(0);

      expect(s.player.block).toBe(12);
    });

    it('caps scaling bonus at +14 (20 total block)', () => {
      const s = freshState();
      s.hand = ['prestiz_na_kredyt'];
      s.dutki = 999;
      s.player.block = 0;

      s.playCard(0);

      expect(s.player.block).toBe(20);
    });
  });

  describe('furia_turysty', () => {
    it('applies fury buff and loses 3 HP on play', () => {
      const s = freshState();
      s.hand = ['furia_turysty'];
      s.player.hp = 25;

      s.playCard(0);

      expect(s.player.status.furia_turysty).toBe(1);
      expect(s.player.hp).toBe(22);
      expect(s.exhaust).toContain('furia_turysty');
    });
  });

  describe('spostrzegawczosc', () => {
    it('draws 1 and grants +2 to next attack when drawn card is attack', () => {
      const s = freshState(3);
      s.hand = ['spostrzegawczosc', 'ciupaga'];
      s.deck = ['ciupaga'];
      s.enemy.hp = 50;
      s.enemy.block = 0;

      const skillResult = s.playCard(0);
      expect(skillResult.success).toBe(true);

      const attackIndex = s.hand.indexOf('ciupaga');
      expect(attackIndex).toBeGreaterThanOrEqual(0);
      s.playCard(attackIndex);
      expect(s.enemy.hp).toBe(42);
    });

    it('does not grant bonus when drawn card is not attack', () => {
      const s = freshState(3);
      s.hand = ['spostrzegawczosc', 'ciupaga'];
      s.deck = ['gasior'];
      s.enemy.hp = 50;
      s.enemy.block = 0;

      s.playCard(0);

      const attackIndex = s.hand.indexOf('ciupaga');
      expect(attackIndex).toBeGreaterThanOrEqual(0);
      s.playCard(attackIndex);
      expect(s.enemy.hp).toBe(44);
    });
  });

  describe('pocieszenie', () => {
    it('draws 1 card and exhausts', () => {
      const s = freshState(1);
      s.hand = ['pocieszenie'];
      s.deck = ['gasior', 'ciupaga'];

      s.playCard(0);

      expect(s.hand).toHaveLength(1);
      expect(s.exhaust).toContain('pocieszenie');
    });
  });

  // ── Status effects ────────────────────────────────────────────────────────
  describe('calculateDamage', () => {
    it('applies weak penalty to source outgoing damage', () => {
      const s = freshState();
      s.player.status.weak = 1;
      expect(s.calculateDamage(8, s.player, s.enemy)).toBe(6);
    });

    it('adds source strength as flat bonus', () => {
      const s = freshState();
      s.player.status.strength = 2;
      expect(s.calculateDamage(8, s.player, s.enemy)).toBe(10);
    });

    it('consumes player next_double only when attacking enemy', () => {
      const s = freshState();
      s.player.status.next_double = true;
      expect(s.calculateDamage(6, s.player, s.enemy)).toBe(12);
      expect(s.player.status.next_double).toBe(false);
    });

    it('does not consume next_double when player is not the source', () => {
      const s = freshState();
      s.player.status.next_double = true;
      expect(s.calculateDamage(8, s.enemy, s.player)).toBe(8);
      expect(s.player.status.next_double).toBe(true);
    });

    it('uses 50% weak penalty in frozen weather', () => {
      const s = freshState();
      s.currentWeather = 'frozen';
      s.player.status.weak = 1;
      expect(s.calculateDamage(8, s.player, s.enemy)).toBe(4);
    });

    it('applies Furia Turysty as +50% outgoing damage this turn', () => {
      const s = freshState();
      s.player.status.furia_turysty = 1;
      expect(s.calculateDamage(8, s.player, s.enemy)).toBe(12);
    });

    it('reduces enemy outgoing damage by 2 while Krzywy Portret penalty is active', () => {
      const s = freshState();
      s.enemy.portraitShameTurns = 1;
      expect(s.calculateDamage(10, s.enemy, s.player)).toBe(8);
    });
  });

  describe('strength status', () => {
    it('adds to attack damage', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.player.status.strength = 3;
      s.playCard(0);
      expect(s.enemy.hp).toBe(31); // 6 + 3 = 9 damage
    });
    it('applies to every hit of redyk', () => {
      const s = freshState(3);
      s.hand = ['redyk'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.player.status.strength = 1;
      s.playCard(0);
      expect(s.enemy.hp).toBe(28); // 4 × (2+1) = 12 damage
    });
  });

  describe('weak status', () => {
    it('reduces player attack damage by 25%', () => {
      const s = freshState();
      s.hand = ['ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
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
      s.player.hp = 50;
      s.player.block = 0;
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
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
    it('ticks player weak down at endTurn', () => {
      const s = freshState();
      s.player.status.weak = 2;
      s.endTurn();
      expect(s.player.status.weak).toBe(1);
    });
  });

  describe('next_double status', () => {
    it('doubles next attack damage and resets', () => {
      const s = freshState(3);
      s.player.status.next_double = true;
      s.hand = ['ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(28); // 6 × 2 = 12 damage
      expect(s.player.status.next_double).toBe(false);
    });
    it('only doubles the first hit of redyk, then resets', () => {
      const s = freshState(3);
      s.player.status.next_double = true;
      s.hand = ['redyk'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
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
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(32);
    });
    it('stops early if enemy hp reaches 0', () => {
      const s = freshState(3);
      s.hand = ['redyk'];
      s.enemy.hp = 3;
      s.enemy.block = 0;
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

  describe('paragon_za_gofra', () => {
    it('adds 10 rachunek to enemy', () => {
      const s = freshState();
      s.hand = ['paragon_za_gofra'];
      s.enemy.rachunek = 0;
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(10);
    });
    it('exhausts after use', () => {
      const s = freshState();
      s.hand = ['paragon_za_gofra'];
      s.playCard(0);
      expect(s.exhaust).toContain('paragon_za_gofra');
      expect(s.discard).not.toContain('paragon_za_gofra');
    });

    it('bankrupts enemy at the start of enemy turn when rachunek reaches current hp', () => {
      const s = freshState();
      s.hand = ['paragon_za_gofra'];
      s.enemy.hp = 10;
      s.dutki = 50;
      s.playCard(0);

      // Bankructwo is now deferred and resolves on enemy turn start.
      expect(s.checkWinCondition()).toBe(null);

      s.endTurn();

      expect(s.checkWinCondition()).toBe('player_win');
      expect(s.enemy.hp).toBe(0);
      expect(s.dutki).toBe(53);
      expect(s.lastVictoryMessage).toContain('Wróg zbankrutował');
    });

    it('caps bankruptcy bonus at 25 dutki', () => {
      const s = freshState();
      s.enemy.hp = 100;
      s.enemy.rachunek = 120;
      s.dutki = 0;

      s.enemyBankrupt();

      expect(s.enemyBankruptcyBonus).toBe(25);
      expect(s.dutki).toBe(25);
    });
  });

  describe('podatek_klimatyczny', () => {
    it('doubles current rachunek and exhausts', () => {
      const s = freshState(3);
      s.hand = ['podatek_klimatyczny'];
      s.enemy.rachunek = 12;
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(24);
      expect(s.exhaust).toContain('podatek_klimatyczny');
    });

    it('requires 3 Oscypki to play', () => {
      const s = freshState(2);
      s.hand = ['podatek_klimatyczny'];
      const result = s.playCard(0);

      expect(result.success).toBe(false);
      expect(s.hand).toContain('podatek_klimatyczny');
    });
  });

  describe('wypozyczone_gogle', () => {
    it('enables lans and exhausts', () => {
      const s = freshState();
      s.hand = ['wypozyczone_gogle'];
      s.player.status.lans = 0;
      s.playCard(0);
      expect(s.player.status.lans).toBe(1);
      expect(s.exhaust).toContain('wypozyczone_gogle');
    });

    it('emits one-shot lans activation event when turning lans on', () => {
      const s = freshState();
      s.hand = ['wypozyczone_gogle'];
      s.player.status.lans = 0;

      s.playCard(0);

      expect(s.consumeLansActivatedEvent()).toBe(true);
      expect(s.consumeLansActivatedEvent()).toBe(false);
    });

    it('is a power card', () => {
      expect(cardLibrary.wypozyczone_gogle.type).toBe('power');
    });
  });

  describe('zdjecie_z_misiem', () => {
    it('gives +20 dutki when lans is active', () => {
      const s = freshState();
      s.hand = ['zdjecie_z_misiem'];
      s.player.status.lans = 1;
      s.dutki = 10;
      s.playCard(0);
      expect(s.dutki).toBe(30);
    });

    it('activates lans and skips main effect without lans', () => {
      const s = freshState();
      s.hand = ['zdjecie_z_misiem'];
      s.player.status.lans = 0;
      s.dutki = 10;
      s.playCard(0);
      expect(s.dutki).toBe(10);
      expect(s.player.status.lans).toBe(1);
      expect(s.consumeLansActivatedEvent()).toBe(true);
      expect(s.consumeLansActivatedEvent()).toBe(false);
    });

    it('does not trigger main effect from first-card duplicate when lans was inactive', () => {
      const s = freshState();
      s.relics.push('pocztowka_giewont');
      s.hand = ['zdjecie_z_misiem'];
      s.player.status.lans = 0;
      s.dutki = 10;

      s.playCard(0);

      expect(s.dutki).toBe(10);
      expect(s.player.status.lans).toBe(1);
    });
  });

  describe('lans status', () => {
    it('converts HP damage to dutki when funds are enough', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.player.block = 0;
      s.player.hp = 40;
      s.dutki = 20;
      const result = s.takeDamage(6);
      expect(result.dealt).toBe(0);
      expect(s.player.hp).toBe(40);
      expect(s.dutki).toBe(8);
    });

    it('emits one-shot event with Dutki spent by Lans', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.player.block = 0;
      s.dutki = 20;

      s.takeDamage(6);

      expect(s.consumeLansDutkiSpentEvent()).toBe(12);
      expect(s.consumeLansDutkiSpentEvent()).toBe(0);
    });

    it('breaks lans, stuns player and applies remaining HP damage when funds are low', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.player.block = 0;
      s.player.hp = 30;
      s.dutki = 5;
      const result = s.takeDamage(6);
      expect(result.dealt).toBe(4);
      expect(s.player.hp).toBe(26);
      expect(s.dutki).toBe(0);
      expect(s.player.status.lans).toBe(0);
      expect(s.player.stunned).toBe(true);
      expect(s.consumeLansBreakEvent()).toBe('BANKRUT!');
      expect(s.consumeLansDutkiSpentEvent()).toBe(5);
    });

    it('works based on player.status.lans as single source', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.player.block = 0;
      s.player.hp = 35;
      s.dutki = 20;
      const result = s.takeDamage(6);
      expect(result.dealt).toBe(0);
      expect(s.player.hp).toBe(35);
      expect(s.dutki).toBe(8);
    });

    it('stunned blocks playing attack cards only', () => {
      const s = freshState();
      s.player.stunned = true;
      s.player.energy = 3;
      s.hand = ['ciupaga'];

      const result = s.playCard(0);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('stunned_attack');
      expect(s.hand).toEqual(['ciupaga']);
      expect(s.player.energy).toBe(3);
    });

    it('stunned still allows skill cards to be played', () => {
      const s = freshState();
      s.player.stunned = true;
      s.player.energy = 3;
      s.hand = ['gasior'];
      s.player.block = 0;

      const result = s.playCard(0);

      expect(result.success).toBe(true);
      expect(s.player.block).toBe(5);
      expect(s.player.energy).toBe(2);
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
      s.hand = [];
      s.deck = [];
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
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(32);
    });
    it('deals 12 damage when enemy has Garda', () => {
      const s = freshState();
      s.hand = ['zadyma'];
      s.enemy.hp = 40;
      s.enemy.block = 5;
      s.playCard(0);
      // 12 - 5 blocked = 7 dealt
      expect(s.enemy.hp).toBe(33);
      expect(s.enemy.block).toBe(0);
    });
  });

  describe('zyntyca', () => {
    it('heals 4 Krzepa and exhausts', () => {
      const s = freshState();
      s.hand = ['zyntyca'];
      s.player.hp = 30;
      s.playCard(0);
      expect(s.player.hp).toBe(34);
      expect(s.exhaust).toContain('zyntyca');
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
    it('deals 9 damage', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(31);
    });
    it('grants +30 Dutki if enemy dies and exhausts', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 5;
      s.enemy.block = 0;
      s.dutki = 0;
      s.playCard(0);
      expect(s.dutki).toBe(30);
      expect(s.exhaust).toContain('janosik');
    });
    it('does not grant Dutki if enemy survives', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.dutki = 0;
      s.playCard(0);
      expect(s.dutki).toBe(0);
    });
  });

  describe('echo', () => {
    it('sets next_double, draws 1 and exhausts', () => {
      const s = freshState(3);
      s.hand = ['echo'];
      s.deck = ['ciupaga'];
      s.playCard(0);
      expect(s.player.status.next_double).toBe(true);
      expect(s.hand).toHaveLength(1);
      expect(s.exhaust).toContain('echo');
    });
  });

  describe('sandaly', () => {
    it('deals 5 damage', () => {
      const s = freshState();
      s.hand = ['sandaly'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
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
    it('deals 30 damage and exhausts', () => {
      const s = freshState(3);
      s.hand = ['giewont'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(10);
      expect(s.exhaust).toContain('giewont');
    });
  });

  describe('pchniecie_ciupaga', () => {
    it('deals 12 damage when enemy has no Garda', () => {
      const s = freshState();
      s.hand = ['pchniecie_ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(28);
    });

    it('deals 8 base damage when enemy has Garda', () => {
      const s = freshState();
      s.hand = ['pchniecie_ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 5;
      s.playCard(0);
      expect(s.enemy.hp).toBe(37);
      expect(s.enemy.block).toBe(0);
    });
  });

  describe('barchanowe_gacie', () => {
    it('grants 7 Garda without Lans', () => {
      const s = freshState();
      s.hand = ['barchanowe_gacie'];
      s.player.status.lans = 0;
      s.playCard(0);
      expect(s.player.block).toBe(7);
    });

    it('grants 10 Garda with Lans', () => {
      const s = freshState();
      s.hand = ['barchanowe_gacie'];
      s.player.status.lans = 1;
      s.playCard(0);
      expect(s.player.block).toBe(10);
    });
  });

  describe('szukanie_okazji', () => {
    it('discards one card from hand and draws two', () => {
      const s = freshState();
      s.hand = ['szukanie_okazji', 'ciupaga'];
      s.deck = ['gasior', 'hej'];
      vi.spyOn(Math, 'random').mockReturnValue(0);

      s.playCard(0);

      expect(s.hand).toHaveLength(2);
      expect(s.discard).toContain('ciupaga');
      expect(s.discard).toContain('szukanie_okazji');
    });
  });

  describe('lodolamacz', () => {
    it('deals base + half current Garda and exhausts', () => {
      const s = freshState();
      s.hand = ['lodolamacz'];
      s.player.block = 10;
      s.enemy.hp = 40;
      s.enemy.block = 0;

      s.playCard(0);

      expect(s.enemy.hp).toBe(27);
      expect(s.exhaust).toContain('lodolamacz');
    });
  });

  describe('duma_podhala', () => {
    it('reflects damage when enough Garda is lost to enemy attack', () => {
      const s = freshState();
      s.hand = ['duma_podhala'];
      s.enemy.hp = 50;
      s.enemy.block = 0;
      s.player.block = 20;

      s.playCard(0);
      expect(s.player.status.duma_podhala).toBe(1);
      setEnemyIntent(s, { type: 'attack', name: 'Atak', damage: 25, hits: 1 });
      s.endTurn();

      expect(s.enemy.hp).toBe(40);
    });

    it('is a power card and exhausts', () => {
      expect(cardLibrary.duma_podhala.type).toBe('power');
      expect(cardLibrary.duma_podhala.exhaust).toBe(true);
    });
  });

  describe('zemsta_gorala', () => {
    it('deals 15 damage normally', () => {
      const s = freshState();
      s.hand = ['zemsta_gorala', 'ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;

      s.playCard(0);

      expect(s.enemy.hp).toBe(25);
    });

    it('deals 30 damage when played as last card in hand', () => {
      const s = freshState();
      s.hand = ['zemsta_gorala'];
      s.enemy.hp = 40;
      s.enemy.block = 0;

      s.playCard(0);

      expect(s.enemy.hp).toBe(10);
    });
  });

  describe('mocny_organizm', () => {
    it('deals 10 damage and does not increase max HP when enemy survives', () => {
      const s = freshState();
      s.hand = ['mocny_organizm'];
      s.enemy.hp = 30;
      s.enemy.block = 0;
      const beforeMaxHp = s.player.maxHp;

      s.playCard(0);

      expect(s.enemy.hp).toBe(20);
      expect(s.player.maxHp).toBe(beforeMaxHp);
    });

    it('increases max HP by 2 when attack kills enemy', () => {
      const s = freshState();
      s.hand = ['mocny_organizm'];
      s.enemy.hp = 10;
      s.enemy.block = 0;
      s.player.hp = 30;
      const beforeMaxHp = s.player.maxHp;

      s.playCard(0);

      expect(s.enemy.hp).toBe(0);
      expect(s.player.maxHp).toBe(beforeMaxHp + 2);
      expect(s.player.hp).toBe(32);
    });
  });

  describe('relics', () => {
    it('adds a relic only once', () => {
      const s = freshState();
      expect(s.addRelic('kierpce_wyprzedazy')).toBe(true);
      expect(s.addRelic('kierpce_wyprzedazy')).toBe(false);
      expect(s.relics).toEqual(['kierpce_wyprzedazy']);
    });

    it('pas_bacowski increases max HP by 6 on pickup', () => {
      const s = freshState();
      s.player.hp = 40;
      const beforeMaxHp = s.player.maxHp;

      s.addRelic('pas_bacowski');

      expect(s.player.maxHp).toBe(beforeMaxHp + 6);
      expect(s.player.hp).toBe(46);
    });

    it('certyfikowany_oscypek grants +2 max HP on shop entry up to 3 times', () => {
      const s = freshState();
      s.addRelic('certyfikowany_oscypek');
      const baseMaxHp = s.player.maxHp;

      s.generateShopStock();
      s.generateShopStock();
      s.generateShopStock();
      s.generateShopStock();

      expect(s.player.maxHp).toBe(baseMaxHp + 6);
      expect(s.certyfikowanyOscypekShopProcs).toBe(3);
    });

    it('flaszka_sliwowicy gives +4 strength at battle start', () => {
      const s = freshState();
      s.addRelic('flaszka_sliwowicy');
      s.player.status.strength = 0;
      s.resetBattle();
      expect(s.player.status.strength).toBe(4);
    });

    it('wiatr_halny draws +1 card each turn start', () => {
      const s = freshState();
      s.addRelic('wiatr_halny');
      s.deck = [...startingDeck, ...startingDeck];
      s.hand = [];
      s.discard = [];
      s.startTurn();
      // normal draw is 5, wiatr_halny adds 1 more
      expect(s.hand.length).toBe(6);
    });

    it('papryczka_marka gives +3 strength at battle start', () => {
      const s = freshState();
      s.addRelic('papryczka_marka');
      s.player.status.strength = 0;
      s.resetBattle();
      expect(s.player.status.strength).toBe(3);
    });

    it('papryczka_marka drains 2 HP each turn start (min 1)', () => {
      const s = freshState();
      s.addRelic('papryczka_marka');
      s.player.hp = 5;
      s.deck = [...startingDeck, ...startingDeck];
      s.hand = [];
      s.startTurn();
      expect(s.player.hp).toBe(3);
      // HP at 1 should not go below 1
      s.player.hp = 1;
      s.startTurn();
      expect(s.player.hp).toBe(1);
    });

    it('dzwonek_owcy blocks healing', () => {
      const s = freshState();
      s.addRelic('dzwonek_owcy');
      s.player.hp = 20;
      s.healPlayer(10);
      expect(s.player.hp).toBe(20);
    });

    it('dzwonek_owcy reduces enemy maxHp by 20%', () => {
      const s = freshState();
      const baseMaxHp = s.enemy.maxHp; // cepr base = 40
      s.addRelic('dzwonek_owcy');
      s.deck = [...startingDeck, ...startingDeck];
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.cepr);
      s.resetBattle();
      expect(s.enemy.maxHp).toBe(Math.round(baseMaxHp * 0.8));
    });

    it('kierpce_wyprzedazy draws a card when player takes HP damage', () => {
      const s = freshState();
      s.addRelic('kierpce_wyprzedazy');
      s.deck = [...startingDeck, ...startingDeck];
      s.hand = [];
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      s.player.block = 0;
      s.endTurn();
      // endTurn does not call startTurn; kierpce draws exactly 1 card during damage
      expect(s.hand.length).toBe(1);
    });

    it('krokus heals 2 HP at end of turn when block > 10', () => {
      const s = freshState();
      s.addRelic('krokus');
      s.player.hp = 30;
      s.player.block = 11;
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      const { playerPassiveHeal } = s.endTurn();
      expect(s.player.hp).toBe(32);
      expect(playerPassiveHeal).not.toBeNull();
    });

    it('krokus does not heal when block <= 10', () => {
      const s = freshState();
      s.addRelic('krokus');
      s.player.hp = 30;
      s.player.block = 10;
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      const { playerPassiveHeal } = s.endTurn();
      expect(s.player.hp).toBe(30);
      expect(playerPassiveHeal).toBeNull();
    });

    it('papucie_po_babci heals 2 HP at end of turn when Lans is active', () => {
      const s = freshState();
      s.addRelic('papucie_po_babci');
      s.player.hp = 25;
      s.player.status.lans = 1;
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      const { playerPassiveHeal } = s.endTurn();
      expect(s.player.hp).toBe(27);
      expect(playerPassiveHeal).not.toBeNull();
    });

    it('papucie_po_babci does not heal when Lans is inactive', () => {
      const s = freshState();
      s.addRelic('papucie_po_babci');
      s.player.hp = 25;
      s.player.status.lans = 0;
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      s.endTurn();
      expect(s.player.hp).toBe(25);
    });

    it('magnes_na_lodowke grants +50% dutki when enemy is bankrupt', () => {
      const s = freshState();
      s.addRelic('magnes_na_lodowke');
      s.enemy.isBankrupt = true;
      s.pendingBattleDutki = true;
      const drop = s.grantBattleDutki();
      expect(drop).toBeGreaterThanOrEqual(42);
      expect(drop).toBeLessThanOrEqual(54);
    });

    it('grantBattleDutki normal drop without magnes_na_lodowke', () => {
      const s = freshState();
      s.enemy.isBankrupt = true;
      s.pendingBattleDutki = true;
      const drop = s.grantBattleDutki();
      expect(drop).toBeGreaterThanOrEqual(28);
      expect(drop).toBeLessThanOrEqual(36);
    });

    it('zasluzony_portfel grants +6 only outside event battles', () => {
      const s = freshState();
      s.addRelic('zasluzony_portfel');
      s.pendingBattleDutki = true;
      s.battleContext = 'map';
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const mapDrop = s.grantBattleDutki();
      expect(mapDrop).toBe(34);

      s.pendingBattleDutki = true;
      s.battleContext = 'event';
      const eventDrop = s.grantBattleDutki();
      expect(eventDrop).toBe(28);
    });

    describe('szczegliwa_podkowa', () => {
      it('grants +25 dutki when player HP is at or below 40% at end of battle', () => {
        const s = freshState();
        s.addRelic('szczegliwa_podkowa');
        s.player.hp = Math.floor(s.player.maxHp * 0.4);
        s.pendingBattleDutki = true;
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const drop = s.grantBattleDutki();
        expect(drop).toBe(28 + 25);
      });

      it('does not grant bonus when player HP is above 40%', () => {
        const s = freshState();
        s.addRelic('szczegliwa_podkowa');
        s.player.hp = Math.floor(s.player.maxHp * 0.41) + 1;
        s.pendingBattleDutki = true;
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const drop = s.grantBattleDutki();
        expect(drop).toBe(28);
      });
    });

    describe('termos_z_herbatka', () => {
      it('heals +4 HP when battle ends in 2 turns or fewer', () => {
        const s = freshState();
        s.addRelic('termos_z_herbatka');
        s.player.hp = 40;
        s.battleTurnsElapsed = 2;
        s.pendingBattleDutki = true;
        vi.spyOn(Math, 'random').mockReturnValue(0);
        s.grantBattleDutki();
        expect(s.player.hp).toBe(44);
      });

      it('grants +15 dutki when battle lasts more than 2 turns', () => {
        const s = freshState();
        s.addRelic('termos_z_herbatka');
        s.player.hp = 50;
        s.battleTurnsElapsed = 3;
        s.pendingBattleDutki = true;
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const drop = s.grantBattleDutki();
        expect(drop).toBe(28 + 15);
        expect(s.player.hp).toBe(50);
      });
    });

    describe('goralski_zegarek', () => {
      it('first skill costs 0 on even turns', () => {
        const s = freshState();
        s.addRelic('goralski_zegarek');
        s.battleTurnsElapsed = 2;
        s.zegarekFreeSkillAvailable = true;
        expect(s.getCardCostInHand('gasior')).toBe(0);
      });

      it('skill costs normal on odd turns', () => {
        const s = freshState();
        s.addRelic('goralski_zegarek');
        s.battleTurnsElapsed = 1;
        s.zegarekFreeSkillAvailable = false;
        expect(s.getCardCostInHand('gasior')).toBe(cardLibrary['gasior'].cost);
      });

      it('zegarek flag resets after a skill is played', () => {
        const s = freshState();
        s.addRelic('goralski_zegarek');
        s.battleTurnsElapsed = 2;
        s.zegarekFreeSkillAvailable = true;
        s.hand = ['gasior'];
        s.player.energy = 3;
        s.playCard(0);
        expect(s.zegarekFreeSkillAvailable).toBe(false);
      });

      it('flag is set on even turns in startTurn', () => {
        const s = freshState();
        s.addRelic('goralski_zegarek');
        // battleTurnsElapsed starts at 0, startTurn increments to 1 (odd) — no flag
        expect(s.zegarekFreeSkillAvailable).toBe(false);
        // simulate second turn
        s.battleTurnsElapsed = 1;
        s.startTurn();
        expect(s.zegarekFreeSkillAvailable).toBe(true);
      });
    });

    describe('zlota_karta_zakopianczyka', () => {
      it('getShopRemovalPrice returns 25 with relic', () => {
        const s = freshState();
        s.addRelic('zlota_karta_zakopianczyka');
        expect(s.getShopRemovalPrice()).toBe(25);
      });

      it('getShopRemovalPrice returns 100 without relic', () => {
        const s = freshState();
        expect(s.getShopRemovalPrice()).toBe(100);
      });

      it('getCardShopPrice applies 15% discount with relic', () => {
        const s = freshState();
        s.addRelic('zlota_karta_zakopianczyka');
        const basePrice = cardLibrary['ciupaga'].price;
        expect(s.getCardShopPrice('ciupaga')).toBe(Math.floor(basePrice * 0.85));
      });

      it('getCardShopPrice returns base price without relic', () => {
        const s = freshState();
        const basePrice = cardLibrary['ciupaga'].price;
        expect(s.getCardShopPrice('ciupaga')).toBe(basePrice);
      });
    });

    it('pekniete_liczydlo heals player by 2 HP when rachunek is added', () => {
      const s = freshState();
      s.addRelic('pekniete_liczydlo');
      s.player.hp = 40;
      s.enemy.rachunek = 0;
      s.enemy.maxRachunek = 9999;
      s.addEnemyRachunek(5);
      expect(s.player.hp).toBe(42);
    });

    it('pekniete_liczydlo heal does not exceed max HP', () => {
      const s = freshState();
      s.addRelic('pekniete_liczydlo');
      s.player.hp = s.player.maxHp - 1;

      s.addEnemyRachunek(5);

      expect(s.player.hp).toBe(s.player.maxHp);
    });

    it('fiakier takes only 70% of incoming rachunek', () => {
      const s = freshState();
      s.enemy = structuredClone(enemyLibrary.fiakier);
      s.enemy.hp = 999;
      s.enemy.rachunek = 0;

      s.addEnemyRachunek(10);

      expect(s.enemy.rachunek).toBe(7);
    });

    it('fiakier rachunek reduction still applies minimum 1 stack', () => {
      const s = freshState();
      s.enemy = structuredClone(enemyLibrary.fiakier);
      s.enemy.hp = 999;
      s.enemy.rachunek = 0;

      s.addEnemyRachunek(1);

      expect(s.enemy.rachunek).toBe(1);
    });

    it('fiakier is not bankrupted by a single 10-rachunek hit at 10 hp', () => {
      const s = freshState();
      s.enemy = structuredClone(enemyLibrary.fiakier);
      s.enemy.hp = 10;
      s.enemy.rachunek = 0;

      s.addEnemyRachunek(10);

      expect(s.enemy.rachunek).toBe(7);
      expect(s.enemy.isBankrupt).toBeFalsy();
      expect(s.checkWinCondition()).toBeNull();
    });

    it('emits rachunek resistance event for Gaździna and keeps rachunek at 0', () => {
      const s = freshState();
      s.enemy = structuredClone(enemyLibrary.baba);
      s.enemy.hp = 40;
      s.enemy.rachunek = 0;

      s.addEnemyRachunek(10);

      expect(s.enemy.rachunek).toBe(0);
      expect(s.enemy.isBankrupt).toBeFalsy();
      expect(s.consumeRachunekResistEvent()).toEqual({
        target: 'enemy',
        text: 'ODPORNA NA RACHUNEK!',
      });
      expect(s.consumeRachunekResistEvent()).toBeNull();
    });

    it('blacha_przewodnika starts battle with lans status active', () => {
      const s = freshState();
      s.addRelic('blacha_przewodnika');
      s.player.status.lans = 0;
      s._applyBattleStartRelics();
      expect(s.player.status.lans).toBe(1);
    });

    it('krzywy_portret applies opening enemy attack penalty for one turn', () => {
      const s = freshState();
      s.addRelic('krzywy_portret');
      s.enemy.portraitShameTurns = 0;

      s._applyBattleStartRelics();

      expect(s.enemy.portraitShameTurns).toBe(1);
    });

    it('lustrzane_gogle adds +2 block per block card when Lans is active', () => {
      const s = freshState();
      s.addRelic('lustrzane_gogle');
      s.player.status.lans = 1;
      s.player.block = 0;
      s.gainPlayerBlockFromCard(5);
      expect(s.player.block).toBe(7);
    });

    it('lustrzane_gogle does not add bonus block without Lans', () => {
      const s = freshState();
      s.addRelic('lustrzane_gogle');
      s.player.status.lans = 0;
      s.player.block = 0;
      s.gainPlayerBlockFromCard(5);
      expect(s.player.block).toBe(5);
    });

    it('ciupaga_dlugopis deals 4 bonus damage when a skill card is played', () => {
      const s = freshState();
      s.addRelic('ciupaga_dlugopis');
      s.hand = ['gasior']; // gasior is a skill card (costs 1, gives block)
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      // gasior has no direct damage; ciupaga_dlugopis should deal 4 dmg
      expect(s.enemy.hp).toBe(36);
    });

    it('bilet_tpn grants +1 energy on every 3rd attack card played', () => {
      const s = freshState();
      s.addRelic('bilet_tpn');
      s.player.energy = 10;
      s.hand = ['ciupaga', 'ciupaga', 'ciupaga'];
      s.enemy.hp = 100;
      s.enemy.block = 0;
      const energyAfterTwo = () => {
        s.playCard(0);
        s.playCard(0);
        return s.player.energy;
      };
      const e2 = energyAfterTwo();
      // energy went down by 2 (two ciupagas at cost 1 each), no bonus yet
      expect(e2).toBe(8);
      // 3rd attack – should grant +1
      s.hand = ['ciupaga'];
      s.playCard(0);
      expect(s.player.energy).toBe(8); // 8 - 1 (cost) + 1 (bilet bonus) = 8
    });

    it('pocztowka_giewont fires first card effect twice per battle', () => {
      const s = freshState();
      s.addRelic('pocztowka_giewont');
      s.hand = ['ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      // ciupaga deals 6 dmg twice = 12
      expect(s.enemy.hp).toBe(28);
    });

    it('pocztowka_giewont does not double the second card in same battle', () => {
      const s = freshState();
      s.addRelic('pocztowka_giewont');
      s.hand = ['ciupaga', 'ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0); // doubled: -12
      s.playCard(0); // normal: -6
      expect(s.enemy.hp).toBe(22);
    });

    it('smycz_zakopane keeps card from end-of-turn discard and re-adds it next turn', () => {
      const s = freshState();
      s.addRelic('smycz_zakopane');
      s.deck = [...startingDeck, ...startingDeck, ...startingDeck];
      s.hand = ['ciupaga', 'gasior'];
      s.setSmyczKeptCard(0);
      expect(s.smyczKeptHandIndex).toBe(0);
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      s.endTurn();
      // smyczKeptCardId should store queued card after endTurn
      expect(s.smyczKeptCardId).toBe('ciupaga');
      // After startTurn, 'ciupaga' should be in hand
      s.startTurn();
      expect(s.hand).toContain('ciupaga');
      expect(s.smyczKeptCardId).toBeNull();
    });

    it('smycz_zakopane keeps exact selected duplicate card slot', () => {
      const s = freshState();
      s.addRelic('smycz_zakopane');
      s.deck = [...startingDeck, ...startingDeck, ...startingDeck];
      s.hand = ['ciupaga', 'ciupaga', 'gasior'];

      // Keep second ciupaga specifically.
      s.setSmyczKeptCard(1);
      expect(s.smyczKeptHandIndex).toBe(1);

      // Play card before kept slot; pointer should shift to keep same instance.
      s.playCard(0);
      expect(s.smyczKeptHandIndex).toBe(0);

      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      s.endTurn();

      expect(s.smyczKeptCardId).toBe('ciupaga');
      expect(s.smyczKeptHandIndex).toBeNull();
    });

    it('zepsuty_termometr skips enemy status tick on every other turn', () => {
      const s = freshState();
      s.addRelic('zepsuty_termometr');
      s.enemy.status.weak = 3;
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      // Turn 1 (parity=0): tick fires → weak becomes 2
      s.endTurn();
      expect(s.enemy.status.weak).toBe(2);
      // Turn 2 (parity=1): tick skipped → weak stays 2
      s.endTurn();
      expect(s.enemy.status.weak).toBe(2);
      // Turn 3 (parity=0): tick fires → weak becomes 1
      s.endTurn();
      expect(s.enemy.status.weak).toBe(1);
    });

    it('getCardCostInHand returns flaszka-seeded cost when relic equipped', () => {
      const s = freshState();
      s.addRelic('flaszka_sliwowicy');
      s.flaszkaCostSeed = { ciupaga: 0 };
      expect(s.getCardCostInHand('ciupaga')).toBe(0);
    });

    it('getCardCostInHand falls back to card base cost without relic', () => {
      const s = freshState();
      expect(s.getCardCostInHand('ciupaga')).toBe(1);
    });
  });

  describe('map and economy', () => {
    it('rollMidNodeType can generate event nodes with tuned chance', () => {
      const s = freshState();
      vi.spyOn(Math, 'random').mockReturnValue(0.19);
      expect(s._rollMidNodeType()).toBe('event');
    });

    describe('rollEventNodeOutcome', () => {
      it('returns event for roll < 0.68', () => {
        const s = freshState();
        vi.spyOn(Math, 'random').mockReturnValue(0.67);
        expect(s.rollEventNodeOutcome()).toBe('event');
      });

      it('returns fight for roll between 0.68 and 0.8', () => {
        const s = freshState();
        vi.spyOn(Math, 'random').mockReturnValue(0.79);
        expect(s.rollEventNodeOutcome()).toBe('fight');
      });

      it('returns shop for roll >= 0.8', () => {
        const s = freshState();
        vi.spyOn(Math, 'random').mockReturnValue(0.8);
        expect(s.rollEventNodeOutcome()).toBe('shop');
      });
    });

    describe('pickRandomEventDef', () => {
      it('does not repeat the same event twice in a row when alternatives exist', () => {
        const s = freshState();
        s.currentLevel = 0;
        s.recentEventIds = ['fiakier_event'];
        vi.spyOn(Math, 'random').mockReturnValue(0);

        const next = s.pickRandomEventDef();

        expect(next).not.toBeNull();
        expect(next?.id).not.toBe('fiakier_event');
      });

      it('stores selected event id in recentEventIds', () => {
        const s = freshState();
        s.currentLevel = 0;
        vi.spyOn(Math, 'random').mockReturnValue(0);

        const next = s.pickRandomEventDef();

        expect(next).not.toBeNull();
        expect(s.recentEventIds).toContain(next?.id);
      });

      it('does not repeat the last N-1 events so each event is seen before any repeats', () => {
        const s = freshState();
        s.currentLevel = 0;
        // With 3 act-I events, window = 2; seed recentEventIds with 2 known picks
        s.recentEventIds = ['fiakier_event', 'event_karykaturzysta'];

        const next = s.pickRandomEventDef();

        expect(next).not.toBeNull();
        expect(next?.id).not.toBe('fiakier_event');
        expect(next?.id).not.toBe('event_karykaturzysta');
      });
    });

    describe('event node eventOutcome pre-roll', () => {
      it('event node has eventOutcome property after _createMapNode', () => {
        const s = freshState();
        const node = s._createMapNode('event', 0, 1);
        expect(node).toHaveProperty('eventOutcome');
      });

      it('eventOutcome is event when roll < 0.68', () => {
        const s = freshState();
        vi.spyOn(Math, 'random').mockReturnValue(0.67);
        const node = s._createMapNode('event', 0, 1);
        expect(node.eventOutcome).toBe('event');
      });

      it('eventOutcome is fight when 0.68 <= roll < 0.8', () => {
        const s = freshState();
        vi.spyOn(Math, 'random').mockReturnValue(0.79);
        const node = s._createMapNode('event', 0, 1);
        expect(node.eventOutcome).toBe('fight');
      });

      it('eventOutcome is shop when roll >= 0.8', () => {
        const s = freshState();
        vi.spyOn(Math, 'random').mockReturnValue(0.8);
        const node = s._createMapNode('event', 0, 1);
        expect(node.eventOutcome).toBe('shop');
      });

      it('non-event nodes do not have eventOutcome', () => {
        const s = freshState();
        const node = s._createMapNode('fight', 1, 0);
        expect(node.eventOutcome).toBeUndefined();
      });
    });

    it('starts with 50 Dutki and generated map', () => {
      const s = freshState();
      expect(s.dutki).toBe(50);
      expect(s.map).toHaveLength(15);
      s.map.forEach((level) => {
        expect(level).toHaveLength(3);
      });

      const startNodes = s.map[0].filter(Boolean);
      expect(startNodes).toHaveLength(1);
      expect(s.map[0][0]).toBeNull();
      expect(s.map[0][1]?.type).toBe('maryna');
      expect(s.map[0][2]).toBeNull();
      startNodes.forEach((node) => {
        expect(node?.type).toBe('maryna');
        expect(node?.y).toBe(0);
        expect(node?.x).toBe(1);
      });
      expect(s.map[0][1]?.connections.length).toBeGreaterThanOrEqual(2);

      for (let level = 1; level <= s.map.length - 3; level++) {
        expect(s.map[level].some(Boolean)).toBe(true);
      }

      expect(s.map[Math.floor(s.map.length / 2)][1]?.type).toBe('campfire');
      expect(s.map[s.map.length - 2][1]?.type).toBe('campfire');
      expect(s.map[s.map.length - 1][1]?.type).toBe('boss');

      for (let level = 0; level < s.map.length - 1; level++) {
        s.map[level].forEach((node, x) => {
          if (!node) return;
          expect(node.x).toBe(x);
          expect(node.y).toBe(level);
          if (level === s.map.length - 3) return;
          expect(node.connections.length).toBeGreaterThan(0);
          node.connections.forEach((targetX) => {
            expect(Math.abs(targetX - x)).toBeLessThanOrEqual(1);
            expect(s.map[level + 1][targetX]).not.toBeNull();
          });
        });

        for (let leftX = 0; leftX < 2; leftX++) {
          const leftNode = s.map[level][leftX];
          if (!leftNode) continue;
          for (let rightX = leftX + 1; rightX < 3; rightX++) {
            const rightNode = s.map[level][rightX];
            if (!rightNode) continue;
            leftNode.connections.forEach((leftTarget) => {
              rightNode.connections.forEach((rightTarget) => {
                expect(leftTarget <= rightTarget).toBe(true);
              });
            });
          }
        }
      }

      for (let level = 1; level < s.map.length; level++) {
        s.map[level].forEach((node, x) => {
          if (!node) return;
          const hasInbound = s.map[level - 1].some((prevNode) => prevNode?.connections.includes(x));
          expect(hasInbound).toBe(true);
        });
      }

      s.map[s.map.length - 3].forEach((node) => {
        if (!node) return;
        expect(node.connections).toEqual([1]);
      });

      const treasureNodes = s.map
        .flatMap((row, y) => row.map((node, x) => ({ node, x, y })))
        .filter(({ node }) => node?.type === 'treasure');
      expect(treasureNodes).toHaveLength(1);
      expect(treasureNodes[0].x).toBe(1);
      expect(treasureNodes[0].y).toBeGreaterThanOrEqual(3);
      expect(treasureNodes[0].y).toBeLessThanOrEqual(5);

      const queue = [{ x: 1, y: 0 }];
      const seen = new Set();
      const reachableTypes = new Set();
      while (queue.length > 0) {
        const current = queue.shift();
        const key = `${current.x},${current.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const node = s.map[current.y]?.[current.x];
        if (!node) continue;
        reachableTypes.add(node.type);
        node.connections.forEach((targetX) => {
          if (s.map[current.y + 1]?.[targetX]) {
            queue.push({ x: targetX, y: current.y + 1 });
          }
        });
      }

      expect(reachableTypes.has('treasure')).toBe(true);

      const allNodes = s.map.flat().filter(Boolean);
      const shopCount = allNodes.filter((node) => node.type === 'shop').length;
      const treasureCount = allNodes.filter((node) => node.type === 'treasure').length;
      const eliteCount = allNodes.filter((node) => node.type === 'elite').length;
      const earliestElite = allNodes
        .filter((node) => node.type === 'elite')
        .reduce((min, node) => Math.min(min, node.y), Infinity);
      expect(shopCount).toBeLessThanOrEqual(3);
      expect(treasureCount).toBe(1);
      expect(eliteCount).toBeGreaterThanOrEqual(1);
      expect(earliestElite).toBeGreaterThanOrEqual(4);
    });

    it('battle reward grants 28-36 Dutki only once per battle', () => {
      const s = freshState();
      s.dutki = 0;
      const first = s.grantBattleDutki();
      const second = s.grantBattleDutki();
      expect(first).toBeGreaterThanOrEqual(28);
      expect(first).toBeLessThanOrEqual(36);
      expect(second).toBe(0);
      expect(s.dutki).toBe(first);
    });

    it('guarantees at least one reachable true event on map', () => {
      const s = freshState();

      const queue = [{ x: 1, y: 0 }];
      const seen = new Set();
      let hasReachableTrueEvent = false;

      while (queue.length > 0) {
        const current = queue.shift();
        const key = `${current.x},${current.y}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const node = s.map[current.y]?.[current.x];
        if (!node) continue;

        if (node.type === 'event' && node.eventOutcome === 'event') {
          hasReachableTrueEvent = true;
          break;
        }

        node.connections.forEach((targetX) => {
          if (s.map[current.y + 1]?.[targetX]) {
            queue.push({ x: targetX, y: current.y + 1 });
          }
        });
      }

      expect(hasReachableTrueEvent).toBe(true);
    });

    it('removeCrossingConnections swaps targets to remove local crossings', () => {
      const s = freshState();
      /** @type {Array<Array<any>>} */
      const map = [
        [
          {
            x: 0,
            y: 0,
            type: 'fight',
            label: 'Bitka',
            emoji: '⚔️',
            weather: 'clear',
            connections: [1],
          },
          {
            x: 1,
            y: 0,
            type: 'fight',
            label: 'Bitka',
            emoji: '⚔️',
            weather: 'clear',
            connections: [0],
          },
          null,
        ],
        [
          {
            x: 0,
            y: 1,
            type: 'fight',
            label: 'Bitka',
            emoji: '⚔️',
            weather: 'clear',
            connections: [],
          },
          {
            x: 1,
            y: 1,
            type: 'fight',
            label: 'Bitka',
            emoji: '⚔️',
            weather: 'clear',
            connections: [],
          },
          null,
        ],
      ];

      s._removeCrossingConnections(map);

      expect(map[0][0].connections).toEqual([0]);
      expect(map[0][1].connections).toEqual([1]);
    });

    it('does not allow travelling to later nodes before the first fight starts', () => {
      const s = freshState();
      const startNode = s.map[0][1];
      expect(startNode).not.toBeNull();

      startNode.connections.forEach((targetX) => {
        expect(s.canTravelTo(1, targetX)).toBe(false);
        expect(s.travelTo(1, targetX)).toBeNull();
      });
    });

    it('spendDutki returns false when funds are insufficient', () => {
      const s = freshState();
      s.dutki = 10;
      expect(s.spendDutki(75)).toBe(false);
      expect(s.dutki).toBe(10);
    });

    it('all cards expose numeric shop price', () => {
      Object.values(cardLibrary).forEach((card) => {
        expect(typeof card.price).toBe('number');
        expect(card.price).toBeGreaterThan(0);
      });
    });

    it('all cards expose supported rarity values', () => {
      Object.values(cardLibrary).forEach((card) => {
        expect(['common', 'uncommon', 'rare']).toContain(card.rarity);
      });
    });

    it('shop stock excludes starter cards', () => {
      const s = freshState();
      const stock = s.generateShopStock();
      stock.cards.forEach((cardId) => {
        expect(cardLibrary[cardId]?.isStarter).not.toBe(true);
      });
    });

    it('shop stock excludes event-only cards and relics', () => {
      const s = freshState();

      for (let i = 0; i < 40; i += 1) {
        const stock = s.generateShopStock();
        stock.cards.forEach((cardId) => {
          expect(cardLibrary[cardId]?.eventOnly).not.toBe(true);
        });
        if (stock.relic) {
          expect(relicLibrary[stock.relic]?.eventOnly).not.toBe(true);
        }
      }
    });

    it('assigns weather to combat nodes and halny to boss node', () => {
      const s = freshState();
      const weatherIds = ['clear', 'halny', 'frozen', 'fog'];
      s.map.forEach((level) => {
        level.forEach((node) => {
          if (!node) return;
          if (node.type === 'fight' || node.type === 'elite') {
            expect(weatherIds).toContain(node.weather);
          }
          if (node.type === 'boss') {
            expect(node.weather).toBe('halny');
          }
        });
      });
    });

    it('all relics expose numeric shop price', () => {
      Object.values(relicLibrary)
        .filter((relic) => !relic.marynaOnly)
        .forEach((relic) => {
          expect(typeof relic.price).toBe('number');
          expect(relic.price).toBeGreaterThan(0);
        });
    });

    it('all relics expose supported rarity values', () => {
      Object.values(relicLibrary).forEach((relic) => {
        expect(['common', 'uncommon', 'rare']).toContain(relic.rarity);
      });
    });

    it('relic prices stay within rarity price bands', () => {
      const ranges = {
        common: { min: 80, max: 120 },
        uncommon: { min: 150, max: 200 },
        rare: { min: 250, max: 350 },
      };

      Object.values(relicLibrary)
        .filter((relic) => !relic.marynaOnly)
        .forEach((relic) => {
          const range = ranges[relic.rarity];
          expect(relic.price).toBeGreaterThanOrEqual(range.min);
          expect(relic.price).toBeLessThanOrEqual(range.max);
        });
    });

    it('fiakier event heal choice costs 30 and heals up to max HP', () => {
      const s = freshState();
      s.setActiveEvent('fiakier_event');
      s.player.hp = 40;
      s.dutki = 50;

      const result = s.applyActiveEventChoice(0);

      expect(result.success).toBe(true);
      expect(s.player.hp).toBe(50);
      expect(s.dutki).toBe(20);
    });

    it('fiakier event rejects choice if player cannot afford the cost', () => {
      const s = freshState();
      s.setActiveEvent('fiakier_event');
      s.dutki = 9;

      const result = s.applyActiveEventChoice(1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Nie masz tylu dutków.');
      expect(s.dutki).toBe(9);
    });

    it('fiakier event defines low-dutki fallback fight against pomocnik_fiakra', () => {
      const fallback = eventLibrary.fiakier_event.fallbackFight;
      expect(fallback).toBeTruthy();
      if (!fallback) return;
      expect(fallback.minDutki).toBe(10);
      expect(fallback.enemyId).toBe('pomocnik_fiakra');
    });

    it('fiakier ride choice enables jump-to-boss shortcut and forces main boss', () => {
      const s = freshState();
      s.setActiveEvent('fiakier_event');
      s.dutki = 200;
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      s.hasStartedFirstBattle = true;

      const result = s.applyActiveEventChoice(2);

      expect(result.success).toBe(true);
      expect(s.jumpToBoss).toBe(true);
      expect(s.forceMainBossNextBattle).toBe(true);
      expect(s.dutki).toBe(50);

      const jumped = s.applyJumpToBossShortcut();
      expect(jumped).toBe(true);
      expect(s.currentLevel).toBe(s.map.length - 2);
      expect(s.currentNodeIndex).toBe(1);
      expect(s.jumpToBoss).toBe(false);
    });

    it('karykaturzysta choice 0 spends 25 dutki and grants krzywy_portret', () => {
      const s = freshState();
      s.setActiveEvent('event_karykaturzysta');
      s.dutki = 50;

      const result = s.applyActiveEventChoice(0);

      expect(result.success).toBe(true);
      expect(s.dutki).toBe(25);
      expect(s.hasRelic('krzywy_portret')).toBe(true);
    });

    it('karykaturzysta choice 1 grants furia_turysty card', () => {
      const s = freshState();
      s.setActiveEvent('event_karykaturzysta');

      const result = s.applyActiveEventChoice(1);

      expect(result.success).toBe(true);
      expect(s.deck).toContain('furia_turysty');
    });

    it('karykaturzysta choice 2 loses 5 HP and grants prestiz_na_kredyt card', () => {
      const s = freshState();
      s.setActiveEvent('event_karykaturzysta');
      s.player.hp = 20;

      const result = s.applyActiveEventChoice(2);

      expect(result.success).toBe(true);
      expect(s.player.hp).toBe(15);
      expect(s.deck).toContain('prestiz_na_kredyt');
    });

    it('hazard option 1 win branch grants +45 dutki after paying 20', () => {
      const s = freshState();
      s.setActiveEvent('event_hazard_karton');
      s.dutki = 50;
      vi.spyOn(Math, 'random').mockReturnValue(0.2);

      const result = s.applyActiveEventChoice(0);

      expect(result.success).toBe(true);
      expect(s.dutki).toBe(75);
      expect(result.message).toContain('Wygrana!');
    });

    it('hazard option 1 loss branch adds pocieszenie to deck', () => {
      const s = freshState();
      s.setActiveEvent('event_hazard_karton');
      s.dutki = 50;
      vi.spyOn(Math, 'random').mockReturnValue(0.8);

      const result = s.applyActiveEventChoice(0);

      expect(result.success).toBe(true);
      expect(s.dutki).toBe(30);
      expect(s.deck).toContain('pocieszenie');
      expect(result.message).toContain('Przegrana!');
    });

    it('hazard choices expose consequence descriptions for event UI', () => {
      const hazard = eventLibrary.event_hazard_karton;

      hazard.choices.forEach((choice) => {
        expect(typeof choice.consequence).toBe('string');
        expect(choice.consequence.trim().length).toBeGreaterThan(0);
      });
    });

    it('hazard option 2 adds spostrzegawczosc card', () => {
      const s = freshState();
      s.setActiveEvent('event_hazard_karton');

      const result = s.applyActiveEventChoice(1);

      expect(result.success).toBe(true);
      expect(s.deck).toContain('spostrzegawczosc');
    });

    it('hazard option 3 queues event battle and relic reward', () => {
      const s = freshState();
      s.setActiveEvent('event_hazard_karton');

      const result = s.applyActiveEventChoice(2);
      const queued = s.consumeQueuedEventBattle();

      expect(result.success).toBe(true);
      expect(queued).toEqual({ enemyId: 'naganiacze_duo', rewardRelicId: 'zasluzony_portfel' });
    });

    it('buyItem buys a shop card once and removes it from stock', () => {
      const s = freshState();
      s.dutki = 500;
      s.shopStock = { cards: ['ciupaga'], relic: null };
      const result = s.buyItem(cardLibrary.ciupaga, 'card');
      expect(result.success).toBe(true);
      expect(s.deck).toContain('ciupaga');
      expect(s.shopStock.cards).not.toContain('ciupaga');
      const secondTry = s.buyItem(cardLibrary.ciupaga, 'card');
      expect(secondTry.success).toBe(false);
    });

    it('buyItem rejects purchase when Dutki are insufficient', () => {
      const s = freshState();
      s.dutki = 0;
      s.shopStock = { cards: ['giewont'], relic: null };
      const result = s.buyItem(cardLibrary.giewont, 'card');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Ni mos tela dutków, synek!');
    });

    it('buyItem buys relic and removes it from display slot', () => {
      const s = freshState();
      s.dutki = 500;
      s.shopStock = { cards: [], relic: 'krokus' };
      const result = s.buyItem(relicLibrary.krokus, 'relic');
      expect(result.success).toBe(true);
      expect(s.relics).toContain('krokus');
      expect(s.shopStock.relic).toBeNull();
    });

    it('does not offer the same relic twice across the run', () => {
      const s = freshState();
      const targetRelic = 'krokus';
      s.relics = Object.keys(relicLibrary).filter((id) => id !== targetRelic);

      const firstStock = s.generateShopStock();
      expect(firstStock.relic).toBe(targetRelic);

      const secondStock = s.generateShopStock();
      expect(secondStock.relic).toBeNull();
    });

    it('guarantees papryczka_marka in the first hard-mode shop when available', () => {
      const s = freshState();
      s.difficulty = 'hard';

      const firstStock = s.generateShopStock();
      expect(firstStock.relic).toBe('papryczka_marka');
      expect(s.hardFirstShopRolled).toBe(true);
    });

    it('getRandomItem rolls rarity first, then item from that rarity', () => {
      const s = freshState();
      const pool = ['ciupaga', 'echo', 'giewont'];

      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0);
      const pickedRare = s.getRandomItem(pool, cardLibrary);
      expect(pickedRare).toBe('giewont');

      const pickedCommon = s.getRandomItem(pool, cardLibrary);
      expect(pickedCommon).toBe('ciupaga');
    });

    it('generateCardRewardChoices boosts rare card odds in post-battle rewards', () => {
      const s = freshState();

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.88).mockReturnValueOnce(0);

      const [pickedCardId] = s.generateCardRewardChoices(1);
      expect(cardLibrary[pickedCardId]?.rarity).toBe('rare');
    });

    it('post-battle card rewards exclude event-only cards', () => {
      const s = freshState();

      for (let i = 0; i < 40; i += 1) {
        const choices = s.generateCardRewardChoices(3);
        choices.forEach((cardId) => {
          expect(cardLibrary[cardId]?.eventOnly).not.toBe(true);
        });
      }
    });

    it('relic rewards exclude event-only relics', () => {
      const s = freshState();

      for (let i = 0; i < 40; i += 1) {
        const relicId = s.generateRelicReward(true);
        if (relicId) {
          expect(relicLibrary[relicId]?.eventOnly).not.toBe(true);
          s.addRelic(relicId);
        }
      }
    });

    it('generateRelicChoices excludes event-only and marks offered relics as seen', () => {
      const s = freshState();

      const firstOffer = s.generateRelicChoices(3);
      expect(firstOffer).toHaveLength(3);
      firstOffer.forEach((relicId) => {
        expect(relicLibrary[relicId]?.eventOnly).not.toBe(true);
      });
      firstOffer.forEach((relicId) => {
        expect(s.seenRelicOffers).toContain(relicId);
      });

      const secondOffer = s.generateRelicChoices(3);
      expect(secondOffer).toHaveLength(3);
      secondOffer.forEach((relicId) => {
        expect(firstOffer).not.toContain(relicId);
      });
    });

    it('removeCardFromDeck permanently removes selected card copy', () => {
      const s = freshState();
      s.deck = ['ciupaga', 'gasior'];
      const removed = s.removeCardFromDeck('gasior');
      expect(removed).toBe(true);
      expect(s.deck).not.toContain('gasior');
    });
  });

  describe('cepr - Pytanie o drogę (status action)', () => {
    it('adds 2 ulotka cards to player discard on second loop move', () => {
      const s = freshState();
      s.endTurn();
      expect(s.enemy.currentIntent.name).toBe('Pytanie o drogę');
      s.endTurn();
      expect(s.discard.filter((id) => id === 'ulotka').length).toBeGreaterThanOrEqual(2);
    });

    it('ulotka card is unplayable', () => {
      const s = freshState();
      s.hand = ['ulotka'];
      s.player.energy = 3;
      const result = s.playCard(0);
      expect(result.success).toBe(false);
    });
  });

  describe('busiarz', () => {
    it('starts with Trąbienie na pieszych as first intent', () => {
      const s = freshBusiarzState();
      expect(s.enemy.currentIntent).toEqual({
        type: 'attack',
        name: 'Trąbienie na pieszych',
        damage: 4,
        hits: 2,
      });
    });

    it('gains 1 strength at the end of his turn', () => {
      const s = freshBusiarzState();
      s.endTurn();
      expect(s.enemy.status.strength).toBe(1);
    });

    it('cycles to Wyprzedzanie na trzeciego on second turn', () => {
      const s = freshBusiarzState();
      s.endTurn();
      expect(s.enemy.currentIntent).toEqual({
        type: 'attack',
        name: 'Wyprzedzanie na trzeciego',
        damage: 8,
        hits: 1,
        applyFrail: 2,
      });
    });

    it('gains 10 Garda on Zbieranie kompletu and keeps it for player turn', () => {
      const s = freshBusiarzState();
      s.endTurn();
      s.endTurn();
      expect(s.enemy.currentIntent).toEqual({
        type: 'block',
        name: 'Zbieranie kompletu',
        block: 10,
        heal: 3,
      });
      s.endTurn();
      expect(s.enemy.block).toBe(10);
    });

    it('intent text includes move name and total damage for multi-hit move', () => {
      const s = freshBusiarzState();
      expect(s.getEnemyIntentText()).toBe('Zamiar: Trąbienie na pieszych (⚔️ 8, 2x)');
    });

    it('brak_reszty: steals 3 dutki whenever a hit deals HP damage', () => {
      const s = freshBusiarzState();
      s.dutki = 30;
      s.player.hp = 50;
      s.player.block = 0;
      s.endTurn();
      expect(s.dutki).toBe(24);
    });

    it('brak_reszty: does not steal dutki when all damage is blocked', () => {
      const s = freshBusiarzState();
      s.dutki = 30;
      s.player.block = 999;
      s.endTurn();
      expect(s.dutki).toBe(30);
    });

    it('Zbieranie kompletu heals enemy by 3', () => {
      const s = freshBusiarzState();
      s.endTurn();
      s.endTurn();
      s.enemy.hp = s.enemy.maxHp - 10;
      s.endTurn();
      expect(s.enemy.hp).toBe(s.enemy.maxHp - 7);
    });
  });

  describe('influencerka', () => {
    it('starts with Selfie z zaskoczenia as first intent', () => {
      const s = freshInfluencerkaState();
      expect(s.enemy.currentIntent).toEqual({
        type: 'attack',
        name: 'Selfie z zaskoczenia',
        damage: 12,
        hits: 1,
        applyVulnerable: 2,
      });
    });

    it('cycles to Oznaczenie w relacji on second turn', () => {
      const s = freshInfluencerkaState();
      s.endTurn();
      expect(s.enemy.currentIntent).toEqual({
        type: 'status',
        name: 'Oznaczenie w relacji',
        addStatusCard: 'spam_tagami',
        amount: 2,
      });
    });

    it('Oznaczenie w relacji adds two spam_tagami cards', () => {
      const s = freshInfluencerkaState();
      s.endTurn();
      s.endTurn();
      expect(s.discard.filter((id) => id === 'spam_tagami').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('baba', () => {
    it('starts with Darmowa degustacja as first intent', () => {
      const s = freshBabaState();
      expect(s.enemy.currentIntent).toEqual({
        type: 'block',
        name: 'Darmowa degustacja',
        block: 12,
      });
    });

    it('heals 3 HP at end of player turn if she took no HP damage', () => {
      const s = freshBabaState();
      s.enemy.hp = 40;
      const result = s.endTurn();
      expect(s.enemy.hp).toBe(43);
      expect(result.enemyPassiveHeal).toEqual({ amount: 3, text: '+3 Krzepy (Świeży oscypek)' });
    });

    it('does not heal at end of player turn if she took HP damage', () => {
      const s = freshBabaState();
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.hand = ['ciupaga'];
      s.playCard(0);
      const hpAfterHit = s.enemy.hp;
      const result = s.endTurn();
      expect(s.enemy.hp).toBe(hpAfterHit);
      expect(result.enemyPassiveHeal).toBeNull();
    });

    it('applies weak:1 on Cena z kosmosu', () => {
      const s = freshBabaState();
      s.endTurn();
      expect(s.enemy.currentIntent).toEqual({
        type: 'attack',
        name: 'Cena z kosmosu',
        damage: 8,
        hits: 1,
        applyWeak: 1,
      });
      s.endTurn();
      expect(s.player.status.weak).toBe(1);
    });

    it('resets tookHpDamageThisTurn at startTurn', () => {
      const s = freshBabaState();
      s.enemy.tookHpDamageThisTurn = true;
      s.startTurn();
      expect(s.enemy.tookHpDamageThisTurn).toBe(false);
    });

    it('exposes special healing status description for UI', () => {
      const s = freshBabaState();
      const statuses = s.getEnemySpecialStatuses();
      const babaStatus = statuses.find((item) => item.label === 'Świeży oscypek');
      expect(babaStatus).toBeTruthy();
      expect(babaStatus?.tooltip).toContain('leczy 3 Krzepy');
    });

    it('targowanie_sie: immune to bankruptcy — rachunek does not kill her', () => {
      const s = freshBabaState();
      s.enemy.hp = 20;
      s.enemy.rachunek = 50;
      s._checkEnemyBankruptcy();
      expect(s.checkWinCondition()).not.toBe('player_win');
      expect(s.enemy.hp).toBe(20);
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
      s.player.hp = 50;
      s.player.block = 0;
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      s.endTurn();
      expect(s.player.hp).toBe(42);
    });
    it('enemy attack is reduced by Góral Garda', () => {
      const s = freshState();
      s.player.hp = 50;
      s.player.block = 5;
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      s.endTurn();
      expect(s.player.block).toBe(0);
      expect(s.player.hp).toBe(47);
    });
    it('enemy attack is fully blocked', () => {
      const s = freshState();
      s.player.hp = 50;
      s.player.block = 10;
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      s.endTurn();
      expect(s.player.block).toBe(2);
      expect(s.player.hp).toBe(50);
    });
    it('returns correct damage breakdown', () => {
      const s = freshState();
      s.player.block = 3;
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      const result = s.endTurn();
      expect(result.enemyAttack.raw).toBe(8);
      expect(result.enemyAttack.blocked).toBe(3);
      expect(result.enemyAttack.dealt).toBe(5);
    });
    it('resets Ceper Garda after enemy attack', () => {
      const s = freshState();
      s.enemy.block = 5;
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      s.endTurn();
      expect(s.enemy.block).toBe(0);
    });
    it('rolls next Ceper intent from the loop pattern', () => {
      const s = freshState();
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      s.endTurn();
      expect(['attack', 'status']).toContain(s.enemy.currentIntent.type);
    });
  });

  // ── startTurn ─────────────────────────────────────────────────────────────
  describe('startTurn', () => {
    it('restores Oscypki to maxEnergy', () => {
      const s = freshState(0);
      s.hand = [];
      s.deck = [];
      s.startTurn();
      expect(s.player.energy).toBe(s.player.maxEnergy);
    });
    it('resets Góral Garda to 0', () => {
      const s = freshState();
      s.hand = [];
      s.deck = [];
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

  // ── resetBattle ───────────────────────────────────────────────────────────
  describe('resetBattle', () => {
    it('keeps enemy base stats from library on regular nodes', () => {
      const s = freshState();
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.cepr);
      s.resetBattle();
      expect(s.enemy.id).toBe('cepr');
      expect(s.enemy.maxHp).toBe(enemyLibrary.cepr.maxHp);
      expect(s.enemy.baseAttack).toBe(enemyLibrary.cepr.baseAttack);
    });

    it('does not heal player between battles', () => {
      const s = freshState();
      s.player.hp = 30;
      s.resetBattle();
      expect(s.player.hp).toBe(30);
    });

    it('clears blocks and all statuses on both sides', () => {
      const s = freshState();
      s.player.block = 9;
      s.enemy.block = 6;
      s.player.status = {
        strength: 2,
        weak: 3,
        fragile: 1,
        vulnerable: 0,
        next_double: true,
        energy_next_turn: 1,
        lans: 1,
        duma_podhala: 1,
        furia_turysty: 1,
      };
      s.enemy.status = {
        strength: 4,
        weak: 2,
        fragile: 2,
        vulnerable: 0,
        next_double: true,
        energy_next_turn: 0,
        lans: 0,
        duma_podhala: 0,
        furia_turysty: 0,
      };

      s.resetBattle();

      expect(s.player.block).toBe(0);
      expect(s.enemy.block).toBe(0);
      expect(s.player.status).toEqual({
        strength: 0,
        weak: 0,
        fragile: 0,
        vulnerable: 0,
        next_double: false,
        energy_next_turn: 0,
        lans: 0,
        duma_podhala: 0,
        furia_turysty: 0,
      });
      expect(s.enemy.status).toEqual({
        strength: 0,
        weak: 0,
        fragile: 0,
        vulnerable: 0,
        next_double: false,
        energy_next_turn: 0,
        lans: 0,
        duma_podhala: 0,
        furia_turysty: 0,
      });
    });

    it('moves hand/discard/exhaust back to deck and starts next turn', () => {
      const s = freshState();
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.cepr);
      s.deck = ['ciupaga', 'gasior', 'kierpce'];
      s.hand = ['giewont', 'hej'];
      s.discard = ['sandaly'];
      s.exhaust = ['sernik'];

      s.resetBattle();

      expect(s.hand).toHaveLength(5);
      expect(s.discard).toHaveLength(0);
      expect(s.exhaust).toHaveLength(0);
      expect(s.deck.length + s.hand.length).toBe(7);
    });

    it('restores enemy hp to new maxHp and rerolls intent', () => {
      const s = freshState();
      s.enemy.hp = 1;
      s.resetBattle();
      expect(s.enemy.hp).toBe(s.enemy.maxHp);
      if (s.enemy.patternType === 'random') {
        const min = s.enemy.baseAttack - 3;
        const max = s.enemy.baseAttack + 2;
        expect(s.enemy.nextAttack).toBeGreaterThanOrEqual(min);
        expect(s.enemy.nextAttack).toBeLessThanOrEqual(max);
      }
    });

    it('can load Busiarz from the enemy library after victory', () => {
      const s = freshState();
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.busiarz);
      s.resetBattle();
      expect(s.enemy.id).toBe('busiarz');
      expect(s.enemy.name).toBe('Wąsaty Busiarz');
      expect(s.enemy.maxHp).toBe(65);
    });

    it('can load Babę from the enemy library after victory', () => {
      const s = freshState();
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.baba);
      s.resetBattle();
      expect(s.enemy.id).toBe('baba');
      expect(s.enemy.name).toBe('Handlara oscypkami');
      expect(s.enemy.maxHp).toBe(88);
    });

    it('can load Parkingowego from the enemy library with lowered HP', () => {
      const s = freshState();
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.parkingowy);
      s.resetBattle();
      expect(s.enemy.id).toBe('parkingowy');
      expect(s.enemy.name).toBe('Parkingowy z Palenicy');
      expect(s.enemy.maxHp).toBe(95);
    });

    it('does not repeat the same regular enemy twice in a row when alternatives exist', () => {
      const s = freshState();
      s.lastRegularEnemyId = 'cepr';
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const next = s._pickRandomEnemyDef();

      expect(next.id).not.toBe('cepr');
    });

    it('never rolls event-only enemies in regular map battles', () => {
      const s = freshState();

      for (let i = 0; i < 40; i += 1) {
        const next = s._pickRandomEnemyDef();
        expect(enemyLibrary[next.id]?.eventOnly).not.toBe(true);
      }
    });

    it('elite pool pick only returns enemies marked as elite', () => {
      const s = freshState();
      const elite = s._pickRandomEnemyDef(true);
      expect(Boolean(enemyLibrary[elite.id]?.elite)).toBe(true);
    });

    it('event-node battles always use regular enemy pool (never elite pool)', () => {
      const s = freshState();
      s.map = [
        [
          null,
          {
            x: 1,
            y: 0,
            type: 'fight',
            label: 'Bitka',
            emoji: '⚔️',
            weather: 'clear',
            connections: [1],
          },
          null,
        ],
        [
          null,
          {
            x: 1,
            y: 1,
            type: 'event',
            label: 'Wydarzenie',
            emoji: '❓',
            weather: 'clear',
            connections: [],
          },
          null,
        ],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      const picker = vi.spyOn(s, '_pickRandomEnemyDef');

      s.resetBattle();

      expect(picker).toHaveBeenCalledWith(false);
    });

    it('elite node battles use elite enemy pool', () => {
      const s = freshState();
      s.map = [
        [
          null,
          {
            x: 1,
            y: 0,
            type: 'fight',
            label: 'Bitka',
            emoji: '⚔️',
            weather: 'clear',
            connections: [1],
          },
          null,
        ],
        [
          null,
          {
            x: 1,
            y: 1,
            type: 'elite',
            label: 'Elita',
            emoji: '🗡️',
            weather: 'clear',
            connections: [],
          },
          null,
        ],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };

      s.resetBattle();

      expect(s.enemy.isElite).toBe(true);
    });

    it('elite enemies are scaled up and grant higher Dutki reward', () => {
      const s = freshState();
      const eliteState = s._createEnemyState(enemyLibrary.spekulant);
      expect(eliteState.isElite).toBe(true);
      expect(eliteState.maxHp).toBe(Math.round(92 * 1.25));

      s.enemy = eliteState;
      s.pendingBattleDutki = true;
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const drop = s.grantBattleDutki();
      expect(drop).toBe(42);
    });

    it('can start scripted battle against pomocnik_fiakra', () => {
      const s = freshState();
      const started = s.startBattleWithEnemyId('pomocnik_fiakra');

      expect(started).toBe(true);
      expect(s.enemy.id).toBe('pomocnik_fiakra');
      expect(s.enemy.maxHp).toBe(58);
      expect(s.pendingBattleDutki).toBe(true);
    });

    it('can start event battle with context and pending reward relic', () => {
      const s = freshState();
      const started = s.startBattleWithEnemyId('naganiacze_duo', {
        battleContext: 'event',
        rewardRelicId: 'zasluzony_portfel',
      });

      expect(started).toBe(true);
      expect(s.battleContext).toBe('event');
      expect(s.consumePendingEventVictoryRelicReward()).toBe('zasluzony_portfel');
      expect(s.consumePendingEventVictoryRelicReward()).toBeNull();
    });

    it('naganiacze transition triggers once at hp <= 40 and applies phase buff', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.naganiacze_duo);
      s.enemy.status.weak = 2;
      s.enemy.status.fragile = 2;
      s.enemy.status.vulnerable = 2;
      s.enemy.hp = 41;
      s.enemy.block = 0;
      s.player.status.strength = 0;

      s._applyDamageToEnemy(1);

      expect(s.enemy.phaseTwoTriggered).toBe(true);
      expect(s.enemy.status.weak).toBe(0);
      expect(s.enemy.status.fragile).toBe(0);
      expect(s.enemy.status.vulnerable).toBe(0);
      expect(s.enemy.status.strength).toBe(2);
      expect(s.enemy.block).toBe(8);
      expect(s.consumeEnemyPhaseTransitionMessage()).toContain('Seba ucieka');

      const strengthAfterFirstTrigger = s.enemy.status.strength;
      s._applyDamageToEnemy(1);
      expect(s.enemy.status.strength).toBe(strengthAfterFirstTrigger);
      expect(s.consumeEnemyPhaseTransitionMessage()).toBeNull();
    });

    it('naganiacze steal only when hit is unblocked', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.naganiacze_duo);
      s.dutki = 20;
      setEnemyIntent(s, {
        type: 'attack',
        name: 'Szybkie Palce',
        damage: 4,
        hits: 2,
        stealDutki: 2,
      });

      s.player.block = 8;
      s.endTurn();
      expect(s.dutki).toBe(20);

      setEnemyIntent(s, {
        type: 'attack',
        name: 'Szybkie Palce',
        damage: 4,
        hits: 2,
        stealDutki: 2,
      });
      s.player.block = 0;
      s.endTurn();
      expect(s.dutki).toBe(18);
    });

    it('enemy evasion charge cancels next incoming player attack', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.naganiacze_duo);
      s.enemy.evasionCharges = 1;
      s.enemy.hp = 40;

      const first = s._applyDamageToEnemy(10);
      expect(first.dealt).toBe(0);
      expect(s.enemy.hp).toBe(40);
      expect(s.consumeEnemyEvasionEvent()).toBe(true);

      const second = s._applyDamageToEnemy(10);
      expect(second.dealt).toBe(10);
      expect(s.enemy.hp).toBe(30);
    });

    it('pomocnik_fiakra victory grants standard 28-36 dutki range', () => {
      const s = freshState();
      s.startBattleWithEnemyId('pomocnik_fiakra');
      s.pendingBattleDutki = true;
      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      const drop = s.grantBattleDutki();

      expect(drop).toBeGreaterThanOrEqual(28);
      expect(drop).toBeLessThanOrEqual(36);
    });

    it('spawns Król Krupówek on boss node when boss variant is rolled', () => {
      const s = freshState();
      s.map = [
        [null, { x: 1, y: 0, type: 'fight', label: 'Bitka', emoji: '⚔️', connections: [1] }, null],
        [null, { x: 1, y: 1, type: 'boss', label: 'Boss', emoji: '👑', connections: [] }, null],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      vi.spyOn(Math, 'random').mockReturnValue(0);
      s.resetBattle();
      expect(s.enemy.id).toBe('boss');
      expect(s.enemy.name).toBe('Król Krupówek - Biały Misiek (Zdzisiek)');
      expect(s.enemy.maxHp).toBe(180);
      expect(s.enemy.bossArtifact).toBe(2);
    });

    it('spawns Fiakier on boss node when fiakier variant is rolled', () => {
      const s = freshState();
      s.map = [
        [null, { x: 1, y: 0, type: 'fight', label: 'Bitka', emoji: '⚔️', connections: [1] }, null],
        [null, { x: 1, y: 1, type: 'boss', label: 'Boss', emoji: '👑', connections: [] }, null],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      s.resetBattle();
      expect(s.enemy.id).toBe('fiakier');
      expect(s.enemy.name).toBe('Fiakier spod Krupówek');
      expect(s.enemy.maxHp).toBe(180);
      expect(s.enemy.bossArtifact).toBe(0);
    });

    it('gives Król Krupówek 330 HP on hard mode', () => {
      const s = freshState();
      s.difficulty = 'hard';
      s.map = [
        [null, { x: 1, y: 0, type: 'fight', label: 'Bitka', emoji: '⚔️', connections: [1] }, null],
        [null, { x: 1, y: 1, type: 'boss', label: 'Boss', emoji: '👑', connections: [] }, null],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      vi.spyOn(Math, 'random').mockReturnValue(0);
      s.resetBattle();
      expect(s.enemy.id).toBe('boss');
      expect(s.enemy.maxHp).toBe(330);
    });

    it('gives Fiakier 330 HP on hard mode', () => {
      const s = freshState();
      s.difficulty = 'hard';
      s.map = [
        [null, { x: 1, y: 0, type: 'fight', label: 'Bitka', emoji: '⚔️', connections: [1] }, null],
        [null, { x: 1, y: 1, type: 'boss', label: 'Boss', emoji: '👑', connections: [] }, null],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      s.resetBattle();
      expect(s.enemy.id).toBe('fiakier');
      expect(s.enemy.maxHp).toBe(330);
    });

    it('enemy library includes final boss definition', () => {
      const ids = Object.keys(enemyLibrary).sort();
      expect(ids).toEqual([
        'baba',
        'boss',
        'busiarz',
        'cepr',
        'ceprzyca_vip',
        'fiakier',
        'influencerka',
        'konik_spod_kuznic',
        'mistrz_redyku',
        'naganiacz_z_krupowek',
        'naganiacze_duo',
        'parkingowy',
        'pomocnik_fiakra',
        'spekulant',
        'zagubiony_ceper',
      ]);
    });

    it('event library includes fiakier event definition', () => {
      const ids = Object.keys(eventLibrary).sort();
      expect(ids).toEqual(['event_hazard_karton', 'event_karykaturzysta', 'fiakier_event']);
    });

    it('does not scale enemies in normal mode', () => {
      const s = freshState();
      s.difficulty = 'normal';
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.cepr);
      s.resetBattle();
      expect(s.enemyScaleFactor).toBe(1.0);
      expect(s.enemy.maxHp).toBe(enemyLibrary.cepr.maxHp);
      expect(s.enemy.baseAttack).toBe(enemyLibrary.cepr.baseAttack);
    });

    it('increases enemyScaleFactor by ~10% on each win in hard mode', () => {
      const s = freshState();
      s.difficulty = 'hard';
      vi.spyOn(Math, 'random').mockReturnValue(0);
      s.resetBattle();
      expect(s.enemyScaleFactor).toBeCloseTo(1.1, 5);
      s.resetBattle();
      expect(s.enemyScaleFactor).toBeCloseTo(1.21, 5);
    });

    it('applies scale factor to enemy HP and baseAttack in hard mode', () => {
      const s = freshState();
      s.difficulty = 'hard';
      s.enemyScaleFactor = 1.1;
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.cepr);
      s.resetBattle(); // increments scale to 1.21, then creates enemy with that scale
      expect(s.enemy.maxHp).toBe(Math.round(enemyLibrary.cepr.maxHp * 1.21));
      expect(s.enemy.baseAttack).toBe(Math.round(enemyLibrary.cepr.baseAttack * 1.21));
    });

    it('boss has 330 HP on hard mode when boss variant is rolled', () => {
      const s = freshState();
      s.difficulty = 'hard';
      s.map = [
        [null, { x: 1, y: 0, type: 'fight', label: 'Bitka', emoji: '⚔️', connections: [1] }, null],
        [null, { x: 1, y: 1, type: 'boss', label: 'Boss', emoji: '👑', connections: [] }, null],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      vi.spyOn(Math, 'random').mockReturnValue(0);
      s.resetBattle();
      expect(s.enemy.id).toBe('boss');
      expect(s.enemy.maxHp).toBe(330);
    });
  });

  describe('boss - Król Krupówek', () => {
    /** @returns {GameState} */
    function freshBossState() {
      const s = new GameState({ ...mockPlayer }, enemyLibrary.boss);
      s.player.energy = 3;
      s.hand = [];
      s.deck = [];
      s.discard = [];
      return s;
    }

    it('blocks first two debuffs with artifact', () => {
      const s = freshBossState();
      s.applyEnemyDebuff('weak', 2);
      s.applyEnemyDebuff('weak', 2);
      expect(s.enemy.status.weak).toBe(0);
      expect(s.enemy.bossArtifact).toBe(0);
      s.applyEnemyDebuff('weak', 2);
      expect(s.enemy.status.weak).toBe(2);
    });

    it('Agresywne pozowanie now deals 4x3', () => {
      const s = freshBossState();
      s.endTurn();
      expect(s.enemy.currentIntent.type).toBe('attack');
      expect(s.enemy.currentIntent.name).toBe('Agresywne pozowanie');
      expect(s.enemy.currentIntent.damage).toBe(4);
      expect(s.enemy.currentIntent.hits).toBe(3);
    });

    it('first intent is Górski Ryk (buff)', () => {
      const s = freshBossState();
      expect(s.enemy.currentIntent.type).toBe('buff');
      expect(s.enemy.currentIntent.name).toBe('Górski Ryk');
    });

    it('Górski Ryk gives +2 strength and +10 block when executed', () => {
      const s = freshBossState();
      s.endTurn();
      expect(s.enemy.status.strength).toBe(2);
      expect(s.enemy.block).toBeGreaterThanOrEqual(10);
    });

    it('second intent is Agresywne pozowanie (3-hit attack)', () => {
      const s = freshBossState();
      s.endTurn();
      expect(s.enemy.currentIntent.type).toBe('attack');
      expect(s.enemy.currentIntent.name).toBe('Agresywne pozowanie');
      expect(s.enemy.currentIntent.hits).toBe(3);
    });

    it('fourth intent is Uścisk Krupówek with reduced spike damage (20)', () => {
      const s = freshBossState();
      s.endTurn(); // execute Górski Ryk -> intent 2
      s.endTurn(); // execute Agresywne pozowanie -> intent 3
      s.endTurn(); // execute Podatek od zdjęcia -> intent 4
      expect(s.enemy.currentIntent.type).toBe('attack');
      expect(s.enemy.currentIntent.name).toBe('Uścisk Krupówek');
      expect(s.enemy.currentIntent.damage).toBe(20);
      expect(s.enemy.currentIntent.hits).toBe(1);
    });

    it('ochrona_wizerunku deals 1 thorns to player per attack hit', () => {
      const s = freshBossState();
      s.player.hp = 50;
      s.enemy.hp = 300;
      s.enemy.block = 0;
      s.hand = ['ciupaga'];
      s.player.energy = 3;
      s.playCard(0);
      expect(s.player.hp).toBe(49);
    });

    it('ochrona_wizerunku still triggers when boss fully blocks an attack', () => {
      const s = freshBossState();
      s.player.hp = 50;
      s.player.block = 5;
      s.enemy.hp = 300;
      s.enemy.block = 999;
      s.hand = ['ciupaga'];
      s.player.energy = 3;
      s.playCard(0);
      expect(s.player.block).toBe(4);
      expect(s.player.hp).toBe(50);
    });

    it('ochrona_wizerunku takes garda first if player has block', () => {
      const s = freshBossState();
      s.player.hp = 50;
      s.player.block = 5;
      s.enemy.hp = 300;
      s.enemy.block = 0;
      s.hand = ['ciupaga'];
      s.player.energy = 3;
      s.playCard(0);
      expect(s.player.block).toBe(4);
      expect(s.player.hp).toBe(50);
    });

    it('ochrona_wizerunku takes HP only when player has 0 garda', () => {
      const s = freshBossState();
      s.player.hp = 50;
      s.player.block = 0;
      s.enemy.hp = 300;
      s.enemy.block = 0;
      s.hand = ['ciupaga'];
      s.player.energy = 3;
      s.playCard(0);
      expect(s.player.block).toBe(0);
      expect(s.player.hp).toBe(49);
    });
  });

  describe('elite passives', () => {
    it('lichwa does not steal Dutki when only Garda is damaged', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.spekulant);
      s.enemy.block = 99;
      s.dutki = 50;
      s.combat.activeSide = 'player';

      s._applyDamageToEnemy(6);

      expect(s.enemy.hp).toBe(s.enemy.maxHp);
      expect(s.dutki).toBe(50);
      expect(s.enemy.lichwaTriggeredThisTurn).toBe(false);
    });

    it('lichwa steals once per player turn and can trigger again next turn', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.spekulant);
      s.enemy.block = 0;
      s.dutki = 50;
      s.combat.activeSide = 'player';

      s._applyDamageToEnemy(3);
      s._applyDamageToEnemy(3);
      expect(s.dutki).toBe(47);
      expect(s.enemy.lichwaTriggeredThisTurn).toBe(true);

      s.startTurn();
      s.combat.activeSide = 'player';
      s._applyDamageToEnemy(3);
      expect(s.dutki).toBe(44);
    });

    it('hart_ducha triggers exactly once after dropping below 50% HP', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.mistrz_redyku);
      s.enemy.block = 0;
      s.combat.activeSide = 'player';

      const baseStrength = s.enemy.status.strength;
      const triggerDamage = Math.floor(s.enemy.maxHp / 2) + 1;
      s._applyDamageToEnemy(triggerDamage);

      expect(s.enemy.hartDuchaTriggered).toBe(true);
      expect(s.enemy.status.strength).toBe(baseStrength + 3);
      expect(s.enemy.block).toBe(10);

      const blockBeforeSecondHit = s.enemy.block;
      s._applyDamageToEnemy(1);
      expect(s.enemy.status.strength).toBe(baseStrength + 3);
      expect(s.enemy.block).toBe(blockBeforeSecondHit - 1);
    });

    it('hart_ducha does not trigger at or above 50% HP threshold', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.mistrz_redyku);
      s.enemy.block = 0;
      s.combat.activeSide = 'player';

      const damageToHalf = Math.floor(s.enemy.maxHp / 2);
      s._applyDamageToEnemy(damageToHalf);

      expect(s.enemy.hp).toBeGreaterThanOrEqual(s.enemy.maxHp * 0.5);
      expect(s.enemy.hartDuchaTriggered).toBe(false);
      expect(s.enemy.status.strength).toBe(0);
    });

    it('mistrz_redyku intent damage grows after hart_ducha triggers', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.mistrz_redyku);
      s.player.block = 0;
      s.combat.activeSide = 'player';

      s.enemy.currentIntent = {
        type: 'attack',
        name: 'Redyk przez dolinę',
        damage: 4,
        hits: 3,
      };
      const damageBefore = s.getEnemyIntentDamage();

      const triggerDamage = Math.floor(s.enemy.maxHp / 2) + 1;
      s.enemy.block = 0;
      s._applyDamageToEnemy(triggerDamage);

      const damageAfter = s.getEnemyIntentDamage();
      expect(s.enemy.hartDuchaTriggered).toBe(true);
      expect(damageAfter).toBeGreaterThan(damageBefore);
    });
  });

  describe('Maryna boon system', () => {
    it('map row 0 has a single maryna node at column 1', () => {
      const s = freshState();
      expect(s.map[0][0]).toBeNull();
      expect(s.map[0][1]?.type).toBe('maryna');
      expect(s.map[0][2]).toBeNull();
    });

    it('all non-null row-1 nodes are fights with forcedEnemyId cepr', () => {
      const s = freshState();
      s.map[1].forEach((node) => {
        if (!node) return;
        expect(node.type).toBe('fight');
        expect(node.forcedEnemyId).toBe('cepr');
      });
    });

    it('rollMarynaChoices returns 3 unique boon IDs', () => {
      const s = freshState();
      const ids = s.rollMarynaChoices(3);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      ids.forEach((id) => expect(marynaBoonLibrary[id]).toBeTruthy());
    });

    it('pickMarynaBoon stores pickedId and adds relic', () => {
      const s = freshState();
      const boonId = 'kiesa';
      const result = s.pickMarynaBoon(boonId);
      expect(result).toBe(true);
      expect(s.maryna.pickedId).toBe(boonId);
      expect(s.hasRelic('relic_boon_kiesa')).toBe(true);
    });

    it('pickMarynaBoon blocks a second pick', () => {
      const s = freshState();
      s.pickMarynaBoon('kiesa');
      const second = s.pickMarynaBoon('mokra_sciera');
      expect(second).toBe(false);
      expect(s.maryna.pickedId).toBe('kiesa');
    });

    it('pickMarynaBoon rejects unknown boon id', () => {
      const s = freshState();
      const result = s.pickMarynaBoon('nie_ma_takiej_wyprawki');
      expect(result).toBe(false);
      expect(s.maryna.pickedId).toBeNull();
    });

    it('mokra_sciera grants +12 max HP immediately', () => {
      const s = freshState();
      const before = s.player.maxHp;
      s.pickMarynaBoon('mokra_sciera');
      expect(s.player.maxHp).toBe(before + 12);
    });

    it('kiesa grants +80 dutki immediately', () => {
      const s = freshState();
      s.dutki = 0;
      s.pickMarynaBoon('kiesa');
      expect(s.dutki).toBe(80);
    });

    it('sloik_rosolu sets rosolBattlesLeft to 3', () => {
      const s = freshState();
      s.pickMarynaBoon('sloik_rosolu');
      expect(s.maryna.counters.rosolBattlesLeft).toBe(3);
    });

    it('zloty_rozaniec doubles only the first attack in a battle', () => {
      const s = freshState();
      s.pickMarynaBoon('zloty_rozaniec');
      s.startBattleWithEnemyId('cepr');

      const first = s._calcAttackDamage(s.player, 10);
      const second = s._calcAttackDamage(s.player, 10);

      expect(first).toBe(20);
      expect(second).toBe(10);
    });

    it('przeglad_plecaka removes a starter and adds an uncommon card', () => {
      const s = freshState();
      s.deck = ['ciupaga', 'ciupaga', 'gasior'];
      s.pickMarynaBoon('przeglad_plecaka');
      const remainingStarters = s.deck.filter((id) =>
        ['ciupaga', 'gasior', 'kierpce', 'hej'].includes(id)
      );
      expect(remainingStarters).toHaveLength(2);
      const uncommons = s.deck.filter((id) => cardLibrary[id]?.rarity === 'uncommon');
      expect(uncommons).toHaveLength(1);
    });

    it('marynaOnly relics are excluded from the available relic pool', () => {
      const s = freshState();
      const pool = s._buildAvailableRelicPool();
      Object.keys(relicLibrary)
        .filter((id) => relicLibrary[id]?.marynaOnly)
        .forEach((id) => {
          expect(pool).not.toContain(id);
        });
    });

    it('lista_zakupow discount applies only in the first generated shop', () => {
      const s = freshState();
      s.pickMarynaBoon('lista_zakupow');

      s.generateShopStock();
      const sampleCardId = s.shopStock.cards[0];
      const firstShopPrice = s.getCardShopPrice(sampleCardId);
      const basePrice = cardLibrary[sampleCardId]?.price ?? 0;
      expect(firstShopPrice).toBe(Math.floor(basePrice * 0.7));

      s.generateShopStock();
      const secondCardId = s.shopStock.cards[0];
      const secondBasePrice = cardLibrary[secondCardId]?.price ?? 0;
      expect(s.getCardShopPrice(secondCardId)).toBe(secondBasePrice);
    });

    it('lista_zakupow free removal remains available until used once', () => {
      const s = freshState();
      s.pickMarynaBoon('lista_zakupow');

      s.generateShopStock();
      expect(s.getShopRemovalPrice()).toBe(0);

      s.generateShopStock();
      expect(s.getShopRemovalPrice()).toBe(0);

      s.afterShopCardRemoval();
      expect(s.getShopRemovalPrice()).toBe(100);
    });

    it('resetForNewRun clears maryna state', () => {
      const s = freshState();
      s.pickMarynaBoon('kiesa');
      s.resetForNewRun('easy');
      expect(s.maryna.pickedId).toBeNull();
      expect(s.maryna.offeredIds).toHaveLength(0);
    });
  });

  describe('new rachunek-based cards', () => {
    it('wydruk_z_kasy deals 6 damage and adds 4 to enemy rachunek', () => {
      const s = freshState();
      s.hand = ['wydruk_z_kasy'];
      const initialRachunek = s.enemy.rachunek;
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(initialRachunek + 4);
      expect(s.enemy.hp).toBeLessThan(mockEnemy.hp);
    });

    it('nadplacony_bilet deals base 7 damage and scales with enemy rachunek', () => {
      const s = freshState();
      s.enemy.rachunek = 20;
      s.hand = ['nadplacony_bilet'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(hpBefore);
    });

    it('nadplacony_bilet bonus caps at +5 damage', () => {
      const s = freshState();
      s.enemy.rachunek = 100;
      s.hand = ['nadplacony_bilet'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      const damage = hpBefore - s.enemy.hp;
      expect(damage).toBeLessThanOrEqual(7 + 5 + 5);
    });

    it('eksmisja_z_kwatery deals 12 damage and adds 10 to rachunek if enemy has weak', () => {
      const s = freshState();
      s.enemy.status.weak = 1;
      const initialRachunek = s.enemy.rachunek;
      s.hand = ['eksmisja_z_kwatery'];
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(initialRachunek + 10);
    });

    it('eksmisja_z_kwatery does not bonus rachunek if enemy has no weak', () => {
      const s = freshState();
      s.enemy.status.weak = 0;
      const initialRachunek = s.enemy.rachunek;
      s.hand = ['eksmisja_z_kwatery'];
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(initialRachunek);
    });

    it('rachunek_za_oddychanie deals 8 damage and increases rachunek by 25%, then exhausts', () => {
      const s = freshState();
      s.enemy.rachunek = 100;
      const expectedIncrease = Math.ceil(100 * 0.25);
      s.hand = ['rachunek_za_oddychanie'];
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(100 + expectedIncrease);
      expect(s.exhaust).toContain('rachunek_za_oddychanie');
    });

    it('skrupulatne_wyliczenie deals damage equal to half player block', () => {
      const s = freshState();
      s.player.block = 20;
      const expectedBaseDamage = Math.floor(20 / 2);
      s.hand = ['skrupulatne_wyliczenie'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      const damageDealt = hpBefore - s.enemy.hp;
      expect(damageDealt).toBeGreaterThanOrEqual(expectedBaseDamage);
    });

    it('skrupulatne_wyliczenie adds +5 bonus damage when rachunek > 15', () => {
      const s = freshState();
      s.player.block = 10;
      s.enemy.rachunek = 20;
      const expectedBaseDamage = Math.floor(10 / 2) + 5;
      s.hand = ['skrupulatne_wyliczenie'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      const damageDealt = hpBefore - s.enemy.hp;
      expect(damageDealt).toBeGreaterThanOrEqual(expectedBaseDamage);
    });

    it('skrupulatne_wyliczenie does not add +5 bonus when rachunek <= 15', () => {
      const s = freshState();
      s.player.block = 20;
      s.enemy.rachunek = 10;
      const expectedBaseDamage = Math.floor(20 / 2);
      s.hand = ['skrupulatne_wyliczenie'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      const damageDealt = hpBefore - s.enemy.hp;
      expect(damageDealt).toBeLessThanOrEqual(expectedBaseDamage);
    });
  });

  describe('new lans-based cards', () => {
    it('tatrzanski_szpan with lans inactive only activates lans (no damage)', () => {
      const s = freshState();
      s.player.status.lans = 0;
      s.hand = ['tatrzanski_szpan'];
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.player.status.lans).toBe(1);
      expect(s.enemy.hp).toBe(enemyHpBefore);
    });

    it('tatrzanski_szpan with lans active deals 16 damage', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['tatrzanski_szpan'];
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(enemyHpBefore);
      expect(s.enemy.hp).toBeGreaterThanOrEqual(enemyHpBefore - 16 - 10);
    });

    it('paradny_zwyrt with lans inactive only activates lans (no damage, no draw)', () => {
      const s = freshState();
      s.player.status.lans = 0;
      s.hand = ['paradny_zwyrt'];
      const handBefore = s.hand.length;
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.player.status.lans).toBe(1);
      expect(s.enemy.hp).toBe(enemyHpBefore);
      expect(s.hand.length).toBe(handBefore - 1);
    });

    it('paradny_zwyrt with lans active deals 12 damage and draws 1', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['paradny_zwyrt', 'ciupaga', 'gasior'];
      const handSizeBefore = s.hand.length;
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(enemyHpBefore);
      expect(s.hand.length + s.exhaust.length).toBeGreaterThanOrEqual(handSizeBefore - 1 + 1);
    });

    it('cios_z_telemarkiem with lans inactive only activates lans', () => {
      const s = freshState();
      s.player.status.lans = 0;
      s.hand = ['cios_z_telemarkiem'];
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.player.status.lans).toBe(1);
      expect(s.enemy.hp).toBe(enemyHpBefore);
    });

    it('cios_z_telemarkiem with lans active deals 9 damage', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['cios_z_telemarkiem'];
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(enemyHpBefore);
    });

    it('mlynek_ciupaga with lans inactive only activates lans', () => {
      const s = freshState();
      s.player.status.lans = 0;
      s.hand = ['mlynek_ciupaga'];
      const enemyHpBefore = s.enemy.hp;
      const enemyWeakBefore = s.enemy.status.weak;
      s.playCard(0);
      expect(s.player.status.lans).toBe(1);
      expect(s.enemy.hp).toBe(enemyHpBefore);
      expect(s.enemy.status.weak).toBe(enemyWeakBefore);
    });

    it('mlynek_ciupaga with lans active hits 3x and applies 2 weak', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['mlynek_ciupaga'];
      const enemyHpBefore = s.enemy.hp;
      const enemyWeakBefore = s.enemy.status.weak;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(enemyHpBefore);
      expect(s.enemy.status.weak).toBe(enemyWeakBefore + 2);
    });

    it('wepchniecie_w_kolejke with lans inactive only activates lans (no debuff, no draw)', () => {
      const s = freshState();
      s.player.status.lans = 0;
      s.hand = ['wepchniecie_w_kolejke'];
      const handBefore = s.hand.length;
      const enemyVulnBefore = s.enemy.status.vulnerable;
      s.playCard(0);
      expect(s.player.status.lans).toBe(1);
      expect(s.enemy.status.vulnerable).toBe(enemyVulnBefore);
      expect(s.hand.length).toBe(handBefore - 1);
    });

    it('wepchniecie_w_kolejke with lans active applies 1 vulnerable and draws 1', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['wepchniecie_w_kolejke', 'ciupaga'];
      const handSizeBefore = s.hand.length;
      const enemyVulnBefore = s.enemy.status.vulnerable;
      s.playCard(0);
      expect(s.enemy.status.vulnerable).toBe(enemyVulnBefore + 1);
      expect(s.hand.length).toBeGreaterThanOrEqual(handSizeBefore - 1);
    });
  });

  describe('debug helpers', () => {
    it('setDebugMapRows clamps value to 10..25', () => {
      const s = freshState();
      s.setDebugMapRows(4);
      expect(s.debugMapRows).toBe(10);
      s.setDebugMapRows(999);
      expect(s.debugMapRows).toBe(25);
    });

    it('setDebug flags store booleans', () => {
      const s = freshState();
      s.setDebugRevealAllMap(1);
      expect(s.debugRevealAllMap).toBe(true);
      s.setDebugGodMode(0);
      expect(s.debugGodMode).toBe(false);
    });

    it('setDebugNextNodeType stores forced node type', () => {
      const s = freshState();
      s.setDebugNextNodeType('shop');
      expect(s.debugForcedNextNodeType).toBe('shop');
      s.setDebugNextNodeType(null);
      expect(s.debugForcedNextNodeType).toBeNull();
    });

    it('resetCurrentTurnActions clears attack flags', () => {
      const s = freshState();
      s.player.cardsPlayedThisTurn = 3;
      s.combat.playerAttackMissCheck = true;
      s.combat.playerAttackMissRolled = true;
      s.combat.playerAttackMissed = true;

      s.resetCurrentTurnActions();

      expect(s.player.cardsPlayedThisTurn).toBe(0);
      expect(s.combat.playerAttackMissCheck).toBe(false);
      expect(s.combat.playerAttackMissRolled).toBe(false);
      expect(s.combat.playerAttackMissed).toBe(false);
    });

    it('applyEnemyDebugStatus handles stun and regular statuses and ignores non-positive amount', () => {
      const s = freshState();
      const stunBefore = s.enemy.stunnedTurns;
      const weakBefore = s.enemy.status.weak;

      s.applyEnemyDebugStatus('stun', 2);
      expect(s.enemy.stunnedTurns).toBe(stunBefore + 2);

      s.applyEnemyDebugStatus('weak', 3);
      expect(s.enemy.status.weak).toBe(weakBefore + 3);

      s.applyEnemyDebugStatus('weak', 0);
      expect(s.enemy.status.weak).toBe(weakBefore + 3);
    });

    it('applyPlayerDebugStatus on lans disable applies break penalty when lans was active', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.player.stunned = false;

      s.applyPlayerDebugStatus('lans', 0);

      expect(s.player.status.lans).toBe(0);
      expect(s.player.stunned).toBe(true);
      expect(s.consumeLansBreakEvent()).toBe('BANKRUT!');
    });

    it('applyPlayerDebugStatus on lans disable does not emit break penalty when lans was inactive', () => {
      const s = freshState();
      s.player.status.lans = 0;
      s.player.stunned = false;

      s.applyPlayerDebugStatus('lans', 0);

      expect(s.player.stunned).toBe(false);
      expect(s.consumeLansBreakEvent()).toBeNull();
    });
  });

  describe('relic library helper', () => {
    it('addRelicToLibrary inserts runtime relic definition', () => {
      const id = 'test_relic_runtime';
      const relic = {
        id,
        name: 'Testowa Pamiątka Runtime',
        rarity: 'common',
        emoji: '🧪',
        desc: 'Tylko do testu.',
        price: 80,
      };

      addRelicToLibrary(relic);
      expect(relicLibrary[id]).toBeTruthy();
      expect(relicLibrary[id].name).toBe('Testowa Pamiątka Runtime');
    });
  });

  describe('run summary capture', () => {
    it('captureRunSummary sets killerName for enemy_win and null for player_win', () => {
      const s = freshState();
      s.enemy.name = 'Testowy Wróg';
      s.enemy.emoji = '👹';

      const loseSummary = s.captureRunSummary('enemy_win');
      expect(loseSummary.killerName).toBe('Testowy Wróg 👹');

      const winSummary = s.captureRunSummary('player_win');
      expect(winSummary.killerName).toBeNull();
    });
  });
});
