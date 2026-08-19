"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Particles } from "@/components/effects/Particles";
import { FogOverlay } from "@/components/effects/FogOverlay";
import { Button } from "@/components/ui/Button";
import { JoinModal } from "@/components/landing/JoinModal";
import {
  isMusicEnabled,
  setMusicEnabled,
  startAmbientDrone,
} from "@/lib/sounds";

export default function HomePage() {
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [musicOn, setMusicOn] = useState(false);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
    if (next) startAmbientDrone();
  };

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden">
      <Particles />
      <FogOverlay />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex flex-col items-center px-6 text-center max-w-lg"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-display text-6xl sm:text-8xl font-black tracking-[0.15em] text-glow text-white mb-2"
        >
          TRAITORS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-500 text-sm sm:text-base mb-12 tracking-widest uppercase"
        >
          Trust no one. Survive the night.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Button size="lg" className="w-full sm:w-48" onClick={() => setModal("create")}>
            Create Room
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-48"
            onClick={() => setModal("join")}
          >
            Join Room
          </Button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          onClick={toggleMusic}
          className="mt-12 text-xs text-gray-600 hover:text-blood-glow transition-colors uppercase tracking-widest"
        >
          {musicOn || isMusicEnabled() ? "♪ Music On" : "♪ Music Off"}
        </motion.button>

        <p className="mt-8 text-xs text-gray-700">4–6 players · 1 hidden traitor</p>
      </motion.div>

      <JoinModal mode={modal} onClose={() => setModal(null)} />
    </main>
  );
}
