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

// evenly distributed positions
const SEAT_POSITIONS = [
  "bottom",
  "right",
  "top-right",
  "top-left",
  "left",
  "bottom-left",
] as const;

export function PokerTable({ gameState, className }: PokerTableProps) {
  const isShowdown = gameState.phase === "showdown";

  const getLastAction = (playerId: string) => {
    const playerActions = gameState.actionLog.filter((a) => a.playerId === playerId);
    return playerActions.length > 0 ? playerActions[playerActions.length - 1] : undefined;
  };

  return (
    <div className={cn("relative w-full aspect-[16/9] min-h-[500px] xl:min-h-[550px]", className)}>
      {/* table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-[80%] h-[75%] rounded-[50%] bg-emerald-800 border-[10px] border-amber-900 shadow-[inset_0_0_60px_rgba(0,0,0,0.4)]"
        >
          {/* inner border */}
          <div className="absolute inset-3 rounded-[50%] border border-emerald-600/30" />

          {/* center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {/* phase badge */}
            {gameState.phase !== "waiting" && (
              <div className="bg-black/40 px-3 py-1 rounded-full">
                <span className="text-white/70 text-xs uppercase tracking-wider">
                  {gameState.phase}
                </span>
              </div>
            )}
            
            <CommunityCards cards={gameState.communityCards} />
            <PotDisplay pots={gameState.pots} />
          </div>
        </motion.div>
      </div>

      {/* player seats */}
      {gameState.players.map((player, i) => (
        <PlayerSeat
          key={player.id}
          player={player}
          position={SEAT_POSITIONS[i % SEAT_POSITIONS.length]}
          showCards={true}
          lastAction={getLastAction(player.id)}
          isShowdown={isShowdown}
          communityCards={gameState.communityCards}
        />
      ))}
    </div>
  );
}
