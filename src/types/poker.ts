// card suits and ranks
export const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface Card {
  suit: Suit;
  rank: Rank;
}

// hand rankings from lowest to highest
export enum HandRank {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9,
}

export const HAND_RANK_NAMES: Record<HandRank, string> = {
  [HandRank.HIGH_CARD]: "High Card",
  [HandRank.ONE_PAIR]: "One Pair",
  [HandRank.TWO_PAIR]: "Two Pair",
  [HandRank.THREE_OF_A_KIND]: "Three of a Kind",
  [HandRank.STRAIGHT]: "Straight",
  [HandRank.FLUSH]: "Flush",
  [HandRank.FULL_HOUSE]: "Full House",
  [HandRank.FOUR_OF_A_KIND]: "Four of a Kind",
  [HandRank.STRAIGHT_FLUSH]: "Straight Flush",
  [HandRank.ROYAL_FLUSH]: "Royal Flush",
};

// evaluated hand result
export interface EvaluatedHand {
  rank: HandRank;
  cards: Card[]; // the 5 cards that make the hand
  kickers: number[]; // tiebreaker values
}

// player status in a hand
export type PlayerStatus = "active" | "folded" | "all_in" | "out";

// llm player configuration
export interface LLMPlayer {
  id: string;
  name: string;
  model: string; // model id (gateway/openrouter compatible)
  avatar?: string;
}

// player state during a game
export interface Player extends LLMPlayer {
  chips: number;
  holeCards: Card[];
  currentBet: number; // bet in current betting round
  totalBetThisHand: number; // total invested this hand (across all rounds)
  status: PlayerStatus;
  seatPosition: number;
  isDealer: boolean;
  isTurn: boolean;
}

// betting actions
export type ActionType = "fold" | "check" | "call" | "bet" | "raise";

export interface PlayerAction {
  type: ActionType;
  amount?: number;
  playerId: string;
  timestamp: number;
  reasoning?: string; // llm thought process
}

// game phases
export type GamePhase = "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown" | "complete";

// betting round state
export interface BettingRound {
  phase: GamePhase;
  currentBet: number;
  minRaise: number;
  raisesThisRound: number;
  lastRaiser: string | null;
  actedPlayers: Set<string>;
}

// pot structure for side pots
export interface Pot {
  amount: number;
  eligiblePlayers: string[];
}

// complete game state
export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pots: Pot[];
  dealerPosition: number;
  currentPlayerIndex: number;
  smallBlind: number;
  bigBlind: number;
  bettingRound: BettingRound;
  actionLog: PlayerAction[];
  handNumber: number;
  winners: { playerId: string; amount: number; hand?: EvaluatedHand }[];
}

// game configuration
export interface GameConfig {
  players: LLMPlayer[];
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
}

// action log entry for display
export interface ActionLogEntry {
  playerId: string;
  playerName: string;
  action: ActionType;
  amount?: number;
  timestamp: number;
  phase: GamePhase;
}

// valid actions for current player
export interface ValidActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBet: boolean;
  betAmount: number;
  canRaise: boolean;
  raiseAmount: number;
}

// default llm players
export const DEFAULT_PLAYERS: LLMPlayer[] = [
  { id: "gpt-5.1", name: "GPT-5.1", model: "openai/gpt-5.1" },
  { id: "claude-haiku", name: "Claude Haiku 4.5", model: "anthropic/claude-haiku-4.5" },
  { id: "claude-sonnet", name: "Claude Sonnet 4.5", model: "anthropic/claude-sonnet-4.5" },
  { id: "gemini-flash", name: "Gemini 2.5 Flash", model: "google/gemini-2.5-flash" },
];

