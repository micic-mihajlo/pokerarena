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
  const scrollRef = useRef<HTMLDivElement>(null);

  // initialize game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // auto-scroll to bottom when new entry added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [reasoningHistory]);

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
      if (data.reasoning) {
        setReasoningHistory((prev) => [
          ...prev,
          {
            id: `${currentPlayer.id}-${Date.now()}`,
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            model: currentPlayer.model,
            reasoning: data.reasoning,
            action: data.action,
            timestamp: Date.now(),
          },
        ]);
      }

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
    <main className="min-h-screen bg-slate-950 p-4 md:p-6 lg:p-8">
      {/* header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-emerald-400">Poker</span>
              <span className="text-white">Arena</span>
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              LLM Poker Benchmark — Watch AI models compete in Texas Hold&apos;em
            </p>
          </div>

          {isRunning && !isPaused && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300 text-sm font-medium">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* main content */}
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* thinking panel - bigger and scrollable */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden sticky top-6">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                <h3 className="text-white font-semibold">AI Reasoning</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  LLM thought process for each decision
                </p>
              </div>

              <ScrollArea className="h-[400px]" ref={scrollRef}>
                <div className="p-3 space-y-3">
                  {/* history entries */}
                  {reasoningHistory.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-800 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-white font-medium text-sm">
                            {entry.playerName}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {getModelShortName(entry.model)}
                          </div>
                        </div>
                        <span className={cn(
                          "text-xs font-bold uppercase px-2 py-0.5 rounded",
                          entry.action === "fold" && "bg-slate-700 text-slate-300",
                          entry.action === "check" && "bg-slate-700 text-slate-300",
                          entry.action === "call" && "bg-emerald-600/20 text-emerald-400",
                          entry.action === "bet" && "bg-amber-600/20 text-amber-400",
                          entry.action === "raise" && "bg-rose-600/20 text-rose-400"
                        )}>
                          {entry.action}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {entry.reasoning}
                      </p>
                      <div className="text-slate-600 text-xs mt-2">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  ))}

                  {/* current thinking indicator */}
                  <AnimatePresence>
                    {thinkingState?.isThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-slate-800/50 border border-slate-700 border-dashed rounded-lg p-3"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          {thinkingState.playerName}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <span>Thinking</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1 h-1 rounded-full bg-slate-400"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1,
                                  delay: i * 0.2,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* empty state */}
                  {reasoningHistory.length === 0 && !thinkingState?.isThinking && (
                    <div className="text-center py-12 text-slate-600 text-sm">
                      Waiting for game to start...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* poker table */}
          <div className="xl:col-span-6 order-1 xl:order-2">
            <PokerTable gameState={gameState} />
            <div className="mt-3 text-center">
              <span className="text-slate-600 text-xs">
                Spectator view — LLMs only see their own cards and community cards
              </span>
            </div>
          </div>

          {/* sidebar */}
          <div className="xl:col-span-3 order-3 space-y-6">
            <ActionLog
              actions={gameState.actionLog}
              players={gameState.players}
              phase={gameState.phase}
              handNumber={gameState.handNumber}
              winners={gameState.winners}
            />

            {/* standings */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                <h3 className="text-white font-semibold">Standings</h3>
              </div>
              <div className="p-3 space-y-1">
                {[...gameState.players]
                  .sort((a, b) => b.chips - a.chips)
                  .map((player, i) => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg",
                        i === 0 ? "bg-slate-800" : "hover:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                            i === 0 ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-400"
                          )}
                        >
                          {i + 1}
                        </span>
                        <div>
                          <div className="text-white text-sm font-medium">
                            {player.name}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {getModelShortName(player.model)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-mono font-bold text-sm">
                          {player.chips.toLocaleString()}
                        </div>
                        {player.status === "out" && (
                          <div className="text-slate-500 text-xs">Out</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* game controls */}
      <div className="max-w-[1600px] mx-auto mt-6">
        <GameControls onReset={handleReset} />
      </div>
    </main>
  );
}

function getModelShortName(model: string): string {
  if (model.includes("gpt")) return "GPT";
  if (model.includes("claude-haiku")) return "Haiku";
  if (model.includes("claude-sonnet")) return "Sonnet";
  if (model.includes("gemini")) return "Gemini";
  return model.split("/").pop() || model;
}
