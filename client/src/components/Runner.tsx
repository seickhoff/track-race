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
      <div className="runner__figure">
        <div className="runner__head"></div>
        <div className="runner__body"></div>
        <div className="runner__legs">
          <div className="runner__leg runner__leg--front"></div>
          <div className="runner__leg runner__leg--back"></div>
        </div>
        <div className="runner__arms">
          <div className="runner__arm runner__arm--front"></div>
          <div className="runner__arm runner__arm--back"></div>
        </div>
      </div>
      <div className="runner__label">
        <span className="runner__name">{player.name}</span>
        {player.finishRank && <span className="runner__rank">#{player.finishRank}</span>}
      </div>
    </div>
  );
}
