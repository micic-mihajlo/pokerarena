"use client";

import { Player, PlayerAction } from "@/types/poker";
import { PlayingCard } from "./card";
import { ChipStack } from "./chip-stack";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";

interface PlayerSeatProps {
  player: Player;
  position: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showCards?: boolean;
  lastAction?: PlayerAction;
  isShowdown?: boolean;
}

const positionClasses: Record<string, string> = {
  "top": "top-0 left-1/2 -translate-x-1/2",
  "bottom": "bottom-0 left-1/2 -translate-x-1/2",
  "left": "left-0 top-1/2 -translate-y-1/2",
  "right": "right-0 top-1/2 -translate-y-1/2",
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
};

export function PlayerSeat({ player, position, showCards = false, lastAction, isShowdown }: PlayerSeatProps) {
  const isFolded = player.status === "folded";
  const isAllIn = player.status === "all_in";
  const isOut = player.status === "out";
  const isActive = player.isTurn;

  return (
    <motion.div
      className={cn(
        "absolute flex flex-col items-center gap-2",
        positionClasses[position]
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* cards */}
      <motion.div
        className={cn(
          "flex gap-1 rounded-lg p-1",
          isFolded && "opacity-50",
          isActive && "ring-2 ring-amber-400"
        )}
        animate={isActive ? {
          boxShadow: [
            "0 0 15px rgba(251,191,36,0.3)",
            "0 0 25px rgba(251,191,36,0.5)",
            "0 0 15px rgba(251,191,36,0.3)"
          ]
        } : {}}
        transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {player.holeCards.length > 0 ? (
          player.holeCards.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!showCards && !isShowdown}
              size="md"
              delay={i * 0.1}
            />
          ))
        ) : (
          <div className="w-12 h-17" />
        )}
      </motion.div>

      {/* current bet chip */}
      {player.currentBet > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -bottom-8"
        >
          <ChipStack amount={player.currentBet} size="sm" />
        </motion.div>
      )}

      {/* player info card */}
      <div
        className={cn(
          "relative flex flex-col items-center px-4 py-2.5 rounded-xl",
          "bg-slate-800 border shadow-lg min-w-[130px]",
          isActive && "border-amber-400 ring-2 ring-amber-400/30",
          isFolded && "opacity-60 border-slate-700",
          isOut && "opacity-40 border-slate-700",
          isAllIn && "border-rose-500",
          !isActive && !isFolded && !isOut && !isAllIn && "border-slate-600"
        )}
      >
        {/* dealer button */}
        {player.isDealer && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-slate-900 text-xs font-bold flex items-center justify-center border border-slate-300 shadow">
            D
          </div>
        )}

        {/* model badge */}
        <Badge variant="secondary" className="text-[10px] mb-1 bg-slate-700 text-slate-300 border-0">
          {getModelShortName(player.model)}
        </Badge>

        {/* player name */}
        <div className="text-white font-semibold text-sm truncate max-w-[110px]">
          {player.name}
        </div>

        {/* chips */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-emerald-400 font-mono text-sm font-bold">
            {player.chips.toLocaleString()}
          </span>
        </div>

        {/* status badges */}
        <AnimatePresence>
          {isAllIn && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Badge className="mt-1.5 text-[10px] bg-rose-600 text-white border-0">
                ALL IN
              </Badge>
            </motion.div>
          )}
          {isFolded && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Badge variant="secondary" className="mt-1.5 text-[10px] bg-slate-700 text-slate-400">
                FOLDED
              </Badge>
            </motion.div>
          )}
          {isOut && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Badge variant="secondary" className="mt-1.5 text-[10px] bg-slate-700 text-slate-500">
                OUT
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* thinking indicator with timer bar */}
        {isActive && (
          <>
            <motion.div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
            {/* timer bar */}
            <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-400"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 15, ease: "linear" }}
              />
            </div>
          </>
        )}
      </div>

      {/* last action bubble */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute -top-10"
          >
            <Badge className={cn("text-xs font-bold uppercase shadow", getActionStyle(lastAction.type))}>
              {lastAction.type}
              {lastAction.amount ? ` ${lastAction.amount}` : ""}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getModelShortName(model: string): string {
  if (model.includes("gpt")) return "GPT";
  if (model.includes("claude-haiku")) return "Haiku";
  if (model.includes("claude-sonnet")) return "Sonnet";
  if (model.includes("gemini")) return "Gemini";
  return model.split("/").pop() || model;
}

function getActionStyle(action: string): string {
  switch (action) {
    case "fold":
      return "bg-slate-600 text-slate-200";
    case "check":
      return "bg-slate-500 text-white";
    case "call":
      return "bg-emerald-600 text-white";
    case "bet":
      return "bg-amber-600 text-white";
    case "raise":
      return "bg-rose-600 text-white";
    default:
      return "bg-slate-600 text-white";
  }
}
