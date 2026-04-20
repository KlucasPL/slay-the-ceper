# Balancing Dashboard

Static HTML dashboard that reads a `metrics.json` produced by `scripts/analyze.js`.

## Quick start

```bash
# One-time: copy Chart.js from node_modules into vendor/
npm run dashboard:vendor

# Serve the dashboard (any static server works)
npx serve tools/dashboard
# or
python3 -m http.server 8080 --directory tools/dashboard
```

Then open `http://localhost:8080` and the fixture data loads automatically.
Drop any `metrics.json` onto the page or use the file picker to load a real batch.

## Vendor file

`vendor/chart.umd.min.js` is **not committed** (gitignored). It is sourced from
the `chart.js` npm devDependency and copied by:

```bash
npm run dashboard:vendor
```

Re-run this after upgrading `chart.js` in `package.json`.

## Views

| View          | Description                                                       |
| :------------ | :---------------------------------------------------------------- |
| Batch Summary | Overall winrate CI, agent mix, win-rate-by-slice, sample tier     |
| Leaderboard   | Per-entity-kind table: pickRate, WR with/without, lift pp + CI    |
| Entity Detail | Drill-in: by-slice breakdown, acquisition sources, per-kind stats |
