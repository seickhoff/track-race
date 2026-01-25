import { PlayerData, GameStateData, RankingEntry } from './types.js';

export const CONFIG = {
  MAX_PLAYERS: 16,
  RACE_DISTANCE: 100,
  BASE_SPEED_MIN: 8,
  BASE_SPEED_MAX: 8,
  FATIGUE_VARIATION: 0.05, // +/- 5% random speed fluctuation
  FATIGUE_CHANGE_CHANCE: 0.15, // 15% chance per tick to change fatigue
  IMPEDE_SLOW_PERCENT: 0.3,
  IMPEDE_DURATION_MS: 500,
  MAX_IMPEDES_PER_RACE: 3, // Each player can impede others max 3 times per race
  TICK_RATE_MS: 50,
  COUNTDOWN_SECONDS: 3,
  MIN_PLAYERS_TO_START: 2,
} as const;

export class Player {
  id: string;
  name: string;
  lane: number;
  position: number;
  baseSpeed: number;
  currentSpeed: number;
  fatigueFactor: number; // Current fatigue multiplier (0.95 to 1.05)
  impededUntil: number;
  impedesUsed: number; // How many times this player has impeded others
  timesImpeded: number;
  finishTime: number | null;
  finishRank: number | null;

  constructor(id: string, name: string, lane: number) {
    this.id = id;
    this.name = name;
    this.lane = lane;
    this.position = 0;
    this.baseSpeed =
      CONFIG.BASE_SPEED_MIN + Math.random() * (CONFIG.BASE_SPEED_MAX - CONFIG.BASE_SPEED_MIN);
    this.fatigueFactor = 1.0;
    this.currentSpeed = this.baseSpeed;
    this.impededUntil = 0;
    this.impedesUsed = 0;
    this.timesImpeded = 0;
    this.finishTime = null;
    this.finishRank = null;
  }

  updateFatigue(): void {
    // Randomly decide whether to change fatigue this tick
    if (Math.random() < CONFIG.FATIGUE_CHANGE_CHANCE) {
      // Generate new fatigue factor within range
      const variation = CONFIG.FATIGUE_VARIATION;
      this.fatigueFactor = 1 + (Math.random() * 2 - 1) * variation;
    }
  }

  toJSON(): PlayerData {
    return {
      id: this.id,
      name: this.name,
      lane: this.lane,
      position: this.position,
      currentSpeed: this.currentSpeed,
      isImpeded: Date.now() < this.impededUntil,
      impedesRemaining: CONFIG.MAX_IMPEDES_PER_RACE - this.impedesUsed,
      finishTime: this.finishTime,
      finishRank: this.finishRank,
    };
  }
}

type AddPlayerResult = { error: string } | { player: Player };
type ImpedeResult = { error: string } | { success: true; targetLane: number; attackerLane: number };

export class GameState {
  status: 'waiting' | 'countdown' | 'running' | 'finished';
  players: Map<string, Player>;
  startTime: number | null;
  countdownStart: number | null;
  finishOrder: string[];
  usedLanes: Set<number>;

  constructor() {
    this.status = 'waiting';
    this.players = new Map();
    this.startTime = null;
    this.countdownStart = null;
    this.finishOrder = [];
    this.usedLanes = new Set();
  }

  reset(): void {
    this.status = 'waiting';
    this.players = new Map();
    this.startTime = null;
    this.countdownStart = null;
    this.finishOrder = [];
    this.usedLanes = new Set();
  }

  addPlayer(id: string, name: string): AddPlayerResult {
    if (this.players.size >= CONFIG.MAX_PLAYERS) {
      return { error: 'Game is full' };
    }
    if (this.status !== 'waiting') {
      return { error: 'Game already in progress' };
    }

    let lane = 1;
    while (this.usedLanes.has(lane) && lane <= CONFIG.MAX_PLAYERS) {
      lane++;
    }

    const player = new Player(id, name, lane);
    this.players.set(id, player);
    this.usedLanes.add(lane);

    return { player };
  }

  removePlayer(id: string): { gameReset: boolean } {
    const player = this.players.get(id);
    if (player) {
      this.usedLanes.delete(player.lane);
      this.players.delete(id);
    }

    if (this.status !== 'waiting' && this.players.size < CONFIG.MIN_PLAYERS_TO_START) {
      this.reset();
      return { gameReset: true };
    }
    return { gameReset: false };
  }

  canStart(): boolean {
    return this.status === 'waiting' && this.players.size >= CONFIG.MIN_PLAYERS_TO_START;
  }

  startCountdown(): boolean {
    if (!this.canStart()) return false;
    this.status = 'countdown';
    this.countdownStart = Date.now();
    return true;
  }

  startRace(): void {
    this.status = 'running';
    this.startTime = Date.now();
    for (const player of this.players.values()) {
      player.position = 0;
      player.finishTime = null;
      player.finishRank = null;
      player.timesImpeded = 0;
      player.impedesUsed = 0;
    }
    this.finishOrder = [];
  }

  impede(attackerId: string, targetLane: number): ImpedeResult {
    const attacker = this.players.get(attackerId);
    if (!attacker) return { error: 'Attacker not found' };
    if (this.status !== 'running') return { error: 'Race not running' };

    if (attacker.lane === targetLane) return { error: 'Cannot impede yourself' };

    if (attacker.impedesUsed >= CONFIG.MAX_IMPEDES_PER_RACE) {
      return { error: 'No impedes remaining' };
    }

    let target: Player | null = null;
    for (const p of this.players.values()) {
      if (p.lane === targetLane) {
        target = p;
        break;
      }
    }
    if (!target) return { error: 'Target not found' };
    if (target.finishTime) return { error: 'Target already finished' };

    const now = Date.now();
    attacker.impedesUsed++;
    target.impededUntil = now + CONFIG.IMPEDE_DURATION_MS;
    target.currentSpeed = target.baseSpeed * (1 - CONFIG.IMPEDE_SLOW_PERCENT);
    target.timesImpeded++;

    return { success: true, targetLane, attackerLane: attacker.lane };
  }

  tick(): void {
    if (this.status !== 'running') return;

    const now = Date.now();
    const deltaTime = CONFIG.TICK_RATE_MS / 1000;

    for (const player of this.players.values()) {
      if (player.finishTime) continue;

      // Update fatigue randomly
      player.updateFatigue();

      // Calculate current speed based on impede and fatigue
      if (now >= player.impededUntil) {
        player.currentSpeed = player.baseSpeed * player.fatigueFactor;
      } else {
        // When impeded, apply both impede penalty and fatigue
        player.currentSpeed =
          player.baseSpeed * (1 - CONFIG.IMPEDE_SLOW_PERCENT) * player.fatigueFactor;
      }

      player.position += player.currentSpeed * deltaTime;

      if (player.position >= CONFIG.RACE_DISTANCE) {
        player.position = CONFIG.RACE_DISTANCE;
        player.finishTime = now - this.startTime!;
        player.finishRank = this.finishOrder.length + 1;
        this.finishOrder.push(player.id);
      }
    }

    const allFinished = [...this.players.values()].every((p) => p.finishTime !== null);
    if (allFinished) {
      this.status = 'finished';
    }
  }

  getState(): GameStateData {
    const players = [...this.players.values()].map((p) => p.toJSON());
    return {
      status: this.status,
      players,
      raceTime: this.startTime ? Date.now() - this.startTime : 0,
      countdown: this.countdownStart
        ? Math.max(
            0,
            CONFIG.COUNTDOWN_SECONDS - Math.floor((Date.now() - this.countdownStart) / 1000)
          )
        : null,
    };
  }

  getRankings(): RankingEntry[] {
    return this.finishOrder.map((id, index) => {
      const player = this.players.get(id)!;
      return {
        rank: index + 1,
        name: player.name,
        lane: player.lane,
        time: player.finishTime!,
        timesImpeded: player.timesImpeded,
      };
    });
  }
}
