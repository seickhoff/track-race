import { RankingEntry } from '../types';

interface ResultsProps {
  rankings: RankingEntry[];
  myLane: number | null;
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return seconds.toFixed(2) + 's';
}

function getMedal(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}

function getPlaceLabel(rank: number): string {
  switch (rank) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    default:
      return `${rank}th`;
  }
}

export function Results({ rankings, myLane }: ResultsProps) {
  return (
    <div className="results">
      <div className="results__header">
        <h2 className="results__title">Final Results</h2>
      </div>
      <div className="results__list">
        {rankings.map((entry) => (
          <div
            key={entry.lane}
            className={`results__entry ${entry.lane === myLane ? 'results__entry--me' : ''} ${
              entry.rank <= 3 ? 'results__entry--podium' : ''
            }`}
          >
            <div className="results__rank">
              <span className="results__medal">{getMedal(entry.rank)}</span>
              <span className="results__place">{getPlaceLabel(entry.rank)}</span>
            </div>
            <div className="results__name">{entry.name}</div>
            <div className="results__stats">
              <span className="results__time">{formatTime(entry.time)}</span>
              {entry.timesImpeded > 0 && (
                <span className="results__impeded">{entry.timesImpeded}x slowed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
