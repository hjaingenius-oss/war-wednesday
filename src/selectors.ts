import type { KnifeEvent, Match, MatchDay, MatchPlayer, Player } from './types';
import { average, deriveAdr, normalizeResult, normalizeWeights, safeKD, safeNumber, safeRatio, weightedAverage } from './lib/scoring';

const SCORING = {
  halfLifeDays: 21,
  performanceWeights: {
    adr: 0.38,
    kills: 0.27,
    survival: 0.13,
    assists: 0.10,
    utilityDamage: 0.05,
    enemyFlashed: 0.04,
    mvps: 0.03
  },
  baseScoreMean: 50,
  resultBonus: {
    WIN: 3,
    DRAW: 1,
    LOSS: 0
  },
  marginMultiplier: 0.15,
  teamCarryDivisor: 15,
  leaderboardWeights: {
    form: 0.75,
    seasonAvg: 0.25
  },
  optionalMetricAvailabilityThreshold: 0.5,
  fallbackAdrBaseline: 75,
  scoringVersion: 'friends-league-v4-performance-index-missing-safe'
} as const;

export type PlayerCategory = 'Regular' | 'Impact Player' | 'Cameo' | 'Inactive';

export interface PlayerLeaderboardRow {
  playerId: number;
  name: string;
  category: PlayerCategory;
  comparisonBadge: string;
  wouldRank?: number;
  smallSample: boolean;
  rankScore: number;
  formScore: number;
  seasonAvg: number;
  matchScoreAvg: number;
  computedScoreTotal: number;
  warRating: number;
  formRating: number;
  totalPoints: number;
  attendanceRate: number;
  matchdaysPlayed: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winPct: number;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  headshotKills: number;
  utilityDamage: number;
  enemyFlashed: number;
  damagePerGame: number;
  headshotKillsPerGame: number;
  utilityDamagePerGame: number;
  enemyFlashedPerGame: number;
  knifeKills: number;
  knifeDeaths: number;
  games10PlusKills: number;
  games20PlusKills: number;
  games30PlusKills: number;
  kd: number;
  avgPoints: number;
  bestMatchValue: number;
  matchdayScores: Array<{ matchDayId: number; title: string; date: string; score: number }>;
}

export type FunAwardKey =
  | 'assistHero'
  | 'assassin'
  | 'sharpshooter'
  | 'knifeArtist'
  | 'knifeVictim'
  | 'survivor'
  | 'wildcard'
  | 'consistentPerformer'
  | 'firestarter'
  | 'bomber'
  | 'flashKiller'
  | 'flasher';

export interface FunAwardWinner {
  key: FunAwardKey;
  label: string;
  tooltip: string;
  playerId: number;
  playerName: string;
  stat: string;
}

export interface MapSpecialistWinner {
  map: string;
  label: string;
  tooltip: string;
  playerId: number;
  playerName: string;
  stat: string;
  appearances: number;
  dominanceScore: number;
  kd: number;
  winPct: number;
}

export interface FunAwardsResult {
  awards: FunAwardWinner[];
  mapSpecialists: MapSpecialistWinner[];
}

type MatchScoreBreakdown = {
  playerId: number;
  matchId: number;
  score: number;
  computedScore: number;
  baseScore: number;
  performanceRatio: number;
  resultBonus: number;
  marginBonus: number;
  teamCarryBonus: number;
  adr: number;
  adrForScoring: number;
  kpr: number;
  dpr: number;
  apr: number;
  date: string;
  team: string;
  damageDataQuality: 'actual' | 'estimated';
  utilityDataQuality: 'actual' | 'missing_neutral' | 'missing_unavailable';
  flashDataQuality: 'actual' | 'missing_neutral' | 'missing_unavailable';
  mvpDataQuality: 'actual' | 'missing_neutral' | 'missing_unavailable';
};

function hasRealDamageValue(row: Pick<MatchPlayer, 'damage'>) {
  return row.damage !== undefined && row.damage !== null && Number.isFinite(Number(row.damage)) && Number(row.damage) > 0;
}

function hasRealUtilityValue(row: Pick<MatchPlayer, 'utilityDamage'>) {
  return row.utilityDamage !== undefined && row.utilityDamage !== null && Number.isFinite(Number(row.utilityDamage));
}

function hasRealFlashValue(row: Pick<MatchPlayer, 'enemyFlashed'>) {
  return row.enemyFlashed !== undefined && row.enemyFlashed !== null && Number.isFinite(Number(row.enemyFlashed));
}

function hasRealMvpValue(row: Pick<MatchPlayer, 'mvps'>) {
  return row.mvps !== undefined && row.mvps !== null && Number.isFinite(Number(row.mvps));
}

function getRowTeamSlot(match: Pick<Match, 'teamAName' | 'teamBName'>, row: Pick<MatchPlayer, 'team'>) {
  if (row.team && row.team === match.teamBName) return 'B';
  if (row.team && row.team === match.teamAName) return 'A';
  return 'A';
}

export function calculateMatchScoresForMatch(match: Match, rows: MatchPlayer[]): MatchScoreBreakdown[] {
  const rounds = Math.max(1, safeNumber(match.teamAScore) + safeNumber(match.teamBScore));
  const coreStats = rows.map((row) => ({
    row,
    kpr: safeNumber(row.kills) / rounds,
    dpr: safeNumber(row.deaths) / rounds,
    apr: safeNumber(row.assists) / rounds
  }));

  const actualDamageRows = rows.filter((row) => hasRealDamageValue(row));
  const actualDamageAdrs = actualDamageRows.map((row) => deriveAdr(safeNumber(row.damage), rounds));
  const lobbyAvgAdrFromActualDamage = actualDamageAdrs.length ? average(actualDamageAdrs) : SCORING.fallbackAdrBaseline;

  const avgKPR = average(coreStats.map((item) => item.kpr));
  const avgDPR = average(coreStats.map((item) => item.dpr));
  const avgAPR = average(coreStats.map((item) => item.apr));

  const utilityAvailable = rows.filter((row) => hasRealUtilityValue(row)).length / Math.max(1, rows.length) >= SCORING.optionalMetricAvailabilityThreshold;
  const flashAvailable = rows.filter((row) => hasRealFlashValue(row)).length / Math.max(1, rows.length) >= SCORING.optionalMetricAvailabilityThreshold;
  const mvpAvailable = rows.filter((row) => hasRealMvpValue(row)).length / Math.max(1, rows.length) >= SCORING.optionalMetricAvailabilityThreshold;

  const averages = {
    adr: average(rows.map((row) => (
      hasRealDamageValue(row)
        ? deriveAdr(safeNumber(row.damage), rounds)
        : lobbyAvgAdrFromActualDamage * (
          0.7 * safeRatio(safeNumber(row.kills) / rounds, avgKPR) +
          0.2 * safeRatio(avgDPR, safeNumber(row.deaths) / rounds) +
          0.1 * safeRatio(safeNumber(row.assists) / rounds, avgAPR)
        )
    ))),
    kpr: average(coreStats.map((item) => item.kpr)),
    dpr: average(coreStats.map((item) => item.dpr)),
    apr: average(coreStats.map((item) => item.apr)),
    udr: utilityAvailable ? average(rows.filter((row) => hasRealUtilityValue(row)).map((row) => safeNumber(row.utilityDamage) / rounds)) : 0,
    efr: flashAvailable ? average(rows.filter((row) => hasRealFlashValue(row)).map((row) => safeNumber(row.enemyFlashed) / rounds)) : 0,
    mvpr: mvpAvailable ? average(rows.filter((row) => hasRealMvpValue(row)).map((row) => safeNumber(row.mvps) / rounds)) : 0
  };

  const prelim = coreStats.map((item) => {
    const row = item.row;
    const hasDamage = hasRealDamageValue(row);
    const adrForScoring = hasDamage
      ? deriveAdr(safeNumber(row.damage), rounds)
      : lobbyAvgAdrFromActualDamage * (
        0.7 * safeRatio(item.kpr, avgKPR) +
        0.2 * safeRatio(avgDPR, item.dpr) +
        0.1 * safeRatio(item.apr, avgAPR)
      );
    const damageDataQuality: MatchScoreBreakdown['damageDataQuality'] = hasDamage ? 'actual' : 'estimated';

    const utilityReal = utilityAvailable && hasRealUtilityValue(row);
    const flashReal = flashAvailable && hasRealFlashValue(row);
    const mvpReal = mvpAvailable && hasRealMvpValue(row);
    const utilityDataQuality: MatchScoreBreakdown['utilityDataQuality'] = utilityAvailable ? (utilityReal ? 'actual' : 'missing_neutral') : 'missing_unavailable';
    const flashDataQuality: MatchScoreBreakdown['flashDataQuality'] = flashAvailable ? (flashReal ? 'actual' : 'missing_neutral') : 'missing_unavailable';
    const mvpDataQuality: MatchScoreBreakdown['mvpDataQuality'] = mvpAvailable ? (mvpReal ? 'actual' : 'missing_neutral') : 'missing_unavailable';

    const utilityRatio = utilityAvailable ? (utilityReal ? safeRatio(safeNumber(row.utilityDamage) / rounds, averages.udr) : 1) : undefined;
    const flashRatio = flashAvailable ? (flashReal ? safeRatio(safeNumber(row.enemyFlashed) / rounds, averages.efr) : 1) : undefined;
    const mvpRatio = mvpAvailable ? (mvpReal ? safeRatio(safeNumber(row.mvps) / rounds, averages.mvpr) : 1) : undefined;

    const availableWeights = normalizeWeights(SCORING.performanceWeights, [
      'adr',
      'kills',
      'survival',
      'assists',
      ...(utilityAvailable ? ['utilityDamage'] : []),
      ...(flashAvailable ? ['enemyFlashed'] : []),
      ...(mvpAvailable ? ['mvps'] : [])
    ]);

    const performanceRatio =
      (availableWeights.adr || 0) * safeRatio(adrForScoring, averages.adr) +
      (availableWeights.kills || 0) * safeRatio(item.kpr, averages.kpr) +
      (availableWeights.survival || 0) * safeRatio(averages.dpr, item.dpr) +
      (availableWeights.assists || 0) * safeRatio(item.apr, averages.apr) +
      (availableWeights.utilityDamage || 0) * (utilityRatio ?? 0) +
      (availableWeights.enemyFlashed || 0) * (flashRatio ?? 0) +
      (availableWeights.mvps || 0) * (mvpRatio ?? 0);

    return {
      row,
      adrForScoring,
      kpr: item.kpr,
      dpr: item.dpr,
      apr: item.apr,
      damageDataQuality,
      utilityDataQuality,
      flashDataQuality,
      mvpDataQuality,
      performanceRatio,
      baseScore: SCORING.baseScoreMean * performanceRatio
    };
  });

  const teamAverages = new Map<string, number>();
  for (const team of [...new Set(rows.map((row) => row.team || 'Unknown'))]) {
    const teamBaseScores = prelim.filter((item) => (item.row.team || 'Unknown') === team).map((item) => item.baseScore);
    teamAverages.set(team || 'Unknown', average(teamBaseScores));
  }

  const scoreMap = new Map<number, MatchScoreBreakdown>();
  for (const item of prelim) {
    const teamSlot = getRowTeamSlot(match, item.row);
    const teamRoundsWon = teamSlot === 'B' ? safeNumber(match.teamBScore) : safeNumber(match.teamAScore);
    const enemyRoundsWon = teamSlot === 'B' ? safeNumber(match.teamAScore) : safeNumber(match.teamBScore);
    const result = normalizeResult(item.row.result);
    const resultBonus = result === 'WIN' ? SCORING.resultBonus.WIN : result === 'DRAW' ? SCORING.resultBonus.DRAW : SCORING.resultBonus.LOSS;
    const margin = teamRoundsWon - enemyRoundsWon;
    const marginBonus = margin * SCORING.marginMultiplier;
    const teamKey = item.row.team || 'Unknown';
    const teamCarryBonus = (item.baseScore - (teamAverages.get(teamKey) || 0)) / SCORING.teamCarryDivisor;
    const computedScore = item.baseScore + resultBonus + marginBonus + teamCarryBonus;
    scoreMap.set(item.row.playerId, {
      playerId: item.row.playerId,
      matchId: match.id || 0,
      score: computedScore,
      computedScore,
      baseScore: item.baseScore,
      performanceRatio: item.performanceRatio,
      resultBonus,
      marginBonus,
      teamCarryBonus,
      adr: item.adrForScoring,
      adrForScoring: item.adrForScoring,
      kpr: item.kpr,
      dpr: item.dpr,
      apr: item.apr,
      date: match.date,
      team: teamKey,
      damageDataQuality: item.damageDataQuality,
      utilityDataQuality: item.utilityDataQuality,
      flashDataQuality: item.flashDataQuality,
      mvpDataQuality: item.mvpDataQuality
    });
  }

  return [...scoreMap.values()];
}

export function calculateTotalPointsForMatch(row: Pick<MatchPlayer, 'result' | 'kills' | 'assists' | 'deaths'>) {
  const resultPoints = row.result === 'WIN' ? 5 : row.result === 'DRAW' ? 3 : 1;
  const damagePart = safeNumber((row as MatchPlayer).damage) ? safeNumber((row as MatchPlayer).damage) / 250 : 0;
  return resultPoints + safeNumber(row.kills) + safeNumber(row.assists) * 0.5 - safeNumber(row.deaths) * 0.5 + damagePart;
}

export function calculateMatchValue(
  row: Pick<MatchPlayer, 'result' | 'kills' | 'deaths' | 'assists' | 'damage' | 'hsPercent' | 'utilityDamage' | 'enemyFlashed' | 'playerId'>,
  match?: Pick<Match, 'teamAScore' | 'teamBScore' | 'teamAName' | 'teamBName'>,
  matchRows: Array<Pick<MatchPlayer, 'result' | 'kills' | 'assists' | 'deaths' | 'playerId' | 'team' | 'mvps'>> = []
) {
  if (!match) return 0;
  const matchScores = calculateMatchScoresForMatch(match as Match, matchRows as MatchPlayer[]);
  return matchScores.find((item) => item.playerId === row.playerId)?.score || 0;
}

export function getMatchWindow(matches: Match[], filter: string) {
  const sorted = [...matches].sort(compareMatchesDesc);
  if (filter === 'last10') return sorted.slice(0, 10);
  if (filter === 'last20') return sorted.slice(0, 20);
  return sorted;
}

export function filterRowsByMatchWindow(rows: MatchPlayer[], matches: Match[], filter: string) {
  const ids = new Set(getMatchWindow(matches, filter).map((m) => m.id));
  return rows.filter((r) => ids.has(r.matchId));
}

export function filterKnifeEventsByMatchWindow(events: KnifeEvent[], matches: Match[], filter: string) {
  const ids = new Set(getMatchWindow(matches, filter).map((m) => m.id));
  return events.filter((e) => ids.has(e.matchId));
}

export function calculateMatchdayScores(
  players: Player[],
  matchDays: MatchDay[],
  matches: Match[],
  rows: MatchPlayer[]
) {
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const matchDayById = new Map(matchDays.map((d) => [d.id, d]));
  const rowsByMatchId = new Map<number, MatchPlayer[]>();
  const byPlayer = new Map<number, Map<number, number[]>>();
  for (const row of rows) {
    const arr = rowsByMatchId.get(row.matchId) || [];
    arr.push(row);
    rowsByMatchId.set(row.matchId, arr);
  }

  for (const player of players) {
    if (player.id) byPlayer.set(player.id, new Map());
  }

  for (const row of rows) {
    const match = matchById.get(row.matchId);
    const matchDayId = match?.matchDayId;
    if (!matchDayId || !matchDayById.has(matchDayId)) continue;
    if (!byPlayer.has(row.playerId)) byPlayer.set(row.playerId, new Map());
    const playerDays = byPlayer.get(row.playerId)!;
    const values = playerDays.get(matchDayId) || [];
    values.push(calculateMatchValue(row, match, rowsByMatchId.get(row.matchId) || []));
    playerDays.set(matchDayId, values);
  }

  const result = new Map<number, PlayerLeaderboardRow['matchdayScores']>();
  for (const [playerId, dayMap] of byPlayer.entries()) {
    const scores = [...dayMap.entries()].map(([matchDayId, values]) => {
      const day = matchDayById.get(matchDayId);
      return {
        matchDayId,
        title: day?.title || 'Matchday',
        date: day?.eventDate || '',
        score: average(values)
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
    result.set(playerId, scores);
  }
  return result;
}

export function calculateWeightedAverageMatchdayScore(
  scores: PlayerLeaderboardRow['matchdayScores'],
  sortedWindowMatchDays: MatchDay[]
) {
  const weights = new Map<number, number>();
  sortedWindowMatchDays.forEach((day, index) => {
    if (!day.id) return;
    weights.set(day.id, index === 0 ? 1 : index === 1 ? 0.9 : index === 2 ? 0.8 : index === 3 ? 0.7 : 0.6);
  });

  let weighted = 0;
  let totalWeight = 0;
  for (const score of scores) {
    const weight = weights.get(score.matchDayId);
    if (!weight) continue;
    weighted += score.score * weight;
    totalWeight += weight;
  }
  return totalWeight ? weighted / totalWeight : 0;
}

export function calculateFormScore(matchScores: Array<{ score: number; date: string }>) {
  if (!matchScores.length) return 0;
  const latest = [...matchScores].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const weights = [0.9, 0.07, 0.03];
  return weightedAverage(latest.map((entry, index) => ({
    value: entry.score,
    weight: weights[index] || 0
  })));
}

export function calculateSeasonScore(matchdayScores: number[]) {
  const scores = matchdayScores
    .slice(0, 10)
    .map((score) => safeNumber(score));

  if (!scores.length) return 0;

  const weightedItems: Array<{ value: number; weight: number }> = [];

  for (let i = 0; i < Math.min(4, scores.length); i++) {
    weightedItems.push({
      value: scores[i],
      weight: [0.30, 0.25, 0.20, 0.15][i] || 0
    });
  }

  const tailScores = scores.slice(4, 10);
  if (tailScores.length > 0) {
    const rawTailWeights = tailScores.map((_, index) => 0.5 ** (index / 2));
    const rawTailTotal = rawTailWeights.reduce((sum, weight) => sum + weight, 0);

    tailScores.forEach((score, index) => {
      weightedItems.push({
        value: score,
        weight: rawTailTotal > 0 ? 0.10 * (rawTailWeights[index] / rawTailTotal) : 0
      });
    });
  }

  const totalWeight = weightedItems.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;

  return weightedItems.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

export function calculateSeasonAvg(matchScores: Array<{ score: number }>) {
  return average(matchScores.map((entry) => entry.score));
}

export function calculateAttendanceRate(playerMatchdaysPlayed: number, totalMatchdays: number) {
  return totalMatchdays ? playerMatchdaysPlayed / totalMatchdays : 0;
}

export function calculateWarRating(weightedAverageMatchdayScore: number, attendanceRate: number, playerMatchdaysPlayed: number) {
  const attendanceMultiplier =
    attendanceRate >= 0.8 ? 1 :
    attendanceRate >= 0.6 ? 0.97 :
    attendanceRate >= 0.4 ? 0.92 :
    attendanceRate >= 0.25 ? 0.85 :
    0.7;
  const reliabilityBonus = Math.min(playerMatchdaysPlayed * 0.75, 6);
  return weightedAverageMatchdayScore * attendanceMultiplier + reliabilityBonus;
}

export function calculateFormRating(scores: PlayerLeaderboardRow['matchdayScores']) {
  const latest = [...scores].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return weightedAverage(latest.map((s, index) => ({
    value: s.score,
    weight: [0.9, 0.07, 0.03][index] || 0
  })));
}

export function classifyPlayer(
  attendanceRate: number,
  playerMatchdaysPlayed: number,
  warRating: number,
  regularMedianWarRating?: number
): PlayerCategory {
  if (playerMatchdaysPlayed === 0) return 'Inactive';
  if (attendanceRate >= 0.5 || playerMatchdaysPlayed >= 5) return 'Regular';
  if (
    regularMedianWarRating !== undefined &&
    attendanceRate >= 0.25 &&
    attendanceRate < 0.5 &&
    warRating >= regularMedianWarRating
  ) return 'Impact Player';
  return 'Cameo';
}

export function calculateComparisonBadge(
  row: Pick<PlayerLeaderboardRow, 'category' | 'attendanceRate' | 'warRating'>,
  regulars: PlayerLeaderboardRow[],
  regularMedianWarRating?: number
) {
  if (row.category === 'Regular' || row.category === 'Inactive') return '';
  const wouldRank = regulars.filter((r) => r.warRating > row.warRating).length + 1;
  if (regulars.length && wouldRank === 1) return 'Would Rank #1';
  if (regulars.length && wouldRank <= 3) return 'Would Rank Top 3';
  const highWar = regularMedianWarRating !== undefined ? row.warRating >= regularMedianWarRating : row.warRating >= 75;
  if (row.attendanceRate < 0.25 && highWar) return 'Elite Small Sample';
  return 'Needs More Games';
}

function buildMatchScoreHistory(matches: Match[], rows: MatchPlayer[]) {
  const byMatch = new Map<number, MatchPlayer[]>();
  for (const row of rows) {
    const arr = byMatch.get(row.matchId) || [];
    arr.push(row);
    byMatch.set(row.matchId, arr);
  }

  const byPlayer = new Map<number, Array<{ score: number; date: string; matchId: number }>>();
  for (const match of matches) {
    const matchRows = byMatch.get(match.id || 0) || [];
    if (!matchRows.length) continue;
    const matchScores = calculateMatchScoresForMatch(match, matchRows);
    for (const item of matchScores) {
      const arr = byPlayer.get(item.playerId) || [];
      arr.push({ score: item.score, date: match.date, matchId: match.id || 0 });
      byPlayer.set(item.playerId, arr);
    }
  }

  return byPlayer;
}

export function buildLeaderboardRows(
  players: Player[],
  matchDays: MatchDay[],
  matches: Match[],
  rows: MatchPlayer[],
  knifeEvents: KnifeEvent[],
  filter = 'all'
) {
  const windowMatches = getMatchWindow(matches, filter);
  const windowMatchIds = new Set(windowMatches.map((m) => m.id));
  const windowRows = rows.filter((r) => windowMatchIds.has(r.matchId));
  const windowKnifeEvents = knifeEvents.filter((e) => windowMatchIds.has(e.matchId));
  const windowMatchDayIds = new Set(windowMatches.map((m) => m.matchDayId).filter(Boolean));
  const windowMatchDays = matchDays
    .filter((d) => d.id && windowMatchDayIds.has(d.id))
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  const matchdayScores = calculateMatchdayScores(players, windowMatchDays, windowMatches, windowRows);
  const allHistory = buildMatchScoreHistory(matches, rows);
  const windowHistory = buildMatchScoreHistory(windowMatches, windowRows);
  const baseRows = players.map((player) => {
    const playerId = player.id || 0;
    return buildPlayerRow(
      player,
      windowRows,
      windowKnifeEvents,
      matchdayScores.get(playerId) || [],
      windowMatchDays,
      allHistory.get(playerId) || [],
      windowHistory.get(playerId) || []
    );
  });

  const prelimRegulars = baseRows.filter((r) => r.matchdaysPlayed > 0 && (r.attendanceRate >= 0.5 || r.matchdaysPlayed >= 5));
  const regularMedianWarRating = median(prelimRegulars.map((r) => r.rankScore));

  const classified = baseRows.map((row) => ({
    ...row,
    category: classifyPlayer(row.attendanceRate, row.matchdaysPlayed, row.rankScore, regularMedianWarRating)
  }));

  const regulars = classified.filter((r) => r.category === 'Regular').sort(sortMainBoard);
  const withBadges = classified.map((row) => {
    const badge = calculateComparisonBadge({ category: row.category, attendanceRate: row.attendanceRate, warRating: row.rankScore }, regulars, regularMedianWarRating);
    const wouldRank = row.category === 'Regular' || row.category === 'Inactive'
      ? undefined
      : regulars.filter((r) => r.rankScore > row.rankScore).length + 1;
    return { ...row, comparisonBadge: badge, wouldRank };
  });

  return {
    allRows: withBadges,
    mainRows: withBadges.filter((r) => r.category === 'Regular').sort(sortMainBoard),
    impactRows: withBadges.filter((r) => r.category === 'Impact Player' || r.category === 'Cameo').sort(sortImpactBoard),
    inactiveRows: withBadges.filter((r) => r.category === 'Inactive'),
    totalMatchdays: windowMatchDays.length,
    selectedMatches: windowMatches
  };
}

export function buildFunAwards(
  players: Player[],
  rows: MatchPlayer[],
  matches: Match[],
  leaderboardRows: PlayerLeaderboardRow[],
  filter = 'all'
): FunAwardsResult {
  const windowMatches = getMatchWindow(matches, filter);
  const windowMatchIds = new Set(windowMatches.map((m) => m.id));
  const windowRows = rows.filter((r) => windowMatchIds.has(r.matchId));
  const rowsByPlayer = new Map<number, MatchPlayer[]>();
  const rowsByMatchId = new Map<number, MatchPlayer[]>();
  const matchById = new Map(windowMatches.map((m) => [m.id, m]));
  const boardByPlayer = new Map(leaderboardRows.map((r) => [r.playerId, r]));
  const nameOf = (id: number) => players.find((p) => p.id === id)?.name || 'Unknown';

  for (const row of windowRows) {
    const playerRows = rowsByPlayer.get(row.playerId) || [];
    playerRows.push(row);
    rowsByPlayer.set(row.playerId, playerRows);
    const byMatch = rowsByMatchId.get(row.matchId) || [];
    byMatch.push(row);
    rowsByMatchId.set(row.matchId, byMatch);
  }

  const active = leaderboardRows.filter((r) => r.matchesPlayed > 0);
  const regulars = leaderboardRows.filter((r) => r.category === 'Regular');
  const regularMedianWar = median(regulars.map((r) => r.warRating));
  const eligibleCore = active.filter((r) => r.matchdaysPlayed >= 3 || r.category === 'Regular');
  const eligibleWildcard = active.filter((r) => r.matchdaysPlayed >= 3);
  const eligibleConsistent = active.filter(
    (r) => r.matchdaysPlayed >= 3 && regularMedianWar !== undefined && r.warRating >= regularMedianWar
  );
  const hasUtilityDamage = windowRows.some((r) => safeNumber((r as MatchPlayer).utilityDamage) > 0);
  const hasEnemyFlashed = windowRows.some((r) => safeNumber((r as MatchPlayer).enemyFlashed) > 0);
  const playerWarLiteAvg = (playerId: number) => {
    const pr = rowsByPlayer.get(playerId) || [];
    return average(pr.map((x) => calculateMatchValue(x, matchById.get(x.matchId), rowsByMatchId.get(x.matchId) || [])));
  };

  const awardWinners: FunAwardWinner[] = [];
  const addAward = (award?: FunAwardWinner) => {
    if (award) awardWinners.push(award);
  };

  const recentGamesByPlayer = new Map<number, MatchPlayer[]>();
  for (const player of active) {
    const playerRows = (rowsByPlayer.get(player.playerId) || [])
      .slice()
      .sort((a, b) => {
        const am = matchById.get(a.matchId);
        const bm = matchById.get(b.matchId);
        const ad = am?.date || '';
        const bd = bm?.date || '';
        return bd.localeCompare(ad) || (safeNumber(b.matchId) - safeNumber(a.matchId));
      })
      .slice(0, 5);
    recentGamesByPlayer.set(player.playerId, playerRows);
  }

  const assistHero = pickBest(
    eligibleCore,
    (r) => {
      const pr = rowsByPlayer.get(r.playerId) || [];
      const rounds = sum(pr.map((x) => safeNumber(matchById.get(x.matchId)?.teamAScore) + safeNumber(matchById.get(x.matchId)?.teamBScore)));
      return rounds > 0 ? r.assists / rounds : (r.matchesPlayed ? r.assists / r.matchesPlayed : 0);
    },
    [
      (r) => r.assists,
      (r) => r.warRating,
      (r) => r.matchesPlayed
    ]
  );
  addAward(assistHero && {
    key: 'assistHero',
    label: 'Assist Hero',
    tooltip: 'Making everyone else look good.',
    playerId: assistHero.playerId,
    playerName: assistHero.name,
    stat: `${fmt1(assistHero.assists / Math.max(1, assistHero.matchesPlayed))} assists/match`
  });

  const assassin = pickBest(
    eligibleCore,
    (r) => {
      const pr = rowsByPlayer.get(r.playerId) || [];
      const rounds = sum(pr.map((x) => safeNumber(matchById.get(x.matchId)?.teamAScore) + safeNumber(matchById.get(x.matchId)?.teamBScore)));
      return rounds > 0 ? r.kills / rounds : (r.matchesPlayed ? r.kills / r.matchesPlayed : 0);
    },
    [
      (r) => r.kills,
      (r) => r.kd,
      (r) => r.warRating
    ]
  );
  addAward(assassin && {
    key: 'assassin',
    label: 'Assassin',
    tooltip: 'Highest kill rate in the lobby.',
    playerId: assassin.playerId,
    playerName: assassin.name,
    stat: `${fmt1(assassin.kills / Math.max(1, assassin.matchesPlayed))} kills/match`
  });

  if (hasUtilityDamage) {
    const firestarter = pickBest(
      eligibleCore,
      (r) => r.utilityDamagePerGame,
      [
        (r) => r.utilityDamage,
        (r) => r.warRating,
        (r) => r.matchesPlayed
      ]
    );
    addAward(firestarter && {
      key: 'bomber',
      label: 'Bomber',
      tooltip: 'Highest utility damage per game.',
      playerId: firestarter.playerId,
      playerName: firestarter.name,
      stat: `${fmt1(firestarter.utilityDamagePerGame)} utility dmg/game`
    });
  }

  if (hasEnemyFlashed) {
    const flashKiller = pickBest(
      eligibleCore,
      (r) => r.enemyFlashedPerGame,
      [
        (r) => r.enemyFlashed,
        (r) => r.warRating,
        (r) => r.matchesPlayed
      ]
    );
    addAward(flashKiller && {
      key: 'flasher',
      label: 'Flasher',
      tooltip: 'Highest enemies flashed per game.',
      playerId: flashKiller.playerId,
      playerName: flashKiller.name,
      stat: `${fmt1(flashKiller.enemyFlashedPerGame)} enemies flashed/game`
    });
  }

  const sharpshooterPool = eligibleCore.filter((r) => (recentGamesByPlayer.get(r.playerId) || []).length >= 3);
  const sharpshooter = pickBest(
    sharpshooterPool,
    (r) => {
      const recentGames = recentGamesByPlayer.get(r.playerId) || [];
      return average(recentGames.map((x) => safeNumber(x.kills) * (safeNumber((x as MatchPlayer).hsPercent) / 100)));
    },
    [
      (r) => {
        const recentGames = recentGamesByPlayer.get(r.playerId) || [];
        return sum(recentGames.map((x) => safeNumber(x.kills) * (safeNumber((x as MatchPlayer).hsPercent) / 100)));
      },
      (r) => r.warRating,
      (r) => r.matchesPlayed
    ]
  );
  addAward(sharpshooter && {
    key: 'sharpshooter',
    label: 'Sharpshooter',
    tooltip: 'Most deadly headshot impact in recent games.',
    playerId: sharpshooter.playerId,
    playerName: sharpshooter.name,
    stat: (() => {
      const recentGames = recentGamesByPlayer.get(sharpshooter.playerId) || [];
      const avgHsKills = average(recentGames.map((x) => safeNumber(x.kills) * (safeNumber((x as MatchPlayer).hsPercent) / 100)));
      return `${fmt1(avgHsKills)} headshot kills/game (last ${recentGames.length})`;
    })()
  });

  const knifeArtist = pickBest(
    active,
    (r) => r.knifeKills,
    [
      (r) => (r.matchesPlayed ? r.knifeKills / r.matchesPlayed : 0),
      (r) => r.warRating
    ]
  );
  addAward(knifeArtist && {
    key: 'knifeArtist',
    label: 'Knife Artist',
    tooltip: 'Brings a knife to a gunfight and somehow wins.',
    playerId: knifeArtist.playerId,
    playerName: knifeArtist.name,
    stat: `${knifeArtist.knifeKills} knife kills`
  });

  const knifeVictim = pickBest(
    active,
    (r) => r.knifeDeaths,
    [
      (r) => (r.matchesPlayed ? r.knifeDeaths / r.matchesPlayed : 0),
      (r) => -r.kd
    ]
  );
  addAward(knifeVictim && {
    key: 'knifeVictim',
    label: 'Knife Victim',
    tooltip: 'Check corners. Please.',
    playerId: knifeVictim.playerId,
    playerName: knifeVictim.name,
    stat: `${knifeVictim.knifeDeaths} times knifed`
  });

  const survivorPool = active.filter((r) => r.matchdaysPlayed >= 3 || r.category === 'Regular');
  const survivor = pickBest(
    survivorPool,
    (r) => {
      const pr = rowsByPlayer.get(r.playerId) || [];
      const rounds = sum(pr.map((x) => safeNumber(matchById.get(x.matchId)?.teamAScore) + safeNumber(matchById.get(x.matchId)?.teamBScore)));
      if (rounds <= 0) return -Infinity;
      return -(r.deaths / rounds);
    },
    [
      (r) => playerWarLiteAvg(r.playerId),
      (r) => r.attendanceRate,
      (r) => {
        const pr = rowsByPlayer.get(r.playerId) || [];
        return sum(pr.map((x) => safeNumber(matchById.get(x.matchId)?.teamAScore) + safeNumber(matchById.get(x.matchId)?.teamBScore)));
      }
    ]
  );
  addAward(survivor && {
    key: 'survivor',
    label: 'Survivor',
    tooltip: 'Hardest player to remove from the server.',
    playerId: survivor.playerId,
    playerName: survivor.name,
    stat: (() => {
      const pr = rowsByPlayer.get(survivor.playerId) || [];
      const totalRounds = Math.max(1, sum(pr.map((x) => safeNumber(matchById.get(x.matchId)?.teamAScore) + safeNumber(matchById.get(x.matchId)?.teamBScore))));
      const notKilledPct = Math.max(0, (1 - (survivor.deaths / totalRounds)) * 100);
      return `not killed in ${fmt1(notKilledPct)}% of rounds`;
    })()
  });

  const wildcard = pickBest(
    eligibleWildcard,
    (r) => standardDeviation(r.matchdayScores.map((s) => s.score)),
    [
      (r) => Math.max(...r.matchdayScores.map((s) => s.score)),
      (r) => r.warRating
    ]
  );
  addAward(wildcard && {
    key: 'wildcard',
    label: 'Wildcard',
    tooltip: 'Could carry. Could disappear.',
    playerId: wildcard.playerId,
    playerName: wildcard.name,
    stat: `SD ${fmt1(standardDeviation(wildcard.matchdayScores.map((s) => s.score)))}`
  });

  const consistentPerformer = pickBest(
    eligibleConsistent,
    (r) => -standardDeviation(r.matchdayScores.map((s) => s.score)),
    [
      (r) => r.warRating,
      (r) => r.formRating,
      (r) => r.attendanceRate
    ]
  );
  addAward(consistentPerformer && {
    key: 'consistentPerformer',
    label: 'Consistent Performer',
    tooltip: 'Reliable every matchday.',
    playerId: consistentPerformer.playerId,
    playerName: consistentPerformer.name,
    stat: `SD ${fmt1(standardDeviation(consistentPerformer.matchdayScores.map((s) => s.score)))}`
  });

  const mapGroups = new Map<string, Map<number, MatchPlayer[]>>();
  for (const row of windowRows) {
    const match = matchById.get(row.matchId);
    const mapName = normalizeMapName(match?.map || '');
    if (!mapName) continue;
    if (!mapGroups.has(mapName)) mapGroups.set(mapName, new Map());
    const playerMap = mapGroups.get(mapName)!;
    const arr = playerMap.get(row.playerId) || [];
    arr.push(row);
    playerMap.set(row.playerId, arr);
  }

  const mapSpecialists: MapSpecialistWinner[] = [];
  for (const [mapName, playerMap] of mapGroups.entries()) {
    const candidates = [...playerMap.entries()]
      .map(([playerId, mapRows]) => {
        const mapAppearances = mapRows.length;
        if (mapAppearances < 4) return null;
        const mapMatchValueAverage = average(mapRows.map((r) => calculateMatchValue(r, matchById.get(r.matchId), mapRows)));
        const sampleMultiplier = mapAppearances >= 5 ? 1 : 0.95;
        const mapDominanceScore = mapMatchValueAverage * sampleMultiplier;
        const wins = mapRows.filter((r) => r.result === 'WIN').length;
        const winPct = mapAppearances ? (wins / mapAppearances) * 100 : 0;
        const kills = sum(mapRows.map((r) => r.kills));
        const deaths = sum(mapRows.map((r) => r.deaths));
        return {
          playerId,
          mapAppearances,
          mapMatchValueAverage,
          mapDominanceScore,
          winPct,
          kd: safeKD(kills, deaths),
          warRating: boardByPlayer.get(playerId)?.warRating || 0
        };
      })
      .filter(Boolean) as Array<{
      playerId: number;
      mapAppearances: number;
      mapMatchValueAverage: number;
      mapDominanceScore: number;
      winPct: number;
      kd: number;
      warRating: number;
    }>;
    if (!candidates.length) continue;
    candidates.sort((a, b) =>
      b.mapDominanceScore - a.mapDominanceScore ||
      b.mapMatchValueAverage - a.mapMatchValueAverage ||
      b.winPct - a.winPct ||
      b.kd - a.kd ||
      b.warRating - a.warRating
    );
    const winner = candidates[0];
    mapSpecialists.push({
      map: mapName,
      label: `${mapName} King`,
      tooltip: 'Owns this map.',
      playerId: winner.playerId,
      playerName: nameOf(winner.playerId),
      stat: `${fmt1(winner.mapMatchValueAverage)} Score avg`,
      appearances: winner.mapAppearances,
      dominanceScore: winner.mapDominanceScore,
      kd: winner.kd,
      winPct: winner.winPct
    });
  }

  mapSpecialists.sort((a, b) => a.map.localeCompare(b.map));

  return {
    awards: awardWinners,
    mapSpecialists
  };
}

export function sortMainBoard(a: PlayerLeaderboardRow, b: PlayerLeaderboardRow) {
  return b.rankScore - a.rankScore ||
    b.formScore - a.formScore ||
    b.kd - a.kd ||
    b.winPct - a.winPct ||
    b.computedScoreTotal - a.computedScoreTotal ||
    b.kills - a.kills;
}

export function sortImpactBoard(a: PlayerLeaderboardRow, b: PlayerLeaderboardRow) {
  return b.rankScore - a.rankScore ||
    b.formScore - a.formScore ||
    b.kd - a.kd ||
    b.matchdaysPlayed - a.matchdaysPlayed;
}

function buildPlayerRow(
  player: Player,
  rows: MatchPlayer[],
  knifeEvents: KnifeEvent[],
  matchdayScores: PlayerLeaderboardRow['matchdayScores'],
  windowMatchDays: MatchDay[],
  allMatchScores: Array<{ score: number; date: string; matchId: number }>,
  windowMatchScores: Array<{ score: number; date: string; matchId: number }>
): PlayerLeaderboardRow {
  const playerRows = player.id ? rows.filter((r) => r.playerId === player.id) : [];
  const kills = sum(playerRows.map((r) => safeNumber(r.kills)));
  const deaths = sum(playerRows.map((r) => safeNumber(r.deaths)));
  const assists = sum(playerRows.map((r) => safeNumber(r.assists)));
  const damage = sum(playerRows.map((r) => safeNumber((r as MatchPlayer).damage)));
  const headshotKills = sum(playerRows.map((r) => safeNumber(r.kills) * (safeNumber((r as MatchPlayer).hsPercent) / 100)));
  const utilityDamage = sum(playerRows.map((r) => safeNumber((r as MatchPlayer).utilityDamage)));
  const enemyFlashed = sum(playerRows.map((r) => safeNumber((r as MatchPlayer).enemyFlashed)));
  const damageGames = playerRows.filter((r) => r.damage !== undefined && r.damage !== null).length;
  const hsGames = playerRows.filter((r) => r.hsPercent !== undefined && r.hsPercent !== null).length;
  const utilityDamageGames = playerRows.filter((r) => (r as MatchPlayer).utilityDamage !== undefined && (r as MatchPlayer).utilityDamage !== null).length;
  const enemyFlashedGames = playerRows.filter((r) => (r as MatchPlayer).enemyFlashed !== undefined && (r as MatchPlayer).enemyFlashed !== null).length;
  const totalPoints = sum(playerRows.map(calculateTotalPointsForMatch));
  const wins = playerRows.filter((r) => r.result === 'WIN').length;
  const losses = playerRows.filter((r) => r.result === 'LOSS').length;
  const draws = playerRows.filter((r) => r.result === 'DRAW').length;
  const matchesPlayed = playerRows.length;
  const matchdaysPlayed = matchdayScores.length;
  const attendanceRate = calculateAttendanceRate(matchdaysPlayed, windowMatchDays.length);
  const matchScoreAvg = calculateSeasonAvg(windowMatchScores);
  const computedScoreTotal = sum(windowMatchScores.map((entry) => entry.score));
  const seasonAvg = calculateSeasonScore(matchdayScores.map((entry) => entry.score));
  const formScore = calculateFormRating(matchdayScores);
  const rankScore = 0.65 * formScore + 0.35 * seasonAvg;
  const knifeKills = player.id ? knifeEvents.filter((e) => e.attackerPlayerId === player.id).length : 0;
  const knifeDeaths = player.id ? knifeEvents.filter((e) => e.victimPlayerId === player.id).length : 0;

  return {
    playerId: player.id || 0,
    name: player.name,
    category: 'Inactive',
    comparisonBadge: '',
    smallSample: matchdaysPlayed > 0 && matchdaysPlayed < 3,
    rankScore,
    formScore,
    seasonAvg,
    matchScoreAvg,
    computedScoreTotal,
    warRating: rankScore,
    formRating: formScore,
    totalPoints,
    attendanceRate,
    matchdaysPlayed,
    matchesPlayed,
    wins,
    losses,
    draws,
    winPct: matchesPlayed ? (wins / matchesPlayed) * 100 : 0,
    kills,
    deaths,
    assists,
    damage,
    headshotKills,
    utilityDamage,
    enemyFlashed,
    damagePerGame: damageGames ? damage / damageGames : 0,
    headshotKillsPerGame: hsGames ? headshotKills / hsGames : 0,
    utilityDamagePerGame: utilityDamageGames ? utilityDamage / utilityDamageGames : 0,
    enemyFlashedPerGame: enemyFlashedGames ? enemyFlashed / enemyFlashedGames : 0,
    knifeKills,
    knifeDeaths,
    games10PlusKills: playerRows.filter((r) => safeNumber(r.kills) >= 10).length,
    games20PlusKills: playerRows.filter((r) => safeNumber(r.kills) >= 20).length,
    games30PlusKills: playerRows.filter((r) => safeNumber(r.kills) >= 30).length,
    kd: safeKD(kills, deaths),
    avgPoints: matchesPlayed ? totalPoints / matchesPlayed : 0,
    bestMatchValue: allMatchScores.length ? Math.max(...allMatchScores.map((entry) => entry.score)) : 0,
    matchdayScores
  };
}

function compareMatchesDesc(a: Match, b: Match) {
  const dateCompare = b.date.localeCompare(a.date);
  if (dateCompare !== 0) return dateCompare;
  return (b.id || 0) - (a.id || 0);
}

export function normalizeMapName(map: string) {
  const clean = (map || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean) return 'Unknown';
  if (clean === 'dust2' || clean === 'dust ii' || clean === 'dust 2') return 'Dust II';
  if (clean === 'mirage') return 'Mirage';
  if (clean === 'inferno') return 'Inferno';
  if (clean === 'ancient') return 'Ancient';
  if (clean === 'anubis') return 'Anubis';
  if (clean === 'nuke') return 'Nuke';
  if (clean === 'vertigo') return 'Vertigo';
  if (clean === 'overpass') return 'Overpass';
  return map.trim() || 'Unknown';
}

export function generateMatchDisplayIds(matches: Match[]) {
  const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date) || (a.id || 0) - (b.id || 0));
  const sequenceByMap = new Map<string, number>();
  const result = new Map<number, string>();
  for (const match of sorted) {
    if (!match.id) continue;
    const mapName = normalizeMapName(match.map);
    const sequence = (sequenceByMap.get(mapName) || 0) + 1;
    sequenceByMap.set(mapName, sequence);
    result.set(match.id, `${mapName} ${sequence}`);
  }
  return result;
}

export function getMatchDisplayId(matchId: number | undefined, matchDisplayIds: Map<number, string>) {
  if (!matchId) return 'Unknown Match';
  return matchDisplayIds.get(matchId) || 'Unknown Match';
}

export function getKnifeBoard(players: Player[], knifeEvents: KnifeEvent[], matchDisplayIds: Map<number, string>) {
  const playerNameById = new Map(players.map((p) => [p.id, p.name]));
  const nameOf = (id: number) => playerNameById.get(id) || 'Unknown';
  const attackerVictim = new Map<string, { attackerId: number; victimId: number; count: number }>();
  for (const event of knifeEvents) {
    const key = `${event.attackerPlayerId}-${event.victimPlayerId}`;
    const curr = attackerVictim.get(key);
    attackerVictim.set(key, {
      attackerId: event.attackerPlayerId,
      victimId: event.victimPlayerId,
      count: (curr?.count || 0) + 1
    });
  }
  const rivalry = [...attackerVictim.values()].sort((a, b) => b.count - a.count)[0];
  const latestEvent = [...knifeEvents].sort((a, b) => (b.id || 0) - (a.id || 0))[0];
  return {
    rivalryText: rivalry ? `${nameOf(rivalry.attackerId)} has knifed ${nameOf(rivalry.victimId)} ${rivalry.count} times.` : '',
    latestText: latestEvent ? `${nameOf(latestEvent.attackerPlayerId)} knifed ${nameOf(latestEvent.victimPlayerId)} in ${getMatchDisplayId(latestEvent.matchId, matchDisplayIds)}.` : '',
    rivalry,
    latestEvent
  };
}

export function getAllTimeRecords(players: Player[], rows: MatchPlayer[], matches: Match[], knifeEvents: KnifeEvent[], matchDisplayIds: Map<number, string>) {
  const playerNameById = new Map(players.map((p) => [p.id, p.name]));
  const rowsByMatchId = new Map<number, MatchPlayer[]>();
  const matchById = new Map(matches.map((m) => [m.id, m]));
  for (const row of rows) {
    const arr = rowsByMatchId.get(row.matchId) || [];
    arr.push(row);
    rowsByMatchId.set(row.matchId, arr);
  }
  const bestMatchValueRow = [...rows].sort((a, b) => calculateMatchValue(b, matchById.get(b.matchId), rowsByMatchId.get(b.matchId) || []) - calculateMatchValue(a, matchById.get(a.matchId), rowsByMatchId.get(a.matchId) || []))[0];
  const mostKillsRow = [...rows].sort((a, b) => safeNumber(b.kills) - safeNumber(a.kills))[0];
  const mostAssistsRow = [...rows].sort((a, b) => safeNumber(b.assists) - safeNumber(a.assists))[0];
  const highestDamageRow = [...rows]
    .filter((r) => safeNumber((r as MatchPlayer).damage) > 0)
    .sort((a, b) => safeNumber((b as MatchPlayer).damage) - safeNumber((a as MatchPlayer).damage))[0];
  const highestUtilityDamageRow = [...rows]
    .filter((r) => safeNumber((r as MatchPlayer).utilityDamage) > 0)
    .sort((a, b) => safeNumber((b as MatchPlayer).utilityDamage) - safeNumber((a as MatchPlayer).utilityDamage))[0];
  const mostEnemyFlashedRow = [...rows]
    .filter((r) => safeNumber((r as MatchPlayer).enemyFlashed) > 0)
    .sort((a, b) => safeNumber((b as MatchPlayer).enemyFlashed) - safeNumber((a as MatchPlayer).enemyFlashed))[0];
  const bestAdrRow = [...rows]
    .filter((r) => safeNumber((r as MatchPlayer).damage) > 0)
    .sort((a, b) => {
    const am = matchById.get(a.matchId);
    const bm = matchById.get(b.matchId);
    const ar = Math.max(1, safeNumber(am?.teamAScore) + safeNumber(am?.teamBScore));
    const br = Math.max(1, safeNumber(bm?.teamAScore) + safeNumber(bm?.teamBScore));
    return (safeNumber((b as MatchPlayer).damage) / br) - (safeNumber((a as MatchPlayer).damage) / ar);
  })[0];
  const bestKdRow = [...rows]
    .filter((r) => safeNumber(r.kills) >= 10)
    .sort((a, b) => safeKD(b.kills, b.deaths) - safeKD(a.kills, a.deaths))[0];
  const knifeArtist = players
    .map((p) => ({ playerId: p.id || 0, name: p.name, count: knifeEvents.filter((e) => e.attackerPlayerId === p.id).length }))
    .sort((a, b) => b.count - a.count)[0];
  const knifeVictim = players
    .map((p) => ({ playerId: p.id || 0, name: p.name, count: knifeEvents.filter((e) => e.victimPlayerId === p.id).length }))
    .sort((a, b) => b.count - a.count)[0];

  const withMeta = (row?: MatchPlayer) => ({
    row,
    playerName: row ? playerNameById.get(row.playerId) || 'Unknown' : '',
    matchId: row ? getMatchDisplayId(row.matchId, matchDisplayIds) : '',
    match: row ? matches.find((m) => m.id === row.matchId) : undefined
  });

  return {
    bestMatchValue: withMeta(bestMatchValueRow),
    mostKills: withMeta(mostKillsRow),
    mostAssists: withMeta(mostAssistsRow),
    highestDamage: withMeta(highestDamageRow),
    highestUtilityDamage: withMeta(highestUtilityDamageRow),
    mostEnemyFlashed: withMeta(mostEnemyFlashedRow),
    bestAdr: withMeta(bestAdrRow),
    bestKd: withMeta(bestKdRow),
    knifeArtist,
    knifeVictim
  };
}

export function getMatchdayMoments(
  players: Player[],
  rows: MatchPlayer[],
  matches: Match[],
  knifeEvents: KnifeEvent[],
  matchDisplayIds: Map<number, string>
) {
  const nameOf = (id: number) => players.find((p) => p.id === id)?.name || 'Unknown';
  const rowsByMatchId = new Map<number, MatchPlayer[]>();
  const matchById = new Map(matches.map((m) => [m.id, m]));
  for (const row of rows) {
    const arr = rowsByMatchId.get(row.matchId) || [];
    arr.push(row);
    rowsByMatchId.set(row.matchId, arr);
  }
  const recentRows = [...rows].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 12);
  const moments: string[] = [];
  const latestMatch = [...matches].sort((a, b) => b.date.localeCompare(a.date) || (b.id || 0) - (a.id || 0))[0];
  const latestMatchdayId = latestMatch?.matchDayId;
  const latestMatchdayRows = latestMatchdayId
    ? rows.filter((r) => matchById.get(r.matchId)?.matchDayId === latestMatchdayId)
    : [];
  const scopedRows = latestMatchdayRows.length ? latestMatchdayRows : recentRows;

  const topKillsRow = [...scopedRows].sort((a, b) => b.kills - a.kills)[0];
  if (topKillsRow) moments.push(`${nameOf(topKillsRow.playerId)} dropped ${topKillsRow.kills} kills in ${getMatchDisplayId(topKillsRow.matchId, matchDisplayIds)}.`);

  const topMvRow = [...scopedRows].sort((a, b) => calculateMatchValue(b, matchById.get(b.matchId), rowsByMatchId.get(b.matchId) || []) - calculateMatchValue(a, matchById.get(a.matchId), rowsByMatchId.get(a.matchId) || []))[0];
  if (topMvRow) moments.push(`${nameOf(topMvRow.playerId)} posted the best score of the night: ${fmt1(calculateMatchValue(topMvRow, matchById.get(topMvRow.matchId), rowsByMatchId.get(topMvRow.matchId) || []))} in ${getMatchDisplayId(topMvRow.matchId, matchDisplayIds)}.`);

  const topAssistRow = [...scopedRows].sort((a, b) => b.assists - a.assists)[0];
  if (topAssistRow) moments.push(`${nameOf(topAssistRow.playerId)} was Assist Hero this matchday with ${topAssistRow.assists} assists in ${getMatchDisplayId(topAssistRow.matchId, matchDisplayIds)}.`);

  const topUtilityRow = [...scopedRows]
    .filter((r) => safeNumber((r as MatchPlayer).utilityDamage) > 0)
    .sort((a, b) => safeNumber((b as MatchPlayer).utilityDamage) - safeNumber((a as MatchPlayer).utilityDamage))[0];
  if (topUtilityRow) moments.push(`${nameOf(topUtilityRow.playerId)} set the utility pace with ${Math.round(safeNumber((topUtilityRow as MatchPlayer).utilityDamage))} utility damage in ${getMatchDisplayId(topUtilityRow.matchId, matchDisplayIds)}.`);

  const topFlashRow = [...scopedRows]
    .filter((r) => safeNumber((r as MatchPlayer).enemyFlashed) > 0)
    .sort((a, b) => safeNumber((b as MatchPlayer).enemyFlashed) - safeNumber((a as MatchPlayer).enemyFlashed))[0];
  if (topFlashRow) moments.push(`${nameOf(topFlashRow.playerId)} flashed ${Math.round(safeNumber((topFlashRow as MatchPlayer).enemyFlashed))} enemies in ${getMatchDisplayId(topFlashRow.matchId, matchDisplayIds)}.`);

  const latestKnife = [...knifeEvents].sort((a, b) => (b.id || 0) - (a.id || 0))[0];
  if (latestKnife) moments.push(`${nameOf(latestKnife.attackerPlayerId)} knifed ${nameOf(latestKnife.victimPlayerId)} in ${getMatchDisplayId(latestKnife.matchId, matchDisplayIds)}.`);
  const roughRow = [...scopedRows].sort((a, b) => (b.deaths - b.kills) - (a.deaths - a.kills))[0];
  if (roughRow) moments.push(`${nameOf(roughRow.playerId)} had a rough one: ${roughRow.kills} kills and ${roughRow.deaths} deaths in ${getMatchDisplayId(roughRow.matchId, matchDisplayIds)}.`);
  return moments.slice(0, 5);
}

function fmt1(n: number) {
  return Number(n.toFixed(1));
}

function pickBest<T>(items: T[], primary: (item: T) => number, tieBreakers: Array<(item: T) => number>) {
  if (!items.length) return undefined;
  const sorted = [...items].sort((a, b) => {
    const p = primary(b) - primary(a);
    if (p !== 0) return p;
    for (const tie of tieBreakers) {
      const d = tie(b) - tie(a);
      if (d !== 0) return d;
    }
    return 0;
  });
  return sorted[0];
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + safeNumber(value), 0);
}

function median(values: number[]) {
  const clean = values.map(safeNumber).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!clean.length) return undefined;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

function standardDeviation(values: number[]) {
  if (!values.length) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => {
    const diff = v - mean;
    return diff * diff;
  }));
  return Math.sqrt(variance);
}
