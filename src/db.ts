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
    this.version(4).stores({
      players: '++id, name',
      player_aliases: '++id, playerId, alias',
      seasons: '++id, name, isCurrent',
      match_days: '++id, seasonId, eventDate, title, [seasonId+eventDate]',
      matches: '++id, seasonId, matchDayId, date, map, duplicateMarked, [matchDayId+date], [date+map]',
      match_players: '++id, matchId, playerId, result, team, [matchId+playerId], [playerId+matchId]',
      knife_events: '++id, matchId, attackerPlayerId, victimPlayerId, [attackerPlayerId+victimPlayerId], [victimPlayerId+attackerPlayerId]'
    });
  }
}

export const db = new LeagueDb();
const now = () => new Date().toISOString();
const rp = (r: MatchResult) => (r === 'WIN' ? 5 : r === 'DRAW' ? 3 : 1);
const points = (r: MatchResult, k: number, a: number, d: number) => rp(r) + k + a * 0.5 - d * 0.5;

type RawPlayerRow = {
  name: string;
  team: 'Side A' | 'Side B';
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
  hsPercent: number;
  damage: number;
  utilityDamage?: number;
  enemyFlashed?: number;
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

type ImportedKnife = {
  date: string;
  map: string;
  attacker: string;
  victim: string;
};

const importedMatches: RawMatch[] = [
  {
    date: '2026-05-28', matchDayTitle: 'War Wednesday - May 28, 2026', map: 'Mirage', teamAScore: 13, teamBScore: 10, winningTeam: 'Side A',
    rows: [
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 27, deaths: 16, assists: 5, hsPercent: 18, damage: 2937 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 21, deaths: 13, assists: 5, hsPercent: 38, damage: 2147 },
      { name: 'Aman', team: 'Side A', result: 'WIN', kills: 17, deaths: 15, assists: 3, hsPercent: 35, damage: 1750 },
      { name: 'fatal_destiny', team: 'Side A', result: 'WIN', kills: 17, deaths: 19, assists: 4, hsPercent: 58, damage: 1458 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 9, deaths: 15, assists: 5, hsPercent: 33, damage: 1343 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 21, deaths: 16, assists: 2, hsPercent: 33, damage: 2329 },
      { name: 'Hodor bitch!', team: 'Side B', result: 'LOSS', kills: 21, deaths: 19, assists: 5, hsPercent: 42, damage: 2199 },
      { name: 'aks289', team: 'Side B', result: 'LOSS', kills: 20, deaths: 19, assists: 6, hsPercent: 55, damage: 2078 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 12, deaths: 17, assists: 5, hsPercent: 33, damage: 1392 },
      { name: 'Mere Baap', team: 'Side B', result: 'LOSS', kills: 9, deaths: 17, assists: 2, hsPercent: 11, damage: 682 }
    ]
  },
  {
    date: '2026-05-28', matchDayTitle: 'War Wednesday - May 28, 2026', map: 'Dust II', teamAScore: 13, teamBScore: 3, winningTeam: 'Side A',
    rows: [
      { name: 'Manson', team: 'Side A', result: 'WIN', kills: 18, deaths: 10, assists: 7, hsPercent: 44, damage: 2185 },
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 19, deaths: 7, assists: 1, hsPercent: 26, damage: 1753 },
      { name: 'Bob Marde', team: 'Side A', result: 'WIN', kills: 17, deaths: 10, assists: 4, hsPercent: 29, damage: 1515 },
      { name: '!!EDaNgErBoYe!!', team: 'Side A', result: 'WIN', kills: 15, deaths: 6, assists: 2, hsPercent: 33, damage: 1352 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'WIN', kills: 13, deaths: 9, assists: 4, hsPercent: 38, damage: 1242 },
      { name: 'aks289', team: 'Side A', result: 'WIN', kills: 7, deaths: 11, assists: 3, hsPercent: 57, damage: 890 },
      { name: 'VPS', team: 'Side B', result: 'LOSS', kills: 11, deaths: 15, assists: 4, hsPercent: 45, damage: 1525 },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 10, deaths: 16, assists: 7, hsPercent: 30, damage: 1316 },
      { name: 'Aman', team: 'Side B', result: 'LOSS', kills: 7, deaths: 15, assists: 4, hsPercent: 57, damage: 1229 },
      { name: 'Radha', team: 'Side B', result: 'LOSS', kills: 14, deaths: 15, assists: 1, hsPercent: 57, damage: 1057 },
      { name: 'Voldemort', team: 'Side B', result: 'LOSS', kills: 5, deaths: 15, assists: 1, hsPercent: 60, damage: 708 },
      { name: 'Daa', team: 'Side B', result: 'LOSS', kills: 6, deaths: 14, assists: 0, hsPercent: 33, damage: 572 }
    ]
  },
  {
    date: '2026-05-28', matchDayTitle: 'War Wednesday - May 28, 2026', map: 'Ancient', teamAScore: 12, teamBScore: 12, winningTeam: 'Draw',
    rows: [
      { name: 'Manson', team: 'Side A', result: 'DRAW', kills: 20, deaths: 21, assists: 8, hsPercent: 25, damage: 2281 },
      { name: 'aks289', team: 'Side A', result: 'DRAW', kills: 24, deaths: 18, assists: 6, hsPercent: 20, damage: 2169 },
      { name: 'Bob Marde', team: 'Side A', result: 'DRAW', kills: 16, deaths: 19, assists: 8, hsPercent: 31, damage: 1892 },
      { name: '!!EDaNgErBoYe!!', team: 'Side A', result: 'DRAW', kills: 16, deaths: 19, assists: 6, hsPercent: 37, damage: 1767 },
      { name: 'Mere Baap', team: 'Side A', result: 'DRAW', kills: 14, deaths: 21, assists: 5, hsPercent: 21, damage: 1683 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'DRAW', kills: 15, deaths: 20, assists: 5, hsPercent: 6, damage: 1438 },
      { name: 'Aman', team: 'Side B', result: 'DRAW', kills: 21, deaths: 18, assists: 14, hsPercent: 23, damage: 2584 },
      { name: 'Radha', team: 'Side B', result: 'DRAW', kills: 22, deaths: 20, assists: 6, hsPercent: 27, damage: 2506 },
      { name: 'VPS', team: 'Side B', result: 'DRAW', kills: 26, deaths: 15, assists: 6, hsPercent: 30, damage: 2499 },
      { name: 'fatal_destiny', team: 'Side B', result: 'DRAW', kills: 18, deaths: 16, assists: 5, hsPercent: 55, damage: 1678 },
      { name: 'Voldemort', team: 'Side B', result: 'DRAW', kills: 14, deaths: 18, assists: 8, hsPercent: 42, damage: 1667 },
      { name: 'Daa', team: 'Side B', result: 'DRAW', kills: 17, deaths: 18, assists: 4, hsPercent: 23, damage: 1662 }
    ]
  },
  {
    date: '2026-05-28', matchDayTitle: 'War Wednesday - May 28, 2026', map: 'Inferno', teamAScore: 13, teamBScore: 8, winningTeam: 'Side A',
    rows: [
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 29, deaths: 14, assists: 3, hsPercent: 20, damage: 2861 },
      { name: 'Aman', team: 'Side A', result: 'WIN', kills: 23, deaths: 16, assists: 7, hsPercent: 56, damage: 2679 },
      { name: 'fatal_destiny', team: 'Side A', result: 'WIN', kills: 18, deaths: 12, assists: 5, hsPercent: 55, damage: 1905 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 13, deaths: 14, assists: 3, hsPercent: 38, damage: 1525 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 12, deaths: 14, assists: 5, hsPercent: 25, damage: 979 },
      { name: 'Daa', team: 'Side A', result: 'WIN', kills: 8, deaths: 14, assists: 3, hsPercent: 25, damage: 848 },
      { name: '!!EDaNgErBoYe!!', team: 'Side B', result: 'LOSS', kills: 15, deaths: 16, assists: 5, hsPercent: 20, damage: 1941 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 20, deaths: 18, assists: 1, hsPercent: 5, damage: 1805 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 16, deaths: 16, assists: 5, hsPercent: 25, damage: 1774 },
      { name: 'aks289', team: 'Side B', result: 'LOSS', kills: 14, deaths: 18, assists: 6, hsPercent: 35, damage: 1518 },
      { name: 'Mere Baap', team: 'Side B', result: 'LOSS', kills: 14, deaths: 16, assists: 1, hsPercent: 35, damage: 1221 },
      { name: 'Hodor bitch!', team: 'Side B', result: 'LOSS', kills: 5, deaths: 19, assists: 8, hsPercent: 40, damage: 1165 }
    ]
  }
];

const knifeSeed = [
  { matchMap: 'Mirage', attacker: 'Manson', victim: 'Aman' },
  { matchMap: 'Mirage', attacker: 'Manson', victim: 'VPS' },
  { matchMap: 'Inferno', attacker: 'Voldemort', victim: 'dangerboy' }
];

const june3MatchDayTitle = 'War Wednesday - June 3, 2026';
const june3Date = '2026-06-03';
const june3Matches: RawMatch[] = [
  {
    date: june3Date,
    matchDayTitle: june3MatchDayTitle,
    map: 'Inferno',
    teamAScore: 13,
    teamBScore: 10,
    winningTeam: 'Side A',
    rows: [
      { name: 'IB', team: 'Side A', result: 'WIN', kills: 22, deaths: 18, assists: 5, hsPercent: 4, damage: 2070 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 17, deaths: 17, assists: 5, hsPercent: 11, damage: 1518 },
      { name: 'Daa', team: 'Side A', result: 'WIN', kills: 16, deaths: 17, assists: 4, hsPercent: 18, damage: 1771 },
      { name: 'MAVERICK', team: 'Side A', result: 'WIN', kills: 18, deaths: 15, assists: 7, hsPercent: 50, damage: 2139 },
      { name: 'Jin', team: 'Side A', result: 'WIN', kills: 15, deaths: 21, assists: 3, hsPercent: 26, damage: 2070 },
      { name: 'Bob Marde', team: 'Side A', result: 'WIN', kills: 13, deaths: 19, assists: 8, hsPercent: 46, damage: 1932 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 10, deaths: 19, assists: 4, hsPercent: 20, damage: 1173 },
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 2, deaths: 3, assists: 1, hsPercent: 50, damage: 230 },
      { name: 'Mr. DJANGO', team: 'Side B', result: 'LOSS', kills: 35, deaths: 16, assists: 3, hsPercent: 37, damage: 3519 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 26, deaths: 14, assists: 5, hsPercent: 30, damage: 2438 },
      { name: '!!EDaNgErBoYe!!', team: 'Side B', result: 'LOSS', kills: 16, deaths: 15, assists: 6, hsPercent: 25, damage: 1794 },
      { name: 'DT', team: 'Side B', result: 'LOSS', kills: 17, deaths: 15, assists: 5, hsPercent: 47, damage: 1656 },
      { name: 'Radha', team: 'Side B', result: 'LOSS', kills: 13, deaths: 20, assists: 6, hsPercent: 38, damage: 1403 },
      { name: 'thomas', team: 'Side B', result: 'LOSS', kills: 10, deaths: 16, assists: 3, hsPercent: 50, damage: 1012 },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 5, deaths: 12, assists: 9, hsPercent: 40, damage: 989 }
    ]
  },
  {
    date: june3Date,
    matchDayTitle: june3MatchDayTitle,
    map: 'Dust II',
    teamAScore: 13,
    teamBScore: 6,
    winningTeam: 'Side A',
    rows: [
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 21, deaths: 11, assists: 4, hsPercent: 29, damage: 1862 },
      { name: 'Mr. DJANGO', team: 'Side A', result: 'WIN', kills: 24, deaths: 11, assists: 6, hsPercent: 54, damage: 2318 },
      { name: 'DT', team: 'Side A', result: 'WIN', kills: 22, deaths: 16, assists: 5, hsPercent: 26, damage: 2052 },
      { name: 'Manson', team: 'Side A', result: 'WIN', kills: 15, deaths: 20, assists: 3, hsPercent: 33, damage: 1387 },
      { name: 'thomas', team: 'Side A', result: 'WIN', kills: 14, deaths: 16, assists: 7, hsPercent: 25, damage: 1254 },
      { name: 'fatal_destiny', team: 'Side A', result: 'WIN', kills: 13, deaths: 18, assists: 0, hsPercent: 50, damage: 1102 },
      { name: 'MAVERICK', team: 'Side B', result: 'LOSS', kills: 24, deaths: 13, assists: 4, hsPercent: 44, damage: 2356 },
      { name: 'Jin', team: 'Side B', result: 'LOSS', kills: 26, deaths: 13, assists: 6, hsPercent: 32, damage: 2736 },
      { name: 'IB', team: 'Side B', result: 'LOSS', kills: 17, deaths: 25, assists: 0, hsPercent: 27, damage: 1482 },
      { name: 'Daa', team: 'Side B', result: 'LOSS', kills: 17, deaths: 27, assists: 0, hsPercent: 63, damage: 1463 },
      { name: 'VPS', team: 'Side B', result: 'LOSS', kills: 15, deaths: 26, assists: 5, hsPercent: 50, damage: 1235 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 10, deaths: 23, assists: 11, hsPercent: 14, damage: 931 },
      { name: 'Voldemort', team: 'Side B', result: 'LOSS', kills: 9, deaths: 21, assists: 0, hsPercent: 57, damage: 931 },
      { name: 'PeekaBoom', team: 'Side B', result: 'LOSS', kills: 9, deaths: 12, assists: 0, hsPercent: 33, damage: 285 },
      { name: '!!EDaNgErBoYe!!', team: 'Side A', result: 'WIN', kills: 11, deaths: 19, assists: 3, hsPercent: 57, damage: 1083 },
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 6, deaths: 16, assists: 0, hsPercent: 40, damage: 608 }
    ]
  },
  {
    date: june3Date,
    matchDayTitle: june3MatchDayTitle,
    map: 'Ancient',
    teamAScore: 13,
    teamBScore: 7,
    winningTeam: 'Side A',
    rows: [
      { name: 'Jin', team: 'Side A', result: 'WIN', kills: 29, deaths: 16, assists: 4, hsPercent: 24, damage: 2940 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 26, deaths: 11, assists: 5, hsPercent: 42, damage: 2300 },
      { name: 'IB', team: 'Side A', result: 'WIN', kills: 15, deaths: 16, assists: 8, hsPercent: 33, damage: 2140 },
      { name: 'MAVERICK', team: 'Side A', result: 'WIN', kills: 16, deaths: 12, assists: 4, hsPercent: 18, damage: 1400 },
      { name: 'Bob Marde', team: 'Side A', result: 'WIN', kills: 12, deaths: 14, assists: 9, hsPercent: 18, damage: 1660 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 13, deaths: 17, assists: 4, hsPercent: 30, damage: 1240 },
      { name: 'Daa', team: 'Side A', result: 'WIN', kills: 10, deaths: 13, assists: 4, hsPercent: 40, damage: 1220 },
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 9, deaths: 15, assists: 3, hsPercent: 33, damage: 1040 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 20, deaths: 17, assists: 8, hsPercent: 30, damage: 2260 },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 15, deaths: 18, assists: 9, hsPercent: 39, damage: 2140 },
      { name: 'Radha', team: 'Side B', result: 'LOSS', kills: 16, deaths: 18, assists: 4, hsPercent: 31, damage: 1660 },
      { name: 'Mr. DJANGO', team: 'Side B', result: 'LOSS', kills: 18, deaths: 15, assists: 5, hsPercent: 44, damage: 1800 },
      { name: 'DT', team: 'Side B', result: 'LOSS', kills: 13, deaths: 14, assists: 4, hsPercent: 30, damage: 1060 },
      { name: '!!EDaNgErBoYe!!', team: 'Side B', result: 'LOSS', kills: 11, deaths: 17, assists: 6, hsPercent: 18, damage: 1120 },
      { name: 'thomas', team: 'Side B', result: 'LOSS', kills: 11, deaths: 17, assists: 3, hsPercent: 36, damage: 1080 },
      { name: 'PeekaBoom', team: 'Side B', result: 'LOSS', kills: 8, deaths: 15, assists: 4, hsPercent: 12, damage: 780 }
    ]
  },
  {
    date: june3Date,
    matchDayTitle: june3MatchDayTitle,
    map: 'Mirage',
    teamAScore: 13,
    teamBScore: 10,
    winningTeam: 'Side A',
    rows: [
      { name: 'Mr. DJANGO', team: 'Side A', result: 'WIN', kills: 37, deaths: 15, assists: 9, hsPercent: 56, damage: 3519 },
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 29, deaths: 16, assists: 1, hsPercent: 48, damage: 2438 },
      { name: 'fatal_destiny', team: 'Side A', result: 'WIN', kills: 19, deaths: 17, assists: 6, hsPercent: 42, damage: 1794 },
      { name: 'Manson', team: 'Side A', result: 'WIN', kills: 19, deaths: 19, assists: 3, hsPercent: 42, damage: 1656 },
      { name: 'DT', team: 'Side A', result: 'WIN', kills: 15, deaths: 19, assists: 5, hsPercent: 6, damage: 1403 },
      { name: '!!EDaNgErBoYe!!', team: 'Side A', result: 'WIN', kills: 11, deaths: 14, assists: 3, hsPercent: 27, damage: 1012 },
      { name: 'PeekaBoom', team: 'Side A', result: 'WIN', kills: 11, deaths: 13, assists: 4, hsPercent: 9, damage: 1012 },
      { name: 'thomas', team: 'Side A', result: 'WIN', kills: 7, deaths: 19, assists: 7, hsPercent: 28, damage: 851 },
      { name: 'VPS', team: 'Side B', result: 'LOSS', kills: 30, deaths: 18, assists: 5, hsPercent: 46, damage: 3036 },
      { name: 'Jin', team: 'Side B', result: 'LOSS', kills: 31, deaths: 18, assists: 6, hsPercent: 29, damage: 3136 },
      { name: 'Daa', team: 'Side B', result: 'LOSS', kills: 18, deaths: 17, assists: 6, hsPercent: 40, damage: 2078 },
      { name: 'Voldemort', team: 'Side B', result: 'LOSS', kills: 15, deaths: 20, assists: 4, hsPercent: 53, damage: 1403 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 10, deaths: 18, assists: 6, hsPercent: 10, damage: 1136 },
      { name: 'MAVERICK', team: 'Side B', result: 'LOSS', kills: 11, deaths: 17, assists: 3, hsPercent: 9, damage: 1605 },
      { name: 'IB', team: 'Side B', result: 'LOSS', kills: 9, deaths: 21, assists: 7, hsPercent: 44, damage: 1800 },
      { name: 'Mere Baap', team: 'Side B', result: 'LOSS', kills: 8, deaths: 19, assists: 1, hsPercent: 50, damage: 714 }
    ]
  }
];

const june3KnifeSeed: ImportedKnife[] = [
  { date: june3Date, map: 'Inferno', attacker: 'Voldemort', victim: 'DT' },
  { date: june3Date, map: 'Inferno', attacker: 'Django', victim: 'Voldemort' },
  { date: june3Date, map: 'Ancient', attacker: 'Manson', victim: 'Mere Baap' }
];

const june11MatchDayTitle = 'War Wednesday - June 11, 2026';
const june11Date = '2026-06-11';
const june11Matches: RawMatch[] = [
  {
    date: june11Date,
    matchDayTitle: june11MatchDayTitle,
    map: 'Dust II',
    teamAScore: 13,
    teamBScore: 8,
    winningTeam: 'Side A',
    rows: [
      { name: 'Aman', team: 'Side A', result: 'WIN', kills: 29, deaths: 11, assists: 9, hsPercent: 31, damage: 3066, utilityDamage: 97, enemyFlashed: 7 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 21, deaths: 15, assists: 5, hsPercent: 42, damage: 2352, utilityDamage: 55, enemyFlashed: 0 },
      { name: 'DT', team: 'Side A', result: 'WIN', kills: 23, deaths: 18, assists: 4, hsPercent: 62, damage: 2373, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 13, deaths: 13, assists: 2, hsPercent: 38, damage: 1155, utilityDamage: 0, enemyFlashed: 23 },
      { name: 'thomas', team: 'Side A', result: 'WIN', kills: 12, deaths: 18, assists: 4, hsPercent: 41, damage: 1281, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Shire17', team: 'Side A', result: 'WIN', kills: 8, deaths: 15, assists: 2, hsPercent: 0, damage: 609, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Radha', team: 'Side B', result: 'LOSS', kills: 24, deaths: 16, assists: 3, hsPercent: 29, damage: 2352, utilityDamage: 0, enemyFlashed: 4 },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 15, deaths: 19, assists: 2, hsPercent: 46, damage: 1491, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Mere Baap', team: 'Side B', result: 'LOSS', kills: 16, deaths: 16, assists: 2, hsPercent: 37, damage: 1407, utilityDamage: 6, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 10, deaths: 19, assists: 8, hsPercent: 30, damage: 1260, utilityDamage: 186, enemyFlashed: 17 },
      { name: 'Hodor bitch!', team: 'Side B', result: 'LOSS', kills: 12, deaths: 18, assists: 1, hsPercent: 50, damage: 1260, utilityDamage: 0, enemyFlashed: 5 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 8, deaths: 19, assists: 5, hsPercent: 37, damage: 1323, utilityDamage: 0, enemyFlashed: 0 }
    ]
  },
  {
    date: june11Date,
    matchDayTitle: june11MatchDayTitle,
    map: 'Inferno',
    teamAScore: 13,
    teamBScore: 11,
    winningTeam: 'Side B',
    rows: [
      { name: 'Mere Baap', team: 'Side A', result: 'LOSS', kills: 22, deaths: 20, assists: 2, hsPercent: 27, damage: 2280, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Side A', result: 'LOSS', kills: 22, deaths: 20, assists: 2, hsPercent: 31, damage: 2136, utilityDamage: 350, enemyFlashed: 7 },
      { name: 'Manson', team: 'Side A', result: 'LOSS', kills: 20, deaths: 19, assists: 5, hsPercent: 46, damage: 2136, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Radha', team: 'Side A', result: 'LOSS', kills: 15, deaths: 21, assists: 5, hsPercent: 13, damage: 1896, utilityDamage: 16, enemyFlashed: 5 },
      { name: 'fatal_destiny', team: 'Side A', result: 'LOSS', kills: 11, deaths: 21, assists: 3, hsPercent: 54, damage: 1344, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'LOSS', kills: 12, deaths: 22, assists: 4, hsPercent: 66, damage: 1344, utilityDamage: 13, enemyFlashed: 9 },
      { name: 'Aman', team: 'Side B', result: 'WIN', kills: 26, deaths: 17, assists: 11, hsPercent: 26, damage: 3264, utilityDamage: 7, enemyFlashed: 9 },
      { name: 'DT', team: 'Side B', result: 'WIN', kills: 28, deaths: 18, assists: 5, hsPercent: 32, damage: 2664, utilityDamage: 132, enemyFlashed: 0 },
      { name: 'VPS', team: 'Side B', result: 'WIN', kills: 24, deaths: 15, assists: 7, hsPercent: 58, damage: 2520, utilityDamage: 64, enemyFlashed: 2 },
      { name: 'Voldemort', team: 'Side B', result: 'WIN', kills: 22, deaths: 15, assists: 5, hsPercent: 59, damage: 2064, utilityDamage: 230, enemyFlashed: 0 },
      { name: 'Shire17', team: 'Side B', result: 'WIN', kills: 13, deaths: 19, assists: 1, hsPercent: 23, damage: 1248, utilityDamage: 15, enemyFlashed: 0 },
      { name: 'thomas', team: 'Side B', result: 'WIN', kills: 7, deaths: 20, assists: 2, hsPercent: 42, damage: 840, utilityDamage: 0, enemyFlashed: 7 }
    ]
  },
  {
    date: june11Date,
    matchDayTitle: june11MatchDayTitle,
    map: 'Ancient',
    teamAScore: 13,
    teamBScore: 10,
    winningTeam: 'Side A',
    rows: [
      { name: 'DT', team: 'Side A', result: 'WIN', kills: 34, deaths: 21, assists: 6, hsPercent: 26, damage: 3105, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Aman', team: 'Side A', result: 'WIN', kills: 23, deaths: 19, assists: 8, hsPercent: 30, damage: 2438, utilityDamage: 0, enemyFlashed: 5 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 20, deaths: 19, assists: 6, hsPercent: 35, damage: 2093, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 10, deaths: 17, assists: 6, hsPercent: 50, damage: 989, utilityDamage: 140, enemyFlashed: 0 },
      { name: 'thomas', team: 'Side A', result: 'WIN', kills: 11, deaths: 19, assists: 3, hsPercent: 54, damage: 1288, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Shire17', team: 'Side A', result: 'WIN', kills: 11, deaths: 19, assists: 3, hsPercent: 36, damage: 1242, utilityDamage: 156, enemyFlashed: 0 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 35, deaths: 14, assists: 4, hsPercent: 34, damage: 2852, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Radha', team: 'Side B', result: 'LOSS', kills: 20, deaths: 20, assists: 2, hsPercent: 50, damage: 2116, utilityDamage: 0, enemyFlashed: 4 },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 15, deaths: 20, assists: 10, hsPercent: 28, damage: 1863, utilityDamage: 4, enemyFlashed: 0 },
      { name: 'Mere Baap', team: 'Side B', result: 'LOSS', kills: 12, deaths: 18, assists: 12, hsPercent: 33, damage: 1840, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Hodor bitch!', team: 'Side B', result: 'LOSS', kills: 13, deaths: 20, assists: 6, hsPercent: 46, damage: 1564, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 15, deaths: 18, assists: 6, hsPercent: 26, damage: 1449, utilityDamage: 93, enemyFlashed: 6 }
    ]
  },
  {
    date: june11Date,
    matchDayTitle: june11MatchDayTitle,
    map: 'Mirage',
    teamAScore: 13,
    teamBScore: 11,
    winningTeam: 'Side B',
    rows: [
      { name: 'Radha', team: 'Side A', result: 'LOSS', kills: 34, deaths: 14, assists: 3, hsPercent: 8, damage: 3624, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Manson', team: 'Side A', result: 'LOSS', kills: 22, deaths: 16, assists: 2, hsPercent: 22, damage: 2352, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Side A', result: 'LOSS', kills: 16, deaths: 14, assists: 4, hsPercent: 31, damage: 1704, utilityDamage: 0, enemyFlashed: 7 },
      { name: 'Mere Baap', team: 'Side A', result: 'LOSS', kills: 15, deaths: 16, assists: 2, hsPercent: 26, damage: 1824, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'LOSS', kills: 11, deaths: 20, assists: 5, hsPercent: 27, damage: 1152, utilityDamage: 36, enemyFlashed: 2 },
      { name: 'fatal_destiny', team: 'Side A', result: 'LOSS', kills: 8, deaths: 15, assists: 1, hsPercent: 37, damage: 960, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Aman', team: 'Side B', result: 'WIN', kills: 4, deaths: 19, assists: 3, hsPercent: 11, damage: 1850, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'DT', team: 'Side B', result: 'WIN', kills: 32, deaths: 14, assists: 2, hsPercent: 25, damage: 3120, utilityDamage: 58, enemyFlashed: 2 },
      { name: 'VPS', team: 'Side B', result: 'WIN', kills: 19, deaths: 20, assists: 3, hsPercent: 36, damage: 2016, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Shire17', team: 'Side B', result: 'WIN', kills: 15, deaths: 17, assists: 3, hsPercent: 20, damage: 1608, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Voldemort', team: 'Side B', result: 'WIN', kills: 9, deaths: 17, assists: 3, hsPercent: 11, damage: 1128, utilityDamage: 61, enemyFlashed: 0 },
      { name: 'thomas', team: 'Side B', result: 'WIN', kills: 5, deaths: 19, assists: 3, hsPercent: 0, damage: 552, utilityDamage: 0, enemyFlashed: 0 }
    ]
  }
];

const june11KnifeSeed: ImportedKnife[] = [
  { date: june11Date, map: 'Inferno', attacker: 'Bob Marde', victim: 'Voldemort' },
  { date: june11Date, map: 'Inferno', attacker: 'Manson', victim: 'Shire17' }
];

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function getOrCreatePlayerId(name: string) {
  const existing = await db.players.where('name').equals(name).first();
  if (existing?.id) return existing.id;
  return Number(await db.players.add({ name, createdAt: now() }));
}

async function importJune3DataIfMissing() {
  const flag = localStorage.getItem('cs2_imported_june3_match_cards_v1');
  const hasJune3 = await db.matches.where('date').equals(june3Date).count();
  if (flag === '1' || hasJune3 > 0) {
    localStorage.setItem('cs2_imported_june3_match_cards_v1', '1');
    return;
  }

  const season = await db.seasons.filter((s) => s.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const matchDayId = Number(await db.match_days.add({
    seasonId: Number(seasonId),
    title: june3MatchDayTitle,
    eventDate: june3Date,
    notes: 'Imported from June 3 screenshots',
    createdAt: now()
  }));

  const allNames = Array.from(new Set(june3Matches.flatMap((m) => m.rows.map((r) => r.name))));
  for (const name of allNames) {
    await getOrCreatePlayerId(name);
  }

  const djangoId = await getOrCreatePlayerId('Mr. DJANGO');
  await db.player_aliases.add({ playerId: djangoId, alias: 'Django' });

  const matchIdByMap = new Map<string, number>();
  for (const match of june3Matches) {
    const matchId = Number(await db.matches.add({
      seasonId: Number(seasonId),
      matchDayId,
      date: match.date,
      map: match.map,
      teamAName: 'Side A',
      teamBName: 'Side B',
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      winningTeam: match.winningTeam,
      notes: 'Imported from June 3 screenshots',
      createdAt: now()
    }));
    matchIdByMap.set(match.map, matchId);

    const rows = [];
    for (const row of match.rows) {
      rows.push({
        matchId,
        playerId: await getOrCreatePlayerId(row.name),
        team: row.team,
        result: row.result,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        damage: row.damage,
        hsPercent: row.hsPercent,
        mvps: 0,
        points: points(row.result, row.kills, row.assists, row.deaths)
      });
    }
    await db.match_players.bulkAdd(rows);
  }

  for (const ev of june3KnifeSeed) {
    const matchId = matchIdByMap.get(ev.map);
    if (!matchId) continue;
    const attackerId = await getOrCreatePlayerId(ev.attacker === 'Django' ? 'Mr. DJANGO' : ev.attacker);
    const victimId = await getOrCreatePlayerId(ev.victim);
    const existing = await db.knife_events
      .where('[attackerPlayerId+victimPlayerId]')
      .equals([attackerId, victimId])
      .count();
    if (!existing) {
      await db.knife_events.add({
        matchId,
        attackerPlayerId: attackerId,
        victimPlayerId: victimId,
        createdAt: now()
      });
    }
  }

  localStorage.setItem('cs2_imported_june3_match_cards_v1', '1');
}

async function importJune11DataIfMissing() {
  const flag = localStorage.getItem('cs2_imported_june11_match_cards_v1');
  const hasJune11 = await db.matches.where('date').equals(june11Date).count();
  if (flag === '1' || hasJune11 > 0) {
    localStorage.setItem('cs2_imported_june11_match_cards_v1', '1');
    return;
  }

  const season = await db.seasons.filter((s) => s.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const matchDayId = Number(await db.match_days.add({
    seasonId: Number(seasonId),
    title: june11MatchDayTitle,
    eventDate: june11Date,
    notes: 'Imported from June 11 screenshots',
    createdAt: now()
  }));

  const allNames = Array.from(new Set(june11Matches.flatMap((m) => m.rows.map((r) => r.name))));
  for (const name of allNames) {
    await getOrCreatePlayerId(name);
  }

  const matchIdByMap = new Map<string, number>();
  for (const match of june11Matches) {
    const matchId = Number(await db.matches.add({
      seasonId: Number(seasonId),
      matchDayId,
      date: match.date,
      map: match.map,
      teamAName: 'Side A',
      teamBName: 'Side B',
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      winningTeam: match.winningTeam,
      notes: match.map === 'Mirage' ? 'Imported from June 11 screenshots; some players logged out before the second screenshot.' : 'Imported from June 11 screenshots',
      createdAt: now()
    }));
    matchIdByMap.set(match.map, matchId);

    const rows = [];
    for (const row of match.rows) {
      rows.push({
        matchId,
        playerId: await getOrCreatePlayerId(row.name),
        team: row.team,
        result: row.result,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        damage: row.damage,
        hsPercent: row.hsPercent,
        mvps: 0,
        points: points(row.result, row.kills, row.assists, row.deaths)
      });
    }
    await db.match_players.bulkAdd(rows);
  }

  for (const ev of june11KnifeSeed) {
    const matchId = matchIdByMap.get(ev.map);
    if (!matchId) continue;
    const attackerId = await getOrCreatePlayerId(ev.attacker === 'Django' ? 'Mr. DJANGO' : ev.attacker);
    const victimId = await getOrCreatePlayerId(ev.victim);
    const existing = await db.knife_events
      .where('[attackerPlayerId+victimPlayerId]')
      .equals([attackerId, victimId])
      .count();
    if (!existing) {
      await db.knife_events.add({
        matchId,
        attackerPlayerId: attackerId,
        victimPlayerId: victimId,
        createdAt: now()
      });
    }
  }

  localStorage.setItem('cs2_imported_june11_match_cards_v1', '1');
}

async function mergeAmanAliasIfNeeded() {
  const aman = await db.players.where('name').equals('Aman').first();
  const aliasPlayer = await db.players.where('name').equals('amansanghv1').first();
  if (!aman?.id || !aliasPlayer?.id || aman.id === aliasPlayer.id) return;

  const aliasRows = await db.player_aliases.where('playerId').equals(aliasPlayer.id).toArray();
  if (aliasRows.length) {
    await db.player_aliases.bulkPut(aliasRows.map((row) => ({
      ...row,
      playerId: aman.id!
    })));
  }
  const hasAlias = await db.player_aliases
    .where('playerId')
    .equals(aman.id)
    .filter((row) => row.alias === 'amansanghv1')
    .count();
  if (!hasAlias) {
    await db.player_aliases.add({ playerId: aman.id, alias: 'amansanghv1' });
  }

  const rows = await db.match_players.where('playerId').equals(aliasPlayer.id).toArray();
  if (rows.length) {
    await Promise.all(rows.map((row) => db.match_players.update(row.id!, { playerId: aman.id! })));
  }

  const knifeAsAttacker = await db.knife_events.where('attackerPlayerId').equals(aliasPlayer.id).toArray();
  if (knifeAsAttacker.length) {
    await Promise.all(knifeAsAttacker.map((ev) => db.knife_events.update(ev.id!, { attackerPlayerId: aman.id! })));
  }
  const knifeAsVictim = await db.knife_events.where('victimPlayerId').equals(aliasPlayer.id).toArray();
  if (knifeAsVictim.length) {
    await Promise.all(knifeAsVictim.map((ev) => db.knife_events.update(ev.id!, { victimPlayerId: aman.id! })));
  }

  await db.players.delete(aliasPlayer.id);
}

async function repairJune3Dust2IfNeeded() {
  const match = await db.matches
    .where('[date+map]')
    .equals([june3Date, 'Dust II'])
    .first();
  if (!match || match.teamAScore === 13 && match.teamBScore === 6 && match.winningTeam === 'Side A') return;

  await db.matches.update(match.id!, {
    teamAScore: 13,
    teamBScore: 6,
    winningTeam: 'Side A'
  });

  const rows = await db.match_players.where('matchId').equals(match.id!).toArray();
  await Promise.all(rows.map((row) => db.match_players.update(row.id!, {
    result: row.team === 'Side A' ? 'WIN' : 'LOSS',
    points: points(row.team === 'Side A' ? 'WIN' : 'LOSS', row.kills, row.assists, row.deaths)
  })));
}

async function repairJune11UtilityStatsIfNeeded() {
  const match = await db.matches
    .where('[date+map]')
    .equals([june11Date, 'Mirage'])
    .first();
  if (!match) return;

  const bob = await db.players.where('name').equals('Bob Marde').first();
  if (!bob?.id) return;

  const row = await db.match_players
    .where('[matchId+playerId]')
    .equals([match.id!, bob.id])
    .first();
  if (!row) return;

  const utilityDamage = Number((row as MatchPlayer).utilityDamage || 0);
  const enemyFlashed = Number((row as MatchPlayer).enemyFlashed || 0);
  if (utilityDamage === 0 && enemyFlashed === 7) return;

  await db.match_players.update(row.id!, {
    utilityDamage: 0,
    enemyFlashed: 7
  });
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
        damage: r.damage,
        hsPercent: r.hsPercent,
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
  const importedFlag = localStorage.getItem('cs2_imported_match_cards_v5');
  if (importedFlag !== '1') {
    await replaceWithImportedData();
    localStorage.setItem('cs2_imported_match_cards_v5', '1');
  }

  const count = await db.matches.count();
  if (count === 0) {
    await replaceWithImportedData();
  }

  await importJune3DataIfMissing();
  await repairJune3Dust2IfNeeded();
  await importJune11DataIfMissing();
  await repairJune11UtilityStatsIfNeeded();
  await mergeAmanAliasIfNeeded();
}
