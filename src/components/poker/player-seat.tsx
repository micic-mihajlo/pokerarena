"use client";

import { Player, PlayerAction, Card, HAND_RANK_NAMES, EvaluatedHand } from "@/types/poker";
import { PlayingCard } from "./card";
import { ChipStack } from "./chip-stack";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { evaluateBestHand } from "@/lib/poker/hand-evaluator";

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
    container: { top: "2%", left: "50%", transform: "translateX(-50%)" },
    chip: { bottom: "-24px", left: "50%", transform: "translateX(-50%)" },
  },
  "bottom": {
    container: { bottom: "2%", left: "50%", transform: "translateX(-50%)" },
    chip: { top: "-24px", left: "50%", transform: "translateX(-50%)" },
  },
  "left": {
    container: { left: "2%", top: "50%", transform: "translateY(-50%)" },
    chip: { right: "-35px", top: "50%", transform: "translateY(-50%)" },
  },
  "right": {
    container: { right: "2%", top: "50%", transform: "translateY(-50%)" },
    chip: { left: "-35px", top: "50%", transform: "translateY(-50%)" },
  },
  "top-left": {
    container: { top: "12%", left: "8%" },
    chip: { bottom: "-24px", right: "-20px" },
  },
  "top-right": {
    container: { top: "12%", right: "8%" },
    chip: { bottom: "-24px", left: "-20px" },
  },
  "bottom-left": {
    container: { bottom: "12%", left: "8%" },
    chip: { top: "-24px", right: "-20px" },
  },
  "bottom-right": {
    container: { bottom: "12%", right: "8%" },
    chip: { top: "-24px", left: "-20px" },
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
      className="absolute flex flex-col items-center"
      style={styles.container}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* cards */}
      <motion.div
        className={cn(
          "flex gap-0.5 mb-1 p-0.5 rounded",
          isFolded && "opacity-40",
          isActive && "ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
        )}
      >
        {player.holeCards.length > 0 ? (
          player.holeCards.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!showCards && !isShowdown}
              size="sm"
            />
          ))
        ) : (
          <div className="w-[72px] h-14" />
        )}
      </motion.div>

      {/* player info */}
      <div
        className={cn(
          "relative flex flex-col items-center px-3 py-1.5 rounded-lg min-w-[100px]",
          "bg-slate-800/90 backdrop-blur-sm border",
          isActive && "border-amber-400",
          isFolded && "opacity-50 border-slate-700",
          isOut && "opacity-30 border-slate-700",
          isAllIn && "border-rose-500",
          !isActive && !isFolded && !isOut && !isAllIn && "border-slate-700"
        )}
      >
        {/* dealer button */}
        {player.isDealer && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-bold flex items-center justify-center shadow">
            D
          </div>
        )}

        {/* name */}
        <div className="text-white text-xs font-medium truncate max-w-[90px]">
          {player.name}
        </div>

        {/* chips */}
        <div className="text-emerald-400 font-mono text-xs font-bold">
          {player.chips.toLocaleString()}
        </div>

        {/* best hand for active player */}
        {isActive && bestHand && (
          <div className="text-amber-400 text-[9px] mt-0.5">
            {HAND_RANK_NAMES[bestHand.rank]}
          </div>
        )}

        {/* status */}
        {isAllIn && (
          <div className="text-rose-400 text-[9px] font-bold mt-0.5">ALL IN</div>
        )}
        {isFolded && (
          <div className="text-slate-500 text-[9px] mt-0.5">FOLDED</div>
        )}

        {/* thinking indicator */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-amber-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* bet chip */}
      {player.currentBet > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute"
          style={styles.chip}
        >
          <ChipStack amount={player.currentBet} size="sm" />
        </motion.div>
      )}

      {/* last action */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2"
          >
            <div className={cn(
              "text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow",
              lastAction.type === "fold" && "bg-slate-600 text-slate-200",
              lastAction.type === "check" && "bg-slate-500 text-white",
              lastAction.type === "call" && "bg-emerald-600 text-white",
              lastAction.type === "bet" && "bg-amber-600 text-white",
              lastAction.type === "raise" && "bg-rose-600 text-white"
            )}>
              {lastAction.type}{lastAction.amount ? ` ${lastAction.amount}` : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
