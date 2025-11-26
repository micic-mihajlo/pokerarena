"use client";

import { useState } from "react";
import { PlayerAction, Player, GamePhase, HAND_RANK_NAMES, EvaluatedHand } from "@/types/poker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface ActionLogProps {
  actions: PlayerAction[];
  players: Player[];
  phase: GamePhase;
  handNumber: number;
  winners?: { playerId: string; amount: number; hand?: EvaluatedHand }[];
  className?: string;
}

export function ActionLog({ actions, players, phase, handNumber, winners, className }: ActionLogProps) {
  const [expandedAction, setExpandedAction] = useState<number | null>(null);

  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  const getActionColor = (action: string) => {
    switch (action) {
      case "fold":
        return "text-slate-400";
      case "check":
        return "text-slate-300";
      case "call":
        return "text-emerald-400";
      case "bet":
        return "text-amber-400";
      case "raise":
        return "text-rose-400";
      default:
        return "text-white";
    }
  };

  return (
    <div
      className={cn(
        "bg-slate-900 rounded-xl border border-slate-700 overflow-hidden",
        className
      )}
    >
      {/* header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Action Log</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs border-slate-600">
              Hand #{handNumber}
            </Badge>
            <Badge
              variant={phase === "showdown" ? "default" : "secondary"}
              className="text-xs uppercase"
            >
              {phase}
            </Badge>
          </div>
        </div>
      </div>

      {/* log entries */}
      <ScrollArea className="h-[280px]">
        <div className="p-3 space-y-1">
          <AnimatePresence initial={false}>
            {actions.map((action, i) => (
              <motion.div
                key={`${action.playerId}-${action.timestamp}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group"
              >
                <div
                  className={cn(
                    "rounded-lg p-2.5 transition-colors cursor-pointer hover:bg-slate-800/50",
                    expandedAction === i && "bg-slate-800/50"
                  )}
                  onClick={() => setExpandedAction(expandedAction === i ? null : i)}
                >
                  {/* main action row */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 text-xs font-mono w-16">
                      {new Date(action.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span className="text-white font-medium">
                      {getPlayerName(action.playerId)}
                    </span>
                    <span className={cn("font-bold uppercase", getActionColor(action.type))}>
                      {action.type}
                    </span>
                    {action.amount && (
                      <span className="text-emerald-400 font-mono">
                        {action.amount}
                      </span>
                    )}
                    {action.reasoning && (
                      <span className="text-slate-600 text-xs ml-auto">
                        {expandedAction === i ? "▲" : "▼"}
                      </span>
                    )}
                  </div>

                  {/* reasoning (expandable) */}
                  <AnimatePresence>
                    {action.reasoning && expandedAction === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 pt-2 border-t border-slate-700/50 text-slate-400 text-xs leading-relaxed">
                          {action.reasoning}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* winner display */}
          {winners && winners.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20"
            >
              <div className="text-amber-400 font-semibold text-center text-sm mb-2">
                Winner{winners.length > 1 ? "s" : ""}
              </div>
              {winners.map((winner) => (
                <div key={winner.playerId} className="text-center text-sm">
                  <span className="text-white font-medium">
                    {getPlayerName(winner.playerId)}
                  </span>
                  <span className="text-emerald-400 font-mono ml-2">
                    +{winner.amount}
                  </span>
                  {winner.hand && (
                    <span className="text-amber-300 ml-2 text-xs">
                      ({HAND_RANK_NAMES[winner.hand.rank]})
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {actions.length === 0 && (
            <div className="text-slate-500 text-center py-8 text-sm">
              Waiting for game to start...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
