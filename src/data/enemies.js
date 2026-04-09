/**
 * @typedef {{ name: string, emoji: string, hp: number, maxHp: number, block: number, nextAttack: number }} EnemyDef
 */

/** @type {Record<string, EnemyDef>} */
export const enemies = {
  cepr: { name: 'Cepr', emoji: '🧦', hp: 40, maxHp: 40, block: 0, nextAttack: 8 },
};
