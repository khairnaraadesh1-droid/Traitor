"use client";

import { motion } from "framer-motion";
import type { PublicPlayer } from "@/types";
import type { Role } from "@/types";

interface VoteResultsProps {
  voteCounts: Record<string, number>;
  players: PublicPlayer[];
  eliminated: { id: string; nickname: string; role: Role } | null;
}

export function VoteResults({
  voteCounts,
  players,
  eliminated,
}: VoteResultsProps) {
  const entries = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <h3 className="text-center text-lg text-gray-300">Vote Results</h3>
      {entries.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-4">No votes were cast.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([playerId, count], i) => {
            const player = players.find((p) => p.id === playerId);
            const maxVotes = Math.max(...Object.values(voteCounts), 1);
            const width = (count / maxVotes) * 100;

            return (
              <motion.div
                key={playerId}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
                  style={{ width: `${width}%` }}
                  className="h-10 rounded-lg bg-gradient-to-r from-blood-dark to-blood flex items-center px-4 origin-left"
                >
                  <span className="text-white font-medium truncate">
                    {player?.nickname ?? "Unknown"} — {count} vote{count !== 1 ? "s" : ""}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}
      {eliminated ? (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xl mt-6"
        >
          <span className="text-white">{eliminated.nickname}</span> was{" "}
          <span
            className={
              eliminated.role === "traitor" ? "text-blood-glow font-bold" : "text-blue-400"
            }
          >
            {eliminated.role === "traitor" ? "the Traitor" : "Innocent"}
          </span>
        </motion.p>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-gray-400 text-sm mt-6"
        >
          No one was eliminated (tie or no votes).
        </motion.p>
      )}
    </motion.div>
  );
}
