# War Wednesday - Full Project Context Export

## 1) Product Summary
War Wednesday is a private Counter-Strike 2 friends league dashboard with a public read-only viewer and a simple hidden admin route.

Core model:
- No multi-user login.
- One admin edits match data.
- Everyone else views leaderboard, players, match history, match details, and stats.

## 2) Stack
- React + TypeScript + Vite
- React Router
- Dexie (IndexedDB local database)
- Recharts (profile trend chart)
- Vercel hosting (SPA rewrite via vercel.json)

## 3) Key Routes
Public:
- `/` Dashboard
- `/leaderboard` Main Ranked Board + Impact Board
- `/matches` Match History grouped by matchday
- `/matches/:id` Match Detail
- `/players` Player cards
- `/players/:id` Player profile
- `/stats` presenter-style stats center

Admin:
- `/admin` password gate
- `/admin/add-match`
- `/admin/edit-match/:id`
- `/admin/players`
- `/admin/matchdays`

## 4) Data Model (IndexedDB via Dexie)
Tables:
- players
- player_aliases
- seasons
- match_days
- matches
- match_players
- knife_events

Notes:
- App is currently local-first using IndexedDB seed data.
- Knife events are first-class stat records.

## 5) Ranking System (Current Official)
Primary ranking = War Rating (not raw points).

### Match Value
For each match row:
- combatScore = kills + assists*0.5 - deaths*0.7
- resultBonus: win=8, draw=4, loss=0
- kdBonus: >=2.0 => 6, >=1.5 => 4, >=1.0 => 2, else 0
- killMilestoneBonus: >=30 => 10, >=20 => 5, >=10 => 2, else 0
- matchValue = 50 + combatScore + resultBonus + kdBonus + killMilestoneBonus
- K/D: if deaths = 0, use kills value to avoid divide-by-zero.

### Total Points (Volume metric only)
- resultPoints: win=10, draw=5, loss=2
- totalPointsForMatch = resultPoints + kills + assists*0.5 - deaths*0.5
- leaderboard shows as `Total Points`.

### Matchday logic
- matchdayScore = average matchValue for that player on that matchday.
- attendance uses matchdays played, not raw match count.

### Recency weights (by matchday)
- latest=1.00
- previous=0.90
- third=0.80
- fourth=0.70
- fifth and older=0.60

weightedAverageMatchdayScore =
sum(matchdayScore*weight)/sum(weight for played matchdays)

### Attendance multiplier
- >=0.80 => 1.00
- >=0.60 => 0.97
- >=0.40 => 0.92
- >=0.25 => 0.85
- else 0.70

### Reliability bonus
- min(matchdaysPlayed * 0.75, 6)

### War Rating
- warRating = weightedAverageMatchdayScore * attendanceMultiplier + reliabilityBonus

### Form Rating
- average of last 3 played matchdayScores
- no attendance multiplier
- no reliability bonus
- mark small sample if <3 matchdays

### Classification
- Regular: attendanceRate>=0.50 OR matchdaysPlayed>=5
- Impact Player: attendanceRate in [0.25,0.50) and warRating >= median(Regular warRating)
- Cameo: played >0 but not Regular/Impact
- Inactive: played 0

### Leaderboard split
Main Ranked Board:
- only Regulars (official ranks)
- sort: War Rating, Form, K/D, Win%, Total Points, Kills

Impact Board:
- Impact Player + Cameo
- sort: War Rating, Form, K/D, Matchdays Played

Comparison badges for non-Regulars:
- Would Rank #1
- Would Rank Top 3
- Elite Small Sample
- Needs More Games

## 6) Fun Titles / Awards (Current)
Deterministic awards:
- Assist Hero
- Assassin
- Knife Artist
- Knife Victim
- Wildcard
- Consistent Performer
- Map Specialist (per map, min sample threshold)

Shown on:
- Dashboard `League Awards`
- Dashboard `Map Specialists`
- Player profile badges (max 3)
- Leaderboard `Titles` column

## 7) Stats Page (`/stats`)
Presenter-style sections:
- High Kill Rate
- Total Kills Leaderboard
- Best Single Match Value
- Highest Kill Games
- Iconic Matches
- Rivalry Record (knife pairs)
- Map Kill Records
- Hottest Matchday

## 8) UI Direction
- Dark esports dashboard style
- Clean dense tables
- War Rating visually emphasized
- Subtle CS-inspired accents (crosshair/chips)
- Responsive mobile layout

## 9) Hosting Notes
Vercel requirements:
- root must contain package.json, src/, index.html, vercel.json
- avoid uploading root duplicate files that belong in src/
- production URL updates when main branch deploys

Important previous pitfall:
- Root-level duplicate `App.tsx`, `index.css`, `selectors.ts` caused changes not to reflect because Vite uses `src/*` files.

## 10) Core Files to Inspect
- src/App.tsx
- src/selectors.ts
- src/db.ts
- src/lib/scoring.ts
- src/types.ts
- src/index.css
- vercel.json
- package.json
- README.md

## 11) Suggested Next Improvements
- Move from local IndexedDB to hosted DB + storage for real-time shared updates without redeploy.
- Admin upload pipeline for screenshots + OCR-assist optional mode (currently intentionally not used).
- Add charting on `/stats` (records over time, rolling form).
- Introduce import/export JSON tool for easier matchday updates.
- Add test coverage for ranking utilities in `src/selectors.ts`.

## 12) Versioning Note
If seed data changes and users need clean refresh, bump the local seed version key in `src/db.ts` and reseed logic.
