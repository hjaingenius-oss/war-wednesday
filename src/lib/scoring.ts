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
