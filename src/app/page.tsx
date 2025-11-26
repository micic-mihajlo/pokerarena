"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { PokerTable } from "@/components/poker/poker-table";
import { ActionLog } from "@/components/poker/action-log";
import { GameControls } from "@/components/poker/game-controls";
import { GameState } from "@/types/poker";
import { ACTION_DELAY, PHASE_TRANSITION_DELAY } from "@/lib/poker/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface ThinkingEntry {
  id: string;
  playerId: string;
  playerName: string;
  model: string;
  reasoning: string;
  action: string;
  timestamp: number;
}


interface ThinkingState {
  playerId: string;
  playerName: string;
  model: string;
  isThinking: boolean;
}

export default function Home() {
  const {
    gameState,
    isRunning,
    isPaused,
    speed,
    initGame,
    nextHand,
    setError,
  } = useGameStore();

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const [thinkingState, setThinkingState] = useState<ThinkingState | null>(null);
  const [reasoningHistory, setReasoningHistory] = useState<ThinkingEntry[]>([]);
  const reasoningScrollRef = useRef<HTMLDivElement>(null);
  const lastHandNumberRef = useRef<number>(0);

  // initialize game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // clear reasoning history when hand number changes
  useEffect(() => {
    if (gameState && gameState.handNumber !== lastHandNumberRef.current) {
      lastHandNumberRef.current = gameState.handNumber;
      setReasoningHistory([]);
    }
  }, [gameState?.handNumber]);

  // auto-scroll reasoning panel
  useEffect(() => {
    if (reasoningScrollRef.current) {
      reasoningScrollRef.current.scrollTop = reasoningScrollRef.current.scrollHeight;
    }
  }, [reasoningHistory, thinkingState]);

  // fetch action from api
  const fetchAction = useCallback(async (state: GameState) => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    setThinkingState({
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      model: currentPlayer.model,
      isThinking: true,
    });

    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameState: {
            ...state,
            bettingRound: {
              ...state.bettingRound,
              actedPlayers: Array.from(state.bettingRound.actedPlayers),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error && !data.action) {
        throw new Error(data.error);
      }

      // add to history
      setReasoningHistory((prev) => [
        ...prev,
        {
          id: `${currentPlayer.id}-${Date.now()}`,
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          model: currentPlayer.model,
          reasoning: data.reasoning || "No reasoning provided.",
          action: data.action,
          timestamp: Date.now(),
        },
      ]);

      setThinkingState(null);
      return data;
    } catch (error) {
      console.error("Error fetching action:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setThinkingState(null);
      return null;
    }
  }, [setError]);

  // game loop
  useEffect(() => {
    if (!isRunning || isPaused || !gameState) {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const runGameStep = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const currentState = useGameStore.getState().gameState;
        if (!currentState) return;

        if (currentState.phase === "waiting") {
          isProcessingRef.current = false;
          return;
        }

        if (currentState.phase === "showdown" || currentState.phase === "complete") {
          setThinkingState(null);
          const delay = speed === 0 ? 0 : PHASE_TRANSITION_DELAY * speed;
          await new Promise((resolve) => setTimeout(resolve, delay));
          nextHand();
          isProcessingRef.current = false;
          return;
        }

        const currentPlayer = currentState.players[currentState.currentPlayerIndex];
        if (!currentPlayer || currentPlayer.status !== "active") {
          isProcessingRef.current = false;
          return;
        }

        const result = await fetchAction(currentState);

        if (result && result.action) {
          useGameStore.setState({ gameState: result.newState });
        }

        const delay = speed === 0 ? 0 : ACTION_DELAY * speed;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error("Game loop error:", error);
      } finally {
        isProcessingRef.current = false;
      }

      if (useGameStore.getState().isRunning && !useGameStore.getState().isPaused) {
        gameLoopRef.current = setTimeout(runGameStep, 100);
      }
    };

    gameLoopRef.current = setTimeout(runGameStep, 100);

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [isRunning, isPaused, gameState?.phase, speed, fetchAction, nextHand]);

  // clear history on reset
  const handleReset = () => {
    setReasoningHistory([]);
    lastHandNumberRef.current = 0;
    useGameStore.getState().resetGame();
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-6">
      {/* header */}
      <div className="max-w-[1800px] mx-auto mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-emerald-400">Poker</span>
              <span className="text-white">Arena</span>
            </h1>
            <p className="text-slate-500 text-sm">
              LLM Poker Benchmark
            </p>
          </div>

          {isRunning && !isPaused && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 text-sm">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* main content */}
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* left panel - AI reasoning */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-white font-medium text-sm">AI Reasoning</span>
                <span className="text-slate-500 text-xs">Hand #{gameState.handNumber}</span>
              </div>

              <ScrollArea className="h-[500px] xl:h-[550px]" ref={reasoningScrollRef}>
                <div className="p-3 space-y-2">
                  {reasoningHistory.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800/50 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white text-sm font-medium">
                          {entry.playerName}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                          entry.action === "fold" && "bg-slate-700 text-slate-300",
                          entry.action === "check" && "bg-slate-700 text-slate-300",
                          entry.action === "call" && "bg-emerald-900 text-emerald-400",
                          entry.action === "bet" && "bg-amber-900 text-amber-400",
                          entry.action === "raise" && "bg-rose-900 text-rose-400"
                        )}>
                          {entry.action}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">
                        {entry.reasoning}
                      </p>
                    </motion.div>
                  ))}

                  <AnimatePresence>
                    {thinkingState?.isThinking && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-slate-800/30 border border-dashed border-slate-700 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">{thinkingState.playerName}</span>
                          <div className="flex gap-0.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 h-1 rounded-full bg-amber-400"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {reasoningHistory.length === 0 && !thinkingState?.isThinking && (
                    <div className="text-center py-8 text-slate-600 text-sm">
                      Waiting for game...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* center - poker table */}
          <div className="xl:col-span-6 order-1 xl:order-2">
            <PokerTable gameState={gameState} />
            <p className="text-center text-slate-600 text-xs mt-2">
              Spectator view — LLMs only see their own cards
            </p>
          </div>

          {/* right panel */}
          <div className="xl:col-span-3 order-3 space-y-4">
            <ActionLog
              actions={gameState.actionLog}
              players={gameState.players}
              phase={gameState.phase}
              handNumber={gameState.handNumber}
              winners={gameState.winners}
            />

            {/* standings */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-800">
                <span className="text-white font-medium text-sm">Standings</span>
              </div>
              <div className="p-2">
                {[...gameState.players]
                  .sort((a, b) => b.chips - a.chips)
                  .map((player, i) => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded",
                        i === 0 && "bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                          i === 0 ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-400"
                        )}>
                          {i + 1}
                        </span>
                        <span className="text-white text-sm">{player.name}</span>
                      </div>
                      <span className="text-emerald-400 font-mono text-sm font-bold">
                        {player.chips.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* game controls - fixed at bottom */}
      <div className="max-w-[1800px] mx-auto mt-4">
        <GameControls onReset={handleReset} />
      </div>
    </main>
  );
}
