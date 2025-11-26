"use client";

import { useGameStore } from "@/stores/game-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SPEED_OPTIONS } from "@/lib/poker/constants";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";

interface GameControlsProps {
  className?: string;
  onReset?: () => void;
}

export function GameControls({ className, onReset }: GameControlsProps) {
  const {
    gameState,
    isRunning,
    isPaused,
    speed,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    setSpeed,
  } = useGameStore();

  const isGameOver = gameState?.phase === "complete";
  const currentSpeedLabel = SPEED_OPTIONS.find((s) => s.value === speed)?.label || "Normal";

  return (
    <div className={cn("bg-slate-900 rounded-xl border border-slate-700 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* main controls */}
        <div className="flex items-center gap-2">
          {!isRunning || isGameOver ? (
            <Button
              onClick={startGame}
              size="lg"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="w-4 h-4" />
              {isGameOver ? "New Game" : "Start Game"}
            </Button>
          ) : (
            <Button
              onClick={isPaused ? resumeGame : pauseGame}
              size="lg"
              variant={isPaused ? "default" : "secondary"}
              className="gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              )}
            </Button>
          )}

          <Button onClick={onReset || resetGame} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* game status */}
        {gameState && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Hand:</span>
              <span className="text-white font-mono">#{gameState.handNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Phase:</span>
              <Badge variant="outline" className="uppercase">
                {gameState.phase}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Players:</span>
              <span className="text-white">
                {gameState.players.filter((p) => p.chips > 0).length} remaining
              </span>
            </div>
            {isRunning && (
              <Badge variant={isPaused ? "secondary" : "default"} className={cn(!isPaused && "bg-emerald-600")}>
                {isPaused ? "Paused" : "Running"}
              </Badge>
            )}
          </div>
        )}

        {/* speed control */}
        <div className="flex items-center gap-3">
          <FastForward className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-sm">Speed:</span>
          <Badge variant="secondary" className="min-w-[60px] justify-center">
            {currentSpeedLabel}
          </Badge>
          <Slider
            value={[SPEED_OPTIONS.findIndex((s) => s.value === speed)]}
            onValueChange={([i]) => setSpeed(SPEED_OPTIONS[i].value)}
            max={SPEED_OPTIONS.length - 1}
            step={1}
            className="w-28"
          />
        </div>
      </div>
    </div>
  );
}
