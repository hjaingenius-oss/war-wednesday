// CS2 Friends League — Match-wise uploadable data pack
// Includes two corrected matchdays from screenshots.
// Notes:
// - Scores/results are taken from visible scoreboards.
// - Result is assigned from the actual match scoreline, not team order assumptions.
// - Missing players in Matchday 2 Mirage are included with 0 in all stats.
// - Voldemort Matchday 2 Mirage K/D/A is gap-filled from his average on other maps: 11/14/6.
// - Stormbre@ker is normalized to Aks with displayName preserved.
// - !!@DaNgErBoY@!! is normalized to Dangerboy with displayName preserved.

export type MatchResult = 'WIN' | 'LOSS' | 'DRAW';

export type LeagueImportRow = {
  name: string;
  displayName?: string;
  team: string;
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
  mvps: number;
  score: number;
  hsPercent: number;
  adr: number;
  utilityDamage: number;
  enemyFlashed: number;
  gapFill?: boolean;
  gapFillReason?: string;
};

export type LeagueImportMatch = {
  date: string;
  matchDayTitle: string;
  map: string;
  teamAScore: number;
  teamBScore: number;
  teamAName: string;
  teamBName: string;
  winningTeam: string;
  rows: LeagueImportRow[];
};

export const importedMatches: LeagueImportMatch[] = [
  // -----------------------------
  // MATCHDAY 1 — Corrected pack
  // -----------------------------
  {
    date: '2026-08-10',
    matchDayTitle: 'War Wednesday - Aug 10, 2026',
    map: 'Inferno',
    teamAScore: 10,
    teamBScore: 13,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Terrorists',
    rows: [
      { name: 'Radha', team: 'Counter-Terrorists', result: 'LOSS', kills: 32, deaths: 18, assists: 3, mvps: 1, score: 89, hsPercent: 18, adr: 137, utilityDamage: 0, enemyFlashed: 14 },
      { name: 'Manson', team: 'Counter-Terrorists', result: 'LOSS', kills: 23, deaths: 20, assists: 6, mvps: 1, score: 70, hsPercent: 26, adr: 110, utilityDamage: 157, enemyFlashed: 1 },
      { name: 'fatal_destiny', team: 'Counter-Terrorists', result: 'LOSS', kills: 18, deaths: 18, assists: 6, mvps: 1, score: 60, hsPercent: 33, adr: 82, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Mr.Robot', team: 'Counter-Terrorists', result: 'LOSS', kills: 17, deaths: 19, assists: 4, mvps: 1, score: 60, hsPercent: 52, adr: 85, utilityDamage: 26, enemyFlashed: 5 },
      { name: 'Voldemort', team: 'Counter-Terrorists', result: 'LOSS', kills: 11, deaths: 19, assists: 8, mvps: 0, score: 44, hsPercent: 45, adr: 54, utilityDamage: 211, enemyFlashed: 0 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Counter-Terrorists', result: 'LOSS', kills: 10, deaths: 18, assists: 2, mvps: 1, score: 42, hsPercent: 50, adr: 50, utilityDamage: 0, enemyFlashed: 6 },
      { name: 'Bob Marde', team: 'Counter-Terrorists', result: 'LOSS', kills: 12, deaths: 18, assists: 7, mvps: 1, score: 41, hsPercent: 41, adr: 63, utilityDamage: 225, enemyFlashed: 12 },
      { name: 'PeekaBoom', team: 'Counter-Terrorists', result: 'LOSS', kills: 9, deaths: 18, assists: 1, mvps: 1, score: 33, hsPercent: 55, adr: 42, utilityDamage: 49, enemyFlashed: 0 },

      { name: 'GULLU', team: 'Terrorists', result: 'WIN', kills: 26, deaths: 18, assists: 4, mvps: 5, score: 78, hsPercent: 19, adr: 111, utilityDamage: 83, enemyFlashed: 4 },
      { name: 'VPS', team: 'Terrorists', result: 'WIN', kills: 26, deaths: 18, assists: 5, mvps: 1, score: 78, hsPercent: 38, adr: 98, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'amansanghvi1', team: 'Terrorists', result: 'WIN', kills: 21, deaths: 17, assists: 6, mvps: 1, score: 68, hsPercent: 33, adr: 86, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'IB', team: 'Terrorists', result: 'WIN', kills: 16, deaths: 16, assists: 12, mvps: 2, score: 64, hsPercent: 43, adr: 95, utilityDamage: 186, enemyFlashed: 0 },
      { name: 'MAVERICK', team: 'Terrorists', result: 'WIN', kills: 18, deaths: 15, assists: 6, mvps: 1, score: 61, hsPercent: 16, adr: 83, utilityDamage: 116, enemyFlashed: 3 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Terrorists', result: 'WIN', kills: 17, deaths: 18, assists: 4, mvps: 1, score: 53, hsPercent: 58, adr: 69, utilityDamage: 28, enemyFlashed: 20 },
      { name: 'thomas', team: 'Terrorists', result: 'WIN', kills: 11, deaths: 16, assists: 4, mvps: 0, score: 38, hsPercent: 63, adr: 62, utilityDamage: 4, enemyFlashed: 5 },
      { name: 'Hodor bitch!', team: 'Terrorists', result: 'WIN', kills: 9, deaths: 17, assists: 4, mvps: 1, score: 32, hsPercent: 44, adr: 52, utilityDamage: 157, enemyFlashed: 9 },
    ],
  },
  {
    date: '2026-08-10',
    matchDayTitle: 'War Wednesday - Aug 10, 2026',
    map: 'Dust II',
    teamAScore: 13,
    teamBScore: 9,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Counter-Terrorists',
    rows: [
      { name: 'IB', team: 'Counter-Terrorists', result: 'WIN', kills: 27, deaths: 15, assists: 9, mvps: 1, score: 83, hsPercent: 51, adr: 123, utilityDamage: 127, enemyFlashed: 0 },
      { name: 'VPS', team: 'Counter-Terrorists', result: 'WIN', kills: 18, deaths: 19, assists: 1, mvps: 0, score: 68, hsPercent: 50, adr: 84, utilityDamage: 0, enemyFlashed: 26 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Counter-Terrorists', result: 'WIN', kills: 19, deaths: 15, assists: 11, mvps: 1, score: 68, hsPercent: 42, adr: 96, utilityDamage: 16, enemyFlashed: 28 },
      { name: 'MAVERICK', team: 'Counter-Terrorists', result: 'WIN', kills: 18, deaths: 18, assists: 8, mvps: 1, score: 67, hsPercent: 27, adr: 98, utilityDamage: 154, enemyFlashed: 12 },
      { name: 'GULLU', team: 'Counter-Terrorists', result: 'WIN', kills: 22, deaths: 19, assists: 4, mvps: 1, score: 65, hsPercent: 13, adr: 105, utilityDamage: 91, enemyFlashed: 2 },
      { name: 'thomas', team: 'Counter-Terrorists', result: 'WIN', kills: 17, deaths: 18, assists: 10, mvps: 1, score: 62, hsPercent: 52, adr: 82, utilityDamage: 0, enemyFlashed: 12 },
      { name: 'amansanghvi1', team: 'Counter-Terrorists', result: 'WIN', kills: 12, deaths: 18, assists: 9, mvps: 0, score: 50, hsPercent: 25, adr: 68, utilityDamage: 120, enemyFlashed: 6 },
      { name: 'Hodor bitch!', team: 'Counter-Terrorists', result: 'WIN', kills: 10, deaths: 19, assists: 4, mvps: 1, score: 35, hsPercent: 50, adr: 48, utilityDamage: 59, enemyFlashed: 3 },

      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Terrorists', result: 'LOSS', kills: 20, deaths: 16, assists: 5, mvps: 1, score: 65, hsPercent: 25, adr: 83, utilityDamage: 1, enemyFlashed: 9 },
      { name: 'Mr.Robot', team: 'Terrorists', result: 'LOSS', kills: 19, deaths: 20, assists: 8, mvps: 1, score: 65, hsPercent: 21, adr: 100, utilityDamage: 0, enemyFlashed: 7 },
      { name: 'Radha', team: 'Terrorists', result: 'LOSS', kills: 20, deaths: 18, assists: 3, mvps: 1, score: 61, hsPercent: 20, adr: 80, utilityDamage: 0, enemyFlashed: 3 },
      { name: 'Manson', team: 'Terrorists', result: 'LOSS', kills: 20, deaths: 18, assists: 3, mvps: 1, score: 59, hsPercent: 55, adr: 90, utilityDamage: 0, enemyFlashed: 4 },
      { name: 'fatal_destiny', team: 'Terrorists', result: 'LOSS', kills: 15, deaths: 19, assists: 7, mvps: 1, score: 56, hsPercent: 40, adr: 92, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Terrorists', result: 'LOSS', kills: 15, deaths: 17, assists: 5, mvps: 1, score: 55, hsPercent: 53, adr: 67, utilityDamage: 50, enemyFlashed: 18 },
      { name: 'Voldemort', team: 'Terrorists', result: 'LOSS', kills: 17, deaths: 17, assists: 8, mvps: 1, score: 54, hsPercent: 17, adr: 98, utilityDamage: 333, enemyFlashed: 0 },
      { name: 'PeekaBoom', team: 'Terrorists', result: 'LOSS', kills: 12, deaths: 18, assists: 5, mvps: 0, score: 46, hsPercent: 8, adr: 53, utilityDamage: 10, enemyFlashed: 2 },
    ],
  },
  {
    date: '2026-08-10',
    matchDayTitle: 'War Wednesday - Aug 10, 2026',
    map: 'Ancient',
    teamAScore: 12,
    teamBScore: 12,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Draw',
    rows: [
      { name: 'Mr.Robot', team: 'Counter-Terrorists', result: 'DRAW', kills: 34, deaths: 22, assists: 6, mvps: 1, score: 94, hsPercent: 64, adr: 136, utilityDamage: 120, enemyFlashed: 2 },
      { name: 'Manson', team: 'Counter-Terrorists', result: 'DRAW', kills: 25, deaths: 21, assists: 10, mvps: 1, score: 88, hsPercent: 20, adr: 114, utilityDamage: 37, enemyFlashed: 2 },
      { name: 'Radha', team: 'Counter-Terrorists', result: 'DRAW', kills: 21, deaths: 18, assists: 7, mvps: 1, score: 68, hsPercent: 38, adr: 83, utilityDamage: 7, enemyFlashed: 8 },
      { name: 'fatal_destiny', team: 'Counter-Terrorists', result: 'DRAW', kills: 21, deaths: 18, assists: 7, mvps: 1, score: 67, hsPercent: 14, adr: 94, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'PeekaBoom', team: 'Counter-Terrorists', result: 'DRAW', kills: 18, deaths: 14, assists: 8, mvps: 1, score: 66, hsPercent: 26, adr: 84, utilityDamage: 216, enemyFlashed: 2 },
      { name: 'Voldemort', team: 'Counter-Terrorists', result: 'DRAW', kills: 12, deaths: 19, assists: 9, mvps: 0, score: 63, hsPercent: 58, adr: 67, utilityDamage: 81, enemyFlashed: 0 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Counter-Terrorists', result: 'DRAW', kills: 15, deaths: 19, assists: 5, mvps: 0, score: 49, hsPercent: 40, adr: 68, utilityDamage: 64, enemyFlashed: 13 },
      { name: 'Bob Marde', team: 'Counter-Terrorists', result: 'DRAW', kills: 10, deaths: 20, assists: 12, mvps: 0, score: 44, hsPercent: 10, adr: 56, utilityDamage: 102, enemyFlashed: 13 },

      { name: 'GULLU', team: 'Terrorists', result: 'DRAW', kills: 32, deaths: 19, assists: 5, mvps: 1, score: 88, hsPercent: 31, adr: 128, utilityDamage: 48, enemyFlashed: 1 },
      { name: 'amansanghvi1', team: 'Terrorists', result: 'DRAW', kills: 24, deaths: 20, assists: 12, mvps: 1, score: 80, hsPercent: 16, adr: 116, utilityDamage: 215, enemyFlashed: 2 },
      { name: 'VPS', team: 'Terrorists', result: 'DRAW', kills: 23, deaths: 17, assists: 6, mvps: 1, score: 73, hsPercent: 17, adr: 83, utilityDamage: 110, enemyFlashed: 0 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Terrorists', result: 'DRAW', kills: 17, deaths: 21, assists: 8, mvps: 1, score: 81, hsPercent: 41, adr: 77, utilityDamage: 100, enemyFlashed: 16 },
      { name: 'MAVERICK', team: 'Terrorists', result: 'DRAW', kills: 19, deaths: 19, assists: 3, mvps: 1, score: 68, hsPercent: 21, adr: 73, utilityDamage: 0, enemyFlashed: 4 },
      { name: 'IB', team: 'Terrorists', result: 'DRAW', kills: 12, deaths: 19, assists: 6, mvps: 0, score: 50, hsPercent: 41, adr: 89, utilityDamage: 120, enemyFlashed: 1 },
      { name: 'Hodor bitch!', team: 'Terrorists', result: 'DRAW', kills: 13, deaths: 19, assists: 6, mvps: 1, score: 44, hsPercent: 63, adr: 83, utilityDamage: 7, enemyFlashed: 4 },
      { name: 'thomas', team: 'Terrorists', result: 'DRAW', kills: 10, deaths: 20, assists: 7, mvps: 0, score: 41, hsPercent: 70, adr: 65, utilityDamage: 0, enemyFlashed: 13 },
    ],
  },
  {
    date: '2026-08-10',
    matchDayTitle: 'War Wednesday - Aug 10, 2026',
    map: 'Mirage',
    teamAScore: 13,
    teamBScore: 10,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Counter-Terrorists',
    rows: [
      { name: 'IB', team: 'Counter-Terrorists', result: 'WIN', kills: 28, deaths: 19, assists: 4, mvps: 1, score: 77, hsPercent: 28, adr: 122, utilityDamage: 107, enemyFlashed: 0 },
      { name: 'GULLU', team: 'Counter-Terrorists', result: 'WIN', kills: 27, deaths: 15, assists: 2, mvps: 2, score: 75, hsPercent: 11, adr: 105, utilityDamage: 86, enemyFlashed: 1 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Counter-Terrorists', result: 'WIN', kills: 24, deaths: 19, assists: 8, mvps: 1, score: 69, hsPercent: 0, adr: 0, utilityDamage: 0, enemyFlashed: 0, gapFill: true, gapFillReason: 'K/D/A/MVP/score visible; advanced stats not visible, set to 0.' },
      { name: 'MAVERICK', team: 'Counter-Terrorists', result: 'WIN', kills: 21, deaths: 19, assists: 6, mvps: 1, score: 70, hsPercent: 47, adr: 95, utilityDamage: 30, enemyFlashed: 1 },
      { name: 'VPS', team: 'Counter-Terrorists', result: 'WIN', kills: 15, deaths: 16, assists: 4, mvps: 2, score: 51, hsPercent: 28, adr: 72, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'thomas', team: 'Counter-Terrorists', result: 'WIN', kills: 13, deaths: 20, assists: 2, mvps: 0, score: 46, hsPercent: 38, adr: 58, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'Hodor bitch!', team: 'Counter-Terrorists', result: 'WIN', kills: 13, deaths: 21, assists: 2, mvps: 0, score: 45, hsPercent: 38, adr: 62, utilityDamage: 119, enemyFlashed: 2 },
      { name: 'amansanghvi1', team: 'Counter-Terrorists', result: 'WIN', kills: 10, deaths: 16, assists: 7, mvps: 0, score: 44, hsPercent: 10, adr: 79, utilityDamage: 9, enemyFlashed: 1 },

      { name: 'Radha', team: 'Terrorists', result: 'LOSS', kills: 30, deaths: 19, assists: 5, mvps: 6, score: 84, hsPercent: 26, adr: 142, utilityDamage: 0, enemyFlashed: 8 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Terrorists', result: 'LOSS', kills: 24, deaths: 20, assists: 6, mvps: 0, score: 79, hsPercent: 45, adr: 89, utilityDamage: 0, enemyFlashed: 3 },
      { name: 'Mr.Robot', team: 'Terrorists', result: 'LOSS', kills: 24, deaths: 19, assists: 4, mvps: 1, score: 69, hsPercent: 54, adr: 101, utilityDamage: 52, enemyFlashed: 16 },
      { name: 'Manson', team: 'Terrorists', result: 'LOSS', kills: 21, deaths: 18, assists: 3, mvps: 2, score: 71, hsPercent: 28, adr: 111, utilityDamage: 33, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Terrorists', result: 'LOSS', kills: 14, deaths: 18, assists: 5, mvps: 0, score: 48, hsPercent: 28, adr: 86, utilityDamage: 40, enemyFlashed: 9 },
      { name: 'PeekaBoom', team: 'Terrorists', result: 'LOSS', kills: 15, deaths: 17, assists: 1, mvps: 0, score: 43, hsPercent: 13, adr: 62, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Voldemort', team: 'Terrorists', result: 'LOSS', kills: 8, deaths: 20, assists: 5, mvps: 1, score: 37, hsPercent: 50, adr: 52, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'fatal_destiny', team: 'Terrorists', result: 'LOSS', kills: 9, deaths: 22, assists: 4, mvps: 1, score: 34, hsPercent: 55, adr: 44, utilityDamage: 0, enemyFlashed: 0 },
    ],
  },

  // -----------------------------
  // MATCHDAY 2 — With missing-player zero rows
  // -----------------------------
  {
    date: '2026-08-19',
    matchDayTitle: 'War Wednesday - Aug 19, 2026',
    map: 'Dust II',
    teamAScore: 13,
    teamBScore: 8,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Counter-Terrorists',
    rows: [
      { name: 'Jin', team: 'Counter-Terrorists', result: 'WIN', kills: 44, deaths: 14, assists: 11, mvps: 2, score: 123, hsPercent: 18, adr: 224, utilityDamage: 203, enemyFlashed: 5 },
      { name: 'VPS', team: 'Counter-Terrorists', result: 'WIN', kills: 20, deaths: 12, assists: 3, mvps: 2, score: 71, hsPercent: 25, adr: 92, utilityDamage: 0, enemyFlashed: 32 },
      { name: 'Manson', team: 'Counter-Terrorists', result: 'WIN', kills: 21, deaths: 15, assists: 2, mvps: 1, score: 54, hsPercent: 23, adr: 95, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'MAVERICK', team: 'Counter-Terrorists', result: 'WIN', kills: 15, deaths: 16, assists: 3, mvps: 1, score: 50, hsPercent: 33, adr: 62, utilityDamage: 4, enemyFlashed: 10 },
      { name: 'IB', team: 'Counter-Terrorists', result: 'WIN', kills: 11, deaths: 18, assists: 8, mvps: 0, score: 49, hsPercent: 36, adr: 67, utilityDamage: 43, enemyFlashed: 0 },
      { name: 'Voldemort', team: 'Counter-Terrorists', result: 'WIN', kills: 12, deaths: 16, assists: 9, mvps: 1, score: 48, hsPercent: 25, adr: 83, utilityDamage: 238, enemyFlashed: 0 },
      { name: 'thomas', team: 'Counter-Terrorists', result: 'WIN', kills: 11, deaths: 18, assists: 9, mvps: 0, score: 46, hsPercent: 45, adr: 72, utilityDamage: 0, enemyFlashed: 10 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Counter-Terrorists', result: 'WIN', kills: 11, deaths: 17, assists: 4, mvps: 0, score: 36, hsPercent: 36, adr: 53, utilityDamage: 0, enemyFlashed: 28 },

      { name: 'DT', team: 'Terrorists', result: 'LOSS', kills: 22, deaths: 18, assists: 7, mvps: 1, score: 71, hsPercent: 27, adr: 99, utilityDamage: 33, enemyFlashed: 1 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Terrorists', result: 'LOSS', kills: 20, deaths: 17, assists: 6, mvps: 2, score: 66, hsPercent: 50, adr: 92, utilityDamage: 0, enemyFlashed: 4 },
      { name: 'Daa', team: 'Terrorists', result: 'LOSS', kills: 16, deaths: 18, assists: 5, mvps: 0, score: 54, hsPercent: 75, adr: 71, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Terrorists', result: 'LOSS', kills: 15, deaths: 17, assists: 9, mvps: 1, score: 49, hsPercent: 33, adr: 66, utilityDamage: 59, enemyFlashed: 14 },
      { name: 'DrKush', team: 'Terrorists', result: 'LOSS', kills: 10, deaths: 20, assists: 10, mvps: 1, score: 49, hsPercent: 60, adr: 80, utilityDamage: 51, enemyFlashed: 9 },
      { name: 'Radha', team: 'Terrorists', result: 'LOSS', kills: 15, deaths: 20, assists: 4, mvps: 1, score: 48, hsPercent: 33, adr: 75, utilityDamage: 30, enemyFlashed: 4 },
      { name: 'amansanghvi1', team: 'Terrorists', result: 'LOSS', kills: 12, deaths: 19, assists: 7, mvps: 1, score: 48, hsPercent: 33, adr: 81, utilityDamage: 164, enemyFlashed: 1 },
      { name: 'GULLU', team: 'Terrorists', result: 'LOSS', kills: 13, deaths: 16, assists: 5, mvps: 0, score: 46, hsPercent: 38, adr: 71, utilityDamage: 13, enemyFlashed: 5 },
    ],
  },
  {
    date: '2026-08-19',
    matchDayTitle: 'War Wednesday - Aug 19, 2026',
    map: 'Ancient',
    teamAScore: 3,
    teamBScore: 13,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Terrorists',
    rows: [
      { name: 'GULLU', team: 'Counter-Terrorists', result: 'LOSS', kills: 20, deaths: 14, assists: 1, mvps: 0, score: 56, hsPercent: 30, adr: 127, utilityDamage: 46, enemyFlashed: 1 },
      { name: 'DrKush', team: 'Counter-Terrorists', result: 'LOSS', kills: 17, deaths: 15, assists: 3, mvps: 1, score: 51, hsPercent: 41, adr: 103, utilityDamage: 17, enemyFlashed: 16 },
      { name: 'DT', team: 'Counter-Terrorists', result: 'LOSS', kills: 11, deaths: 15, assists: 4, mvps: 0, score: 44, hsPercent: 27, adr: 85, utilityDamage: 22, enemyFlashed: 0 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Counter-Terrorists', result: 'LOSS', kills: 12, deaths: 15, assists: 2, mvps: 1, score: 38, hsPercent: 16, adr: 64, utilityDamage: 0, enemyFlashed: 4 },
      { name: 'amansanghvi1', team: 'Counter-Terrorists', result: 'LOSS', kills: 8, deaths: 16, assists: 6, mvps: 1, score: 36, hsPercent: 25, adr: 69, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Daa', team: 'Counter-Terrorists', result: 'LOSS', kills: 9, deaths: 14, assists: 6, mvps: 0, score: 36, hsPercent: 11, adr: 72, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Counter-Terrorists', result: 'LOSS', kills: 8, deaths: 16, assists: 5, mvps: 0, score: 31, hsPercent: 37, adr: 66, utilityDamage: 3, enemyFlashed: 11 },
      { name: 'Radha', team: 'Counter-Terrorists', result: 'LOSS', kills: 6, deaths: 15, assists: 6, mvps: 0, score: 29, hsPercent: 33, adr: 51, utilityDamage: 0, enemyFlashed: 8 },

      { name: 'Jin', team: 'Terrorists', result: 'WIN', kills: 31, deaths: 10, assists: 8, mvps: 1, score: 88, hsPercent: 32, adr: 192, utilityDamage: 84, enemyFlashed: 8 },
      { name: 'IB', team: 'Terrorists', result: 'WIN', kills: 20, deaths: 10, assists: 6, mvps: 1, score: 60, hsPercent: 15, adr: 126, utilityDamage: 13, enemyFlashed: 0 },
      { name: 'VPS', team: 'Terrorists', result: 'WIN', kills: 17, deaths: 11, assists: 6, mvps: 1, score: 54, hsPercent: 5, adr: 106, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Manson', team: 'Terrorists', result: 'WIN', kills: 15, deaths: 10, assists: 6, mvps: 1, score: 49, hsPercent: 26, adr: 86, utilityDamage: 160, enemyFlashed: 0 },
      { name: 'Voldemort', team: 'Terrorists', result: 'WIN', kills: 12, deaths: 10, assists: 3, mvps: 0, score: 41, hsPercent: 0, adr: 43, utilityDamage: 132, enemyFlashed: 1 },
      { name: 'MAVERICK', team: 'Terrorists', result: 'WIN', kills: 10, deaths: 14, assists: 6, mvps: 1, score: 38, hsPercent: 20, adr: 75, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'thomas', team: 'Terrorists', result: 'WIN', kills: 10, deaths: 13, assists: 5, mvps: 0, score: 37, hsPercent: 40, adr: 68, utilityDamage: 0, enemyFlashed: 3 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Terrorists', result: 'WIN', kills: 5, deaths: 13, assists: 9, mvps: 0, score: 30, hsPercent: 20, adr: 65, utilityDamage: 16, enemyFlashed: 13 },
    ],
  },
  {
    date: '2026-08-19',
    matchDayTitle: 'War Wednesday - Aug 19, 2026',
    map: 'Mirage',
    teamAScore: 13,
    teamBScore: 9,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Counter-Terrorists',
    rows: [
      { name: 'Jin', team: 'Counter-Terrorists', result: 'WIN', kills: 29, deaths: 17, assists: 7, mvps: 1, score: 80, hsPercent: 41, adr: 145, utilityDamage: 239, enemyFlashed: 7 },
      { name: 'VPS', team: 'Counter-Terrorists', result: 'WIN', kills: 20, deaths: 16, assists: 4, mvps: 1, score: 69, hsPercent: 0, adr: 0, utilityDamage: 0, enemyFlashed: 0, gapFill: true, gapFillReason: 'K/D/A/MVP/score visible; advanced stat row not visible, set to 0.' },
      { name: 'MAVERICK', team: 'Counter-Terrorists', result: 'WIN', kills: 17, deaths: 15, assists: 6, mvps: 1, score: 57, hsPercent: 32, adr: 87, utilityDamage: 49, enemyFlashed: 1 },
      { name: 'Manson', team: 'Counter-Terrorists', result: 'WIN', kills: 16, deaths: 16, assists: 3, mvps: 1, score: 48, hsPercent: 31, adr: 74, utilityDamage: 0, enemyFlashed: 0 },

      { name: 'GULLU', team: 'Terrorists', result: 'LOSS', kills: 19, deaths: 19, assists: 6, mvps: 1, score: 61, hsPercent: 31, adr: 93, utilityDamage: 38, enemyFlashed: 4 },
      { name: 'DrKush', team: 'Terrorists', result: 'LOSS', kills: 19, deaths: 17, assists: 7, mvps: 1, score: 60, hsPercent: 0, adr: 0, utilityDamage: 0, enemyFlashed: 0, gapFill: true, gapFillReason: 'K/D/A/MVP/score visible; advanced stat row not visible, set to 0.' },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Terrorists', result: 'LOSS', kills: 20, deaths: 16, assists: 4, mvps: 1, score: 59, hsPercent: 30, adr: 89, utilityDamage: 2, enemyFlashed: 6 },
      { name: 'DT', team: 'Terrorists', result: 'LOSS', kills: 18, deaths: 18, assists: 7, mvps: 0, score: 57, hsPercent: 31, adr: 108, utilityDamage: 174, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Terrorists', result: 'LOSS', kills: 16, deaths: 14, assists: 3, mvps: 0, score: 46, hsPercent: 31, adr: 76, utilityDamage: 198, enemyFlashed: 12 },
      { name: 'Daa', team: 'Terrorists', result: 'LOSS', kills: 12, deaths: 17, assists: 3, mvps: 1, score: 38, hsPercent: 33, adr: 55, utilityDamage: 0, enemyFlashed: 0 },

      { name: 'IB', team: 'Not Played / Missing', result: 'LOSS', kills: 0, deaths: 0, assists: 0, mvps: 0, score: 0, hsPercent: 0, adr: 0, utilityDamage: 0, enemyFlashed: 0, gapFill: true, gapFillReason: 'Missing in Mirage; user instructed missing players get 0 in all fields.' },
      { name: 'Radha', team: 'Not Played / Missing', result: 'LOSS', kills: 0, deaths: 0, assists: 0, mvps: 0, score: 0, hsPercent: 0, adr: 0, utilityDamage: 0, enemyFlashed: 0, gapFill: true, gapFillReason: 'Missing in Mirage; user instructed missing players get 0 in all fields.' },
      { name: 'amansanghvi1', team: 'Not Played / Missing', result: 'LOSS', kills: 0, deaths: 0, assists: 0, mvps: 0, score: 0, hsPercent: 0, adr: 0, utilityDamage: 0, enemyFlashed: 0, gapFill: true, gapFillReason: 'Missing in Mirage; user instructed missing players get 0 in all fields.' },
      { name: 'thomas', team: 'Not Played / Missing', result: 'LOSS', kills: 0, deaths: 0, assists: 0, mvps: 0, score: 0, hsPercent: 0, adr: 0, utilityDamage: 0, enemyFlashed: 0, gapFill: true, gapFillReason: 'Missing in Mirage; user instructed missing players get 0 in all fields.' },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Not Played / Missing', result: 'LOSS', kills: 0, deaths: 0, assists: 0, mvps: 0, score: 0, hsPercent: 0, adr: 0, utilityDamage: 0, enemyFlashed: 0, gapFill: true, gapFillReason: 'Missing in Mirage; user instructed missing players get 0 in all fields.' },

      { name: 'Voldemort', team: 'Counter-Terrorists', result: 'WIN', kills: 11, deaths: 14, assists: 6, mvps: 0, score: 25, hsPercent: 71, adr: 49, utilityDamage: 151, enemyFlashed: 0, gapFill: true, gapFillReason: 'K/D/A gap-filled from Voldemort average on Dust II, Ancient, Inferno; advanced stats/score visible.' },
    ],
  },
  {
    date: '2026-08-19',
    matchDayTitle: 'War Wednesday - Aug 19, 2026',
    map: 'Inferno',
    teamAScore: 13,
    teamBScore: 8,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Counter-Terrorists',
    rows: [
      { name: 'DT', team: 'Counter-Terrorists', result: 'WIN', kills: 29, deaths: 12, assists: 11, mvps: 2, score: 94, hsPercent: 34, adr: 131, utilityDamage: 63, enemyFlashed: 5 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Counter-Terrorists', result: 'WIN', kills: 24, deaths: 14, assists: 5, mvps: 2, score: 74, hsPercent: 29, adr: 102, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Radha', team: 'Counter-Terrorists', result: 'WIN', kills: 20, deaths: 14, assists: 7, mvps: 2, score: 70, hsPercent: 50, adr: 105, utilityDamage: 0, enemyFlashed: 6 },
      { name: 'amansanghvi1', team: 'Counter-Terrorists', result: 'WIN', kills: 24, deaths: 14, assists: 6, mvps: 1, score: 68, hsPercent: 29, adr: 116, utilityDamage: 137, enemyFlashed: 1 },
      { name: 'DrKush', team: 'Counter-Terrorists', result: 'WIN', kills: 16, deaths: 19, assists: 4, mvps: 0, score: 56, hsPercent: 12, adr: 75, utilityDamage: 60, enemyFlashed: 8 },
      { name: 'GULLU', team: 'Counter-Terrorists', result: 'WIN', kills: 15, deaths: 13, assists: 7, mvps: 1, score: 54, hsPercent: 13, adr: 84, utilityDamage: 67, enemyFlashed: 3 },
      { name: 'Daa', team: 'Counter-Terrorists', result: 'WIN', kills: 9, deaths: 17, assists: 3, mvps: 1, score: 34, hsPercent: 22, adr: 47, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Counter-Terrorists', result: 'WIN', kills: 6, deaths: 19, assists: 10, mvps: 0, score: 33, hsPercent: 33, adr: 51, utilityDamage: 267, enemyFlashed: 5 },

      { name: 'MAVERICK', team: 'Terrorists', result: 'LOSS', kills: 19, deaths: 19, assists: 8, mvps: 0, score: 63, hsPercent: 47, adr: 114, utilityDamage: 184, enemyFlashed: 7 },
      { name: 'Jin', team: 'Terrorists', result: 'LOSS', kills: 19, deaths: 18, assists: 6, mvps: 1, score: 61, hsPercent: 38, adr: 96, utilityDamage: 115, enemyFlashed: 6 },
      { name: 'IB', team: 'Terrorists', result: 'LOSS', kills: 20, deaths: 16, assists: 4, mvps: 1, score: 57, hsPercent: 65, adr: 102, utilityDamage: 336, enemyFlashed: 1 },
      { name: 'VPS', team: 'Terrorists', result: 'LOSS', kills: 16, deaths: 19, assists: 6, mvps: 1, score: 54, hsPercent: 31, adr: 86, utilityDamage: 143, enemyFlashed: 0 },
      { name: 'Manson', team: 'Terrorists', result: 'LOSS', kills: 17, deaths: 16, assists: 2, mvps: 1, score: 53, hsPercent: 35, adr: 79, utilityDamage: 26, enemyFlashed: 4 },
      { name: 'thomas', team: 'Terrorists', result: 'LOSS', kills: 13, deaths: 18, assists: 9, mvps: 1, score: 53, hsPercent: 53, adr: 71, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Terrorists', result: 'LOSS', kills: 10, deaths: 20, assists: 6, mvps: 0, score: 41, hsPercent: 0, adr: 57, utilityDamage: 13, enemyFlashed: 15 },
      { name: 'Voldemort', team: 'Terrorists', result: 'LOSS', kills: 8, deaths: 17, assists: 5, mvps: 0, score: 27, hsPercent: 25, adr: 47, utilityDamage: 171, enemyFlashed: 2 },
    ],
  },
];

export const knifeEvents = [
  // Add known knife events here if your importer supports them.
];

