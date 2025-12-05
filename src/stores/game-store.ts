import { create } from "zustand";
import { GameState, GameConfig, LLMPlayer, ActionType, DEFAULT_PLAYERS } from "@/types/poker";
import { createGame, startHand, processAction, isGameOver } from "@/lib/poker/engine";
import { DEFAULT_STARTING_CHIPS, DEFAULT_SMALL_BLIND, DEFAULT_BIG_BLIND } from "@/lib/poker/constants";

export interface GameStore {
  // state
  gameState: GameState | null;
  config: GameConfig;
  isRunning: boolean;
  isPaused: boolean;
  speed: number; // multiplier (1 = normal, 0.5 = fast, 2 = slow, 0 = instant)
  error: string | null;

  // actions
  setConfig: (config: Partial<GameConfig>) => void;
  initGame: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  setSpeed: (speed: number) => void;
  applyAction: (playerId: string, action: ActionType) => void;
  nextHand: () => void;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  config: {
    players: DEFAULT_PLAYERS,
    startingChips: DEFAULT_STARTING_CHIPS,
    smallBlind: DEFAULT_SMALL_BLIND,
    bigBlind: DEFAULT_BIG_BLIND,
  },
  isRunning: false,
  isPaused: false,
  speed: 1,
  error: null,

  setConfig: (newConfig) => {
    set((state) => ({
      config: { ...state.config, ...newConfig },
    }));
  },

  initGame: () => {
    const { config } = get();
    const gameState = createGame(config);
    set({ gameState, isRunning: false, isPaused: false, error: null });
  },

  startGame: () => {
    const { gameState } = get();
    if (!gameState) {
      get().initGame();
    }

    const currentState = get().gameState;
    if (currentState && currentState.phase === "waiting") {
      const newState = startHand(currentState);
      set({ gameState: newState, isRunning: true, isPaused: false });
    } else {
      set({ isRunning: true, isPaused: false });
    }
  },

  pauseGame: () => {
    set({ isPaused: true });
  },

  resumeGame: () => {
    set({ isPaused: false });
  },

  resetGame: () => {
    const { config } = get();
    const gameState = createGame(config);
    set({ gameState, isRunning: false, isPaused: false, error: null });
  },

  setSpeed: (speed) => {
    set({ speed });
  },

  applyAction: (playerId, action) => {
    const { gameState } = get();
    if (!gameState) return;

    const newState = processAction(gameState, playerId, action);
    set({ gameState: newState });

    // check if hand ended
    if (newState.phase === "showdown") {
      // hand is complete, will need to start new hand
    }
  },

  nextHand: () => {
    const { gameState } = get();
    if (!gameState) return;

    if (isGameOver(gameState)) {
      set({ isRunning: false });
      return;
    }

    const newState = startHand(gameState);
    set({ gameState: newState });
  },

  setError: (error) => {
    set({ error });
  },
}));


