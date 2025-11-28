"use client";

import { GameState } from "@/types/poker";
import { PlayerSeat } from "./player-seat";
import { CommunityCards } from "./community-cards";
import { PotDisplay } from "./pot-display";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { tableEntranceVariants, phaseBadgeVariants } from "@/lib/animations";

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

const PHASE_ORDER = ["preflop", "flop", "turn", "river", "showdown"];

function getPhaseIndex(phase: string): number {
  return PHASE_ORDER.indexOf(phase);
}

export function PokerTable({ gameState, className }: PokerTableProps) {
  const isShowdown = gameState.phase === "showdown";

  const getLastAction = (playerId: string) => {
    const playerActions = gameState.actionLog.filter((a) => a.playerId === playerId);
    return playerActions.length > 0 ? playerActions[playerActions.length - 1] : undefined;
  };

  return (
    <div className={cn("relative w-full h-full min-h-[400px]", className)}>
      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[95%] h-[80%] rounded-[45%] bg-gradient-radial from-green-950/30 via-transparent to-transparent blur-3xl" />
      </div>

      {/* table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          variants={tableEntranceVariants}
          initial="hidden"
          animate="visible"
          className="relative w-[88%] h-[65%]"
        >
          {/* Table base shadow */}
          <div className="absolute inset-0 rounded-[50%] bg-black/40 blur-xl translate-y-4" />

          {/* Outer wooden rail with 3D effect */}
          <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-[#8B5A2B] via-[#5D3A1A] to-[#2C1810] shadow-[0_8px_0_#1a0f0a,0_12px_30px_rgba(0,0,0,0.6)]">
            {/* Top highlight on wood */}
            <div className="absolute inset-x-[10%] top-0 h-[15%] rounded-t-[50%] bg-gradient-to-b from-white/10 to-transparent" />
          </div>

          {/* Padded cushion rim */}
          <div className="absolute inset-[8px] rounded-[50%] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] shadow-[inset_0_4px_8px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(255,255,255,0.05)]" />

          {/* Felt playing surface */}
          <div className="absolute inset-[16px] rounded-[50%] bg-[#0B4D2C] shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]">
            {/* Felt gradient for depth */}
            <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-[#0E5E36]/80 via-transparent to-[#063D1F]/60" />

            {/* Center spotlight */}
            <div className="absolute inset-[20%] rounded-[50%] bg-gradient-radial from-[#14804A]/25 via-transparent to-transparent blur-sm" />

            {/* Betting oval line */}
            <div className="absolute inset-[12%] rounded-[50%] border-2 border-[#C4A74C]/10 shadow-[0_0_8px_rgba(196,167,76,0.05)]" />

            {/* Dealer area markers - subtle */}
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-white/5" />
          </div>

          {/* center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Phase indicator */}
            <AnimatePresence mode="wait">
              {gameState.phase !== "waiting" && (
                <motion.div
                  key={gameState.phase}
                  variants={phaseBadgeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10"
                >
                  {/* Phase progress dots */}
                  <div className="flex gap-1.5">
                    {PHASE_ORDER.map((phase, i) => (
                      <div
                        key={phase}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          getPhaseIndex(gameState.phase) >= i
                            ? "bg-[#C9A227] shadow-[0_0_6px_rgba(201,162,39,0.5)]"
                            : "bg-white/20"
                        )}
                      />
                    ))}
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                    {gameState.phase}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

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
