import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

function evaluateDataFile(path, wantedNames) {
  const source = fs.readFileSync(path, 'utf8');
  const fileName = path instanceof URL ? fileURLToPath(path) : path;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const environment = new Map();

  function evaluate(node) {
    if (!node) return undefined;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isIdentifier(node)) return environment.get(node.text);
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return evaluate(node.expression);
    if (ts.isPrefixUnaryExpression(node)) {
      const value = evaluate(node.operand);
      return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
    }
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate);
    if (ts.isObjectLiteralExpression(node)) {
      const value = {};
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) value[property.name.text || property.name.getText(sourceFile)] = evaluate(property.initializer);
        else if (ts.isShorthandPropertyAssignment(property)) value[property.name.text] = environment.get(property.name.text);
      }
      return value;
    }
    return undefined;
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      const value = evaluate(declaration.initializer);
      if (value !== undefined) environment.set(declaration.name.text, value);
    }
  }

  return [...environment.entries()]
    .filter(([name, value]) => wantedNames(name) && Array.isArray(value))
    .map(([name, matches]) => ({ name, matches }));
}

const root = new URL('../', import.meta.url);
const packs = [
  ...evaluateDataFile(new URL('src/db.ts', root), (name) => name.endsWith('Matches')),
  ...evaluateDataFile(new URL('src/data/august-2026-matchdays.ts', root), (name) => name === 'importedMatches'),
  ...evaluateDataFile(new URL('src/data/august-24-2026-matchday.ts', root), (name) => name === 'importedMatches'),
  ...evaluateDataFile(new URL('src/data/september-2026-matchdays.ts', root), (name) => name === 'september2026Matches'),
];

const games = packs.flatMap((pack) => pack.matches.map((match, index) => ({
  pack: pack.name,
  sourceIndex: index,
  ...match,
})));

const mapSequence = new Map();
const ordered = [...games].sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.sourceIndex - b.sourceIndex);
const reports = ordered.map((match) => {
  const map = match.map || 'Unknown Map';
  const sequence = (mapSequence.get(map) || 0) + 1;
  mapSequence.set(map, sequence);
  const rows = match.rows || [];
  const scoreRows = rows.filter((row) => Number.isFinite(row.scoreboardScore) || Number.isFinite(row.score));
  const topScore = scoreRows.length
    ? Math.max(...scoreRows.map((row) => Number(row.scoreboardScore ?? row.score)))
    : 0;
  const normalizationErrors = scoreRows.flatMap((row) => {
    const rawScore = Number(row.scoreboardScore ?? row.score);
    const scaledScore = topScore > 0 ? (rawScore / topScore) * 100 : 0;
    const finalScore = scaledScore + (row.result === 'WIN' ? 5 : 0);
    if (!Number.isFinite(finalScore)) return [`${row.name}: non-finite final score`];
    if (topScore > 0 && rawScore === topScore && Math.abs(scaledScore - 100) > 0.0001) {
      return [`${row.name}: game leader was not scaled to 100`];
    }
    const expectedBonus = row.result === 'WIN' ? 5 : 0;
    if (Math.abs((finalScore - scaledScore) - expectedBonus) > 0.0001) {
      return [`${row.name}: incorrect result bonus`];
    }
    return [];
  });
  return {
    date: match.date,
    matchId: `${map} ${sequence}`,
    rows: rows.length,
    scoreRows: scoreRows.length,
    normalizationErrors,
    missingPlayers: rows
      .filter((row) => !Number.isFinite(row.scoreboardScore) && !Number.isFinite(row.score))
      .map((row) => row.name),
  };
});

const totalRows = reports.reduce((sum, report) => sum + report.rows, 0);
const scoreRows = reports.reduce((sum, report) => sum + report.scoreRows, 0);
const normalizationErrors = reports.flatMap((report) =>
  report.normalizationErrors.map((error) => `${report.date} ${report.matchId}: ${error}`)
);
if (normalizationErrors.length) {
  console.error(normalizationErrors.join('\n'));
  process.exitCode = 1;
}
const summary = {
  games: reports.length,
  rows: totalRows,
  scoreRows,
  missingRows: totalRows - scoreRows,
  completeGames: reports.filter((report) => report.scoreRows === report.rows).length,
  partialGames: reports.filter((report) => report.scoreRows > 0 && report.scoreRows < report.rows).length,
  emptyGames: reports.filter((report) => report.scoreRows === 0).length,
  normalizationErrors: normalizationErrors.length,
};
console.log(JSON.stringify(
  process.argv.includes('--summary') ? summary : { ...summary, reports },
  null,
  2
));
