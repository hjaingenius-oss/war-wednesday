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

export function normalizeResult(result: unknown): MatchResult {
  const value = String(result ?? '').toUpperCase();
  if (value === 'WIN') return 'WIN';
  if (value === 'DRAW') return 'DRAW';
  if (value === 'LOSS') return 'LOSS';
  return 'LOSS';
}

export function getResultPoints(result: MatchResult): number {
  if (result === 'WIN') return 5;
  if (result === 'DRAW') return 3;
  return 1;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function safeRatio(value: number, averageValue: number) {
  const safeValue = safeNumber(value);
  const safeAverage = safeNumber(averageValue);
  if (safeAverage <= 0) return 1;
  return safeValue / safeAverage;
}

export function normalizeWeights(weights: Record<string, number>, availableKeys: string[]) {
  const total = availableKeys.reduce((sum, key) => sum + (weights[key] || 0), 0);
  if (total <= 0) return weights;

  return Object.fromEntries(
    availableKeys.map((key) => [key, (weights[key] || 0) / total])
  );
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
