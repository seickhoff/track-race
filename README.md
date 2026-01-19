# Track Race

A real-time multiplayer 100m sprint game built with WebSockets, Node.js, and React. Up to 16 players race head-to-head, with the ability to click on opponents to temporarily slow them down.

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd track-race

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running the Game

You need two terminals - one for the server and one for the client.

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```
Server runs on `ws://localhost:3001`

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```
Client runs on `http://localhost:5173`

Open multiple browser tabs to test multiplayer locally.

## Architecture

```
track-race/
├── client/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── Track.tsx     # Track container
│   │   │   ├── Lane.tsx      # Individual lane
│   │   │   ├── Runner.tsx    # Animated stick figure
│   │   │   ├── HUD.tsx       # Header controls
│   │   │   ├── Lobby.tsx     # Join form
│   │   │   └── Results.tsx   # Post-race rankings
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts  # WebSocket connection & state
│   │   ├── types.ts          # Shared TypeScript types
│   │   ├── App.tsx
│   │   └── index.css         # All styling
│   └── package.json
│
├── server/                   # Node.js + WebSocket (ws) + TypeScript
│   ├── src/
│   │   ├── index.ts          # WebSocket server, message handling
│   │   ├── GameState.ts      # Game logic, Player class, CONFIG
│   │   └── types.ts          # Shared TypeScript types
│   └── package.json
│
├── .prettierrc
├── CLAUDE.md                 # Detailed game documentation
└── README.md
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript |
| Backend | Node.js, ws (WebSocket library), TypeScript |
| Styling | CSS (no framework) |
| Code Style | Prettier |

### Server Architecture

The server is **authoritative** - all game state lives on the server to prevent cheating.

**Game Loop (20 ticks/sec):**
```
every 50ms:
  - Update fatigue factors (random speed variation)
  - Apply/remove impede effects
  - Update player positions
  - Check for race completion
  - Broadcast STATE_UPDATE to all clients
```

**Key Files:**
- `server/src/GameState.ts` - Contains `CONFIG` constants, `Player` class, and `GameState` class
- `server/src/index.ts` - WebSocket server setup and message routing

### Client Architecture

React app with a custom `useWebSocket` hook that manages:
- Connection state and auto-reconnect
- Player assignment
- Game state updates
- Action dispatching (join, start, impede, restart, leave)

**Key Files:**
- `client/src/hooks/useWebSocket.ts` - All WebSocket logic
- `client/src/App.tsx` - Main component, routes between Lobby and Game views

## Game Rules

- **Players**: 2-16 (one per lane)
- **Race**: 100 meters
- **Speed**: All players have same base speed (8 m/s), with random fatigue fluctuations (±5%)
- **Impede**: Click another runner to slow them 30% for 500ms. Limited to 3 impedes per race.
- **Win**: First to cross finish line

## WebSocket Protocol

### Client -> Server

| Message | Payload | Description |
|---------|---------|-------------|
| `JOIN_GAME` | `{ name: string }` | Join lobby with display name |
| `START_GAME` | - | Start countdown (needs 2+ players) |
| `IMPEDE_RUNNER` | `{ targetLane: number }` | Slow down a runner |
| `RESTART_GAME` | - | Reset to lobby after race |

### Server -> Client

| Message | Payload | Description |
|---------|---------|-------------|
| `PLAYER_ASSIGNED` | `{ playerId, lane, name }` | Confirm join |
| `LOBBY_UPDATE` | Game state | Player list changed |
| `STATE_UPDATE` | Game state | Tick update during race |
| `IMPEDE_EFFECT` | `{ targetLane, attackerLane }` | Visual feedback |
| `GAME_END` | `{ rankings }` | Final results |
| `GAME_RESET` | `{ reason }` | Game reset |
| `ERROR` | `{ message }` | Error message |

## Configuration

Edit `server/src/GameState.ts` to tune game balance:

```typescript
export const CONFIG = {
  MAX_PLAYERS: 16,
  RACE_DISTANCE: 100,
  BASE_SPEED_MIN: 8,           // m/s
  BASE_SPEED_MAX: 8,           // m/s (same = equal base speed)
  FATIGUE_VARIATION: 0.05,     // ±5% random speed fluctuation
  FATIGUE_CHANGE_CHANCE: 0.15, // 15% chance per tick to change
  IMPEDE_SLOW_PERCENT: 0.3,    // 30% speed reduction
  IMPEDE_DURATION_MS: 500,     // How long slow lasts
  MAX_IMPEDES_PER_RACE: 3,     // Impedes per player per race
  TICK_RATE_MS: 50,            // 20 ticks/sec
  COUNTDOWN_SECONDS: 3,
  MIN_PLAYERS_TO_START: 2,
};
```

## Development

```bash
# Format code
npx prettier --write .

# Type check (in each directory)
npx tsc --noEmit
```

## License

MIT
