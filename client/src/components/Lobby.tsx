import { useState } from 'react';

interface LobbyProps {
  onJoin: (name: string) => void;
  connected: boolean;
}

export function Lobby({ onJoin, connected }: LobbyProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  if (!connected) {
    return (
      <div className="lobby">
        <h1>Track Race</h1>
        <p className="lobby__status">Connecting to server...</p>
      </div>
    );
  }

  return (
    <div className="lobby">
      <h1>Track Race</h1>
      <p className="lobby__subtitle">100m Sprint - Up to 16 Players</p>
      <form onSubmit={handleSubmit} className="lobby__form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="lobby__input"
          autoFocus
        />
        <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
          Join Race
        </button>
      </form>
    </div>
  );
}
