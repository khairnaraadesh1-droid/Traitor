"use client";

import { motion } from "framer-motion";

export function FogOverlay() {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 8, repeat: Infinity }}
      className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-transparent via-red-950/5 to-black/40"
      aria-hidden
    />
  );
}
