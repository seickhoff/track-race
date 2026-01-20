import { useEffect, useRef, useState, useCallback } from 'react';
import { ClientMessage, ServerMessage, GameStateData, RankingEntry } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface UseWebSocketReturn {
  connected: boolean;
  playerId: string | null;
  myLane: number | null;
  gameState: GameStateData;
  rankings: RankingEntry[] | null;
  lastImpede: { targetLane: number; attackerLane: number } | null;
  canImpede: boolean;
  impedesRemaining: number;
  join: (name: string) => void;
  startGame: () => void;
  impedeRunner: (targetLane: number) => void;
  restartGame: () => void;
  leaveLobby: () => void;
}

const initialGameState: GameStateData = {
  status: 'waiting',
  players: [],
  raceTime: 0,
  countdown: null,
};

export function useWebSocket(): UseWebSocketReturn {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [myLane, setMyLane] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameStateData>(initialGameState);
  const [rankings, setRankings] = useState<RankingEntry[] | null>(null);
  const [lastImpede, setLastImpede] = useState<{
    targetLane: number;
    attackerLane: number;
  } | null>(null);

  // Derive impedesRemaining from current player's data
  const myPlayer = gameState.players.find((p) => p.lane === myLane);
  const impedesRemaining = myPlayer?.impedesRemaining ?? 3;
  const canImpede = impedesRemaining > 0;

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      socket = new WebSocket(WS_URL);
      ws.current = socket;

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onclose = () => {
        setConnected(false);
        setPlayerId(null);
        setMyLane(null);
        // Attempt to reconnect after 2 seconds
        reconnectTimeout = setTimeout(connect, 2000);
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onmessage = (event) => {
        const message: ServerMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'PLAYER_ASSIGNED':
            setPlayerId(message.playerId);
            setMyLane(message.lane);
            break;

          case 'LOBBY_UPDATE':
          case 'STATE_UPDATE':
            setGameState({
              status: message.status,
              players: message.players,
              raceTime: message.raceTime,
              countdown: message.countdown,
            });
            if (message.status === 'waiting') {
              setRankings(null);
            }
            break;

          case 'GAME_END':
            setRankings(message.rankings);
            break;

          case 'IMPEDE_EFFECT':
            setLastImpede({
              targetLane: message.targetLane,
              attackerLane: message.attackerLane,
            });
            setTimeout(() => setLastImpede(null), 500);
            break;

          case 'GAME_RESET':
            setGameState(initialGameState);
            setRankings(null);
            break;
        }
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      socket.close();
    };
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const join = useCallback(
    (name: string) => {
      send({ type: 'JOIN_GAME', name });
    },
    [send]
  );

  const startGame = useCallback(() => {
    send({ type: 'START_GAME' });
  }, [send]);

  const impedeRunner = useCallback(
    (targetLane: number) => {
      if (!canImpede) return;
      send({ type: 'IMPEDE_RUNNER', targetLane });
    },
    [send, canImpede]
  );

  const restartGame = useCallback(() => {
    send({ type: 'RESTART_GAME' });
  }, [send]);

  const leaveLobby = useCallback(() => {
    setPlayerId(null);
    setMyLane(null);
    setGameState(initialGameState);
    setRankings(null);
    // Close and reconnect to reset server-side state
    ws.current?.close();
  }, []);

  return {
    connected,
    playerId,
    myLane,
    gameState,
    rankings,
    lastImpede,
    canImpede,
    impedesRemaining,
    join,
    startGame,
    impedeRunner,
    restartGame,
    leaveLobby,
  };
}
