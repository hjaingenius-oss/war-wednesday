# War Wednesday

Private CS2 league dashboard for public viewing.

## How Sharing Works

The hosted site is read-only for everyone. Data edits happen in this workspace, then the app is rebuilt and redeployed. That keeps random visitors away from admin tools.

Local development still has admin enabled by default at `/admin`.

Production hosting disables admin unless `VITE_ENABLE_ADMIN=true` is explicitly set. Do not enable that on the public site unless a real backend auth layer is added.

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173/`.

## Deploy On Vercel

Recommended settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

`vercel.json` is included so shared links like `/matches/34` and `/players/2` work after refresh.

## Updating Data

Edit the seeded data in `src/db.ts`, bump the local import flag version in `seedIfEmpty`, run `npm.cmd run build`, then redeploy.
