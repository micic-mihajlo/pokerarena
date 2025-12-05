"use client";

import { GameState } from "@/types/poker";
import { MobilePlayerCard } from "./mobile-player-card";
import { PlayingCard } from "./card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface MobilePokerTableProps {
  gameState: GameState;
  className?: string;
}

const PHASE_ORDER = ["preflop", "flop", "turn", "river", "showdown"];

function getPhaseIndex(phase: string): number {
  return PHASE_ORDER.indexOf(phase);
}

export function MobilePokerTable({ gameState, className }: MobilePokerTableProps) {
  const players = gameState.players;
  const midpoint = Math.ceil(players.length / 2);
  const topRow = players.slice(0, midpoint);
  const bottomRow = players.slice(midpoint);

  const totalPot = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);

  const getLastAction = (playerId: string) => {
    const playerActions = gameState.actionLog.filter((a) => a.playerId === playerId);
    return playerActions.length > 0 ? playerActions[playerActions.length - 1] : undefined;
  };

  const isShowdown = gameState.phase === "showdown";

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Top row of players */}
      <div className="flex justify-center gap-2 px-2 pt-2">
        {topRow.map((player) => (
          <MobilePlayerCard
            key={player.id}
            player={player}
            isActive={player.isTurn}
            lastAction={getLastAction(player.id)}
            showCards={true}
            isShowdown={isShowdown}
          />
        ))}
      </div>

      {/* Center section - cards and pot */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
        {/* Phase indicator */}
        <AnimatePresence mode="wait">
          {gameState.phase !== "waiting" && (
            <motion.div
              key={gameState.phase}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10"
            >
              {/* Phase progress dots */}
              <div className="flex gap-1">
                {PHASE_ORDER.map((phase, i) => (
                  <div
                    key={phase}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      getPhaseIndex(gameState.phase) >= i
                        ? "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                        : "bg-white/20"
                    )}
                  />
                ))}
              </div>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">
                {gameState.phase}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Community cards */}
        <div className="flex gap-1.5 items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: gameState.communityCards[i] ? 1 : 0.3,
                scale: gameState.communityCards[i] ? 1 : 0.9
              }}
            >
              {gameState.communityCards[i] ? (
                <PlayingCard
                  card={gameState.communityCards[i]}
                  size="sm"
                  index={i}
                />
              ) : (
                <div className="w-10 h-[56px] rounded-lg border border-dashed border-white/10 bg-white/5" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Pot display */}
        {totalPot > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-amber-500/30"
          >
            <div className="relative w-5 h-4">
              <div className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 border border-red-400 left-0 top-0" />
              <div className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border border-amber-400 left-1.5 top-0" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-400 uppercase tracking-wider">Pot</span>
              <span className="text-amber-300 font-mono font-bold text-sm">
                {totalPot.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom row of players */}
      <div className="flex justify-center gap-2 px-2 pb-2">
        {bottomRow.map((player) => (
          <MobilePlayerCard
            key={player.id}
            player={player}
            isActive={player.isTurn}
            lastAction={getLastAction(player.id)}
            showCards={true}
            isShowdown={isShowdown}
          />
        ))}
      </div>
    </div>
  );
}
