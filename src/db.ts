import Dexie, { type Table } from 'dexie';
import type { KnifeEvent, Match, MatchDay, MatchPlayer, MatchResult, Player, PlayerAlias, Season } from './types';

export class LeagueDb extends Dexie {
  players!: Table<Player, number>;
  player_aliases!: Table<PlayerAlias, number>;
  seasons!: Table<Season, number>;
  matches!: Table<Match, number>;
  match_days!: Table<MatchDay, number>;
  match_players!: Table<MatchPlayer, number>;
  knife_events!: Table<KnifeEvent, number>;

  constructor() {
    super('cs2_friends_league_db');
    this.version(1).stores({
      players: '++id, name',
      player_aliases: '++id, playerId, alias',
      seasons: '++id, name, isCurrent',
      matches: '++id, seasonId, date, map, duplicateMarked',
      match_players: '++id, matchId, playerId, result, team'
    });
    this.version(2).stores({
      players: '++id, name',
      player_aliases: '++id, playerId, alias',
      seasons: '++id, name, isCurrent',
      matches: '++id, seasonId, date, map, duplicateMarked',
      match_players: '++id, matchId, playerId, result, team',
      knife_events: '++id, matchId, attackerPlayerId, victimPlayerId'
    });
    this.version(3).stores({
      players: '++id, name',
      player_aliases: '++id, playerId, alias',
      seasons: '++id, name, isCurrent',
      match_days: '++id, seasonId, eventDate, title',
      matches: '++id, seasonId, matchDayId, date, map, duplicateMarked',
      match_players: '++id, matchId, playerId, result, team',
      knife_events: '++id, matchId, attackerPlayerId, victimPlayerId'
    });
  }
}

export const db = new LeagueDb();
const now = () => new Date().toISOString();
const rp = (r: MatchResult) => (r === 'WIN' ? 10 : r === 'DRAW' ? 5 : 2);
const points = (r: MatchResult, k: number, a: number, d: number) => rp(r) + k + a * 0.5 - d * 0.5;

type RawPlayerRow = {
  name: string;
  team: 'Side A' | 'Side B';
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
};

type RawMatch = {
  date: string;
  matchDayTitle: string;
  map: string;
  teamAScore: number;
  teamBScore: number;
  winningTeam: string;
  rows: RawPlayerRow[];
};

const importedMatches: RawMatch[] = [
  {
    date: '2026-05-28', matchDayTitle: 'War Wednesday - May 28, 2026', map: 'Mirage', teamAScore: 13, teamBScore: 10, winningTeam: 'Side A',
    rows: [
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 27, deaths: 16, assists: 5 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 21, deaths: 13, assists: 5 },
      { name: 'Aman', team: 'Side A', result: 'WIN', kills: 17, deaths: 15, assists: 3 },
      { name: 'fatal_destiny', team: 'Side A', result: 'WIN', kills: 17, deaths: 19, assists: 4 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 9, deaths: 15, assists: 5 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 21, deaths: 16, assists: 2 },
      { name: 'Hodor bitch!', team: 'Side B', result: 'LOSS', kills: 21, deaths: 19, assists: 5 },
      { name: 'aks289', team: 'Side B', result: 'LOSS', kills: 20, deaths: 19, assists: 6 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 12, deaths: 17, assists: 5 },
      { name: 'Mere Baap', team: 'Side B', result: 'LOSS', kills: 9, deaths: 17, assists: 2 }
    ]
  },
  {
    date: '2026-05-28', matchDayTitle: 'War Wednesday - May 28, 2026', map: 'Dust II', teamAScore: 13, teamBScore: 3, winningTeam: 'Side A',
    rows: [
      { name: 'Manson', team: 'Side A', result: 'WIN', kills: 18, deaths: 10, assists: 7 },
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 19, deaths: 7, assists: 1 },
      { name: 'Bob Marde', team: 'Side A', result: 'WIN', kills: 17, deaths: 10, assists: 4 },
      { name: '!!EDaNgErBoYe!!', team: 'Side A', result: 'WIN', kills: 15, deaths: 6, assists: 2 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'WIN', kills: 13, deaths: 9, assists: 4 },
      { name: 'aks289', team: 'Side A', result: 'WIN', kills: 7, deaths: 11, assists: 3 },
      { name: 'VPS', team: 'Side B', result: 'LOSS', kills: 11, deaths: 15, assists: 4 },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 10, deaths: 16, assists: 7 },
      { name: 'Aman', team: 'Side B', result: 'LOSS', kills: 7, deaths: 15, assists: 4 },
      { name: 'Radha', team: 'Side B', result: 'LOSS', kills: 14, deaths: 15, assists: 1 },
      { name: 'Voldemort', team: 'Side B', result: 'LOSS', kills: 5, deaths: 15, assists: 1 },
      { name: 'Daa', team: 'Side B', result: 'LOSS', kills: 6, deaths: 14, assists: 0 }
    ]
  },
  {
    date: '2026-05-28', matchDayTitle: 'War Wednesday - May 28, 2026', map: 'Ancient', teamAScore: 12, teamBScore: 12, winningTeam: 'Draw',
    rows: [
      { name: 'Manson', team: 'Side A', result: 'DRAW', kills: 20, deaths: 21, assists: 8 },
      { name: 'aks289', team: 'Side A', result: 'DRAW', kills: 24, deaths: 18, assists: 6 },
      { name: 'Bob Marde', team: 'Side A', result: 'DRAW', kills: 16, deaths: 19, assists: 8 },
      { name: '!!EDaNgErBoYe!!', team: 'Side A', result: 'DRAW', kills: 16, deaths: 19, assists: 6 },
      { name: 'Mere Baap', team: 'Side A', result: 'DRAW', kills: 14, deaths: 21, assists: 5 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'DRAW', kills: 15, deaths: 20, assists: 5 },
      { name: 'Aman', team: 'Side B', result: 'DRAW', kills: 21, deaths: 18, assists: 14 },
      { name: 'Radha', team: 'Side B', result: 'DRAW', kills: 22, deaths: 20, assists: 6 },
      { name: 'VPS', team: 'Side B', result: 'DRAW', kills: 26, deaths: 15, assists: 6 },
      { name: 'fatal_destiny', team: 'Side B', result: 'DRAW', kills: 18, deaths: 16, assists: 5 },
      { name: 'Voldemort', team: 'Side B', result: 'DRAW', kills: 14, deaths: 18, assists: 8 },
      { name: 'Daa', team: 'Side B', result: 'DRAW', kills: 17, deaths: 18, assists: 4 }
    ]
  },
  {
    date: '2026-05-28', matchDayTitle: 'War Wednesday - May 28, 2026', map: 'Inferno', teamAScore: 13, teamBScore: 8, winningTeam: 'Side A',
    rows: [
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 29, deaths: 14, assists: 3 },
      { name: 'Aman', team: 'Side A', result: 'WIN', kills: 23, deaths: 16, assists: 7 },
      { name: 'fatal_destiny', team: 'Side A', result: 'WIN', kills: 18, deaths: 12, assists: 5 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 13, deaths: 14, assists: 3 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 12, deaths: 14, assists: 5 },
      { name: 'Daa', team: 'Side A', result: 'WIN', kills: 8, deaths: 14, assists: 3 },
      { name: '!!EDaNgErBoYe!!', team: 'Side B', result: 'LOSS', kills: 15, deaths: 16, assists: 5 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 20, deaths: 18, assists: 1 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 16, deaths: 16, assists: 5 },
      { name: 'aks289', team: 'Side B', result: 'LOSS', kills: 14, deaths: 18, assists: 6 },
      { name: 'Mere Baap', team: 'Side B', result: 'LOSS', kills: 14, deaths: 16, assists: 1 },
      { name: 'Hodor bitch!', team: 'Side B', result: 'LOSS', kills: 5, deaths: 19, assists: 8 }
    ]
  }
];

const knifeSeed = [
  { matchMap: 'Mirage', attacker: 'Manson', victim: 'Aman' },
  { matchMap: 'Mirage', attacker: 'Manson', victim: 'VPS' },
  { matchMap: 'Inferno', attacker: 'Voldemort', victim: 'dangerboy' }
];

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function replaceWithImportedData() {
  await db.transaction('rw', [db.players, db.player_aliases, db.seasons, db.match_days, db.matches, db.match_players, db.knife_events], async () => {
    await db.knife_events.clear();
    await db.match_players.clear();
    await db.matches.clear();
    await db.match_days.clear();
    await db.player_aliases.clear();
    await db.players.clear();
    await db.seasons.clear();

    const seasonId = await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() });

    const uniqueNames = Array.from(new Set(importedMatches.flatMap((m) => m.rows.map((r) => r.name))));
    const playerIds = await db.players.bulkAdd(uniqueNames.map((name) => ({ name, createdAt: now() })), { allKeys: true });
    const playerIdByName = new Map<string, number>();
    uniqueNames.forEach((name, i) => playerIdByName.set(norm(name), Number(playerIds[i])));

    const dangerboyId = playerIdByName.get(norm('!!EDaNgErBoYe!!'));
    if (dangerboyId) {
      await db.player_aliases.bulkAdd([
        { playerId: dangerboyId, alias: 'Dangerboy' },
        { playerId: dangerboyId, alias: 'dangerboy' }
      ]);
    }

    const matchIdByMap = new Map<string, number>();
    const matchDayIdByTitle = new Map<string, number>();

    for (const m of importedMatches) {
      let matchDayId = matchDayIdByTitle.get(m.matchDayTitle);
      if (!matchDayId) {
        const createdId = await db.match_days.add({
          seasonId: Number(seasonId),
          title: m.matchDayTitle,
          eventDate: m.date,
          createdAt: now()
        });
        matchDayId = Number(createdId);
        matchDayIdByTitle.set(m.matchDayTitle, matchDayId);
      }

      const matchId = await db.matches.add({
        seasonId: Number(seasonId),
        matchDayId,
        date: m.date,
        map: m.map,
        teamAName: 'Side A',
        teamBName: 'Side B',
        teamAScore: m.teamAScore,
        teamBScore: m.teamBScore,
        winningTeam: m.winningTeam,
        notes: '',
        createdAt: now()
      });
      matchIdByMap.set(m.map, Number(matchId));

      await db.match_players.bulkAdd(m.rows.map((r) => ({
        matchId: Number(matchId),
        playerId: Number(playerIdByName.get(norm(r.name))),
        team: r.team,
        result: r.result,
        kills: r.kills,
        deaths: r.deaths,
        assists: r.assists,
        mvps: 0,
        points: points(r.result, r.kills, r.assists, r.deaths)
      })));
    }

    for (const ev of knifeSeed) {
      const matchId = matchIdByMap.get(ev.matchMap);
      const attackerId = playerIdByName.get(norm(ev.attacker));
      const victimId = playerIdByName.get(norm(ev.victim)) || (ev.victim.toLowerCase() === 'dangerboy' ? dangerboyId : undefined);
      if (matchId && attackerId && victimId) {
        await db.knife_events.add({
          matchId,
          attackerPlayerId: attackerId,
          victimPlayerId: victimId,
          createdAt: now()
        });
      }
    }
  });
}

export async function seedIfEmpty() {
  const importedFlag = localStorage.getItem('cs2_imported_match_cards_v4');
  if (importedFlag !== '1') {
    await replaceWithImportedData();
    localStorage.setItem('cs2_imported_match_cards_v4', '1');
    return;
  }

  const count = await db.matches.count();
  if (count === 0) {
    await replaceWithImportedData();
  }
}
