export type Role = "traitor" | "innocent";

export type GamePhase =
  | "lobby"
  | "role-reveal"
  | "night"
  | "morning"
  | "voting"
  | "vote-results"
  | "ended";

export interface Player {
  socketId: string;
  nickname: string;
  role: Role;
  alive: boolean;
  connected: boolean;
  hasVoted: boolean;
  sessionToken: string;
}

/** Safe player data sent to clients — never includes role */
export interface PublicPlayer {
  id: string;
  nickname: string;
  alive: boolean;
  connected: boolean;
  isHost: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  phase: GamePhase;
  players: Map<string, Player>;
  sessionToSocket: Map<string, string>;
  nightKillTarget: string | null;
  votes: Map<string, string>;
  lastNightVictim: { id: string; nickname: string } | null;
  lastVotedOut: { id: string; nickname: string; role: Role } | null;
  winner: "innocents" | "traitor" | null;
  discussionEndsAt: number | null;
  roleRevealEndsAt: number | null;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  phase: GamePhase;
  players: PublicPlayer[];
  discussionEndsAt: number | null;
  roleRevealEndsAt: number | null;
  lastNightVictim: { id: string; nickname: string } | null;
  lastVotedOut: { id: string; nickname: string; role: Role } | null;
  winner: "innocents" | "traitor" | null;
  voteCounts?: Record<string, number>;
}
