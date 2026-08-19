"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GamePhase } from "@/types";

const phaseTitles: Record<GamePhase, string> = {
  lobby: "Lobby",
  "role-reveal": "Role Assignment",
  night: "Night Falls…",
  morning: "Morning",
  voting: "Voting",
  "vote-results": "Results",
  ended: "Game Over",
};

interface PhaseDisplayProps {
  phase: GamePhase;
  subtitle?: string;
}

export function PhaseDisplay({ phase, subtitle }: PhaseDisplayProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-2xl sm:text-4xl text-white tracking-wider">
          {phaseTitles[phase]}
        </h1>
        {subtitle && (
          <p className="mt-2 text-blood-glow/80 text-sm sm:text-base">{subtitle}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
