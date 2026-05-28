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

export type FunAwardKey =
  | 'assistHero'
  | 'assassin'
  | 'knifeArtist'
  | 'knifeVictim'
  | 'wildcard'
  | 'consistentPerformer';

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
}

export interface FunAwardsResult {
  awards: FunAwardWinner[];
  mapSpecialists: MapSpecialistWinner[];
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
  const matchById = new Map(windowMatches.map((m) => [m.id, m]));
  const boardByPlayer = new Map(leaderboardRows.map((r) => [r.playerId, r]));
  const nameOf = (id: number) => players.find((p) => p.id === id)?.name || 'Unknown';

  for (const row of windowRows) {
    const playerRows = rowsByPlayer.get(row.playerId) || [];
    playerRows.push(row);
    rowsByPlayer.set(row.playerId, playerRows);
  }

  const active = leaderboardRows.filter((r) => r.matchesPlayed > 0);
  const regulars = leaderboardRows.filter((r) => r.category === 'Regular');
  const regularMedianWar = median(regulars.map((r) => r.warRating));
  const eligibleCore = active.filter((r) => r.matchdaysPlayed >= 3 || r.category === 'Regular');
  const eligibleWildcard = active.filter((r) => r.matchdaysPlayed >= 3);
  const eligibleConsistent = active.filter(
    (r) => r.matchdaysPlayed >= 3 && regularMedianWar !== undefined && r.warRating >= regularMedianWar
  );

  const awardWinners: FunAwardWinner[] = [];
  const addAward = (award?: FunAwardWinner) => {
    if (award) awardWinners.push(award);
  };

  const assistHero = pickBest(
    eligibleCore,
    (r) => (r.matchesPlayed ? r.assists / r.matchesPlayed : 0),
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
    (r) => (r.matchesPlayed ? r.kills / r.matchesPlayed : 0),
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
    const mapName = match?.map?.trim();
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
        if (mapAppearances < 3) return null;
        const mapMatchValueAverage = average(mapRows.map(calculateMatchValue));
        const sampleMultiplier = mapAppearances >= 5 ? 1 : mapAppearances === 4 ? 0.95 : 0.9;
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
      label: `${mapName} Specialist`,
      tooltip: 'Owns this map.',
      playerId: winner.playerId,
      playerName: nameOf(winner.playerId),
      stat: `${fmt1(winner.mapMatchValueAverage)} MV avg (${winner.mapAppearances} matches)`
    });
  }

  mapSpecialists.sort((a, b) => a.map.localeCompare(b.map));

  return {
    awards: awardWinners,
    mapSpecialists
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

function standardDeviation(values: number[]) {
  if (!values.length) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => {
    const diff = v - mean;
    return diff * diff;
  }));
  return Math.sqrt(variance);
}
