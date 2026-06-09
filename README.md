# Wi-Fi Probe Capture Dashboard

Passive Wi-Fi probe-request analytics for passenger counting — visualized.

## Stack
- React 18 + Vite
- Recharts for data visualization
- IBM Plex Mono + Inter typography
- Zero external API calls — all data embedded

## Deploy to Vercel

### Option A — Drag & drop (fastest)
1. Run `npm run build` → get a `dist/` folder
2. Go to vercel.com → New Project → drag the `dist/` folder

### Option B — GitHub
1. Push this repo to GitHub
2. Import on Vercel — it auto-detects Vite
3. Build command: `npm run build`
4. Output dir: `dist`

## Local dev
```bash
npm install
npm run dev
```
