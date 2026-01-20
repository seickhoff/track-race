import { GameStateData } from '../types';

interface HUDProps {
  gameState: GameStateData;
  myLane: number | null;
  canImpede: boolean;
  impedesRemaining: number;
  onStart: () => void;
  onRestart: () => void;
  onLeave: () => void;
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return seconds.toFixed(2) + 's';
}

export function HUD({
  gameState,
  myLane,
  canImpede,
  impedesRemaining,
  onStart,
  onRestart,
  onLeave,
}: HUDProps) {
  const canStartGame = gameState.status === 'waiting' && gameState.players.length >= 2;

  return (
    <div className="hud">
      <div className="hud__left">
        {myLane && <span className="hud__lane">Lane {myLane}</span>}
        <button className="btn btn--secondary btn--small" onClick={onLeave}>
          Leave
        </button>
      </div>

      <div className="hud__center">
        {gameState.status === 'waiting' && (
          <>
            <span className="hud__title">Waiting for Players</span>
            <span className="hud__subtitle">
              {gameState.players.length}/16 joined
              {gameState.players.length < 2 && ' (need 2+)'}
            </span>
          </>
        )}

        {gameState.status === 'countdown' && (
          <span className="hud__countdown">
            {gameState.countdown === 0 ? 'GO!' : gameState.countdown}
          </span>
        )}

        {gameState.status === 'running' && (
          <span className="hud__time">{formatTime(gameState.raceTime)}</span>
        )}

        {gameState.status === 'finished' && <span className="hud__title">Race Complete!</span>}
      </div>

      <div className="hud__right">
        {gameState.status === 'waiting' && canStartGame && (
          <button className="btn btn--primary btn--small" onClick={onStart}>
            Start Race
          </button>
        )}

        {gameState.status === 'running' && (
          <span className={`hud__impede ${canImpede ? 'hud__impede--ready' : ''}`}>
            {impedesRemaining > 0
              ? `${impedesRemaining} impede${impedesRemaining !== 1 ? 's' : ''} left`
              : 'No impedes left'}
          </span>
        )}

        {gameState.status === 'finished' && (
          <button className="btn btn--primary btn--small" onClick={onRestart}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
