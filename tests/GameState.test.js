import { describe, it, expect, vi, afterEach } from 'vitest';
import { GameState } from '../src/state/GameState.js';
import { cardLibrary, startingDeck } from '../src/data/cards.js';
import { enemyLibrary } from '../src/data/enemies.js';
import { relicLibrary } from '../src/data/relics.js';

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
    it('deals 12 damage', () => {
      const s = freshState(3);
      s.hand = ['kierpce'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
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
    it('adds 15 rachunek to enemy', () => {
      const s = freshState();
      s.hand = ['paragon_za_gofra'];
      s.enemy.rachunek = 0;
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(15);
    });

    it('can bankrupt enemy when rachunek reaches current hp', () => {
      const s = freshState();
      s.hand = ['paragon_za_gofra'];
      s.enemy.hp = 10;
      s.dutki = 50;
      s.playCard(0);
      expect(s.checkWinCondition()).toBe('player_win');
      expect(s.enemy.hp).toBe(0);
      expect(s.dutki).toBe(57);
      expect(s.lastVictoryMessage).toContain('Wróg zbankrutował');
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
  });

  describe('wypozyczone_gogle', () => {
    it('enables lans and exhausts', () => {
      const s = freshState();
      s.hand = ['wypozyczone_gogle'];
      s.player.hasLans = false;
      s.playCard(0);
      expect(s.player.hasLans).toBe(true);
      expect(s.exhaust).toContain('wypozyczone_gogle');
    });
  });

  describe('zdjecie_z_misiem', () => {
    it('gives +20 dutki when lans is active', () => {
      const s = freshState();
      s.hand = ['zdjecie_z_misiem'];
      s.player.hasLans = true;
      s.dutki = 10;
      s.playCard(0);
      expect(s.dutki).toBe(30);
    });

    it('does nothing without lans', () => {
      const s = freshState();
      s.hand = ['zdjecie_z_misiem'];
      s.player.hasLans = false;
      s.dutki = 10;
      s.playCard(0);
      expect(s.dutki).toBe(10);
    });
  });

  describe('lans status', () => {
    it('converts HP damage to dutki when funds are enough', () => {
      const s = freshState();
      s.player.hasLans = true;
      s.player.block = 0;
      s.player.hp = 40;
      s.dutki = 20;
      const result = s.takeDamage(6);
      expect(result.dealt).toBe(0);
      expect(s.player.hp).toBe(40);
      expect(s.dutki).toBe(8);
    });

    it('breaks lans, stuns player and applies remaining HP damage when funds are low', () => {
      const s = freshState();
      s.player.hasLans = true;
      s.player.block = 0;
      s.player.hp = 30;
      s.dutki = 5;
      const result = s.takeDamage(6);
      expect(result.dealt).toBe(4);
      expect(s.player.hp).toBe(26);
      expect(s.dutki).toBe(0);
      expect(s.player.hasLans).toBe(false);
      expect(s.player.stunned).toBe(true);
      expect(s.consumeLansBreakEvent()).toBe('BANKRUT!');
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

  describe('relics', () => {
    it('adds a relic only once', () => {
      const s = freshState();
      expect(s.addRelic('kierpce_wyprzedazy')).toBe(true);
      expect(s.addRelic('kierpce_wyprzedazy')).toBe(false);
      expect(s.relics).toEqual(['kierpce_wyprzedazy']);
    });

    it('flaszka_sliwowicy gives +5 strength at battle start', () => {
      const s = freshState();
      s.addRelic('flaszka_sliwowicy');
      s.player.status.strength = 0;
      s.resetBattle();
      expect(s.player.status.strength).toBe(5);
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
      s.setSmyczKeptCard('ciupaga');
      expect(s.smyczKeptCardId).toBe('ciupaga');
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      s.endTurn();
      // smyczKeptCardId should still be 'ciupaga' (not null) after endTurn
      expect(s.smyczKeptCardId).toBe('ciupaga');
      // After startTurn, 'ciupaga' should be in hand
      s.startTurn();
      expect(s.hand).toContain('ciupaga');
      expect(s.smyczKeptCardId).toBeNull();
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
    it('starts with 50 Dutki and generated map', () => {
      const s = freshState();
      expect(s.dutki).toBe(50);
      expect(s.map).toHaveLength(10);
      s.map.forEach((level) => {
        expect(level).toHaveLength(3);
      });

      const startNodes = s.map[0].filter(Boolean);
      expect(startNodes).toHaveLength(1);
      expect(s.map[0][0]).toBeNull();
      expect(s.map[0][1]?.type).toBe('fight');
      expect(s.map[0][2]).toBeNull();
      startNodes.forEach((node) => {
        expect(node?.type).toBe('fight');
        expect(node?.y).toBe(0);
        expect(node?.x).toBe(1);
      });
      expect(s.map[0][1]?.connections.length).toBeGreaterThanOrEqual(2);

      for (let level = 1; level <= 7; level++) {
        expect(s.map[level].some(Boolean)).toBe(true);
      }

      expect(s.map[8][1]?.type).toBe('campfire');
      expect(s.map[9][1]?.type).toBe('boss');

      for (let level = 0; level < s.map.length - 1; level++) {
        s.map[level].forEach((node, x) => {
          if (!node) return;
          expect(node.x).toBe(x);
          expect(node.y).toBe(level);
          if (level === 6) return;
          expect(node.connections.length).toBeGreaterThan(0);
          node.connections.forEach((targetX) => {
            expect(Math.abs(targetX - x)).toBeLessThanOrEqual(1);
            expect(s.map[level + 1][targetX]).not.toBeNull();
          });
        });
      }

      for (let level = 1; level < s.map.length; level++) {
        s.map[level].forEach((node, x) => {
          if (!node) return;
          const hasInbound = s.map[level - 1].some((prevNode) => prevNode?.connections.includes(x));
          expect(hasInbound).toBe(true);
        });
      }

      s.map[7].forEach((node) => {
        if (!node) return;
        expect(node.connections).toEqual([1]);
      });

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

      expect(reachableTypes.has('shop')).toBe(true);
      expect(reachableTypes.has('treasure')).toBe(true);

      const allNodes = s.map.flat().filter(Boolean);
      const shopCount = allNodes.filter((node) => node.type === 'shop').length;
      const treasureCount = allNodes.filter((node) => node.type === 'treasure').length;
      expect(shopCount).toBeLessThanOrEqual(2);
      expect(treasureCount).toBeLessThanOrEqual(1);
    });

    it('battle reward grants 30-40 Dutki only once per battle', () => {
      const s = freshState();
      s.dutki = 0;
      const first = s.grantBattleDutki();
      const second = s.grantBattleDutki();
      expect(first).toBeGreaterThanOrEqual(30);
      expect(first).toBeLessThanOrEqual(40);
      expect(second).toBe(0);
      expect(s.dutki).toBe(first);
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
      Object.values(relicLibrary).forEach((relic) => {
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

      Object.values(relicLibrary).forEach((relic) => {
        const range = ranges[relic.rarity];
        expect(relic.price).toBeGreaterThanOrEqual(range.min);
        expect(relic.price).toBeLessThanOrEqual(range.max);
      });
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
        applyFrail: 1,
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
        heal: 5,
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

    it('Zbieranie kompletu heals enemy by 5', () => {
      const s = freshBusiarzState();
      s.endTurn();
      s.endTurn();
      s.enemy.hp = s.enemy.maxHp - 10;
      s.endTurn();
      expect(s.enemy.hp).toBe(s.enemy.maxHp - 5);
    });
  });

  describe('baba', () => {
    it('starts with Darmowa degustacja as first intent', () => {
      const s = freshBabaState();
      expect(s.enemy.currentIntent).toEqual({
        type: 'block',
        name: 'Darmowa degustacja',
        block: 15,
      });
    });

    it('heals 5 HP at end of player turn if she took no HP damage', () => {
      const s = freshBabaState();
      s.enemy.hp = 40;
      const result = s.endTurn();
      expect(s.enemy.hp).toBe(45);
      expect(result.enemyPassiveHeal).toEqual({ amount: 5, text: '+5 Krzepy (Świeży oscypek)' });
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

    it('applies weak:2 on Cena z kosmosu', () => {
      const s = freshBabaState();
      s.endTurn();
      expect(s.enemy.currentIntent).toEqual({
        type: 'attack',
        name: 'Cena z kosmosu',
        damage: 8,
        hits: 1,
        applyWeak: 2,
      });
      s.endTurn();
      expect(s.player.status.weak).toBe(2);
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
      expect(babaStatus?.tooltip).toContain('leczy 5 Krzepy');
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
      vi.spyOn(Math, 'random').mockReturnValue(0);
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
        next_double: true,
        energy_next_turn: 1,
      };
      s.enemy.status = { strength: 4, weak: 2, fragile: 2, next_double: true, energy_next_turn: 0 };

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
      });
      expect(s.enemy.status).toEqual({
        strength: 0,
        weak: 0,
        fragile: 0,
        vulnerable: 0,
        next_double: false,
        energy_next_turn: 0,
      });
    });

    it('moves hand/discard/exhaust back to deck and starts next turn', () => {
      const s = freshState();
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
      vi.spyOn(Math, 'random').mockReturnValue(0.2);
      s.resetBattle();
      expect(s.enemy.id).toBe('busiarz');
      expect(s.enemy.name).toBe('Wąsaty Busiarz');
      expect(s.enemy.maxHp).toBe(65);
    });

    it('can load Babę from the enemy library after victory', () => {
      const s = freshState();
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      s.resetBattle();
      expect(s.enemy.id).toBe('baba');
      expect(s.enemy.name).toBe('Gaździna Maryna');
      expect(s.enemy.maxHp).toBe(95);
    });

    it('spawns Król Krupówek on boss node with artifact', () => {
      const s = freshState();
      s.map = [
        [null, { x: 1, y: 0, type: 'fight', label: 'Bitka', emoji: '⚔️', connections: [1] }, null],
        [null, { x: 1, y: 1, type: 'boss', label: 'Boss', emoji: '👑', connections: [] }, null],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      s.resetBattle();
      expect(s.enemy.id).toBe('boss');
      expect(s.enemy.name).toBe('Król Krupówek - Biały Misiek (Zdzisiek)');
      expect(s.enemy.maxHp).toBe(250);
      expect(s.enemy.bossArtifact).toBe(3);
    });

    it('enemy library includes final boss definition', () => {
      const ids = Object.keys(enemyLibrary).sort();
      expect(ids).toEqual(['baba', 'boss', 'busiarz', 'cepr', 'influencerka', 'parkingowy']);
    });

    it('does not scale enemies in normal mode', () => {
      const s = freshState();
      s.difficulty = 'normal';
      vi.spyOn(Math, 'random').mockReturnValue(0);
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
      vi.spyOn(Math, 'random').mockReturnValue(0);
      s.resetBattle(); // increments scale to 1.21, then creates enemy with that scale
      expect(s.enemy.maxHp).toBe(Math.round(enemyLibrary.cepr.maxHp * 1.21));
      expect(s.enemy.baseAttack).toBe(Math.round(enemyLibrary.cepr.baseAttack * 1.21));
    });

    it('boss has 350 HP on hard mode', () => {
      const s = freshState();
      s.difficulty = 'hard';
      s.map = [
        [null, { x: 1, y: 0, type: 'fight', label: 'Bitka', emoji: '⚔️', connections: [1] }, null],
        [null, { x: 1, y: 1, type: 'boss', label: 'Boss', emoji: '👑', connections: [] }, null],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };
      s.resetBattle();
      expect(s.enemy.id).toBe('boss');
      expect(s.enemy.maxHp).toBe(350);
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

    it('blocks first three debuffs with artifact', () => {
      const s = freshBossState();
      s.applyEnemyDebuff('weak', 2);
      s.applyEnemyDebuff('weak', 2);
      s.applyEnemyDebuff('weak', 2);
      expect(s.enemy.status.weak).toBe(0);
      expect(s.enemy.bossArtifact).toBe(0);
      s.applyEnemyDebuff('weak', 2);
      expect(s.enemy.status.weak).toBe(2);
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

    it('ochrona_wizerunku also triggers when damage is fully blocked', () => {
      const s = freshBossState();
      s.player.hp = 50;
      s.enemy.hp = 300;
      s.enemy.block = 999;
      s.hand = ['ciupaga'];
      s.player.energy = 3;
      s.playCard(0);
      expect(s.player.hp).toBe(49);
    });
  });
});
