export type MatchResult = 'WIN' | 'LOSS' | 'DRAW';

export interface Player {
  id?: number;
  name: string;
  createdAt: string;
}

export interface PlayerAlias {
  id?: number;
  playerId: number;
  alias: string;
}

export interface Season {
  id?: number;
  name: string;
  isCurrent: boolean;
  archived: boolean;
  createdAt: string;
}

export interface MatchDay {
  id?: number;
  seasonId: number;
  title: string;
  eventDate: string;
  notes?: string;
  createdAt: string;
}

export interface Match {
  id?: number;
  seasonId: number;
  matchDayId?: number;
  date: string;
  map: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  winningTeam: string;
  notes?: string;
  screenshotUrl?: string;
  duplicateMarked?: boolean;
  createdAt: string;
}

export interface MatchPlayer {
  id?: number;
  matchId: number;
  playerId: number;
  team: string;
  result: MatchResult;
  kills: number;
  deaths: number;
  assists: number;
  damage?: number;
  hsPercent?: number;
  utilityDamage?: number;
  enemyFlashed?: number;
  mvps: number;
  points: number;
}

export interface KnifeEvent {
  id?: number;
  matchId: number;
  attackerPlayerId: number;
  victimPlayerId: number;
  createdAt: string;
}
