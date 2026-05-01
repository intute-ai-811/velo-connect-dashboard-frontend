# Velo Connect — Frontend

> 3-Wheeler EV Fleet Management Dashboard  
> React 18 · Vite · Recharts · Leaflet · Tailwind CSS

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Tabs & Pages](#tabs--pages)
- [Performance](#performance)
- [Build & Deploy](#build--deploy)
- [Production Checklist](#production-checklist)

---

## Overview

Single-page application for real-time monitoring of a 3-wheeler EV fleet.  
Connects to the backend via REST and **Server-Sent Events (SSE)** for sub-second live data updates with no polling overhead.

Roles:
- **Admin** — sees all vehicles across all customers, full tab access
- **Customer** — sees only their own assigned vehicles, Live View tab only

---

## Features

### Live View
- Real-time SOC ring gauge with animated fill
- Speedometer and Motor RPM arc gauges (no overflow, no overlap)
- Throttle / Brake meter bars with live animation
- Battery section: cell voltage spread (MAX / Δ / MIN), temperature, current limits
- Motor Controller: temperature columns, RMS current, capacitor voltage
- Fault banner with active fault code highlighted

### Live Charts
- 5 rolling area charts: Speed, SOC, Battery Current, Motor RPM, Motor Temp
- 5-minute rolling window, up to 150 data points
- Per-chart trend badge (↑ ↓ →) with numeric delta over last 10 readings
- Min / Max / Point count strip per chart
- Custom glassmorphism tooltip

### Fault History
- Backed by the `fault_events` table — one row per fault activation, not per raw record
- Columns: Status (ACTIVE / RESOLVED) · Fault Code · Activated At · Deactivated At · Duration · Speed▲ · SoC▲ · Speed▼ · SoC▼
- Server-side pagination (100 per page)
- Date-range filter

### Live Tracking
- Leaflet map with CartoDB dark tiles
- Live position marker with animated pulse rings
- 200-point trail polyline
- History mode: full route polyline with Start / End markers
- Map overlays: legend (bottom-left), live coordinates (bottom-right)

### Vehicle Details Header
- Vehicle banner (non-sticky) with avatar, name, company badge, ID chip
- Tab bar sticky at `top: 84px` — only the tabs stick when scrolling, vehicle info scrolls away

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | React Router 6 |
| Charts | Recharts 2 |
| Maps | Leaflet + React-Leaflet |
| Icons | Lucide React |
| HTTP client | Axios |
| Styling | Inline styles (glassmorphism) + Tailwind CSS (legacy components) |
| Compression | vite-plugin-compression (gzip) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install

```bash
git clone <repo-url>
cd Frontend
npm install
```

### Configure

```bash
cp .env.example .env
# Set VITE_API_URL to your backend origin
```

### Run (development)

```bash
npm run dev
```

App starts at `http://localhost:5173`

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend base URL (no trailing slash) | `https://api.yourdomain.com` |

Create a `.env` file:
```
VITE_API_URL=https://api.yourdomain.com
```

For local development against a local backend:
```
VITE_API_URL=http://localhost:5000
```

---

## Project Structure

```
src/
├── api.js                        # Axios instance + apiUrl helper (SSE base URL)
├── App.jsx                       # Router setup
├── main.jsx                      # React root
├── index.css                     # Tailwind base + global resets
└── components/
    ├── Header.jsx                # Sticky top nav, hamburger, sidebar drawer
    ├── Footer.jsx                # Fixed footer
    ├── LoginModal.jsx            # Auth modal
    ├── VehicleDetails.jsx        # Tab shell — vehicle banner + sticky tab bar
    ├── AdminDashboard.jsx        # Fleet overview (admin)
    ├── CustomerDashboard.jsx     # Vehicle list (customer)
    ├── masters/
    │   ├── CustomerMaster.jsx    # Customer CRUD (admin)
    │   └── VehicleMaster.jsx     # Vehicle CRUD (admin)
    └── tabs/
        ├── LiveView.jsx          # Real-time gauges
        ├── LiveCharts.jsx        # Rolling area charts
        ├── FaultHistory.jsx      # Fault event table
        └── MapView.jsx           # Leaflet live tracking + route history
```

---

## Tabs & Pages

### Live View — `LiveView.jsx`

Uses **SSE** (`/api/vehicles/:id/stream`) for real-time updates + 5-second polling fallback.

Layout:
```
┌──────────────┬───────────────────────────────┐
│  SOC Ring    │  Speed Arc  │  RPM Arc        │
│  Available   ├─────────────────────────────── │
│  Current     │  Throttle / Brake / Odometer  │
├──────────────┴───────────────────────────────┤
│  Battery: Voltage Range  │  Metrics Grid     │
├──────────────────────────────────────────────┤
│  Motor: Temp Bars        │  RMS / Cap.Volt   │
└──────────────────────────────────────────────┘
```

### Live Charts — `LiveCharts.jsx`

```
┌─────────────────┬─────────────────┐
│  Vehicle Speed  │  State of Charge│   ← larger (168px chart)
├────────────┬────┴───┬─────────────┤
│ Batt. Curr │ Motor  │ Motor Temp  │   ← smaller (130px chart)
└────────────┴────────┴─────────────┘
```

### Fault History — `FaultHistory.jsx`

Calls `GET /api/vehicles/:id/fault-events` — returns proper lifecycle events, not raw records.

### Live Tracking — `MapView.jsx`

Two modes toggled by a pill switch:
- **Live Tracking** — SSE + polling, auto-pans map, animated pulse marker, trail polyline
- **Route History** — date-range filter, start/end markers, full route polyline

---

## Performance

### Re-render optimisation (no flickering)

All live components use three layers of optimisation:

**1. `useLiveStatus` hook** — replaces `setInterval(() => setNow(Date.now()), 1000)`.  
Only triggers a React re-render when the live/offline boolean flips, not every second.  
Eliminates the #1 cause of CSS transition restarts and unnecessary re-renders.

**2. `React.memo` on all leaf components** — `SocRing`, `SpeedArc`, `VoltDisplay`, `TempCol`, `MetricCard`, `Meter`, `Stat`, `SectionHdr`, `ChartCard`, `LegendRow`, `Blobs`.  
Each component re-renders only when its own props change, not when the parent re-renders.

**3. Stable references** —
- `useMemo` for derived data: `b/m/g` (battery/motor/general), `lastDataAt`, `lastDataStr`, `histPoly`, `coordStr`
- `useMemo` for recharts props: `cursor`, `activeDot`, `tooltipContent` — prevents recharts from re-creating its internal overlay on every render
- Module-level constants for Leaflet `pathOptions` — same object reference forever

**4. Deduped state updates** — `livePos` in MapView only updates when lat/lng actually changes, preventing Leaflet from re-panning and re-drawing the marker on identical coordinates.

---

## Build & Deploy

### Build for production

```bash
npm run build
# Output: dist/
```

Vite produces a minified, tree-shaken bundle with gzip compression via `vite-plugin-compression`.

### Preview production build locally

```bash
npm run preview
```

### Deploy to static host (Netlify / Vercel / S3+CloudFront)

The app is a pure SPA — deploy the `dist/` folder to any static host.

**Important:** Configure your host to redirect all paths to `index.html` (required for React Router).

**Netlify** — add `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Nginx** — add to server block:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Vercel** — add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Environment variables at build time

```bash
VITE_API_URL=https://api.yourdomain.com npm run build
```

Or set in your hosting platform's environment variable settings before triggering a deploy.

---

## Production Checklist

- [ ] `VITE_API_URL` points to the production backend (HTTPS)
- [ ] Static host configured to redirect all paths to `index.html`
- [ ] CORS on the backend allows the frontend origin exactly
- [ ] Backend `fault_events` migration has been run
- [ ] `npm run build` succeeds with no errors
- [ ] `dist/` served over HTTPS (required for SSE on modern browsers)
- [ ] Browser cache headers set appropriately (`index.html`: no-cache; assets: long-term cache)
- [ ] Test SSE live stream in production network (some proxies buffer SSE — verify `X-Accel-Buffering: no` is passed through)
