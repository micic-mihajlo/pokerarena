"use client";

import { useEffect, useRef } from "react";
import { PlayerAction, Player, GamePhase, HAND_RANK_NAMES, EvaluatedHand } from "@/types/poker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ActionLogProps {
  actions: PlayerAction[];
  players: Player[];
  phase: GamePhase;
  handNumber: number;
  winners?: { playerId: string; amount: number; hand?: EvaluatedHand }[];
  className?: string;
}

export function ActionLog({ actions, players, phase, handNumber, winners, className }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  const getActionColor = (action: string) => {
    switch (action) {
      case "fold": return "text-slate-400";
      case "check": return "text-slate-300";
      case "call": return "text-emerald-400";
      case "bet": return "text-amber-400";
      case "raise": return "text-rose-400";
      default: return "text-white";
    }
  };

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions, winners]);

  return (
    <div className={cn("bg-slate-900 rounded-lg border border-slate-800 overflow-hidden", className)}>
      <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <span className="text-white font-medium text-sm">Action Log</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">#{handNumber}</span>
          <span className="text-slate-600 text-xs uppercase">{phase}</span>
        </div>
      </div>

      <ScrollArea className="h-[220px]" ref={scrollRef}>
        <div className="p-2 space-y-0.5">
          {actions.map((action, i) => (
            <motion.div
              key={`${action.playerId}-${action.timestamp}-${i}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/30 text-sm"
            >
              <span className="text-slate-500 text-xs font-mono w-14 shrink-0">
                {new Date(action.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className="text-slate-300 truncate">
                {getPlayerName(action.playerId)}
              </span>
              <span className={cn("font-semibold uppercase", getActionColor(action.type))}>
                {action.type}
              </span>
              {action.amount && (
                <span className="text-emerald-400 font-mono">
                  {action.amount}
                </span>
              )}
            </motion.div>
          ))}

          {/* winner display */}
          {winners && winners.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 mx-2 p-3 bg-amber-500/10 rounded border border-amber-500/20"
            >
              <div className="text-amber-400 font-semibold text-sm text-center mb-1">
                Winner{winners.length > 1 ? "s" : ""}
              </div>
              {winners.map((winner) => (
                <div key={winner.playerId} className="text-center text-sm">
                  <span className="text-white">{getPlayerName(winner.playerId)}</span>
                  <span className="text-emerald-400 font-mono ml-2">+{winner.amount}</span>
                  {winner.hand && (
                    <span className="text-amber-300 text-xs ml-1">
                      ({HAND_RANK_NAMES[winner.hand.rank]})
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {actions.length === 0 && (
            <div className="text-slate-600 text-center py-6 text-sm">
              No actions yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
