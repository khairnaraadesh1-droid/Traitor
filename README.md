# Traitors

A multiplayer social deduction web game inspired by Mafia/Among Us. One hidden traitor among 4–6 players. Roles are assigned **only on the server** and revealed privately to each player.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Framer Motion, Socket.io Client, Zustand
- **Backend:** Node.js, Express, Socket.io, TypeScript

## Quick Start

### Prerequisites

- Node.js 18+

### Install

```bash
npm run install:all
```

Copy environment files:

```bash
cp .env.example server/.env
cp client/.env.local.example client/.env.local
```

### Run (development)

From the project root:

```bash
npm run dev
```

- **Client:** http://localhost:3000
- **Server:** http://localhost:3001

Open multiple browser tabs (or devices on the same network with updated URLs) to test multiplayer.

## Project Structure

```
traitor/
├── client/                 # Next.js frontend
│   ├── app/                # Pages (landing, room)
│   ├── components/         # UI & game components
│   ├── hooks/              # useSocket, useCountdown
│   ├── lib/                # socket, session, sounds
│   ├── store/              # Zustand (no roles stored)
│   └── types/
├── server/                 # Express + Socket.io
│   └── src/
│       ├── index.ts        # Socket events & phase flow
│       ├── gameManager.ts  # Room & game logic
│       └── types.ts
└── package.json            # Root dev scripts
```

## Security

- Roles exist **only** on the server
- Clients receive `your-role` via private socket emit only
- Public `room-update` payloads never include roles
- Roles are **not** stored in localStorage (only session token + nickname)
- All kills/votes validated server-side

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `create-room` | C→S | Host creates room |
| `join-room` | C→S | Join with code + nickname |
| `rejoin-request` | C→S | Reconnect after refresh |
| `start-game` | C→S | Host starts (4–6 players) |
| `your-role` | S→C | Private role assignment |
| `room-update` | S→C | Public room state |
| `night-start` | S→C | Night phase begins |
| `kill-player` | C→S | Traitor eliminates target |
| `morning-start` | S→C | Morning reveal |
| `voting-start` | S→C | Voting phase |
| `cast-vote` | C→S | Alive player votes |
| `voting-results` | S→C | Vote tally & elimination |
| `game-over` | S→C | Winner declared |
| `replay-game` | C→S | Host resets to lobby |

## Game Flow

1. Create or join room (4–6 players)
2. Host starts → random traitor assigned
3. Role reveal → Night → Traitor kills
4. Morning (60s discussion) → Voting → Results
5. Repeat until innocents eliminate traitor **or** traitor wins (≤2 alive)

## Production

Build both packages:

```bash
npm run build
```

Set `CLIENT_URL` and `NEXT_PUBLIC_SERVER_URL` to your deployed URLs.

## License

MIT
