# Live Trading Discipline Assistant II

Live Trading Discipline Assistant II is a mobile-first React + Vite web app for following a strict live trading checklist. It is inspired by the first Live Trading Discipline Assistant, but this version has updated live trading steps, a new after-session workflow, and the revised calculator flow.

## Sections

1. Live Trading Session
2. After Session Ritual
3. Buy Calculator
4. Sell Calculator

## Live Flow And Discipline Lock

The live trading flow starts with Trading View, a 2-minute timeframe check, watchlist scrolling, and a Buy/Sell choice. After a trade reaches `Trade closed?`:

- `Target?` ends the session, shows `Remove any active ATO / Alerts`, then locks Live Trading Session for 1 hour.
- First-round `SL?` opens one last retry page: `Any fresh buy/sell alert?`
- The retry page can start one more Buy or Sell cycle.
- On the second cycle, either `SL?` or `Target?` ends at `Remove any active ATO / Alerts`, then locks Live Trading Session for 1 hour.

During the lock, the home screen blocks a fresh Live Trading Session and shows a friendly countdown message. If the app reloads during the lock, the lock survives through `localStorage`.

The selected active side is saved in `localStorage`:

- If the active side is `Buy`, the Buy Calculator remains usable and the Sell Calculator is locked during trading-session time.
- If the active side is `Sell`, the Sell Calculator remains usable and the Buy Calculator is locked during trading-session time.
- Outside 9:00 AM to 3:00 PM, calculator locks do not apply.

## Step Images

Each step renders through a reusable image slot. When final ordered images are ready, put them in `public/step-images/` and update `STEP_IMAGE_MAP` in `src/App.jsx`.

## Data And Storage

- Static frontend only
- No backend
- No database
- No login or authentication
- No permanent personal trade data saving
- Uses `localStorage` for the live-session lock timestamp and active side
- Calculator inputs and trade details are not saved permanently

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## GitHub Pages Deployment

The Vite base path is configured for this repository:

```js
base: "/Live-Trading-Discipline-Assistant-II/"
```

GitHub Actions deploys the app to GitHub Pages on every push to `main`. In the repository settings, set Pages to use GitHub Actions as the source.
