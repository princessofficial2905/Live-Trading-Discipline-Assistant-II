# Live Trading Discipline Assistant II

Live Trading Discipline Assistant II is a mobile-first React + Vite web app for following a strict live trading checklist. It is inspired by the first Live Trading Discipline Assistant, but this version has updated live trading steps, a new after-session workflow, and the revised calculator flow.

## Sections

1. Live Trading Session Steps
2. After-Session
3. TradingView Alerts Steps

## Discipline Lock

The live trading flow has a 5-minute committed mode after a valid symbol path is selected. The lock starts only when:

- the bullish path confirms `Visible`
- the bearish path confirms `Sell visible`

During committed mode, the live flow hides Home and Back controls so the trade path continues forward to either SL or Target. If the app reloads during the lock, the home screen blocks a fresh live trading session until the countdown expires.

## Data And Storage

- Static frontend only
- No backend
- No database
- No login or authentication
- No permanent personal trade data saving
- Uses `localStorage` only for the `liveTradingCommittedUntil` timestamp
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
