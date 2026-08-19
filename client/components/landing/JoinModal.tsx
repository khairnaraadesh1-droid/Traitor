"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSocket } from "@/lib/socket";
import { saveSession } from "@/lib/session";
import { useGameStore } from "@/store/gameStore";
import { playJoin } from "@/lib/sounds";

interface JoinModalProps {
  mode: "create" | "join" | null;
  initialCode?: string;
  onClose: () => void;
}

export function JoinModal({ mode, initialCode = "", onClose }: JoinModalProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState(initialCode);
  const [submitting, setSubmitting] = useState(false);
  const { showToast, setIsHost } = useGameStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      showToast("Enter a nickname", "error");
      return;
    }
    if (mode === "join" && !roomCode.trim()) {
      showToast("Enter a room code", "error");
      return;
    }

    setSubmitting(true);
    const socket = getSocket();

    const cleanup = () => {
      socket.off("room-joined", onJoined);
      socket.off("error", onError);
      socket.off("connect", onConnect);
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
        nickname: nickname.trim(),
        isHost: data.isHost,
      });
      setIsHost(data.isHost);
      cleanup();
      setSubmitting(false);
      onClose();
      router.push(`/room/${data.code}`);
    };

    const onError = ({ message }: { message: string }) => {
      showToast(message, "error");
      cleanup();
      setSubmitting(false);
    };

    const emitRequest = () => {
      socket.on("room-joined", onJoined);
      socket.on("error", onError);

      if (mode === "create") {
        socket.emit("create-room", { nickname: nickname.trim() });
      } else {
        socket.emit("join-room", {
          code: roomCode.trim().toUpperCase(),
          nickname: nickname.trim(),
        });
      }
    };

    const onConnect = () => {
      emitRequest();
    };

    socket.on("connect", onConnect);

    if (socket.connected) {
      emitRequest();
    } else {
      socket.connect();
    }
  };

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6 sm:p-8">
              <h2 className="font-display text-2xl text-center mb-6 text-white">
                {mode === "create" ? "Create Room" : "Join Room"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nickname"
                  placeholder="Your name"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  autoFocus
                  disabled={submitting}
                />
                {mode === "join" && (
                  <Input
                    label="Room Code"
                    placeholder="ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    disabled={submitting}
                  />
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                    fullWidth
                  >
                    {submitting
                      ? "Connecting…"
                      : mode === "create"
                        ? "Create"
                        : "Join"}
                  </Button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
