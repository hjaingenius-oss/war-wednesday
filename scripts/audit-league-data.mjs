import fs from 'node:fs';
import ts from 'typescript';

const sourcePath = new URL('../src/db.ts', import.meta.url);
const source = fs.readFileSync(sourcePath, 'utf8');
const sourceFile = ts.createSourceFile('db.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const environment = new Map();

function evaluate(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(node)) return environment.get(node.text);
  if (ts.isPrefixUnaryExpression(node)) {
    const value = evaluate(node.operand);
    return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate);
  if (ts.isObjectLiteralExpression(node)) {
    const value = {};
    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        value[property.name.text || property.name.getText(sourceFile)] = evaluate(property.initializer);
      } else if (ts.isShorthandPropertyAssignment(property)) {
        value[property.name.text] = environment.get(property.name.text);
      }
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

const packs = [...environment.entries()].filter(([name, value]) => name.endsWith('Matches') && Array.isArray(value));
const errors = [];
const reviews = [];
let gameCount = 0;
let rowCount = 0;

function canonicalName(name) {
  const normalized = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized === 'aks') return 'aks289';
  if (normalized === 'amansanghvi1' || normalized === 'amansanghv1') return 'Aman';
  if (normalized === 'django' || normalized === 'mrdjango') return 'Mr. DJANGO';
  if (normalized === 'dangerboy' || normalized === 'dangerboye') return '!!EDaNgErBoYe!!';
  return String(name);
}

function expectedResult(match, row) {
  if (match.winningTeam === 'Draw') return 'DRAW';
  return row.team === match.winningTeam ? 'WIN' : 'LOSS';
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function ratio(value, baseline) {
  return baseline > 0 ? value / baseline : 1;
}

function normalizedAdr(packName, row, rounds) {
  if (Number.isFinite(row.adr)) return row.adr;
  if (!Number.isFinite(row.damage)) return undefined;
  return packName === 'june18Matches' ? row.damage : row.damage / rounds;
}

function calculateScores(packName, match) {
  const rows = match.rows.filter((row) => row.scoringEligible !== false);
  if (!rows.length) return [];
  const rounds = Math.max(1, Number(match.teamAScore) + Number(match.teamBScore));
  const prepared = rows.map((row) => ({ ...row, auditAdr: normalizedAdr(packName, row, rounds) }));
  const actualAdrs = prepared.map((row) => row.auditAdr).filter(Number.isFinite);
  const lobbyAdr = actualAdrs.length ? average(actualAdrs) : 75;
  const avgKpr = average(prepared.map((row) => row.kills / rounds));
  const avgDpr = average(prepared.map((row) => row.deaths / rounds));
  const avgApr = average(prepared.map((row) => row.assists / rounds));

  for (const row of prepared) {
    if (Number.isFinite(row.auditAdr)) continue;
    row.auditAdr = lobbyAdr * (
      0.7 * ratio(row.kills / rounds, avgKpr) +
      0.2 * ratio(avgDpr, row.deaths / rounds) +
      0.1 * ratio(row.assists / rounds, avgApr)
    );
  }

  const utilityAvailable = prepared.filter((row) => Number.isFinite(row.utilityDamage)).length / prepared.length >= 0.5;
  const flashAvailable = prepared.filter((row) => Number.isFinite(row.enemyFlashed)).length / prepared.length >= 0.5;
  const mvpAvailable = prepared.filter((row) => Number.isFinite(row.mvps)).length / prepared.length >= 0.5;
  const weights = { adr: 0.38, kills: 0.27, survival: 0.13, assists: 0.10, utility: 0.05, flash: 0.04, mvp: 0.03 };
  const activeWeight = weights.adr + weights.kills + weights.survival + weights.assists +
    (utilityAvailable ? weights.utility : 0) + (flashAvailable ? weights.flash : 0) + (mvpAvailable ? weights.mvp : 0);
  const avgAdr = average(prepared.map((row) => row.auditAdr));
  const avgUdr = utilityAvailable ? average(prepared.filter((row) => Number.isFinite(row.utilityDamage)).map((row) => row.utilityDamage / rounds)) : 0;
  const avgEfr = flashAvailable ? average(prepared.filter((row) => Number.isFinite(row.enemyFlashed)).map((row) => row.enemyFlashed / rounds)) : 0;
  const avgMvpr = mvpAvailable ? average(prepared.filter((row) => Number.isFinite(row.mvps)).map((row) => row.mvps / rounds)) : 0;

  const preliminary = prepared.map((row) => {
    let performance = weights.adr / activeWeight * ratio(row.auditAdr, avgAdr) +
      weights.kills / activeWeight * ratio(row.kills / rounds, avgKpr) +
      weights.survival / activeWeight * ratio(avgDpr, row.deaths / rounds) +
      weights.assists / activeWeight * ratio(row.assists / rounds, avgApr);
    if (utilityAvailable) performance += weights.utility / activeWeight * (Number.isFinite(row.utilityDamage) ? ratio(row.utilityDamage / rounds, avgUdr) : 1);
    if (flashAvailable) performance += weights.flash / activeWeight * (Number.isFinite(row.enemyFlashed) ? ratio(row.enemyFlashed / rounds, avgEfr) : 1);
    if (mvpAvailable) performance += weights.mvp / activeWeight * (Number.isFinite(row.mvps) ? ratio(row.mvps / rounds, avgMvpr) : 1);
    return { row, baseScore: 50 * performance };
  });

  return preliminary.map((item) => {
    const teamAverage = average(preliminary.filter((entry) => entry.row.team === item.row.team).map((entry) => entry.baseScore));
    const teamB = match.teamBName || 'Side B';
    const teamRounds = item.row.team === teamB ? match.teamBScore : match.teamAScore;
    const enemyRounds = item.row.team === teamB ? match.teamAScore : match.teamBScore;
    const resultBonus = item.row.result === 'WIN' ? 3 : item.row.result === 'DRAW' ? 1 : 0;
    return item.baseScore + resultBonus + (teamRounds - enemyRounds) * 0.15 + (item.baseScore - teamAverage) / 15;
  });
}

for (const [packName, matches] of packs) {
  for (const match of matches) {
    gameCount += 1;
    rowCount += match.rows.length;
    const label = `${match.date} ${match.map}`;
    const rounds = Math.max(1, Number(match.teamAScore) + Number(match.teamBScore));
    const seenPlayers = new Set();
    const teamCounts = new Map();
    const deaths = match.rows.map((row) => Number(row.deaths)).filter(Number.isFinite).sort((a, b) => a - b);
    const medianDeaths = deaths[Math.floor(deaths.length / 2)] || 0;

    if (!Number.isFinite(match.teamAScore) || !Number.isFinite(match.teamBScore) || rounds <= 1) {
      errors.push(`${label}: invalid game score`);
    }

    for (const row of match.rows) {
      const rowLabel = `${label} / ${row.name}`;
      const player = canonicalName(row.name);
      if (seenPlayers.has(player)) errors.push(`${rowLabel}: duplicate canonical player ${player}`);
      seenPlayers.add(player);
      teamCounts.set(row.team, (teamCounts.get(row.team) || 0) + 1);

      for (const field of ['kills', 'deaths', 'assists']) {
        if (!Number.isFinite(row[field]) || row[field] < 0) errors.push(`${rowLabel}: invalid ${field}`);
      }
      if (row.result !== expectedResult(match, row)) errors.push(`${rowLabel}: result ${row.result}, expected ${expectedResult(match, row)}`);
      if (Number.isFinite(row.hsPercent) && (row.hsPercent < 0 || row.hsPercent > 100)) errors.push(`${rowLabel}: invalid HS% ${row.hsPercent}`);
      if (Number.isFinite(row.kd) && Math.abs(row.kd - row.kills / Math.max(1, row.deaths)) > 0.08) {
        errors.push(`${rowLabel}: K/D ${row.kd} disagrees with ${row.kills}/${row.deaths}`);
      }

      const adr = normalizedAdr(packName, row, rounds);
      if (Number.isFinite(adr) && adr > 220) errors.push(`${rowLabel}: implausible ADR ${adr.toFixed(1)}`);
      if (rounds >= 20 && row.deaths <= 6 && row.scoringEligible !== false) {
        errors.push(`${rowLabel}: likely partial row (${row.kills}/${row.deaths}/${row.assists}) is still scoring eligible`);
      }
      if (row.scoringEligible === false) reviews.push(`${rowLabel}: partial row excluded (${row.kills}/${row.deaths}/${row.assists})`);
      if (row.gapFill === true) reviews.push(`${rowLabel}: synthetic penalty row included`);
      if (row.note && row.scoringEligible !== false && row.gapFill !== true) reviews.push(`${rowLabel}: ${row.note}`);
    }

    if (teamCounts.size !== 2) errors.push(`${label}: expected two sides, found ${JSON.stringify(Object.fromEntries(teamCounts))}`);
    const scores = calculateScores(packName, match);
    for (const score of scores) {
      if (!Number.isFinite(score)) errors.push(`${label}: produced a non-finite player score`);
      if (score < 0 || score > 125) errors.push(`${label}: produced extreme score ${score.toFixed(1)}`);
    }

    if (medianDeaths <= 0) errors.push(`${label}: invalid median deaths`);
  }
}

console.log(`Audited ${rowCount} player rows across ${gameCount} games and ${packs.length} data packs.`);
if (reviews.length) {
  console.log('\nReviewed exceptions:');
  for (const review of reviews) console.log(`- ${review}`);
}
if (errors.length) {
  console.error(`\n${errors.length} audit error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('\nData audit passed with no unhandled errors.');
}
