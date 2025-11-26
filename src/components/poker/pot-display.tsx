"use client";

import { Pot } from "@/types/poker";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface PotDisplayProps {
  pots: Pot[];
  className?: string;
}

export function PotDisplay({ pots, className }: PotDisplayProps) {
  const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0);

  if (totalPot === 0) return null;

  return (
    <motion.div
      className={cn("flex flex-col items-center", className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      <div className="bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full">
        <span className="text-amber-400 font-bold font-mono text-sm">
          {totalPot.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}
