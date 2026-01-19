import { PlayerData } from '../types';
import { Lane } from './Lane';

interface TrackProps {
  players: PlayerData[];
  myLane: number | null;
  canImpede: boolean;
  onImpede: (lane: number) => void;
  impedeTarget: number | null;
  gameRunning: boolean;
}

export function Track({
  players,
  myLane,
  canImpede,
  onImpede,
  impedeTarget,
  gameRunning,
}: TrackProps) {
  const playersByLane = new Map<number, PlayerData>();
  players.forEach((p) => playersByLane.set(p.lane, p));

  // Only render lanes that have players
  const lanesWithPlayers = players.map((p) => p.lane).sort((a, b) => a - b);

  return (
    <div className="track">
      {lanesWithPlayers.map((laneNum) => (
        <Lane
          key={laneNum}
          laneNumber={laneNum}
          player={playersByLane.get(laneNum)!}
          isMe={laneNum === myLane}
          canImpede={canImpede}
          onImpede={onImpede}
          isImpededNow={impedeTarget === laneNum}
          gameRunning={gameRunning}
        />
      ))}
    </div>
  );
}
