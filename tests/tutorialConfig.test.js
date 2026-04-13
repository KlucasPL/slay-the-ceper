import { describe, it, expect } from 'vitest';
import { cardLibrary } from '../src/data/cards.js';
import { relicLibrary } from '../src/data/relics.js';
import {
  tutorialFixedRelicId,
  tutorialFixedCardRewardIds,
  tutorialMapSequence,
} from '../src/data/tutorialConfig.js';

describe('tutorial config', () => {
  it('uses exact fixed tutorial card reward set', () => {
    expect(tutorialFixedCardRewardIds).toEqual(['ciupaga', 'gasior', 'hej']);
  });

  it('fixed tutorial cards are starter-deck cards and remain playable', () => {
    expect(tutorialFixedCardRewardIds).toHaveLength(3);
    expect(new Set(tutorialFixedCardRewardIds).size).toBe(3);

    for (const cardId of tutorialFixedCardRewardIds) {
      const card = cardLibrary[cardId];
      expect(card).toBeTruthy();
      expect(card.isStarter).toBe(true);
      expect(card.eventOnly).not.toBe(true);
      expect(card.rarity).not.toBe('rare');
      expect(card.unplayable).not.toBe(true);
    }
  });

  it('uses fixed tutorial relic that is existing, non-event and non-rare', () => {
    expect(tutorialFixedRelicId).toBe('bilet_tpn');

    const relic = relicLibrary[tutorialFixedRelicId];
    expect(relic).toBeTruthy();
    expect(relic.eventOnly).not.toBe(true);
    expect(relic.rarity).not.toBe('rare');
  });

  it('keeps exact 5-node tutorial mini-map sequence', () => {
    expect(tutorialMapSequence).toEqual(['fight', 'event', 'shop', 'campfire', 'elite']);
    expect(tutorialMapSequence).toHaveLength(5);
  });
});
