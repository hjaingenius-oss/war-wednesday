import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const roster = process.argv.slice(2);
if (roster.length !== 16) {
  console.error('Usage: node scripts/balance-teams.mjs <16 player names>');
  process.exit(1);
}

const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const ratio = (value, baseline) => baseline > 0 ? value / baseline : 1;
const normalizedName = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');

function canonicalName(name) {
  const key = normalizedName(name);
  if (key === 'aks' || key === 'aks289' || key === 'stormbreaker') return 'aks289';
  if (key === 'aman' || key === 'amansanghvi1' || key === 'amansanghv1') return 'Aman';
  if (key === 'django' || key === 'mrdjango') return 'Mr. DJANGO';
  if (key === 'dangerboy' || key === 'dangerboye') return '!!EDaNgErBoYe!!';
  if (key === 'gullu') return 'GULLU';
  if (key === 'drkush') return 'DrKush';
  if (key === 'san') return 'IB';
  if (key === 'rochakkedia' || key === 'rocketkedia') return 'Rocket Kedia';
  if (key === 'fatal' || key === 'fataldestiny') return 'fatal_destiny';
  if (key === 'bob' || key === 'bobmarde') return 'Bob Marde';
  if (key === 'maverick') return 'MAVERICK';
  return String(name);
}

function evaluateFile(path, variableFilter) {
  const source = fs.readFileSync(path, 'utf8');
  const sourceFile = ts.createSourceFile(
    path instanceof URL ? fileURLToPath(path) : path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
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
  return [...environment.entries()].filter(([name, value]) => variableFilter(name, value));
}

const root = new URL('../', import.meta.url);
const dbPacks = evaluateFile(new URL('src/db.ts', root), (name, value) => name.endsWith('Matches') && Array.isArray(value));
const augustPack = evaluateFile(new URL('src/data/august-2026-matchdays.ts', root), (name, value) => name === 'importedMatches' && Array.isArray(value));
const august24Pack = evaluateFile(new URL('src/data/august-24-2026-matchday.ts', root), (name, value) => name === 'importedMatches' && Array.isArray(value));
const packs = [
  ...dbPacks,
  ...augustPack.map(([, value]) => ['august2026Matches', value]),
  ...august24Pack.map(([, value]) => ['august24Matches', value]),
];

function adrFor(packName, row, rounds) {
  if (Number.isFinite(row.adr)) return row.adr;
  if (!Number.isFinite(row.damage)) return undefined;
  return packName === 'june18Matches' ? row.damage : row.damage / rounds;
}

function isLogoutPenalty(packName, row) {
  return packName === 'august2026Matches' && row.gapFill === true && /not visible|missing|left/i.test(row.gapFillReason || '');
}

function scoreGame(packName, match) {
  const eligible = match.rows.filter((row) => row.scoringEligible !== false);
  const overrideRows = eligible.filter((row) => isLogoutPenalty(packName, row));
  const rows = eligible.filter((row) => !isLogoutPenalty(packName, row));
  if (!rows.length) return overrideRows.map((row) => ({ row, score: 0 }));
  const rounds = Math.max(1, Number(match.teamAScore) + Number(match.teamBScore));
  const prepared = rows.map((row) => ({ ...row, auditAdr: adrFor(packName, row, rounds) }));
  const actualAdrs = prepared.map((row) => row.auditAdr).filter(Number.isFinite);
  const lobbyAdr = actualAdrs.length ? average(actualAdrs) : 75;
  const avgKpr = average(prepared.map((row) => Number(row.kills || 0) / rounds));
  const avgDpr = average(prepared.map((row) => Number(row.deaths || 0) / rounds));
  const avgApr = average(prepared.map((row) => Number(row.assists || 0) / rounds));
  for (const row of prepared) {
    if (Number.isFinite(row.auditAdr)) continue;
    row.auditAdr = lobbyAdr * (
      0.7 * ratio(row.kills / rounds, avgKpr) +
      0.2 * ratio(avgDpr, row.deaths / rounds) +
      0.1 * ratio(row.assists / rounds, avgApr)
    );
  }
  const available = (field) => prepared.filter((row) => Number.isFinite(row[field])).length / prepared.length >= 0.5;
  const utilityAvailable = available('utilityDamage');
  const flashAvailable = available('enemyFlashed');
  const mvpAvailable = available('mvps');
  const w = { adr: .38, kills: .27, survival: .13, assists: .10, utility: .05, flash: .04, mvp: .03 };
  const activeWeight = w.adr + w.kills + w.survival + w.assists + (utilityAvailable ? w.utility : 0) + (flashAvailable ? w.flash : 0) + (mvpAvailable ? w.mvp : 0);
  const avgAdr = average(prepared.map((row) => row.auditAdr));
  const avgUdr = utilityAvailable ? average(prepared.filter((row) => Number.isFinite(row.utilityDamage)).map((row) => row.utilityDamage / rounds)) : 0;
  const avgEfr = flashAvailable ? average(prepared.filter((row) => Number.isFinite(row.enemyFlashed)).map((row) => row.enemyFlashed / rounds)) : 0;
  const avgMvpr = mvpAvailable ? average(prepared.filter((row) => Number.isFinite(row.mvps)).map((row) => row.mvps / rounds)) : 0;
  const preliminary = prepared.map((row) => {
    let performance = w.adr / activeWeight * ratio(row.auditAdr, avgAdr) +
      w.kills / activeWeight * ratio(row.kills / rounds, avgKpr) +
      w.survival / activeWeight * ratio(avgDpr, row.deaths / rounds) +
      w.assists / activeWeight * ratio(row.assists / rounds, avgApr);
    if (utilityAvailable) performance += w.utility / activeWeight * (Number.isFinite(row.utilityDamage) ? ratio(row.utilityDamage / rounds, avgUdr) : 1);
    if (flashAvailable) performance += w.flash / activeWeight * (Number.isFinite(row.enemyFlashed) ? ratio(row.enemyFlashed / rounds, avgEfr) : 1);
    if (mvpAvailable) performance += w.mvp / activeWeight * (Number.isFinite(row.mvps) ? ratio(row.mvps / rounds, avgMvpr) : 1);
    return { row, baseScore: 50 * performance };
  });
  const scored = preliminary.map((item) => {
    const teamAverage = average(preliminary.filter((entry) => entry.row.team === item.row.team).map((entry) => entry.baseScore));
    const resultBonus = item.row.result === 'WIN' ? 3 : item.row.result === 'DRAW' ? 1 : 0;
    const margin = Math.abs(Number(match.teamAScore) - Number(match.teamBScore)) * (item.row.result === 'WIN' ? 1 : item.row.result === 'LOSS' ? -1 : 0);
    return { row: item.row, score: item.baseScore + resultBonus + margin * .15 + (item.baseScore - teamAverage) / 15 };
  });
  return [...scored, ...overrideRows.map((row) => ({ row, score: 0 }))];
}

const games = [];
for (const [packName, matches] of packs) {
  for (const match of matches) {
    for (const item of scoreGame(packName, match)) {
      games.push({
        date: match.date,
        name: canonicalName(item.row.name),
        score: item.score,
        kills: Number(item.row.kills || 0),
        deaths: Number(item.row.deaths || 0),
        assists: Number(item.row.assists || 0),
      });
    }
  }
}

function formScore(scores) {
  const weights = [.9, .07, .03];
  const used = scores.slice(0, 3);
  const total = weights.slice(0, used.length).reduce((sum, value) => sum + value, 0);
  return used.reduce((sum, score, index) => sum + score * weights[index], 0) / total;
}

function seasonScore(scores) {
  const recent = scores.slice(0, 10);
  if (!recent.length) return 0;
  const items = [];
  const fixed = [.30, .25, .20, .15];
  for (let i = 0; i < Math.min(4, recent.length); i++) items.push({ value: recent[i], weight: fixed[i] });
  const tail = recent.slice(4, 10);
  if (tail.length) {
    const raw = tail.map((_, index) => .5 ** (index / 2));
    const total = raw.reduce((sum, value) => sum + value, 0);
    tail.forEach((value, index) => items.push({ value, weight: .1 * raw[index] / total }));
  }
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / total;
}

const requested = roster.map((display) => ({ display, canonical: canonicalName(display) }));
const known = [];
for (const player of requested) {
  const playerGames = games.filter((game) => normalizedName(game.name) === normalizedName(player.canonical));
  if (!playerGames.length) {
    known.push({ ...player, known: false });
    continue;
  }
  const byDate = new Map();
  for (const game of playerGames) {
    if (!byDate.has(game.date)) byDate.set(game.date, []);
    byDate.get(game.date).push(game.score);
  }
  const matchdays = [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([, scores]) => average(scores));
  const form = formScore(matchdays);
  const season = seasonScore(matchdays);
  known.push({
    ...player,
    known: true,
    form,
    season,
    rating: .65 * form + .35 * season,
    gameAverage: average(playerGames.map((game) => game.score)),
    kd: playerGames.reduce((sum, game) => sum + game.kills, 0) / Math.max(1, playerGames.reduce((sum, game) => sum + game.deaths, 0)),
    games: playerGames.length,
  });
}

const established = known.filter((player) => player.known);
const neutral = {
  rating: average(established.map((player) => player.rating)),
  form: average(established.map((player) => player.form)),
  season: average(established.map((player) => player.season)),
  gameAverage: average(established.map((player) => player.gameAverage)),
  kd: average(established.map((player) => player.kd)),
};
for (const player of known) Object.assign(player, player.known ? {} : neutral);

const total = (team, field) => team.reduce((sum, player) => sum + player[field], 0);
let best;
for (let mask = 1; mask < 1 << known.length; mask++) {
  if (!(mask & 1)) continue;
  if (mask.toString(2).replaceAll('0', '').length !== 8) continue;
  const a = known.filter((_, index) => mask & (1 << index));
  const b = known.filter((_, index) => !(mask & (1 << index)));
  const ratingDiff = Math.abs(total(a, 'rating') - total(b, 'rating'));
  const formDiff = Math.abs(total(a, 'form') - total(b, 'form'));
  const averageDiff = Math.abs(total(a, 'gameAverage') - total(b, 'gameAverage'));
  const kdDiff = Math.abs(total(a, 'kd') - total(b, 'kd'));
  const objective = ratingDiff + formDiff * .35 + averageDiff * .25 + kdDiff * 4;
  if (!best || objective < best.objective) best = { a, b, objective, ratingDiff, formDiff, averageDiff, kdDiff };
}

const summary = (team) => ({
  rating: total(team, 'rating') / team.length,
  form: total(team, 'form') / team.length,
  gameAverage: total(team, 'gameAverage') / team.length,
  kd: total(team, 'kd') / team.length,
});

console.log(JSON.stringify({ players: known, teamA: best.a.map((p) => p.display), teamB: best.b.map((p) => p.display), teamAStats: summary(best.a), teamBStats: summary(best.b), differences: best }, (key, value) => key === 'a' || key === 'b' ? undefined : value, 2));
