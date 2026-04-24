---
name: run-game
description: Start local dev server and open game
compatibility: opencode
metadata:
  audience: developers
  workflow: local
---
## What I do

Start Vite dev server:
```bash
npm run dev
```

Opens at: http://localhost:5173/slay-the-ceper/

## Debug Mode

In game, press `~` or `F9` to open Debug Overlay:
- Spawn any enemy
- Set HP, Dutki, statuses
- God Mode
- Reveal map

## URL Shortcuts

- `?debugBoss=<id>` — spawn boss
- `?debugEnemy=<id>` — spawn enemy
- Shortcuts: `{konik, naganiacz, spekulant, mistrz, redyk, ceprzyca, random-boss, random-elite}`

## Quick Rebuild

Changes to code auto-reload in browser.

## Requirements

- `npm install` already run
- Port 5173 available