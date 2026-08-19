import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import {
  assignRoles,
  canStartGame,
  castVote,
  checkWinCondition,
  createRoom,
  getPlayerRole,
  getRoom,
  getRoomSnapshot,
  joinRoom,
  leaveRoom,
  markDisconnected,
  processKill,
  resetRoomForReplay,
  setPhase,
  startMorning,
  startNight,
  startVoting,
  tallyVotes,
  ROLE_REVEAL_SECONDS,
  VOTE_RESULTS_SECONDS,
} from "./gameManager.js";
import type { Role, RoomState } from "./types.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const allowedOrigins = (process.env.CLIENT_URL ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: allowedOrigins }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

const socketRooms = new Map<string, string>();
const nightTimers = new Map<string, NodeJS.Timeout>();
const discussionTimers = new Map<string, NodeJS.Timeout>();
const phaseTimers = new Map<string, NodeJS.Timeout>();

function emitRoomUpdate(room: RoomState, voteCounts?: Record<string, number>) {
  io.to(room.code).emit("room-update", getRoomSnapshot(room, voteCounts));
}

function emitYourRole(socket: Socket, role: Role) {
  socket.emit("your-role", { role });
}

function clearRoomTimers(code: string) {
  for (const map of [nightTimers, discussionTimers, phaseTimers]) {
    const t = map.get(code);
    if (t) {
      clearTimeout(t);
      map.delete(code);
    }
  }
}

function attachSocketToRoom(socket: Socket, room: RoomState, sessionToken: string) {
  socketRooms.set(socket.id, room.code);
  socket.join(room.code);
  socket.data.roomCode = room.code;
  socket.data.sessionToken = sessionToken;
  emitRoomUpdate(room);
}

io.on("connection", (socket) => {
  socket.on("create-room", ({ nickname }: { nickname: string }) => {
    if (!nickname?.trim()) {
      socket.emit("error", { message: "Nickname required" });
      return;
    }
    const { room, sessionToken } = createRoom(socket.id, nickname);
    attachSocketToRoom(socket, room, sessionToken);
    socket.emit("room-joined", {
      code: room.code,
      sessionToken,
      isHost: true,
    });
  });

  socket.on(
    "join-room",
    ({
      code,
      nickname,
      sessionToken,
    }: {
      code: string;
      nickname: string;
      sessionToken?: string;
    }) => {
      if (!nickname?.trim() || !code?.trim()) {
        socket.emit("error", { message: "Room code and nickname required" });
        return;
      }
      const result = joinRoom(code, socket.id, nickname, sessionToken);
      if ("error" in result) {
        socket.emit("error", { message: result.error });
        return;
      }
      attachSocketToRoom(socket, result.room, result.sessionToken);
      socket.emit("room-joined", {
        code: result.room.code,
        sessionToken: result.sessionToken,
        isHost: result.room.hostId === socket.id,
        rejoined: result.rejoined,
      });
    }
  );

  socket.on("start-game", () => {
    const code = socket.data.roomCode as string | undefined;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) {
      socket.emit("error", { message: "Only host can start" });
      return;
    }
    const err = canStartGame(room);
    if (err) {
      socket.emit("error", { message: err });
      return;
    }

    assignRoles(room);
    clearRoomTimers(code);

    for (const player of room.players.values()) {
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        emitYourRole(playerSocket, player.role);
      }
    }

    io.to(code).emit("assign-role", { message: "Roles assigned" });
    emitRoomUpdate(room);

    const timer = setTimeout(() => {
      beginNightPhase(room);
    }, ROLE_REVEAL_SECONDS * 1000);
    phaseTimers.set(code, timer);
  });

  socket.on("kill-player", ({ targetId }: { targetId: string }) => {
    const code = socket.data.roomCode as string | undefined;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;

    const result = processKill(room, socket.id, targetId);
    if ("error" in result) {
      socket.emit("error", { message: result.error });
      return;
    }

    socket.emit("kill-confirmed");
    emitRoomUpdate(room);
    const existing = nightTimers.get(code);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      transitionToMorning(room);
    }, 3000);
    nightTimers.set(code, timer);
  });

  socket.on("cast-vote", ({ targetId }: { targetId: string }) => {
    const code = socket.data.roomCode as string | undefined;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;

    const result = castVote(room, socket.id, targetId);
    if ("error" in result) {
      socket.emit("error", { message: result.error });
      return;
    }

    socket.emit("vote-cast");
    emitRoomUpdate(room);

    if (result.allVoted) {
      finishVoting(room);
    }
  });

  socket.on("replay-game", () => {
    const code = socket.data.roomCode as string | undefined;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) {
      socket.emit("error", { message: "Only host can restart" });
      return;
    }
    clearRoomTimers(code);
    resetRoomForReplay(room);
    io.to(code).emit("game-reset");
    emitRoomUpdate(room);
  });

  socket.on("leave-room", () => {
    const code = socket.data.roomCode as string | undefined;
    if (!code) return;
    const room = getRoom(code);
    if (!room || room.phase !== "lobby") {
      socket.emit("error", { message: "Cannot leave during an active game" });
      return;
    }
    socket.leave(code);
    socketRooms.delete(socket.id);
    delete socket.data.roomCode;
    delete socket.data.sessionToken;
    const updated = leaveRoom(code, socket.id);
    if (updated) {
      emitRoomUpdate(updated);
    } else {
      clearRoomTimers(code);
    }
  });

  socket.on("rejoin-request", ({ code, sessionToken, nickname }: { code: string; sessionToken: string; nickname: string }) => {
    const result = joinRoom(code, socket.id, nickname, sessionToken);
    if ("error" in result) {
      socket.emit("error", { message: result.error });
      return;
    }
    attachSocketToRoom(socket, result.room, result.sessionToken);
    const role = getPlayerRole(result.room, socket.id);
    if (role && result.room.phase !== "lobby") {
      emitYourRole(socket, role);
    }
    socket.emit("room-joined", {
      code: result.room.code,
      sessionToken: result.sessionToken,
      isHost: result.room.hostId === socket.id,
      rejoined: true,
    });
  });

  socket.on("disconnect", () => {
    const code = socketRooms.get(socket.id);
    if (!code) return;
    socketRooms.delete(socket.id);
    const room = markDisconnected(code, socket.id);
    if (room) {
      emitRoomUpdate(room);
    } else {
      clearRoomTimers(code);
    }
  });
});

function beginNightPhase(room: RoomState) {
  startNight(room);
  io.to(room.code).emit("night-start", { message: "Night falls..." });
  emitRoomUpdate(room);

  const traitor = Array.from(room.players.values()).find(
    (p) => p.role === "traitor" && p.alive
  );
  if (!traitor) {
    endGame(room, "innocents");
    return;
  }

  const timer = setTimeout(() => {
    if (room.phase === "night" && !room.nightKillTarget) {
      transitionToMorning(room);
    }
  }, 45000);
  nightTimers.set(room.code, timer);
}

function transitionToMorning(room: RoomState) {
  const code = room.code;
  const nt = nightTimers.get(code);
  if (nt) {
    clearTimeout(nt);
    nightTimers.delete(code);
  }

  startMorning(room);
  io.to(code).emit("morning-start", {
    victim: room.lastNightVictim,
    message: room.lastNightVictim
      ? `${room.lastNightVictim.nickname} was eliminated`
      : "No one was eliminated",
  });
  emitRoomUpdate(room);

  const winner = checkWinCondition(room);
  if (winner) {
    endGame(room, winner);
    return;
  }

  const timer = setTimeout(() => {
    beginVotingPhase(room);
  }, 60000);
  discussionTimers.set(code, timer);
}

function beginVotingPhase(room: RoomState) {
  const code = room.code;
  const dt = discussionTimers.get(code);
  if (dt) {
    clearTimeout(dt);
    discussionTimers.delete(code);
  }

  startVoting(room);
  io.to(code).emit("voting-start");
  emitRoomUpdate(room);

  const timer = setTimeout(() => {
    if (room.phase === "voting") {
      finishVoting(room);
    }
  }, 60000);
  phaseTimers.set(code, timer);
}

function finishVoting(room: RoomState) {
  const code = room.code;
  clearRoomTimers(code);

  const { eliminated, voteCounts } = tallyVotes(room);
  setPhase(room, "vote-results");

  io.to(code).emit("voting-results", {
    eliminated,
    voteCounts,
    message: eliminated
      ? `${eliminated.nickname} was voted out`
      : "No one was eliminated (tie or no votes)",
  });
  emitRoomUpdate(room, voteCounts);

  const winner = checkWinCondition(room);
  if (winner) {
    const timer = setTimeout(() => {
      endGame(room, winner);
    }, VOTE_RESULTS_SECONDS * 1000);
    phaseTimers.set(code, timer);
    return;
  }

  const timer = setTimeout(() => {
    const w = checkWinCondition(room);
    if (w) {
      endGame(room, w);
      return;
    }
    beginNightPhase(room);
  }, VOTE_RESULTS_SECONDS * 1000);
  phaseTimers.set(code, timer);
}

function endGame(room: RoomState, winner: "innocents" | "traitor") {
  clearRoomTimers(room.code);
  room.winner = winner;
  room.phase = "ended";
  io.to(room.code).emit("game-over", { winner });
  emitRoomUpdate(room);
}

httpServer.listen(PORT, () => {
  console.log(`Traitors server running on port ${PORT}`);
});
