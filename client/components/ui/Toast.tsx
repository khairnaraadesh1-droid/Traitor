"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export function Toast() {
  const { toast, clearToast } = useGameStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 4000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  const colors = {
    info: "border-blue-500/50 bg-blue-950/80",
    error: "border-blood/50 bg-red-950/80",
    success: "border-green-500/50 bg-green-950/80",
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className={`fixed top-6 left-1/2 z-[100] px-6 py-3 rounded-lg border backdrop-blur-md text-white text-sm font-medium shadow-lg ${colors[toast.type]}`}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
