# Multiplayer Tic-Tac-Toe — LILA Assignment

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast iteration, strong typing |
| Game backend | Nakama (TypeScript runtime) | Built for realtime multiplayer — handles matchmaking, state sync, leaderboards natively |
| Database | PostgreSQL (Railway managed) | Nakama's default; persistent leaderboard storage |
| Deployment | Railway | Free tier, Docker-native, zero cold-start |

---

## Architecture

```
Browser A ──WebSocket──┐
                       ├── Nakama Server (authoritative) ── PostgreSQL
Browser B ──WebSocket──┘
```

### Server-authoritative design

All game logic runs in `nakama/modules/main.ts` on the server. The client only sends intent (e.g. `{ position: 4 }`) — the server validates, applies, and broadcasts the new state to all players. Clients have no ability to:

- Move out of turn
- Move to an occupied cell
- Manipulate the board directly
- Fake a win

### Match lifecycle

1. Player calls `find_match` RPC → server finds a waiting match or creates one
2. Both players join via WebSocket `joinMatch`
3. Server broadcasts `game_start` when 2 players are connected
4. Players send moves via `sendMatchState` (opcode 0)
5. Server validates → applies → broadcasts new state to both players
6. Server tracks a 30s turn timer per tick; forfeits on timeout
7. On game over, winner's score is written to the global leaderboard
8. Disconnected player causes opponent to win automatically

### Concurrent game support

Each match runs as an isolated Nakama match instance. There is no shared state between matches. The `find_match` RPC queries `nk.matchList()` for matches labeled `"waiting"` — so concurrent games scale horizontally without coordination.

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- Docker + Docker Compose

### 1. Build the Nakama module

```bash
cd nakama
npm install
npm run build
# Creates build/index.js
```

### 2. Start Nakama locally

```bash
cd nakama
docker-compose up
```

Nakama console: http://localhost:7350  
Default credentials: `admin` / `password`

### 3. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # edit if needed
npm run dev
```

Open http://localhost:3000 in **two different browser windows** to test multiplayer.

---

## Deployment (Railway)

### Deploy Nakama

1. Create a new Railway project
2. Add a **PostgreSQL** plugin — Railway auto-injects `DATABASE_URL`
3. Add a new service → **Deploy from Docker image** → `heroiclabs/nakama:3.21.1`
4. Set environment variables:

```
DATABASE_ADDRESS=<from Railway postgres plugin — format: user:pass@host:port/db>
RUNTIME_JS_ENTRYPOINT=build/index.js
```

5. Mount your `nakama/build/` directory or add a build step that runs `npm run build` before the image starts
6. Expose port `7350` (HTTP API) publicly

> Tip: Railway gives each service a public domain like `nakama-production-xxxx.up.railway.app`

### Deploy the frontend

Option A — Vercel (easiest):
```bash
cd frontend
npm run build
npx vercel deploy dist/
```

Option B — Railway static:
Add another Railway service pointing to the `frontend/` folder with build command `npm run build` and publish directory `dist`.

Set environment variables in Vercel/Railway:
```
VITE_NAKAMA_HOST=your-nakama-service.up.railway.app
VITE_NAKAMA_PORT=443
VITE_NAKAMA_SSL=true
VITE_NAKAMA_SERVER_KEY=defaultkey
```

---

## Testing Multiplayer

1. Open the deployed URL in **two separate browser tabs** (or two devices)
2. Enter different nicknames → click Play → Find Match in both tabs
3. They should pair automatically within a few seconds
4. Make moves — both boards update in real time
5. Let the timer run out to test forfeit by timeout
6. Close one tab mid-game to test disconnect handling
7. After a game ends, check the leaderboard on the game-over screen

---

## API / Server Configuration

| Config | Value |
|---|---|
| Nakama HTTP port | 7350 |
| Match tick rate | 1 tick/sec |
| Turn timer | 30 seconds |
| Leaderboard ID | `global_wins` |
| Leaderboard sort | Descending (most wins first) |
| Session TTL | 2 hours |
| Server key | `defaultkey` (change in prod via `--server.key`) |

### RPC endpoints

| RPC | Description |
|---|---|
| `find_match` | Returns a waiting match ID or creates a new one |
| `get_leaderboard` | Returns top 10 players by wins |

### Match opcodes (WebSocket messages)

| Opcode | Direction | Description |
|---|---|---|
| 0 | Client → Server | Player move: `{ position: 0-8 }` |
| 1 | Server → Client | Game events: `game_start`, `move`, `game_over`, `waiting` |
| 2 | Server → Client | Error messages |
| 3 | Server → Client | Timer tick: `{ secondsLeft, turn }` |

---

## Design Decisions & Tradeoffs

**Why Nakama over a custom WebSocket server?**  
Nakama handles session management, matchmaking, presence tracking, and leaderboards out of the box. Writing this infrastructure from scratch would take 3-5x longer and would be less battle-tested. For a multiplayer game backend, it's the right tool.

**Why TypeScript runtime over Lua?**  
Better type safety and familiar ecosystem. The Nakama JS/TS runtime compiles to a single bundle via esbuild — no external dependencies are needed at runtime.

**What breaks at 1000 concurrent games?**  
The current single-node setup would become CPU-bound at high match counts due to Nakama's per-tick loop. At scale, I would: (1) switch to a Nakama cluster behind a load balancer, (2) use Redis for session storage, (3) split match creation and RPC into separate services.

**What I cut for scope:**
- Spectator mode (would require read-only socket listeners per match)
- Private rooms with invite codes (needs RPC for room ID generation + custom match label)
- Rematch with same opponent (needs persistent opponent pairing after game_over)
