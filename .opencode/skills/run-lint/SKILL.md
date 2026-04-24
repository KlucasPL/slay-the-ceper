---
name: run-lint
description: Run full quality gates: lint + format + test + build
compatibility: opencode
metadata:
  audience: developers
  workflow: ci
---
## What I do

Run in exact order:

1. `npm run lint` — ESLint check
2. `npm run format:check` — Prettier check
3. `npm test` — Vitest unit tests
4. `npm run build` — Production build

All 4 must pass. Stop on first failure.

## When to use me

Before committing or creating PR. This mirrors CI gates in `.github/workflows/pr-quality.yml`.

## Requirements

- Dependencies installed: `npm install`
- Clean working tree preferred

## Debugging Failures

If lint fails:
```bash
npm run lint:fix  # Auto-fix where possible
```

If format fails:
```bash
npm run format  # Auto-format
```

If tests fail:
```bash
npm run test:watch  # Watch mode for debugging
```

If build fails:
- Check import paths
- Check for missing exports