"use client";

import { Pot } from "@/types/poker";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { potDisplayVariants } from "@/lib/animations";

interface PotDisplayProps {
  pots: Pot[];
  className?: string;
}

export function PotDisplay({ pots, className }: PotDisplayProps) {
  const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0);

  if (totalPot === 0) return null;

  return (
    <motion.div
      className={cn("flex flex-col items-center gap-2", className)}
      variants={potDisplayVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main pot display */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-amber-500/25 blur-xl rounded-full scale-150" />

        {/* Pot container */}
        <div className="relative flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border border-amber-500/30 shadow-lg">
          {/* Chip icons stack */}
          <div className="relative w-7 h-5">
            <div className="absolute w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-700 border border-red-400 left-0 top-0 shadow-sm" />
            <div className="absolute w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-400 left-2 top-0 shadow-sm" />
          </div>

          {/* Label and amount */}
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">
              Total Pot
            </span>
            <motion.span
              key={totalPot}
              initial={{ scale: 1.15, color: "#fbbf24" }}
              animate={{ scale: 1, color: "#fcd34d" }}
              transition={{ duration: 0.3 }}
              className="text-lg font-mono font-bold text-amber-300"
            >
              {totalPot.toLocaleString()}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Side pots */}
      {pots.length > 1 && (
        <div className="flex gap-2">
          {pots.slice(1).map((pot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-xs"
            >
              <span className="text-slate-400">Side: </span>
              <span className="text-amber-400 font-mono font-medium">
                {pot.amount.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
