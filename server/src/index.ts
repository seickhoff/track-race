import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { GameState, CONFIG, Player } from './GameState.js';
import { ClientMessage, ServerMessage } from './types.js';

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = createServer((req, res) => {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', CLIENT_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', players: game.players.size }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({
  server,
  verifyClient: (info, callback) => {
    const origin = info.origin || info.req.headers.origin;
    // Allow connections from CLIENT_URL or localhost for development
    const allowed =
      origin === CLIENT_URL ||
      origin?.startsWith('http://localhost') ||
      origin?.startsWith('http://127.0.0.1') ||
      false;
    callback(allowed);
  },
});
const game = new GameState();
const clients = new Map<WebSocket, string>();

let gameLoopInterval: NodeJS.Timeout | null = null;

function broadcast(message: ServerMessage): void {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastLobby(): void {
  broadcast({
    type: 'LOBBY_UPDATE',
    ...game.getState(),
  });
}

function broadcastState(): void {
  broadcast({
    type: 'STATE_UPDATE',
    ...game.getState(),
  });
}

function startGameLoop(): void {
  if (gameLoopInterval) return;

  gameLoopInterval = setInterval(() => {
    if (game.status === 'countdown') {
      const elapsed = Date.now() - game.countdownStart!;
      if (elapsed >= CONFIG.COUNTDOWN_SECONDS * 1000) {
        game.startRace();
        broadcast({ type: 'GAME_START' });
      } else {
        broadcastState();
      }
    } else if (game.status === 'running') {
      game.tick();
      broadcastState();

      if ((game.status as string) === 'finished') {
        broadcast({
          type: 'GAME_END',
          rankings: game.getRankings(),
        });
        stopGameLoop();
      }
    }
  }, CONFIG.TICK_RATE_MS);
}

function stopGameLoop(): void {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
  }
}

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', (data: Buffer) => {
    let message: ClientMessage;
    try {
      message = JSON.parse(data.toString());
    } catch {
      return;
    }

    switch (message.type) {
      case 'JOIN_GAME': {
        const name = message.name || `Player ${game.players.size + 1}`;
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const result = game.addPlayer(playerId, name);

        if ('error' in result) {
          send(ws, { type: 'ERROR', message: result.error });
        } else {
          clients.set(ws, playerId);
          send(ws, {
            type: 'PLAYER_ASSIGNED',
            playerId,
            lane: result.player.lane,
            name: result.player.name,
          });
          broadcastLobby();
        }
        break;
      }

      case 'START_GAME': {
        if (game.canStart()) {
          game.startCountdown();
          broadcast({
            type: 'COUNTDOWN_START',
            countdown: CONFIG.COUNTDOWN_SECONDS,
          });
          startGameLoop();
        }
        break;
      }

      case 'IMPEDE_RUNNER': {
        const playerId = clients.get(ws);
        if (!playerId) break;

        const result = game.impede(playerId, message.targetLane);
        if ('success' in result) {
          broadcast({
            type: 'IMPEDE_EFFECT',
            targetLane: result.targetLane,
            attackerLane: result.attackerLane,
          });
        }
        break;
      }

      case 'RESTART_GAME': {
        if (game.status === 'finished') {
          const currentPlayers = [...game.players.values()].map((p) => ({
            id: p.id,
            name: p.name,
            lane: p.lane,
          }));

          game.reset();

          for (const p of currentPlayers) {
            const newPlayer = new Player(p.id, p.name, p.lane);
            game.players.set(p.id, newPlayer);
            game.usedLanes.add(p.lane);
          }

          broadcastLobby();
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    const playerId = clients.get(ws);
    if (playerId) {
      const result = game.removePlayer(playerId);
      clients.delete(ws);

      if (result.gameReset) {
        stopGameLoop();
        broadcast({ type: 'GAME_RESET', reason: 'Not enough players' });
      } else {
        broadcastLobby();
      }
    }
    console.log('Client disconnected');
  });

  send(ws, {
    type: 'LOBBY_UPDATE',
    ...game.getState(),
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Accepting connections from: ${CLIENT_URL}`);
});
