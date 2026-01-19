import { useWebSocket } from './hooks/useWebSocket';
import { Lobby } from './components/Lobby';
import { Track } from './components/Track';
import { HUD } from './components/HUD';
import { Results } from './components/Results';

export function App() {
  const {
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
  } = useWebSocket();

  if (!playerId) {
    return <Lobby onJoin={join} connected={connected} />;
  }

  const isFinished = gameState.status === 'finished' && rankings;

  return (
    <div className="game">
      <HUD
        gameState={gameState}
        myLane={myLane}
        canImpede={canImpede}
        impedesRemaining={impedesRemaining}
        onStart={startGame}
        onRestart={restartGame}
        onLeave={leaveLobby}
      />
      <div className="game__content">
        {isFinished ? (
          <Results rankings={rankings} myLane={myLane} />
        ) : (
          <Track
            players={gameState.players}
            myLane={myLane}
            canImpede={canImpede}
            onImpede={impedeRunner}
            impedeTarget={lastImpede?.targetLane ?? null}
            gameRunning={gameState.status === 'running'}
          />
        )}
      </div>
    </div>
  );
}
