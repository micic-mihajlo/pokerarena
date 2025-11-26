// poker game constants

export const DEFAULT_STARTING_CHIPS = 1000;
export const DEFAULT_SMALL_BLIND = 5;
export const DEFAULT_BIG_BLIND = 10;

// number of hole cards per player
export const HOLE_CARDS_COUNT = 2;

// community cards per phase
export const FLOP_CARDS = 3;
export const TURN_CARDS = 1;
export const RIVER_CARDS = 1;

// animation timings (ms)
export const DEAL_DELAY = 500;
export const ACTION_DELAY = 5000;
export const PHASE_TRANSITION_DELAY = 4000;
export const SHOWDOWN_DELAY = 6000;

// game speed multipliers
export const SPEED_OPTIONS = [
  { label: "Slow", value: 2 },
  { label: "Normal", value: 1 },
  { label: "Fast", value: 0.5 },
  { label: "Instant", value: 0 },
] as const;

