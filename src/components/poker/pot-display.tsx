"use client";

import { Pot } from "@/types/poker";
import { ChipStack } from "./chip-stack";
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
      className={cn("flex flex-col items-center gap-2", className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      <div className="flex items-center gap-3">
        <ChipStack amount={totalPot} size="lg" />
      </div>

      <div className="bg-black/60 px-4 py-1.5 rounded-full">
        <span className="text-amber-400 font-bold font-mono">
          POT: {totalPot.toLocaleString()}
        </span>
      </div>

      {pots.length > 1 && (
        <div className="flex gap-4 mt-1">
          {pots.slice(1).map((pot, i) => (
            <div key={i} className="flex flex-col items-center">
              <ChipStack amount={pot.amount} size="sm" />
              <span className="text-xs text-white/50 mt-1">
                Side {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
