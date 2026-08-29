import Dexie, { type Table } from 'dexie';
import type { KnifeEvent, Match, MatchDay, MatchPlayer, MatchResult, Player, PlayerAlias, Season } from './types';
import { importedMatches as august2026DataPack } from './data/august-2026-matchdays';
import { importedMatches as august24DataPack } from './data/august-24-2026-matchday';

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
const deriveDamageFromAdr = (adr: number | null | undefined, roundsPlayed: number) =>
  adr == null || !Number.isFinite(adr) ? undefined : Math.round(adr * Math.max(1, roundsPlayed));

type RawPlayerRow = {
  name: string;
  team: string;
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
  hsPercent?: number | null;
  damage?: number | null;
  kd?: number | null;
  adr?: number | null;
  utilityDamage?: number | null;
  enemyFlashed?: number | null;
  mvps?: number | null;
  score?: number | null;
  displayName?: string;
  note?: string;
  gapFill?: boolean;
  scoringEligible?: boolean;
};

type RawMatch = {
  date: string;
  matchDayTitle: string;
  map: string;
  teamAScore: number;
  teamBScore: number;
  winningTeam: string;
  teamAName?: string;
  teamBName?: string;
  note?: string;
  rows: RawPlayerRow[];
};

type ImportedKnife = {
  date: string;
  map: string;
  attacker: string;
  victim: string;
  matchIndex?: number;
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
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 2, deaths: 3, assists: 1, hsPercent: 50, damage: 230, scoringEligible: false, note: 'Partial-game scoreboard row; excluded from scoring.' },
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
    winningTeam: 'Side A',
    rows: [
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 34, deaths: 14, assists: 3, hsPercent: 8, damage: 3624, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Manson', team: 'Side A', result: 'WIN', kills: 22, deaths: 16, assists: 2, hsPercent: 22, damage: 2352, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Side A', result: 'WIN', kills: 16, deaths: 14, assists: 4, hsPercent: 31, damage: 1704, utilityDamage: 0, enemyFlashed: 7 },
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 15, deaths: 16, assists: 2, hsPercent: 26, damage: 1824, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'WIN', kills: 11, deaths: 20, assists: 5, hsPercent: 27, damage: 1152, utilityDamage: 36, enemyFlashed: 2 },
      { name: 'fatal_destiny', team: 'Side A', result: 'WIN', kills: 8, deaths: 15, assists: 1, hsPercent: 37, damage: 960, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Aman', team: 'Side B', result: 'LOSS', kills: 4, deaths: 19, assists: 3, hsPercent: 11, damage: 1850, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'DT', team: 'Side B', result: 'LOSS', kills: 32, deaths: 14, assists: 2, hsPercent: 25, damage: 3120, utilityDamage: 58, enemyFlashed: 2 },
      { name: 'VPS', team: 'Side B', result: 'LOSS', kills: 19, deaths: 20, assists: 3, hsPercent: 36, damage: 2016, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Shire17', team: 'Side B', result: 'LOSS', kills: 15, deaths: 17, assists: 3, hsPercent: 20, damage: 1608, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Voldemort', team: 'Side B', result: 'LOSS', kills: 9, deaths: 17, assists: 3, hsPercent: 11, damage: 1128, utilityDamage: 61, enemyFlashed: 0 },
      { name: 'thomas', team: 'Side B', result: 'LOSS', kills: 5, deaths: 19, assists: 3, hsPercent: 0, damage: 552, utilityDamage: 0, enemyFlashed: 0 }
    ]
  }
];

const june11KnifeSeed: ImportedKnife[] = [
  { date: june11Date, map: 'Inferno', attacker: 'Bob Marde', victim: 'Voldemort' },
  { date: june11Date, map: 'Inferno', attacker: 'Manson', victim: 'Shire17' }
];

const june18KnifeSeed: ImportedKnife[] = [
  { date: '2026-06-18', map: 'Inferno', attacker: 'Voldemort', victim: 'IB' },
  { date: '2026-06-18', map: 'Dust II', attacker: 'Bob Marde', victim: 'VPS' }
];

const june18MatchDayTitle = 'War Wednesday - June 18, 2026';
const june18Date = '2026-06-18';
const june18Matches: RawMatch[] = [
  {
    date: june18Date,
    matchDayTitle: june18MatchDayTitle,
    map: 'Inferno',
    teamAName: 'CT',
    teamBName: 'T',
    teamAScore: 12,
    teamBScore: 12,
    winningTeam: 'Draw',
    rows: [
      { name: 'IB', team: 'CT', result: 'DRAW', kills: 30, deaths: 17, assists: 12, hsPercent: 46, damage: 153, utilityDamage: 318, enemyFlashed: 0, mvps: 6 },
      { name: 'VPS', team: 'CT', result: 'DRAW', kills: 21, deaths: 17, assists: 4, hsPercent: 28, damage: 100, utilityDamage: 24, enemyFlashed: 2, mvps: 1 },
      { name: 'Radha', team: 'CT', result: 'DRAW', kills: 22, deaths: 17, assists: 6, hsPercent: 4, damage: 101, utilityDamage: 1, enemyFlashed: 13, mvps: 2 },
      { name: 'Aks', team: 'CT', result: 'DRAW', kills: 19, deaths: 20, assists: 6, hsPercent: 42, damage: 86, utilityDamage: 2, enemyFlashed: 4, mvps: 2 },
      { name: '!!@DaNgErBoY@!!', team: 'CT', result: 'DRAW', kills: 11, deaths: 18, assists: 5, hsPercent: 27, damage: 38, utilityDamage: 94, enemyFlashed: 8, mvps: 1 },
      { name: 'Mere Baap', team: 'CT', result: 'DRAW', kills: 11, deaths: 19, assists: 1, hsPercent: 36, damage: 40, utilityDamage: 0, enemyFlashed: 0, mvps: 0 },
      { name: 'Xander', team: 'CT', result: 'DRAW', kills: 8, deaths: 18, assists: 2, hsPercent: 12, damage: 32, utilityDamage: 160, enemyFlashed: 0, mvps: 1 },
      { name: 'Mr. DJANGO', team: 'T', result: 'DRAW', kills: 31, deaths: 18, assists: 5, hsPercent: 41, damage: 142, utilityDamage: 58, enemyFlashed: 13, mvps: 4 },
      { name: '^Bang Bang>', team: 'T', result: 'DRAW', kills: 24, deaths: 16, assists: 6, hsPercent: 37, damage: 101, utilityDamage: 77, enemyFlashed: 17, mvps: 2 },
      { name: 'MAVERICK', team: 'T', result: 'DRAW', kills: 23, deaths: 15, assists: 4, hsPercent: 26, damage: 85, utilityDamage: 91, enemyFlashed: 1, mvps: 4 },
      { name: 'amansanghvi1', team: 'T', result: 'DRAW', kills: 14, deaths: 21, assists: 6, hsPercent: 42, damage: 59, utilityDamage: 0, enemyFlashed: 5, mvps: 1 },
      { name: 'Voldemort', team: 'T', result: 'DRAW', kills: 16, deaths: 16, assists: 2, hsPercent: 25, damage: 77, utilityDamage: 203, enemyFlashed: 0, mvps: 1 },
      { name: 'fatal_destiny', team: 'T', result: 'DRAW', kills: 8, deaths: 19, assists: 7, hsPercent: 62, damage: 55, utilityDamage: 0, enemyFlashed: 0, mvps: 0 },
      { name: 'Bob Marde', team: 'T', result: 'DRAW', kills: 9, deaths: 17, assists: 6, hsPercent: 44, damage: 45, utilityDamage: 210, enemyFlashed: 6, mvps: 0 },
    ]
  },
  {
    date: june18Date,
    matchDayTitle: june18MatchDayTitle,
    map: 'Dust II',
    teamAName: 'CT',
    teamBName: 'T',
    teamAScore: 13,
    teamBScore: 5,
    winningTeam: 'CT',
    rows: [
      { name: '^Bang Bang>', team: 'CT', result: 'WIN', kills: 22, deaths: 7, assists: 1, hsPercent: 54, damage: 111, utilityDamage: 0, enemyFlashed: 6, mvps: 3 },
      { name: 'Mr. DJANGO', team: 'CT', result: 'WIN', kills: 25, deaths: 11, assists: 6, hsPercent: 40, damage: 133, utilityDamage: 36, enemyFlashed: 24, mvps: 3 },
      { name: 'amansanghvi1', team: 'CT', result: 'WIN', kills: 16, deaths: 15, assists: 7, hsPercent: 25, damage: 108, utilityDamage: 0, enemyFlashed: 11, mvps: 2 },
      { name: 'fatal_destiny', team: 'CT', result: 'WIN', kills: 12, deaths: 13, assists: 6, hsPercent: 41, damage: 71, utilityDamage: 29, enemyFlashed: 0, mvps: 2 },
      { name: 'Bob Marde', team: 'CT', result: 'WIN', kills: 12, deaths: 11, assists: 5, hsPercent: 41, damage: 64, utilityDamage: 0, enemyFlashed: 20, mvps: 1 },
      { name: 'MAVERICK', team: 'CT', result: 'WIN', kills: 15, deaths: 10, assists: 0, hsPercent: 33, damage: 70, utilityDamage: 0, enemyFlashed: 12, mvps: 2 },
      { name: 'Voldemort', team: 'CT', result: 'WIN', kills: 7, deaths: 15, assists: 8, hsPercent: 28, damage: 69, utilityDamage: 129, enemyFlashed: 0, mvps: 0 },
      { name: 'VPS', team: 'T', result: 'LOSS', kills: 13, deaths: 17, assists: 5, hsPercent: 23, damage: 103, utilityDamage: 0, enemyFlashed: 6, mvps: 2 },
      { name: '!!@DaNgErBoY@!!', team: 'T', result: 'LOSS', kills: 14, deaths: 16, assists: 2, hsPercent: 21, damage: 79, utilityDamage: 11, enemyFlashed: 3, mvps: 0 },
      { name: 'Mere Baap', team: 'T', result: 'LOSS', kills: 15, deaths: 15, assists: 2, hsPercent: 46, damage: 85, utilityDamage: 0, enemyFlashed: 0, mvps: 0 },
      { name: 'Aks', team: 'T', result: 'LOSS', kills: 15, deaths: 15, assists: 1, hsPercent: 46, damage: 82, utilityDamage: 51, enemyFlashed: 4, mvps: 1 },
      { name: 'IB', team: 'T', result: 'LOSS', kills: 10, deaths: 15, assists: 1, hsPercent: 50, damage: 65, utilityDamage: 85, enemyFlashed: 0, mvps: 1 },
      { name: 'Radha', team: 'T', result: 'LOSS', kills: 7, deaths: 16, assists: 4, hsPercent: 28, damage: 51, utilityDamage: 4, enemyFlashed: 1, mvps: 1 },
      { name: 'Xander', team: 'T', result: 'LOSS', kills: 7, deaths: 15, assists: 2, hsPercent: 0, damage: 37, utilityDamage: 8, enemyFlashed: 0, mvps: 0 },
    ]
  },
  {
    date: june18Date,
    matchDayTitle: june18MatchDayTitle,
    map: 'Ancient',
    teamAName: 'CT',
    teamBName: 'T',
    teamAScore: 6,
    teamBScore: 13,
    winningTeam: 'T',
    rows: [
      { name: 'VPS', team: 'CT', result: 'LOSS', kills: 23, deaths: 15, assists: 3, hsPercent: 39, damage: 143, utilityDamage: 0, enemyFlashed: 0, mvps: 3 },
      { name: 'IB', team: 'CT', result: 'LOSS', kills: 16, deaths: 16, assists: 3, hsPercent: 25, damage: 91, utilityDamage: 62, enemyFlashed: 0, mvps: 2 },
      { name: 'Radha', team: 'CT', result: 'LOSS', kills: 9, deaths: 17, assists: 3, hsPercent: 55, damage: 58, utilityDamage: 78, enemyFlashed: 4, mvps: 1 },
      { name: '!!@DaNgErBoY@!!', team: 'CT', result: 'LOSS', kills: 9, deaths: 17, assists: 4, hsPercent: 44, damage: 67, utilityDamage: 19, enemyFlashed: 2, mvps: 0 },
      { name: 'Mere Baap', team: 'CT', result: 'LOSS', kills: 11, deaths: 18, assists: 0, hsPercent: 63, damage: 61, utilityDamage: 0, enemyFlashed: 1, mvps: 0 },
      { name: 'Aks', team: 'CT', result: 'LOSS', kills: 7, deaths: 19, assists: 3, hsPercent: 0, damage: 50, utilityDamage: 0, enemyFlashed: 2, mvps: 0 },
      { name: 'Xander', team: 'CT', result: 'LOSS', kills: 2, deaths: 16, assists: 1, hsPercent: 0, damage: 12, utilityDamage: 55, enemyFlashed: 0, mvps: 0 },
      { name: 'Mr. DJANGO', team: 'T', result: 'WIN', kills: 23, deaths: 10, assists: 7, hsPercent: 34, damage: 125, utilityDamage: 191, enemyFlashed: 5, mvps: 2 },
      { name: 'amansanghvi1', team: 'T', result: 'WIN', kills: 19, deaths: 10, assists: 2, hsPercent: 31, damage: 94, utilityDamage: 0, enemyFlashed: 10, mvps: 3 },
      { name: '^Bang Bang>', team: 'T', result: 'WIN', kills: 17, deaths: 10, assists: 9, hsPercent: 70, damage: 103, utilityDamage: 198, enemyFlashed: 21, mvps: 3 },
      { name: 'MAVERICK', team: 'T', result: 'WIN', kills: 18, deaths: 13, assists: 1, hsPercent: 33, damage: 91, utilityDamage: 138, enemyFlashed: 4, mvps: 1 },
      { name: 'fatal_destiny', team: 'T', result: 'WIN', kills: 15, deaths: 12, assists: 5, hsPercent: 20, damage: 86, utilityDamage: 0, enemyFlashed: 0, mvps: 3 },
      { name: 'Voldemort', team: 'T', result: 'WIN', kills: 15, deaths: 12, assists: 5, hsPercent: 26, damage: 82, utilityDamage: 222, enemyFlashed: 0, mvps: 1 },
      { name: 'Bob Marde', team: 'T', result: 'WIN', kills: 11, deaths: 10, assists: 4, hsPercent: 18, damage: 57, utilityDamage: 55, enemyFlashed: 13, mvps: 0 },
    ]
  },
];

const june24MatchDayTitle = 'War Wednesday - June 24, 2026';
const june24Date = '2026-06-24';
const june24Matches: RawMatch[] = [
  {
    date: june24Date,
    matchDayTitle: june24MatchDayTitle,
    map: 'Inferno',
    teamAScore: 10,
    teamBScore: 13,
    winningTeam: 'Side B',
    rows: [
      { name: 'Manson', team: 'Side A', result: 'LOSS', kills: 22, deaths: 17, assists: 3, mvps: 2, hsPercent: 31, damage: 2208, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'IB', team: 'Side A', result: 'LOSS', kills: 17, deaths: 21, assists: 8, mvps: 1, hsPercent: 5, damage: 1886, utilityDamage: 51, enemyFlashed: 0 },
      { name: '!!@DaNgErBoY@!!', team: 'Side A', result: 'LOSS', kills: 20, deaths: 15, assists: 3, mvps: 2, hsPercent: 25, damage: 1955, utilityDamage: 50, enemyFlashed: 4 },
      { name: 'Bob Marde', team: 'Side A', result: 'LOSS', kills: 11, deaths: 18, assists: 4, mvps: 1, hsPercent: 54, damage: 1219, utilityDamage: 66, enemyFlashed: 6 },
      { name: 'Mere Baap', team: 'Side A', result: 'LOSS', kills: 12, deaths: 20, assists: 3, mvps: 0, hsPercent: 33, damage: 1495, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Daa', team: 'Side A', result: 'LOSS', kills: 10, deaths: 20, assists: 5, mvps: 2, hsPercent: 30, damage: 1426, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Mr. DJANGO', team: 'Side A', result: 'LOSS', kills: 12, deaths: 4, assists: 2, mvps: 2, hsPercent: 41, damage: 1242, utilityDamage: 4, enemyFlashed: 0, scoringEligible: false, note: 'Partial-game row; joined or left during the game.' },
      { name: 'VPS', team: 'Side B', result: 'WIN', kills: 24, deaths: 15, assists: 6, mvps: 2, hsPercent: 29, damage: 2415, utilityDamage: 220, enemyFlashed: 0 },
      { name: 'amansanghvi1', team: 'Side B', result: 'WIN', kills: 19, deaths: 16, assists: 8, mvps: 2, hsPercent: 31, damage: 1863, utilityDamage: 0, enemyFlashed: 5 },
      { name: 'Aks', team: 'Side B', result: 'WIN', kills: 20, deaths: 21, assists: 6, mvps: 2, hsPercent: 60, damage: 2254, utilityDamage: 0, enemyFlashed: 7 },
      { name: 'DrKush', team: 'Side B', result: 'WIN', kills: 20, deaths: 11, assists: 7, mvps: 2, hsPercent: 35, damage: 1817, utilityDamage: 42, enemyFlashed: 10 },
      { name: 'Radha', team: 'Side B', result: 'WIN', kills: 19, deaths: 18, assists: 3, mvps: 2, hsPercent: 0, damage: 1978, utilityDamage: 0, enemyFlashed: 8 },
      { name: 'Voldemort', team: 'Side B', result: 'WIN', kills: 10, deaths: 18, assists: 3, mvps: 0, hsPercent: 50, damage: 1104, utilityDamage: 277, enemyFlashed: 0 },
      { name: 'thomas', team: 'Side B', result: 'WIN', kills: 2, deaths: 6, assists: 4, mvps: 0, hsPercent: 100, damage: 460, utilityDamage: 0, enemyFlashed: 0, scoringEligible: false, note: 'Partial-game row; joined or left during the game.' }
    ]
  },
  {
    date: june24Date,
    matchDayTitle: june24MatchDayTitle,
    map: 'Dust II',
    teamAScore: 13,
    teamBScore: 10,
    winningTeam: 'Side A',
    rows: [
      { name: 'thomas', team: 'Side A', result: 'WIN', kills: 26, deaths: 15, assists: 4, mvps: 1, hsPercent: 53, damage: 2346, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 22, deaths: 17, assists: 4, mvps: 1, hsPercent: 40, damage: 2369, utilityDamage: 60, enemyFlashed: 6 },
      { name: 'amansanghvi1', team: 'Side A', result: 'WIN', kills: 20, deaths: 15, assists: 8, mvps: 0, hsPercent: 45, damage: 1886, utilityDamage: 11, enemyFlashed: 4 },
      { name: 'Aks', team: 'Side A', result: 'WIN', kills: 16, deaths: 14, assists: 5, mvps: 2, hsPercent: 31, damage: 1748, utilityDamage: 147, enemyFlashed: 18 },
      { name: 'DrKush', team: 'Side A', result: 'WIN', kills: 12, deaths: 15, assists: 9, mvps: 0, hsPercent: 33, damage: 1725, utilityDamage: 55, enemyFlashed: 12 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 16, deaths: 14, assists: 8, mvps: 0, hsPercent: 18, damage: 1633, utilityDamage: 0, enemyFlashed: 18 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 15, deaths: 18, assists: 9, mvps: 1, hsPercent: 40, damage: 1840, utilityDamage: 301, enemyFlashed: 2 },
      { name: 'Mr. DJANGO', team: 'Side B', result: 'LOSS', kills: 25, deaths: 18, assists: 3, mvps: 0, hsPercent: 32, damage: 2300, utilityDamage: 24, enemyFlashed: 14 },
      { name: 'IB', team: 'Side B', result: 'LOSS', kills: 24, deaths: 20, assists: 2, mvps: 0, hsPercent: 33, damage: 2576, utilityDamage: 44, enemyFlashed: 0 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 17, deaths: 19, assists: 8, mvps: 0, hsPercent: 41, damage: 2300, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'Mere Baap', team: 'Side B', result: 'LOSS', kills: 13, deaths: 21, assists: 5, mvps: 0, hsPercent: 23, damage: 1311, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Daa', team: 'Side B', result: 'LOSS', kills: 10, deaths: 19, assists: 6, mvps: 0, hsPercent: 20, damage: 1081, utilityDamage: 0, enemyFlashed: 0 },
      { name: '!!@DaNgErBoY@!!', team: 'Side B', result: 'LOSS', kills: 11, deaths: 16, assists: 6, mvps: 1, hsPercent: 45, damage: 1587, utilityDamage: 62, enemyFlashed: 7 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 8, deaths: 18, assists: 6, mvps: 1, hsPercent: 62, damage: 1219, utilityDamage: 122, enemyFlashed: 15 }
    ]
  },
  {
    date: june24Date,
    matchDayTitle: june24MatchDayTitle,
    map: 'Ancient',
    teamAScore: 6,
    teamBScore: 13,
    winningTeam: 'Side B',
    rows: [
      { name: 'Mr. DJANGO', team: 'Side A', result: 'LOSS', kills: 26, deaths: 15, assists: 8, mvps: 2, hsPercent: 34, damage: 2603, utilityDamage: 117, enemyFlashed: 6 },
      { name: 'Manson', team: 'Side A', result: 'LOSS', kills: 15, deaths: 15, assists: 7, mvps: 2, hsPercent: 20, damage: 1862, utilityDamage: 0, enemyFlashed: 2 },
      { name: '!!@DaNgErBoY@!!', team: 'Side A', result: 'LOSS', kills: 18, deaths: 16, assists: 1, mvps: 1, hsPercent: 44, damage: 1558, utilityDamage: 41, enemyFlashed: 4 },
      { name: 'IB', team: 'Side A', result: 'LOSS', kills: 15, deaths: 17, assists: 1, mvps: 0, hsPercent: 6, damage: 1577, utilityDamage: 60, enemyFlashed: 1 },
      { name: 'Daa', team: 'Side A', result: 'LOSS', kills: 10, deaths: 17, assists: 2, mvps: 0, hsPercent: 30, damage: 1102, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Mere Baap', team: 'Side A', result: 'LOSS', kills: 9, deaths: 17, assists: 5, mvps: 0, hsPercent: 11, damage: 1216, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Side A', result: 'LOSS', kills: 5, deaths: 18, assists: 7, mvps: 0, hsPercent: 80, damage: 1026, utilityDamage: 120, enemyFlashed: 16 },
      { name: 'Radha', team: 'Side B', result: 'WIN', kills: 24, deaths: 16, assists: 8, mvps: 4, hsPercent: 33, damage: 2831, utilityDamage: 48, enemyFlashed: 1 },
      { name: 'amansanghvi1', team: 'Side B', result: 'WIN', kills: 22, deaths: 13, assists: 7, mvps: 1, hsPercent: 18, damage: 2052, utilityDamage: 5, enemyFlashed: 7 },
      { name: 'thomas', team: 'Side B', result: 'WIN', kills: 18, deaths: 13, assists: 4, mvps: 2, hsPercent: 38, damage: 1615, utilityDamage: 12, enemyFlashed: 4 },
      { name: 'VPS', team: 'Side B', result: 'WIN', kills: 19, deaths: 14, assists: 7, mvps: 3, hsPercent: 21, damage: 1995, utilityDamage: 20, enemyFlashed: 0 },
      { name: 'DrKush', team: 'Side B', result: 'WIN', kills: 17, deaths: 12, assists: 6, mvps: 2, hsPercent: 17, damage: 1862, utilityDamage: 264, enemyFlashed: 4 },
      { name: 'Aks', team: 'Side B', result: 'WIN', kills: 9, deaths: 13, assists: 8, mvps: 0, hsPercent: 22, damage: 1140, utilityDamage: 143, enemyFlashed: 13 },
      { name: 'Voldemort', team: 'Side B', result: 'WIN', kills: 5, deaths: 17, assists: 1, mvps: 1, hsPercent: 40, damage: 437, utilityDamage: 68, enemyFlashed: 0 }
    ]
  },
  {
    date: june24Date,
    matchDayTitle: june24MatchDayTitle,
    map: 'Mirage',
    teamAScore: 8,
    teamBScore: 13,
    winningTeam: 'Side B',
    rows: [
      { name: 'VPS', team: 'Side A', result: 'LOSS', kills: 22, deaths: 20, assists: 10, mvps: 0, hsPercent: 33, damage: 1554, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'amansanghvi1', team: 'Side A', result: 'LOSS', kills: 18, deaths: 24, assists: 6, mvps: 0, hsPercent: 28, damage: 1806, utilityDamage: 18, enemyFlashed: 9 },
      { name: 'Radha', team: 'Side A', result: 'LOSS', kills: 18, deaths: 18, assists: 8, mvps: 0, hsPercent: 16, damage: 1701, utilityDamage: 0, enemyFlashed: 9 },
      { name: 'Aks', team: 'Side A', result: 'LOSS', kills: 16, deaths: 20, assists: 6, mvps: 0, hsPercent: 31, damage: 1680, utilityDamage: 40, enemyFlashed: 12 },
      { name: 'DrKush', team: 'Side A', result: 'LOSS', kills: 13, deaths: 18, assists: 6, mvps: 0, hsPercent: 23, damage: 1470, utilityDamage: 41, enemyFlashed: 2 },
      { name: 'Voldemort', team: 'Side A', result: 'LOSS', kills: 11, deaths: 18, assists: 3, mvps: 0, hsPercent: 27, damage: 1701, utilityDamage: 24, enemyFlashed: 0 },
      { name: 'thomas', team: 'Side A', result: 'LOSS', kills: 8, deaths: 17, assists: 4, mvps: 0, hsPercent: 56, damage: 1029, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Manson', team: 'Side B', result: 'WIN', kills: 29, deaths: 12, assists: 4, mvps: 0, hsPercent: 24, damage: 2751, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'IB', team: 'Side B', result: 'WIN', kills: 20, deaths: 18, assists: 3, mvps: 0, hsPercent: 31, damage: 1722, utilityDamage: 1, enemyFlashed: 0 },
      { name: 'Daa', team: 'Side B', result: 'WIN', kills: 23, deaths: 18, assists: 1, mvps: 0, hsPercent: 11, damage: 1827, utilityDamage: 0, enemyFlashed: 9 },
      { name: 'Mere Baap', team: 'Side B', result: 'WIN', kills: 16, deaths: 19, assists: 1, mvps: 0, hsPercent: 38, damage: 1260, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Side B', result: 'WIN', kills: 11, deaths: 21, assists: 1, mvps: 0, hsPercent: 88, damage: 1806, utilityDamage: 178, enemyFlashed: 6 }
    ]
  },
  {
    date: june24Date,
    matchDayTitle: june24MatchDayTitle,
    map: 'Dust II',
    teamAScore: 13,
    teamBScore: 6,
    winningTeam: 'Side A',
    rows: [
      { name: 'IB', team: 'Side A', result: 'WIN', kills: 22, deaths: 14, assists: 4, mvps: 2 },
      { name: '!!@DaNgErBoY@!!', team: 'Side A', result: 'WIN', kills: 19, deaths: 12, assists: 2, mvps: 0 },
      { name: 'Daa', team: 'Side A', result: 'WIN', kills: 10, deaths: 13, assists: 5, mvps: 2 },
      { name: 'Bob Marde', team: 'Side A', result: 'WIN', kills: 10, deaths: 13, assists: 5, mvps: 2 },
      { name: 'Manson', team: 'Side A', result: 'WIN', kills: 9, deaths: 16, assists: 7, mvps: 0 },
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 10, deaths: 16, assists: 5, mvps: 1 },
      { name: 'VPS', team: 'Side B', result: 'LOSS', kills: 20, deaths: 13, assists: 1, mvps: 2 },
      { name: 'thomas', team: 'Side B', result: 'LOSS', kills: 14, deaths: 18, assists: 1, mvps: 0, hsPercent: 53, damage: 1235, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'DrKush', team: 'Side B', result: 'LOSS', kills: 12, deaths: 16, assists: 4, mvps: 1, hsPercent: 33, damage: 1235, utilityDamage: 55, enemyFlashed: 12 },
      { name: 'Voldemort', team: 'Side B', result: 'LOSS', kills: 11, deaths: 14, assists: 4, mvps: 0, hsPercent: 40, damage: 1045, utilityDamage: 68, enemyFlashed: 0 },
      { name: 'Aks', team: 'Side B', result: 'LOSS', kills: 8, deaths: 17, assists: 4, mvps: 0, hsPercent: 31, damage: 855, utilityDamage: 40, enemyFlashed: 4 }
    ]
  }
];

const june24KnifeSeed: ImportedKnife[] = [
  { date: june24Date, map: 'Dust II', attacker: 'VPS', victim: 'Manson', matchIndex: 1 },
  { date: june24Date, map: 'Ancient', attacker: 'Django', victim: 'Voldemort', matchIndex: 2 }
];

const july7Date = '2026-07-07';
const july7MatchDayTitle = 'War Wednesday - July 7, 2026';
const july7Matches: RawMatch[] = [
  {
    date: july7Date,
    matchDayTitle: july7MatchDayTitle,
    map: 'Mirage',
    teamAScore: 10,
    teamBScore: 13,
    winningTeam: 'Side B',
    rows: [
      { name: 'Mr. DJANGO', team: 'Side A', result: 'LOSS', kills: 18, deaths: 19, assists: 7, hsPercent: 38, damage: 2258 },
      { name: 'GULLU', team: 'Side A', result: 'LOSS', kills: 20, deaths: 17, assists: 2, hsPercent: 20, damage: 2140 },
      { name: 'gillranversingh38', team: 'Side A', result: 'LOSS', kills: 18, deaths: 20, assists: 4, hsPercent: 27, damage: 1938 },
      { name: 'Radha', team: 'Side A', result: 'LOSS', kills: 18, deaths: 20, assists: 5, hsPercent: 33, damage: 1678 },
      { name: 'Bob Marde', team: 'Side A', result: 'LOSS', kills: 18, deaths: 20, assists: 3, hsPercent: 37, damage: 1491 },
      { name: 'Mere Baap', team: 'Side A', result: 'LOSS', kills: 5, deaths: 21, assists: 4, hsPercent: 40, damage: 842 },
      { name: 'fatal_destiny', team: 'Side B', result: 'WIN', kills: 28, deaths: 16, assists: 8, hsPercent: 17, damage: 2877 },
      { name: 'DrKush', team: 'Side B', result: 'WIN', kills: 23, deaths: 18, assists: 8, hsPercent: 47, damage: 2656 },
      { name: 'DT', team: 'Side B', result: 'WIN', kills: 25, deaths: 16, assists: 6, hsPercent: 32, damage: 2574 },
      { name: 'Mr.Robot', team: 'Side B', result: 'WIN', kills: 16, deaths: 14, assists: 2, hsPercent: 18, damage: 1436 },
      { name: 'Aman', team: 'Side B', result: 'WIN', kills: 14, deaths: 15, assists: 3, hsPercent: 26, damage: 1413 }
    ]
  },
  {
    date: july7Date,
    matchDayTitle: july7MatchDayTitle,
    map: 'Dust II',
    teamAScore: 10,
    teamBScore: 13,
    winningTeam: 'Side B',
    rows: [
      { name: 'DrKush', team: 'Side A', result: 'LOSS', kills: 24, deaths: 19, assists: 8, hsPercent: 45, damage: 2424 },
      { name: 'DT', team: 'Side A', result: 'LOSS', kills: 20, deaths: 18, assists: 7, hsPercent: 50, damage: 2235 },
      { name: 'Mr.Robot', team: 'Side A', result: 'LOSS', kills: 23, deaths: 17, assists: 3, hsPercent: 34, damage: 2206 },
      { name: 'Aman', team: 'Side A', result: 'LOSS', kills: 15, deaths: 21, assists: 8, hsPercent: 40, damage: 1689 },
      { name: 'fatal_destiny', team: 'Side A', result: 'LOSS', kills: 9, deaths: 21, assists: 7, hsPercent: 44, damage: 1122 },
      { name: 'GULLU', team: 'Side B', result: 'WIN', kills: 26, deaths: 15, assists: 4, hsPercent: 19, damage: 2811 },
      { name: 'Mr. DJANGO', team: 'Side B', result: 'WIN', kills: 31, deaths: 11, assists: 4, hsPercent: 38, damage: 2731 },
      { name: 'gillranversingh38', team: 'Side B', result: 'WIN', kills: 19, deaths: 17, assists: 6, hsPercent: 31, damage: 1972 },
      { name: 'Radha', team: 'Side B', result: 'WIN', kills: 20, deaths: 17, assists: 1, hsPercent: 15, damage: 1972 },
      { name: 'Bob Marde', team: 'Side B', result: 'WIN', kills: 8, deaths: 19, assists: 9, hsPercent: 26, damage: 1389 },
      { name: 'Mere Baap', team: 'Side B', result: 'WIN', kills: 6, deaths: 17, assists: 5, hsPercent: 16, damage: 778 }
    ]
  },
  {
    date: july7Date,
    matchDayTitle: july7MatchDayTitle,
    map: 'Inferno',
    teamAScore: 13,
    teamBScore: 10,
    winningTeam: 'Side A',
    rows: [
      { name: 'Mr. DJANGO', team: 'Side A', result: 'WIN', kills: 44, deaths: 12, assists: 4, hsPercent: 61, damage: 4494 },
      { name: 'GULLU', team: 'Side A', result: 'WIN', kills: 23, deaths: 18, assists: 6, hsPercent: 4, damage: 2377 },
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 19, deaths: 19, assists: 3, hsPercent: 15, damage: 1774 },
      { name: 'Bob Marde', team: 'Side A', result: 'WIN', kills: 17, deaths: 16, assists: 6, hsPercent: 47, damage: 1720 },
      { name: 'gillranversingh38', team: 'Side A', result: 'WIN', kills: 8, deaths: 18, assists: 9, hsPercent: 12, damage: 1372 },
      { name: 'Mere Baap', team: 'Side A', result: 'WIN', kills: 8, deaths: 18, assists: 8, hsPercent: 75, damage: 644, note: 'Assists set to 8 per explicit correction.' },
      { name: 'Mr.Robot', team: 'Side B', result: 'LOSS', kills: 19, deaths: 21, assists: 8, hsPercent: 42, damage: 2381 },
      { name: 'DT', team: 'Side B', result: 'LOSS', kills: 21, deaths: 19, assists: 4, hsPercent: 19, damage: 2073 },
      { name: 'DrKush', team: 'Side B', result: 'LOSS', kills: 16, deaths: 19, assists: 8, hsPercent: 37, damage: 1818 },
      { name: 'Aman', team: 'Side B', result: 'LOSS', kills: 15, deaths: 20, assists: 2, hsPercent: 33, damage: 1609 },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 14, deaths: 22, assists: 2, hsPercent: 50, damage: 1406 }
    ]
  }
];

const july22Date = '2026-07-22';
const july22MatchDayTitle = 'War Wednesday - July 22, 2026';
const july22Matches: RawMatch[] = [
  {
    date: july22Date,
    matchDayTitle: july22MatchDayTitle,
    map: 'Inferno',
    teamAScore: 6,
    teamBScore: 13,
    winningTeam: 'Side B',
    rows: [
      { name: 'Manson', team: 'Side A', result: 'LOSS', kills: 20, deaths: 15, assists: 4, hsPercent: 40, damage: 2223, utilityDamage: 85, enemyFlashed: 1 },
      { name: 'Radha', team: 'Side A', result: 'LOSS', kills: 14, deaths: 16, assists: 2, hsPercent: 50, damage: 1634, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'DT', team: 'Side A', result: 'LOSS', kills: 11, deaths: 16, assists: 4, hsPercent: 36, damage: 1197, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'fatal_destiny', team: 'Side A', result: 'LOSS', kills: 8, deaths: 17, assists: 4, hsPercent: 37, damage: 874, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Side A', result: 'LOSS', kills: 5, deaths: 17, assists: 5, hsPercent: 40, damage: 836, utilityDamage: 1, enemyFlashed: 3 },
      { name: 'Voldemort', team: 'Side A', result: 'LOSS', kills: 8, deaths: 18, assists: 2, hsPercent: 62, damage: 931, utilityDamage: 161, enemyFlashed: 0 },
      { name: 'GULLU', team: 'Side B', result: 'WIN', kills: 21, deaths: 12, assists: 6, hsPercent: 14, damage: 2071, utilityDamage: 195, enemyFlashed: 5 },
      { name: 'VPS', team: 'Side B', result: 'WIN', kills: 21, deaths: 10, assists: 1, hsPercent: 33, damage: 1843, utilityDamage: 61, enemyFlashed: 0 },
      { name: 'amansanghv1', team: 'Side B', result: 'WIN', kills: 19, deaths: 12, assists: 7, hsPercent: 26, damage: 1976, utilityDamage: 45, enemyFlashed: 3 },
      { name: 'MAVERICK', team: 'Side B', result: 'WIN', kills: 17, deaths: 12, assists: 2, hsPercent: 35, damage: 1539, utilityDamage: 61, enemyFlashed: 2 },
      { name: 'DrKush', team: 'Side B', result: 'WIN', kills: 19, deaths: 14, assists: 5, hsPercent: 36, damage: 2147, utilityDamage: 355, enemyFlashed: 6 }
    ]
  },
  {
    date: july22Date,
    matchDayTitle: july22MatchDayTitle,
    map: 'Dust II',
    teamAScore: 13,
    teamBScore: 11,
    winningTeam: 'Side A',
    rows: [
      { name: 'DrKush', team: 'Side A', result: 'WIN', kills: 32, deaths: 22, assists: 3, hsPercent: 40, damage: 3024, utilityDamage: 98, enemyFlashed: 17 },
      { name: 'GULLU', team: 'Side A', result: 'WIN', kills: 27, deaths: 16, assists: 5, hsPercent: 11, damage: 2568, utilityDamage: 171, enemyFlashed: 4 },
      { name: 'amansanghv1', team: 'Side A', result: 'WIN', kills: 21, deaths: 18, assists: 4, hsPercent: 38, damage: 2280, utilityDamage: 19, enemyFlashed: 4 },
      { name: 'MAVERICK', team: 'Side A', result: 'WIN', kills: 22, deaths: 19, assists: 4, hsPercent: 40, damage: 1872, utilityDamage: 168, enemyFlashed: 8 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 9, deaths: 16, assists: 5, hsPercent: 55, damage: 1392, utilityDamage: 121, enemyFlashed: 20 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'WIN', kills: 6, deaths: 15, assists: 5, hsPercent: 16, damage: 912, utilityDamage: 121, enemyFlashed: 9, scoringEligible: false, note: 'Joined midway; partial-game row excluded from scoring.' },
      { name: 'DT', team: 'Side B', result: 'LOSS', kills: 28, deaths: 18, assists: 7, hsPercent: 32, damage: 2448, utilityDamage: 49, enemyFlashed: 2 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 27, deaths: 17, assists: 5, hsPercent: 22, damage: 2880, utilityDamage: 0, enemyFlashed: 3 },
      { name: 'Radha', team: 'Side B', result: 'LOSS', kills: 19, deaths: 20, assists: 8, hsPercent: 42, damage: 2256, utilityDamage: 0, enemyFlashed: 8 },
      { name: 'Voldemort', team: 'Side B', result: 'LOSS', kills: 14, deaths: 20, assists: 4, hsPercent: 36, damage: 1392, utilityDamage: 47, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 15, deaths: 19, assists: 5, hsPercent: 40, damage: 1896, utilityDamage: 93, enemyFlashed: 9 },
      { name: '!!EDaNgErBoYe!!', team: 'Side B', result: 'LOSS', kills: 11, deaths: 18, assists: 6, hsPercent: 18, damage: 1272, utilityDamage: 48, enemyFlashed: 14, scoringEligible: false, note: 'Joined midway; partial-game row excluded from scoring.' },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 11, deaths: 22, assists: 5, hsPercent: 44, damage: 1056, utilityDamage: 0, enemyFlashed: 0 }
    ]
  },
  {
    date: july22Date,
    matchDayTitle: july22MatchDayTitle,
    map: 'Ancient',
    teamAScore: 13,
    teamBScore: 7,
    winningTeam: 'Side A',
    rows: [
      { name: 'DT', team: 'Side A', result: 'WIN', kills: 24, deaths: 11, assists: 4, hsPercent: 20, damage: 2480, utilityDamage: 36, enemyFlashed: 2 },
      { name: 'Manson', team: 'Side A', result: 'WIN', kills: 26, deaths: 13, assists: 4, hsPercent: 19, damage: 2580, utilityDamage: 15, enemyFlashed: 2 },
      { name: 'Radha', team: 'Side A', result: 'WIN', kills: 17, deaths: 16, assists: 4, hsPercent: 41, damage: 1620, utilityDamage: 0, enemyFlashed: 5 },
      { name: 'Voldemort', team: 'Side A', result: 'WIN', kills: 11, deaths: 15, assists: 7, hsPercent: 36, damage: 1500, utilityDamage: 97, enemyFlashed: 1 },
      { name: 'fatal_destiny', team: 'Side A', result: 'WIN', kills: 12, deaths: 13, assists: 6, hsPercent: 25, damage: 1220, utilityDamage: 0, enemyFlashed: 2 },
      { name: '!!EDaNgErBoYe!!', team: 'Side A', result: 'WIN', kills: 11, deaths: 13, assists: 6, hsPercent: 27, damage: 1420, utilityDamage: 89, enemyFlashed: 11 },
      { name: 'Bob Marde', team: 'Side A', result: 'WIN', kills: 12, deaths: 15, assists: 3, hsPercent: 58, damage: 1320, utilityDamage: 8, enemyFlashed: 5 },
      { name: 'amansanghv1', team: 'Side B', result: 'LOSS', kills: 21, deaths: 13, assists: 1, hsPercent: 14, damage: 1680, utilityDamage: 2, enemyFlashed: 7 },
      { name: 'VPS', team: 'Side B', result: 'LOSS', kills: 19, deaths: 14, assists: 2, hsPercent: 42, damage: 1640, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'DrKush', team: 'Side B', result: 'LOSS', kills: 15, deaths: 17, assists: 7, hsPercent: 33, damage: 2420, utilityDamage: 153, enemyFlashed: 6 },
      { name: 'GULLU', team: 'Side B', result: 'LOSS', kills: 12, deaths: 18, assists: 6, hsPercent: 33, damage: 1800, utilityDamage: 27, enemyFlashed: 5 },
      { name: 'MAVERICK', team: 'Side B', result: 'LOSS', kills: 14, deaths: 19, assists: 3, hsPercent: 28, damage: 1600, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'T-Rex', team: 'Side B', result: 'LOSS', kills: 7, deaths: 18, assists: 9, hsPercent: 28, damage: 1260, utilityDamage: 79, enemyFlashed: 3 },
      { name: 'Hodor bitch!', team: 'Side B', result: 'LOSS', kills: 7, deaths: 17, assists: 1, hsPercent: 57, damage: 780, utilityDamage: 4, enemyFlashed: 1 }
    ]
  },
  {
    date: july22Date,
    matchDayTitle: july22MatchDayTitle,
    map: 'Mirage',
    teamAScore: 13,
    teamBScore: 9,
    winningTeam: 'Side A',
    rows: [
      { name: 'DrKush', team: 'Side A', result: 'WIN', kills: 23, deaths: 18, assists: 7, hsPercent: 52, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'T-Rex', team: 'Side A', result: 'WIN', kills: 22, deaths: 17, assists: 7, hsPercent: 27, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'GULLU', team: 'Side A', result: 'WIN', kills: 23, deaths: 14, assists: 3, hsPercent: 21, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'amansanghv1', team: 'Side A', result: 'WIN', kills: 16, deaths: 14, assists: 7, hsPercent: 58, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'VPS', team: 'Side A', result: 'WIN', kills: 16, deaths: 18, assists: 3, hsPercent: 54, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'MAVERICK', team: 'Side A', result: 'WIN', kills: 13, deaths: 13, assists: 1, hsPercent: 41, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'Hodor bitch!', team: 'Side A', result: 'WIN', kills: 8, deaths: 19, assists: 8, hsPercent: 35, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'DT', team: 'Side B', result: 'LOSS', kills: 22, deaths: 19, assists: 6, hsPercent: 63, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'Bob Marde', team: 'Side B', result: 'LOSS', kills: 22, deaths: 16, assists: 5, hsPercent: 63, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'fatal_destiny', team: 'Side B', result: 'LOSS', kills: 15, deaths: 19, assists: 8, hsPercent: 61, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: '!!EDaNgErBoYe!!', team: 'Side B', result: 'LOSS', kills: 15, deaths: 15, assists: 8, hsPercent: 56, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'Voldemort', team: 'Side B', result: 'LOSS', kills: 13, deaths: 16, assists: 4, hsPercent: 48, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'Manson', team: 'Side B', result: 'LOSS', kills: 12, deaths: 17, assists: 6, hsPercent: 46, damage: undefined, utilityDamage: undefined, enemyFlashed: undefined, mvps: 0 },
      { name: 'Radha', team: 'Side B', result: 'LOSS', kills: 12, deaths: 22, assists: 3, hsPercent: 25, damage: 760, utilityDamage: 0, enemyFlashed: 0, mvps: 0 }
    ]
  }
];

const aug5Date = '2026-08-05';
const aug5MatchDayTitle = 'Matchday - Aug 5, 2026';
const aug5Matches: RawMatch[] = [
  {
    date: aug5Date,
    matchDayTitle: aug5MatchDayTitle,
    map: 'Inferno',
    teamAScore: 5,
    teamBScore: 13,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Terrorists',
    note: 'DT was not visible in this match and has not been included.',
    rows: [
      { name: 'DrKush', team: 'Counter-Terrorists', result: 'LOSS', kills: 18, deaths: 16, assists: 3, mvps: 0, score: 60, hsPercent: 33, kd: 1.12, adr: 97, utilityDamage: 3, enemyFlashed: 5 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Counter-Terrorists', result: 'LOSS', kills: 16, deaths: 17, assists: 3, mvps: 1, score: 51, hsPercent: 43, kd: 0.94, adr: 98, utilityDamage: 41, enemyFlashed: 0 },
      { name: 'Radha', team: 'Counter-Terrorists', result: 'LOSS', kills: 10, deaths: 18, assists: 3, mvps: 1, score: 39, hsPercent: 20, kd: 0.55, adr: 59, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Counter-Terrorists', result: 'LOSS', kills: 9, deaths: 17, assists: 4, mvps: 1, score: 39, hsPercent: 11, kd: 0.52, adr: 61, utilityDamage: 24, enemyFlashed: 2 },
      { name: 'Aman', team: 'Counter-Terrorists', result: 'LOSS', kills: 9, deaths: 17, assists: 4, mvps: 0, score: 37, hsPercent: 22, kd: 0.52, adr: 70, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'PeekaBoom', team: 'Counter-Terrorists', result: 'LOSS', kills: 6, deaths: 17, assists: 4, mvps: 1, score: 32, hsPercent: 33, kd: 0.35, adr: 55, utilityDamage: 2, enemyFlashed: 0 },
      { name: 'Mere Baap', team: 'Counter-Terrorists', result: 'LOSS', kills: 4, deaths: 17, assists: 4, mvps: 0, score: 24, hsPercent: 0, kd: 0.23, adr: 28, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Django', displayName: 'Mr. DJANGO', team: 'Terrorists', result: 'WIN', kills: 32, deaths: 12, assists: 4, mvps: 5, score: 85, hsPercent: 50, kd: 2.66, adr: 169, utilityDamage: 0, enemyFlashed: 1 },
      { name: 'GULLU', team: 'Terrorists', result: 'WIN', kills: 23, deaths: 12, assists: 2, mvps: 1, score: 64, hsPercent: 4, kd: 1.91, adr: 109, utilityDamage: 108, enemyFlashed: 4 },
      { name: 'MAVERICK', team: 'Terrorists', result: 'WIN', kills: 18, deaths: 11, assists: 5, mvps: 1, score: 55, hsPercent: 27, kd: 1.63, adr: 115, utilityDamage: 253, enemyFlashed: 0 },
      { name: 'Bob Marde', team: 'Terrorists', result: 'WIN', kills: 13, deaths: 12, assists: 11, mvps: 1, score: 55, hsPercent: 15, kd: 1.08, adr: 90, utilityDamage: 247, enemyFlashed: 17 },
      { name: 'T-Rex', team: 'Terrorists', result: 'WIN', kills: 14, deaths: 16, assists: 8, mvps: 0, score: 53, hsPercent: 35, kd: 0.87, adr: 91, utilityDamage: 70, enemyFlashed: 1 },
      { name: 'Voldemort', team: 'Terrorists', result: 'WIN', kills: 15, deaths: 10, assists: 3, mvps: 1, score: 52, hsPercent: 66, kd: 1.50, adr: 80, utilityDamage: 29, enemyFlashed: 0 }
    ]
  },
  {
    date: aug5Date,
    matchDayTitle: aug5MatchDayTitle,
    map: 'Dust II',
    teamAScore: 13,
    teamBScore: 6,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Counter-Terrorists',
    note: 'DT row ignored as requested.',
    rows: [
      { name: 'Django', displayName: 'Mr. DJANGO', team: 'Counter-Terrorists', result: 'WIN', kills: 30, deaths: 9, assists: 3, mvps: 1, score: 90, hsPercent: 56, kd: 3.33, adr: 145, utilityDamage: 0, enemyFlashed: 6 },
      { name: 'Bob Marde', team: 'Counter-Terrorists', result: 'WIN', kills: 17, deaths: 14, assists: 6, mvps: 1, score: 67, hsPercent: 47, kd: 1.21, adr: 94, utilityDamage: 234, enemyFlashed: 14 },
      { name: 'GULLU', team: 'Counter-Terrorists', result: 'WIN', kills: 21, deaths: 10, assists: 4, mvps: 1, score: 63, hsPercent: 14, kd: 2.10, adr: 88, utilityDamage: 50, enemyFlashed: 9 },
      { name: 'Voldemort', team: 'Counter-Terrorists', result: 'WIN', kills: 12, deaths: 15, assists: 7, mvps: 1, score: 46, hsPercent: 50, kd: 0.80, adr: 73, utilityDamage: 16, enemyFlashed: 2 },
      { name: 'MAVERICK', team: 'Counter-Terrorists', result: 'WIN', kills: 13, deaths: 14, assists: 6, mvps: 1, score: 42, hsPercent: 46, kd: 0.92, adr: 81, utilityDamage: 69, enemyFlashed: 12 },
      { name: 'T-Rex', team: 'Counter-Terrorists', result: 'WIN', kills: 7, deaths: 16, assists: 8, mvps: 0, score: 32, hsPercent: 0, kd: 0.43, adr: 62, utilityDamage: 87, enemyFlashed: 1 },
      { name: 'Radha', team: 'Terrorists', result: 'LOSS', kills: 15, deaths: 18, assists: 6, mvps: 1, score: 49, hsPercent: 53, kd: 0.83, adr: 92, utilityDamage: 80, enemyFlashed: 1 },
      { name: 'DrKush', team: 'Terrorists', result: 'LOSS', kills: 13, deaths: 17, assists: 6, mvps: 0, score: 45, hsPercent: 61, kd: 0.76, adr: 82, utilityDamage: 97, enemyFlashed: 5 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Terrorists', result: 'LOSS', kills: 13, deaths: 13, assists: 1, mvps: 1, score: 43, hsPercent: 38, kd: 1.00, adr: 67, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'Aman', team: 'Terrorists', result: 'LOSS', kills: 12, deaths: 16, assists: 3, mvps: 0, score: 39, hsPercent: 25, kd: 0.75, adr: 73, utilityDamage: 0, enemyFlashed: 2 },
      { name: 'Mere Baap', team: 'Terrorists', result: 'LOSS', kills: 11, deaths: 16, assists: 3, mvps: 1, score: 37, hsPercent: 36, kd: 0.73, adr: 61, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'PeekaBoom', team: 'Terrorists', result: 'LOSS', kills: 10, deaths: 15, assists: 1, mvps: 1, score: 33, hsPercent: 20, kd: 0.66, adr: 53, utilityDamage: 11, enemyFlashed: 0 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Terrorists', result: 'LOSS', kills: 8, deaths: 16, assists: 1, mvps: 0, score: 32, hsPercent: 25, kd: 0.50, adr: 54, utilityDamage: 0, enemyFlashed: 7 }
    ]
  },
  {
    date: aug5Date,
    matchDayTitle: aug5MatchDayTitle,
    map: 'Ancient',
    teamAScore: 5,
    teamBScore: 13,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Terrorists',
    note: 'Aman logged out unfairly; his stats were set to the lowest scoring player in this match.',
    rows: [
      { name: 'GULLU', team: 'Counter-Terrorists', result: 'LOSS', kills: 23, deaths: 16, assists: 2, mvps: 1, score: 59, hsPercent: null, kd: 1.44, adr: null, utilityDamage: null, enemyFlashed: null, note: 'Advanced stats not visible in final Ancient stats image; KDA/MVP/score taken from previous Ancient image.' },
      { name: 'Voldemort', team: 'Counter-Terrorists', result: 'LOSS', kills: 14, deaths: 17, assists: 4, mvps: 1, score: 53, hsPercent: 35, kd: 0.82, adr: 88, utilityDamage: 14, enemyFlashed: 0 },
      { name: 'MAVERICK', team: 'Counter-Terrorists', result: 'LOSS', kills: 13, deaths: 16, assists: 6, mvps: 0, score: 53, hsPercent: 38, kd: 0.81, adr: 80, utilityDamage: 41, enemyFlashed: 1 },
      { name: 'DT', team: 'Counter-Terrorists', result: 'LOSS', kills: 9, deaths: 16, assists: 9, mvps: 0, score: 43, hsPercent: 11, kd: 0.56, adr: 65, utilityDamage: 35, enemyFlashed: 1 },
      { name: 'T-Rex', team: 'Counter-Terrorists', result: 'LOSS', kills: 10, deaths: 18, assists: 6, mvps: 0, score: 38, hsPercent: 40, kd: 0.55, adr: 68, utilityDamage: 141, enemyFlashed: 1 },
      { name: 'Bob Marde', team: 'Counter-Terrorists', result: 'LOSS', kills: 7, deaths: 16, assists: 6, mvps: 0, score: 33, hsPercent: 14, kd: 0.43, adr: 58, utilityDamage: 144, enemyFlashed: 6 },
      { name: 'Django', displayName: 'Mr. DJANGO', team: 'Terrorists', result: 'WIN', kills: 28, deaths: 11, assists: 2, mvps: 1, score: 77, hsPercent: 46, kd: 2.54, adr: 144, utilityDamage: 18, enemyFlashed: 1 },
      { name: 'DrKush', team: 'Terrorists', result: 'WIN', kills: 19, deaths: 14, assists: 11, mvps: 1, score: 72, hsPercent: 68, kd: 1.35, adr: 138, utilityDamage: 146, enemyFlashed: 6 },
      { name: 'Mere Baap', team: 'Terrorists', result: 'WIN', kills: 14, deaths: 12, assists: 2, mvps: 1, score: 47, hsPercent: 28, kd: 1.16, adr: 83, utilityDamage: 23, enemyFlashed: 0 },
      { name: 'PeekaBoom', team: 'Terrorists', result: 'WIN', kills: 14, deaths: 12, assists: 3, mvps: 1, score: 46, hsPercent: 50, kd: 1.16, adr: 83, utilityDamage: 91, enemyFlashed: 0 },
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Terrorists', result: 'WIN', kills: 12, deaths: 11, assists: 5, mvps: 1, score: 45, hsPercent: 33, kd: 1.09, adr: 66, utilityDamage: 32, enemyFlashed: 8 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Terrorists', result: 'WIN', kills: 12, deaths: 15, assists: 5, mvps: 0, score: 44, hsPercent: 16, kd: 0.80, adr: 73, utilityDamage: 26, enemyFlashed: 10 },
      { name: 'Aman', team: 'Counter-Terrorists', result: 'LOSS', kills: 10, deaths: 18, assists: 6, mvps: 0, score: 38, hsPercent: 40, kd: 0.55, adr: 68, utilityDamage: 141, enemyFlashed: 1, gapFill: true, note: 'Synthetic logout penalty copied from the lowest scorer as instructed.' }
    ]
  },
  {
    date: aug5Date,
    matchDayTitle: aug5MatchDayTitle,
    map: 'Mirage',
    teamAScore: 13,
    teamBScore: 10,
    teamAName: 'Counter-Terrorists',
    teamBName: 'Terrorists',
    winningTeam: 'Counter-Terrorists',
    note: 'Team/result checked after the team change: Counter-Terrorists won 13-10.',
    rows: [
      { name: 'Dangerboy', displayName: '!!@DaNgErBoY@!!', team: 'Counter-Terrorists', result: 'WIN', kills: 28, deaths: 17, assists: 6, mvps: 1, score: 84, hsPercent: 32, kd: 1.64, adr: 124, utilityDamage: 51, enemyFlashed: 6 },
      { name: 'Django', displayName: 'Mr. DJANGO', team: 'Counter-Terrorists', result: 'WIN', kills: 27, deaths: 14, assists: 5, mvps: 1, score: 81, hsPercent: 55, kd: 1.92, adr: 120, utilityDamage: 15, enemyFlashed: 6 },
      { name: 'DrKush', team: 'Counter-Terrorists', result: 'WIN', kills: 24, deaths: 19, assists: 4, mvps: 1, score: 77, hsPercent: 29, kd: 1.26, adr: 112, utilityDamage: 114, enemyFlashed: 5 },
      { name: 'Aks', displayName: 'Stormbre@ker', team: 'Counter-Terrorists', result: 'WIN', kills: 14, deaths: 19, assists: 7, mvps: 0, score: 53, hsPercent: 50, kd: 0.73, adr: 69, utilityDamage: 0, enemyFlashed: 12 },
      { name: 'Radha', team: 'Counter-Terrorists', result: 'WIN', kills: 17, deaths: 18, assists: 3, mvps: 1, score: 50, hsPercent: 17, kd: 0.94, adr: 73, utilityDamage: 0, enemyFlashed: 8 },
      { name: 'PeekaBoom', team: 'Counter-Terrorists', result: 'WIN', kills: 13, deaths: 18, assists: 6, mvps: 1, score: 50, hsPercent: 30, kd: 0.72, adr: 65, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'Mere Baap', team: 'Counter-Terrorists', result: 'WIN', kills: 13, deaths: 17, assists: 3, mvps: 1, score: 47, hsPercent: 46, kd: 0.76, adr: 52, utilityDamage: 0, enemyFlashed: 0 },
      { name: 'MAVERICK', team: 'Terrorists', result: 'LOSS', kills: 25, deaths: 19, assists: 8, mvps: 1, score: 77, hsPercent: 44, kd: 1.31, adr: 108, utilityDamage: 1, enemyFlashed: 0 },
      { name: 'GULLU', team: 'Terrorists', result: 'LOSS', kills: 28, deaths: 18, assists: 3, mvps: 1, score: 76, hsPercent: 35, kd: 1.55, adr: 113, utilityDamage: 83, enemyFlashed: 1 },
      { name: 'DT', team: 'Terrorists', result: 'LOSS', kills: 23, deaths: 22, assists: 4, mvps: 0, score: 72, hsPercent: 30, kd: 1.04, adr: 117, utilityDamage: 29, enemyFlashed: 0 },
      { name: 'Voldemort', team: 'Terrorists', result: 'LOSS', kills: 17, deaths: 18, assists: 2, mvps: 1, score: 60, hsPercent: 27, kd: 0.94, adr: 75, utilityDamage: 96, enemyFlashed: 1 },
      { name: 'Aman', team: 'Terrorists', result: 'LOSS', kills: 10, deaths: 20, assists: 6, mvps: 1, score: 45, hsPercent: 30, kd: 0.50, adr: 64, utilityDamage: 50, enemyFlashed: 1 },
      { name: 'Bob Marde', team: 'Terrorists', result: 'LOSS', kills: 9, deaths: 19, assists: 5, mvps: 0, score: 42, hsPercent: 11, kd: 0.47, adr: 53, utilityDamage: 180, enemyFlashed: 9 },
      { name: 'T-Rex', team: 'Terrorists', result: 'LOSS', kills: 10, deaths: 23, assists: 6, mvps: 0, score: 40, hsPercent: 60, kd: 0.43, adr: 66, utilityDamage: 9, enemyFlashed: 0 }
    ]
  }
];

async function repairJuly22DataIfNeeded() {
  const july22Matches = await db.matches.where('date').equals(july22Date).toArray();
  if (!july22Matches.length) return;

  const players = await db.players.toArray();
  const playerIdByName = new Map(players.map((p) => [p.name, p.id || 0]));
  const tRexId = playerIdByName.get('T-Rex') || 0;
  const radhaId = playerIdByName.get('Radha') || 0;
  const dangerboyId = playerIdByName.get('!!EDaNgErBoYe!!') || 0;
  const hodorId = playerIdByName.get('Hodor bitch!') || 0;

  const deriveResult = (team: string, winningTeam: string): MatchResult =>
    winningTeam === 'Draw' ? 'DRAW' : team === winningTeam ? 'WIN' : 'LOSS';

  const inferno = july22Matches.find((match) => match.map === 'Inferno');
  if (inferno?.id && tRexId) {
    const tRexRow = await db.match_players
      .where('[matchId+playerId]')
      .equals([inferno.id, tRexId])
      .first();
    if (tRexRow?.id) {
      await db.match_players.delete(tRexRow.id);
    }
  }

  const dust = july22Matches.find((match) => match.map === 'Dust II');
  if (dust?.id) {
    if (tRexId) {
      const tRexRow = await db.match_players
        .where('[matchId+playerId]')
        .equals([dust.id, tRexId])
        .first();
      if (tRexRow?.id) await db.match_players.delete(tRexRow.id);
    }

    for (const playerId of [dangerboyId, hodorId].filter(Boolean)) {
      const partialRow = await db.match_players
        .where('[matchId+playerId]')
        .equals([dust.id, playerId])
        .first();
      if (partialRow?.id) {
        await db.match_players.update(partialRow.id, {
          scoringEligible: false,
          participationNote: 'Joined midway; partial-game row excluded from scoring.'
        });
      }
    }
  }

  const mirage = july22Matches.find((match) => match.map === 'Mirage');
  if (mirage?.id && radhaId) {
    const existing = await db.match_players
      .where('[matchId+playerId]')
      .equals([mirage.id, radhaId])
      .first();

    const radhaPatch = {
      team: 'Side A',
      result: 'LOSS' as MatchResult,
      kills: 12,
      deaths: 22,
      assists: 3,
      damage: 760,
      hsPercent: 25,
      utilityDamage: 0,
      enemyFlashed: 0,
      mvps: 0,
      points: points('LOSS', 12, 3, 22)
    };

    if (existing?.id) {
      await db.match_players.update(existing.id, radhaPatch);
    } else {
      await db.match_players.add({
        matchId: mirage.id,
        playerId: radhaId,
        ...radhaPatch
      });
    }
  }

  for (const match of july22Matches) {
    const rows = await db.match_players.where('matchId').equals(match.id!).toArray();
    if (!rows.length) continue;

    await Promise.all(rows.map((row) => {
      const result = deriveResult(row.team, match.winningTeam);
      return db.match_players.update(row.id!, {
        result,
        points: points(result, row.kills, row.assists, row.deaths)
      });
    }));
  }
}

async function importJuly22DataIfMissing() {
  const flag = localStorage.getItem('cs2_imported_july22_match_cards_v1');
  const hasJuly22 = await db.matches.where('date').equals(july22Date).count();
  if (flag === '1' || hasJuly22 > 0) {
    localStorage.setItem('cs2_imported_july22_match_cards_v1', '1');
    return;
  }

  const season = await db.seasons.filter((s) => s.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const matchDayId = Number(await db.match_days.add({
    seasonId: Number(seasonId),
    title: july22MatchDayTitle,
    eventDate: july22Date,
    notes: 'Imported from July 22 screenshots',
    createdAt: now()
  }));

  for (const match of july22Matches) {
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
      notes: 'Imported from July 22 screenshots',
      createdAt: now()
    }));

    const rows = [];
    for (const row of match.rows) {
      const canonicalName = canonicalImportName(row.name);
      const playerId = await getOrCreatePlayerId(canonicalName);
      if (canonicalName !== row.name) {
        await addAliasIfMissing(playerId, row.name);
      }
      rows.push({
        matchId,
        playerId,
        team: row.team,
        result: row.result,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        damage: row.damage ?? undefined,
        hsPercent: row.hsPercent ?? undefined,
        utilityDamage: row.utilityDamage ?? undefined,
        enemyFlashed: row.enemyFlashed ?? undefined,
        mvps: row.mvps ?? 0,
        points: points(row.result, row.kills, row.assists, row.deaths),
        scoringEligible: row.scoringEligible !== false,
        participationNote: row.note,
        gapFill: row.gapFill === true
      });
    }
    await db.match_players.bulkAdd(rows);
  }

  localStorage.setItem('cs2_imported_july22_match_cards_v1', '1');
}

async function importAug5DataIfMissing() {
  const flag = localStorage.getItem('cs2_imported_aug5_match_cards_v1');
  const hasAug5 = await db.matches.where('date').equals(aug5Date).count();
  if (flag === '1' || hasAug5 > 0) {
    localStorage.setItem('cs2_imported_aug5_match_cards_v1', '1');
    return;
  }

  const season = await db.seasons.filter((s) => s.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const matchDayId = Number(await db.match_days.add({
    seasonId: Number(seasonId),
    title: aug5MatchDayTitle,
    eventDate: aug5Date,
    notes: 'Imported from August 5 screenshots',
    createdAt: now()
  }));

  for (const match of aug5Matches) {
    const matchId = Number(await db.matches.add({
      seasonId: Number(seasonId),
      matchDayId,
      date: match.date,
      map: match.map,
      teamAName: match.teamAName || 'Side A',
      teamBName: match.teamBName || 'Side B',
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      winningTeam: match.winningTeam,
      notes: match.note || 'Imported from August 5 screenshots',
      createdAt: now()
    }));

    const roundsPlayed = Math.max(1, match.teamAScore + match.teamBScore);
    const rows = [];
    for (const row of match.rows) {
      const canonicalName = canonicalImportName(row.name);
      const playerId = await getOrCreatePlayerId(canonicalName);
      if (canonicalName !== row.name) {
        await addAliasIfMissing(playerId, row.name);
      }
      rows.push({
        matchId,
        playerId,
        team: row.team,
        result: row.result,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        damage: row.damage ?? deriveDamageFromAdr(row.adr, roundsPlayed),
        hsPercent: row.hsPercent ?? undefined,
        utilityDamage: row.utilityDamage ?? undefined,
        enemyFlashed: row.enemyFlashed ?? undefined,
        mvps: row.mvps ?? 0,
        points: points(row.result, row.kills, row.assists, row.deaths),
        scoringEligible: row.scoringEligible !== false,
        participationNote: row.note,
        gapFill: row.gapFill === true
      });
    }
    await db.match_players.bulkAdd(rows);
  }

  const infernoMatch = await db.matches.where('[date+map]').equals([aug5Date, 'Inferno']).first();
  if (infernoMatch?.id) {
    const djangoId = await getOrCreatePlayerId('Mr. DJANGO');
    const bobId = await getOrCreatePlayerId('Bob Marde');
    await db.knife_events.add({
      matchId: infernoMatch.id,
      attackerPlayerId: djangoId,
      victimPlayerId: 0,
      createdAt: now()
    });
    await db.knife_events.add({
      matchId: infernoMatch.id,
      attackerPlayerId: djangoId,
      victimPlayerId: 0,
      createdAt: now()
    });
    await db.knife_events.add({
      matchId: infernoMatch.id,
      attackerPlayerId: djangoId,
      victimPlayerId: 0,
      createdAt: now()
    });
    await db.knife_events.add({
      matchId: infernoMatch.id,
      attackerPlayerId: await getOrCreatePlayerId('Mere Baap'),
      victimPlayerId: bobId,
      createdAt: now()
    });
  }

  localStorage.setItem('cs2_imported_aug5_match_cards_v1', '1');
}

async function repairAug5KnifeStatsIfNeeded() {
  const matches = await db.matches.where('date').equals(aug5Date).toArray();
  if (!matches.length) return;

  const infernoMatch = matches.find((m) => m.map === 'Inferno');
  if (!infernoMatch?.id) return;

  const players = await db.players.toArray();
  const playerIdByName = new Map(players.map((p) => [p.name, p.id || 0]));
  const djangoId = playerIdByName.get('Mr. DJANGO') || 0;
  const mereBaapId = playerIdByName.get('Mere Baap') || 0;
  const bobId = playerIdByName.get('Bob Marde') || 0;
  if (!djangoId || !mereBaapId) return;

  const existing = await db.knife_events.where('matchId').equals(infernoMatch.id).toArray();
  const djangoCount = existing.filter((ev) => ev.attackerPlayerId === djangoId).length;
  const mereBaapCount = existing.filter((ev) => ev.attackerPlayerId === mereBaapId).length;

  for (let i = djangoCount; i < 3; i++) {
    await db.knife_events.add({
      matchId: infernoMatch.id,
      attackerPlayerId: djangoId,
      victimPlayerId: 0,
      createdAt: now()
    });
  }

  if (mereBaapCount < 1) {
    await db.knife_events.add({
      matchId: infernoMatch.id,
      attackerPlayerId: mereBaapId,
      victimPlayerId: bobId || 0,
      createdAt: now()
    });
  }
}

async function repairAug5SyntheticRowsIfNeeded() {
  const ancient = await db.matches.where('[date+map]').equals([aug5Date, 'Ancient']).first();
  const aman = await db.players.where('name').equals('Aman').first();
  if (!ancient?.id || !aman?.id) return;
  const row = await db.match_players.where('[matchId+playerId]').equals([ancient.id, aman.id]).first();
  if (row?.id) {
    await db.match_players.update(row.id, {
      gapFill: true,
      participationNote: 'Synthetic logout penalty copied from the lowest scorer as instructed.'
    });
  }
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function getOrCreatePlayerId(name: string) {
  const existing = await db.players.where('name').equals(name).first();
  if (existing?.id) return existing.id;
  return Number(await db.players.add({ name, createdAt: now() }));
}

function canonicalImportName(name: string) {
  const normalized = norm(name);
  if (normalized === norm('Aks')) return 'aks289';
  if (normalized === norm('amansanghvi1') || normalized === norm('amansanghv1')) return 'Aman';
  if (normalized === norm('Django') || normalized === norm('Mr. DJANGO')) return 'Mr. DJANGO';
  if (normalized === norm('Dangerboy') || normalized === norm('!!@DaNgErBoY@!!')) return '!!EDaNgErBoYe!!';
  if (normalized === norm('Gullu') || normalized === norm('GULLU')) return 'GULLU';
  if (normalized === norm('Mr Robot') || normalized === norm('Mr.Robot')) return 'Mr.Robot';
  if (normalized === norm('Dr Kush') || normalized === norm('DrKush')) return 'DrKush';
  if (normalized === norm('San')) return 'IB';
  if (normalized === norm('rochak.kedia') || normalized === norm('Rocket Kedia')) return 'Rocket Kedia';
  return name;
}

const august10Date = '2026-08-10';
const august19Date = '2026-08-19';
const august10MatchDayTitle = 'War Wednesday - Aug 10, 2026';
const august19MatchDayTitle = 'War Wednesday - Aug 19, 2026';
const augustKnifeEvents = [
  { attacker: 'Manson', victim: 'Daa' },
  { attacker: 'Manson', victim: 'Aman' },
  { attacker: 'Manson', victim: 'Bob Marde' },
  { attacker: 'Manson', victim: 'GULLU' },
  { attacker: 'Manson', victim: 'DrKush' },
  { attacker: 'VPS', victim: 'Daa' }
];

function isMissingAugustPackRow(row: (typeof august2026DataPack)[number]['rows'][number]) {
  return row.team === 'Not Played / Missing';
}

function hasUnseenAdvancedStats(row: (typeof august2026DataPack)[number]['rows'][number]) {
  const reason = row.gapFillReason?.toLowerCase() || '';
  return reason.includes('advanced stat') && reason.includes('not visible');
}

function hasSyntheticCombatStats(row: (typeof august2026DataPack)[number]['rows'][number]) {
  return Boolean(row.gapFillReason?.toLowerCase().includes('k/d/a gap-filled'));
}

async function ensureAugust19KnifeEvents() {
  const dust2 = await db.matches.where('[date+map]').equals([august19Date, 'Dust II']).first();
  if (!dust2?.id) return;

  for (const event of augustKnifeEvents) {
    const attackerId = await getOrCreatePlayerId(canonicalImportName(event.attacker));
    const victimId = await getOrCreatePlayerId(canonicalImportName(event.victim));
    const exists = await db.knife_events
      .where('matchId')
      .equals(dust2.id)
      .filter((knife) => knife.attackerPlayerId === attackerId && knife.victimPlayerId === victimId)
      .count();
    if (!exists) {
      await db.knife_events.add({
        matchId: dust2.id,
        attackerPlayerId: attackerId,
        victimPlayerId: victimId,
        createdAt: now()
      });
    }
  }
}

async function importAugust10And19DataIfMissing() {
  const flag = localStorage.getItem('cs2_imported_aug10_aug19_match_cards_v2');
  const august10Count = await db.matches.where('date').equals(august10Date).count();
  const august19Count = await db.matches.where('date').equals(august19Date).count();
  if (flag === '1' && august10Count === 4 && august19Count === 4) {
    await ensureAugust19KnifeEvents();
    return;
  }
  if (august10Count || august19Count) {
    const incompleteMatches = [
      ...await db.matches.where('date').equals(august10Date).toArray(),
      ...await db.matches.where('date').equals(august19Date).toArray()
    ];
    const matchIds = incompleteMatches.map((match) => match.id).filter((id): id is number => typeof id === 'number');
    const matchDayIds = [...new Set(incompleteMatches.map((match) => match.matchDayId).filter((id): id is number => typeof id === 'number'))];
    for (const matchId of matchIds) {
      await db.match_players.where('matchId').equals(matchId).delete();
      await db.knife_events.where('matchId').equals(matchId).delete();
      await db.matches.delete(matchId);
    }
    for (const matchDayId of matchDayIds) {
      if (await db.matches.where('matchDayId').equals(matchDayId).count() === 0) {
        await db.match_days.delete(matchDayId);
      }
    }
  }

  const season = await db.seasons.filter((s) => s.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const packs = [
    { date: august10Date, title: august10MatchDayTitle, matches: august2026DataPack.slice(0, 4) },
    { date: august19Date, title: august19MatchDayTitle, matches: august2026DataPack.slice(4, 8) }
  ];

  for (const pack of packs) {
    const matchDayId = Number(await db.match_days.add({
      seasonId: Number(seasonId),
      title: pack.title,
      eventDate: pack.date,
      notes: 'Imported from corrected August data pack',
      createdAt: now()
    }));

    for (const sourceMatch of pack.matches) {
      const matchId = Number(await db.matches.add({
        seasonId: Number(seasonId),
        matchDayId,
        date: pack.date,
        map: sourceMatch.map,
        teamAName: sourceMatch.teamAName,
        teamBName: sourceMatch.teamBName,
        teamAScore: sourceMatch.teamAScore,
        teamBScore: sourceMatch.teamBScore,
        winningTeam: sourceMatch.winningTeam,
        notes: 'Imported from corrected August data pack',
        createdAt: now()
      }));
      const roundsPlayed = Math.max(1, sourceMatch.teamAScore + sourceMatch.teamBScore);
      const importedRows = [];
      for (const row of sourceMatch.rows) {
        const canonicalName = canonicalImportName(row.name);
        const playerId = await getOrCreatePlayerId(canonicalName);
        if (canonicalName !== row.name) await addAliasIfMissing(playerId, row.name);
        if (row.displayName && canonicalName !== row.displayName) await addAliasIfMissing(playerId, row.displayName);

        const advancedMissing = hasUnseenAdvancedStats(row);
        const syntheticCombat = hasSyntheticCombatStats(row);
        const logoutPenalty = isMissingAugustPackRow(row);
        importedRows.push({
          matchId,
          playerId,
          team: row.team,
          result: row.result,
          kills: row.kills,
          deaths: row.deaths,
          assists: row.assists,
          damage: advancedMissing ? undefined : deriveDamageFromAdr(row.adr, roundsPlayed),
          hsPercent: advancedMissing ? undefined : row.hsPercent,
          utilityDamage: advancedMissing ? undefined : row.utilityDamage,
          enemyFlashed: advancedMissing ? undefined : row.enemyFlashed,
          mvps: row.mvps,
          points: points(row.result, row.kills, row.assists, row.deaths),
          scoringEligible: true,
          scoreOverride: logoutPenalty ? 0 : undefined,
          pointsOverride: logoutPenalty ? 0 : undefined,
          gapFill: row.gapFill === true,
          participationNote: logoutPenalty
            ? 'Logout penalty: player appeared earlier in the matchday but left before the final screenshot. Counts as a game with zero Score.'
            : syntheticCombat
              ? 'Combat statistics were average-filled as the supplied logout penalty and are included in scoring.'
              : advancedMissing
              ? 'Advanced statistics were not visible; scoring uses the missing-data fallback.'
              : row.gapFillReason
        });
      }
      await db.match_players.bulkAdd(importedRows);
    }
  }

  await ensureAugust19KnifeEvents();
  localStorage.setItem('cs2_imported_aug10_aug19_match_cards_v2', '1');
}

const august24Date = '2026-08-24';
const august24MatchDayTitle = 'War Wednesday - Aug 24, 2026';
const august24KnifeEvents = [
  { map: 'Dust II', attacker: 'Manson', victim: 'T-Rex' },
  { map: 'Dust II', attacker: 'Manson', victim: 'T-Rex' },
  { map: 'Ancient', attacker: 'Jin', victim: 'fatal_destiny' },
  { map: 'Mirage', attacker: 'Manson', victim: 'T-Rex' },
  { map: 'Mirage', attacker: 'Manson', victim: 'MAVERICK' }
];

async function ensureAugust24KnifeEvents() {
  const matches = await db.matches.where('date').equals(august24Date).toArray();
  const matchByMap = new Map(matches.map((match) => [match.map, match]));
  const desiredCounts = new Map<string, number>();

  for (const event of august24KnifeEvents) {
    const match = matchByMap.get(event.map);
    if (!match?.id) continue;
    const attackerId = await getOrCreatePlayerId(canonicalImportName(event.attacker));
    const victimId = await getOrCreatePlayerId(canonicalImportName(event.victim));
    const key = `${match.id}:${attackerId}:${victimId}`;
    const desired = (desiredCounts.get(key) || 0) + 1;
    desiredCounts.set(key, desired);
    const existing = await db.knife_events
      .where('matchId')
      .equals(match.id)
      .filter((knife) => knife.attackerPlayerId === attackerId && knife.victimPlayerId === victimId)
      .count();
    if (existing < desired) {
      await db.knife_events.add({
        matchId: match.id,
        attackerPlayerId: attackerId,
        victimPlayerId: victimId,
        createdAt: now()
      });
    }
  }
}

async function importAugust24DataIfMissing() {
  const flag = localStorage.getItem('cs2_imported_aug24_match_cards_v1');
  const existingMatches = await db.matches.where('date').equals(august24Date).toArray();
  if (flag === '1' && existingMatches.length === august24DataPack.length) {
    await ensureAugust24KnifeEvents();
    return;
  }

  if (existingMatches.length) {
    const matchIds = existingMatches.map((match) => match.id).filter((id): id is number => typeof id === 'number');
    const matchDayIds = [...new Set(existingMatches.map((match) => match.matchDayId).filter((id): id is number => typeof id === 'number'))];
    for (const matchId of matchIds) {
      await db.match_players.where('matchId').equals(matchId).delete();
      await db.knife_events.where('matchId').equals(matchId).delete();
      await db.matches.delete(matchId);
    }
    for (const matchDayId of matchDayIds) {
      if (await db.matches.where('matchDayId').equals(matchDayId).count() === 0) await db.match_days.delete(matchDayId);
    }
  }

  const season = await db.seasons.filter((item) => item.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const matchDayId = Number(await db.match_days.add({
    seasonId: Number(seasonId),
    title: august24MatchDayTitle,
    eventDate: august24Date,
    notes: 'Imported from the August 24 scoreboard data pack',
    createdAt: now()
  }));

  for (const sourceMatch of august24DataPack) {
    const matchId = Number(await db.matches.add({
      seasonId: Number(seasonId),
      matchDayId,
      date: august24Date,
      map: sourceMatch.map,
      teamAName: sourceMatch.teamAName,
      teamBName: sourceMatch.teamBName,
      teamAScore: sourceMatch.teamAScore,
      teamBScore: sourceMatch.teamBScore,
      winningTeam: sourceMatch.winningTeam,
      notes: 'Imported from the August 24 scoreboard data pack',
      createdAt: now()
    }));
    const roundsPlayed = Math.max(1, sourceMatch.teamAScore + sourceMatch.teamBScore);
    const rows = [];
    for (const row of sourceMatch.rows) {
      const canonicalName = canonicalImportName(row.name);
      const playerId = await getOrCreatePlayerId(canonicalName);
      if (canonicalName !== row.name) await addAliasIfMissing(playerId, row.name);
      if (row.displayName && canonicalName !== row.displayName) await addAliasIfMissing(playerId, row.displayName);
      rows.push({
        matchId,
        playerId,
        team: row.team,
        result: row.result as MatchResult,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        damage: deriveDamageFromAdr(row.adr, roundsPlayed),
        hsPercent: row.hsPercent,
        utilityDamage: row.utilityDamage,
        enemyFlashed: row.enemyFlashed,
        mvps: row.mvps,
        points: points(row.result as MatchResult, row.kills, row.assists, row.deaths),
        scoringEligible: true
      });
    }
    await db.match_players.bulkAdd(rows);
  }

  await ensureAugust24KnifeEvents();
  localStorage.setItem('cs2_imported_aug24_match_cards_v1', '1');
}

async function addAliasIfMissing(playerId: number, alias: string) {
  const existing = await db.player_aliases.where({ playerId, alias }).first();
  if (!existing) {
    await db.player_aliases.add({ playerId, alias });
  }
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
        damage: row.damage ?? undefined,
        hsPercent: row.hsPercent ?? undefined,
        mvps: 0,
        points: points(row.result, row.kills, row.assists, row.deaths),
        scoringEligible: row.scoringEligible !== false,
        participationNote: row.note
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

async function repairJune3InfernoPartialRowIfNeeded() {
  const inferno = (await db.matches.where('[date+map]').equals([june3Date, 'Inferno']).toArray())
    .sort((a, b) => (a.id || 0) - (b.id || 0))[0];
  const mereBaap = await db.players.where('name').equals('Mere Baap').first();
  if (!inferno?.id || !mereBaap?.id) return;

  const row = await db.match_players
    .where('[matchId+playerId]')
    .equals([inferno.id, mereBaap.id])
    .first();
  if (!row?.id) return;

  await db.match_players.update(row.id, {
    scoringEligible: false,
    participationNote: 'Partial-game scoreboard row; excluded from scoring.'
  });
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
        damage: row.damage ?? undefined,
        hsPercent: row.hsPercent ?? undefined,
        mvps: 0,
        points: points(row.result, row.kills, row.assists, row.deaths),
        scoringEligible: row.scoringEligible !== false,
        participationNote: row.note,
        gapFill: row.gapFill === true
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

async function importJune18DataIfMissing() {
  const flag = localStorage.getItem('cs2_imported_june18_match_cards_v1');
  const hasJune18 = await db.matches.where('date').equals(june18Date).count();
  if (flag === '1' || hasJune18 > 0) {
    localStorage.setItem('cs2_imported_june18_match_cards_v1', '1');
    return;
  }

  const season = await db.seasons.filter((s) => s.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const matchDayId = Number(await db.match_days.add({
    seasonId: Number(seasonId),
    title: june18MatchDayTitle,
    eventDate: june18Date,
    notes: 'Imported from June 18 spreadsheet',
    createdAt: now()
  }));

  const matchIdByMap = new Map<string, number>();
  for (const match of june18Matches) {
    const roundsPlayed = Math.max(1, match.teamAScore + match.teamBScore);
    const matchId = Number(await db.matches.add({
      seasonId: Number(seasonId),
      matchDayId,
      date: match.date,
      map: match.map,
      teamAName: match.teamAName || 'Side A',
      teamBName: match.teamBName || 'Side B',
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      winningTeam: match.winningTeam,
      notes: 'Imported from June 18 spreadsheet',
      createdAt: now()
    }));
    matchIdByMap.set(match.map, matchId);

    const rows = [];
    for (const row of match.rows) {
      const canonicalName = canonicalImportName(row.name);
      const playerId = await getOrCreatePlayerId(canonicalName);
      if (canonicalName !== row.name) {
        await addAliasIfMissing(playerId, row.name);
      }
      rows.push({
        matchId,
        playerId,
        team: row.team,
        result: row.result,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        // The June 18 workbook supplied ADR, while MatchPlayer.damage stores total damage.
        damage: deriveDamageFromAdr(row.damage, roundsPlayed),
        hsPercent: row.hsPercent ?? undefined,
        utilityDamage: row.utilityDamage ?? undefined,
        enemyFlashed: row.enemyFlashed ?? undefined,
        mvps: row.mvps ?? 0,
        points: points(row.result, row.kills, row.assists, row.deaths),
        scoringEligible: row.scoringEligible !== false,
        participationNote: row.note,
        gapFill: row.gapFill === true
      });
    }
    await db.match_players.bulkAdd(rows);
  }

  for (const ev of june18KnifeSeed) {
    const matchId = matchIdByMap.get(ev.map);
    if (!matchId) continue;
    const attackerName = canonicalImportName(ev.attacker);
    const victimName = canonicalImportName(ev.victim);
    const attackerId = await getOrCreatePlayerId(attackerName);
    const victimId = await getOrCreatePlayerId(victimName);
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

  localStorage.setItem('cs2_imported_june18_match_cards_v1', '1');
}

async function repairJune18DamageIfNeeded() {
  const matches = await db.matches.where('date').equals(june18Date).toArray();
  for (const match of matches) {
    if (!match.id) continue;
    const rows = await db.match_players.where('matchId').equals(match.id).toArray();
    const positiveDamage = rows.map((row) => Number(row.damage || 0)).filter((damage) => damage > 0).sort((a, b) => a - b);
    if (!positiveDamage.length) continue;
    const medianDamage = positiveDamage[Math.floor(positiveDamage.length / 2)];
    if (medianDamage > 300) continue;

    const roundsPlayed = Math.max(1, match.teamAScore + match.teamBScore);
    await Promise.all(rows.map((row) => row.id && Number(row.damage || 0) > 0
      ? db.match_players.update(row.id, { damage: Math.round(Number(row.damage) * roundsPlayed) })
      : Promise.resolve(0)));
  }
}

async function importJune24DataIfMissing() {
  const flag = localStorage.getItem('cs2_imported_june24_match_cards_v1');
  const hasJune24 = await db.matches.where('date').equals(june24Date).count();
  if (flag === '1' || hasJune24 > 0) {
    localStorage.setItem('cs2_imported_june24_match_cards_v1', '1');
    return;
  }

  const season = await db.seasons.filter((s) => s.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const matchDayId = Number(await db.match_days.add({
    seasonId: Number(seasonId),
    title: june24MatchDayTitle,
    eventDate: june24Date,
    notes: 'Imported from June 24 screenshots',
    createdAt: now()
  }));

  const allNames = Array.from(new Set(june24Matches.flatMap((m) => m.rows.map((r) => r.name))));
  for (const name of allNames) {
    const canonicalName = canonicalImportName(name);
    const playerId = await getOrCreatePlayerId(canonicalName);
    if (canonicalName !== name) {
      await addAliasIfMissing(playerId, name);
    }
  }

  const matchIdsInOrder: number[] = [];
  for (const match of june24Matches) {
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
      notes: 'Imported from June 24 screenshots',
      createdAt: now()
    }));
    matchIdsInOrder.push(matchId);

    const rows = [];
    for (const row of match.rows) {
      const canonicalName = canonicalImportName(row.name);
      const playerId = await getOrCreatePlayerId(canonicalName);
      if (canonicalName !== row.name) {
        await addAliasIfMissing(playerId, row.name);
      }
      rows.push({
        matchId,
        playerId,
        team: row.team,
        result: row.result,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        damage: row.damage ?? undefined,
        hsPercent: row.hsPercent ?? undefined,
        utilityDamage: row.utilityDamage ?? undefined,
        enemyFlashed: row.enemyFlashed ?? undefined,
        mvps: row.mvps ?? 0,
        points: points(row.result, row.kills, row.assists, row.deaths),
        scoringEligible: row.scoringEligible !== false,
        participationNote: row.note,
        gapFill: row.gapFill === true
      });
    }
    await db.match_players.bulkAdd(rows);
  }

  for (const ev of june24KnifeSeed) {
    const matchId = ev.matchIndex !== undefined ? matchIdsInOrder[ev.matchIndex] : undefined;
    if (!matchId) continue;
    const attackerName = ev.attacker === 'Django' ? 'Mr. DJANGO' : canonicalImportName(ev.attacker);
    const victimName = canonicalImportName(ev.victim);
    const attackerId = await getOrCreatePlayerId(attackerName);
    const victimId = await getOrCreatePlayerId(victimName);
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

  localStorage.setItem('cs2_imported_june24_match_cards_v1', '1');
}

async function repairJune24PartialRowsIfNeeded() {
  const inferno = await db.matches.where('[date+map]').equals([june24Date, 'Inferno']).first();
  if (!inferno?.id) return;

  for (const playerName of ['Mr. DJANGO', 'thomas']) {
    const player = await db.players.where('name').equals(playerName).first();
    if (!player?.id) continue;
    const row = await db.match_players
      .where('[matchId+playerId]')
      .equals([inferno.id, player.id])
      .first();
    if (row?.id) {
      await db.match_players.update(row.id, {
        scoringEligible: false,
        participationNote: 'Partial-game row; joined or left during the game.'
      });
    }
  }
}

async function replaceJuly7DataIfNeeded() {
  const flag = localStorage.getItem('cs2_imported_july7_match_cards_v3');
  const existingMatches = await db.matches.where('date').equals(july7Date).toArray();
  if (flag === '1' && existingMatches.length === july7Matches.length) return;

  const existingMatchIds = existingMatches.map((match) => match.id).filter((id): id is number => typeof id === 'number');
  const existingMatchDayIds = [...new Set(existingMatches.map((match) => match.matchDayId).filter((id): id is number => typeof id === 'number'))];

  for (const matchId of existingMatchIds) {
    await db.match_players.where('matchId').equals(matchId).delete();
    await db.knife_events.where('matchId').equals(matchId).delete();
    await db.matches.delete(matchId);
  }

  for (const matchDayId of existingMatchDayIds) {
    const remaining = await db.matches.where('matchDayId').equals(matchDayId).count();
    if (remaining === 0) {
      await db.match_days.delete(matchDayId);
    }
  }

  const season = await db.seasons.filter((s) => s.isCurrent).first() || await db.seasons.orderBy('id').last();
  let seasonId = season?.id;
  if (!seasonId) {
    seasonId = Number(await db.seasons.add({ name: 'Season 1', isCurrent: true, archived: false, createdAt: now() }));
  }

  const matchDayId = Number(await db.match_days.add({
    seasonId: Number(seasonId),
    title: july7MatchDayTitle,
    eventDate: july7Date,
    notes: 'Imported from July 7 screenshots',
    createdAt: now()
  }));

  for (const match of july7Matches) {
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
      notes: 'Imported from July 7 screenshots',
      createdAt: now()
    }));

    const rows = [];
    for (const row of match.rows) {
      const canonicalName = canonicalImportName(row.name);
      const playerId = await getOrCreatePlayerId(canonicalName);
      if (canonicalName !== row.name) {
        await addAliasIfMissing(playerId, row.name);
      }
      rows.push({
        matchId,
        playerId,
        team: row.team,
        result: row.result,
        kills: row.kills,
        deaths: row.deaths,
        assists: row.assists,
        damage: row.damage ?? undefined,
        hsPercent: row.hsPercent ?? undefined,
        mvps: row.mvps ?? 0,
        points: points(row.result, row.kills, row.assists, row.deaths),
        scoringEligible: row.scoringEligible !== false,
        participationNote: row.note,
        gapFill: row.gapFill === true
      });
    }
    await db.match_players.bulkAdd(rows);
  }

  localStorage.setItem('cs2_imported_july7_match_cards_v3', '1');
}

async function repairJune24Dust2IfNeeded() {
  const match = await db.matches.where('[date+map]').equals([june24Date, 'Dust II']).first();
  if (!match) return;

  const rows = await db.match_players.where('matchId').equals(match.id!).toArray();
  const rowByPlayer = new Map<number, MatchPlayer>();
  for (const row of rows) {
    rowByPlayer.set(row.playerId, row);
  }

  const updatesToApply: Array<{ rowId: number; patch: Partial<MatchPlayer> }> = [];
  const players = await db.players.toArray();
  const playerIdByName = new Map(players.map((p) => [p.name, p.id || 0]));
  const thomasId = playerIdByName.get('thomas') || 0;
  const drKushId = playerIdByName.get('DrKush') || 0;
  const voldemortId = playerIdByName.get('Voldemort') || 0;
  const aksId = playerIdByName.get('aks289') || playerIdByName.get('Aks') || 0;

  const setPatch = (playerId: number, patch: Partial<MatchPlayer>) => {
    const row = rowByPlayer.get(playerId);
    if (row?.id) updatesToApply.push({ rowId: row.id, patch });
  };

  setPatch(thomasId, { hsPercent: 53, damage: 1235, utilityDamage: 0, enemyFlashed: 2, mvps: 0 });
  setPatch(drKushId, { hsPercent: 33, damage: 1235, utilityDamage: 55, enemyFlashed: 12, mvps: 1 });
  setPatch(voldemortId, { hsPercent: 40, damage: 1045, utilityDamage: 68, enemyFlashed: 0, mvps: 0 });
  setPatch(aksId, { hsPercent: 31, damage: 855, utilityDamage: 40, enemyFlashed: 4, mvps: 0 });

  await Promise.all(updatesToApply.map((item) => db.match_players.update(item.rowId, item.patch)));
}

async function mergeAmanAliasIfNeeded() {
  const aman = await db.players.where('name').equals('Aman').first();
  const aliasPlayer = await db.players
    .where('name')
    .anyOf(['amansanghv1', 'amansanghvi1'])
    .first();
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
    .filter((row) => row.alias === 'amansanghv1' || row.alias === 'amansanghvi1')
    .count();
  if (!hasAlias) {
    await db.player_aliases.add({ playerId: aman.id, alias: aliasPlayer.name });
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

async function repairJune11MirageResultsIfNeeded() {
  const match = await db.matches
    .where('[date+map]')
    .equals([june11Date, 'Mirage'])
    .first();
  if (!match) return;

  if (match.winningTeam !== 'Side A' || match.teamAScore !== 13 || match.teamBScore !== 11) {
    await db.matches.update(match.id!, {
      winningTeam: 'Side A',
      teamAScore: 13,
      teamBScore: 11
    });
  }

  const rows = await db.match_players.where('matchId').equals(match.id!).toArray();
  if (!rows.length) return;

  await Promise.all(rows.map((row) => {
    const result = row.team === 'Side A' ? 'WIN' : 'LOSS';
    return db.match_players.update(row.id!, {
      result,
      points: points(result, row.kills, row.assists, row.deaths)
    });
  }));
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
        damage: r.damage ?? undefined,
        hsPercent: r.hsPercent ?? undefined,
        mvps: 0,
        points: points(r.result, r.kills, r.assists, r.deaths),
        scoringEligible: r.scoringEligible !== false,
        participationNote: r.note
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
  await repairJune3InfernoPartialRowIfNeeded();
  await repairJune3Dust2IfNeeded();
  await importJune11DataIfMissing();
  await repairJune11UtilityStatsIfNeeded();
  await repairJune11MirageResultsIfNeeded();
  await importJune18DataIfMissing();
  await repairJune18DamageIfNeeded();
  await importJune24DataIfMissing();
  await repairJune24PartialRowsIfNeeded();
  await replaceJuly7DataIfNeeded();
  await importJuly22DataIfMissing();
  await repairJuly22DataIfNeeded();
  await importAug5DataIfMissing();
  await repairAug5KnifeStatsIfNeeded();
  await repairAug5SyntheticRowsIfNeeded();
  await importAugust10And19DataIfMissing();
  await importAugust24DataIfMissing();
  await repairJune24Dust2IfNeeded();
  await mergeAmanAliasIfNeeded();
}
