"use client";

import { motion } from "framer-motion";
import { playClick } from "@/lib/sounds";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
}

const variants = {
  primary:
    "bg-gradient-to-r from-blood-dark to-blood text-white shadow-neon hover:shadow-neon-sm border border-blood-glow/50",
  secondary:
    "bg-void-card/80 text-white border border-void-border hover:border-blood/50 backdrop-blur-md",
  danger: "bg-blood/20 text-blood-glow border border-blood hover:bg-blood/40",
  ghost: "text-gray-400 hover:text-white hover:bg-white/5",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  onClick,
  disabled,
  type = "button",
  fullWidth = false,
}: ButtonProps) {
  const isFlex1 = className.includes("flex-1");
  const widthClass = fullWidth || className.includes("w-full") ? "w-full" : "";
  const wrapperClass = `${isFlex1 ? "flex-1 flex" : "inline-block"} ${widthClass}`;

  return (
    <motion.div
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={wrapperClass}
    >
      <button
        type={type}
        className={`w-full rounded-lg font-semibold tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        onClick={() => {
          if (!disabled) playClick();
          onClick?.();
        }}
        disabled={disabled}
      >
        {children}
      </button>
    </motion.div>
  );
}
