import { create } from "zustand";
import type { RoomSnapshot } from "@/types";

interface GameStore {
  room: RoomSnapshot | null;
  myId: string | null;
  isHost: boolean;
  connected: boolean;
  loading: boolean;
  toast: { message: string; type: "info" | "error" | "success" } | null;
  hasVoted: boolean;
  killConfirmed: boolean;
  setRoom: (room: RoomSnapshot | null) => void;
  setMyId: (id: string | null) => void;
  setIsHost: (isHost: boolean) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  showToast: (message: string, type?: "info" | "error" | "success") => void;
  clearToast: () => void;
  setHasVoted: (v: boolean) => void;
  setKillConfirmed: (v: boolean) => void;
  resetGameFlags: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  myId: null,
  isHost: false,
  connected: false,
  loading: false,
  toast: null,
  hasVoted: false,
  killConfirmed: false,
  setRoom: (room) => set({ room }),
  setMyId: (myId) => set({ myId }),
  setIsHost: (isHost) => set({ isHost }),
  setConnected: (connected) => set({ connected }),
  setLoading: (loading) => set({ loading }),
  showToast: (message, type = "info") =>
    set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
  setHasVoted: (hasVoted) => set({ hasVoted }),
  setKillConfirmed: (killConfirmed) => set({ killConfirmed }),
  resetGameFlags: () => set({ hasVoted: false, killConfirmed: false }),
}));
