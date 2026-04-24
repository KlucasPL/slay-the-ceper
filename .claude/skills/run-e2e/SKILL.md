---
name: run-e2e
description: Run Playwright E2E tests for dashboard and UI
compatibility: opencode
metadata:
  audience: developers
  workflow: ci
---

## What I do

Run E2E tests:

```bash
npx playwright test
```

## When to use me

Before committing or after UI changes. Tests are in `tests/e2e/`.

## Requirements

- Playwright browsers installed: `npx playwright install`
- Dev server running (for some tests)
- May need `npm install`

## Test Files

- `tests/e2e/dashboard.test.js` — analytics dashboard
- `tests/e2e/ui.test.js` — game UI
- `tests/e2e/*.test.js` — other e2e tests

## Running Specific Tests

```bash
npx playwright test tests/e2e/dashboard.test.js
npx playwright test --grep "dashboard"
```

## Debug Mode

```bash
npx playwright test --debug
```

## Headless by Default

CI runs headless. For local debug, use `--headed`:

```bash
npx playwright test --headed
```
