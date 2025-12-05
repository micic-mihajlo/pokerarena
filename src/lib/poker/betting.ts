import { GameState, GamePhase, ValidActions, Player, ActionType } from "@/types/poker";

// fixed limit betting constants
export const MAX_RAISES_PER_ROUND = 4; // 1 bet + 3 raises

// get bet size for current phase (small bet for preflop/flop, big bet for turn/river)
export function getBetSize(phase: GamePhase, bigBlind: number): number {
  if (phase === "preflop" || phase === "flop") {
    return bigBlind; // small bet = 1 big blind
  }
  return bigBlind * 2; // big bet = 2 big blinds
}

// get valid actions for current player
export function getValidActions(state: GameState): ValidActions {
  const player = state.players[state.currentPlayerIndex];
  const { bettingRound, bigBlind, phase } = state;
  const betSize = getBetSize(phase, bigBlind);

  const amountToCall = bettingRound.currentBet - player.currentBet;
  const canAffordCall = player.chips >= amountToCall;
  const canAffordBet = player.chips >= betSize;
  const canAffordRaise = player.chips >= amountToCall + betSize;

  // can always fold if there's a bet to call
  const canFold = amountToCall > 0;

  // can check if no bet to call
  const canCheck = amountToCall === 0;

  // can call if there's a bet and player can afford it
  const canCall = amountToCall > 0 && canAffordCall;

  // can bet if no current bet and player can afford it
  const canBet = bettingRound.currentBet === 0 && canAffordBet;

  // can raise if there's a current bet, raises left, and player can afford it
  const canRaise =
    bettingRound.currentBet > 0 &&
    bettingRound.raisesThisRound < MAX_RAISES_PER_ROUND &&
    canAffordRaise;

  return {
    canFold,
    canCheck,
    canCall,
    callAmount: amountToCall,
    canBet,
    betAmount: betSize,
    canRaise,
    raiseAmount: betSize,
  };
}

// validate if an action is legal
export function validateAction(
  state: GameState,
  playerId: string,
  action: ActionType,
  amount?: number
): { valid: boolean; error?: string } {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);

  if (playerIndex === -1) {
    return { valid: false, error: "Player not found" };
  }

  if (playerIndex !== state.currentPlayerIndex) {
    return { valid: false, error: "Not this player's turn" };
  }

  const player = state.players[playerIndex];

  if (player.status !== "active") {
    return { valid: false, error: "Player is not active" };
  }

  const validActions = getValidActions(state);

  switch (action) {
    case "fold":
      if (!validActions.canFold && !validActions.canCheck) {
        // can always fold even if you could check (but why would you?)
      }
      return { valid: true };

    case "check":
      if (!validActions.canCheck) {
        return { valid: false, error: "Cannot check - there is a bet to call" };
      }
      return { valid: true };

    case "call":
      if (!validActions.canCall) {
        return { valid: false, error: "Cannot call - no bet to call or insufficient chips" };
      }
      return { valid: true };

    case "bet":
      if (!validActions.canBet) {
        return { valid: false, error: "Cannot bet - there is already a bet or insufficient chips" };
      }
      return { valid: true };

    case "raise":
      if (!validActions.canRaise) {
        return {
          valid: false,
          error: "Cannot raise - max raises reached or insufficient chips",
        };
      }
      return { valid: true };

    default:
      return { valid: false, error: "Invalid action type" };
  }
}

// apply action to game state (returns new state)
export function applyAction(
  state: GameState,
  playerId: string,
  action: ActionType,
  reasoning?: string
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  newState.bettingRound.actedPlayers = new Set(state.bettingRound.actedPlayers);

  const playerIndex = newState.players.findIndex((p) => p.id === playerId);
  const player = newState.players[playerIndex];
  const betSize = getBetSize(newState.phase, newState.bigBlind);

  // calculate amounts BEFORE modifying state (for action log)
  let logAmount: number | undefined;

  switch (action) {
    case "fold":
      player.status = "folded";
      break;

    case "check":
      // no chip movement
      break;

    case "call": {
      const callAmount = Math.min(
        newState.bettingRound.currentBet - player.currentBet,
        player.chips
      );
      logAmount = callAmount;
      player.chips -= callAmount;
      player.currentBet += callAmount;
      player.totalBetThisHand += callAmount;
      newState.pots[0].amount += callAmount;

      if (player.chips === 0) {
        player.status = "all_in";
      }
      break;
    }

    case "bet": {
      const betAmount = Math.min(betSize, player.chips);
      logAmount = betAmount;
      player.chips -= betAmount;
      player.currentBet += betAmount;
      player.totalBetThisHand += betAmount;
      newState.bettingRound.currentBet = player.currentBet;
      newState.bettingRound.raisesThisRound = 1;
      newState.bettingRound.lastRaiser = playerId;
      newState.pots[0].amount += betAmount;

      if (player.chips === 0) {
        player.status = "all_in";
      }
      break;
    }

    case "raise": {
      const callAmount = newState.bettingRound.currentBet - player.currentBet;
      const totalAmount = Math.min(callAmount + betSize, player.chips);
      logAmount = totalAmount;
      player.chips -= totalAmount;
      player.currentBet += totalAmount;
      player.totalBetThisHand += totalAmount;
      newState.bettingRound.currentBet = player.currentBet;
      newState.bettingRound.raisesThisRound++;
      newState.bettingRound.lastRaiser = playerId;
      newState.pots[0].amount += totalAmount;

      if (player.chips === 0) {
        player.status = "all_in";
      }
      break;
    }
  }

  // record action with pre-calculated amount
  newState.actionLog.push({
    type: action,
    amount: logAmount,
    playerId,
    timestamp: Date.now(),
    reasoning,
  });

  // mark player as having acted
  newState.bettingRound.actedPlayers.add(playerId);

  return newState;
}

// check if betting round is complete
export function isBettingRoundComplete(state: GameState): boolean {
  const activePlayers = state.players.filter(
    (p) => p.status === "active" || p.status === "all_in"
  );

  // only one non-folded player left = everyone else folded
  if (activePlayers.length <= 1) {
    return true;
  }

  // all active (non-all-in) players have acted and bets are matched
  const activeNotAllIn = activePlayers.filter((p) => p.status === "active");

  // if no active players left (all are all-in or folded), round is complete
  if (activeNotAllIn.length === 0) {
    return true;
  }

  // if only one active player and all others are all-in, check if they've acted
  if (activeNotAllIn.length === 1) {
    const player = activeNotAllIn[0];
    // they need to have acted AND matched the bet (or be facing no bet)
    if (state.bettingRound.actedPlayers.has(player.id)) {
      // if their bet matches or exceeds, round is done
      if (player.currentBet >= state.bettingRound.currentBet) {
        return true;
      }
    }
    return false;
  }

  // normal case: all active players must have acted and matched bets
  for (const player of activeNotAllIn) {
    // hasn't acted yet
    if (!state.bettingRound.actedPlayers.has(player.id)) {
      return false;
    }
    // bet not matched (unless they're the one who set it)
    if (player.currentBet < state.bettingRound.currentBet) {
      return false;
    }
  }

  return true;
}

// reset betting round for new phase
export function resetBettingRound(state: GameState, phase: GamePhase): GameState {
  const newState = { ...state };
  newState.phase = phase;
  newState.bettingRound = {
    phase,
    currentBet: 0,
    minRaise: getBetSize(phase, state.bigBlind),
    raisesThisRound: 0,
    lastRaiser: null,
    actedPlayers: new Set(),
  };

  // reset current bets
  newState.players = newState.players.map((p) => ({
    ...p,
    currentBet: 0,
  }));

  return newState;
}

