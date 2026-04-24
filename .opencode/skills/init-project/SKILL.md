---
name: init-project
description: Load project context and verify setup
compatibility: opencode
metadata:
  audience: developers
  workflow: session-start
---

## What I do

On session start, verify project state:

1. **Git status**: See uncommitted changes, current branch

```bash
git status
git log --oneline -5  # recent commits
git branch -vv       # local tracking branches
```

2. **Verify deps installed**:

```bash
test -d node_modules || npm install
```

## Quick Verification

```bash
npm run lint && npm test
```

## Common Mistakes (from AGENTS.md, CLAUDE.md)

- NO `Math.random` in `src/data/` or `src/state/` → use `state.rng()`
- NO `document`, `window`, `console.log` in State layer
- NO damage/deck math in UI → delegate to GameState
- NO `alert()` for victory → overlay only