/**
 * Tester corpus — 40 hand-curated seeds covering a range of decision points.
 *
 * Seed groups:
 *   1–10   General variety (mixed node types, typical difficulty)
 *  11–20   Elite-heavy paths (seeds where map generation yields ≥3 elites)
 *  21–30   Easy/favourable starts (low-pressure opens for regression baseline)
 *  31–40   Hard/punishing seeds (difficult early enemies, bad map topology)
 *  41–50   Weather-varied (seeds known to produce non-clear weather rolls)
 *
 * Note: labels are approximate — actual map/weather depends on the engine RNG.
 * Re-label after running characterisation sweeps.
 *
 * @typedef {{ name: string, description: string, seeds: number[], notes?: string }} Scenario
 * @type {Scenario}
 */
const scenario = {
  name: 'tester-corpus',
  description:
    'Hand-curated 40-seed corpus exercising diverse decision points for regression and balance testing.',
  seeds: [
    // General variety
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    // Elite-heavy
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    // Easy/favourable starts
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    // Hard/punishing
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  ],
  notes:
    'Extend with characterised seeds after running --scenario tester-corpus --games 1 across all seeds.',
};

export default scenario;
