"use client";

import { motion } from "framer-motion";
import type { PublicPlayer } from "@/types";

interface PlayerListProps {
  players: PublicPlayer[];
  myId: string | null;
  selectable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  aliveOnly?: boolean;
}

export function PlayerList({
  players,
  myId,
  selectable = false,
  selectedId,
  onSelect,
  aliveOnly = false,
}: PlayerListProps) {
  const list = aliveOnly ? players.filter((p) => p.alive) : players;

  return (
    <ul className="space-y-2">
      {list.map((player, i) => {
        const isMe = player.id === myId;
        const canSelect =
          selectable &&
          player.alive &&
          player.connected &&
          player.id !== myId &&
          onSelect;
        const isSelected = selectedId === player.id;

        return (
          <motion.li
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => canSelect && onSelect(player.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              !player.alive
                ? "border-gray-800 bg-gray-900/30 opacity-50"
                : !player.connected
                  ? "border-gray-700 bg-gray-900/40 opacity-70"
                  : isSelected
                  ? "border-blood bg-blood/20 shadow-neon-sm cursor-pointer"
                  : canSelect
                    ? "border-void-border bg-void-card/50 hover:border-blood/40 cursor-pointer"
                    : "border-void-border bg-void-card/50"
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                !player.alive
                  ? "bg-gray-600"
                  : player.connected
                    ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
                    : "bg-yellow-600 shadow-[0_0_8px_#ca8a04]"
              }`}
              title={
                !player.alive
                  ? "Dead"
                  : player.connected
                    ? "Online"
                    : "Offline"
              }
            />
            <span className="flex-1 font-medium text-white truncate">
              {player.nickname}
              {isMe && (
                <span className="ml-2 text-xs text-blood-glow">(you)</span>
              )}
            </span>
            {player.isHost && (
              <span className="text-xs px-2 py-0.5 rounded bg-blood/20 text-blood-glow border border-blood/30">
                HOST
              </span>
            )}
            {!player.alive && (
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Dead
              </span>
            )}
            {player.alive && !player.connected && (
              <span className="text-xs text-yellow-600/80 uppercase tracking-wider">
                Offline
              </span>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}
