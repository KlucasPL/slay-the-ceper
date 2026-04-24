---
name: update-baseline
description: Regenerate baseline metrics at 10k games for balance drift
compatibility: opencode
metadata:
  audience: developers
  workflow: ci
---

## What I do

1. Run 10k-game simulation: `npm run sim`
2. Update `baselines/main.metrics.json` with new results
3. Commit changes with descriptive message

## When to use me

Use this when:

- Intentionally changing game balance
- After adding new content (cards, enemies, relics)
- Asked to apply `baseline-update` PR label

## Requirements

- Must be on clean branch
- All tests must pass first
- Takes ~20 minutes for 10k games

## Before Running

Ensure CI passes:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

## After Running

- Review changed metrics
- Commit with message: "baseline: update metrics at 10k games"
- Include diff summary in commit body
