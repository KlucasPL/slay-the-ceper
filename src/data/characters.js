/**
 * @typedef {{ name: string, emoji: string, hp: number, maxHp: number, block: number, energy: number, maxEnergy: number }} CharacterDef
 */

/** @type {Record<string, CharacterDef>} */
export const characters = {
  jedrek: { name: 'Jędrek', emoji: '🧔‍♂️', hp: 50, maxHp: 50, block: 0, energy: 3, maxEnergy: 3 },
};
