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

export function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateFinalCsScore(scoreboardScore: unknown, topScore: unknown, result: MatchResult) {
  const rawScore = Math.max(0, safeNumber(scoreboardScore));
  const highestScore = Math.max(0, safeNumber(topScore));
  if (highestScore <= 0) return result === 'WIN' ? 5 : 0;
  const scaledScore = (rawScore / highestScore) * 100;
  return Number((scaledScore + (result === 'WIN' ? 5 : 0)).toFixed(2));
}

export function deriveAdr(damage: number, rounds: number) {
  const safeDamage = safeNumber(damage);
  const safeRounds = Math.max(1, safeNumber(rounds));
  if (safeDamage <= 0) return 0;
  return safeDamage / safeRounds;
}

export function weightedAverage(values: Array<{ value: number; weight: number }>) {
  let totalValue = 0;
  let totalWeight = 0;
  for (const item of values) {
    const safeWeight = safeNumber(item.weight);
    if (safeWeight <= 0) continue;
    totalValue += safeNumber(item.value) * safeWeight;
    totalWeight += safeWeight;
  }
  return totalWeight > 0 ? totalValue / totalWeight : 0;
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
