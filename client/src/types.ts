export interface PlayerData {
  id: string;
  name: string;
  lane: number;
  position: number;
  currentSpeed: number;
  isImpeded: boolean;
  impedesRemaining: number;
  finishTime: number | null;
  finishRank: number | null;
}

export interface GameStateData {
  status: 'waiting' | 'countdown' | 'running' | 'finished';
  players: PlayerData[];
  raceTime: number;
  countdown: number | null;
}

export interface RankingEntry {
  rank: number;
  name: string;
  lane: number;
  time: number;
  timesImpeded: number;
}

export type ClientMessage =
  | { type: 'JOIN_GAME'; name: string }
  | { type: 'START_GAME' }
  | { type: 'IMPEDE_RUNNER'; targetLane: number }
  | { type: 'RESTART_GAME' };

export type ServerMessage =
  | { type: 'PLAYER_ASSIGNED'; playerId: string; lane: number; name: string }
  | ({ type: 'LOBBY_UPDATE' } & GameStateData)
  | { type: 'COUNTDOWN_START'; countdown: number }
  | { type: 'GAME_START' }
  | ({ type: 'STATE_UPDATE' } & GameStateData)
  | { type: 'IMPEDE_EFFECT'; targetLane: number; attackerLane: number }
  | { type: 'GAME_END'; rankings: RankingEntry[] }
  | { type: 'GAME_RESET'; reason: string }
  | { type: 'ERROR'; message: string };
