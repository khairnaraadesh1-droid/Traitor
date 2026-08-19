export type Role = "traitor" | "innocent";

export type GamePhase =
  | "lobby"
  | "role-reveal"
  | "night"
  | "morning"
  | "voting"
  | "vote-results"
  | "ended";

export interface PublicPlayer {
  id: string;
  nickname: string;
  alive: boolean;
  connected: boolean;
  isHost: boolean;
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
