import { v4 as uuidv4 } from "uuid";
import type {
  GamePhase,
  Player,
  PublicPlayer,
  Role,
  RoomSnapshot,
  RoomState,
} from "./types.js";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 6;
const DISCUSSION_SECONDS = 60;
const ROLE_REVEAL_SECONDS = 5;
const VOTE_RESULTS_SECONDS = 5;

const rooms = new Map<string, RoomState>();

function generateRoomCode(): string {
  let code: string;
  do {
    code = uuidv4().replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  } while (rooms.has(code));
  return code;
}

function toPublicPlayer(player: Player, hostId: string): PublicPlayer {
  return {
    id: player.socketId,
    nickname: player.nickname,
    alive: player.alive,
    connected: player.connected,
    isHost: player.socketId === hostId,
  };
}

function reattachPlayer(
  room: RoomState,
  existing: Player,
  oldSocketId: string,
  newSocketId: string
): void {
  room.players.delete(oldSocketId);
  existing.socketId = newSocketId;
  existing.connected = true;
  room.players.set(newSocketId, existing);
  room.sessionToSocket.set(existing.sessionToken, newSocketId);
  if (room.hostId === oldSocketId) {
    room.hostId = newSocketId;
  }

  // Migrate votes
  if (room.votes.has(oldSocketId)) {
    const target = room.votes.get(oldSocketId)!;
    room.votes.delete(oldSocketId);
    room.votes.set(newSocketId, target);
  }
  for (const [voter, target] of room.votes.entries()) {
    if (target === oldSocketId) {
      room.votes.set(voter, newSocketId);
    }
  }

  // Migrate night kill target
  if (room.nightKillTarget === oldSocketId) {
    room.nightKillTarget = newSocketId;
  }

  // Migrate last victims
  if (room.lastNightVictim && room.lastNightVictim.id === oldSocketId) {
    room.lastNightVictim.id = newSocketId;
  }
  if (room.lastVotedOut && room.lastVotedOut.id === oldSocketId) {
    room.lastVotedOut.id = newSocketId;
  }
}

function getSnapshot(room: RoomState, voteCounts?: Record<string, number>): RoomSnapshot {
  const players = Array.from(room.players.values()).map((p) =>
    toPublicPlayer(p, room.hostId)
  );
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players,
    discussionEndsAt: room.discussionEndsAt,
    roleRevealEndsAt: room.roleRevealEndsAt,
    lastNightVictim: room.lastNightVictim,
    lastVotedOut: room.lastVotedOut,
    winner: room.winner,
    voteCounts,
  };
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code.toUpperCase());
}

export function createRoom(hostSocketId: string, nickname: string): {
  room: RoomState;
  sessionToken: string;
} {
  const code = generateRoomCode();
  const sessionToken = uuidv4();
  const player: Player = {
    socketId: hostSocketId,
    nickname: nickname.trim().slice(0, 20),
    role: "innocent",
    alive: true,
    connected: true,
    hasVoted: false,
    sessionToken,
  };

  const room: RoomState = {
    code,
    hostId: hostSocketId,
    phase: "lobby",
    players: new Map([[hostSocketId, player]]),
    sessionToSocket: new Map([[sessionToken, hostSocketId]]),
    nightKillTarget: null,
    votes: new Map(),
    lastNightVictim: null,
    lastVotedOut: null,
    winner: null,
    discussionEndsAt: null,
    roleRevealEndsAt: null,
  };

  rooms.set(code, room);
  return { room, sessionToken };
}

export function joinRoom(
  code: string,
  socketId: string,
  nickname: string,
  sessionToken?: string
): { room: RoomState; sessionToken: string; rejoined: boolean } | { error: string } {
  const cleanCode = code.trim().toUpperCase();
  const room = rooms.get(cleanCode);
  if (!room) return { error: "Room not found" };

  const trimmedNick = nickname.trim().slice(0, 20);

  // If session token provided, check for reattachment
  if (sessionToken) {
    const existingSocketId = room.sessionToSocket.get(sessionToken);
    if (existingSocketId) {
      const existing = room.players.get(existingSocketId);
      if (existing) {
        reattachPlayer(room, existing, existingSocketId, socketId);
        return { room, sessionToken, rejoined: true };
      }
    }
  }

  if (room.phase !== "lobby") {
    return { error: "Game already in progress" };
  }

  if (room.players.size >= MAX_PLAYERS) {
    return { error: "Room is full (max 6 players)" };
  }

  for (const p of room.players.values()) {
    if (p.nickname.toLowerCase() === trimmedNick.toLowerCase()) {
      return { error: "Nickname already taken" };
    }
  }

  const newToken = uuidv4();
  const player: Player = {
    socketId,
    nickname: trimmedNick,
    role: "innocent",
    alive: true,
    connected: true,
    hasVoted: false,
    sessionToken: newToken,
  };
  room.players.set(socketId, player);
  room.sessionToSocket.set(newToken, socketId);
  return { room, sessionToken: newToken, rejoined: false };
}

/** Player closed tab / lost connection — keep slot for rejoin */
export function markDisconnected(
  code: string,
  socketId: string
): RoomState | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  const player = room.players.get(socketId);
  if (player) {
    player.connected = false;
  }

  if (room.hostId === socketId && room.phase === "lobby") {
    const nextHost = Array.from(room.players.values()).find(
      (p) => p.connected && p.socketId !== socketId
    );
    if (nextHost) room.hostId = nextHost.socketId;
  }

  const anyConnected = Array.from(room.players.values()).some((p) => p.connected);
  if (!anyConnected && (room.phase === "lobby" || room.phase === "ended")) {
    rooms.delete(room.code);
    return null;
  }

  return room;
}

/** Player explicitly leaves the lobby */
export function leaveRoom(code: string, socketId: string): RoomState | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  const player = room.players.get(socketId);
  if (player) {
    room.sessionToSocket.delete(player.sessionToken);
    room.players.delete(socketId);
  }

  if (room.players.size === 0) {
    rooms.delete(room.code);
    return null;
  }

  if (room.hostId === socketId) {
    const next = Array.from(room.players.values()).find((p) => p.connected);
    if (next) room.hostId = next.socketId;
  }

  return room;
}

export function getRoomSnapshot(room: RoomState, voteCounts?: Record<string, number>): RoomSnapshot {
  return getSnapshot(room, voteCounts);
}

export function canStartGame(room: RoomState): string | null {
  if (room.phase !== "lobby") return "Game already started";
  const connected = Array.from(room.players.values()).filter((p) => p.connected);
  if (connected.length < MIN_PLAYERS) {
    return `Need at least ${MIN_PLAYERS} connected players`;
  }
  if (connected.length > MAX_PLAYERS) return `Maximum ${MAX_PLAYERS} players`;
  return null;
}

export function assignRoles(room: RoomState): void {
  // Purge any disconnected players from lobby before starting
  for (const [socketId, p] of Array.from(room.players.entries())) {
    if (!p.connected) {
      room.sessionToSocket.delete(p.sessionToken);
      room.players.delete(socketId);
    }
  }

  const playerList = Array.from(room.players.values());
  const traitorIndex = Math.floor(Math.random() * playerList.length);
  playerList.forEach((p, i) => {
    p.role = i === traitorIndex ? "traitor" : "innocent";
    p.alive = true;
    p.hasVoted = false;
  });
  room.phase = "role-reveal";
  room.roleRevealEndsAt = Date.now() + ROLE_REVEAL_SECONDS * 1000;
  room.winner = null;
  room.lastNightVictim = null;
  room.lastVotedOut = null;
  room.votes.clear();
  room.nightKillTarget = null;
  room.discussionEndsAt = null;
}

export function getPlayerRole(room: RoomState, socketId: string): Role | null {
  return room.players.get(socketId)?.role ?? null;
}

export function startNight(room: RoomState): void {
  room.phase = "night";
  room.nightKillTarget = null;
  room.votes.clear();
  for (const p of room.players.values()) {
    p.hasVoted = false;
  }
}

export function processKill(
  room: RoomState,
  killerSocketId: string,
  targetSocketId: string
): { success: true } | { error: string } {
  if (room.phase !== "night") return { error: "Not night phase" };
  const killer = room.players.get(killerSocketId);
  if (!killer || !killer.alive) return { error: "You cannot act" };
  if (killer.role !== "traitor") return { error: "Only the traitor can kill" };
  if (room.nightKillTarget) return { error: "Target already chosen" };

  const target = room.players.get(targetSocketId);
  if (!target || !target.alive) return { error: "Invalid target" };
  if (targetSocketId === killerSocketId) return { error: "Cannot kill yourself" };

  room.nightKillTarget = targetSocketId;
  return { success: true };
}

export function startMorning(room: RoomState): void {
  room.phase = "morning";
  room.discussionEndsAt = Date.now() + DISCUSSION_SECONDS * 1000;

  if (room.nightKillTarget) {
    const victim = room.players.get(room.nightKillTarget);
    if (victim && victim.alive) {
      victim.alive = false;
      room.lastNightVictim = { id: victim.socketId, nickname: victim.nickname };
    } else {
      room.lastNightVictim = null;
    }
  } else {
    room.lastNightVictim = null;
  }
}

export function startVoting(room: RoomState): void {
  room.phase = "voting";
  room.discussionEndsAt = null;
  room.votes.clear();
  for (const p of room.players.values()) {
    p.hasVoted = false;
  }
}

export function castVote(
  room: RoomState,
  voterSocketId: string,
  targetSocketId: string
): { error: string } | { success: true; allVoted: boolean } {
  if (room.phase !== "voting") return { error: "Not voting phase" };
  const voter = room.players.get(voterSocketId);
  if (!voter || !voter.alive) return { error: "Dead players cannot vote" };
  if (voter.hasVoted) return { error: "Already voted" };
  if (voterSocketId === targetSocketId) return { error: "Cannot vote for yourself" };

  const target = room.players.get(targetSocketId);
  if (!target || !target.alive) return { error: "Invalid target" };

  voter.hasVoted = true;
  room.votes.set(voterSocketId, targetSocketId);

  const alivePlayers = Array.from(room.players.values()).filter((p) => p.alive);
  const voteCount = alivePlayers.filter((p) => p.hasVoted).length;
  return { success: true, allVoted: voteCount >= alivePlayers.length };
}

export function tallyVotes(room: RoomState): {
  eliminated: { id: string; nickname: string; role: Role } | null;
  voteCounts: Record<string, number>;
} {
  const voteCounts: Record<string, number> = {};
  for (const targetId of room.votes.values()) {
    voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
  }

  let maxVotes = 0;
  let eliminatedId: string | null = null;
  let hasTie = false;

  for (const [targetId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = targetId;
      hasTie = false;
    } else if (count === maxVotes && maxVotes > 0) {
      hasTie = true;
    }
  }

  if (hasTie || !eliminatedId || maxVotes === 0) {
    return { eliminated: null, voteCounts };
  }

  const eliminated = room.players.get(eliminatedId);
  if (!eliminated || !eliminated.alive) return { eliminated: null, voteCounts };

  eliminated.alive = false;
  const result = {
    id: eliminated.socketId,
    nickname: eliminated.nickname,
    role: eliminated.role,
  };
  room.lastVotedOut = result;
  return { eliminated: result, voteCounts };
}

export function checkWinCondition(room: RoomState): "innocents" | "traitor" | null {
  const alive = Array.from(room.players.values()).filter((p) => p.alive);
  const traitorAlive = alive.some((p) => p.role === "traitor");
  const traitorDead = !traitorAlive;

  if (traitorDead) return "innocents";
  if (alive.length <= 2 && traitorAlive) return "traitor";
  return null;
}

export function setPhase(room: RoomState, phase: GamePhase): void {
  room.phase = phase;
}

export function resetRoomForReplay(room: RoomState): void {
  room.phase = "lobby";
  room.winner = null;
  room.lastNightVictim = null;
  room.lastVotedOut = null;
  room.nightKillTarget = null;
  room.votes.clear();
  room.discussionEndsAt = null;
  room.roleRevealEndsAt = null;
  for (const p of room.players.values()) {
    p.role = "innocent";
    p.alive = true;
    p.hasVoted = false;
  }
}

export { MIN_PLAYERS, MAX_PLAYERS, ROLE_REVEAL_SECONDS, VOTE_RESULTS_SECONDS, DISCUSSION_SECONDS };
