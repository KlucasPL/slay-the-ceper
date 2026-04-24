---
name: run-lighthouse
description: Run Lighthouse CI for mobile performance and accessibility
compatibility: opencode
metadata:
  audience: developers
  workflow: ci
---
## What I do

Run Lighthouse CI:
```bash
npm run lhci
```

## When to use me

- After UI changes
- Before releasing
- Performance regression check

## Metrics Tracked

- Mobile performance score
- Accessibility score
- SEO (optional)
- Best practices (optional)

## Requirements

- Chrome/Chromium installed
- `npm install` done

## URL

Tests against deployed URL or local:
- Deploy preview: `npm run preview`
- Then run `lhci autorun`

## Thresholds

Default: 90+ on performance, accessibility