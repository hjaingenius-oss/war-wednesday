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

## Permanent Matchday Data Rules

- If a player appears in earlier games on a matchday but is absent from a later/final scoreboard, treat that as a logout penalty unless the user explicitly says otherwise.
- Never remove a logout row. It counts as a game, attendance, and the supplied result.
- When the supplied penalty is zero, store exactly 0 Score and 0 Total Points. Do not recalculate a positive score from the empty stat line.
- A logout penalty row must not affect the lobby averages used to score players who completed the game.
- If the user supplies invented or average-filled penalty statistics, include them in scoring exactly as directed and mark the row as gap-filled.
- Only exclude a partial/missing player when the user explicitly says they joined midway, did not play, or should be removed.
