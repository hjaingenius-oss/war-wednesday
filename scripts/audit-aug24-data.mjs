import fs from 'node:fs';
import ts from 'typescript';

const sourcePath = new URL('../src/data/august-24-2026-matchday.ts', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');
const sourceFile = ts.createSourceFile('august-24-2026-matchday.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function evaluate(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate);
  if (ts.isObjectLiteralExpression(node)) {
    const result = {};
    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) result[property.name.text || property.name.getText(sourceFile)] = evaluate(property.initializer);
    }
    return result;
  }
  return undefined;
}

let matches;
for (const statement of sourceFile.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && declaration.name.text === 'importedMatches') matches = evaluate(declaration.initializer);
  }
}

const errors = [];
const expectedMaps = ['Inferno', 'Dust II', 'Ancient', 'Mirage'];
const canonical = (name) => {
  const value = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (value === 'san') return 'ib';
  if (value === 'aks') return 'aks289';
  if (value === 'dangerboy' || value === 'dangerboye') return 'dangerboy';
  if (value === 'rochakkedia' || value === 'rocketkedia') return 'rocketkedia';
  return value;
};

if (!Array.isArray(matches) || matches.length !== 4) errors.push(`Expected 4 games, found ${Array.isArray(matches) ? matches.length : 0}.`);
let rows = 0;
for (let index = 0; index < (matches || []).length; index += 1) {
  const match = matches[index];
  if (match.date !== '2026-08-24') errors.push(`Game ${index + 1}: expected date 2026-08-24, found ${match.date}.`);
  if (match.map !== expectedMaps[index]) errors.push(`Game ${index + 1}: expected ${expectedMaps[index]}, found ${match.map}.`);
  if (!Number.isFinite(match.teamAScore) || !Number.isFinite(match.teamBScore) || match.teamAScore + match.teamBScore <= 0) errors.push(`Game ${index + 1}: invalid scoreline.`);
  const seen = new Set();
  for (const row of match.rows || []) {
    rows += 1;
    const player = canonical(row.name);
    if (seen.has(player)) errors.push(`Game ${index + 1}: duplicate canonical player ${row.name}.`);
    seen.add(player);
    for (const field of ['kills', 'deaths', 'assists', 'mvps', 'score', 'hsPercent', 'adr', 'utilityDamage', 'enemyFlashed']) {
      if (!Number.isFinite(row[field]) || row[field] < 0) errors.push(`Game ${index + 1} / ${row.name}: invalid ${field}.`);
    }
    if (row.hsPercent > 100) errors.push(`Game ${index + 1} / ${row.name}: HS% exceeds 100.`);
    const expectedResult = match.winningTeam === 'Draw' ? 'DRAW' : row.team === match.winningTeam ? 'WIN' : 'LOSS';
    if (row.result !== expectedResult) errors.push(`Game ${index + 1} / ${row.name}: ${row.result} conflicts with ${match.winningTeam}.`);
    const calculatedKd = row.kills / Math.max(1, row.deaths);
    if (Math.abs(row.kd - calculatedKd) > 0.08) errors.push(`Game ${index + 1} / ${row.name}: K/D ${row.kd} conflicts with ${row.kills}/${row.deaths}.`);
  }
  if (seen.size !== 16) errors.push(`Game ${index + 1}: expected 16 players, found ${seen.size}.`);
}

if (rows !== 64) errors.push(`Expected 64 player appearances, found ${rows}.`);
if (errors.length) {
  console.error('August 24 data audit failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Audited 64 player appearances across 4 August 24 games.');
console.log('Validated scorelines, results, aliases, K/D values, and advanced-stat ranges.');
console.log('August 24 data audit passed.');
