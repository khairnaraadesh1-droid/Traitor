"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Particles } from "@/components/effects/Particles";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlayerList } from "@/components/game/PlayerList";
import { GameView } from "@/components/game/GameView";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { getSocket } from "@/lib/socket";
import { loadSession, saveSession, clearSession } from "@/lib/session";
import { playJoin } from "@/lib/sounds";
import type { Role } from "@/types";

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const upperCode = code.toUpperCase();
  const router = useRouter();

  const [myRole, setMyRole] = useState<Role | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [joining, setJoining] = useState(false);

  const roleRef = useCallback((role: Role | null) => {
    setMyRole(role);
  }, []);

  useSocket((role) => roleRef(role));

  const {
    room,
    myId,
    isHost,
    connected,
    loading,
    setLoading,
    setIsHost,
    showToast,
    setMyId,
  } = useGameStore();

  useEffect(() => {
    const session = loadSession();
    const socket = getSocket();

    if (!session || session.roomCode !== upperCode) {
      setHasSession(false);
      return;
    }

    setHasSession(true);
    setIsHost(session.isHost);

    const tryRejoin = () => {
      setLoading(true);
      socket.emit("rejoin-request", {
        code: session.roomCode,
        sessionToken: session.sessionToken,
        nickname: session.nickname,
      });
    };

    const onJoined = (data: {
      code: string;
      sessionToken: string;
      isHost: boolean;
      rejoined?: boolean;
    }) => {
      saveSession({
        roomCode: data.code,
        sessionToken: data.sessionToken,
        nickname: session.nickname,
        isHost: data.isHost,
      });
      setIsHost(data.isHost);
      setMyId(getSocket().id ?? null);
      setLoading(false);
    };

    socket.on("room-joined", onJoined);

    if (socket.connected) {
      tryRejoin();
    } else {
      socket.on("connect", tryRejoin);
    }

    return () => {
      socket.off("room-joined", onJoined);
      socket.off("connect", tryRejoin);
    };
  }, [upperCode, setLoading, setIsHost, setMyId]);

  const handleDirectJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) {
      showToast("Please enter a nickname", "error");
      return;
    }

    setJoining(true);
    const socket = getSocket();

    const cleanup = () => {
      socket.off("room-joined", onJoined);
      socket.off("error", onError);
    };

    const onJoined = (data: {
      code: string;
      sessionToken: string;
      isHost: boolean;
    }) => {
      playJoin();
      saveSession({
        roomCode: data.code,
        sessionToken: data.sessionToken,
        nickname: nicknameInput.trim(),
        isHost: data.isHost,
      });
      setIsHost(data.isHost);
      setMyId(socket.id ?? null);
      setHasSession(true);
      setJoining(false);
      cleanup();
    };

    const onError = ({ message }: { message: string }) => {
      showToast(message, "error");
      setJoining(false);
      cleanup();
    };

    socket.on("room-joined", onJoined);
    socket.on("error", onError);

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit("join-room", {
      code: upperCode,
      nickname: nicknameInput.trim(),
    });
  };

  const handleStart = () => {
    getSocket().emit("start-game");
  };

  const handleLeave = () => {
    const socket = getSocket();
    if (room?.phase === "lobby") {
      socket.emit("leave-room");
    }
    clearSession();
    router.push("/");
  };

  const connectedCount =
    room?.players.filter((p) => p.connected).length ?? 0;

  const inGame = room && room.phase !== "lobby";

  if (inGame) {
    return (
      <GameView
        roomCode={upperCode}
        myRole={myRole}
        onRoleClear={() => setMyRole(null)}
      />
    );
  }

  if (hasSession === false) {
    return (
      <main className="relative min-h-dvh flex items-center justify-center p-4">
        <Particles />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <GlassCard className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">
                Join Room
              </p>
              <p className="font-display text-4xl tracking-[0.2em] text-blood-glow text-glow">
                {upperCode}
              </p>
            </div>

            <form onSubmit={handleDirectJoin} className="space-y-4">
              <Input
                label="Your Nickname"
                placeholder="Enter your name"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                maxLength={20}
                autoFocus
                disabled={joining}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => router.push("/")}
                  disabled={joining}
                >
                  ← Home
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={joining}
                  fullWidth
                >
                  {joining ? "Joining…" : "Join Game"}
                </Button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh">
      <Particles />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-lg mx-auto px-4 py-8"
      >
        <motion.div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={handleLeave}>
            ← Leave
          </Button>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              connected ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
            }`}
          >
            {connected ? "Connected" : "Reconnecting…"}
          </span>
        </motion.div>

        <GlassCard className="p-6 sm:p-8">
          <motion.div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">
              Room Code
            </p>
            <motion.p
              key={upperCode}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="font-display text-4xl tracking-[0.2em] text-blood-glow text-glow"
            >
              {upperCode}
            </motion.p>
            <p className="text-sm text-gray-500 mt-2">
              Share this code with friends
            </p>
          </motion.div>

          <h2 className="text-lg font-semibold mb-4 text-gray-300">
            Players ({connectedCount}/{room?.players.length ?? 0} online · max 6)
          </h2>

          {room ? (
            <PlayerList players={room.players} myId={myId} />
          ) : (
            <p className="text-gray-500 text-center py-8">
              {loading ? "Joining room…" : "Waiting for room data…"}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-3"
          >
            {isHost ? (
              <Button
                size="lg"
                className="w-full"
                disabled={
                  !room ||
                  connectedCount < 4 ||
                  connectedCount > 6
                }
                onClick={handleStart}
                fullWidth
              >
                Start Game
                {room && connectedCount < 4 && (
                  <span className="block text-xs font-normal opacity-70 mt-1">
                    Need {4 - connectedCount} more online player(s)
                  </span>
                )}
              </Button>
            ) : (
              <p className="text-center text-sm text-gray-500">
                Waiting for host to start…
              </p>
            )}
          </motion.div>
        </GlassCard>
      </motion.div>
    </main>
  );
}
