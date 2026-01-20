import { PlayerData } from '../types';

interface RunnerProps {
  player: PlayerData;
  isMe: boolean;
  canClick: boolean;
  onClick: () => void;
  isImpededNow: boolean;
  isRunning: boolean;
}

export function Runner({ player, isMe, canClick, onClick, isImpededNow, isRunning }: RunnerProps) {
  const positionPercent = (player.position / 100) * 100;

  return (
    <div
      className={`runner ${isMe ? 'runner--me' : ''} ${isImpededNow ? 'runner--impeded' : ''} ${
        canClick ? 'runner--clickable' : ''
      } ${player.finishRank ? 'runner--finished' : ''} ${isRunning && !player.finishRank ? 'runner--running' : ''}`}
      style={{ left: `${positionPercent}%` }}
      onClick={canClick ? onClick : undefined}
      title={`${player.name}${isMe ? ' (You)' : ''}`}
    >
      {canClick && <div className="runner__hitarea" />}
      <div className="runner__sprite" />
      <div className="runner__label">
        <span className="runner__name">{player.name}</span>
        {player.finishRank && <span className="runner__rank">#{player.finishRank}</span>}
      </div>
    </div>
  );
}
