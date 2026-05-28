import type { KnifeEvent, Match, MatchDay, MatchPlayer, Player } from './types';
import { safeKD, safeNumber } from './lib/scoring';

export type PlayerCategory = 'Regular' | 'Impact Player' | 'Cameo' | 'Inactive';

export interface PlayerLeaderboardRow {
  playerId: number;
  name: string;
  category: PlayerCategory;
  comparisonBadge: string;
  wouldRank?: number;
  smallSample: boolean;
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

export function calculateTotalPointsForMatch(row: Pick<MatchPlayer, 'result' | 'kills' | 'assists' | 'deaths'>) {
  const resultPoints = row.result === 'WIN' ? 10 : row.result === 'DRAW' ? 5 : 2;
  return resultPoints + safeNumber(row.kills) + safeNumber(row.assists) * 0.5 - safeNumber(row.deaths) * 0.5;
}

export function calculateMatchValue(row: Pick<MatchPlayer, 'result' | 'kills' | 'assists' | 'deaths'>) {
  const kills = safeNumber(row.kills);
  const deaths = safeNumber(row.deaths);
  const assists = safeNumber(row.assists);
  const kd = safeKD(kills, deaths);
  const combatScore = kills + assists * 0.5 - deaths * 0.7;
  const resultBonus = row.result === 'WIN' ? 8 : row.result === 'DRAW' ? 4 : 0;
  const kdBonus = kd >= 2 ? 6 : kd >= 1.5 ? 4 : kd >= 1 ? 2 : 0;
  const killMilestoneBonus = kills >= 30 ? 10 : kills >= 20 ? 5 : kills >= 10 ? 2 : 0;
  return 50 + combatScore + resultBonus + kdBonus + killMilestoneBonus;
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
  const byPlayer = new Map<number, Map<number, number[]>>();

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
    values.push(calculateMatchValue(row));
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
  return average(scores.slice(0, 3).map((s) => s.score));
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
  const baseRows = players.map((player) => buildPlayerRow(
    player,
    windowRows,
    windowKnifeEvents,
    matchdayScores.get(player.id || 0) || [],
    windowMatchDays
  ));

  const prelimRegulars = baseRows.filter((r) => r.matchdaysPlayed > 0 && (r.attendanceRate >= 0.5 || r.matchdaysPlayed >= 5));
  const regularMedianWarRating = median(prelimRegulars.map((r) => r.warRating));

  const classified = baseRows.map((row) => ({
    ...row,
    category: classifyPlayer(row.attendanceRate, row.matchdaysPlayed, row.warRating, regularMedianWarRating)
  }));

  const regulars = classified.filter((r) => r.category === 'Regular').sort(sortMainBoard);
  const withBadges = classified.map((row) => {
    const badge = calculateComparisonBadge(row, regulars, regularMedianWarRating);
    const wouldRank = row.category === 'Regular' || row.category === 'Inactive'
      ? undefined
      : regulars.filter((r) => r.warRating > row.warRating).length + 1;
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

export function sortMainBoard(a: PlayerLeaderboardRow, b: PlayerLeaderboardRow) {
  return b.warRating - a.warRating ||
    b.formRating - a.formRating ||
    b.kd - a.kd ||
    b.winPct - a.winPct ||
    b.totalPoints - a.totalPoints ||
    b.kills - a.kills;
}

export function sortImpactBoard(a: PlayerLeaderboardRow, b: PlayerLeaderboardRow) {
  return b.warRating - a.warRating ||
    b.formRating - a.formRating ||
    b.kd - a.kd ||
    b.matchdaysPlayed - a.matchdaysPlayed;
}

function buildPlayerRow(
  player: Player,
  rows: MatchPlayer[],
  knifeEvents: KnifeEvent[],
  matchdayScores: PlayerLeaderboardRow['matchdayScores'],
  windowMatchDays: MatchDay[]
): PlayerLeaderboardRow {
  const playerRows = player.id ? rows.filter((r) => r.playerId === player.id) : [];
  const kills = sum(playerRows.map((r) => safeNumber(r.kills)));
  const deaths = sum(playerRows.map((r) => safeNumber(r.deaths)));
  const assists = sum(playerRows.map((r) => safeNumber(r.assists)));
  const totalPoints = sum(playerRows.map(calculateTotalPointsForMatch));
  const wins = playerRows.filter((r) => r.result === 'WIN').length;
  const losses = playerRows.filter((r) => r.result === 'LOSS').length;
  const draws = playerRows.filter((r) => r.result === 'DRAW').length;
  const matchesPlayed = playerRows.length;
  const matchdaysPlayed = matchdayScores.length;
  const attendanceRate = calculateAttendanceRate(matchdaysPlayed, windowMatchDays.length);
  const weightedAverage = calculateWeightedAverageMatchdayScore(matchdayScores, windowMatchDays);
  const warRating = calculateWarRating(weightedAverage, attendanceRate, matchdaysPlayed);
  const formRating = calculateFormRating(matchdayScores);
  const knifeKills = player.id ? knifeEvents.filter((e) => e.attackerPlayerId === player.id).length : 0;
  const knifeDeaths = player.id ? knifeEvents.filter((e) => e.victimPlayerId === player.id).length : 0;

  return {
    playerId: player.id || 0,
    name: player.name,
    category: 'Inactive',
    comparisonBadge: '',
    smallSample: matchdaysPlayed > 0 && matchdaysPlayed < 3,
    warRating,
    formRating,
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
    knifeKills,
    knifeDeaths,
    games10PlusKills: playerRows.filter((r) => safeNumber(r.kills) >= 10).length,
    games20PlusKills: playerRows.filter((r) => safeNumber(r.kills) >= 20).length,
    games30PlusKills: playerRows.filter((r) => safeNumber(r.kills) >= 30).length,
    kd: safeKD(kills, deaths),
    avgPoints: matchesPlayed ? totalPoints / matchesPlayed : 0,
    bestMatchValue: playerRows.length ? Math.max(...playerRows.map(calculateMatchValue)) : 0,
    matchdayScores
  };
}

function compareMatchesDesc(a: Match, b: Match) {
  const dateCompare = b.date.localeCompare(a.date);
  if (dateCompare !== 0) return dateCompare;
  return (b.id || 0) - (a.id || 0);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + safeNumber(value), 0);
}

function average(values: number[]) {
  const clean = values.map(safeNumber).filter((n) => Number.isFinite(n));
  return clean.length ? sum(clean) / clean.length : 0;
}

function median(values: number[]) {
  const clean = values.map(safeNumber).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!clean.length) return undefined;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}
