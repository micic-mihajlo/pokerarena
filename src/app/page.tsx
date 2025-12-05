"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { useApiKeyStore } from "@/stores/api-key-store";
import { PokerTable } from "@/components/poker/poker-table";
import { ActionLog } from "@/components/poker/action-log";
import { SettingsDialog } from "@/components/poker/settings-dialog";
import { WelcomeScreen } from "@/components/welcome-screen";
import { Button } from "@/components/ui/button";
import { GameState } from "@/types/poker";
import { ACTION_DELAY, PHASE_TRANSITION_DELAY } from "@/lib/poker/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw } from "lucide-react";

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
    startGame,
    pauseGame,
    resumeGame,
    nextHand,
    setError,
  } = useGameStore();

  const { apiKey, isValidated, useEnvKey, loadFromStorage, setUseEnvKey } = useApiKeyStore();

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const [thinkingState, setThinkingState] = useState<ThinkingState | null>(null);
  const [reasoningHistory, setReasoningHistory] = useState<ThinkingEntry[]>([]);
  const reasoningScrollRef = useRef<HTMLDivElement>(null);
  const lastHandNumberRef = useRef<number>(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // check for env key and load from storage on mount
  useEffect(() => {
    const checkEnvKey = async () => {
      try {
        const res = await fetch("/api/check-env-key");
        const data = await res.json();
        if (data.hasEnvKey) {
          setUseEnvKey(true);
        } else {
          loadFromStorage();
        }
      } catch {
        loadFromStorage();
      }
      setIsHydrated(true);
    };
    checkEnvKey();
  }, [loadFromStorage, setUseEnvKey]);

  // initialize game on mount (only when we have API key or env key)
  useEffect(() => {
    if ((apiKey && isValidated) || useEnvKey) {
      initGame();
    }
  }, [initGame, apiKey, isValidated, useEnvKey]);

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
    const currentApiKey = useApiKeyStore.getState().apiKey;

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
          apiKey: currentApiKey,
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

  // show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // show welcome screen if no API key and not using env key
  if (!useEnvKey && (!apiKey || !isValidated)) {
    return <WelcomeScreen />;
  }

  // show loading while game initializes
  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Initializing game...</div>
      </div>
    );
  }

  return (
    <main className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-slate-900/50 via-slate-950 to-black" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-900/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Header - Broadcast style with controls */}
      <header className="relative z-10 flex-shrink-0 border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/80">
        <div className="max-w-[2000px] w-full mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-emerald-400">Poker</span>
                <span className="text-white">Arena</span>
              </h1>
              <p className="text-slate-500 text-xs">LLM Poker Championship</p>
            </div>
          </div>

          {/* Center: Game stats + Live indicator */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Live indicator */}
            {isRunning && !isPaused && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-medium uppercase tracking-wider">Live</span>
              </div>
            )}

            {/* Game stats */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm">
              <div>
                <span className="text-slate-500">Hand</span>
                <span className="text-white font-mono ml-2">#{gameState.handNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Blinds</span>
                <span className="text-amber-400 font-mono ml-2">
                  {gameState.smallBlind}/{gameState.bigBlind}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Players</span>
                <span className="text-emerald-400 font-mono ml-2">
                  {gameState.players.filter(p => p.status !== "out").length}/{gameState.players.length}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isRunning || gameState.phase === "complete" ? (
              <Button
                onClick={startGame}
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{gameState.phase === "complete" ? "New Game" : "Start"}</span>
              </Button>
            ) : (
              <Button
                onClick={isPaused ? resumeGame : pauseGame}
                size="sm"
                variant={isPaused ? "default" : "secondary"}
                className="gap-1.5"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>

            <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block" />

            <SettingsDialog disabled={isRunning && !isPaused} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 min-h-0 max-w-[2000px] w-full mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-14 gap-4 lg:gap-6 h-full">
          {/* Left panel - AI reasoning */}
          <div className="xl:col-span-3 order-2 xl:order-1 flex flex-col min-h-0">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/60 overflow-hidden flex flex-col flex-1 min-h-0 shadow-xl">
              <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white font-semibold text-sm">AI Reasoning</span>
                </div>
                <span className="text-slate-500 text-xs font-mono">Hand #{gameState.handNumber}</span>
              </div>

              <ScrollArea className="flex-1 min-h-0" ref={reasoningScrollRef}>
                <div className="p-3 space-y-2">
                  {reasoningHistory.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-semibold">
                          {entry.playerName}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          entry.action === "fold" && "bg-slate-700/80 text-slate-300",
                          entry.action === "check" && "bg-slate-700/80 text-slate-300",
                          entry.action === "call" && "bg-emerald-600/80 text-emerald-100",
                          entry.action === "bet" && "bg-amber-600/80 text-amber-100",
                          entry.action === "raise" && "bg-rose-600/80 text-rose-100"
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
                        className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-300 text-sm font-medium">{thinkingState.playerName}</span>
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-amber-400"
                                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.12 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {reasoningHistory.length === 0 && !thinkingState?.isThinking && (
                    <div className="text-center py-8 text-slate-600 text-sm">
                      Waiting for game to start...
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Center - Poker table (wider) */}
          <div className="xl:col-span-8 order-1 xl:order-2 flex flex-col min-h-0">
            <PokerTable gameState={gameState} className="flex-1" />
          </div>

          {/* Right panel */}
          <div className="xl:col-span-3 order-3 flex flex-col gap-4 min-h-0">
            <ActionLog
              actions={gameState.actionLog}
              players={gameState.players}
              phase={gameState.phase}
              handNumber={gameState.handNumber}
              winners={gameState.winners}
              className="flex-1 min-h-0"
            />

            {/* Standings */}
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/60 overflow-hidden flex-shrink-0 shadow-xl">
              <div className="px-4 py-3 border-b border-slate-800/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-white font-semibold text-sm">Standings</span>
              </div>
              <div className="p-2">
                {[...gameState.players]
                  .sort((a, b) => b.chips - a.chips)
                  .map((player, i) => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                        i === 0 && "bg-amber-500/10 border border-amber-500/20"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                          i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-md" : "bg-slate-700 text-slate-400"
                        )}>
                          {i + 1}
                        </span>
                        <span className={cn(
                          "text-sm font-medium",
                          player.status === "out" ? "text-slate-500 line-through" : "text-white"
                        )}>
                          {player.name}
                        </span>
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
    </main>
  );
}
