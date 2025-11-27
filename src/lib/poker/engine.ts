import {
  GameState,
  GameConfig,
  Player,
  LLMPlayer,
  GamePhase,
  Card,
  ActionType,
  EvaluatedHand,
} from "@/types/poker";
import { createShuffledDeck, drawCards } from "./deck";
import { evaluateBestHand, determineWinners } from "./hand-evaluator";
import {
  applyAction,
  isBettingRoundComplete,
  resetBettingRound,
  validateAction,
  getValidActions,
} from "./betting";
import {
  DEFAULT_STARTING_CHIPS,
  DEFAULT_SMALL_BLIND,
  DEFAULT_BIG_BLIND,
  HOLE_CARDS_COUNT,
  FLOP_CARDS,
  TURN_CARDS,
  RIVER_CARDS,
} from "./constants";

// generate unique id
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// create initial game state
export function createGame(config: Partial<GameConfig> = {}): GameState {
  const {
    players = [],
    startingChips = DEFAULT_STARTING_CHIPS,
    smallBlind = DEFAULT_SMALL_BLIND,
    bigBlind = DEFAULT_BIG_BLIND,
  } = config;

  const gamePlayers: Player[] = players.map((p, i) => ({
    ...p,
    chips: startingChips,
    holeCards: [],
    currentBet: 0,
    status: "active",
    seatPosition: i,
    isDealer: i === 0,
    isTurn: false,
  }));

  return {
    id: generateId(),
    phase: "waiting",
    players: gamePlayers,
    deck: [],
    communityCards: [],
    pots: [{ amount: 0, eligiblePlayers: gamePlayers.map((p) => p.id) }],
    dealerPosition: 0,
    currentPlayerIndex: 0,
    smallBlind,
    bigBlind,
    bettingRound: {
      phase: "waiting",
      currentBet: 0,
      minRaise: bigBlind,
      raisesThisRound: 0,
      lastRaiser: null,
      actedPlayers: new Set(),
    },
    actionLog: [],
    handNumber: 0,
    winners: [],
  };
}

// start a new hand
export function startHand(state: GameState): GameState {
  let newState = { ...state };

  // move dealer button
  newState.dealerPosition = (newState.dealerPosition + 1) % newState.players.length;

  // reset players for new hand
  newState.players = newState.players.map((p, i) => ({
    ...p,
    holeCards: [],
    currentBet: 0,
    status: p.chips > 0 ? "active" : "out",
    isDealer: i === newState.dealerPosition,
    isTurn: false,
  }));

  // filter out players with no chips
  const activePlayers = newState.players.filter((p) => p.status === "active");
  if (activePlayers.length < 2) {
    newState.phase = "complete";
    return newState;
  }

  // create and shuffle deck
  newState.deck = createShuffledDeck();
  newState.communityCards = [];
  newState.pots = [{ amount: 0, eligiblePlayers: activePlayers.map((p) => p.id) }];
  newState.actionLog = [];
  newState.winners = [];
  newState.handNumber++;

  // post blinds
  newState = postBlinds(newState);

  // deal hole cards
  newState = dealHoleCards(newState);

  // set phase and first player
  newState.phase = "preflop";
  newState.bettingRound = {
    phase: "preflop",
    currentBet: newState.bigBlind,
    minRaise: newState.bigBlind,
    raisesThisRound: 0,
    lastRaiser: null,
    actedPlayers: new Set(),
  };

  // first to act is after big blind (UTG)
  newState = setNextPlayer(newState, getUTGPosition(newState));

  return newState;
}

// get position after big blind (under the gun) - skips eliminated and all-in players
function getUTGPosition(state: GameState): number {
  const numPlayers = state.players.length;
  const activePlayers = state.players.filter((p) => p.status === "active");

  // heads-up: SB (dealer) acts first preflop
  if (activePlayers.length === 2) {
    return findNextActivePlayerFrom(state, state.dealerPosition);
  }

  // find SB and BB positions (skipping eliminated players)
  const sbPos = findNextActivePlayerFrom(state, (state.dealerPosition + 1) % numPlayers);
  const bbPos = findNextActivePlayerFrom(state, (sbPos + 1) % numPlayers);

  // UTG is first active player after BB
  return findNextActivePlayerFrom(state, (bbPos + 1) % numPlayers);
}

// get first position after dealer for post-flop
function getFirstPostFlopPosition(state: GameState): number {
  const numPlayers = state.players.length;
  let pos = (state.dealerPosition + 1) % numPlayers;

  // find first active player
  for (let i = 0; i < numPlayers; i++) {
    const player = state.players[pos];
    if (player.status === "active") {
      return pos;
    }
    pos = (pos + 1) % numPlayers;
  }

  return state.dealerPosition;
}

// find next active player starting from position (inclusive)
function findNextActivePlayerFrom(state: GameState, startPos: number): number {
  const numPlayers = state.players.length;
  for (let i = 0; i < numPlayers; i++) {
    const pos = (startPos + i) % numPlayers;
    if (state.players[pos].status === "active") {
      return pos;
    }
  }
  return -1;
}

// post small and big blinds
function postBlinds(state: GameState): GameState {
  const newState = { ...state };
  const numPlayers = newState.players.length;
  const activePlayers = newState.players.filter((p) => p.status === "active");

  // heads-up special case: dealer posts SB
  if (activePlayers.length === 2) {
    const sbPos = findNextActivePlayerFrom(newState, newState.dealerPosition);
    const bbPos = findNextActivePlayerFrom(newState, (sbPos + 1) % numPlayers);

    const sbPlayer = newState.players[sbPos];
    const sbAmount = Math.min(newState.smallBlind, sbPlayer.chips);
    sbPlayer.chips -= sbAmount;
    sbPlayer.currentBet = sbAmount;
    newState.pots[0].amount += sbAmount;

    newState.actionLog.push({
      type: "bet",
      amount: sbAmount,
      playerId: sbPlayer.id,
      timestamp: Date.now(),
    });

    const bbPlayer = newState.players[bbPos];
    const bbAmount = Math.min(newState.bigBlind, bbPlayer.chips);
    bbPlayer.chips -= bbAmount;
    bbPlayer.currentBet = bbAmount;
    newState.pots[0].amount += bbAmount;

    newState.actionLog.push({
      type: "bet",
      amount: bbAmount,
      playerId: bbPlayer.id,
      timestamp: Date.now(),
    });

    if (sbPlayer.chips === 0 && sbAmount > 0) sbPlayer.status = "all_in";
    if (bbPlayer.chips === 0 && bbAmount > 0) bbPlayer.status = "all_in";

    return newState;
  }

  // normal case: find first active player after dealer for SB
  const sbPos = findNextActivePlayerFrom(newState, (newState.dealerPosition + 1) % numPlayers);
  const sbPlayer = newState.players[sbPos];
  const sbAmount = Math.min(newState.smallBlind, sbPlayer.chips);
  sbPlayer.chips -= sbAmount;
  sbPlayer.currentBet = sbAmount;
  newState.pots[0].amount += sbAmount;

  newState.actionLog.push({
    type: "bet",
    amount: sbAmount,
    playerId: sbPlayer.id,
    timestamp: Date.now(),
  });

  // find first active player after SB for BB
  const bbPos = findNextActivePlayerFrom(newState, (sbPos + 1) % numPlayers);
  const bbPlayer = newState.players[bbPos];
  const bbAmount = Math.min(newState.bigBlind, bbPlayer.chips);
  bbPlayer.chips -= bbAmount;
  bbPlayer.currentBet = bbAmount;
  newState.pots[0].amount += bbAmount;

  newState.actionLog.push({
    type: "bet",
    amount: bbAmount,
    playerId: bbPlayer.id,
    timestamp: Date.now(),
  });

  // only set to all_in if player actually posted chips and ran out
  if (sbPlayer.chips === 0 && sbAmount > 0) sbPlayer.status = "all_in";
  if (bbPlayer.chips === 0 && bbAmount > 0) bbPlayer.status = "all_in";

  return newState;
}

// deal hole cards to all active players
function dealHoleCards(state: GameState): GameState {
  const newState = { ...state };

  for (const player of newState.players) {
    if (player.status === "active" || player.status === "all_in") {
      player.holeCards = drawCards(newState.deck, HOLE_CARDS_COUNT);
    }
  }

  return newState;
}

// set current player and update isTurn flags
function setNextPlayer(state: GameState, index: number): GameState {
  const newState = { ...state };
  newState.currentPlayerIndex = index;
  newState.players = newState.players.map((p, i) => ({
    ...p,
    isTurn: i === index && p.status === "active",
  }));
  return newState;
}

// find next active player
function findNextActivePlayer(state: GameState, startIndex: number): number {
  const numPlayers = state.players.length;
  let index = (startIndex + 1) % numPlayers;

  for (let i = 0; i < numPlayers; i++) {
    const player = state.players[index];
    if (player.status === "active") {
      return index;
    }
    index = (index + 1) % numPlayers;
  }

  return -1; // no active players
}

// process a player action
export interface ProcessActionOptions {
  reasoning?: string;
}

export function processAction(
  state: GameState,
  playerId: string,
  action: ActionType,
  options: ProcessActionOptions = {}
): GameState {
  // validate action
  const validation = validateAction(state, playerId, action);
  if (!validation.valid) {
    console.error(`Invalid action: ${validation.error}`);
    return state;
  }

  // apply action
  let newState = applyAction(state, playerId, action, options.reasoning);

  // check if hand is over (everyone folded)
  const activePlayers = newState.players.filter(
    (p) => p.status === "active" || p.status === "all_in"
  );
  if (activePlayers.filter((p) => p.status !== "all_in").length <= 1) {
    // check if only one player left total
    if (activePlayers.length === 1) {
      return endHand(newState);
    }
  }

  // check if betting round is complete
  if (isBettingRoundComplete(newState)) {
    newState = advancePhase(newState);
  } else {
    // move to next player
    const nextIndex = findNextActivePlayer(newState, newState.currentPlayerIndex);
    if (nextIndex !== -1) {
      newState = setNextPlayer(newState, nextIndex);
    }
  }

  return newState;
}

// advance to next phase
function advancePhase(state: GameState): GameState {
  let newState = { ...state };
  const phases: GamePhase[] = ["preflop", "flop", "turn", "river", "showdown"];
  const currentPhaseIndex = phases.indexOf(newState.phase);

  if (currentPhaseIndex === -1 || currentPhaseIndex >= phases.length - 1) {
    return endHand(newState);
  }

  const nextPhase = phases[currentPhaseIndex + 1];

  // deal community cards
  switch (nextPhase) {
    case "flop":
      newState.communityCards = drawCards(newState.deck, FLOP_CARDS);
      break;
    case "turn":
      newState.communityCards = [
        ...newState.communityCards,
        ...drawCards(newState.deck, TURN_CARDS),
      ];
      break;
    case "river":
      newState.communityCards = [
        ...newState.communityCards,
        ...drawCards(newState.deck, RIVER_CARDS),
      ];
      break;
    case "showdown":
      return endHand(newState);
  }

  // reset for new betting round
  newState = resetBettingRound(newState, nextPhase);

  // set first player after dealer
  const firstPos = getFirstPostFlopPosition(newState);
  newState = setNextPlayer(newState, firstPos);

  return newState;
}

// end the hand and distribute pot
function endHand(state: GameState): GameState {
  let newState = { ...state };
  newState.phase = "showdown";

  // clear isTurn
  newState.players = newState.players.map((p) => ({ ...p, isTurn: false }));

  // get players still in hand
  const eligiblePlayers = newState.players.filter(
    (p) => p.status === "active" || p.status === "all_in"
  );

  // if only one player left, they win
  if (eligiblePlayers.length === 1) {
    const winner = eligiblePlayers[0];
    const winAmount = newState.pots.reduce((sum, pot) => sum + pot.amount, 0);
    winner.chips += winAmount;
    newState.winners = [{ playerId: winner.id, amount: winAmount }];
    newState.pots = [{ amount: 0, eligiblePlayers: [] }];
    return newState;
  }

  // evaluate hands
  const hands: { player: Player; hand: EvaluatedHand }[] = [];
  for (const player of eligiblePlayers) {
    if (player.holeCards.length === 2 && newState.communityCards.length >= 3) {
      const hand = evaluateBestHand(player.holeCards, newState.communityCards);
      hands.push({ player, hand });
    }
  }

  // determine winners
  const winnerIndices = determineWinners(hands.map((h) => h.hand));
  const winners = winnerIndices.map((i) => hands[i]);

  // distribute pot
  const totalPot = newState.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const splitAmount = Math.floor(totalPot / winners.length);
  const remainder = totalPot % winners.length;

  newState.winners = winners.map((w, i) => {
    const amount = splitAmount + (i === 0 ? remainder : 0);
    w.player.chips += amount;
    return {
      playerId: w.player.id,
      amount,
      hand: w.hand,
    };
  });

  newState.pots = [{ amount: 0, eligiblePlayers: [] }];

  return newState;
}

// check if game is over (only one player with chips)
export function isGameOver(state: GameState): boolean {
  const playersWithChips = state.players.filter((p) => p.chips > 0);
  return playersWithChips.length <= 1;
}

// get game winner
export function getGameWinner(state: GameState): Player | null {
  const playersWithChips = state.players.filter((p) => p.chips > 0);
  return playersWithChips.length === 1 ? playersWithChips[0] : null;
}

// export getValidActions for use in components
export { getValidActions };

