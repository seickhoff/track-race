import { PlayerData } from '../types';
import { Runner } from './Runner';

interface LaneProps {
  laneNumber: number;
  player: PlayerData;
  isMe: boolean;
  canImpede: boolean;
  onImpede: (lane: number) => void;
  isImpededNow: boolean;
  gameRunning: boolean;
}

export function Lane({
  laneNumber,
  player,
  isMe,
  canImpede,
  onImpede,
  isImpededNow,
  gameRunning,
}: LaneProps) {
  const canClick = gameRunning && !isMe && canImpede && !player.finishRank;

  return (
    <div className={`lane ${isMe ? 'lane--me' : ''}`}>
      <div className="lane__number">{laneNumber}</div>
      <div className="lane__track">
        <div className="lane__marker-75" />
        <div className="lane__finish-line" />
        <Runner
          player={player}
          isMe={isMe}
          canClick={canClick}
          onClick={() => onImpede(laneNumber)}
          isImpededNow={isImpededNow}
          isRunning={gameRunning}
        />
      </div>
    </div>
  );
}
