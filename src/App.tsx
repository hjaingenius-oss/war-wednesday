import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db, seedIfEmpty } from './db';
import { calculatePoints, safeKD } from './lib/scoring';
import {
  buildLeaderboardRows,
  calculateMatchValue,
  calculateTotalPointsForMatch
} from './selectors';
import type { Match, MatchPlayer, MatchResult } from './types';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'friendsleague';
const ADMIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true';

const fmt = (n: number) => Number(n.toFixed(2));
const fmt1 = (n: number) => Number(n.toFixed(1));
const pct = (n: number) => `${Math.round(n * 100)}%`;
const rank = ['#1 Legend', '#2 Elite', '#3 Pro'];
const teamNames = ['Side A', 'Side B'];

const playerName = (players: { id?: number; name: string }[], id: number) =>
  players.find((p) => p.id === id)?.name || 'Unknown';

function receiptText(players: { id?: number; name: string }[], attackerId: number, victimId: number) {
  return `${playerName(players, attackerId)} knifed ${playerName(players, victimId)}`;
}

function Layout({ children }: { children: React.ReactNode }) {
  return <div className="shell"><header><h1>War Wednesday</h1><nav>{['/','/leaderboard','/matches','/players'].map((p,i)=><NavLink key={p} to={p}>{['Dashboard','Leaderboard','Match History','Players'][i]}</NavLink>)}{ADMIN_ENABLED && <NavLink to="/admin">Admin</NavLink>}</nav></header><main>{children}</main></div>;
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
  const activeRows = leaderboard.allRows.filter((r) => r.matchesPlayed > 0);
  const leagueLeader = leaderboard.mainRows[0];
  const inForm = [...activeRows].sort((a, b) => b.formRating - a.formRating)[0];
  const topImpact = leaderboard.impactRows[0];
  const topFragger = [...rows].sort((a,b)=>b.kills-a.kills)[0];
  const bestKd = [...activeRows].sort((a,b)=>b.kd-a.kd)[0];
  const topKnifer = [...activeRows].sort((a, b) => b.knifeKills - a.knifeKills)[0];
  const bestPerf = [...rows].sort((a,b)=>calculateMatchValue(b)-calculateMatchValue(a))[0];
  const latestDay = matchDays[matchDays.length - 1];
  const leagueYear = latestDay?.eventDate.slice(0, 4) || String(new Date().getFullYear());
  const latestDayMatches = latestDay ? matches.filter((m) => m.matchDayId === latestDay.id) : [];
  const name = (id:number)=>playerName(players, id);
  return <>
    <section className="showcase">
      <div className="showcase-main">
        <p className="eyebrow">War Wednesday {leagueYear}</p>
        <h2>{latestDay?.title || 'Matchday HQ'}</h2>
        <div className="headline-stat">
          <span>League Leader</span>
          <strong>{leagueLeader?.name || 'TBD'}</strong>
          <small>{leagueLeader ? `${fmt1(leagueLeader.warRating)} War Rating` : 'No Regulars yet'}</small>
        </div>
        <div className="score-strip">
          {latestDayMatches.slice(0, 4).map((m) => <NavLink to={`/matches/${m.id}`} key={m.id}><span>{m.map}</span><b>{m.teamAScore}-{m.teamBScore}</b></NavLink>)}
        </div>
      </div>
      <aside className="receipts-board">
        <div className="receipts-head"><span>Knife Board</span><strong>{knifeEvents.length}</strong></div>
        <div className="receipt-stack">
          {knifeEvents.slice().reverse().map((e, i)=><div className="receipt-card" key={e.id}><span>#{i + 1}</span><b>{receiptText(players, e.attackerPlayerId, e.victimPlayerId)}</b></div>)}
        </div>
      </aside>
    </section>
    <section className="stats-grid">
      <div className="card stat kpi"><h3>Top Fragger</h3><p>{topFragger ? `${name(topFragger.playerId)} (${topFragger.kills} kills)` : '-'}</p></div>
      <div className="card stat kpi"><h3>Best K/D</h3><p>{bestKd ? `${bestKd.name} (${bestKd.kd})` : '-'}</p></div>
      <div className="card stat kpi"><h3>Most Knife Kills</h3><p>{topKnifer ? `${topKnifer.name} (${topKnifer.knifeKills})` : '-'}</p></div>
      <div className="card stat kpi"><h3>In Form</h3><p>{inForm ? `${inForm.name} (${fmt1(inForm.formRating)})` : '-'}</p></div>
      <div className="card stat kpi"><h3>Top Impact Player</h3><p>{topImpact ? `${topImpact.name} (${fmt1(topImpact.warRating)})` : '-'}</p></div>
      <div className="card stat kpi"><h3>Best Single Match</h3><p>{bestPerf ? `${name(bestPerf.playerId)} (${fmt1(calculateMatchValue(bestPerf))})` : '-'}</p></div>
    </section>
    <section className="grid2"><div className="card"><h3>Top 5 Main Ranked Board</h3>{leaderboard.mainRows.slice(0,5).map((r,i)=><div className="row" key={r.playerId}><span className={`rank-chip rank-${i+1}`}>{rank[i] || `#${i+1}`}</span><span>{r.name}</span><span>{fmt1(r.warRating)} WR</span></div>)}</div>
    <div className="card"><h3>Top 3 Impact Board</h3>{leaderboard.impactRows.slice(0,3).map((r)=><div className="row" key={r.playerId}><span className="category-badge">{r.category}</span><span>{r.name}</span><span>{fmt1(r.warRating)} WR</span></div>)}</div></section>
  </>;
}

function Leaderboard() {
  const { players, rows, matches, matchDays, knifeEvents } = useData();
  const [filter, setFilter] = useState('last10');
  const board = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, filter);
  return <div className="leaderboard-page"><div className="card"><h2>Leaderboard</h2><div className="actions"><select value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="last10">Last 10 matches</option><option value="last20">Last 20 matches</option><option value="all">All matches</option></select></div>
  <div className="helper-grid"><p><b>War Rating</b><br/>Main skill-adjusted ranking score based on matchday performance, recency, and attendance.</p><p><b>Form</b><br/>Recent performance over the player's last 3 matchdays. * means small sample.</p><p><b>Total Points</b><br/>Raw accumulated points. Rewards volume and attendance.</p></div></div>
  <section className="card"><h2>Main Ranked Board</h2><div className="table-wrap"><table><thead><tr><th>Rank</th><th>Player</th><th>War Rating</th><th>Form</th><th>Total Points</th><th>Attendance %</th><th>Matchdays Played</th><th>Matches Played</th><th>Win %</th><th>K/D</th><th>Kills</th><th>Deaths</th><th>Assists</th><th>Knife Kills</th><th>Category</th></tr></thead><tbody>
  {board.mainRows.map((r,i)=><tr key={r.playerId}><td><span className={`rank-chip rank-${i+1}`}>#{i+1}</span></td><td><NavLink to={`/players/${r.playerId}`}>{r.name}</NavLink></td><td className="war-cell">{fmt1(r.warRating)}</td><td>{fmt1(r.formRating)}{r.smallSample ? ' *' : ''}</td><td>{fmt(r.totalPoints)}</td><td>{pct(r.attendanceRate)}</td><td>{r.matchdaysPlayed}</td><td>{r.matchesPlayed}</td><td>{fmt1(r.winPct)}%</td><td>{r.kd}</td><td>{r.kills}</td><td>{r.deaths}</td><td>{r.assists}</td><td>{r.knifeKills}</td><td><span className="category-badge">{r.category}</span></td></tr>)}
  </tbody></table></div></section>
  <section className="card"><h2>Impact Board</h2><p className="muted">Highlights strong low-attendance and small-sample players without affecting official ranks.</p><div className="table-wrap"><table><thead><tr><th>Category</th><th>Player</th><th>War Rating</th><th>Form</th><th>Total Points</th><th>Attendance %</th><th>Matchdays Played</th><th>Matches Played</th><th>Win %</th><th>K/D</th><th>Knife Kills</th><th>Comparison</th></tr></thead><tbody>
  {board.impactRows.map((r)=><tr key={r.playerId}><td><span className="category-badge">{r.category}</span></td><td><NavLink to={`/players/${r.playerId}`}>{r.name}</NavLink></td><td className="war-cell">{fmt1(r.warRating)}</td><td>{fmt1(r.formRating)}{r.smallSample ? ' *' : ''}</td><td>{fmt(r.totalPoints)}</td><td>{pct(r.attendanceRate)}</td><td>{r.matchdaysPlayed}</td><td>{r.matchesPlayed}</td><td>{fmt1(r.winPct)}%</td><td>{r.kd}</td><td>{r.knifeKills}</td><td><span className="comparison-badge">{r.comparisonBadge}</span></td></tr>)}
  </tbody></table></div></section></div>;
}

function MatchHistory() {
  const { matches, rows, players, matchDays } = useData();
  const top = (id:number) => {
    const r = rows.filter((x)=>x.matchId===id).sort((a,b)=>b.kills-a.kills)[0];
    return r ? `${players.find((p)=>p.id===r.playerId)?.name} (${r.kills})` : '-';
  };
  const grouped = matchDays.map((md) => ({ day: md, games: matches.filter((m) => m.matchDayId === md.id) })).filter((g) => g.games.length > 0);
  return <div className="card"><h2>Match History</h2>
    {grouped.map((g) => <section key={g.day.id} className="matchday-panel"><h3>{g.day.title}</h3><p className="muted">{g.day.eventDate} / {g.games.length} matches</p><div className="table-wrap"><table><thead><tr><th>Date</th><th>Map</th><th>Score</th><th>Top Fragger</th><th>Detail</th></tr></thead><tbody>
    {g.games.map((m)=><tr key={m.id}><td>{m.date}</td><td>{m.map}</td><td>{m.teamAScore}-{m.teamBScore}</td><td>{top(m.id!)}</td><td><NavLink to={`/matches/${m.id}`}>Open</NavLink></td></tr>)}
    </tbody></table></div></section>)}
  </div>;
}

function MatchDetail() {
  const { id } = useParams();
  const { matches, rows, players, knifeEvents } = useData();
  const m = matches.find((x)=>String(x.id)===id);
  if (!m) return <div className="card">Match not found.</div>;
  const mr = rows.filter((r)=>r.matchId===m.id);
  const mk = knifeEvents.filter((k) => k.matchId === m.id);
  const teams = [...new Set(mr.map((x)=>x.team))];
  const topMatchValue = mr.length ? Math.max(...mr.map(calculateMatchValue)) : 0;
  const topKills = mr.length ? Math.max(...mr.map((r)=>r.kills)) : 0;
  const topKd = mr.length ? Math.max(...mr.map((r)=>safeKD(r.kills, r.deaths))) : 0;
  return <div className="card"><h2>{m.map} - {m.date}</h2><p>Final Score: {m.teamAName || 'Side A'} {m.teamAScore} - {m.teamBScore} {m.teamBName || 'Side B'}</p>
    {mk.length > 0 && <div className="receipts-board inline-receipts"><div className="receipts-head"><span>Knife Board</span><strong>{mk.length}</strong></div>{mk.map((k, i)=><div className="receipt-card" key={k.id}><span>#{i + 1}</span><b>{receiptText(players, k.attackerPlayerId, k.victimPlayerId)}</b></div>)}</div>}
    <div className="helper-grid"><p><b>Highest Match Value</b><br/>{mr.find((r)=>calculateMatchValue(r)===topMatchValue) ? `${playerName(players, mr.find((r)=>calculateMatchValue(r)===topMatchValue)!.playerId)} (${fmt1(topMatchValue)})` : '-'}</p><p><b>Top Fragger</b><br/>{mr.find((r)=>r.kills===topKills) ? `${playerName(players, mr.find((r)=>r.kills===topKills)!.playerId)} (${topKills})` : '-'}</p><p><b>Best K/D</b><br/>{mr.find((r)=>safeKD(r.kills,r.deaths)===topKd) ? `${playerName(players, mr.find((r)=>safeKD(r.kills,r.deaths)===topKd)!.playerId)} (${topKd})` : '-'}</p></div>
    {teams.map((t)=><div key={t}><h3>{t}</h3><div className="table-wrap"><table><thead><tr><th>Player</th><th>K</th><th>D</th><th>A</th><th>Total Points</th><th>Match Value</th></tr></thead><tbody>{mr.filter((r)=>r.team===t).map((r)=><tr key={r.id} className={[calculateMatchValue(r)===topMatchValue ? 'highlight-value' : '', r.kills===topKills ? 'highlight-kills' : '', safeKD(r.kills,r.deaths)===topKd ? 'highlight-kd' : ''].join(' ')}><td>{players.find((p)=>p.id===r.playerId)?.name}</td><td>{r.kills}</td><td>{r.deaths}</td><td>{r.assists}</td><td>{fmt(calculateTotalPointsForMatch(r))}</td><td className="war-cell">{fmt1(calculateMatchValue(r))}</td></tr>)}</tbody></table></div></div>)}
  </div>;
}

function Players() {
  const { players, rows, matches, matchDays, knifeEvents } = useData();
  const leaderboard = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, 'all');
  const board = [...leaderboard.mainRows, ...leaderboard.impactRows, ...leaderboard.inactiveRows].filter((r)=>r.matchesPlayed > 0);
  return <div className="cards">{board.map((p, i)=><NavLink key={p.playerId} to={`/players/${p.playerId}`} className="card player"><p className={`rank-chip rank-${i+1}`}>#{i+1}</p><h3>{p.name}</h3><p>{fmt1(p.warRating)} War Rating</p><p>{p.matchesPlayed} matches</p><p>{p.category}</p><p>K/D {p.kd}</p><p>Knifed {p.knifeKills}</p></NavLink>)}</div>;
}

function PlayerProfile() {
  const { id } = useParams();
  const { players, rows, matches, matchDays, knifeEvents } = useData();
  const pid = Number(id);
  const p = players.find((x)=>x.id===pid);
  if (!p) return <div className="card">Player not found.</div>;
  const board = buildLeaderboardRows(players, matchDays, matches, rows, knifeEvents, 'all');
  const profile = board.allRows.find((r)=>r.playerId===pid);
  const pr = rows.filter((r)=>r.playerId===pid);
  const kills = pr.reduce((s,r)=>s+r.kills,0), deaths = pr.reduce((s,r)=>s+r.deaths,0), assists=pr.reduce((s,r)=>s+r.assists,0), points=pr.reduce((s,r)=>s+calculateTotalPointsForMatch(r),0);
  const wins = pr.filter((r)=>r.result==='WIN').length, losses = pr.filter((r)=>r.result==='LOSS').length;
  const knifeKills = knifeEvents.filter((e) => e.attackerPlayerId === pid).length;
  const knifeDeaths = knifeEvents.filter((e) => e.victimPlayerId === pid).length;
  const trend = profile?.matchdayScores.map((s)=>({ match: s.date.slice(5), score: fmt1(s.score) })) || [];
  const knifeHistory = knifeEvents.filter((e) => e.attackerPlayerId === pid || e.victimPlayerId === pid).slice().reverse();
  const games10 = pr.filter((r) => r.kills >= 10).length;
  const games20 = pr.filter((r) => r.kills >= 20).length;
  const games30 = pr.filter((r) => r.kills >= 30).length;
  return <div className="card"><h2>{p.name}</h2>{profile && profile.category !== 'Regular' && profile.wouldRank && <p className="warn">Not officially ranked due to attendance, but would rank #{profile.wouldRank} among Regulars by War Rating.</p>}<section className="stats-grid"><div className="stat card"><h3>Category</h3><p>{profile?.category || 'Inactive'}</p></div><div className="stat card"><h3>War Rating</h3><p>{fmt1(profile?.warRating || 0)}</p></div><div className="stat card"><h3>Form</h3><p>{fmt1(profile?.formRating || 0)}</p></div><div className="stat card"><h3>Total Points</h3><p>{fmt(profile?.totalPoints || points)}</p></div><div className="stat card"><h3>Attendance</h3><p>{pct(profile?.attendanceRate || 0)}</p></div><div className="stat card"><h3>Matchdays</h3><p>{profile?.matchdaysPlayed || 0}</p></div><div className="stat card"><h3>Matches</h3><p>{pr.length}</p></div><div className="stat card"><h3>Wins/Losses</h3><p>{wins}/{losses}</p></div><div className="stat card"><h3>Win %</h3><p>{pr.length?fmt1((wins/pr.length)*100):0}%</p></div><div className="stat card"><h3>K/D</h3><p>{safeKD(kills,deaths)}</p></div><div className="stat card"><h3>Knifed</h3><p>{knifeKills}</p></div><div className="stat card"><h3>Got Knifed</h3><p>{knifeDeaths}</p></div></section>
  <p>Kills {kills} | Deaths {deaths} | Assists {assists}</p>
  <p>10+ Kill Games {games10} | 20+ Kill Games {games20} | 30+ Kill Games {games30}</p>
  {profile?.comparisonBadge && <p><span className="comparison-badge">{profile.comparisonBadge}</span></p>}
  <h3>Performance Trend</h3><div className="chart"><ResponsiveContainer width="100%" height={240}><LineChart data={trend}><XAxis dataKey="match"/><YAxis/><Tooltip/><Line type="monotone" dataKey="score" stroke="#b8ff2c"/></LineChart></ResponsiveContainer></div>
  <h3>Knife History</h3>{knifeHistory.map((e)=><div key={e.id} className="row"><span>{matches.find((m)=>m.id===e.matchId)?.map}</span><span>{receiptText(players, e.attackerPlayerId, e.victimPlayerId)}</span></div>)}
  <h3>Recent Matches</h3>{pr.slice(-5).reverse().map((r)=><div key={r.id} className="row"><span>{matches.find((m)=>m.id===r.matchId)?.date}</span><span>{matches.find((m)=>m.id===r.matchId)?.map}</span><span>{fmt(calculateTotalPointsForMatch(r))} Total Points</span></div>)}
  </div>;
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
  return <div className="card"><h2>Admin Dashboard</h2><div className="actions"><button onClick={()=>nav('/admin/add-match')}>Add New Match</button><button onClick={()=>nav('/admin/players')}>Manage Players</button><button onClick={()=>nav('/admin/matchdays')}>Manage Match Days</button><button onClick={()=>{sessionStorage.removeItem('admin_ok'); location.href='/admin';}}>Lock</button></div>
  <p>{matchDays.length} match days tracked</p>
  <h3>Recent Uploaded Matches</h3>{[...matches].slice(-8).reverse().map((m)=><div className="row" key={m.id}><span>{m.date} {m.map}</span><span>{m.duplicateMarked ? 'Duplicate Marked' : ''}</span><span><button onClick={()=>nav(`/admin/edit-match/${m.id}`)}>Edit</button></span></div>)}</div>;
}

function matchFormInitial() { return { seasonId: 0, matchDayId: 0, date: '', map: '', teamAName: teamNames[0], teamBName: teamNames[1], teamAScore: 13, teamBScore: 10, winningTeam: 'Side A', notes: '' }; }

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
    const base = players.slice(0,10).map((p,idx)=>({ playerId: p.id, team: idx<5?form.teamAName:form.teamBName, result: idx<5?'WIN':'LOSS', kills:0,deaths:0,assists:0,mvps:0 }));
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
  <div className="actions"><button onClick={addRows}>Quick Add 10 Player Rows (5 per side)</button><button onClick={()=>setRows([...rows,{ playerId: players[0]?.id, team: form.teamAName || 'Side A', result: 'WIN', kills:0,deaths:0,assists:0,mvps:0 }])}>Add Row</button></div>
  <div className="table-wrap"><table><thead><tr><th>Player</th><th>Side</th><th>Result</th><th>K</th><th>D</th><th>A</th></tr></thead><tbody>{rows.map((r,idx)=><tr key={idx}><td><select value={r.playerId} onChange={(e)=>{const n=[...rows];n[idx].playerId=Number(e.target.value);setRows(n);}}>{players.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></td><td><select value={r.team} onChange={(e)=>{const n=[...rows];n[idx].team=e.target.value;setRows(n);}}><option value={form.teamAName || 'Side A'}>{form.teamAName || 'Side A'}</option><option value={form.teamBName || 'Side B'}>{form.teamBName || 'Side B'}</option></select></td><td><select value={r.result} onChange={(e)=>{const n=[...rows];n[idx].result=e.target.value as MatchResult;setRows(n);}}><option>WIN</option><option>LOSS</option><option>DRAW</option></select></td>{['kills','deaths','assists'].map((k)=><td key={k}><input type="number" value={r[k]} onChange={(e)=>{const n=[...rows];n[idx][k]=Number(e.target.value);setRows(n);}}/></td>)}</tr>)}</tbody></table></div>
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
    <Route path="/admin" element={<AdminGate />} />
    <Route path="/admin/add-match" element={<AddOrEditMatch />} />
    <Route path="/admin/edit-match/:id" element={<EditMatchPage />} />
    <Route path="/admin/players" element={<ManagePlayers />} />
    <Route path="/admin/matchdays" element={<ManageMatchDays />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></Layout>;
}

