# Track Race - Multiplayer Sprint Game

A real-time multiplayer 100m sprint game where up to 16 players compete. Players can click on opponents to temporarily slow them down.

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + WebSocket (ws library) + TypeScript
- **Code Style**: Prettier

## Project Structure

```
track-race/
├── client/                   # Vite React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Track.tsx     # Track container, renders lanes
│   │   │   ├── Lane.tsx      # Individual lane with runner
│   │   │   ├── Runner.tsx    # Animated stick figure runner
│   │   │   ├── HUD.tsx       # Header with game controls
│   │   │   ├── Lobby.tsx     # Join game form
│   │   │   └── Results.tsx   # Post-race rankings display
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── tsconfig.json
├── server/                   # WebSocket server
│   ├── src/
│   │   ├── index.ts
│   │   ├── GameState.ts
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
├── .prettierrc
└── CLAUDE.md
```

## Game Rules

- **Max Players**: 16 (one per lane)
- **Race Distance**: 100 meters
- **Win Condition**: First to reach 100m wins

### Runner Properties

| Property | Description |
|----------|-------------|
| `id` | Unique player identifier |
| `lane` | Lane number (1-16) |
| `position` | Current position (0-100) |
| `baseSpeed` | Normal speed (8 m/s for all players) |
| `currentSpeed` | Active speed (affected by impediments and fatigue) |
| `fatigueFactor` | Random speed fluctuation (0.95 to 1.05) |
| `impedesRemaining` | How many impedes the player can still use (max 3) |

### Impede Mechanic

- Click on another runner to slow them
- **Effect**: -30% speed for 500ms
- **Limit**: 3 impedes per player per race (no cooldown)
- Cannot target yourself or finished runners
- Results screen shows how many times each player was impeded

### Fatigue System

- All players have the same base speed (8 m/s)
- 15% chance per tick to change fatigue factor
- Fatigue varies speed by ±5%, creating race variety

## Visual Features

- **Realistic Track**: Terracotta-colored track with green grass surrounds
- **Animated Runners**: Stick figures with animated arms and legs
- **Lane Lines**: White lane dividers, distance markers at 25% and 50%
- **Finish Line**: Checkered black and white pattern
- **Your Runner**: Highlighted in cyan/teal color
- **Impeded State**: Runner turns red and shakes
- **Finished State**: Runner stops animating, head turns gold

## WebSocket Messages

### Client -> Server

| Type | Payload | Description |
|------|---------|-------------|
| `JOIN_GAME` | `{ name }` | Join the lobby |
| `IMPEDE_RUNNER` | `{ targetLane }` | Slow down a runner |
| `START_GAME` | - | Any player starts the game |
| `RESTART_GAME` | - | Restart after game ends |

### Server -> Client

| Type | Payload | Description |
|------|---------|-------------|
| `PLAYER_ASSIGNED` | `{ playerId, lane, name }` | Confirm join |
| `LOBBY_UPDATE` | `{ status, players, ... }` | Player list changed |
| `COUNTDOWN_START` | `{ countdown }` | Race countdown started |
| `GAME_START` | - | Race has begun |
| `STATE_UPDATE` | `{ status, players, raceTime, countdown }` | Game tick |
| `IMPEDE_EFFECT` | `{ targetLane, attackerLane }` | Visual feedback |
| `GAME_END` | `{ rankings }` | Race finished with times and impede counts |
| `GAME_RESET` | `{ reason }` | Game reset (e.g., not enough players) |
| `ERROR` | `{ message }` | Error message |

## Running the Game

### Server

```bash
cd server
npm install
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

Then open http://localhost:5173 in multiple browser tabs/windows to test multiplayer.

## Balance Tuning

Edit `server/src/GameState.ts` CONFIG object:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `BASE_SPEED_MIN/MAX` | 8/8 m/s | Base speed (same for all players) |
| `FATIGUE_VARIATION` | 0.05 | ±5% random speed fluctuation |
| `FATIGUE_CHANGE_CHANCE` | 0.15 | 15% chance per tick to change fatigue |
| `IMPEDE_SLOW_PERCENT` | 0.3 (30%) | Speed reduction when impeded |
| `IMPEDE_DURATION_MS` | 500ms | How long slow lasts |
| `MAX_IMPEDES_PER_RACE` | 3 | Max impede actions per player per race |
| `TICK_RATE_MS` | 50ms | Server update interval (20 ticks/sec) |
| `COUNTDOWN_SECONDS` | 3 | Pre-race countdown |
| `MIN_PLAYERS_TO_START` | 2 | Minimum players to start race |

## Server Architecture

### Game Loop (20 ticks/sec)

```
every 50ms:
  if countdown:
    check if countdown finished -> start race
  if running:
    for each player:
      randomly update fatigue factor
      if now > impededUntil:
        currentSpeed = baseSpeed * fatigueFactor
      else:
        currentSpeed = baseSpeed * (1 - impedeSlowPercent) * fatigueFactor
      position += currentSpeed * deltaTime
      if position >= 100:
        mark as finished
    if all finished:
      end game
  broadcast STATE_UPDATE
```

### Anti-Cheat

- Server is authoritative for all game state
- Limit impede actions (max 3 per race)
- Validate all client messages
- Ignore invalid or late messages
