# Territory Run — independent territory fitness website

A React + Vite + TypeScript prototype inspired by the broad concept of GPS-based territory fitness games. It does not use INTVL branding, proprietary assets, or private services.

## Features
- Responsive dark gaming dashboard
- Interactive OpenStreetMap using Leaflet / React Leaflet
- Browser GPS tracking with permission
- Start, pause, resume, finish controls
- Walk / run / cycle selection
- Demo route works without GPS movement
- Closed-loop validation and polygon territory capture
- Approximate territory area calculated with Turf.js
- Session stats and reset

## Requirements
Install Node.js LTS from https://nodejs.org/ and optionally VS Code.

## Run locally
Open PowerShell in this folder and run:

```powershell
npm install
npm run dev
```

Open the localhost URL Vite prints, usually http://localhost:5173.

## Test demo route
1. Click **Load demo route**.
2. A purple route should appear on the map.
3. Click **Claim demo territory**.
4. A green polygon should appear and stats update.
5. Click **Reset session** to clear the session.

## Test real GPS
1. Open the site at localhost on a GPS-enabled device, or use an HTTPS deployment.
2. Click **Start activity** and allow location access.
3. Move around to record GPS points.
4. Return within 80 metres of the start and click **Finish & capture**.

Desktop browsers may use computer location or simulated location rather than a physical GPS sensor. Browser geolocation requires a secure context: localhost is allowed for local development; deployed sites should use HTTPS.

## Production build
```powershell
npm run build
npm run preview
```

## Limitations
- Frontend only: no accounts, cloud sync, or multiplayer yet.
- Data is session-only and resets on reload.
- Loop rules and GPS jump filtering are basic prototype safeguards, not anti-cheat.
- Area calculation is intended for small demo loops, not authoritative scoring.
- OpenStreetMap standard tiles require attribution and are subject to the tile usage policy: https://operations.osmfoundation.org/policies/tiles/
