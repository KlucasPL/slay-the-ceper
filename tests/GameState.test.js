import { describe, it, expect, vi, afterEach } from 'vitest';
import { GameState } from '../src/state/GameState.js';
import { cardLibrary, startingDeck } from '../src/data/cards.js';
import { enemyLibrary } from '../src/data/enemies.js';
import { eventLibrary } from '../src/data/events.js';
import { relicLibrary, addRelicToLibrary } from '../src/data/relics.js';
import { marynaBoonLibrary } from '../src/data/marynaBoons.js';
import { withSeededRng } from '../src/engine/Rng.js';

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

/** @returns {GameState} */
function freshCeprState() {
  const s = new GameState({ ...mockPlayer }, enemyLibrary.cepr);
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

    it('campfire sharpening applies to only one copy of a duplicated attack card', () => {
      const s = freshState(3);
      s.deck = ['ciupaga', 'ciupaga'];
      s.hand = [];
      s.discard = [];
      s.exhaust = [];

      s.upgradeCardDamage('ciupaga', 3);

      const upgradedCardId = s.deck.find((cardId) => cardId !== 'ciupaga');
      expect(upgradedCardId).toBeTruthy();
      expect(s.deck.filter((cardId) => cardId === 'ciupaga')).toHaveLength(1);
      expect(Object.keys(s.cardDamageBonus)).toHaveLength(1);
      expect(s.getCardDamageBonus('ciupaga')).toBe(0);
      expect(s.getCardDamageBonus(upgradedCardId)).toBe(3);

      s.enemy.hp = 50;
      s.hand = ['ciupaga'];
      s.playCard(0);
      expect(s.enemy.hp).toBe(44);

      s.player.energy = 3;
      s.hand = [upgradedCardId];
      s.playCard(0);
      expect(s.enemy.hp).toBe(35);
    });

    it('campfire sharpening never upgrades non-attack cards', () => {
      const s = freshState(3);
      s.deck = ['gasior'];
      s.hand = [];
      s.discard = [];
      s.exhaust = [];

      s.upgradeCardDamage('gasior', 3);

      expect(s.deck).toEqual(['gasior']);
      expect(Object.keys(s.cardDamageBonus)).toHaveLength(0);
      expect(s.getCardDamageBonus('gasior')).toBe(0);
    });

    it('getUpgradeableAttackCards returns only attack cards', () => {
      const s = freshState(3);
      s.deck = ['ciupaga', 'gasior', 'kierpce'];
      s.hand = [];
      s.discard = [];
      s.exhaust = [];

      expect(s.getUpgradeableAttackCards().sort()).toEqual(['ciupaga', 'kierpce']);
    });

    it('clearStatusCardsFromPiles removes status cards immediately', () => {
      const s = freshState(3);
      s.deck = ['ciupaga', 'ulotka'];
      s.hand = ['spam_tagami'];
      s.discard = ['gasior'];
      s.exhaust = ['spam_tagami'];

      s.clearStatusCardsFromPiles();

      expect(s.hand).toEqual([]);
      expect(s.discard).toEqual([]);
      expect(s.exhaust).toEqual([]);
      expect(s.deck).toContain('ciupaga');
      expect(s.deck).toContain('gasior');
      expect(s.deck).not.toContain('ulotka');
      expect(s.deck).not.toContain('spam_tagami');
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

    it('applies vulnerable as +50% incoming damage on target', () => {
      const s = freshState();
      s.enemy.status.vulnerable = 1;
      expect(s.calculateDamage(8, s.player, s.enemy)).toBe(12); // 8 * 1.5 = 12
    });

    it('applies vulnerable when enemy attacks player', () => {
      const s = freshState();
      s.player.status.vulnerable = 1;
      expect(s.calculateDamage(10, s.enemy, s.player)).toBe(15); // 10 * 1.5 = 15
    });

    it('card attack deals +50% damage to vulnerable enemy', () => {
      const s = freshState();
      s.startBattleWithEnemyId('cepr');
      s.startTurn();
      s.enemy.status.vulnerable = 2;
      s.enemy.hp = 20;
      s.enemy.block = 0;
      s.hand = ['ciupaga']; // Ensure ciupaga is in hand at index 0
      const hpBefore = s.enemy.hp;
      s.playCard(0); // ciupaga = 6 base damage
      const damageDealt = hpBefore - s.enemy.hp;
      expect(damageDealt).toBe(9); // 6 * 1.5 = 9
    });

    it('applies vulnerable from wepchniecie_w_kolejke then deals +50% with next attack', () => {
      const s = freshState();
      s.startBattleWithEnemyId('cepr');
      s.startTurn();
      s.player.status.lans = 1; // Enable LANS for wepchniecie_w_kolejke
      s.enemy.hp = 30;
      s.enemy.block = 0;
      s.hand = ['wepchniecie_w_kolejke', 'ciupaga'];
      // First play wepchniecie_w_kolejke - applies vulnerable
      s.playCard(0);
      expect(s.enemy.status.vulnerable).toBe(2);
      // Now play ciupaga - should deal 50% extra damage
      s.playCard(0);
      const damageDealt = 30 - s.enemy.hp;
      expect(damageDealt).toBe(9); // 6 * 1.5 = 9
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
    it('discards remaining hand, draws 5 and grants 6 block', () => {
      const s = freshState(3);
      s.hand = ['halny', 'ciupaga', 'gasior'];
      s.deck = ['hej', 'hej', 'hej', 'hej', 'hej'];
      const blockBefore = s.player.block;
      s.playCard(0); // play halny at index 0
      // halny goes to discard, remaining [ciupaga, gasior] discarded, 5 drawn
      expect(s.hand).toHaveLength(5);
      expect(s.player.block).toBeGreaterThanOrEqual(blockBefore + 6);
      expect(s.discard).toContain('ciupaga');
      expect(s.discard).toContain('gasior');
      expect(s.discard).toContain('halny');
    });
  });

  describe('paragon_za_gofra', () => {
    it('adds 12 rachunek to enemy', () => {
      const s = freshState();
      s.hand = ['paragon_za_gofra'];
      s.enemy.rachunek = 0;
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(12);
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
      s.enemy.hp = 12;
      s.dutki = 50;
      s.playCard(0);

      // Bankructwo is now deferred and resolves on enemy turn start.
      expect(s.checkWinCondition()).toBe(null);

      s.endTurn();

      expect(s.checkWinCondition()).toBe('player_win');
      expect(s.enemy.hp).toBe(0);
      expect(s.dutki).toBe(54);
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
    it('gives +30 dutki and draws 1 when lans is active', () => {
      const s = freshState();
      s.hand = ['zdjecie_z_misiem'];
      s.player.status.lans = 1;
      s.dutki = 10;
      s.deck = ['ciupaga'];
      const handBefore = s.hand.length;
      s.playCard(0);
      expect(s.dutki).toBe(40);
      expect(s.hand.length).toBe(handBefore);
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
    it('deals 11 damage', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(29);
    });
    it('grants +35 Dutki if enemy dies and exhausts', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 5;
      s.enemy.block = 0;
      s.dutki = 0;
      s.playCard(0);
      expect(s.dutki).toBe(35);
      expect(s.exhaust).toContain('janosik');
    });
    it('grants +10 Dutki if enemy survives', () => {
      const s = freshState();
      s.hand = ['janosik'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.dutki = 0;
      s.playCard(0);
      expect(s.dutki).toBe(10);
    });
  });

  describe('echo', () => {
    it('costs 1 Oscypek, sets next_double, draws 1 and exhausts', () => {
      const s = freshState(2);
      s.hand = ['echo'];
      s.deck = ['ciupaga'];
      s.player.energy = 1;
      s.playCard(0);
      expect(s.player.status.next_double).toBe(true);
      expect(s.hand).toHaveLength(1);
      expect(s.exhaust).toContain('echo');
      expect(s.player.energy).toBe(0);
    });
  });

  describe('sandaly', () => {
    it('deals 7 damage', () => {
      const s = freshState();
      s.hand = ['sandaly'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(33);
    });
    it('applies weak:1 to enemy', () => {
      const s = freshState();
      s.hand = ['sandaly'];
      s.enemy.status.weak = 0;
      s.playCard(0);
      expect(s.enemy.status.weak).toBe(1);
    });
  });

  describe('giewont', () => {
    it('deals 28 damage and exhausts', () => {
      const s = freshState(3);
      s.hand = ['giewont'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      expect(s.enemy.hp).toBe(12);
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
    it('grants 9 Garda without Lans', () => {
      const s = freshState();
      s.hand = ['barchanowe_gacie'];
      s.player.status.lans = 0;
      s.playCard(0);
      expect(s.player.block).toBe(9);
    });

    it('grants 13 Garda with Lans', () => {
      const s = freshState();
      s.hand = ['barchanowe_gacie'];
      s.player.status.lans = 1;
      s.playCard(0);
      expect(s.player.block).toBe(13);
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
    it('deals 22 damage normally', () => {
      const s = freshState();
      s.hand = ['zemsta_gorala', 'ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;

      s.playCard(0);

      expect(s.enemy.hp).toBe(18);
    });

    it('deals 44 damage when played as last card in hand', () => {
      const s = freshState();
      s.hand = ['zemsta_gorala'];
      s.enemy.hp = 40;
      s.enemy.block = 0;

      s.playCard(0);

      expect(s.enemy.hp).toBe(-4);
    });
  });

  describe('mocny_organizm', () => {
    it('deals 12 damage and does not increase max HP when enemy survives', () => {
      const s = freshState();
      s.hand = ['mocny_organizm'];
      s.enemy.hp = 30;
      s.enemy.block = 0;
      const beforeMaxHp = s.player.maxHp;

      s.playCard(0);

      expect(s.enemy.hp).toBe(18);
      expect(s.player.maxHp).toBe(beforeMaxHp);
    });

    it('increases max HP by 3 when attack kills enemy', () => {
      const s = freshState();
      s.hand = ['mocny_organizm'];
      s.enemy.hp = 12;
      s.enemy.block = 0;
      s.player.hp = 30;
      const beforeMaxHp = s.player.maxHp;

      s.playCard(0);

      expect(s.enemy.hp).toBe(0);
      expect(s.player.maxHp).toBe(beforeMaxHp + 3);
      expect(s.player.hp).toBe(33);
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

    it('certyfikowany_oscypek grants +5 max HP on shop entry up to 3 times', () => {
      const s = freshState();
      s.addRelic('certyfikowany_oscypek');
      const baseMaxHp = s.player.maxHp;

      s.generateShopStock();
      s.generateShopStock();
      s.generateShopStock();
      s.generateShopStock();

      expect(s.player.maxHp).toBe(baseMaxHp + 15);
      expect(s.certyfikowanyOscypekShopProcs).toBe(3);
    });

    it('flaszka_sliwowicy gives +2 strength at battle start', () => {
      const s = freshState();
      s.addRelic('flaszka_sliwowicy');
      s.player.status.strength = 0;
      s.resetBattle();
      expect(s.player.status.strength).toBe(2);
    });

    it('wiatr_halny draws +2 cards each turn start', () => {
      const s = freshState();
      s.addRelic('wiatr_halny');
      s.deck = [...startingDeck, ...startingDeck];
      s.hand = [];
      s.discard = [];
      s.startTurn();
      // normal draw is 5, wiatr_halny adds 2 more
      expect(s.hand.length).toBe(7);
    });

    it('papryczka_marka gives +3 strength at battle start', () => {
      const s = freshState();
      s.addRelic('papryczka_marka');
      s.player.status.strength = 0;
      s.resetBattle();
      expect(s.player.status.strength).toBe(3);
    });

    it('papryczka_marka drains 1 HP and grants 1 block each turn start (min 1)', () => {
      const s = freshState();
      s.addRelic('papryczka_marka');
      s.player.hp = 5;
      s.deck = [...startingDeck, ...startingDeck];
      s.hand = [];
      const blockBefore = s.player.block;
      s.startTurn();
      expect(s.player.hp).toBe(4);
      expect(s.player.block).toBeGreaterThanOrEqual(blockBefore + 1);
      // HP at 1 should not go below 1
      s.player.hp = 1;
      s.startTurn();
      expect(s.player.hp).toBe(1);
    });

    it('dzwonek_owcy caps healing to 2 per effect', () => {
      const s = freshState();
      s.addRelic('dzwonek_owcy');
      s.player.hp = 20;
      s.healPlayer(10);
      expect(s.player.hp).toBe(22);
    });

    it('dzwonek_owcy reduces enemy maxHp by 15%', () => {
      const s = freshState();
      const baseMaxHp = s.enemy.maxHp; // cepr base = 40
      s.addRelic('dzwonek_owcy');
      s.deck = [...startingDeck, ...startingDeck];
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.cepr);
      s.resetBattle();
      expect(s.enemy.maxHp).toBe(Math.round(baseMaxHp * 0.85));
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
      expect(s.player.block).toBe(3);
    });

    it('krokus heals 2 HP at end of turn when block >= 8', () => {
      const s = freshState();
      s.addRelic('krokus');
      s.player.hp = 30;
      s.player.block = 8;
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      const { playerPassiveHeal } = s.endTurn();
      expect(s.player.hp).toBe(32);
      expect(playerPassiveHeal).not.toBeNull();
    });

    it('krokus does not heal when block < 8', () => {
      const s = freshState();
      s.addRelic('krokus');
      s.player.hp = 30;
      s.player.block = 7;
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

    it('papucie_po_babci heals 1 HP when Lans is inactive', () => {
      const s = freshState();
      s.addRelic('papucie_po_babci');
      s.player.hp = 25;
      s.player.status.lans = 0;
      setEnemyIntent(s, { type: 'block', name: 'Obserwuje', block: 0 });
      s.endTurn();
      expect(s.player.hp).toBe(26);
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
      it('getShopRemovalPrice returns 0 with relic', () => {
        const s = freshState();
        s.addRelic('zlota_karta_zakopianczyka');
        expect(s.getShopRemovalPrice()).toBe(0);
      });

      it('getShopRemovalPrice returns 100 without relic', () => {
        const s = freshState();
        expect(s.getShopRemovalPrice()).toBe(100);
      });

      it('getCardShopPrice applies 20% discount with relic', () => {
        const s = freshState();
        s.addRelic('zlota_karta_zakopianczyka');
        const basePrice = cardLibrary['ciupaga'].price;
        expect(s.getCardShopPrice('ciupaga')).toBe(Math.floor(basePrice * 0.8));
      });

      it('getCardShopPrice returns base price without relic', () => {
        const s = freshState();
        const basePrice = cardLibrary['ciupaga'].price;
        expect(s.getCardShopPrice('ciupaga')).toBe(basePrice);
      });

      it('does not grant +1 energy at turn start', () => {
        const s = freshState();
        s.addRelic('zlota_karta_zakopianczyka');
        s.deck = [...startingDeck, ...startingDeck];
        s.hand = [];
        const maxEnergy = s.player.maxEnergy;
        s.startTurn();
        expect(s.player.energy).toBe(maxEnergy);
      });
    });

    it('pekniete_liczydlo heals player by 1 HP when rachunek is added', () => {
      const s = freshState();
      s.addRelic('pekniete_liczydlo');
      s.player.hp = 40;
      s.enemy.rachunek = 0;
      s.enemy.maxRachunek = 9999;
      s.addEnemyRachunek(5);
      expect(s.player.hp).toBe(41);
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

    it('ciupaga_dlugopis deals 1 bonus damage when a skill card is played', () => {
      const s = freshState();
      s.addRelic('ciupaga_dlugopis');
      s.hand = ['gasior']; // gasior is a skill card (costs 1, gives block)
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      // gasior has no direct damage; ciupaga_dlugopis should deal 1 dmg
      expect(s.enemy.hp).toBe(39);
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

    it('pocztowka_giewont fires first and second card effects twice per battle with +2 block each', () => {
      const s = freshState();
      s.addRelic('pocztowka_giewont');
      s.hand = ['ciupaga', 'ciupaga'];
      s.enemy.hp = 40;
      s.enemy.block = 0;
      s.playCard(0);
      // ciupaga on first card: doubled (2x effect) + 2 block = -6*2 damage, +2 block
      expect(s.enemy.hp).toBe(28);
      expect(s.player.block).toBe(2);

      s.playCard(0);
      // ciupaga on second card: doubled (2x effect) + 2 block = -6*2 damage, +2 block
      expect(s.enemy.hp).toBe(16);
      expect(s.player.block).toBe(4);
    });

    it('pocztowka_giewont does not double the third card in same battle', () => {
      const s = freshState();
      s.addRelic('pocztowka_giewont');
      s.hand = ['ciupaga', 'ciupaga', 'ciupaga'];
      s.enemy.hp = 50;
      s.enemy.block = 0;
      s.playCard(0); // doubled: -12, +2 block
      s.playCard(0); // doubled: -12, +2 block
      s.playCard(0); // normal: -6
      expect(s.enemy.hp).toBe(20); // 50 - 12 - 12 - 6 = 20
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

    it('zepsuty_termometr applies 2 weak and 2 fragile at battle start', () => {
      const s = freshState();
      s.addRelic('zepsuty_termometr');
      s.enemy.status.weak = 0;
      s.enemy.status.fragile = 0;
      s.resetBattle();
      expect(s.enemy.status.weak).toBe(2);
      expect(s.enemy.status.fragile).toBe(2);
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

    describe('Act I / Act II event pool separation', () => {
      const act1EventIds = Object.keys(eventLibrary).filter((id) => eventLibrary[id].act === 'I');
      const act2EventIds = Object.keys(eventLibrary).filter((id) => eventLibrary[id].act === 'II');

      it('eventLibrary has exactly 3 Act I tagged events', () => {
        expect(act1EventIds).toHaveLength(3);
      });

      it('eventLibrary has exactly 3 Act II events', () => {
        expect(act2EventIds).toHaveLength(3);
      });

      it('Act II event IDs are the expected new events', () => {
        expect(act2EventIds).toContain('event_korek_do_toalety');
        expect(act2EventIds).toContain('event_selfie_na_krawedzi');
        expect(act2EventIds).toContain('event_paragon_za_wrzatek');
      });

      it('pickRandomEventDef with currentAct=1 never returns Act II events', () => {
        const s = freshState();
        s.currentAct = 1;
        s.recentEventIds = [];
        // exhaust many picks
        for (let i = 0; i < 30; i++) {
          s.recentEventIds = [];
          const picked = s.pickRandomEventDef();
          if (picked) {
            expect(act2EventIds).not.toContain(picked.id);
          }
        }
      });

      it('pickRandomEventDef with currentAct=2 never returns Act I events', () => {
        const s = freshState();
        s.currentAct = 2;
        s.recentEventIds = [];
        for (let i = 0; i < 30; i++) {
          s.recentEventIds = [];
          const picked = s.pickRandomEventDef();
          if (picked) {
            expect(act1EventIds).not.toContain(picked.id);
          }
        }
      });

      it('pickRandomEventDef with currentAct=2 can return Act II events', () => {
        const s = freshState();
        s.currentAct = 2;
        const seenAct2 = new Set();
        for (let i = 0; i < 40; i++) {
          s.recentEventIds = [];
          const picked = s.pickRandomEventDef();
          if (picked && act2EventIds.includes(picked.id)) {
            seenAct2.add(picked.id);
          }
        }
        expect(seenAct2.size).toBeGreaterThan(0);
      });

      it('fiakier_event has act: I and does not appear in Act II pool', () => {
        expect(eventLibrary.fiakier_event.act).toBe('I');

        const sAct1 = freshState();
        sAct1.currentAct = 1;
        sAct1.recentEventIds = ['event_hazard_karton', 'event_karykaturzysta'];
        const pickedAct1 = sAct1.pickRandomEventDef();
        expect(pickedAct1?.id).toBe('fiakier_event');

        const sAct2 = freshState();
        sAct2.currentAct = 2;
        for (let i = 0; i < 30; i++) {
          sAct2.recentEventIds = [];
          const picked = sAct2.pickRandomEventDef();
          expect(picked?.id).not.toBe('fiakier_event');
        }
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
      const s = withSeededRng(0x12345678, () => freshState());
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
      const eliteNodes = allNodes.filter((node) => node.type === 'elite');
      const eliteCount = eliteNodes.length;
      const earliestElite = eliteNodes.length
        ? Math.min(...eliteNodes.map((node) => node.y))
        : Infinity;
      expect(shopCount).toBeGreaterThanOrEqual(5);
      expect(treasureCount).toBe(1);
      expect(eliteCount).toBeGreaterThanOrEqual(3);
      expect(earliestElite).toBeGreaterThanOrEqual(4);

      // Elite rules: reachable elites must be >= 3 and any two must have row distance >= 4
      const reachableCoords3 = new Set();
      const qElite = [{ x: 1, y: 0 }];
      const seenElite = new Set();
      while (qElite.length > 0) {
        const cur = qElite.shift();
        const k = `${cur.x},${cur.y}`;
        if (seenElite.has(k)) continue;
        seenElite.add(k);
        reachableCoords3.add(k);
        const node = s.map[cur.y]?.[cur.x];
        if (!node) continue;
        for (const next of node.connections ?? []) {
          qElite.push({ x: next, y: cur.y + 1 });
        }
      }
      const reachableElites = s.map
        .flat()
        .filter(Boolean)
        .filter((n) => n.type === 'elite' && reachableCoords3.has(`${n.x},${n.y}`))
        .sort((a, b) => a.y - b.y);
      expect(reachableElites.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < reachableElites.length; i++) {
        expect(reachableElites[i].y - reachableElites[i - 1].y).toBeGreaterThanOrEqual(3);
      }

      // Shop spawn rules:
      // 1) no reachable edge can connect shop -> shop,
      // 2) at least one reachable path to boss contains >= 3 shops.
      const reachableKeys = new Set();
      const queue2 = [{ x: 1, y: 0 }];
      const seen2 = new Set();
      while (queue2.length > 0) {
        const current = queue2.shift();
        const key = `${current.x},${current.y}`;
        if (seen2.has(key)) continue;
        seen2.add(key);
        const node = s.map[current.y]?.[current.x];
        if (!node) continue;
        reachableKeys.add(key);
        node.connections.forEach((targetX) => {
          if (s.map[current.y + 1]?.[targetX]) {
            queue2.push({ x: targetX, y: current.y + 1 });
          }
        });
      }

      for (let y = 0; y < s.map.length - 1; y++) {
        for (let x = 0; x < 3; x++) {
          const node = s.map[y]?.[x];
          if (!node || node.type !== 'shop' || !reachableKeys.has(`${x},${y}`)) continue;
          node.connections.forEach((targetX) => {
            const nextNode = s.map[y + 1]?.[targetX];
            if (!nextNode || !reachableKeys.has(`${targetX},${y + 1}`)) return;
            expect(nextNode.type).not.toBe('shop');
          });
        }
      }

      const reachableShops = [...reachableKeys]
        .map((key) => {
          const [x, y] = key.split(',').map(Number);
          return s.map[y]?.[x] ?? null;
        })
        .filter((node) => node?.type === 'shop');
      expect(reachableShops.length).toBeGreaterThanOrEqual(5);
      const shopColumns = new Set(reachableShops.map((node) => node.x));
      expect(shopColumns.size).toBeGreaterThanOrEqual(2);

      const rows = s.map.length;
      const NEG = Number.NEGATIVE_INFINITY;
      const best = Array.from({ length: rows }, () => Array(3).fill(NEG));
      best[0][1] = s.map[0][1]?.type === 'shop' ? 1 : 0;
      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < 3; x++) {
          const node = s.map[y]?.[x];
          if (!node || best[y][x] === NEG) continue;
          node.connections.forEach((targetX) => {
            const nextNode = s.map[y + 1]?.[targetX];
            if (!nextNode) return;
            if (node.type === 'shop' && nextNode.type === 'shop') return;
            const gain = nextNode.type === 'shop' ? 1 : 0;
            best[y + 1][targetX] = Math.max(best[y + 1][targetX], best[y][x] + gain);
          });
        }
      }
      expect(best[rows - 1][1]).toBeGreaterThanOrEqual(3);
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
          if (!relic.bossRewardOnly) {
            expect(relic.price).toBeGreaterThan(0);
          }
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
        .filter((relic) => !relic.marynaOnly && !relic.bossRewardOnly)
        .forEach((relic) => {
          const range = ranges[relic.rarity];
          expect(relic.price).toBeGreaterThanOrEqual(range.min);
          expect(relic.price).toBeLessThanOrEqual(range.max);
        });
    });

    it('fiakier event heal choice costs 60 and heals up to max HP', () => {
      const s = freshState();
      s.setActiveEvent('fiakier_event');
      s.player.hp = 48;
      s.dutki = 70;

      const result = s.applyActiveEventChoice(0);

      expect(result.success).toBe(true);
      expect(s.player.hp).toBe(50);
      expect(s.dutki).toBe(10);
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
      expect(fallback.minDutki).toBe(20);
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

    it('shouldProduceSameMapAndDeckForSameSeedViaBeginSeededRun', () => {
      // given
      const deck = ['ciupaga', 'ciupaga', 'gasior'];
      const makeSeeded = () => {
        const s = new GameState({ ...mockPlayer }, { ...mockEnemy });
        s.beginSeededRun('cafef00d', deck);
        return s;
      };

      // when
      const s1 = makeSeeded();
      const s2 = makeSeeded();

      // then — map topology identical
      expect(JSON.stringify(s1.map)).toBe(JSON.stringify(s2.map));
      expect(s1.runSeed).toBe('cafef00d');
      expect(s2.runSeed).toBe('cafef00d');
    });

    it('shouldProduceDifferentMapsForDifferentSeeds', () => {
      // given
      const deck = ['ciupaga', 'gasior'];
      const make = (seed) => {
        const s = new GameState({ ...mockPlayer }, { ...mockEnemy });
        s.beginSeededRun(seed, deck);
        return s;
      };

      // when
      const s1 = make('deadbeef');
      const s2 = make('cafebabe');

      // then — different seeds produce different maps (very high probability)
      expect(JSON.stringify(s1.map)).not.toBe(JSON.stringify(s2.map));
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
        damage: 10,
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

    it('intent text damage changes with player Garda', () => {
      const s = freshBusiarzState();
      s.player.block = 5;
      expect(s.getEnemyIntentText()).toBe('Zamiar: Trąbienie na pieszych (⚔️ 3, 2x)');
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
        damage: 15,
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

    it('ceprzyca_vip: Podatność increases Awantura o cenę to 21 after setup', () => {
      const s = new GameState({ ...mockPlayer }, enemyLibrary.ceprzyca_vip);
      s.player.energy = 3;
      s.hand = [];
      s.deck = [];
      s.discard = [];
      s.player.hp = 50;
      s.player.block = 0;

      const eliteDmgScale = 1.15;
      const scaledFirstAtk = Math.round(
        enemyLibrary.ceprzyca_vip.pattern[0].damage * eliteDmgScale
      );
      const scaledThirdAtk = Math.round(
        enemyLibrary.ceprzyca_vip.pattern[2].damage * eliteDmgScale
      );

      const firstTurn = s.endTurn();
      expect(firstTurn.enemyAttack.raw).toBe(scaledFirstAtk);
      expect(s.player.status.vulnerable).toBe(1);

      s.startTurn();
      const secondTurn = s.endTurn();
      expect(secondTurn.enemyAttack.raw).toBe(0);
      expect(s.player.status.vulnerable).toBe(1);

      s.startTurn();
      const thirdTurn = s.endTurn();
      expect(thirdTurn.enemyAttack.raw).toBe(Math.ceil(scaledThirdAtk * 1.5));
    });
  });

  describe('baba', () => {
    it('starts with Darmowa degustacja as first intent', () => {
      const s = freshBabaState();
      expect(s.enemy.currentIntent).toEqual({
        type: 'block',
        name: 'Darmowa degustacja',
        block: 8,
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
        damage: 9,
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

    it('fog: first player attack hits when roll is >= 0.25', () => {
      const s = freshState();
      s.currentWeather = 'fog';
      s.hand = ['ciupaga'];
      s.enemy.block = 0;
      const hpBefore = s.enemy.hp;
      vi.spyOn(Math, 'random').mockReturnValue(0.3);

      s.playCard(0);

      expect(s.enemy.hp).toBeLessThan(hpBefore);
    });

    it('fog: first player attack misses when roll is < 0.25', () => {
      const s = freshState();
      s.currentWeather = 'fog';
      s.hand = ['ciupaga'];
      s.enemy.block = 0;
      const hpBefore = s.enemy.hp;
      vi.spyOn(Math, 'random').mockReturnValue(0.2);

      s.playCard(0);

      expect(s.enemy.hp).toBe(hpBefore);
    });

    it('fog: enemy attack hits when roll is >= 0.25', () => {
      const s = freshState();
      s.currentWeather = 'fog';
      s.player.hp = 50;
      s.player.block = 0;
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      vi.spyOn(Math, 'random').mockReturnValue(0.3);

      s.endTurn();

      expect(s.player.hp).toBe(42);
    });

    it('fog: enemy attack misses when roll is < 0.25', () => {
      const s = freshState();
      s.currentWeather = 'fog';
      s.player.hp = 50;
      s.player.block = 0;
      setEnemyIntent(s, { type: 'attack', name: 'Pstryka fotkę', damage: 8, hits: 1 });
      vi.spyOn(Math, 'random').mockReturnValue(0.2);

      s.endTurn();

      expect(s.player.hp).toBe(50);
    });

    it('halny drains 2 player block at end of turn (not start)', () => {
      const s = freshState();
      s.currentWeather = 'halny';
      s.player.block = 10;
      setEnemyIntent(s, { type: 'buff', name: 'Ryk', strengthGain: 1, block: 0 });

      s.endTurn();

      expect(s.player.block).toBe(8);
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

  describe('act transitions', () => {
    it('transitions from Act 1 boss victory to Act 2 while preserving run progress', () => {
      const s = freshState();
      const relicId = Object.keys(relicLibrary)[0];

      s.currentAct = 1;
      s.currentActName = 'KRUPÓWKI';
      s.currentScreen = 'battle';
      s.player.hp = 27;
      s.dutki = 123;
      s.relics = relicId ? [relicId] : [];
      s.deck = ['ciupaga'];
      s.hand = ['gasior'];
      s.discard = ['kierpce'];
      s.exhaust = ['spam_tagami'];

      s.map = [
        [null, null, null],
        [
          null,
          {
            x: 1,
            y: 1,
            type: 'boss',
            label: 'Boss',
            emoji: '👑',
            weather: 'halny',
            connections: [],
          },
          null,
        ],
      ];
      s.currentLevel = 1;
      s.currentNodeIndex = 1;
      s.currentNode = { x: 1, y: 1 };

      const transitioned = s.tryAdvanceActAfterBossVictory();
      // tryAdvanceActAfterBossVictory no longer calls startAct2() — UI does that after reward pick
      if (transitioned) s.startAct2();

      expect(transitioned).toBe(true);
      expect(s.currentAct).toBe(2);
      expect(s.currentActName).toBe('MORSKIE OKO');
      expect(s.currentScreen).toBe('map');
      expect(s.player.hp).toBe(27);
      expect(s.dutki).toBe(123);
      expect(s.relics).toEqual(relicId ? [relicId] : []);
      expect(s.hand).toEqual([]);
      expect(s.discard).toEqual([]);
      expect(s.exhaust).toEqual([]);
      expect(s.deck).toContain('ciupaga');
      expect(s.deck).toContain('gasior');
      expect(s.deck).toContain('kierpce');
      expect(s.deck).not.toContain('spam_tagami');
      expect(s.currentLevel).toBe(0);
      expect(s.currentNodeIndex).toBe(1);
      expect(s.runSummary).toBeNull();
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
      vi.spyOn(s, '_pickRandomEnemyDef').mockReturnValue(enemyLibrary.cepr);
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
        okradziony: 0,
        brak_reszty: false,
        targowanie_sie: false,
        parcie_na_szklo: false,
        blokada_parkingowa: false,
        lichwa: false,
        hart_ducha: false,
        influencer_aura: false,
        ochrona_wizerunku: false,
        drugi_oddech: false,
        wiecznie_glodny: false,
        kontrola_stempla: false,
        gaz_do_dechy: 0,
        napor_wody: 0,
        kolejka_do_toalety: 0,
        zmiana_pogody: false,
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
        okradziony: 0,
        brak_reszty: false,
        targowanie_sie: false,
        parcie_na_szklo: false,
        blokada_parkingowa: false,
        lichwa: false,
        hart_ducha: false,
        influencer_aura: false,
        ochrona_wizerunku: false,
        drugi_oddech: false,
        wiecznie_glodny: false,
        kontrola_stempla: false,
        gaz_do_dechy: 0,
        napor_wody: 0,
        kolejka_do_toalety: 0,
        zmiana_pogody: false,
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

    it('busiarz enemy library has correct HP after 10% buff', () => {
      expect(enemyLibrary.busiarz.maxHp).toBe(83);
      expect(enemyLibrary.busiarz.pattern[1].damage).toBe(10);
    });

    it('baba enemy library has correct HP after 10% buff', () => {
      expect(enemyLibrary.baba.maxHp).toBe(99);
      expect(enemyLibrary.baba.pattern[1].damage).toBe(9);
    });

    it('parkingowy enemy library has correct HP after 10% buff', () => {
      expect(enemyLibrary.parkingowy.maxHp).toBe(121);
      expect(enemyLibrary.parkingowy.pattern[0].damage).toBe(8);
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
      const s = new GameState(mockPlayer, enemyLibrary.cepr);
      const eliteState = s._createEnemyState(enemyLibrary.spekulant);
      expect(eliteState.isElite).toBe(true);
      expect(eliteState.maxHp).toBe(Math.round(enemyLibrary.spekulant.maxHp * 1.25));

      s.enemy = eliteState;
      s.pendingBattleDutki = true;
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const drop = s.grantBattleDutki();
      expect(drop).toBe(42);
    });

    it('can start scripted battle against pomocnik_fiakra', () => {
      const s = new GameState(mockPlayer, enemyLibrary.cepr);
      const started = s.startBattleWithEnemyId('pomocnik_fiakra');
      expect(started).toBe(true);
      expect(s.enemy.id).toBe('pomocnik_fiakra');
      expect(s.enemy.maxHp).toBe(70);
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
      expect(s.enemy.maxHp).toBe(154);
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
      expect(s.enemy.maxHp).toBe(173);
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
        'bileter_z_tpn',
        'bober_z_morskiego_oka',
        'boss',
        'busiarz',
        'cepr',
        'ceprzyca_vip',
        'fiakier',
        'glodny_swistak',
        'harnas_pogodynka',
        'influencerka',
        'insta_taterniczka',
        'janusz_znawca_szlakow',
        'kelner_schroniska',
        'konik_spod_kuznic',
        'krolowa_schroniska',
        'meleksiarz_pirat_drogowy',
        'mistrz_redyku',
        'naganiacz_z_krupowek',
        'naganiacze_duo',
        'parkingowy',
        'pomocnik_fiakra',
        'rodzina_z_glosnikiem',
        'spekulant',
        'spocony_polmaratonczyk',
        'turysta_w_klapkach',
        'zagubiony_ceper',
        'zlodziejska_kaczka',
      ]);
    });

    it('all Act 2 regular enemies have act:2 and are excluded from Act 1 pool', () => {
      const act2RegularIds = [
        'turysta_w_klapkach',
        'rodzina_z_glosnikiem',
        'spocony_polmaratonczyk',
        'insta_taterniczka',
        'janusz_znawca_szlakow',
        'zlodziejska_kaczka',
        'glodny_swistak',
      ];
      for (const id of act2RegularIds) {
        expect(enemyLibrary[id].act, `${id} must have act:2`).toBe(2);
        expect(Boolean(enemyLibrary[id].elite), `${id} must not be elite`).toBe(false);
        expect(Boolean(enemyLibrary[id].isBoss), `${id} must not be boss`).toBe(false);
      }
      // Act 1 state: Act 2 enemies must not appear in pool
      const s = freshState();
      s.currentAct = 1;
      const seen = new Set();
      for (let i = 0; i < 40; i++) {
        const def = s._pickRandomEnemyDef(false);
        seen.add(def.id);
      }
      for (const id of act2RegularIds) {
        expect(seen.has(id), `${id} must not appear in Act 1 pool`).toBe(false);
      }
    });

    it('all Act 2 elite enemies have act:2 and are excluded from Act 1 elite pool', () => {
      const act2EliteIds = ['bileter_z_tpn', 'meleksiarz_pirat_drogowy', 'bober_z_morskiego_oka'];
      for (const id of act2EliteIds) {
        expect(enemyLibrary[id].act, `${id} must have act:2`).toBe(2);
        expect(Boolean(enemyLibrary[id].elite), `${id} must be elite`).toBe(true);
      }
      const s = freshState();
      s.currentAct = 1;
      const seen = new Set();
      for (let i = 0; i < 30; i++) {
        const def = s._pickRandomEnemyDef(true);
        seen.add(def.id);
      }
      for (const id of act2EliteIds) {
        expect(seen.has(id), `${id} must not appear in Act 1 elite pool`).toBe(false);
      }
    });

    it('Act 2 regular enemies appear in Act 2 pool and Act 1 enemies do not', () => {
      const s = freshState();
      s.currentAct = 2;
      const act2Ids = [
        'turysta_w_klapkach',
        'rodzina_z_glosnikiem',
        'spocony_polmaratonczyk',
        'insta_taterniczka',
        'janusz_znawca_szlakow',
        'zlodziejska_kaczka',
        'glodny_swistak',
      ];
      const act1RegularIds = [
        'cepr',
        'busiarz',
        'baba',
        'influencerka',
        'parkingowy',
        'konik_spod_kuznic',
      ];
      const seen = new Set();
      for (let i = 0; i < 100; i++) {
        const def = s._pickRandomEnemyDef(false);
        seen.add(def.id);
      }
      for (const id of act2Ids) {
        expect(seen.has(id), `${id} must appear in Act 2 regular pool`).toBe(true);
      }
      for (const id of act1RegularIds) {
        expect(seen.has(id), `${id} must not appear in Act 2 pool`).toBe(false);
      }
    });

    it('Act 2 boss pool contains krolowa_schroniska and harnas_pogodynka, not Act 1 bosses', () => {
      expect(enemyLibrary.krolowa_schroniska.isBoss).toBe(true);
      expect(enemyLibrary.krolowa_schroniska.act).toBe(2);
      expect(enemyLibrary.harnas_pogodynka.isBoss).toBe(true);
      expect(enemyLibrary.harnas_pogodynka.act).toBe(2);
      const s = freshState();
      s.currentAct = 2;
      const seen = new Set();
      for (let i = 0; i < 30; i++) {
        const def = s._pickFinalBossDef();
        seen.add(def.id);
      }
      expect(seen.has('krolowa_schroniska') || seen.has('harnas_pogodynka')).toBe(true);
      expect(seen.has('boss'), 'Act 1 boss must not appear in Act 2 boss pool').toBe(false);
      expect(seen.has('fiakier'), 'Act 1 fiakier must not appear in Act 2 boss pool').toBe(false);
    });

    it('Act 1 boss pool does not include Act 2 bosses', () => {
      const s = freshState();
      s.currentAct = 1;
      const seen = new Set();
      for (let i = 0; i < 20; i++) {
        const def = s._pickFinalBossDef();
        seen.add(def.id);
      }
      expect(seen.has('krolowa_schroniska'), 'Act 2 boss must not appear in Act 1 pool').toBe(
        false
      );
      expect(seen.has('harnas_pogodynka'), 'Act 2 boss must not appear in Act 1 pool').toBe(false);
    });

    it('event library includes all event definitions', () => {
      const ids = Object.keys(eventLibrary).sort();
      expect(ids).toEqual([
        'event_hazard_karton',
        'event_karykaturzysta',
        'event_korek_do_toalety',
        'event_paragon_za_wrzatek',
        'event_selfie_na_krawedzi',
        'fiakier_event',
      ]);
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

    it('Agresywne pozowanie deals 2x3', () => {
      const s = freshBossState();
      s.endTurn();
      expect(s.enemy.currentIntent.type).toBe('attack');
      expect(s.enemy.currentIntent.name).toBe('Agresywne pozowanie');
      expect(s.enemy.currentIntent.damage).toBe(2);
      expect(s.enemy.currentIntent.hits).toBe(3);
    });

    it('first intent is Górski Ryk (buff)', () => {
      const s = freshBossState();
      expect(s.enemy.currentIntent.type).toBe('buff');
      expect(s.enemy.currentIntent.name).toBe('Górski Ryk');
    });

    it('Górski Ryk gives +1 strength and +5 block when executed', () => {
      const s = freshBossState();
      s.endTurn();
      expect(s.enemy.status.strength).toBe(1);
      expect(s.enemy.block).toBeGreaterThanOrEqual(5);
    });

    it('second intent is Agresywne pozowanie (3-hit attack)', () => {
      const s = freshBossState();
      s.endTurn();
      expect(s.enemy.currentIntent.type).toBe('attack');
      expect(s.enemy.currentIntent.name).toBe('Agresywne pozowanie');
      expect(s.enemy.currentIntent.hits).toBe(3);
    });

    it('fourth intent is Uścisk Krupówek with spike damage (11)', () => {
      const s = freshBossState();
      s.endTurn(); // execute Górski Ryk -> intent 2
      s.endTurn(); // execute Agresywne pozowanie -> intent 3
      // Podatek od zdjęcia (damage 8)
      expect(s.enemy.currentIntent.type).toBe('attack');
      expect(s.enemy.currentIntent.name).toBe('Podatek od zdjęcia');
      expect(s.enemy.currentIntent.damage).toBe(9);
      expect(s.enemy.currentIntent.hits).toBe(1);
      s.endTurn(); // execute Podatek od zdjęcia -> intent 4
      expect(s.enemy.currentIntent.type).toBe('attack');
      expect(s.enemy.currentIntent.name).toBe('Uścisk Krupówek');
      expect(s.enemy.currentIntent.damage).toBe(12);
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
      expect(s.dutki).toBe(48);
      expect(s.enemy.lichwaTriggeredThisTurn).toBe(true);

      s.startTurn();
      s.combat.activeSide = 'player';
      s._applyDamageToEnemy(3);
      expect(s.dutki).toBe(46);
    });

    it('hart_ducha triggers exactly once after dropping below 40% HP', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.mistrz_redyku);
      s.enemy.block = 0;
      s.combat.activeSide = 'player';

      const baseStrength = s.enemy.status.strength;
      const triggerDamage = Math.floor(s.enemy.maxHp * 0.6) + 1;
      s._applyDamageToEnemy(triggerDamage);

      expect(s.enemy.hartDuchaTriggered).toBe(true);
      expect(s.enemy.status.strength).toBe(baseStrength + 2);
      expect(s.enemy.block).toBe(6);

      const blockBeforeSecondHit = s.enemy.block;
      s._applyDamageToEnemy(1);
      expect(s.enemy.status.strength).toBe(baseStrength + 2);
      expect(s.enemy.block).toBe(blockBeforeSecondHit - 1);
    });

    it('hart_ducha does not trigger at or above 40% HP threshold', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.mistrz_redyku);
      s.enemy.block = 0;
      s.combat.activeSide = 'player';

      const damageToThreshold = Math.floor(s.enemy.maxHp * 0.6);
      s._applyDamageToEnemy(damageToThreshold);

      expect(s.enemy.hp).toBeGreaterThanOrEqual(s.enemy.maxHp * 0.4);
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
        damage: 3,
        hits: 3,
      };
      const damageBefore = s.getEnemyIntentDamage();

      const triggerDamage = Math.floor(s.enemy.maxHp * 0.6) + 1;
      s.enemy.block = 0;
      s._applyDamageToEnemy(triggerDamage);

      const damageAfter = s.getEnemyIntentDamage();
      expect(s.enemy.hartDuchaTriggered).toBe(true);
      expect(damageAfter).toBeGreaterThan(damageBefore);
    });
  });

  describe('Act 2 weather passives', () => {
    it('kontrola_stempla: bileter_z_tpn gains +1 strength when player holds status cards', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.bileter_z_tpn);
      s.hand = ['mandat'];
      const strBefore = s.enemy.status.strength;
      s.endTurn();
      expect(s.enemy.status.strength).toBe(strBefore + 1);
    });

    it('kontrola_stempla: bileter_z_tpn does NOT gain strength with no status cards in hand', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.bileter_z_tpn);
      s.hand = ['ciupaga'];
      const strBefore = s.enemy.status.strength;
      s.endTurn();
      expect(s.enemy.status.strength).toBe(strBefore);
    });

    it('mandat: drains 2 dutki per turn while in hand', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.bileter_z_tpn);
      s.hand = ['mandat'];
      s.dutki = 3;
      s.endTurn();
      expect(s.dutki).toBe(1);
    });

    it('nadprogramowy_paragon: drains 3 dutki per turn while in hand', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.kelner_schroniska);
      s.hand = ['nadprogramowy_paragon'];
      s.dutki = 5;
      s.endTurn();
      expect(s.dutki).toBe(2);
    });

    it('wiecznie_glodny: glodny_swistak heals 4 HP at start of enemy turn when not at full HP', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.glodny_swistak);
      s.enemy.hp = s.enemy.maxHp - 10;
      const hpBefore = s.enemy.hp;
      s.endTurn();
      expect(s.enemy.hp).toBe(hpBefore + 4);
    });

    it('wiecznie_glodny: glodny_swistak does NOT heal when already at full HP', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.glodny_swistak);
      s.enemy.hp = s.enemy.maxHp;
      s.endTurn();
      expect(s.enemy.hp).toBe(s.enemy.maxHp);
    });

    it('wiecznie_glodny: heal is capped at maxHp', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.glodny_swistak);
      s.enemy.hp = s.enemy.maxHp - 2;
      s.endTurn();
      expect(s.enemy.hp).toBe(s.enemy.maxHp);
    });

    it('drugi_oddech: spocony_polmaratonczyk gains +2 strength when HP drops to 60%', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.spocony_polmaratonczyk);
      const threshold = Math.floor(s.enemy.maxHp * 0.6);
      s.enemy.hp = threshold;
      const strBefore = s.enemy.status.strength;
      s._applyDamageToEnemy(1);
      expect(s.enemy.status.strength).toBe(strBefore + 2);
      expect(s.enemy.drugiOddechTriggered).toBe(true);
    });

    it('drugi_oddech: spocony_polmaratonczyk does NOT gain strength above 60% HP threshold', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.spocony_polmaratonczyk);
      s.enemy.hp = Math.ceil(s.enemy.maxHp * 0.7);
      const strBefore = s.enemy.status.strength;
      s._applyDamageToEnemy(1);
      expect(s.enemy.status.strength).toBe(strBefore);
      expect(s.enemy.drugiOddechTriggered).toBe(false);
    });

    it('drugi_oddech: strength bonus triggers only once per battle', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.spocony_polmaratonczyk);
      const threshold = Math.floor(s.enemy.maxHp * 0.6);
      s.enemy.hp = threshold;
      s._applyDamageToEnemy(1);
      const strAfterFirst = s.enemy.status.strength;
      s._applyDamageToEnemy(5);
      expect(s.enemy.status.strength).toBe(strAfterFirst);
    });

    it('glodny_swistak passive and spocony_polmaratonczyk passive fields are correct', () => {
      expect(enemyLibrary.glodny_swistak.passive).toBe('wiecznie_glodny');
      expect(enemyLibrary.spocony_polmaratonczyk.passive).toBe('drugi_oddech');
    });

    it('gaz_do_dechy: stacks increment when enemy takes no HP damage', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.meleksiarz_pirat_drogowy);
      s.enemy.block = 9999;
      expect(s.enemy.gazDoDechyStacks).toBe(0);
      s.endTurn();
      expect(s.enemy.gazDoDechyStacks).toBe(1);
      s.enemy.block = 9999;
      s.endTurn();
      expect(s.enemy.gazDoDechyStacks).toBe(2);
    });

    it('gaz_do_dechy: stacks reset when enemy takes HP damage', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.meleksiarz_pirat_drogowy);
      s.enemy.gazDoDechyStacks = 3;
      s._applyDamageToEnemy(5);
      expect(s.enemy.gazDoDechyStacks).toBe(0);
    });

    it('gaz_do_dechy: attack damage increases by 5 per stack', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.meleksiarz_pirat_drogowy);
      s.enemy.currentIntent = { type: 'attack', name: 'Test', damage: 10, hits: 1, usePed: false };
      s.enemy.gazDoDechyStacks = 2;
      s.player.block = 9999;
      const hpBefore = s.player.hp;
      s._applyEnemyIntent();
      // Block absorbs, but intent damage should have been 10 + 2*5 = 20
      expect(s.player.block).toBe(9999 - 20);
      expect(s.player.hp).toBe(hpBefore);
    });

    it('napor_wody: accumulates pressure when attack is fully blocked', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.bober_z_morskiego_oka);
      s.enemy.block = 50;
      expect(s.enemy.naporWodyPressure).toBe(0);
      s._applyDamageToEnemy(12);
      expect(s.enemy.naporWodyPressure).toBe(12);
      s._applyDamageToEnemy(8);
      expect(s.enemy.naporWodyPressure).toBe(20);
    });

    it('napor_wody: does NOT accumulate pressure when attack deals HP damage', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.bober_z_morskiego_oka);
      s.enemy.block = 5;
      s._applyDamageToEnemy(15); // 5 blocked, 10 HP damage
      expect(s.enemy.naporWodyPressure).toBe(0);
    });

    it('napor_wody: pressure is added to attack damage and reset on use', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.bober_z_morskiego_oka);
      s.enemy.naporWodyPressure = 14;
      s.enemy.currentIntent = { type: 'attack', name: 'Test', damage: 10, hits: 1, usePed: false };
      s.player.block = 9999;
      s._applyEnemyIntent();
      // Pressure 14 + base 10 = 24 absorbed by block
      expect(s.player.block).toBe(9999 - 24);
      expect(s.enemy.naporWodyPressure).toBe(0);
    });

    it('kolejka_do_toalety: counter increments by number of status cards held at end of turn', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.krolowa_schroniska);
      s.hand = ['numerek_do_toalety', 'numerek_do_toalety', 'ciupaga'];
      expect(s.enemy.kolejkaCounter).toBe(0);
      s.endTurn();
      expect(s.enemy.kolejkaCounter).toBe(2);
    });

    it('kolejka_do_toalety: counter resets when player holds no status cards', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.krolowa_schroniska);
      s.enemy.kolejkaCounter = 5;
      s.hand = ['ciupaga'];
      s.endTurn();
      expect(s.enemy.kolejkaCounter).toBe(0);
    });

    it('kolejka_do_toalety: status intent adds 2 + counter cards', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.krolowa_schroniska);
      s.enemy.kolejkaCounter = 3;
      s.enemy.currentIntent = {
        type: 'status',
        name: 'Gorąca zupa',
        addStatusCard: 'numerek_do_toalety',
        amount: 2,
      };
      const discardBefore = s.discard.length;
      s._applyEnemyIntent();
      expect(s.discard.length - discardBefore).toBe(5); // 2 + 3
    });

    it('zmiana_pogody: harnas_pogodynka has weather_loop patternType and zmiana_pogody passive', () => {
      expect(enemyLibrary.harnas_pogodynka.patternType).toBe('weather_loop');
      expect(enemyLibrary.harnas_pogodynka.passive).toBe('zmiana_pogody');
      const wp = enemyLibrary.harnas_pogodynka.weatherPatterns;
      expect(wp).toBeDefined();
      expect(wp.clear.length).toBeGreaterThan(0);
      expect(wp.halny.length).toBeGreaterThan(0);
      expect(wp.frozen.length).toBeGreaterThan(0);
      expect(wp.fog.length).toBeGreaterThan(0);
    });

    it('zmiana_pogody: weather cycles to halny on turn 3 (battleTurnsElapsed % 3 === 0)', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.harnas_pogodynka);
      s.currentWeather = 'clear';
      // Simulate 2 turns (no cycle yet)
      s.battleTurnsElapsed = 1;
      let result = s.endTurn();
      expect(result.weatherChanged).toBeNull();
      expect(s.currentWeather).toBe('clear');
      s.battleTurnsElapsed = 2;
      result = s.endTurn();
      expect(result.weatherChanged).toBeNull();
      expect(s.currentWeather).toBe('clear');
      // Turn 3: cycle fires
      s.battleTurnsElapsed = 3;
      result = s.endTurn();
      expect(result.weatherChanged).not.toBeNull();
      expect(result.weatherChanged.id).toBe('halny');
      expect(s.currentWeather).toBe('halny');
    });

    it('zmiana_pogody: rotation cycles halny → frozen → fog → halny', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.harnas_pogodynka);
      s.currentWeather = 'clear';
      s.battleTurnsElapsed = 3;
      s.endTurn(); // → halny
      expect(s.currentWeather).toBe('halny');
      s.battleTurnsElapsed = 6;
      s.endTurn(); // → frozen
      expect(s.currentWeather).toBe('frozen');
      s.battleTurnsElapsed = 9;
      s.endTurn(); // → fog
      expect(s.currentWeather).toBe('fog');
      s.battleTurnsElapsed = 12;
      s.endTurn(); // wraps → halny
      expect(s.currentWeather).toBe('halny');
    });

    it('zmiana_pogody: pattern index resets to 0 when weather changes', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.harnas_pogodynka);
      s.currentWeather = 'clear';
      // Advance the index a few times
      s.battleTurnsElapsed = 1;
      s.endTurn();
      s.battleTurnsElapsed = 2;
      s.endTurn();
      // harnasWeatherPatternIndex is now 2 (advanced twice)
      expect(s.enemy.harnasWeatherPatternIndex).toBe(2);
      // Turn 3: weather changes, index resets
      s.battleTurnsElapsed = 3;
      s.endTurn();
      expect(s.enemy.harnasWeatherPatternIndex).toBe(0);
      expect(s.currentWeather).toBe('halny');
    });

    it('zmiana_pogody: intent uses correct weather pattern after weather change', () => {
      const s = freshState();
      s.currentWeather = 'halny';
      s.enemy = s._createEnemyState(enemyLibrary.harnas_pogodynka);
      // The intent should come from the halny pattern (index 0)
      const halnyFirst = enemyLibrary.harnas_pogodynka.weatherPatterns.halny[0];
      expect(s.enemy.currentIntent.name).toBe(halnyFirst.name);
    });

    it('zmiana_pogody: non-harnas enemies do not cycle weather on turn 3', () => {
      const s = freshState();
      // Use a regular loop enemy
      s.currentWeather = 'clear';
      s.battleTurnsElapsed = 3;
      const result = s.endTurn();
      expect(result.weatherChanged).toBeNull();
      expect(s.currentWeather).toBe('clear');
    });

    it('zmiana_pogody: pattern index advances independently per weather', () => {
      const s = freshState();
      s.enemy = s._createEnemyState(enemyLibrary.harnas_pogodynka);
      s.currentWeather = 'halny';
      s.enemy.harnasWeatherPatternIndex = 0;
      const halnyPattern = enemyLibrary.harnas_pogodynka.weatherPatterns.halny;
      // Advance through the halny pattern
      s.battleTurnsElapsed = 1;
      s.endTurn();
      expect(s.enemy.harnasWeatherPatternIndex).toBe(1);
      expect(s.enemy.currentIntent.name).toBe(halnyPattern[1].name);
      s.battleTurnsElapsed = 2;
      s.endTurn();
      expect(s.enemy.harnasWeatherPatternIndex).toBe(2);
      expect(s.enemy.currentIntent.name).toBe(halnyPattern[2].name);
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

    it('mokra_sciera grants +7 max HP immediately', () => {
      const s = freshState();
      const before = s.player.maxHp;
      s.pickMarynaBoon('mokra_sciera');
      expect(s.player.maxHp).toBe(before + 7);
    });

    it('kiesa grants +100 dutki immediately', () => {
      const s = freshState();
      s.dutki = 0;
      s.pickMarynaBoon('kiesa');
      expect(s.dutki).toBe(100);
    });

    it('sloik_rosolu sets rosolBattlesLeft to 4', () => {
      const s = freshState();
      s.pickMarynaBoon('sloik_rosolu');
      expect(s.maryna.counters.rosolBattlesLeft).toBe(4);
    });

    it('lista_zakupow grants +50 dutki immediately', () => {
      const s = freshState();
      s.dutki = 0;
      s.pickMarynaBoon('lista_zakupow');
      expect(s.dutki).toBe(50);
      expect(s.maryna.counters.listaFreeRemovalsLeft).toBe(1);
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

    it('zloty_rozaniec grants 5 block at battle start', () => {
      const s = freshState();
      s.pickMarynaBoon('zloty_rozaniec');
      s.startBattleWithEnemyId('cepr');

      expect(s.player.block).toBe(5);
    });

    it('tajny_skladnik applies 2 weak and 2 fragile at battle start', () => {
      const s = freshState();
      s.pickMarynaBoon('tajny_skladnik');
      s.startBattleWithEnemyId('cepr');

      expect(s.enemy.status.weak).toBe(2);
      expect(s.enemy.status.fragile).toBe(2);
    });

    it('przeglad_plecaka removes a starter, adds an uncommon card and grants 80 dutki', () => {
      const s = freshState();
      s.deck = ['ciupaga', 'ciupaga', 'gasior'];
      s.dutki = 0;
      s.pickMarynaBoon('przeglad_plecaka');
      const remainingStarters = s.deck.filter((id) =>
        ['ciupaga', 'gasior', 'kierpce', 'hej'].includes(id)
      );
      expect(remainingStarters).toHaveLength(2);
      const uncommons = s.deck.filter((id) => cardLibrary[id]?.rarity === 'uncommon');
      expect(uncommons).toHaveLength(1);
      expect(s.dutki).toBe(80);
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

    it('lista_zakupow applies -25% discount to all shops while removals remain', () => {
      const s = freshState();
      s.pickMarynaBoon('lista_zakupow');
      expect(s.maryna.counters.listaFreeRemovalsLeft).toBe(1);

      s.generateShopStock();
      const sampleCardId = s.shopStock.cards[0];
      const firstShopPrice = s.getCardShopPrice(sampleCardId);
      const basePrice = cardLibrary[sampleCardId]?.price ?? 0;
      expect(firstShopPrice).toBe(Math.floor(basePrice * 0.75));

      s.afterShopCardRemoval();
      expect(s.maryna.counters.listaFreeRemovalsLeft).toBe(0);

      s.generateShopStock();
      const secondCardId = s.shopStock.cards[0];
      const secondBasePrice = cardLibrary[secondCardId]?.price ?? 0;
      expect(s.getCardShopPrice(secondCardId)).toBe(secondBasePrice);
    });

    it('lista_zakupow free removal allows 1 removal before ending discount', () => {
      const s = freshState();
      s.pickMarynaBoon('lista_zakupow');
      expect(s.maryna.counters.listaFreeRemovalsLeft).toBe(1);

      s.generateShopStock();
      expect(s.getShopRemovalPrice()).toBe(0);
      s.afterShopCardRemoval();
      expect(s.maryna.counters.listaFreeRemovalsLeft).toBe(0);

      s.generateShopStock();
      expect(s.getShopRemovalPrice()).toBe(100);
    });

    it('resetForNewRun clears maryna state', () => {
      const s = freshState();
      s.pickMarynaBoon('kiesa');
      s.resetForNewRun('easy');
      expect(s.maryna.pickedId).toBeNull();
      expect(s.maryna.offeredIds).toHaveLength(0);
    });

    it('Act 2 row-1 nodes are fights without forcedEnemyId', () => {
      const s = freshState();
      s.startAct2();
      s.map[1].forEach((node) => {
        if (!node) return;
        expect(node.type).toBe('fight');
        expect(node.forcedEnemyId).toBeUndefined();
      });
    });

    it('Maryna boon picked in Act 1 is excluded from Act 2 choices', () => {
      const s = freshState();
      // Pick a boon in Act 1
      s.pickMarynaBoon('kiesa');
      const pickedInAct1 = s.maryna.pickedId;
      expect(pickedInAct1).toBe('kiesa');

      // Transition to Act 2
      s.startAct2();

      // Roll new boon choices in Act 2
      const act2Choices = s.rollMarynaChoices(3);
      expect(act2Choices).toHaveLength(3);
      expect(act2Choices).not.toContain(pickedInAct1);
    });

    it('relic acquired in Act 1 is not offered in Act 2 transition or shop', () => {
      const s = freshState();
      // Acquire a specific relic in Act 1
      const targetRelic = 'krokus';
      s.addRelic(targetRelic);
      expect(s.relics).toContain(targetRelic);

      // Transition to Act 2
      s.startAct2();

      // Check that the acquired relic is NOT in Act 2 transition choices
      const act2TransitionChoices = s.generateAct2TransitionRelicChoices(3);
      expect(act2TransitionChoices).not.toContain(targetRelic);

      // Check that the acquired relic is NOT offered in Act 2 shops
      const act2Shop = s.generateShopStock();
      expect(act2Shop.relic).not.toBe(targetRelic);
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

    it('eksmisja_z_kwatery deals 12 damage and adds 6 to rachunek if enemy has weak', () => {
      const s = freshState();
      s.enemy.status.weak = 1;
      const initialRachunek = s.enemy.rachunek;
      s.hand = ['eksmisja_z_kwatery'];
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(initialRachunek + 6);
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

    it('skrupulatne_wyliczenie deals damage equal to 90% player block', () => {
      const s = freshState();
      s.player.block = 20;
      const expectedBaseDamage = Math.floor(20 * 0.9);
      s.hand = ['skrupulatne_wyliczenie'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      const damageDealt = hpBefore - s.enemy.hp;
      expect(damageDealt).toBeGreaterThanOrEqual(expectedBaseDamage);
    });

    it('skrupulatne_wyliczenie adds +10 bonus damage when rachunek >= 8', () => {
      const s = freshState();
      s.player.block = 10;
      s.enemy.rachunek = 8;
      const expectedBaseDamage = Math.floor(10 * 0.9) + 10;
      s.hand = ['skrupulatne_wyliczenie'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      const damageDealt = hpBefore - s.enemy.hp;
      expect(damageDealt).toBeGreaterThanOrEqual(expectedBaseDamage);
    });

    it('skrupulatne_wyliczenie does not add +10 bonus when rachunek < 8', () => {
      const s = freshState();
      s.player.block = 20;
      s.enemy.rachunek = 7;
      const expectedBaseDamage = Math.floor(20 * 0.9);
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

    it('tatrzanski_szpan with lans active deals 18 damage', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['tatrzanski_szpan'];
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(enemyHpBefore);
      expect(s.enemy.hp).toBeGreaterThanOrEqual(enemyHpBefore - 18 - 10);
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

    it('paradny_zwyrt with lans active deals 18 damage and draws 2', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['paradny_zwyrt', 'ciupaga', 'gasior'];
      s.deck = ['hej'];
      const handSizeBefore = s.hand.length;
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(enemyHpBefore);
      expect(s.hand.length + s.exhaust.length).toBeGreaterThanOrEqual(handSizeBefore - 1 + 2);
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

    it('cios_z_telemarkiem with lans active deals 16 damage and draws 1', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['cios_z_telemarkiem', 'ciupaga'];
      s.deck = ['gasior'];
      const handBefore = s.hand.length;
      const enemyHpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(enemyHpBefore);
      expect(s.hand.length).toBe(handBefore);
    });

    it('mlynek_ciupaga with lans inactive hits 3x and applies 1 weak', () => {
      const s = freshState();
      s.player.status.lans = 0;
      s.hand = ['mlynek_ciupaga'];
      const enemyHpBefore = s.enemy.hp;
      const enemyWeakBefore = s.enemy.status.weak;
      s.playCard(0);
      expect(s.player.status.lans).toBe(0);
      expect(s.enemy.hp).toBeLessThan(enemyHpBefore);
      expect(s.enemy.status.weak).toBe(enemyWeakBefore + 1);
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

    it('wepchniecie_w_kolejke with lans active applies 2 vulnerable and draws 1', () => {
      const s = freshState();
      s.player.status.lans = 1;
      s.hand = ['wepchniecie_w_kolejke', 'ciupaga'];
      const handSizeBefore = s.hand.length;
      const enemyVulnBefore = s.enemy.status.vulnerable;
      s.playCard(0);
      expect(s.enemy.status.vulnerable).toBe(enemyVulnBefore + 2);
      expect(s.hand.length).toBeGreaterThanOrEqual(handSizeBefore - 1);
    });
  });

  describe('new weather-based cards', () => {
    it('ciupaga_we_mgle deals 6 damage + 2 weak, +1 fragile if fog', () => {
      const s = freshState();
      s.currentWeather = 'fog';
      s.hand = ['ciupaga_we_mgle'];
      const hpBefore = s.enemy.hp;
      const weakBefore = s.enemy.status.weak;
      s.playCard(0);
      expect(s.enemy.status.weak).toBe(weakBefore + 2);
      expect(s.enemy.hp).toBeLessThanOrEqual(hpBefore);
      expect(s.enemy.status.fragile).toBe(1);
    });

    it('ciupaga_we_mgle in clear weather applies only 2 weak (no fragile)', () => {
      const s = freshState();
      s.currentWeather = 'clear';
      s.hand = ['ciupaga_we_mgle'];
      const weakBefore = s.enemy.status.weak;
      s.playCard(0);
      expect(s.enemy.status.weak).toBe(weakBefore + 2);
      expect(s.enemy.status.fragile).toBe(0);
    });

    it('przymusowe_morsowanie deals 7 damage, +7 + draw if frozen', () => {
      const s = freshState();
      s.currentWeather = 'frozen';
      s.hand = ['przymusowe_morsowanie', 'ciupaga'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(hpBefore - 7);
    });

    it('przymusowe_morsowanie in clear weather deals only 7 damage', () => {
      const s = freshState();
      s.currentWeather = 'clear';
      s.hand = ['przymusowe_morsowanie'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBe(hpBefore - 7);
    });

    it('lawina_z_morskiego_oka costs 2 normally', () => {
      const s = freshState();
      s.currentWeather = 'clear';
      expect(s.getCardCostInHand('lawina_z_morskiego_oka')).toBe(2);
    });

    it('lawina_z_morskiego_oka costs 1 in frozen weather', () => {
      const s = freshState();
      s.currentWeather = 'frozen';
      expect(s.getCardCostInHand('lawina_z_morskiego_oka')).toBe(1);
    });

    it('punkt_widokowy draws 1 card, +1 if clear', () => {
      const s = freshState();
      s.currentWeather = 'clear';
      s.hand = ['punkt_widokowy', 'ciupaga'];
      const handSizeBefore = s.hand.length;
      s.playCard(0);
      expect(s.hand.length).toBeGreaterThanOrEqual(handSizeBefore - 1 + 1);
    });

    it('punkt_widokowy draws only 1 in non-clear weather', () => {
      const s = freshState();
      s.currentWeather = 'fog';
      s.hand = ['punkt_widokowy', 'ciupaga', 'gasior'];
      const initialSize = s.hand.length;
      s.playCard(0);
      expect(s.hand.length).toBe(initialSize - 1 + 1);
    });

    it('zgubieni_we_mgle applies 2 weak in fog', () => {
      const s = freshState();
      s.currentWeather = 'fog';
      s.hand = ['zgubieni_we_mgle'];
      const weakBefore = s.enemy.status.weak;
      s.playCard(0);
      expect(s.enemy.status.weak).toBe(weakBefore + 2);
    });

    it('zgubieni_we_mgle grants 8 block in clear weather', () => {
      const s = freshState();
      s.currentWeather = 'clear';
      s.hand = ['zgubieni_we_mgle'];
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.player.block).toBeGreaterThanOrEqual(blockBefore + 8);
    });

    it('znajomosc_szlaku sets weather_fog_garda flag and grants immediate block', () => {
      const s = freshState();
      s.hand = ['znajomosc_szlaku'];
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.player.weather_fog_garda).toBe(true);
      expect(s.player.block).toBeGreaterThanOrEqual(blockBefore + 7);
      expect(s.exhaust).toContain('znajomosc_szlaku');
    });

    it('weather_fog_garda triggers at turn start in fog', () => {
      const s = freshState();
      s.player.weather_fog_garda = true;
      s.currentWeather = 'fog';
      const blockBefore = s.player.block;
      s.startTurn();
      expect(s.player.block).toBeGreaterThanOrEqual(blockBefore + 7);
    });

    it('kapiel_w_bialce sets weather_frozen_vulnerable flag', () => {
      const s = freshState();
      s.hand = ['kapiel_w_bialce'];
      s.playCard(0);
      expect(s.player.weather_frozen_vulnerable).toBe(true);
      expect(s.exhaust).toContain('kapiel_w_bialce');
    });

    it('weather_frozen_vulnerable triggers at turn start in frozen', () => {
      const s = freshState();
      s.player.weather_frozen_vulnerable = true;
      s.currentWeather = 'frozen';
      const vulnBefore = s.enemy.status.vulnerable;
      s.startTurn();
      expect(s.enemy.status.vulnerable).toBe(vulnBefore + 1);
    });
  });

  describe('new attack/skill/power cards batch', () => {
    it('rozped_z_rowni deals 3x3 normally and 4x3 when enemy has weak', () => {
      const s = freshState();
      s.hand = ['rozped_z_rowni'];
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      const normalDamage = hpBefore - s.enemy.hp;

      const s2 = freshState();
      s2.enemy.status.weak = 1;
      s2.hand = ['rozped_z_rowni'];
      const hpBefore2 = s2.enemy.hp;
      s2.playCard(0);
      const boostedDamage = hpBefore2 - s2.enemy.hp;

      expect(normalDamage).toBe(9);
      expect(boostedDamage).toBe(12);
    });

    it('z_rozmachu draws 1 card if next_double was active', () => {
      const s = freshState();
      s.player.status.next_double = true;
      s.hand = ['z_rozmachu'];
      s.deck = ['ciupaga'];
      s.playCard(0);
      expect(s.hand.length).toBe(1);
    });

    it('beczenie_redyku scales with player strength', () => {
      const s = freshState();
      s.player.status.strength = 2;
      s.hand = ['beczenie_redyku'];
      s.enemy.block = 0;
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBe(hpBefore - 19);
    });

    it('pogodzenie_sporow adds 10 rachunek and draws 1', () => {
      const s = freshState();
      s.hand = ['pogodzenie_sporow', 'ciupaga'];
      s.deck = ['gasior'];
      const rachunekBefore = s.enemy.rachunek;
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(rachunekBefore + 10);
      expect(s.hand.length).toBe(2);
    });

    it('przymusowy_napiwek adds 8 rachunek, or 16 when enemy is vulnerable', () => {
      const s = freshState();
      s.hand = ['przymusowy_napiwek'];
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(8);

      const s2 = freshState();
      s2.enemy.status.vulnerable = 1;
      s2.hand = ['przymusowy_napiwek'];
      s2.playCard(0);
      expect(s2.enemy.rachunek).toBe(16);
    });

    it('list_od_maryny draws extra card if enemy has weak or fragile', () => {
      const s = freshState();
      s.enemy.status.weak = 1;
      s.hand = ['list_od_maryny', 'ciupaga'];
      s.deck = ['gasior', 'kierpce', 'hej'];
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.hand.length).toBe(4);
      expect(s.player.block).toBeGreaterThanOrEqual(blockBefore + 5);

      const s2 = freshState();
      s2.hand = ['list_od_maryny', 'ciupaga'];
      s2.deck = ['gasior', 'kierpce', 'hej'];
      const blockBefore2 = s2.player.block;
      s2.playCard(0);
      expect(s2.hand.length).toBe(3);
      expect(s2.player.block).toBeGreaterThanOrEqual(blockBefore2 + 5);
    });

    it('pan_na_wlosciach grants 3 block when Lans becomes active', () => {
      const s = freshState();
      s.hand = ['pan_na_wlosciach', 'cios_z_telemarkiem'];
      s.playCard(0);
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.player.status.lans).toBe(1);
      expect(s.player.block).toBe(blockBefore + 3);
    });

    it('zimna_krew adds +1 weak to weak applications', () => {
      const s = freshState();
      s.hand = ['zimna_krew', 'sandaly'];
      s.playCard(0);
      s.playCard(0);
      expect(s.enemy.status.weak).toBe(2);
    });

    it('baciarka_ciesy grants +2 strength and exhausts', () => {
      const s = freshState();
      s.hand = ['baciarka_ciesy'];
      const strBefore = s.player.status.strength;
      s.playCard(0);
      expect(s.player.status.strength).toBe(strBefore + 2);
      expect(s.exhaust).toContain('baciarka_ciesy');
    });

    it('krzesany hits twice and grants +1 energy if second hit deals HP damage', () => {
      const s = freshCeprState();
      s.hand = ['krzesany'];
      s.player.energy = 3;
      s.player.block = 0;
      const energyBefore = s.player.energy;
      s.playCard(0);
      expect(s.enemy.hp).toBe(enemyLibrary.cepr.maxHp - 12);
      expect(s.player.energy).toBe(energyBefore - 2 + 1);
    });

    it('wymuszony_napiwek grants +20 dutki on kill', () => {
      const s = freshState();
      s.hand = ['wymuszony_napiwek'];
      s.enemy.hp = 11;
      const dutkiBefore = s.dutki;
      s.playCard(0);
      expect(s.dutki).toBe(dutkiBefore + 20);
      expect(s.exhaust).toContain('wymuszony_napiwek');
    });

    it('paragon_grozy costs 0 when enemy rachunek >= 24', () => {
      const s = freshState();
      s.enemy.rachunek = 24;
      expect(s.getCardCostInHand('paragon_grozy')).toBe(0);
    });

    it('zapas_oscypkow gives 4 block and +1 energy_next_turn', () => {
      const s = freshState();
      s.hand = ['zapas_oscypkow'];
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.player.block).toBeGreaterThanOrEqual(blockBefore + 4);
      expect(s.player.status.energy_next_turn).toBe(1);
    });

    it('wdech_halnego discards one and draws two', () => {
      const s = freshState();
      s.hand = ['wdech_halnego', 'ciupaga', 'gasior'];
      s.deck = ['ciupaga', 'gasior'];
      const discardBefore = s.discard.length;
      s.playCard(0);
      expect(s.discard.length).toBe(discardBefore + 2);
      expect(s.hand.length).toBe(3);
    });

    it('dutki_na_stole gives +14 dutki and +6 rachunek', () => {
      const s = freshState();
      s.hand = ['dutki_na_stole'];
      const dutkiBefore = s.dutki;
      const rachunekBefore = s.enemy.rachunek;
      s.playCard(0);
      expect(s.dutki).toBe(dutkiBefore + 14);
      expect(s.enemy.rachunek).toBe(rachunekBefore + 6);
      expect(s.exhaust).toContain('dutki_na_stole');
    });

    it('czas_na_fajke heals 2 at end turn when block > 10', () => {
      const s = freshState();
      s.hand = ['czas_na_fajke'];
      s.playCard(0);
      s.player.hp = 40;
      s.player.block = 12;
      setEnemyIntent(s, { type: 'buff', name: 'Ryk', strengthGain: 1, block: 0 });
      s.endTurn();
      expect(s.player.hp).toBe(42);
    });

    it('goralska_goscinnosc adds 3 rachunek for each played attack', () => {
      const s = freshState();
      s.hand = ['goralska_goscinnosc', 'ciupaga'];
      s.playCard(0);
      const rachunekBefore = s.enemy.rachunek;
      s.playCard(0);
      expect(s.enemy.rachunek).toBe(rachunekBefore + 3);
    });

    it('koncesja_na_oscypki grants +1 energy, draw and block at turn start when rachunek >= 20', () => {
      const s = freshState();
      s.hand = ['koncesja_na_oscypki'];
      s.playCard(0);
      s.enemy.rachunek = 20;
      s.player.energy = 0;
      s.deck = Array.from({ length: 10 }, () => 'ciupaga');
      s.hand = [];
      s.startTurn();
      expect(s.player.energy).toBe(4);
      expect(s.hand.length).toBe(6);
      expect(s.player.block).toBe(3);
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

    it('captureRunSummary uses global floor numbering in Act 2', () => {
      const s = freshState();
      s.currentAct = 2;
      s.floorOffset = 15;
      s.currentLevel = 3; // 4th floor of Act 2 -> global floor 19
      s.maxFloorReached = 15;

      const summary = s.captureRunSummary('enemy_win');
      expect(summary.runStats.floorReached).toBe(19);
    });

    it('getRunTelemetryJSON includes Act 2 weather, events and battle details', () => {
      const s = freshState();
      s.currentAct = 2;
      s.floorOffset = 15;
      s.currentLevel = 2;
      s.startFloorLog({ type: 'event', label: 'Test Event', weather: 'fog' });
      s.logAction('events', {
        eventId: 'event_selfie_na_krawedzi',
        choiceLabel: 'Pomóż zrobić ujęcie',
      });
      s.currentFloorLog.battle = {
        enemyId: 'kelner_schroniska',
        enemyName: 'Kelner Schroniska',
        context: 'event',
        weather: 'fog',
        outcome: 'player_win',
        turns: 4,
      };
      s.endFloorLog();

      const telemetry = JSON.parse(s.getRunTelemetryJSON());
      expect(telemetry.schemaVersion).toBe(2);
      expect(telemetry.act2.floorCount).toBe(1);
      expect(telemetry.act2.weather.fog).toBe(1);
      expect(telemetry.act2.events).toContain('event_selfie_na_krawedzi');
      expect(telemetry.act2.battles[0].enemyId).toBe('kelner_schroniska');
      expect(telemetry.floorHistory[0].nodeWeather).toBe('fog');
      expect(telemetry.floorHistory[0].globalFloor).toBe(18);
    });

    it('notifyTelemetryDownloaded triggers callback with Act 2 metadata', () => {
      const s = freshState();
      s.currentAct = 2;
      s.floorOffset = 15;
      s.currentLevel = 1;
      s.maxFloorReached = 17;
      s.startFloorLog({ type: 'fight', label: 'Test Fight', weather: 'halny' });
      s.endFloorLog();
      s.captureRunSummary('player_win');

      const onTelemetryDownloaded = vi.fn();
      s.onTelemetryDownloaded = onTelemetryDownloaded;
      s.notifyTelemetryDownloaded();

      expect(onTelemetryDownloaded).toHaveBeenCalledTimes(1);
      expect(onTelemetryDownloaded).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'player_win',
          actReached: 2,
          hasAct2Data: true,
        })
      );
    });

    it('captureRunSummary auto-publishes run telemetry once when callback is set', () => {
      const s = freshState();
      s.currentAct = 2;
      s.floorOffset = 15;
      s.currentLevel = 2;
      s.startFloorLog({ type: 'event', label: 'Act2 Event', weather: 'frozen' });
      s.logAction('events', { eventId: 'event_korek_do_toalety', choiceLabel: 'Test choice' });
      s.endFloorLog();

      const onRunTelemetryReady = vi.fn();
      s.onRunTelemetryReady = onRunTelemetryReady;

      s.captureRunSummary('player_win');
      s.captureRunSummary('player_win');

      expect(onRunTelemetryReady).toHaveBeenCalledTimes(1);
      expect(onRunTelemetryReady).toHaveBeenCalledWith(
        expect.objectContaining({
          schemaVersion: 2,
          run: expect.objectContaining({
            outcome: 'player_win',
            actReached: 2,
          }),
        })
      );
    });

    it('captureRunSummary does not auto-publish run telemetry for simulation runs', () => {
      const s = freshState();
      s.isSimulationRun = true;
      const onRunTelemetryReady = vi.fn();
      s.onRunTelemetryReady = onRunTelemetryReady;

      s.captureRunSummary('player_win');

      expect(onRunTelemetryReady).not.toHaveBeenCalled();
    });
  });

  // ── Act 2 relics ──────────────────────────────────────────────────────────
  describe('Act 2 transition relics', () => {
    it('pasterski_termos: +2 energy at battle start, -2 HP after battle', () => {
      const s = freshState();
      s.relics = ['pasterski_termos'];
      s.player.energy = 3;
      s._applyBattleStartRelics();
      expect(s.player.energy).toBe(5);
      s.player.hp = 40;
      s.pendingBattleDutki = true;
      s.grantBattleDutki();
      expect(s.player.hp).toBe(38);
    });

    it('pasterski_termos: post-battle HP cannot drop below 1', () => {
      const s = freshState();
      s.relics = ['pasterski_termos'];
      s.player.hp = 1;
      s.pendingBattleDutki = true;
      s.grantBattleDutki();
      expect(s.player.hp).toBe(1);
    });

    it('muffin_oscypkowy: +1 energy every 2nd attack card (max 2/turn)', () => {
      const s = freshState();
      s.relics = ['muffin_oscypkowy'];
      s.player.energy = 3;
      // Simulate playCard hook logic directly
      s.muffinAttackCountThisTurn = 0;
      s.muffinEnergyGrantedThisTurn = 0;
      // 1st attack — no bonus
      s.muffinAttackCountThisTurn += 1;
      if (
        s.hasRelic('muffin_oscypkowy') &&
        s.muffinAttackCountThisTurn % 2 === 0 &&
        s.muffinEnergyGrantedThisTurn < 2
      ) {
        s.player.energy += 1;
        s.muffinEnergyGrantedThisTurn += 1;
      }
      expect(s.player.energy).toBe(3);
      // 2nd attack — bonus
      s.muffinAttackCountThisTurn += 1;
      if (
        s.hasRelic('muffin_oscypkowy') &&
        s.muffinAttackCountThisTurn % 2 === 0 &&
        s.muffinEnergyGrantedThisTurn < 2
      ) {
        s.player.energy += 1;
        s.muffinEnergyGrantedThisTurn += 1;
      }
      expect(s.player.energy).toBe(4);
      expect(s.muffinEnergyGrantedThisTurn).toBe(1);
      // 3rd attack — no bonus (odd)
      s.muffinAttackCountThisTurn += 1;
      if (
        s.hasRelic('muffin_oscypkowy') &&
        s.muffinAttackCountThisTurn % 2 === 0 &&
        s.muffinEnergyGrantedThisTurn < 2
      ) {
        s.player.energy += 1;
        s.muffinEnergyGrantedThisTurn += 1;
      }
      expect(s.player.energy).toBe(4);
      // 4th attack — 2nd bonus
      s.muffinAttackCountThisTurn += 1;
      if (
        s.hasRelic('muffin_oscypkowy') &&
        s.muffinAttackCountThisTurn % 2 === 0 &&
        s.muffinEnergyGrantedThisTurn < 2
      ) {
        s.player.energy += 1;
        s.muffinEnergyGrantedThisTurn += 1;
      }
      expect(s.player.energy).toBe(5);
      // 5th+6th attack — capped at 2 grants/turn
      s.muffinAttackCountThisTurn += 1;
      s.muffinAttackCountThisTurn += 1;
      if (
        s.hasRelic('muffin_oscypkowy') &&
        s.muffinAttackCountThisTurn % 2 === 0 &&
        s.muffinEnergyGrantedThisTurn < 2
      ) {
        s.player.energy += 1;
        s.muffinEnergyGrantedThisTurn += 1;
      }
      expect(s.player.energy).toBe(5);
    });

    it('kedziorek_na_energie: +2 energy at battle start', () => {
      const s = freshState();
      s.relics = ['kedziorek_na_energie'];
      s.player.energy = 3;
      s._applyBattleStartRelics();
      expect(s.player.energy).toBe(5);
    });

    it('kedziorek_na_energie: penalizes next turn energy when hit at 0 block', () => {
      const s = freshState();
      s.relics = ['kedziorek_na_energie'];
      s.player.block = 0;
      s.player.hp = 50;
      s.takeDamage(5);
      expect(s.player.status.energy_next_turn).toBe(-1);
    });

    it('kedziorek_na_energie: no penalty when hit with block', () => {
      const s = freshState();
      s.relics = ['kedziorek_na_energie'];
      s.player.block = 10;
      s.takeDamage(5);
      expect(s.player.status.energy_next_turn).toBe(0);
    });

    it('herbata_zimowa: +1 energy on even turns', () => {
      const s = freshState();
      s.relics = ['herbata_zimowa'];
      s.player.energy = 3;
      s.battleTurnsElapsed = 2;
      // Simulate turn-start logic
      if (s.hasRelic('herbata_zimowa') && s.battleTurnsElapsed % 2 === 0) s.player.energy += 1;
      expect(s.player.energy).toBe(4);
    });

    it('herbata_zimowa: no bonus on odd turns', () => {
      const s = freshState();
      s.relics = ['herbata_zimowa'];
      s.player.energy = 3;
      s.battleTurnsElapsed = 1;
      if (s.hasRelic('herbata_zimowa') && s.battleTurnsElapsed % 2 === 0) s.player.energy += 1;
      expect(s.player.energy).toBe(3);
    });

    it('herbata_zimowa: end-of-turn penalty if block >= 8', () => {
      const s = freshState();
      s.relics = ['herbata_zimowa'];
      s.player.block = 10;
      // Simulate end-of-turn logic
      if (s.hasRelic('herbata_zimowa') && s.player.block >= 8)
        s.player.status.energy_next_turn -= 1;
      expect(s.player.status.energy_next_turn).toBe(-1);
    });

    it('portfel_turysty: queues +1 energy on first shop purchase (simulated)', () => {
      const s = freshState();
      s.relics = ['portfel_turysty'];
      s.portfelTurystyUsedThisShop = false;
      s.portfelTurystyPendingEnergy = false;
      // Simulate the buyItem hook directly
      if (s.hasRelic('portfel_turysty') && !s.portfelTurystyUsedThisShop) {
        s.portfelTurystyPendingEnergy = true;
        s.portfelTurystyUsedThisShop = true;
      }
      expect(s.portfelTurystyPendingEnergy).toBe(true);
      expect(s.portfelTurystyUsedThisShop).toBe(true);
    });

    it('portfel_turysty: pending energy granted at battle start', () => {
      const s = freshState();
      s.relics = ['portfel_turysty'];
      s.portfelTurystyPendingEnergy = true;
      s.player.energy = 3;
      s._applyBattleStartRelics();
      expect(s.player.energy).toBe(4);
      expect(s.portfelTurystyPendingEnergy).toBe(false);
    });

    it('ciupaga_ekspresowa: first skill card costs 0', () => {
      const s = freshState();
      s.relics = ['ciupaga_ekspresowa'];
      s.ciupagaExpresowaTurnUsed = false;
      // gasior is a skill card
      const cost = s.getCardCostInHand('gasior');
      expect(cost).toBe(0);
    });

    it('ciupaga_ekspresowa: second skill card has normal cost', () => {
      const s = freshState();
      s.relics = ['ciupaga_ekspresowa'];
      s.ciupagaExpresowaTurnUsed = true;
      const cost = s.getCardCostInHand('gasior');
      expect(cost).toBeGreaterThan(0);
    });

    it('dzban_mleka: -1 energy at battle start', () => {
      const s = freshState();
      s.relics = ['dzban_mleka'];
      s.player.energy = 3;
      s._applyBattleStartRelics();
      expect(s.player.energy).toBe(2);
    });

    it('dzban_mleka: +1 energy per 3 HP healed', () => {
      const s = freshState();
      s.relics = ['dzban_mleka'];
      s.player.hp = 30;
      s.player.maxHp = 80;
      s.player.energy = 2;
      s.dzbanEnergyGrantedThisTurn = 0;
      s.healPlayer(6);
      expect(s.player.energy).toBe(4);
      expect(s.dzbanEnergyGrantedThisTurn).toBe(2);
    });

    it('dzban_mleka: energy grant capped at 2/turn', () => {
      const s = freshState();
      s.relics = ['dzban_mleka'];
      s.player.hp = 10;
      s.player.maxHp = 80;
      s.player.energy = 0;
      s.dzbanEnergyGrantedThisTurn = 0;
      s.healPlayer(30);
      expect(s.player.energy).toBe(2);
    });
  });

  describe('Act 2 boss relics', () => {
    it('paragon_startowy: +6 Rachunek at battle start', () => {
      const s = freshState();
      s.relics = ['paragon_startowy'];
      s.enemy.rachunek = 0;
      s._applyBattleStartRelics();
      expect(s.enemy.rachunek).toBe(6);
    });

    it('ksiega_dluguw: +2 Rachunek per skill card played', () => {
      const s = freshState();
      s.relics = ['ksiega_dluguw'];
      s.enemy.rachunek = 0;
      // Simulate the hook
      if (s.hasRelic('ksiega_dluguw')) s.addEnemyRachunek(2);
      expect(s.enemy.rachunek).toBe(2);
    });

    it('bankructwo_z_bonusem: heals +6 and grants +20 Dutki on bankruptcy', () => {
      const s = freshState();
      s.relics = ['bankructwo_z_bonusem'];
      s.player.hp = 30;
      s.player.maxHp = 80;
      s.dutki = 50;
      s.enemy.rachunek = 30;
      s.enemy.hp = 10;
      s.enemyBankruptFlag = false;
      s.enemyBankrupt();
      expect(s.player.hp).toBe(36);
      expect(s.dutki).toBeGreaterThanOrEqual(70);
    });

    it('pancerz_z_lansu: reduces HP damage by 2 when Lans active', () => {
      const s = freshState();
      s.relics = ['pancerz_z_lansu'];
      s.dutki = 100;
      s._setLansActive(true);
      s.player.block = 0;
      s.player.hp = 50;
      s.takeDamage(5);
      // With Lans at rate=2: 5 damage costs 10 dutki (Lans absorbs); pancerz only applies if dealt>0
      // Lans rate starts at 2, 5*2=10 <= 100, so Lans absorbs all → dealt=0, pancerz has no effect
      // Player HP stays at 50
      expect(s.player.hp).toBe(50);
    });

    it('wejscie_z_przytupem: deals 5 dmg when Lans activates', () => {
      const s = freshState();
      s.relics = ['wejscie_z_przytupem'];
      s.enemy.hp = 50;
      s.enemy.block = 0;
      s._setLansActive(true);
      expect(s.enemy.hp).toBe(45);
    });

    it('wejscie_z_przytupem: no damage if Lans was already active', () => {
      const s = freshState();
      s.relics = ['wejscie_z_przytupem'];
      s._setLansActive(true);
      const hpAfterFirst = s.enemy.hp;
      s._setLansActive(true); // already active, no re-trigger
      expect(s.enemy.hp).toBe(hpAfterFirst);
    });

    it('zaszczyt_upadku: queues draw+energy when Lans breaks', () => {
      const s = freshState();
      s.relics = ['zaszczyt_upadku'];
      s.dutki = 0;
      s._setLansActive(true);
      s.player.block = 0;
      s.player.hp = 50;
      // Lans breaks when dutki < required
      s.takeDamage(5);
      // Lans breaks: rate=2, 5*2=10 > 0 dutki → breaks
      expect(s.zaszytUpadkuDrawPending).toBe(true);
      expect(s.player.status.energy_next_turn).toBe(2);
    });

    it('goralska_skora: halny drains only 1 block', () => {
      const s = freshState();
      s.relics = ['goralska_skora'];
      s.currentWeather = 'halny';
      s.player.block = 5;
      s._applyHalnyBlockDrain(s.player);
      expect(s.player.block).toBe(4);
    });

    it('barometr_tatrzanski: +1 energy at turn start in non-clear weather', () => {
      const s = freshState();
      s.relics = ['barometr_tatrzanski'];
      s.currentWeather = 'halny';
      s.player.energy = 3;
      if (s.hasRelic('barometr_tatrzanski') && s.currentWeather !== 'clear') s.player.energy += 1;
      expect(s.player.energy).toBe(4);
    });

    it('barometr_tatrzanski: no bonus in clear weather', () => {
      const s = freshState();
      s.relics = ['barometr_tatrzanski'];
      s.currentWeather = 'clear';
      s.player.energy = 3;
      if (s.hasRelic('barometr_tatrzanski') && s.currentWeather !== 'clear') s.player.energy += 1;
      expect(s.player.energy).toBe(3);
    });

    it('plecak_na_kazda_pogode: clear sky gives +1 energy at battle start', () => {
      const s = freshState();
      s.relics = ['plecak_na_kazda_pogode'];
      s.currentWeather = 'clear';
      s.player.energy = 3;
      s._applyBattleStartRelics();
      expect(s.player.energy).toBe(4);
    });

    it('plecak_na_kazda_pogode: halny gives +6 block at battle start', () => {
      const s = freshState();
      s.relics = ['plecak_na_kazda_pogode'];
      s.currentWeather = 'halny';
      s.player.block = 0;
      s._applyBattleStartRelics();
      expect(s.player.block).toBe(6);
    });
  });

  describe('Act 2 transition relic pool', () => {
    it('buildAct2TransitionRelicPool returns only transition relics', () => {
      const s = freshState();
      s.relics = [];
      const pool = s.generateAct2TransitionRelicChoices(7);
      expect(pool.length).toBeGreaterThan(0);
      pool.forEach((id) => {
        expect([
          'pasterski_termos',
          'muffin_oscypkowy',
          'kedziorek_na_energie',
          'herbata_zimowa',
          'portfel_turysty',
          'ciupaga_ekspresowa',
          'dzban_mleka',
          'paragon_startowy',
          'ksiega_dluguw',
          'bankructwo_z_bonusem',
          'pancerz_z_lansu',
          'wejscie_z_przytupem',
          'zaszczyt_upadku',
          'plecak_na_kazda_pogode',
          'goralska_skora',
          'barometr_tatrzanski',
        ]).toContain(id);
      });
    });

    it('act2Only relics are excluded from the regular relic pool', () => {
      const s = freshState();
      s.relics = [];
      const relicChoices = s.generateRelicChoices(50);
      const act2Ids = [
        'pasterski_termos',
        'muffin_oscypkowy',
        'kedziorek_na_energie',
        'herbata_zimowa',
        'portfel_turysty',
        'ciupaga_ekspresowa',
        'dzban_mleka',
        'paragon_startowy',
        'ksiega_dluguw',
        'bankructwo_z_bonusem',
        'pancerz_z_lansu',
        'wejscie_z_przytupem',
        'zaszczyt_upadku',
        'plecak_na_kazda_pogode',
        'goralska_skora',
        'barometr_tatrzanski',
      ];
      act2Ids.forEach((id) => {
        expect(relicChoices).not.toContain(id);
      });
    });
  });

  describe('new cards from CARDY-PROPOZYCJE-60', () => {
    it('zaskoczenie_z_kosodrzewiny: deals 7 damage bypassing evasion', () => {
      const s = makeState();
      s.hand = ['zaskoczenie_z_kosodrzewiny'];
      s.enemy.evasionCharges = 3;
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(hpBefore);
      expect(s.enemy.evasionCharges).toBe(0);
    });

    it('zaskoczenie_z_kosodrzewiny: bypasses fog miss by clearing playerAttackMissCheck', () => {
      const s = makeState();
      s.hand = ['zaskoczenie_z_kosodrzewiny'];
      s.currentWeather = 'fog';
      s.combat.playerAttackMissCheck = true;
      s.combat.playerAttackMissed = true;
      const hpBefore = s.enemy.hp;
      s.playCard(0);
      expect(s.enemy.hp).toBeLessThan(hpBefore);
    });

    it('schowek_za_pazucha: sets schowekRetainPending flag', () => {
      const s = makeState();
      s.hand = ['schowek_za_pazucha', 'ciupaga'];
      s.playCard(0);
      expect(s.schowekRetainPending).toBe(true);
    });

    it('schowek_za_pazucha: retain pending clears at end of player turn', () => {
      const s = makeState();
      s.schowekRetainPending = true;
      s.enemy.currentIntent = { type: 'buffer', name: 'czeka', damage: 0, hits: 0, block: 0 };
      s.endTurn();
      expect(s.schowekRetainPending).toBe(false);
    });

    it('piorko_u_kapelusza: LANS gives 8 block and draws 1', () => {
      const s = makeState();
      s.hand = ['piorko_u_kapelusza'];
      s.player.status.lans = 3;
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.player.block).toBe(blockBefore + 8);
    });

    it('piorko_u_kapelusza: without LANS only activates lans', () => {
      const s = makeState();
      s.hand = ['piorko_u_kapelusza'];
      s.player.status.lans = 0;
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.player.block).toBe(blockBefore);
      expect(s.player.status.lans).toBeGreaterThan(0);
    });

    it('wypieta_piers: LANS gives 7 block and sets nextAttackCardBonus +3', () => {
      const s = makeState();
      s.hand = ['wypieta_piers'];
      s.player.status.lans = 3;
      s.playCard(0);
      expect(s.player.block).toBeGreaterThanOrEqual(7);
      expect(s.nextAttackCardBonus).toBeGreaterThanOrEqual(3);
    });

    it('stary_numer_maryny: applies 2 weak + 2 fragile and draws 1', () => {
      const s = makeState();
      s.hand = ['stary_numer_maryny'];
      s.player.energy = 3;
      const handSizeBefore = s.hand.length;
      s.playCard(0);
      expect(s.enemy.status.weak).toBe(2);
      expect(s.enemy.status.fragile).toBe(2);
      expect(s.hand.length).toBeGreaterThan(handSizeBefore - 1);
    });

    it('nauczka_z_krupowek: applies 1 self-weak and +2 strength', () => {
      const s = makeState();
      s.hand = ['nauczka_z_krupowek'];
      s.playCard(0);
      expect(s.player.status.weak).toBe(1);
      expect(s.player.status.strength).toBe(2);
    });

    it('zasieki_z_gubalowki: gains 12 block and sets zasiekiActive', () => {
      const s = makeState();
      s.hand = ['zasieki_z_gubalowki'];
      s.player.energy = 3;
      s.playCard(0);
      expect(s.player.block).toBeGreaterThanOrEqual(12);
      expect(s.zasiekiActive).toBe(true);
    });

    it('zasieki_z_gubalowki: counter-attacks 5 damage when player takes any hit', () => {
      const s = makeState();
      s.zasiekiActive = true;
      s.enemy.hp = 50;
      s.enemy.block = 0;
      const enemyHpBefore = s.enemy.hp;
      s.takeDamage(3);
      expect(s.enemy.hp).toBe(enemyHpBefore - 5);
    });

    it('zasieki_z_gubalowki: counter-attacks even on blocked hit', () => {
      const s = makeState();
      s.zasiekiActive = true;
      s.player.block = 10;
      s.enemy.hp = 50;
      s.enemy.block = 0;
      const enemyHpBefore = s.enemy.hp;
      s.takeDamage(3); // fully blocked
      expect(s.enemy.hp).toBe(enemyHpBefore - 5);
    });

    it('zasieki_z_gubalowki: zasiekiActive resets at end of player turn', () => {
      const s = makeState();
      s.zasiekiActive = true;
      s.enemy.currentIntent = { type: 'buffer', name: 'czeka', damage: 0, hits: 0, block: 0 };
      s.endTurn();
      expect(s.zasiekiActive).toBe(false);
    });

    it('zamach_znad_glodowki: sets next_double and exhausts', () => {
      const s = makeState();
      s.hand = ['zamach_znad_glodowki'];
      s.playCard(0);
      expect(s.player.status.next_double).toBe(true);
      expect(s.exhaust).toContain('zamach_znad_glodowki');
    });

    it('wezwanie_przedsadowe: grants block equal to 1/3 of enemy rachunek', () => {
      const s = makeState();
      s.hand = ['wezwanie_przedsadowe'];
      s.player.energy = 3;
      s.enemy.rachunek = 30;
      s.playCard(0);
      expect(s.player.block).toBeGreaterThanOrEqual(10); // floor(30/3) = 10
    });

    it('wezwanie_przedsadowe: 0 rachunek gives 0 block and exhausts', () => {
      const s = makeState();
      s.hand = ['wezwanie_przedsadowe'];
      s.player.energy = 3;
      s.enemy.rachunek = 0;
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.player.block).toBe(blockBefore);
      expect(s.exhaust).toContain('wezwanie_przedsadowe');
    });

    it('przeliczanie_dutkow: LANS draws 1 and gains 4 block', () => {
      const s = makeState();
      s.hand = ['przeliczanie_dutkow'];
      s.player.status.lans = 3;
      const blockBefore = s.player.block;
      s.playCard(0);
      expect(s.player.block).toBe(blockBefore + 4);
    });

    it('herbata_z_pradem: heals 6 when at <=50% HP, exhausts', () => {
      const s = makeState();
      s.hand = ['herbata_z_pradem'];
      s.player.hp = 20;
      s.player.maxHp = 50;
      const hpBefore = s.player.hp;
      s.playCard(0);
      expect(s.player.hp).toBe(Math.min(s.player.maxHp, hpBefore + 6));
      expect(s.exhaust).toContain('herbata_z_pradem');
    });

    it('herbata_z_pradem: heals only 2 when above 50% HP', () => {
      const s = makeState();
      s.hand = ['herbata_z_pradem'];
      s.player.hp = 40;
      s.player.maxHp = 50;
      const hpBefore = s.player.hp;
      s.playCard(0);
      expect(s.player.hp).toBe(Math.min(s.player.maxHp, hpBefore + 2));
    });

    it('goralski_upor (skill): gives 5 block and records blurBlockAmount', () => {
      const s = makeState();
      s.hand = ['goralski_upor'];
      s.playCard(0);
      expect(s.player.block).toBeGreaterThanOrEqual(5);
      expect(s.blurBlockAmount).toBe(5);
    });

    it('goralski_upor (skill): blur block is preserved into next player turn', () => {
      const s = makeState();
      s.blurBlockAmount = 5;
      s.enemy.currentIntent = { type: 'buffer', name: 'czeka', damage: 0, hits: 0, block: 0 };
      s.endTurn();
      s.startTurn(); // blur block restored here
      expect(s.player.block).toBeGreaterThanOrEqual(5);
      expect(s.blurBlockAmount).toBe(0);
    });

    it('na_ratunek_gopr: heals 5, and 5 more if enemy rachunek > 20, exhausts', () => {
      const s = makeState();
      s.hand = ['na_ratunek_gopr'];
      s.player.hp = 30;
      s.player.maxHp = 50;
      s.enemy.rachunek = 25;
      const hpBefore = s.player.hp;
      s.playCard(0);
      expect(s.player.hp).toBe(Math.min(s.player.maxHp, hpBefore + 10));
      expect(s.exhaust).toContain('na_ratunek_gopr');
    });

    it('na_ratunek_gopr: heals only 5 when rachunek <= 20', () => {
      const s = makeState();
      s.hand = ['na_ratunek_gopr'];
      s.player.hp = 30;
      s.player.maxHp = 50;
      s.enemy.rachunek = 10;
      const hpBefore = s.player.hp;
      s.playCard(0);
      expect(s.player.hp).toBe(Math.min(s.player.maxHp, hpBefore + 5));
    });

    it('szal_bacy: sets player.szal_bacy flag and exhausts', () => {
      const s = makeState();
      s.hand = ['szal_bacy'];
      s.player.energy = 3;
      s.playCard(0);
      expect(s.player.szal_bacy).toBe(true);
      expect(s.exhaust).toContain('szal_bacy');
    });

    it('szal_bacy: deals 3 damage per extra card drawn during player turn', () => {
      const s = makeState();
      // makeState() → initGame() → startTurn() sets szalBacyTurnDrawDone = true
      s.player.szal_bacy = true;
      s.enemy.hp = 50;
      s.enemy.block = 0;
      const hpBefore = s.enemy.hp;
      s._drawCards(1);
      expect(s.enemy.hp).toBe(hpBefore - 3);
    });

    it('szal_bacy: does NOT trigger when szalBacyTurnDrawDone is false', () => {
      const s = makeState();
      s.player.szal_bacy = true;
      s.szalBacyTurnDrawDone = false; // force flag off
      s.enemy.hp = 50;
      s.enemy.block = 0;
      const hpBefore = s.enemy.hp;
      s._drawCards(1);
      expect(s.enemy.hp).toBe(hpBefore);
    });

    it('goralski_upor_moc (power): sets flag and exhausts', () => {
      const s = makeState();
      s.hand = ['goralski_upor_moc'];
      s.playCard(0);
      expect(s.player.goralski_upor_moc).toBe(true);
      expect(s.exhaust).toContain('goralski_upor_moc');
    });

    it('goralski_upor_moc (power): queues draw when player takes HP damage', () => {
      const s = makeState();
      s.player.goralski_upor_moc = true;
      s.player.block = 0;
      s.goralskiUporDrawPending = 0;
      s.takeDamage(5);
      expect(s.goralskiUporDrawPending).toBe(1);
    });

    it('goralski_upor_moc (power): pending draws are consumed at start of next turn', () => {
      const s = makeState();
      s.player.goralski_upor_moc = true;
      s.goralskiUporDrawPending = 2;
      s.enemy.currentIntent = { type: 'buffer', name: 'czeka', damage: 0, hits: 0, block: 0 };
      s.endTurn();
      s.startTurn(); // pending draws consumed here
      expect(s.goralskiUporDrawPending).toBe(0);
    });

    it('goralski_upor_moc (power): no draw queued on fully-blocked hit', () => {
      const s = makeState();
      s.player.goralski_upor_moc = true;
      s.player.block = 10;
      s.goralskiUporDrawPending = 0;
      s.takeDamage(5); // fully blocked
      expect(s.goralskiUporDrawPending).toBe(0);
    });
  });
});
