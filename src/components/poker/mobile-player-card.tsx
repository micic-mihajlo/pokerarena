"use client";

import { Player, PlayerAction, Card as CardType } from "@/types/poker";
import { PlayingCard } from "./card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface MobilePlayerCardProps {
  player: Player;
  isActive: boolean;
  lastAction?: PlayerAction;
  showCards?: boolean;
  isShowdown?: boolean;
}

export function MobilePlayerCard({
  player,
  isActive,
  lastAction,
  showCards = true,
  isShowdown = false,
}: MobilePlayerCardProps) {
  const isFolded = player.status === "folded";
  const isAllIn = player.status === "all_in";
  const isOut = player.status === "out";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative flex flex-col items-center p-2 rounded-xl",
        "bg-slate-900/90 border-2 backdrop-blur-sm",
        "min-w-[90px] max-w-[120px]",
        isActive && "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]",
        isAllIn && !isActive && "border-rose-500",
        isFolded && "border-slate-700 opacity-50",
        isOut && "border-slate-800 opacity-30",
        !isActive && !isAllIn && !isFolded && !isOut && "border-slate-700"
      )}
    >
      {/* Action badge */}
      {lastAction && (
        <div
          className={cn(
            "absolute -top-2 left-1/2 -translate-x-1/2 z-10",
            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
            lastAction.type === "fold" && "bg-slate-600 text-slate-200",
            lastAction.type === "check" && "bg-slate-600 text-white",
            lastAction.type === "call" && "bg-emerald-600 text-white",
            lastAction.type === "bet" && "bg-amber-600 text-white",
            lastAction.type === "raise" && "bg-rose-600 text-white"
          )}
        >
          {lastAction.type}
          {lastAction.amount ? ` ${lastAction.amount}` : ""}
        </div>
      )}

      {/* Player name + dealer */}
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] font-semibold text-white truncate max-w-[70px]">
          {player.name}
        </span>
        {player.isDealer && (
          <span className="w-4 h-4 rounded-full bg-white text-black text-[8px] font-bold flex items-center justify-center">
            D
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex gap-0.5 mb-1">
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
          <div className="w-[84px] h-[56px] rounded bg-slate-800/50" />
        )}
      </div>

      {/* Chips */}
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <span className="text-emerald-400 font-mono text-xs font-bold">
          {player.chips.toLocaleString()}
        </span>
      </div>

      {/* Status badge */}
      {(isAllIn || isFolded) && (
        <div
          className={cn(
            "absolute -bottom-1.5 left-1/2 -translate-x-1/2",
            "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
            isAllIn && "bg-rose-500/80 text-white",
            isFolded && "bg-slate-600/80 text-slate-300"
          )}
        >
          {isAllIn ? "ALL IN" : "FOLD"}
        </div>
      )}

      {/* Thinking indicator */}
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-amber-400"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}

      {/* Bet amount */}
      {player.totalBetThisHand > 0 && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          {player.totalBetThisHand}
        </div>
      )}
    </motion.div>
  );
}
