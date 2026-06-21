import type { MatchPlayer, MatchResult } from '../types';

export function resultPoints(result: MatchResult) {
  if (result === 'WIN') return 5;
  if (result === 'DRAW') return 3;
  return 1;
}

export function calculatePoints(row: Pick<MatchPlayer, 'result'|'kills'|'assists'|'deaths'|'mvps'>) {
  const damagePart = safeNumber((row as MatchPlayer).damage) ? safeNumber((row as MatchPlayer).damage) / 250 : 0;
  return resultPoints(row.result) + safeNumber(row.kills) + safeNumber(row.assists) * 0.5 - safeNumber(row.deaths) * 0.5 + damagePart;
}

type ScoreInput = {
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  headshotPercentage?: number;
  utilityDamage?: number;
  enemyFlashed?: number;
  mvps?: number;
  result: MatchResult;
  teamRoundsWon: number;
  enemyRoundsWon: number;
  enemyTeamSize?: number;
};

export function normalizeResult(result: unknown): MatchResult {
  const value = String(result ?? '').toUpperCase();
  if (value === 'WIN') return 'WIN';
  if (value === 'DRAW') return 'DRAW';
  if (value === 'LOSS') return 'LOSS';
  return 'LOSS';
}

export function getResultPoints(result: MatchResult): number {
  if (result === 'WIN') return 2;
  if (result === 'DRAW') return 1.5;
  return 1;
}

export function calculateMatchScore(input: ScoreInput): number {
  const kills = safeNumber(input.kills);
  const deaths = safeNumber(input.deaths);
  const assists = safeNumber(input.assists);
  const damage = safeNumber(input.damage);
  const headshotPercentage = safeNumber(input.headshotPercentage ?? 0);
  const utilityDamage = safeNumber(input.utilityDamage ?? 0);
  const enemyFlashed = safeNumber(input.enemyFlashed ?? 0);
  const mvps = safeNumber(input.mvps ?? 0);
  const result = normalizeResult(input.result);
  const teamRoundsWon = safeNumber(input.teamRoundsWon);
  const enemyRoundsWon = safeNumber(input.enemyRoundsWon);
  const roundsPlayed = Math.max(1, teamRoundsWon + enemyRoundsWon);
  const enemyTeamSize = Math.max(1, safeNumber(input.enemyTeamSize ?? 5));

  const baseScore = 3;
  const standardRounds = 21;
  const teamSizeAdjustment = 5 / enemyTeamSize;
  const headshotKills = kills * (headshotPercentage / 100);
  const utilityBonus = Math.min(5, utilityDamage / 100);
  const flashBonus = Math.min(4, enemyFlashed / 5);

  const rawCombat =
    damage / 120 +
    kills * 1.2 +
    assists * 0.4 -
    deaths * 0.25 +
    headshotKills * 0.15 +
    mvps * 0.75 +
    utilityBonus +
    flashBonus;

  const standardizedCombat = (rawCombat / roundsPlayed) * standardRounds * teamSizeAdjustment;
  const score = baseScore + standardizedCombat + getResultPoints(result);
  return Number(Math.max(1, score).toFixed(2));
}

export function safeKD(kills: number, deaths: number) {
  const safeKills = safeNumber(kills);
  const safeDeaths = safeNumber(deaths);
  if (safeDeaths <= 0) return safeKills;
  return Number((safeKills / safeDeaths).toFixed(2));
}

export function safeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
