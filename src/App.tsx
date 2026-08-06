import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db, seedIfEmpty } from './db';
import { calculatePoints, safeKD } from './lib/scoring';
import {
  buildLeaderboardRows,
  buildFunAwards,
  calculateMatchScoresForMatch,
  calculateMatchValue,
  calculateTotalPointsForMatch,
  generateMatchDisplayIds,
  getAllTimeRecords,
  getKnifeBoard,
  getMatchDisplayId,
  getMatchdayMoments,
  isScoringEligible,
  normalizeMapName
} from './selectors';
import type { Match, MatchPlayer, MatchResult } from './types';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'friendsleague';
const ADMIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true';

const fmt = (n: number) => Number(n.toFixed(2));
const fmt1 = (n: number) => Number(n.toFixed(1));
const fmtWhole = (n: number) => (Number.isFinite(n) ? Math.round(n) : '—');
const pct = (n: number) => `${Math.round(n * 100)}%`;
const rank = ['Rank #1', 'Rank #2', 'Rank #3'];
const teamNames = ['Side A', 'Side B'];

const playerName = (players: { id?: number; name: string }[], id: number) =>
  players.find((p) => p.id === id)?.name || 'Unknown';

function receiptText(players: { id?: number; name: string }[], attackerId: number, victimId: number) {
  return `${playerName(players, attackerId)} knifed ${playerName(players, victimId)}`;
}

function isMereBaapBobKnife(players: { id?: number; name: string }[], attackerId: number, victimId: number) {
  return playerName(players, attackerId) === 'Mere Baap' && playerName(players, victimId) === 'Bob Marde';
}

function Layout({ children }: { children: React.ReactNode }) {
  return <div className="shell"><header><h1>War Wednesday</h1><nav>{['/','/leaderboard','/matches','/players','/stats'].map((p,i)=><NavLink key={p} to={p}>{['Dashboard','Leaderboard','Match History','Players','Records Room'][i]}</NavLink>)}{ADMIN_ENABLED && <NavLink to="/admin">Admin</NavLink>}</nav></header><main>{children}</main></div>;
}

function useData() {
  const players = useLiveQuery(() => db.players.toArray(), []) || [];
  const seasons = useLiveQuery(() => db.seasons.toArray(), []) || [];
  const matchDays = useLiveQuery(() => db.match_days.orderBy('eventDate').toArray(), []) || [];
  const matches = useLiveQuery(() => db.matches.reverse().sortBy('date'), []) || [];
  const rows = useLiveQuery(() => db.match_players.toArray(), []) || [];
  const knifeEvents = useLiveQuery(() => db.knife_events.toArray(), []) || [];
  return { players, seasons, matchDays, matches, rows, knifeEvents };
}

function Dashboard() {
  const { players, matches, rows, matchDays, knifeEvents } = useData();
  const leaderboard = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, 'all');
  const fun = buildFunAwards(players, rows, matches, leaderboard.allRows, 'all');
  const matchDisplayIds = useMemo(() => generateMatchDisplayIds(matches), [matches]);
  const knifeBoard = getKnifeBoard(players, knifeEvents, matchDisplayIds);
  const activeRows = leaderboard.allRows.filter((r) => r.matchesPlayed > 0);
  const leagueLeader = leaderboard.mainRows[0];
  const inForm = [...activeRows].sort((a, b) => b.formRating - a.formRating)[0];
  const topImpact = leaderboard.impactRows[0];
  const topFragger = [...rows].sort((a,b)=>b.kills-a.kills)[0];
  const bestKd = [...activeRows].sort((a,b)=>b.kd-a.kd)[0];
  const topKnifer = [...activeRows].sort((a, b) => b.knifeKills - a.knifeKills)[0];
  const rowsByMatchId = useMemo(() => {
    const m = new Map<number, MatchPlayer[]>();
    for (const row of rows) {
      const arr = m.get(row.matchId) || [];
      arr.push(row);
      m.set(row.matchId, arr);
    }
    return m;
  }, [rows]);
  const bestPerf = [...rows].sort((a,b)=>{
    const bm = matches.find((m)=>m.id===b.matchId);
    const am = matches.find((m)=>m.id===a.matchId);
    return calculateMatchValue(b, bm, rowsByMatchId.get(b.matchId) || [])-calculateMatchValue(a, am, rowsByMatchId.get(a.matchId) || []);
  })[0];
  const latestDay = matchDays[matchDays.length - 1];
  const leagueYear = latestDay?.eventDate.slice(0, 4) || String(new Date().getFullYear());
  const latestDayMatches = latestDay ? matches.filter((m) => m.matchDayId === latestDay.id) : [];
  const name = (id:number)=>playerName(players, id);
  const featuredKnife = knifeEvents.slice().reverse().find((e) => isMereBaapBobKnife(players, e.attackerPlayerId, e.victimPlayerId))
    || knifeEvents.slice().reverse().find((e) => playerName(players, e.attackerPlayerId) === 'Mere Baap');
  return <>
    <section className="showcase">
      <div className="showcase-main">
        <p className="eyebrow">War Wednesday {leagueYear}</p>
        <h2>{latestDay?.title || 'Matchday HQ'}</h2>
        <div className="headline-stat">
          <span>League Leader</span>
          <strong>{leagueLeader?.name || 'TBD'}</strong>
          <small>{leagueLeader ? `${fmt1(leagueLeader.warRating)} Score` : 'No Regulars yet'}</small>
        </div>
        <div className="score-strip">
          {latestDayMatches.slice(0, 4).map((m) => <NavLink to={`/matches/${m.id}`} key={m.id}><span>Match ID: {getMatchDisplayId(m.id, matchDisplayIds)}</span><b>{m.teamAScore}-{m.teamBScore}</b></NavLink>)}
        </div>
      </div>
      <aside className="receipts-board">
      <div className="receipts-head"><span>Knife Board</span><strong>{knifeEvents.length}</strong></div>
      {featuredKnife && (
        <article className="knife-spotlight">
          <p className="knife-spotlight-kicker">Featured knife receipt</p>
          <h3>{receiptText(players, featuredKnife.attackerPlayerId, featuredKnife.victimPlayerId)}</h3>
          <p>Mere Baap landed the cleanest banter knife on Bob Marde.</p>
        </article>
      )}
      <div className="receipt-stack">
        {knifeEvents.slice().reverse().slice(0, 3).map((e, i)=><div className={`receipt-card${isMereBaapBobKnife(players, e.attackerPlayerId, e.victimPlayerId) ? ' featured' : ''}`} key={e.id}><span>#{i + 1}</span><b>{receiptText(players, e.attackerPlayerId, e.victimPlayerId)}</b>{isMereBaapBobKnife(players, e.attackerPlayerId, e.victimPlayerId) && <small>Headline knife of the night</small>}</div>)}
      </div>
    </aside>
  </section>
  <section className="card">
    <h2>From the Records Room</h2>
    <div className="awards-grid">
        {fun.awards.filter((a) => ['Assassin', 'Assist Hero', 'Bomber', 'Flasher'].includes(a.label)).slice(0, 4).map((a) => <article className="award-card" key={a.key}>
          <p className="award-title">{a.label}</p>
          <h3>{a.playerName}</h3>
          <p className="award-stat">{a.stat}</p>
        </article>)}
        {fun.mapSpecialists[0]
          ? <article className="map-card">
            <p className="award-title">{fun.mapSpecialists[0].label}</p>
            <h3>{fun.mapSpecialists[0].playerName}</h3>
            <p className="award-stat">{fun.mapSpecialists[0].stat}</p>
          </article>
          : knifeBoard.latestText
            ? <article className="map-card">
              <p className="award-title">Latest Knife Moment</p>
              <h3>{knifeBoard.latestText}</h3>
            </article>
            : null}
      </div>
      <p><NavLink to="/stats" className="comparison-badge">View Records Room</NavLink></p>
    </section>
    <section className="stats-grid">
      <div className="card stat kpi"><h3>Top Fragger</h3><p>{topFragger ? `${name(topFragger.playerId)} (${topFragger.kills} kills)` : '-'}</p></div>
      <div className="card stat kpi"><h3>Best K/D</h3><p>{bestKd ? `${bestKd.name} (${bestKd.kd})` : '-'}</p></div>
      <div className="card stat kpi"><h3>Most Knife Kills</h3><p>{topKnifer ? `${topKnifer.name} (${topKnifer.knifeKills})` : '-'}</p></div>
      <div className="card stat kpi"><h3>In Form</h3><p>{inForm ? `${inForm.name} (${fmt1(inForm.formRating)})` : '-'}</p></div>
      <div className="card stat kpi"><h3>Top Impact Player</h3><p>{topImpact ? `${topImpact.name} (${fmt1(topImpact.warRating)})` : '-'}</p></div>
      <div className="card stat kpi"><h3>Best Single Match</h3><p>{bestPerf ? `${name(bestPerf.playerId)} (${fmt1(calculateMatchValue(bestPerf, matches.find((m)=>m.id===bestPerf.matchId), rowsByMatchId.get(bestPerf.matchId) || []))})` : '-'}</p></div>
    </section>
    <section className="grid2"><div className="card"><h3>Top 5 Main Ranked Board</h3>{leaderboard.mainRows.slice(0,5).map((r,i)=><div className="row" key={r.playerId}><span className={`rank-chip rank-${i+1}`}>{rank[i] || `Rank #${i+1}`}</span><span>{r.name}</span><span>{fmt1(r.warRating)} Score</span></div>)}</div>
    <div className="card"><h3>Top 3 Impact Board</h3>{leaderboard.impactRows.slice(0,3).map((r)=><div className="row" key={r.playerId}><span className="category-badge">{r.category}</span><span>{r.name}</span><span>{fmt1(r.warRating)} Score</span></div>)}</div></section>
  </>;
}

function Leaderboard() {
  const { players, rows, matches, matchDays, knifeEvents } = useData();
  const [filter, setFilter] = useState('all');
  const board = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, filter);
  const allTimeBoard = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, 'all');
  const fun = buildFunAwards(players, rows, matches, allTimeBoard.allRows, 'all');
  const playerTitles = buildPlayerFunTitleMap(fun);
  return <div className="leaderboard-page"><div className="card"><h2>Leaderboard</h2><div className="actions"><select value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="last10">Last 10 matches</option><option value="last20">Last 20 matches</option><option value="all">All matches</option></select></div>
  <div className="helper-grid"><p><b>Rank Score</b><br/>Balanced score from match performance, recent form, and weighted season quality.</p><p><b>Form</b><br/>Recent match performance with stronger weight on the latest game. * means small sample.</p><p><b>Season Score</b><br/>Weighted score across the season.</p><p><b>Match Score Avg</b><br/>Average score in the selected leaderboard window.</p></div></div>
  <section className="card"><h2>Main Ranked Board</h2><div className="table-wrap"><table><thead><tr><th>Player</th><th>Rank Score</th><th>Form</th><th>Season Score</th><th>Match Score Avg</th><th>Matches<br/>Played</th><th>Win %</th><th>KDA</th><th>K/D</th><th>Damage</th><th>UD</th><th>UD<br/>/Game</th><th>EF</th><th>EF<br/>/Game</th><th>DMG<br/>/Game</th><th>HS</th><th>HS<br/>/Game</th><th>10+ K</th><th>20+ K</th><th>30+ K</th><th>Knife<br/>Kills</th></tr></thead><tbody>
  {board.mainRows.map((r,i)=><tr key={r.playerId}><td><NavLink to={`/players/${r.playerId}`} className="player-link">{renderPlayerIdentity(r.name, playerTitles.get(r.playerId) || [], i, r.formScore > r.seasonAvg ? 'up' : r.formScore < r.seasonAvg ? 'down' : undefined)}</NavLink></td><td className="war-cell">{fmtWhole(r.rankScore)}</td><td><span className="form-cell">{fmtWhole(r.formScore)}{r.smallSample ? ' *' : ''}</span></td><td>{fmtWhole(r.seasonAvg)}</td><td>{fmtWhole(r.matchScoreAvg)}</td><td>{r.matchesPlayed}</td><td>{fmt1(r.winPct)}%</td><td>{`${r.kills}/${r.deaths}/${r.assists}`}</td><td>{fmt1(r.kd)}</td><td>{Math.round(r.damage)}</td><td>{Math.round(r.utilityDamage)}</td><td>{fmt1(r.utilityDamagePerGame)}</td><td>{Math.round(r.enemyFlashed)}</td><td>{fmt1(r.enemyFlashedPerGame)}</td><td>{fmt1(r.damagePerGame)}</td><td>{Math.round(r.headshotKills)}</td><td>{fmt1(r.headshotKillsPerGame)}</td><td>{r.games10PlusKills}</td><td>{r.games20PlusKills}</td><td>{r.games30PlusKills}</td><td>{r.knifeKills}</td></tr>)}
  </tbody></table></div></section>
  <section className="card"><h2>Impact Board</h2><p className="muted">Highlights strong low-attendance and small-sample players without affecting official ranks.</p><div className="table-wrap"><table><thead><tr><th>Player</th><th>Rank Score</th><th>Form</th><th>Season Score</th><th>Match Score Avg</th><th>Matches<br/>Played</th><th>Win %</th><th>KDA</th><th>K/D</th><th>Damage</th><th>UD</th><th>UD<br/>/Game</th><th>EF</th><th>EF<br/>/Game</th><th>DMG<br/>/Game</th><th>HS</th><th>HS<br/>/Game</th><th>10+ K</th><th>20+ K</th><th>30+ K</th><th>Knife<br/>Kills</th><th>Comparison</th></tr></thead><tbody>
  {board.impactRows.map((r)=><tr key={r.playerId}><td><NavLink to={`/players/${r.playerId}`} className="player-link">{renderPlayerIdentity(r.name, playerTitles.get(r.playerId) || [], undefined, r.formScore > r.seasonAvg ? 'up' : r.formScore < r.seasonAvg ? 'down' : undefined)}</NavLink></td><td className="war-cell">{fmtWhole(r.rankScore)}</td><td><span className="form-cell">{fmtWhole(r.formScore)}{r.smallSample ? ' *' : ''}</span></td><td>{fmtWhole(r.seasonAvg)}</td><td>{fmtWhole(r.matchScoreAvg)}</td><td>{r.matchesPlayed}</td><td>{fmt1(r.winPct)}%</td><td>{`${r.kills}/${r.deaths}/${r.assists}`}</td><td>{fmt1(r.kd)}</td><td>{Math.round(r.damage)}</td><td>{Math.round(r.utilityDamage)}</td><td>{fmt1(r.utilityDamagePerGame)}</td><td>{Math.round(r.enemyFlashed)}</td><td>{fmt1(r.enemyFlashedPerGame)}</td><td>{fmt1(r.damagePerGame)}</td><td>{Math.round(r.headshotKills)}</td><td>{fmt1(r.headshotKillsPerGame)}</td><td>{r.games10PlusKills}</td><td>{r.games20PlusKills}</td><td>{r.games30PlusKills}</td><td>{r.knifeKills}</td><td><span className="comparison-badge">{r.comparisonBadge}</span></td></tr>)}
  </tbody></table></div></section></div>;
}

function MatchHistory() {
  const { matches, rows, players, matchDays } = useData();
  const nav = useNavigate();
  const matchDisplayIds = useMemo(() => generateMatchDisplayIds(matches), [matches]);
  const top = (id:number) => {
    const r = rows.filter((x)=>x.matchId===id).sort((a,b)=>b.kills-a.kills)[0];
    return r ? `${players.find((p)=>p.id===r.playerId)?.name} (${r.kills})` : '-';
  };
  const grouped = matchDays.map((md) => ({ day: md, games: matches.filter((m) => m.matchDayId === md.id) })).filter((g) => g.games.length > 0);
  return <div className="card"><h2>Match History</h2>
    {grouped.map((g) => <section key={g.day.id} className="matchday-panel"><h3>{g.day.title}</h3><p className="muted">{g.day.eventDate} / {g.games.length} matches</p><div className="table-wrap"><table><thead><tr><th>Match ID</th><th>Date</th><th>Map</th><th>Score</th><th>Top Fragger</th><th>Detail</th></tr></thead><tbody>
    {g.games.map((m)=><tr key={m.id} className="clickable-row" onClick={()=>nav(`/matches/${m.id}`)}><td>{getMatchDisplayId(m.id, matchDisplayIds)}</td><td>{m.date}</td><td>{normalizeMapName(m.map)}</td><td>{m.teamAScore}-{m.teamBScore}</td><td>{top(m.id!)}</td><td><NavLink to={`/matches/${m.id}`} onClick={(e)=>e.stopPropagation()}>Open</NavLink></td></tr>)}
    </tbody></table></div></section>)}
  </div>;
}

function MatchDetail() {
  const { id } = useParams();
  const { matches, rows, players, knifeEvents } = useData();
  const matchDisplayIds = useMemo(() => generateMatchDisplayIds(matches), [matches]);
  const m = matches.find((x)=>String(x.id)===id);
  if (!m) return <div className="card">Match not found.</div>;
  const mr = rows.filter((r)=>r.matchId===m.id);
  const scoreRows = mr.filter(isScoringEligible);
  const mk = knifeEvents.filter((k) => k.matchId === m.id);
  const teams = [...new Set(mr.map((x)=>x.team))];
  const topMatchValue = scoreRows.length ? Math.max(...scoreRows.map((r) => calculateMatchValue(r, m, scoreRows))) : 0;
  const topDamage = scoreRows.length ? Math.max(...scoreRows.map((r)=>Number(r.damage || 0))) : 0;
  const topUtilityDamage = scoreRows.length ? Math.max(...scoreRows.map((r)=>Number((r as MatchPlayer).utilityDamage || 0))) : 0;
  const topEnemyFlashed = scoreRows.length ? Math.max(...scoreRows.map((r)=>Number((r as MatchPlayer).enemyFlashed || 0))) : 0;
  const topAdr = scoreRows.length ? Math.max(...scoreRows.map((r)=> (m.teamAScore + m.teamBScore) > 0 ? Number((r.damage || 0)) / (m.teamAScore + m.teamBScore) : 0)) : 0;
  const topKills = scoreRows.length ? Math.max(...scoreRows.map((r)=>r.kills)) : 0;
  const topKd = scoreRows.length ? Math.max(...scoreRows.map((r)=>safeKD(r.kills, r.deaths))) : 0;
  return <div className="card"><h2>{normalizeMapName(m.map)} - {m.date}</h2><p><b>Match ID:</b> {getMatchDisplayId(m.id, matchDisplayIds)}</p><p>Final Score: {m.teamAName || 'Side A'} {m.teamAScore} - {m.teamBScore} {m.teamBName || 'Side B'}</p>
    {mk.length > 0 && <div className="receipts-board inline-receipts"><div className="receipts-head"><span>Knife Board</span><strong>{mk.length}</strong></div>{mk.map((k, i)=><div className="receipt-card" key={k.id}><span>#{i + 1}</span><b>{receiptText(players, k.attackerPlayerId, k.victimPlayerId)}</b></div>)}</div>}
    <div className="helper-grid"><p><b>Highest Score</b><br/>{scoreRows.find((r)=>calculateMatchValue(r, m, scoreRows)===topMatchValue) ? `${playerName(players, scoreRows.find((r)=>calculateMatchValue(r, m, scoreRows)===topMatchValue)!.playerId)} (${fmt1(topMatchValue)})` : '-'}</p><p><b>Top Fragger</b><br/>{scoreRows.find((r)=>r.kills===topKills) ? `${playerName(players, scoreRows.find((r)=>r.kills===topKills)!.playerId)} (${topKills})` : '-'}</p><p><b>Highest Damage</b><br/>{scoreRows.find((r)=>(r.damage||0)===topDamage) ? `${playerName(players, scoreRows.find((r)=>(r.damage||0)===topDamage)!.playerId)} (${topDamage})` : '-'}</p><p><b>Highest Utility Damage</b><br/>{scoreRows.find((r)=>(r as MatchPlayer).utilityDamage===topUtilityDamage) ? `${playerName(players, scoreRows.find((r)=>(r as MatchPlayer).utilityDamage===topUtilityDamage)!.playerId)} (${topUtilityDamage})` : '-'}</p><p><b>Most Enemies Flashed</b><br/>{scoreRows.find((r)=>(r as MatchPlayer).enemyFlashed===topEnemyFlashed) ? `${playerName(players, scoreRows.find((r)=>(r as MatchPlayer).enemyFlashed===topEnemyFlashed)!.playerId)} (${topEnemyFlashed})` : '-'}</p><p><b>Best ADR</b><br/>{scoreRows.find((r)=>(((r.damage||0)/(Math.max(1,m.teamAScore + m.teamBScore)))===topAdr)) ? `${playerName(players, scoreRows.find((r)=>(((r.damage||0)/(Math.max(1,m.teamAScore + m.teamBScore)))===topAdr))!.playerId)} (${fmt1(topAdr)})` : '-'}</p></div>
    {teams.map((t)=><div key={t}><h3>{t}</h3><div className="table-wrap"><table><thead><tr><th>Player</th><th>Side</th><th>Result</th><th>K</th><th>D</th><th>A</th><th>Damage</th><th>UD</th><th>EF</th><th>HS%</th><th>ADR</th><th>K/D</th><th>Total Points</th><th>Score</th></tr></thead><tbody>{mr.filter((r)=>r.team===t).map((r)=><tr key={r.id} className={isScoringEligible(r) ? [calculateMatchValue(r, m, scoreRows)===topMatchValue ? 'highlight-value' : '', r.kills===topKills ? 'highlight-kills' : '', safeKD(r.kills,r.deaths)===topKd ? 'highlight-kd' : '', (r.damage||0)===topDamage ? 'highlight-dmg' : '', ((r as MatchPlayer).utilityDamage||0)===topUtilityDamage ? 'highlight-dmg' : '', ((r as MatchPlayer).enemyFlashed||0)===topEnemyFlashed ? 'highlight-adr' : '', (((r.damage||0)/(Math.max(1,m.teamAScore + m.teamBScore)))===topAdr) ? 'highlight-adr' : ''].join(' ') : 'partial-row'}><td>{players.find((p)=>p.id===r.playerId)?.name}{!isScoringEligible(r) && <small className="muted"> Partial game</small>}</td><td>{r.team}</td><td>{r.result}</td><td>{r.kills}</td><td>{r.deaths}</td><td>{r.assists}</td><td>{r.damage ?? '-'}</td><td>{(r as MatchPlayer).utilityDamage ?? '-'}</td><td>{(r as MatchPlayer).enemyFlashed ?? '-'}</td><td>{r.hsPercent ?? '-'}</td><td>{r.damage != null ? fmt1((r.damage)/(Math.max(1,m.teamAScore + m.teamBScore))) : '-'}</td><td>{safeKD(r.kills,r.deaths)}</td><td>{isScoringEligible(r) ? fmt(calculateTotalPointsForMatch(r)) : '-'}</td><td className="war-cell">{isScoringEligible(r) ? fmt1(calculateMatchValue(r, m, scoreRows)) : 'Not ranked'}</td></tr>)}</tbody></table></div></div>)}
  </div>;
}

function StatsPage() {
  const { players, rows, matches, matchDays, knifeEvents } = useData();
  const board = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, 'all');
  const fun = buildFunAwards(players, rows, matches, board.allRows, 'all');
  const matchDisplayIds = useMemo(() => generateMatchDisplayIds(matches), [matches]);
  const allTime = getAllTimeRecords(players, rows, matches, knifeEvents, matchDisplayIds);
  const knifeBoard = getKnifeBoard(players, knifeEvents, matchDisplayIds);
  const moments = getMatchdayMoments(players, rows, matches, knifeEvents, matchDisplayIds);
  const latestMatch = [...matches].sort((a, b) => b.date.localeCompare(a.date) || (b.id || 0) - (a.id || 0))[0];
  const latestMatchday = latestMatch?.matchDayId ? matchDays.find((d) => d.id === latestMatch.matchDayId) : undefined;
  const topMatchdayScore = board.allRows
    .flatMap((r) => r.matchdayScores.map((s) => ({ playerId: r.playerId, name: r.name, ...s })))
    .sort((a, b) => b.score - a.score)[0];

  return <div className="leaderboard-page">
    <section className="card">
      <h2>Records Room</h2>
      <p className="muted">League awards, map kings, knife history, and all-time receipts.</p>
    </section>
    <section className="card">
      <h3>League Awards</h3>
      <div className="awards-grid">
        {fun.awards.map((a) => <article className="award-card" key={a.key}><p className="award-title">{a.label}</p><h3>{a.playerName}</h3><p className="award-stat">{a.stat}</p></article>)}
      </div>
    </section>
    <section className="card">
      <h3>Map Kings</h3>
      {fun.mapSpecialists.length === 0
        ? <p className="muted">No map data yet.</p>
        : <div className="map-grid">{fun.mapSpecialists.map((m) => <article className="map-card map-king-card" key={m.map}><p className="award-title">{m.label}</p><h3>{m.playerName}</h3><p className="award-stat">{fmt1(m.dominanceScore)} dominance</p><div className="map-meta"><span>{m.appearances} games</span><span>{fmt1(m.kd)} K/D</span><span>{fmt1(m.winPct)}% wins</span></div><p className="muted">Owns this map.</p></article>)}</div>}
    </section>
    <section className="card">
      <h3>All-Time Records</h3>
      <div className="helper-grid">
        <p><b>Highest Score Match</b><br />{allTime.bestMatchValue.playerName || '-'} {allTime.bestMatchValue.row ? `(${fmt1(calculateMatchValue(allTime.bestMatchValue.row, allTime.bestMatchValue.match, rows.filter((x) => x.matchId === allTime.bestMatchValue.row?.matchId)))})` : ''}<br />{allTime.bestMatchValue.matchId ? `Match ID: ${allTime.bestMatchValue.matchId}` : ''}</p>
        <p><b>Highest Matchday Score</b><br />{topMatchdayScore ? `${topMatchdayScore.name} (${fmt1(topMatchdayScore.score)})` : '-'}<br />{topMatchdayScore ? topMatchdayScore.title : ''}</p>
        <p><b>Most Kills in a Match</b><br />{allTime.mostKills.playerName || '-'} {allTime.mostKills.row ? `(${allTime.mostKills.row.kills})` : ''}<br />{allTime.mostKills.matchId ? `Match ID: ${allTime.mostKills.matchId}` : ''}</p>
        <p><b>Most Assists in a Match</b><br />{allTime.mostAssists.playerName || '-'} {allTime.mostAssists.row ? `(${allTime.mostAssists.row.assists})` : ''}<br />{allTime.mostAssists.matchId ? `Match ID: ${allTime.mostAssists.matchId}` : ''}</p>
        <p><b>Best K/D Match (10+ Kills)</b><br />{allTime.bestKd.playerName || '-'} {allTime.bestKd.row ? `(${safeKD(allTime.bestKd.row.kills, allTime.bestKd.row.deaths)})` : ''}<br />{allTime.bestKd.matchId ? `Match ID: ${allTime.bestKd.matchId}` : ''}</p>
        <p><b>Highest Damage Match</b><br />{allTime.highestDamage.playerName || '-'} {allTime.highestDamage.row ? `(${allTime.highestDamage.row.damage || 0})` : ''}<br />{allTime.highestDamage.matchId ? `Match ID: ${allTime.highestDamage.matchId}` : ''}</p>
        <p><b>Highest Utility Damage Match</b><br />{allTime.highestUtilityDamage.playerName || '-'} {allTime.highestUtilityDamage.row ? `(${allTime.highestUtilityDamage.row.utilityDamage || 0})` : ''}<br />{allTime.highestUtilityDamage.matchId ? `Match ID: ${allTime.highestUtilityDamage.matchId}` : ''}</p>
        <p><b>Most Enemies Flashed</b><br />{allTime.mostEnemyFlashed.playerName || '-'} {allTime.mostEnemyFlashed.row ? `(${allTime.mostEnemyFlashed.row.enemyFlashed || 0})` : ''}<br />{allTime.mostEnemyFlashed.matchId ? `Match ID: ${allTime.mostEnemyFlashed.matchId}` : ''}</p>
        <p><b>Best ADR Match</b><br />{allTime.bestAdr.playerName || '-'} {allTime.bestAdr.row ? `(${fmt1((allTime.bestAdr.row.damage || 0) / Math.max(1, (allTime.bestAdr.match?.teamAScore || 0) + (allTime.bestAdr.match?.teamBScore || 0)))})` : ''}<br />{allTime.bestAdr.matchId ? `Match ID: ${allTime.bestAdr.matchId}` : ''}</p>
        <p><b>Survivor</b><br />{fun.awards.find((a)=>a.label==='Survivor')?.playerName || '-'}<br />{fun.awards.find((a)=>a.label==='Survivor')?.stat || ''}</p>
      </div>
    </section>
    <section className="grid2">
      <div className="card"><h3>Knife Board</h3>{knifeBoard.latestText && <div className="knife-spotlight inline"><p className="knife-spotlight-kicker">Featured knife receipt</p><h4>{knifeBoard.latestText}</h4><p>{knifeBoard.latestText.includes('Mere Baap') && knifeBoard.latestText.includes('Bob Marde') ? 'Mere Baap tagged Bob Marde in a proper hallway check.' : 'Latest knife moment from the current records.'}</p></div>}<div className="row"><span>Knife Artist</span><span>{allTime.knifeArtist?.name || '-'} ({allTime.knifeArtist?.count || 0})</span></div><div className="row"><span>Knife Victim</span><span>{allTime.knifeVictim?.name || '-'} ({allTime.knifeVictim?.count || 0})</span></div><div className="row"><span>Biggest Knife Rivalry</span><span>{knifeBoard.rivalryText || '-'}</span></div><div className="row"><span>Latest Knife Moment</span><span>{knifeBoard.latestText || '-'}</span></div></div>
      <div className="card"><h3>Matchday Moments</h3><p className="muted">{latestMatchday ? `${latestMatchday.title} (${latestMatchday.eventDate})` : 'Latest available matchday'}</p>{moments.length === 0 ? <p className="muted">No moments yet.</p> : moments.map((line, i) => <div className="row" key={i}><span>{line}</span></div>)}</div>
    </section>
  </div>;
}

function Players() {
  const { players, rows, matches, matchDays, knifeEvents } = useData();
  const leaderboard = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, 'all');
  const board = [...leaderboard.mainRows, ...leaderboard.impactRows, ...leaderboard.inactiveRows].filter((r)=>r.matchesPlayed > 0);
  return <div className="cards">{board.map((p, i)=><NavLink key={p.playerId} to={`/players/${p.playerId}`} className="card player"><p className={`rank-chip rank-${i+1}`}>{`Rank #${i+1}`}</p><h3>{renderPlayerIdentity(p.name, [], undefined, p.formScore > p.seasonAvg ? 'up' : p.formScore < p.seasonAvg ? 'down' : undefined)}</h3><p>{fmt1(p.warRating)} Score</p><p>{p.matchesPlayed} matches</p><p>{p.category}</p><p>K/D {p.kd}</p><p>Knifed {p.knifeKills}</p></NavLink>)}</div>;
}

function PlayerProfile() {
  const { id } = useParams();
  const { players, rows, matches, matchDays, knifeEvents } = useData();
  const matchDisplayIds = useMemo(() => generateMatchDisplayIds(matches), [matches]);
  const pid = Number(id);
  const p = players.find((x)=>x.id===pid);
  const board = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, 'all');
  const fun = buildFunAwards(players, rows, matches, board.allRows, 'all');
  const profile = board.allRows.find((r)=>r.playerId===pid);
  const pr = rows.filter((r)=>r.playerId===pid);
  const kills = pr.reduce((s,r)=>s+r.kills,0), deaths = pr.reduce((s,r)=>s+r.deaths,0), assists=pr.reduce((s,r)=>s+r.assists,0), points=pr.reduce((s,r)=>s+calculateTotalPointsForMatch(r),0);
  const wins = pr.filter((r)=>r.result==='WIN').length, losses = pr.filter((r)=>r.result==='LOSS').length;
  const knifeKills = knifeEvents.filter((e) => e.attackerPlayerId === pid).length;
  const knifeDeaths = knifeEvents.filter((e) => e.victimPlayerId === pid).length;
  const matchById = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);
  const trend = useMemo(() => {
    const seen = new Set<number>();
    const rowsByMatch = new Map<number, MatchPlayer[]>();
    for (const row of pr) {
      const arr = rowsByMatch.get(row.matchId) || [];
      arr.push(row);
      rowsByMatch.set(row.matchId, arr);
    }
    return pr
      .map((row) => {
        if (seen.has(row.matchId)) return null;
        seen.add(row.matchId);
        const match = matchById.get(row.matchId);
        if (!match) return null;
        const matchRows = rowsByMatch.get(row.matchId) || [];
        const matchScore = calculateMatchScoresForMatch(match, matchRows).find((item) => item.playerId === row.playerId);
        return {
          matchId: row.matchId,
          match: getMatchDisplayId(row.matchId, matchDisplayIds),
          date: match.date,
          score: fmt1(matchScore?.computedScore ?? calculateMatchValue(row, match, matchRows))
        };
      })
      .filter((value): value is { matchId: number; match: string; date: string; score: number } => Boolean(value))
      .sort((a, b) => a.date.localeCompare(b.date) || a.matchId - b.matchId);
  }, [pr, matchById, matchDisplayIds]);
  const knifeHistory = knifeEvents.filter((e) => e.attackerPlayerId === pid || e.victimPlayerId === pid).slice().reverse();
  const games10 = pr.filter((r) => r.kills >= 10).length;
  const games20 = pr.filter((r) => r.kills >= 20).length;
  const games30 = pr.filter((r) => r.kills >= 30).length;
  const utilityDamage = pr.reduce((s,r)=>s+Number((r as MatchPlayer).utilityDamage || 0),0);
  const enemyFlashed = pr.reduce((s,r)=>s+Number((r as MatchPlayer).enemyFlashed || 0),0);
  const profileBadges = buildProfileFunBadges(pid, fun).slice(0, 3);
  if (!p) return <div className="card">Player not found.</div>;
  return <div className="card"><h2>{p.name}</h2>{profile && profile.category !== 'Regular' && profile.wouldRank && <p className="warn">Not officially ranked due to attendance, but would rank #{profile.wouldRank} among Regulars by Score.</p>}<section className="stats-grid"><div className="stat card"><h3>Category</h3><p>{profile?.category || 'Inactive'}</p></div><div className="stat card"><h3>Score</h3><p>{fmt1(profile?.warRating || 0)}</p></div><div className="stat card"><h3>Form</h3><p>{fmt1(profile?.formRating || 0)}</p></div><div className="stat card"><h3>Total Points</h3><p>{fmt(profile?.totalPoints || points)}</p></div><div className="stat card"><h3>Attendance</h3><p>{pct(profile?.attendanceRate || 0)}</p></div><div className="stat card"><h3>Matchdays</h3><p>{profile?.matchdaysPlayed || 0}</p></div><div className="stat card"><h3>Matches</h3><p>{pr.length}</p></div><div className="stat card"><h3>Wins/Losses</h3><p>{wins}/{losses}</p></div><div className="stat card"><h3>Win %</h3><p>{pr.length?fmt1((wins/pr.length)*100):0}%</p></div><div className="stat card"><h3>K/D</h3><p>{safeKD(kills,deaths)}</p></div><div className="stat card"><h3>Knifed</h3><p>{knifeKills}</p></div><div className="stat card"><h3>Got Knifed</h3><p>{knifeDeaths}</p></div></section>
  <section className="stats-grid"><div className="stat card"><h3>Utility Damage</h3><p>{Math.round(utilityDamage)}</p></div><div className="stat card"><h3>Utility DMG / Game</h3><p>{profile ? fmt1(profile.utilityDamagePerGame) : 0}</p></div><div className="stat card"><h3>Enemies Flashed</h3><p>{Math.round(enemyFlashed)}</p></div><div className="stat card"><h3>Flashes / Game</h3><p>{profile ? fmt1(profile.enemyFlashedPerGame) : 0}</p></div></section>
  {profileBadges.length > 0 && <><h3>Player Titles</h3><div className="badge-row">{profileBadges.map((b) => <span className="fun-badge" key={b}>{b}</span>)}</div></>}
  <p>Kills {kills} | Deaths {deaths} | Assists {assists}</p>
  <p>10+ Kill Games {games10} | 20+ Kill Games {games20} | 30+ Kill Games {games30}</p>
  {profile?.comparisonBadge && <p><span className="comparison-badge">{profile.comparisonBadge}</span></p>}
  <h3>Performance by Game</h3><p className="muted">Each point is one game, ordered from oldest to newest.</p><div className="chart"><ResponsiveContainer width="100%" height={240}><LineChart data={trend}><XAxis dataKey="match" interval={0} angle={-25} textAnchor="end" height={60} tickMargin={12}/><YAxis/><Tooltip/><Line type="monotone" dataKey="score" stroke="#b8ff2c" dot={false}/></LineChart></ResponsiveContainer></div>
  <h3>Knife History</h3>{knifeHistory.map((e)=><div key={e.id} className={`row${isMereBaapBobKnife(players, e.attackerPlayerId, e.victimPlayerId) ? ' featured-row' : ''}`}><span>Match ID: {getMatchDisplayId(e.matchId, matchDisplayIds)}</span><span>{receiptText(players, e.attackerPlayerId, e.victimPlayerId)}{isMereBaapBobKnife(players, e.attackerPlayerId, e.victimPlayerId) ? ' - featured receipt' : ''}</span></div>)}
  <h3>Recent Matches</h3>{pr.slice(-5).reverse().map((r)=><div key={r.id} className="row"><span>{matches.find((m)=>m.id===r.matchId)?.date}</span><span>Match ID: {getMatchDisplayId(r.matchId, matchDisplayIds)}</span><span>{fmt(calculateTotalPointsForMatch(r))} Total Points</span></div>)}
  </div>;
}

function buildProfileFunBadges(playerId: number, fun: ReturnType<typeof buildFunAwards>) {
  const badges: string[] = [];
  for (const award of fun.awards) {
    if (award.playerId !== playerId) continue;
    badges.push(award.label);
  }
  for (const mapAward of fun.mapSpecialists) {
    if (mapAward.playerId !== playerId) continue;
    badges.push(mapAward.label);
  }
  return badges;
}

function buildPlayerFunTitleMap(fun: ReturnType<typeof buildFunAwards>) {
  const map = new Map<number, string[]>();
  for (const award of fun.awards) {
    const current = map.get(award.playerId) || [];
    current.push(award.label);
    map.set(award.playerId, current);
  }
  for (const mapAward of fun.mapSpecialists) {
    const current = map.get(mapAward.playerId) || [];
    current.push(mapAward.label);
    map.set(mapAward.playerId, current);
  }
  return map;
}

function renderPlayerIdentity(name: string, titles: string[], rankIndex?: number, trend?: 'up' | 'down') {
  const capped = titles.slice(0, 2);
  return (
    <div className="player-id-cell">
      {typeof rankIndex === 'number' && <span className={`player-rank-inline rank-${rankIndex + 1}`}>{`#${rankIndex + 1}`}</span>}
      <div className="player-id-main">
        <span className="player-id-name">{name}</span>
        {trend && <span className={`form-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>{trend === 'up' ? '▲' : '▼'}</span>}
        {capped.length > 0 && <span className="titles-cell">{capped.map((title) => {
          const special = title.includes('Knife') ? ' title-knife' : title.includes('King') ? ' title-map' : '';
          return <span key={title} className={`title-chip${special}`}>{title}</span>;
        })}</span>}
      </div>
    </div>
  );
}

function AdminGate() {
  if (!ADMIN_ENABLED) return <Navigate to="/" />;
  const [ok, setOk] = useState(sessionStorage.getItem('admin_ok') === '1');
  const [password, setPassword] = useState('');
  if (ok) return <AdminDashboard />;
  return <div className="card"><h2>Admin Access</h2><input type="password" placeholder="Admin password" value={password} onChange={(e)=>setPassword(e.target.value)} /><button onClick={()=>{ if (password===ADMIN_PASSWORD) { sessionStorage.setItem('admin_ok','1'); setOk(true); } }}>Unlock</button></div>;
}

function AdminDashboard() {
  const nav = useNavigate();
  const { matches, matchDays } = useData();
  const [stressBusy, setStressBusy] = useState(false);
  const [stressMessage, setStressMessage] = useState('');
  const canStress = import.meta.env.DEV;
  return <div className="card"><h2>Admin Dashboard</h2><div className="actions"><button onClick={()=>nav('/admin/add-match')}>Add New Match</button><button onClick={()=>nav('/admin/players')}>Manage Players</button><button onClick={()=>nav('/admin/matchdays')}>Manage Match Days</button><button onClick={()=>{sessionStorage.removeItem('admin_ok'); location.href='/admin';}}>Lock</button></div>
  {canStress && <div className="actions"><button disabled={stressBusy} onClick={async()=>{setStressBusy(true); setStressMessage('Generating stress dataset...'); const res = await createDevStressData(); setStressMessage(res.ok ? `Added ${res.matchdays} matchdays / ${res.matches} matches / ${res.rows} player rows.` : (res.reason || 'Failed to generate data.')); setStressBusy(false);}}>Generate 20 Stress Matches (Dev Only)</button><button disabled={stressBusy} onClick={async()=>{setStressBusy(true); setStressMessage('Removing stress dataset...'); const res = await clearDevStressData(); setStressMessage(`Removed ${res.removedMatchdays} matchdays / ${res.removedMatches} matches.`); setStressBusy(false);}}>Clear Stress Data</button></div>}
  {canStress && stressMessage && <p className="muted">{stressMessage}</p>}
  <p>{matchDays.length} match days tracked</p>
  <h3>Recent Uploaded Matches</h3>{[...matches].slice(-8).reverse().map((m)=><div className="row" key={m.id}><span>{m.date} {m.map}</span><span>{m.duplicateMarked ? 'Duplicate Marked' : ''}</span><span><button onClick={()=>nav(`/admin/edit-match/${m.id}`)}>Edit</button></span></div>)}</div>;
}

function matchFormInitial() { return { seasonId: 0, matchDayId: 0, date: '', map: '', teamAName: teamNames[0], teamBName: teamNames[1], teamAScore: 13, teamBScore: 10, winningTeam: 'Side A', notes: '' }; }

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pickDistinctPlayerIds(playerIds: number[], count: number) {
  const copy = [...playerIds];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  if (copy.length >= count) return copy.slice(0, count);
  const out = [...copy];
  while (out.length < count) out.push(copy[out.length % Math.max(1, copy.length)]);
  return out;
}

async function createDevStressData() {
  const players = await db.players.toArray();
  const seasons = await db.seasons.toArray();
  const matchDays = await db.match_days.orderBy('eventDate').toArray();
  if (!players.length || players.length < 8 || !seasons.length) return { ok: false, reason: 'Need at least 8 players and 1 season.' };
  const seasonId = seasons.find((s) => s.isCurrent)?.id || seasons[0].id;
  if (!seasonId) return { ok: false, reason: 'No season found.' };

  const latestDate = matchDays.length ? matchDays[matchDays.length - 1].eventDate : new Date().toISOString().slice(0, 10);
  const maps = ['Mirage', 'Inferno', 'Ancient', 'Dust II', 'Nuke', 'Anubis', 'Vertigo'];
  const playerIds = players.map((p) => p.id).filter((id): id is number => Number.isFinite(id));

  const newRows: MatchPlayer[] = [];
  const knifeRows: Array<{ matchId: number; attackerPlayerId: number; victimPlayerId: number; createdAt: string }> = [];

  for (let md = 1; md <= 5; md += 1) {
    const eventDate = addDays(latestDate, md * 7);
    const matchDayId = await db.match_days.add({
      seasonId,
      title: `Stress Matchday ${md}`,
      eventDate,
      notes: '[STRESS]',
      createdAt: new Date().toISOString()
    });

    for (let gm = 1; gm <= 4; gm += 1) {
      const map = maps[Math.floor(Math.random() * maps.length)];
      const teamAScore = 13;
      const teamBScore = [8, 9, 10, 11, 12, 13][Math.floor(Math.random() * 6)];
      const isDraw = teamBScore === 13;
      const winningTeam = isDraw ? 'Draw' : (teamAScore > teamBScore ? 'Side A' : 'Side B');
      const matchId = await db.matches.add({
        seasonId,
        matchDayId: matchDayId as number,
        date: eventDate,
        map,
        teamAName: 'Side A',
        teamBName: 'Side B',
        teamAScore,
        teamBScore,
        winningTeam,
        notes: '[STRESS]',
        createdAt: new Date().toISOString(),
        duplicateMarked: false
      });

      const selected = pickDistinctPlayerIds(playerIds, 10);
      const sideA = selected.slice(0, 5);
      const sideB = selected.slice(5, 10);
      const sideAResult: MatchResult = winningTeam === 'Draw' ? 'DRAW' : (winningTeam === 'Side A' ? 'WIN' : 'LOSS');
      const sideBResult: MatchResult = winningTeam === 'Draw' ? 'DRAW' : (winningTeam === 'Side B' ? 'WIN' : 'LOSS');

      const makeRow = (pid: number, team: string, result: MatchResult): MatchPlayer => {
        const kills = Math.floor(6 + Math.random() * 24);
        const deaths = Math.floor(8 + Math.random() * 15);
        const assists = Math.floor(Math.random() * 10);
        const hsPercent = Math.floor(15 + Math.random() * 55);
        const damage = Math.floor(kills * (85 + Math.random() * 45));
        const mvps = Math.floor(Math.random() * 4);
        return {
          matchId: matchId as number,
          playerId: pid,
          team,
          result,
          kills,
          deaths,
          assists,
          damage,
          hsPercent,
          mvps,
          points: 0
        };
      };

      const matchRows = [
        ...sideA.map((pid) => makeRow(pid, 'Side A', sideAResult)),
        ...sideB.map((pid) => makeRow(pid, 'Side B', sideBResult))
      ].map((r) => ({ ...r, points: calculatePoints(r) }));
      newRows.push(...matchRows);

      if (Math.random() > 0.35) {
        const attackerPlayerId = selected[Math.floor(Math.random() * selected.length)];
        let victimPlayerId = selected[Math.floor(Math.random() * selected.length)];
        if (victimPlayerId === attackerPlayerId) victimPlayerId = selected[(selected.indexOf(victimPlayerId) + 1) % selected.length];
        knifeRows.push({
          matchId: matchId as number,
          attackerPlayerId,
          victimPlayerId,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  await db.match_players.bulkAdd(newRows);
  if (knifeRows.length) await db.knife_events.bulkAdd(knifeRows);
  return { ok: true, matchdays: 5, matches: 20, rows: newRows.length };
}

async function clearDevStressData() {
  const stressMatchDays = (await db.match_days.toArray()).filter((d) => (d.notes || '').includes('[STRESS]') || d.title.startsWith('Stress Matchday'));
  const stressMatchDayIds = new Set(stressMatchDays.map((d) => d.id).filter((id): id is number => Number.isFinite(id)));
  const stressMatches = (await db.matches.toArray()).filter((m) => (m.notes || '').includes('[STRESS]') || (m.matchDayId ? stressMatchDayIds.has(m.matchDayId) : false));
  const stressMatchIds = new Set(stressMatches.map((m) => m.id).filter((id): id is number => Number.isFinite(id)));

  const stressRowIds = (await db.match_players.toArray()).filter((r) => stressMatchIds.has(r.matchId)).map((r) => r.id).filter((id): id is number => Number.isFinite(id));
  const stressKnifeIds = (await db.knife_events.toArray()).filter((k) => stressMatchIds.has(k.matchId)).map((k) => k.id).filter((id): id is number => Number.isFinite(id));

  if (stressRowIds.length) await db.match_players.bulkDelete(stressRowIds);
  if (stressKnifeIds.length) await db.knife_events.bulkDelete(stressKnifeIds);
  if (stressMatchIds.size) await db.matches.bulkDelete([...stressMatchIds]);
  if (stressMatchDayIds.size) await db.match_days.bulkDelete([...stressMatchDayIds]);

  return { ok: true, removedMatches: stressMatchIds.size, removedMatchdays: stressMatchDayIds.size };
}

function AddOrEditMatch({ edit }: { edit?: Match }) {
  const nav = useNavigate();
  const { players, seasons, matches, matchDays } = useData();
  const existingRows = useLiveQuery<MatchPlayer[]>(() => edit?.id ? db.match_players.where('matchId').equals(edit.id).toArray() : [], [edit?.id]) || [];
  const [form, setForm] = useState<any>(edit || matchFormInitial());
  const [rows, setRows] = useState<any[]>([]);
  useEffect(()=>{ if (seasons[0] && !form.seasonId) setForm((f:any)=>({ ...f, seasonId: seasons.find((s)=>s.isCurrent)?.id || seasons[0].id })); },[seasons]);
  useEffect(()=>{ if (matchDays[0] && !form.matchDayId) setForm((f:any)=>({ ...f, matchDayId: matchDays[matchDays.length-1].id })); },[matchDays]);
  useEffect(()=>{ if (edit && existingRows.length) setRows(existingRows.map((r)=>({ ...r }))); },[edit, existingRows.length]);
  const possibleDup = matches.find((m)=>m.id!==edit?.id && m.date===form.date && m.map===form.map && m.teamAScore===Number(form.teamAScore) && m.teamBScore===Number(form.teamBScore));
  const addRows = () => {
    const base = players.slice(0,10).map((p,idx)=>({ playerId: p.id, team: idx<5?form.teamAName:form.teamBName, result: idx<5?'WIN':'LOSS', kills:0,deaths:0,assists:0,damage:0,hsPercent:0,mvps:0 }));
    setRows(base);
  };
  const save = async () => {
    const matchData: Match = { ...form, teamAScore:Number(form.teamAScore), teamBScore:Number(form.teamBScore), duplicateMarked: !!possibleDup, createdAt: edit?.createdAt || new Date().toISOString() };
    const matchId = edit?.id ? edit.id : await db.matches.add(matchData);
    if (edit?.id) await db.matches.update(edit.id, matchData);
    await db.match_players.where('matchId').equals(matchId as number).delete();
    await db.match_players.bulkAdd(rows.map((r)=>({ ...r, matchId, points: calculatePoints(r) })));
    nav('/admin');
  };
  return <div className="card"><h2>{edit ? 'Edit Match' : 'Add Match'}</h2>{possibleDup && <p className="warn">Duplicate warning: similar match found on {possibleDup.date} ({possibleDup.map}).</p>}
  <div className="form-grid">
  <input placeholder="date" value={form.date || ''} onChange={(e)=>setForm({ ...form, date: e.target.value })} />
  <input placeholder="map" value={form.map || ''} onChange={(e)=>setForm({ ...form, map: e.target.value })} />
  <input placeholder="notes" value={form.notes || ''} onChange={(e)=>setForm({ ...form, notes: e.target.value })} />
  <input placeholder="Side A label (optional)" value={form.teamAName || ''} onChange={(e)=>setForm({ ...form, teamAName: e.target.value })} />
  <input placeholder="Side B label (optional)" value={form.teamBName || ''} onChange={(e)=>setForm({ ...form, teamBName: e.target.value })} />
  <select value={form.winningTeam} onChange={(e)=>setForm({ ...form, winningTeam: e.target.value })}>
    <option value="Side A">Side A</option>
    <option value="Side B">Side B</option>
    <option value="Draw">Draw</option>
  </select>
  <select value={form.matchDayId} onChange={(e)=>setForm({ ...form, matchDayId: Number(e.target.value) })}>{matchDays.map((m)=><option key={m.id} value={m.id}>{m.title}</option>)}</select>
  <input type="number" value={form.teamAScore} onChange={(e)=>setForm({ ...form, teamAScore: Number(e.target.value) })} placeholder="Side A score" />
  <input type="number" value={form.teamBScore} onChange={(e)=>setForm({ ...form, teamBScore: Number(e.target.value) })} placeholder="Side B score" />
  </div>
  <div className="actions"><button onClick={addRows}>Quick Add 10 Player Rows (5 per side)</button><button onClick={()=>setRows([...rows,{ playerId: players[0]?.id, team: form.teamAName || 'Side A', result: 'WIN', kills:0,deaths:0,assists:0,damage:0,hsPercent:0,mvps:0 }])}>Add Row</button></div>
  <div className="table-wrap"><table><thead><tr><th>Player</th><th>Side</th><th>Result</th><th>K</th><th>D</th><th>A</th><th>Damage</th><th>HS%</th></tr></thead><tbody>{rows.map((r,idx)=><tr key={idx}><td><select value={r.playerId} onChange={(e)=>{const n=[...rows];n[idx].playerId=Number(e.target.value);setRows(n);}}>{players.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td><td><select value={r.team} onChange={(e)=>{const n=[...rows];n[idx].team=e.target.value;setRows(n);}}><option value={form.teamAName || 'Side A'}>{form.teamAName || 'Side A'}</option><option value={form.teamBName || 'Side B'}>{form.teamBName || 'Side B'}</option></select></td><td><select value={r.result} onChange={(e)=>{const n=[...rows];n[idx].result=e.target.value as MatchResult;setRows(n);}}><option>WIN</option><option>LOSS</option><option>DRAW</option></select></td>{['kills','deaths','assists','damage','hsPercent'].map((k)=><td key={k}><input type="number" value={r[k] ?? 0} onChange={(e)=>{const n=[...rows];n[idx][k]=Number(e.target.value);setRows(n);}}/></td>)}</tr>)}</tbody></table></div>
  <div className="actions"><button onClick={save}>Save Match</button></div></div>;
}

function ManageMatchDays() {
  const { seasons } = useData();
  const matchDays = useLiveQuery(()=>db.match_days.orderBy('eventDate').reverse().toArray(),[]) || [];
  const [title,setTitle] = useState('');
  const [date,setDate] = useState('');
  const currentSeasonId = seasons.find((s)=>s.isCurrent)?.id || seasons[0]?.id || 0;
  return <div className="card"><h2>Manage Match Days</h2>
    <div className="actions">
      <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Match day title" />
      <input value={date} onChange={(e)=>setDate(e.target.value)} type="date" />
      <button onClick={async()=>{ if(!title || !date || !currentSeasonId) return; await db.match_days.add({ title, eventDate: date, seasonId: currentSeasonId, createdAt: new Date().toISOString() }); setTitle(''); setDate(''); }}>Create Match Day</button>
    </div>
    {matchDays.map((md)=><div key={md.id} className="row"><span>{md.title} ({md.eventDate})</span><button onClick={async()=>{const n=prompt('Rename match day', md.title); if(n) await db.match_days.update(md.id!, { title:n });}}>Rename</button></div>)}
  </div>;
}

function EditMatchPage() { const { id } = useParams(); const m = useLiveQuery(()=>db.matches.get(Number(id)), [id]); if (!m) return <div className="card">Loading...</div>; return <AddOrEditMatch edit={m} />; }

function ManagePlayers() {
  const players = useLiveQuery(()=>db.players.toArray(),[]) || [];
  const aliases = useLiveQuery(()=>db.player_aliases.toArray(),[]) || [];
  const rows = useLiveQuery(()=>db.match_players.toArray(),[]) || [];
  const [name,setName]=useState('');
  return <div className="card"><h2>Manage Players</h2><div className="actions"><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Player name"/><button onClick={async()=>{if(!name.trim()) return; await db.players.add({name,createdAt:new Date().toISOString()}); setName('');}}>Add</button></div>
  {players.map((p)=><div className="row" key={p.id}><span>{p.name} ({aliases.filter((a)=>a.playerId===p.id).map((a)=>a.alias).join(', ') || 'No aliases'})</span><span><button onClick={async()=>{const n=prompt('New name',p.name); if(n) await db.players.update(p.id!,{name:n});}}>Rename</button><button onClick={async()=>{const a=prompt('Alias'); if(a) await db.player_aliases.add({playerId:p.id!,alias:a});}}>Add Alias</button><button disabled={rows.some((r)=>r.playerId===p.id)} onClick={async()=>{await db.players.delete(p.id!);}}>Delete</button></span></div>)}
  </div>;
}

export default function App() {
  useEffect(() => { seedIfEmpty(); }, []);
  return <Layout><Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/leaderboard" element={<Leaderboard />} />
    <Route path="/matches" element={<MatchHistory />} />
    <Route path="/matches/:id" element={<MatchDetail />} />
    <Route path="/players" element={<Players />} />
    <Route path="/players/:id" element={<PlayerProfile />} />
    <Route path="/stats" element={<StatsPage />} />
    <Route path="/admin" element={<AdminGate />} />
    <Route path="/admin/add-match" element={<AddOrEditMatch />} />
    <Route path="/admin/edit-match/:id" element={<EditMatchPage />} />
    <Route path="/admin/players" element={<ManagePlayers />} />
    <Route path="/admin/matchdays" element={<ManageMatchDays />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></Layout>;
}



