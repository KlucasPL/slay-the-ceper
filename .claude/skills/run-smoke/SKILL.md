---
name: run-smoke
description: Quick smoke test with ~100 games for fast balance feedback
compatibility: opencode
metadata:
  audience: developers
  workflow: local
---
## What I do

Run quick simulation:
```bash
npm run sim:smoke
```

~100 games in under 1 minute.

## When to use me

- After small balance tweaks
- Before committing
- Fast feedback loop

## For Full Balance Check

Use `run-balance-check` skill instead (5k games).

## Output

Reports win rate, avg damage dealt/taken, most played cards.