"use client";

import { useEffect, useRef } from "react";
import { PlayerAction, Player, GamePhase, HAND_RANK_NAMES, EvaluatedHand } from "@/types/poker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { actionLogEntryVariants } from "@/lib/animations";

interface ActionLogProps {
  actions: PlayerAction[];
  players: Player[];
  phase: GamePhase;
  handNumber: number;
  winners?: { playerId: string; amount: number; hand?: EvaluatedHand }[];
  className?: string;
}

// Action icons using unicode symbols
const ACTION_ICONS: Record<string, string> = {
  fold: "×",
  check: "✓",
  call: "→",
  bet: "$",
  raise: "↑",
};

const getActionStyles = (action: string) => {
  switch (action) {
    case "fold":
      return { icon: "bg-slate-700", text: "text-slate-400" };
    case "check":
      return { icon: "bg-slate-600", text: "text-slate-300" };
    case "call":
      return { icon: "bg-emerald-600", text: "text-emerald-400" };
    case "bet":
      return { icon: "bg-amber-600", text: "text-amber-400" };
    case "raise":
      return { icon: "bg-rose-600", text: "text-rose-400" };
    default:
      return { icon: "bg-slate-600", text: "text-white" };
  }
};

export function ActionLog({ actions, players, phase, handNumber, winners, className }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions, winners]);

  return (
    <div className={cn(
      "bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/60 overflow-hidden flex flex-col shadow-xl",
      className
    )}>
      <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-white font-semibold text-sm">Action Log</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-mono">#{handNumber}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] uppercase font-medium">
            {phase}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-2 space-y-1">
          {actions.map((action, i) => {
            const styles = getActionStyles(action.type);
            return (
              <motion.div
                key={`${action.playerId}-${action.timestamp}-${i}`}
                variants={actionLogEntryVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800/40 transition-colors group"
              >
                {/* Action icon */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold",
                  styles.icon
                )}>
                  {ACTION_ICONS[action.type] || "?"}
                </div>

                {/* Player and action */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">
                      {getPlayerName(action.playerId)}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      styles.text
                    )}>
                      {action.type}
                    </span>
                  </div>
                  {action.amount && (
                    <span className="text-emerald-400 font-mono text-xs">
                      {action.amount.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Timestamp - show on hover */}
                <span className="text-slate-600 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(action.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </motion.div>
            );
          })}

          {/* Winner display */}
          {winners && winners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 mx-1 p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 rounded-lg border border-amber-500/30"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-lg" />

              <div className="relative">
                <div className="text-amber-400 font-bold text-sm text-center mb-2 uppercase tracking-wider">
                  Winner{winners.length > 1 ? "s" : ""}
                </div>
                {winners.map((winner) => (
                  <div key={winner.playerId} className="text-center py-1">
                    <span className="text-white font-semibold">{getPlayerName(winner.playerId)}</span>
                    <span className="text-emerald-400 font-mono font-bold ml-2">
                      +{winner.amount.toLocaleString()}
                    </span>
                    {winner.hand && (
                      <div className="text-amber-300 text-xs mt-0.5">
                        {HAND_RANK_NAMES[winner.hand.rank]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {actions.length === 0 && (
            <div className="text-slate-600 text-center py-8 text-sm">
              Waiting for actions...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
