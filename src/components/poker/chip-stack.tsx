"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { chipSlideVariants } from "@/lib/animations";

interface ChipStackProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getChipColors(amount: number) {
  if (amount >= 1000) {
    return {
      bg: "from-purple-500 via-purple-600 to-purple-700",
      border: "border-purple-400",
      ring: "ring-purple-400/30",
    };
  }
  if (amount >= 500) {
    return {
      bg: "from-slate-700 via-slate-800 to-slate-900",
      border: "border-slate-500",
      ring: "ring-slate-400/30",
    };
  }
  if (amount >= 100) {
    return {
      bg: "from-amber-500 via-amber-600 to-amber-700",
      border: "border-amber-400",
      ring: "ring-amber-400/30",
    };
  }
  if (amount >= 25) {
    return {
      bg: "from-emerald-500 via-emerald-600 to-emerald-700",
      border: "border-emerald-400",
      ring: "ring-emerald-400/30",
    };
  }
  return {
    bg: "from-red-500 via-red-600 to-red-700",
    border: "border-red-400",
    ring: "ring-red-400/30",
  };
}

function formatAmount(amount: number): string {
  if (amount >= 10000) return `${(amount / 1000).toFixed(0)}k`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return amount.toString();
}

export function ChipStack({ amount, size = "md", className }: ChipStackProps) {
  const sizeClasses = {
    sm: { container: "w-8 h-8", text: "text-[9px]", ring: "ring-2" },
    md: { container: "w-10 h-10", text: "text-[10px]", ring: "ring-2" },
    lg: { container: "w-12 h-12", text: "text-xs", ring: "ring-[3px]" },
  };

  const s = sizeClasses[size];
  const colors = getChipColors(amount);

  return (
    <motion.div
      variants={chipSlideVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "relative flex items-center justify-center rounded-full",
        `bg-gradient-to-br ${colors.bg}`,
        `border-2 ${colors.border}`,
        "shadow-lg",
        s.container,
        className
      )}
    >
      {/* Inner dashed ring pattern */}
      <div className="absolute inset-1.5 rounded-full border border-dashed border-white/25" />

      {/* Amount text */}
      <span className={cn(
        "relative font-mono font-bold text-white drop-shadow-sm",
        s.text
      )}>
        {formatAmount(amount)}
      </span>

      {/* Shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-transparent to-transparent pointer-events-none" />

      {/* Outer glow ring */}
      <div className={cn(
        "absolute inset-0 rounded-full",
        s.ring,
        colors.ring
      )} />
    </motion.div>
  );
}
