import fs from 'node:fs';
import ts from 'typescript';

const sourcePath = new URL('../src/data/august-2026-matchdays.ts', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');
const sourceFile = ts.createSourceFile('august-2026-matchdays.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

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
      if (ts.isPropertyAssignment(property)) {
        result[property.name.text || property.name.getText(sourceFile)] = evaluate(property.initializer);
      }
    }
    return result;
  }
  return undefined;
}

let matches;
for (const statement of sourceFile.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && declaration.name.text === 'importedMatches') {
      matches = evaluate(declaration.initializer);
    }
  }
}

const errors = [];
const expectedMaps = ['Inferno', 'Dust II', 'Ancient', 'Mirage', 'Dust II', 'Ancient', 'Mirage', 'Inferno'];
const normalizedName = (name) => {
  const normalized = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized === 'aks') return 'aks289';
  if (normalized === 'amansanghvi1' || normalized === 'amansanghv1') return 'aman';
  if (normalized === 'dangerboy' || normalized === 'dangerboye') return 'dangerboy';
  return normalized;
};

if (!Array.isArray(matches) || matches.length !== 8) {
  errors.push(`Expected 8 games, found ${Array.isArray(matches) ? matches.length : 0}.`);
}

let validRows = 0;
let logoutPenaltyRows = 0;
let unseenAdvancedRows = 0;
let syntheticCombatRows = 0;

for (let index = 0; index < (matches || []).length; index += 1) {
  const match = matches[index];
  const expectedMap = expectedMaps[index];
  if (match.map !== expectedMap) errors.push(`Game ${index + 1}: expected ${expectedMap}, found ${match.map}.`);
  if (!Number.isFinite(match.teamAScore) || !Number.isFinite(match.teamBScore) || match.teamAScore + match.teamBScore <= 0) {
    errors.push(`Game ${index + 1}: invalid scoreline.`);
  }
  const seenPlayers = new Set();
  for (const row of match.rows || []) {
    if (row.team === 'Not Played / Missing') logoutPenaltyRows += 1;
    validRows += 1;
    const player = normalizedName(row.name);
    if (seenPlayers.has(player)) errors.push(`Game ${index + 1}: duplicate player ${row.name}.`);
    seenPlayers.add(player);
    for (const field of ['kills', 'deaths', 'assists', 'mvps', 'score']) {
      if (!Number.isFinite(row[field]) || row[field] < 0) errors.push(`Game ${index + 1} / ${row.name}: invalid ${field}.`);
    }
    const expectedResult = match.winningTeam === 'Draw'
      ? 'DRAW'
      : row.team === match.winningTeam ? 'WIN' : 'LOSS';
    if (row.result !== expectedResult) {
      errors.push(`Game ${index + 1} / ${row.name}: ${row.result} conflicts with ${match.winningTeam}.`);
    }
    const reason = String(row.gapFillReason || '').toLowerCase();
    if (reason.includes('advanced stat') && reason.includes('not visible')) unseenAdvancedRows += 1;
    if (reason.includes('k/d/a gap-filled')) syntheticCombatRows += 1;
  }
}

if (validRows !== 128) errors.push(`Expected 128 valid appearances, found ${validRows}.`);
if (logoutPenaltyRows !== 5) errors.push(`Expected 5 zero-score logout penalties, found ${logoutPenaltyRows}.`);
if (unseenAdvancedRows !== 3) errors.push(`Expected 3 rows with unseen advanced stats, found ${unseenAdvancedRows}.`);
if (syntheticCombatRows !== 1) errors.push(`Expected 1 average-filled combat row to be included, found ${syntheticCombatRows}.`);

if (errors.length) {
  console.error('August data audit failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Audited 128 valid player appearances across 8 August games.`);
console.log('Included 5 zero-score logout penalties and 1 average-filled combat row in scoring.');
console.log('Preserved 3 rows with unseen advanced statistics as missing-data fallbacks.');
console.log('August data audit passed.');
