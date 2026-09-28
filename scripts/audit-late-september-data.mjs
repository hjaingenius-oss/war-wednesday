import { lateSeptember2026KnifeEvents, lateSeptember2026Matches } from '../src/data/september-16-23-2026-matchdays.ts';

const errors = [];
const canonical = (name) => {
  const value = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (value === 'san' || value === 'sanmomos') return 'ib';
  if (value === 'stormbreaker') return 'aks289';
  if (value === 'amansanghvi1' || value === 'amansanghv1') return 'aman';
  if (value === 'django' || value === 'mrdjango') return 'mrdjango';
  if (value === 'bangbang') return 'bangbang';
  return value;
};

if (lateSeptember2026Matches.length !== 8) errors.push(`Expected 8 games, found ${lateSeptember2026Matches.length}.`);
let rowCount = 0;
let absentCount = 0;
let partialCount = 0;
for (const match of lateSeptember2026Matches) {
  if (match.rows.length !== 14) errors.push(`${match.date} ${match.map}: expected 14 rows, found ${match.rows.length}.`);
  const expectedWinner = match.teamAScore === match.teamBScore ? 'Draw' : match.teamAScore > match.teamBScore ? match.teamAName : match.teamBName;
  if (match.winningTeam !== expectedWinner) errors.push(`${match.date} ${match.map}: winner conflicts with scoreline.`);
  const seen = new Set();
  for (const row of match.rows) {
    rowCount += 1;
    if (row.dataStatus === 'AbsentZero') absentCount += 1;
    if (row.dataStatus === 'Partial') partialCount += 1;
    const player = canonical(row.name);
    if (seen.has(player)) errors.push(`${match.date} ${match.map}: duplicate canonical player ${row.name}.`);
    seen.add(player);
    for (const field of ['kills', 'deaths', 'assists', 'mvps', 'scoreboardScore']) {
      if (!Number.isFinite(row[field]) || row[field] < 0) errors.push(`${match.date} ${match.map} / ${row.name}: invalid ${field}.`);
    }
    for (const field of ['hsPercent', 'adr', 'utilityDamage', 'enemyFlashed']) {
      if (row[field] !== null && (!Number.isFinite(row[field]) || row[field] < 0)) errors.push(`${match.date} ${match.map} / ${row.name}: invalid ${field}.`);
    }
    const expectedResult = match.winningTeam === 'Draw' ? 'DRAW' : row.team === match.winningTeam ? 'WIN' : 'LOSS';
    if (row.result !== expectedResult) errors.push(`${match.date} ${match.map} / ${row.name}: result conflicts with scoreline.`);
    if (row.dataStatus === 'AbsentZero' && [row.kills, row.deaths, row.assists, row.mvps, row.scoreboardScore].some((value) => value !== 0)) {
      errors.push(`${match.date} ${match.map} / ${row.name}: logout penalty must remain zero.`);
    }
  }
}

if (rowCount !== 112) errors.push(`Expected 112 appearances, found ${rowCount}.`);
if (absentCount !== 2) errors.push(`Expected 2 Django logout penalties, found ${absentCount}.`);
if (partialCount !== 1) errors.push(`Expected 1 missing-advanced-stat row, found ${partialCount}.`);
const knifeCount = lateSeptember2026KnifeEvents.reduce((sum, event) => sum + event.count, 0);
if (knifeCount !== 4) errors.push(`Expected 4 knife events, found ${knifeCount}.`);
if (lateSeptember2026KnifeEvents.some((event) => event.map !== 'Dust II')) errors.push('Unspecified knife events must use the Dust II fallback anchor.');

if (errors.length) {
  console.error('Late September data audit failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Audited 112 player appearances across 8 late-September games.');
console.log('Preserved 2 Django logout penalties, 1 missing-advanced-stat row, and 4 knife events.');
console.log('Late September data audit passed.');
