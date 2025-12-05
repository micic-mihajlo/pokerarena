"use client";

import { Player, PlayerAction, Card, HAND_RANK_NAMES, EvaluatedHand } from "@/types/poker";
import { PlayingCard } from "./card";
import { ChipStack } from "./chip-stack";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { evaluateBestHand } from "@/lib/poker/hand-evaluator";
import { playerSeatVariants, actionBadgeVariants, thinkingDotVariants } from "@/lib/animations";

interface PlayerSeatProps {
  player: Player;
  position: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showCards?: boolean;
  lastAction?: PlayerAction;
  isShowdown?: boolean;
  communityCards?: Card[];
}

const positionStyles: Record<string, { container: React.CSSProperties; chip: React.CSSProperties }> = {
  "top": {
    container: { top: "3%", left: "50%", transform: "translateX(-50%)" },
    chip: { bottom: "-28px", left: "50%", transform: "translateX(-50%)" },
  },
  "bottom": {
    container: { bottom: "3%", left: "50%", transform: "translateX(-50%)" },
    chip: { top: "-28px", left: "50%", transform: "translateX(-50%)" },
  },
  "left": {
    container: { left: "3%", top: "50%", transform: "translateY(-50%)" },
    chip: { right: "-40px", top: "50%", transform: "translateY(-50%)" },
  },
  "right": {
    container: { right: "3%", top: "50%", transform: "translateY(-50%)" },
    chip: { left: "-40px", top: "50%", transform: "translateY(-50%)" },
  },
  "top-left": {
    container: { top: "14%", left: "10%" },
    chip: { bottom: "-28px", right: "-24px" },
  },
  "top-right": {
    container: { top: "14%", right: "10%" },
    chip: { bottom: "-28px", left: "-24px" },
  },
  "bottom-left": {
    container: { bottom: "14%", left: "10%" },
    chip: { top: "-28px", right: "-24px" },
  },
  "bottom-right": {
    container: { bottom: "14%", right: "10%" },
    chip: { top: "-28px", left: "-24px" },
  },
};

export function PlayerSeat({
  player,
  position,
  showCards = false,
  lastAction,
  isShowdown,
  communityCards = []
}: PlayerSeatProps) {
  const isFolded = player.status === "folded";
  const isAllIn = player.status === "all_in";
  const isOut = player.status === "out";
  const isActive = player.isTurn;

  const bestHand = useMemo((): EvaluatedHand | null => {
    if (!isActive || player.holeCards.length < 2) return null;
    const allCards = [...player.holeCards, ...communityCards];
    if (allCards.length < 5) return null;
    try {
      return evaluateBestHand(player.holeCards, communityCards);
    } catch {
      return null;
    }
  }, [isActive, player.holeCards, communityCards]);

  const styles = positionStyles[position];

  return (
    <motion.div
      className={cn(
        "absolute flex flex-col items-center",
        isActive && "z-10"
      )}
      style={styles.container}
      variants={playerSeatVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Last action badge - floating above everything */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            variants={actionBadgeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute -top-8 left-1/2 -translate-x-1/2 z-20"
          >
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide shadow-lg backdrop-blur-sm border",
              lastAction.type === "fold" && "bg-slate-700/90 text-slate-200 border-slate-600",
              lastAction.type === "check" && "bg-slate-600/90 text-white border-slate-500",
              lastAction.type === "call" && "bg-emerald-600/90 text-white border-emerald-500",
              lastAction.type === "bet" && "bg-amber-600/90 text-white border-amber-500",
              lastAction.type === "raise" && "bg-rose-600/90 text-white border-rose-500"
            )}>
              <span>{lastAction.type}</span>
              {lastAction.amount && (
                <span className="font-mono">{lastAction.amount.toLocaleString()}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards section with backdrop */}
      <div className={cn(
        "relative flex gap-1 mb-2 p-1.5 rounded-lg",
        "bg-gradient-to-b from-slate-800/95 to-slate-900/95",
        "backdrop-blur-md border",
        isActive && "border-amber-500/60 shadow-[0_0_20px_rgba(251,191,36,0.3)]",
        isFolded && "opacity-40 grayscale border-slate-700/50",
        isOut && "opacity-25 grayscale border-slate-800/50",
        isAllIn && "border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
        !isActive && !isFolded && !isOut && !isAllIn && "border-slate-700/50"
      )}>
        {player.holeCards.length > 0 ? (
          player.holeCards.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!showCards && !isShowdown}
              size="sm"
              index={i}
            />
          ))
        ) : (
          <div className="w-[84px] h-[56px]" />
        )}

        {/* Best hand badge */}
        {isActive && bestHand && (
          <div className="absolute -right-1 -top-1 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[8px] font-bold shadow-sm">
            {HAND_RANK_NAMES[bestHand.rank]}
          </div>
        )}
      </div>

      {/* Main Player HUD Box */}
      <div className={cn(
        "relative min-w-[140px] rounded-lg overflow-hidden",
        "bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95",
        "backdrop-blur-md border-2",
        isActive && "border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.35)]",
        isAllIn && !isActive && "border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.3)]",
        isFolded && "border-slate-700/60 opacity-60",
        isOut && "border-slate-800/60 opacity-30",
        !isActive && !isAllIn && !isFolded && !isOut && "border-slate-600/60"
      )}>
        {/* Animated gradient sweep for active player */}
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10"
            animate={{
              backgroundPosition: ["0% 50%", "200% 50%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ backgroundSize: "200% 100%" }}
          />
        )}

        {/* Player name bar */}
        <div className="relative px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-semibold text-xs whitespace-nowrap">
              {player.name}
            </span>
            {/* Dealer button */}
            {player.isDealer && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-white to-slate-200 text-slate-900 text-[9px] font-black flex items-center justify-center shadow-md shrink-0">
                D
              </div>
            )}
          </div>
        </div>

        {/* Chips display */}
        <div className="relative px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Chip icon */}
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 shadow-sm" />
            <span className="text-emerald-400 font-mono text-base font-bold tracking-tight">
              {player.chips.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status bar */}
        {(isAllIn || isFolded) && (
          <div className={cn(
            "px-3 py-1 text-center text-[10px] font-bold uppercase tracking-wider",
            isAllIn && "bg-rose-500/20 text-rose-400",
            isFolded && "bg-slate-600/20 text-slate-400"
          )}>
            {isAllIn ? "ALL IN" : "FOLDED"}
          </div>
        )}

        {/* Thinking progress bar */}
        {isActive && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>

      {/* Thinking indicator dots */}
      {isActive && (
        <div className="flex gap-1 mt-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              variants={thinkingDotVariants}
              animate="animate"
              custom={i}
            />
          ))}
        </div>
      )}

      {/* Bet chip - shows total invested this hand */}
      {player.totalBetThisHand > 0 && (
        <div
          className="absolute"
          style={styles.chip}
        >
          <ChipStack amount={player.totalBetThisHand} size="sm" />
        </div>
      )}
    </motion.div>
  );
}
