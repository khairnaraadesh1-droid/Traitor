"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/gameStore";
import type { RoomSnapshot } from "@/types";
import type { Role } from "@/types";

type RoleHandler = (role: Role | null) => void;

export function useSocket(roleHandler?: RoleHandler) {
  const roleHandlerRef = useRef(roleHandler);
  roleHandlerRef.current = roleHandler;

  const {
    setRoom,
    setMyId,
    setConnected,
    showToast,
    setHasVoted,
    setKillConfirmed,
    resetGameFlags,
  } = useGameStore();

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      setMyId(socket.id ?? null);
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onRoomUpdate = (room: RoomSnapshot) => {
      setRoom(room);
    };

    const onYourRole = ({ role }: { role: Role }) => {
      roleHandlerRef.current?.(role);
    };

    const onError = ({ message }: { message: string }) => {
      showToast(message, "error");
    };

    const onConnectError = () => {
      showToast("Cannot reach game server — is it running?", "error");
    };

    const onVoteCast = () => {
      setHasVoted(true);
    };

    const onKillConfirmed = () => {
      setKillConfirmed(true);
    };

    const onGameReset = () => {
      resetGameFlags();
      roleHandlerRef.current?.(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room-update", onRoomUpdate);
    socket.on("your-role", onYourRole);
    socket.on("error", onError);
    socket.on("vote-cast", onVoteCast);
    socket.on("kill-confirmed", onKillConfirmed);
    socket.on("game-reset", onGameReset);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("room-update", onRoomUpdate);
      socket.off("your-role", onYourRole);
      socket.off("error", onError);
      socket.off("vote-cast", onVoteCast);
      socket.off("kill-confirmed", onKillConfirmed);
      socket.off("game-reset", onGameReset);
    };
  }, [
    setRoom,
    setMyId,
    setConnected,
    showToast,
    setHasVoted,
    setKillConfirmed,
    resetGameFlags,
  ]);

  return getSocket();
}
