"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { playWin, playLose } from "@/lib/sounds";
import { useEffect } from "react";

interface WinScreenProps {
  winner: "innocents" | "traitor";
  isTraitor: boolean;
  onReplay: () => void;
  isHost: boolean;
}

export function WinScreen({ winner, isTraitor, onReplay, isHost }: WinScreenProps) {
  const innocentsWon = winner === "innocents";
  const playerWon =
    (innocentsWon && !isTraitor) || (!innocentsWon && isTraitor);

  useEffect(() => {
    if (playerWon) playWin();
    else playLose();
  }, [playerWon]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`p-10 rounded-3xl border-2 ${
          innocentsWon
            ? "border-blue-500/50 bg-blue-950/30"
            : "border-blood bg-red-950/40 shadow-neon"
        }`}
      >
        <p className="text-sm uppercase tracking-[0.4em] text-gray-500 mb-4">
          Game Over
        </p>
        <h2
          className={`font-display text-4xl sm:text-6xl font-bold mb-4 ${
            innocentsWon ? "text-blue-300" : "text-blood-glow"
          }`}
        >
          {innocentsWon ? "Innocents Win!" : "Traitor Wins!"}
        </h2>
        <p className="text-gray-400 mb-8">
          {playerWon
            ? "Victory is yours."
            : "Better luck next time… if you survive."}
        </p>
        {isHost && (
          <Button size="lg" onClick={onReplay}>
            New Game
          </Button>
        )}
        {!isHost && (
          <p className="text-sm text-gray-500">Waiting for host to start a new game…</p>
        )}
      </motion.div>
    </motion.div>
  );
}
