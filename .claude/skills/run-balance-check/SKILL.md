---
name: run-balance-check
description: Run balance simulation and compare against baselines
compatibility: opencode
metadata:
  audience: developers
  workflow: ci
---

## What I do

1. Run 5k-game simulation: `npm run sim`
2. Compare results against `baselines/main.metrics.json`
3. Check drift against `baselines/thresholds.json`
4. Report pass/fail with specific metric deltas

## When to use me

Use this after any balance change (card buffs/nerfs, enemy scaling, relic changes).
Run CI first: `lint → format:check → test → build` must pass.

## Requirements

- Must be on clean branch with committed changes
- Sim takes ~5-10 minutes
- Requires `baselines/main.metrics.json` to exist

## Output format

Report:

- Which metrics passed/failed
- Actual vs threshold for each failing metric
- Suggestions for which changes caused drift
