"use client";

import { motion } from "framer-motion";
import type { Role } from "@/types";
import { playRevealInnocent, playRevealTraitor } from "@/lib/sounds";
import { useEffect } from "react";

interface RoleRevealProps {
  role: Role;
}

export function RoleReveal({ role }: RoleRevealProps) {
  const isTraitor = role === "traitor";

  useEffect(() => {
    if (isTraitor) playRevealTraitor();
    else playRevealInnocent();
  }, [isTraitor]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className={`relative p-12 rounded-3xl border-2 ${
          isTraitor
            ? "border-blood bg-gradient-to-br from-red-950/80 to-black shadow-neon"
            : "border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-black"
        }`}
      >
        {isTraitor && (
          <motion.div
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl bg-red-600/10 blur-xl"
          />
        )}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-4"
        >
          Your Role
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className={`font-display text-3xl sm:text-5xl font-bold ${
            isTraitor ? "text-blood-glow drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" : "text-blue-300"
          }`}
        >
          {isTraitor ? "YOU ARE THE TRAITOR" : "You are Innocent"}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-gray-400 text-sm max-w-xs"
        >
          {isTraitor
            ? "Eliminate the innocents under cover of night. Trust no one."
            : "Find and vote out the traitor before it's too late."}
        </motion.p>
      </motion.div>
    </div>
  );
}
