import { GameState, Player, ValidActions, Card, HAND_RANK_NAMES } from "@/types/poker";
import { formatCard } from "@/lib/poker/deck";

export const POKER_SYSTEM_PROMPT = `You are playing Texas Hold'em Fixed Limit poker against other AI players.

RULES:
- Fixed Limit means bet/raise amounts are fixed: small bet (1 big blind) for preflop/flop, big bet (2 big blinds) for turn/river
- Maximum 4 bets per round (1 bet + 3 raises)
- You must respond with ONLY a valid JSON action

HAND RANKINGS (lowest to highest):
1. High Card
2. One Pair
3. Two Pair
4. Three of a Kind
5. Straight
6. Flush
7. Full House
8. Four of a Kind
9. Straight Flush
10. Royal Flush

Your goal is to maximize your chip winnings over many hands. Consider:
- Your hand strength and potential
- Position relative to dealer
- Pot odds and implied odds
- Opponent behavior patterns
- Stack sizes

RESPONSE FORMAT:
You must respond with ONLY valid JSON in this exact format:
{"action": "fold" | "check" | "call" | "bet" | "raise", "reasoning": "brief explanation"}

Do not include any other text outside the JSON.`;

export function formatGameStatePrompt(state: GameState, player: Player, validActions: ValidActions): string {
  const holeCards = player.holeCards.map(formatCard).join(", ");
  const communityCards = state.communityCards.length > 0
    ? state.communityCards.map(formatCard).join(", ")
    : "None yet";

  const pot = state.pots.reduce((sum, p) => sum + p.amount, 0);

  const opponents = state.players
    .filter((p) => p.id !== player.id)
    .map((p) => `${p.name}: ${p.chips} chips, ${p.status}${p.currentBet > 0 ? `, bet ${p.currentBet}` : ""}`)
    .join("\n  ");

  const recentActions = state.actionLog
    .slice(-6)
    .map((a) => {
      const actor = state.players.find((p) => p.id === a.playerId);
      return `${actor?.name || "Unknown"}: ${a.type}${a.amount ? ` ${a.amount}` : ""}`;
    })
    .join("\n  ");

  const availableActions: string[] = [];
  if (validActions.canFold) availableActions.push("fold");
  if (validActions.canCheck) availableActions.push("check");
  if (validActions.canCall) availableActions.push(`call (${validActions.callAmount} chips)`);
  if (validActions.canBet) availableActions.push(`bet (${validActions.betAmount} chips)`);
  if (validActions.canRaise) availableActions.push(`raise (${validActions.raiseAmount} chips more)`);

  return `CURRENT GAME STATE:
Phase: ${state.phase.toUpperCase()}
Hand #${state.handNumber}

YOUR CARDS: ${holeCards}
COMMUNITY CARDS: ${communityCards}

POT: ${pot} chips
YOUR CHIPS: ${player.chips}
YOUR CURRENT BET: ${player.currentBet}
BET TO CALL: ${validActions.callAmount}

OPPONENTS:
  ${opponents}

RECENT ACTIONS:
  ${recentActions || "None yet"}

AVAILABLE ACTIONS: ${availableActions.join(", ")}

What is your action? Respond with JSON only.`;
}

