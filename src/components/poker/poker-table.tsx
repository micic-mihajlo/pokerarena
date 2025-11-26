"use client";

import { GameState } from "@/types/poker";
import { PlayerSeat } from "./player-seat";
import { CommunityCards } from "./community-cards";
import { PotDisplay } from "./pot-display";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface PokerTableProps {
  gameState: GameState;
  className?: string;
}

// positions around the table for up to 6 players (evenly distributed)
const SEAT_POSITIONS = [
  "bottom",      // seat 0
  "right",       // seat 1
  "top-right",   // seat 2
  "top-left",    // seat 3
  "left",        // seat 4
  "bottom-left", // seat 5
] as const;

export function PokerTable({ gameState, className }: PokerTableProps) {
  const isShowdown = gameState.phase === "showdown";

  const getLastAction = (playerId: string) => {
    const playerActions = gameState.actionLog.filter((a) => a.playerId === playerId);
    return playerActions.length > 0 ? playerActions[playerActions.length - 1] : undefined;
  };

  return (
    <div className={cn("relative w-full aspect-[16/10] min-h-[500px]", className)}>
      {/* table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "relative w-[85%] h-[80%] rounded-[100px]",
            "bg-emerald-700",
            "border-[12px] border-amber-900",
            "shadow-[inset_0_2px_20px_rgba(0,0,0,0.3),0_8px_30px_rgba(0,0,0,0.4)]"
          )}
        >
          {/* inner border */}
          <div className="absolute inset-4 rounded-[80px] border border-emerald-600/30" />

          {/* community cards & pot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <CommunityCards cards={gameState.communityCards} />
            <PotDisplay pots={gameState.pots} />
          </div>

          {/* phase indicator */}
          {gameState.phase !== "waiting" && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="bg-black/50 px-4 py-1 rounded-full">
                <span className="text-white/80 text-sm uppercase tracking-wide">
                  {gameState.phase}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* player seats */}
      <div className="absolute inset-0">
        {gameState.players.map((player, i) => (
          <PlayerSeat
            key={player.id}
            player={player}
            position={SEAT_POSITIONS[i % SEAT_POSITIONS.length]}
            showCards={true}
            lastAction={getLastAction(player.id)}
            isShowdown={isShowdown}
          />
        ))}
      </div>
    </div>
  );
}
