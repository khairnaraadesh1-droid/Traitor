"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "@/components/effects/Particles";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { PhaseDisplay } from "@/components/game/PhaseDisplay";
import { RoleReveal } from "@/components/game/RoleReveal";
import { PlayerList } from "@/components/game/PlayerList";
import { VoteResults } from "@/components/game/VoteResults";
import { WinScreen } from "@/components/game/WinScreen";
import { useGameStore } from "@/store/gameStore";
import { useCountdown } from "@/hooks/useCountdown";
import { getSocket } from "@/lib/socket";
import type { Role } from "@/types";
import {
  playEliminate,
  playKill,
  playNight,
  playVote,
} from "@/lib/sounds";

interface GameViewProps {
  roomCode: string;
  myRole: Role | null;
  onRoleClear: () => void;
}

export function GameView({ roomCode, myRole, onRoleClear }: GameViewProps) {
  const {
    room,
    myId,
    isHost,
    hasVoted,
    killConfirmed,
    setHasVoted,
    resetGameFlags,
  } = useGameStore();

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [votingResults, setVotingResults] = useState<{
    eliminated: { id: string; nickname: string; role: Role } | null;
    voteCounts: Record<string, number>;
  } | null>(null);

  const discussionRemaining = useCountdown(room?.discussionEndsAt ?? null);
  const roleRevealRemaining = useCountdown(room?.roleRevealEndsAt ?? null);

  const phase = room?.phase ?? "lobby";
  const amAlive = room?.players.find((p) => p.id === myId)?.alive ?? false;
  const isTraitor = myRole === "traitor";

  useEffect(() => {
    const socket = getSocket();

    const onNight = () => {
      playNight();
      resetGameFlags();
      setSelectedTarget(null);
    };

    const onMorning = () => {
      playEliminate();
    };

    const onVoting = () => {
      setHasVoted(false);
      setSelectedTarget(null);
    };

    const onResults = (data: {
      eliminated: { id: string; nickname: string; role: Role } | null;
      voteCounts: Record<string, number>;
    }) => {
      setVotingResults(data);
      playEliminate();
    };

    const onAssign = () => {
      resetGameFlags();
    };

    socket.on("night-start", onNight);
    socket.on("morning-start", onMorning);
    socket.on("voting-start", onVoting);
    socket.on("voting-results", onResults);
    socket.on("assign-role", onAssign);

    return () => {
      socket.off("night-start", onNight);
      socket.off("morning-start", onMorning);
      socket.off("voting-start", onVoting);
      socket.off("voting-results", onResults);
      socket.off("assign-role", onAssign);
    };
  }, [resetGameFlags, setHasVoted]);

  useEffect(() => {
    if (phase !== "vote-results") {
      setVotingResults(null);
    }
  }, [phase]);

  const handleKill = () => {
    if (!selectedTarget) return;
    getSocket().emit("kill-player", { targetId: selectedTarget });
    playKill();
  };

  const handleVote = () => {
    if (!selectedTarget) return;
    getSocket().emit("cast-vote", { targetId: selectedTarget });
    playVote();
  };

  const handleReplay = () => {
    getSocket().emit("replay-game");
    onRoleClear();
    resetGameFlags();
  };

  if (!room) return null;

  if (phase === "ended" && room.winner) {
    return (
      <main className="relative min-h-dvh">
        <Particles />
        <motion.div className="relative z-10 max-w-lg mx-auto px-4 py-8">
          <WinScreen
            winner={room.winner}
            isTraitor={isTraitor}
            onReplay={handleReplay}
            isHost={isHost}
          />
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
        className="relative z-10 max-w-lg mx-auto px-4 py-6"
      >
        <p className="text-center text-xs text-gray-600 mb-2 tracking-widest">
          {roomCode}
        </p>

        <PhaseDisplay
          phase={phase}
          subtitle={
            phase === "morning" && discussionRemaining > 0
              ? `Discussion: ${discussionRemaining}s`
              : phase === "role-reveal" && roleRevealRemaining > 0
                ? `Starting in ${roleRevealRemaining}s…`
                : undefined
          }
        />

        <AnimatePresence mode="wait">
          {phase === "role-reveal" && myRole && (
            <motion.div key="role">
              <RoleReveal role={myRole} />
            </motion.div>
          )}

          {phase === "night" && (
            <motion.div key="night">
              <GlassCard className="p-6">
                {isTraitor && amAlive && !killConfirmed ? (
                  <>
                    <p className="text-center text-blood-glow mb-6 text-sm">
                      Choose a victim to eliminate
                    </p>
                    <PlayerList
                      players={room.players}
                      myId={myId}
                      aliveOnly
                      selectable
                      selectedId={selectedTarget}
                      onSelect={setSelectedTarget}
                    />
                    <Button
                      className="w-full mt-6"
                      variant="danger"
                      disabled={!selectedTarget}
                      onClick={handleKill}
                    >
                      Eliminate
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-6xl mb-4"
                    >
                      🌙
                    </motion.div>
                    <p className="text-gray-400">
                      {killConfirmed
                        ? "Your deed is done. Waiting for dawn…"
                        : amAlive
                          ? "The traitor stalks in the shadows…"
                          : "You watch from beyond…"}
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {phase === "morning" && (
            <motion.div key="morning">
              <GlassCard className="p-6 text-center">
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-xl text-white mb-4"
                >
                  {room.lastNightVictim
                    ? `${room.lastNightVictim.nickname} was eliminated`
                    : "No one was eliminated last night"}
                </motion.p>
                {discussionRemaining > 0 && (
                  <p className="text-blood-glow text-3xl font-display">
                    {discussionRemaining}s
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-4">
                  Discuss who you suspect…
                </p>
                <motion.div className="mt-6">
                  <PlayerList players={room.players} myId={myId} />
                </motion.div>
              </GlassCard>
            </motion.div>
          )}

          {phase === "voting" && (
            <motion.div key="voting">
              <GlassCard className="p-6">
                {amAlive && !hasVoted ? (
                  <>
                    <p className="text-center text-gray-400 mb-6 text-sm">
                      Cast your anonymous vote
                    </p>
                    <PlayerList
                      players={room.players}
                      myId={myId}
                      aliveOnly
                      selectable
                      selectedId={selectedTarget}
                      onSelect={setSelectedTarget}
                    />
                    <Button
                      className="w-full mt-6"
                      disabled={!selectedTarget}
                      onClick={handleVote}
                    >
                      Vote
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block text-4xl mb-4"
                    >
                      ⚖️
                    </motion.div>
                    <p className="text-gray-400">
                      {hasVoted
                        ? "Vote cast. Waiting for others…"
                        : "The dead do not vote."}
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {phase === "vote-results" && (
            <motion.div key="results">
              <GlassCard className="p-6">
                <VoteResults
                  voteCounts={
                    votingResults?.voteCounts ?? room.voteCounts ?? {}
                  }
                  players={room.players}
                  eliminated={
                    votingResults?.eliminated ?? room.lastVotedOut
                  }
                />
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {phase !== "role-reveal" && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-widest text-gray-600 mb-3">
              Players
            </h3>
            <PlayerList players={room.players} myId={myId} />
          </div>
        )}
      </motion.div>
    </main>
  );
}
