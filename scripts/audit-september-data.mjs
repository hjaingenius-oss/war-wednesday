import { september2026KnifeEvents, september2026Matches } from '../src/data/september-2026-matchdays.ts';

const errors = [];
const expectedGames = [
  ['2026-09-02', 'Mirage', 13],
  ['2026-09-02', 'Inferno', 16],
  ['2026-09-02', 'Dust II', 16],
  ['2026-09-02', 'Ancient', 15],
  ['2026-09-10', 'Inferno', 16],
  ['2026-09-10', 'Dust II', 16],
  ['2026-09-10', 'Ancient', 16],
  ['2026-09-10', 'Mirage', 16],
];
const canonical = (name) => {
  const value = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (value === 'san') return 'ib';
  if (value === 'stormbreaker') return 'aks289';
  if (value === 'dangerboy' || value === 'dangerboye') return 'dangerboy';
  if (value === 'django' || value === 'mrdjango') return 'mrdjango';
  if (value === 'thomas') return 'thomas';
  return value;
};

if (september2026Matches.length !== expectedGames.length) errors.push(`Expected 8 games, found ${september2026Matches.length}.`);
let rowCount = 0;
const statusCounts = new Map();
for (let index = 0; index < september2026Matches.length; index += 1) {
  const match = september2026Matches[index];
  const [date, map, rows] = expectedGames[index] || [];
  if (match.date !== date || match.map !== map) errors.push(`Game ${index + 1}: expected ${date} ${map}, found ${match.date} ${match.map}.`);
  if (match.rows.length !== rows) errors.push(`${match.date} ${match.map}: expected ${rows} rows, found ${match.rows.length}.`);
  const expectedWinner = match.teamAScore === match.teamBScore ? 'Draw' : match.teamAScore > match.teamBScore ? match.teamAName : match.teamBName;
  if (match.winningTeam !== expectedWinner) errors.push(`${match.date} ${match.map}: winning team conflicts with scoreline.`);
  const seen = new Set();
  for (const row of match.rows) {
    rowCount += 1;
    statusCounts.set(row.dataStatus, (statusCounts.get(row.dataStatus) || 0) + 1);
    const player = canonical(row.name);
    if (seen.has(player)) errors.push(`${match.date} ${match.map}: duplicate canonical player ${row.name}.`);
    seen.add(player);
    for (const field of ['kills', 'deaths', 'assists', 'mvps', 'scoreboardScore']) {
      if (!Number.isFinite(row[field]) || row[field] < 0) errors.push(`${match.date} ${match.map} / ${row.name}: invalid ${field}.`);
    }
    for (const field of ['hsPercent', 'adr', 'utilityDamage', 'enemyFlashed']) {
      if (row[field] !== null && (!Number.isFinite(row[field]) || row[field] < 0)) errors.push(`${match.date} ${match.map} / ${row.name}: invalid ${field}.`);
    }
    if (row.hsPercent !== null && row.hsPercent > 100) errors.push(`${match.date} ${match.map} / ${row.name}: HS% exceeds 100.`);
    const expectedResult = match.winningTeam === 'Draw' ? 'DRAW' : row.team === match.winningTeam ? 'WIN' : 'LOSS';
    if (row.result !== expectedResult) errors.push(`${match.date} ${match.map} / ${row.name}: ${row.result} conflicts with ${expectedResult}.`);
  }
}

if (rowCount !== 124) errors.push(`Expected 124 appearances, found ${rowCount}.`);
for (const [status, expected] of [['Raw', 121], ['Partial', 1], ['Imputed', 1], ['AbsentZero', 1]]) {
  if (statusCounts.get(status) !== expected) errors.push(`Expected ${expected} ${status} row(s), found ${statusCounts.get(status) || 0}.`);
}
const knifeCount = september2026KnifeEvents.reduce((sum, event) => sum + event.count, 0);
if (knifeCount !== 5) errors.push(`Expected 5 knife events, found ${knifeCount}.`);
if (september2026KnifeEvents.some((event) => event.map !== 'Dust II')) errors.push('Unspecified knife events must use the Dust II fallback anchor.');

if (errors.length) {
  console.error('September data audit failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Audited 124 player appearances across 8 September games.');
console.log('Preserved 1 partial row, 1 imputed row, 1 absence penalty, and 5 knife events.');
console.log('September data audit passed.');
