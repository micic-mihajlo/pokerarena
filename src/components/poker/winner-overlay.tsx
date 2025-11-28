"use client";

import { motion, AnimatePresence } from "motion/react";
import { HAND_RANK_NAMES, EvaluatedHand } from "@/types/poker";
import { winnerOverlayVariants, winnerCardVariants } from "@/lib/animations";

interface WinnerInfo {
  playerName: string;
  amount: number;
  hand?: EvaluatedHand;
}

interface WinnerOverlayProps {
  winner: WinnerInfo | null;
  onClose?: () => void;
}

export function WinnerOverlay({ winner, onClose }: WinnerOverlayProps) {
  return (
    <AnimatePresence>
      {winner && (
        <motion.div
          variants={winnerOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          onClick={onClose}
        >
          {/* Subtle backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          {/* Winner card */}
          <motion.div
            variants={winnerCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative pointer-events-auto"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-150" />

            {/* Content card */}
            <div className="relative flex flex-col items-center gap-3 px-10 py-6 rounded-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-md border border-amber-500/40 shadow-2xl">
              {/* Winner label */}
              <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em]">
                Winner
              </span>

              {/* Player name */}
              <span className="text-white text-2xl font-bold">
                {winner.playerName}
              </span>

              {/* Hand rank */}
              {winner.hand && (
                <span className="text-amber-300 text-base font-medium">
                  {HAND_RANK_NAMES[winner.hand.rank]}
                </span>
              )}

              {/* Amount won */}
              <div className="flex items-center gap-2 mt-1 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-emerald-400 text-xl font-mono font-bold">
                  +{winner.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
