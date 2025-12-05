import { Card, HandRank, EvaluatedHand, Rank, RANKS } from "@/types/poker";
import { getRankValue } from "./deck";

// get all 5-card combinations from 7 cards
function getCombinations(cards: Card[], size: number): Card[][] {
  const results: Card[][] = [];

  function combine(start: number, combo: Card[]) {
    if (combo.length === size) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return results;
}

// count occurrences of each rank
function countRanks(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
}

// check if cards form a flush
function isFlush(cards: Card[]): boolean {
  const suit = cards[0].suit;
  return cards.every((c) => c.suit === suit);
}

// check if cards form a straight (returns high card value or 0)
function getStraightHighCard(cards: Card[]): number {
  const values = cards.map((c) => getRankValue(c.rank)).sort((a, b) => a - b);

  // check for wheel (A-2-3-4-5)
  if (values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5 && values[4] === 14) {
    return 5; // ace plays low
  }

  // check consecutive
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) {
      return 0;
    }
  }

  return values[4]; // high card of straight
}

// evaluate a 5-card hand
function evaluate5Cards(cards: Card[]): EvaluatedHand {
  const rankCounts = countRanks(cards);
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
  const flush = isFlush(cards);
  const straightHigh = getStraightHighCard(cards);
  const straight = straightHigh > 0;

  // get ranks sorted by count then value
  const sortedRanks = Array.from(rankCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return getRankValue(b[0]) - getRankValue(a[0]);
    })
    .map(([rank]) => getRankValue(rank));

  // royal flush
  if (flush && straight && straightHigh === 14) {
    return { rank: HandRank.ROYAL_FLUSH, cards, kickers: [14] };
  }

  // straight flush
  if (flush && straight) {
    return { rank: HandRank.STRAIGHT_FLUSH, cards, kickers: [straightHigh] };
  }

  // four of a kind
  if (counts[0] === 4) {
    return { rank: HandRank.FOUR_OF_A_KIND, cards, kickers: sortedRanks };
  }

  // full house
  if (counts[0] === 3 && counts[1] === 2) {
    return { rank: HandRank.FULL_HOUSE, cards, kickers: sortedRanks };
  }

  // flush
  if (flush) {
    const kickers = cards.map((c) => getRankValue(c.rank)).sort((a, b) => b - a);
    return { rank: HandRank.FLUSH, cards, kickers };
  }

  // straight
  if (straight) {
    return { rank: HandRank.STRAIGHT, cards, kickers: [straightHigh] };
  }

  // three of a kind
  if (counts[0] === 3) {
    return { rank: HandRank.THREE_OF_A_KIND, cards, kickers: sortedRanks };
  }

  // two pair
  if (counts[0] === 2 && counts[1] === 2) {
    return { rank: HandRank.TWO_PAIR, cards, kickers: sortedRanks };
  }

  // one pair
  if (counts[0] === 2) {
    return { rank: HandRank.ONE_PAIR, cards, kickers: sortedRanks };
  }

  // high card
  const kickers = cards.map((c) => getRankValue(c.rank)).sort((a, b) => b - a);
  return { rank: HandRank.HIGH_CARD, cards, kickers };
}

// compare two evaluated hands (returns negative if a < b, 0 if equal, positive if a > b)
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  // compare rank first
  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }

  // compare kickers
  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if (a.kickers[i] !== b.kickers[i]) {
      return a.kickers[i] - b.kickers[i];
    }
  }

  return 0; // tie
}

// evaluate best 5-card hand from 7 cards (hole + community)
export function evaluateBestHand(holeCards: Card[], communityCards: Card[]): EvaluatedHand {
  const allCards = [...holeCards, ...communityCards];

  if (allCards.length < 5) {
    throw new Error("Need at least 5 cards to evaluate a hand");
  }

  const combinations = getCombinations(allCards, 5);
  let bestHand: EvaluatedHand | null = null;

  for (const combo of combinations) {
    const hand = evaluate5Cards(combo);
    if (!bestHand || compareHands(hand, bestHand) > 0) {
      bestHand = hand;
    }
  }

  return bestHand!;
}

// determine winners from multiple hands (returns indices of winners)
export function determineWinners(hands: EvaluatedHand[]): number[] {
  if (hands.length === 0) return [];
  if (hands.length === 1) return [0];

  let bestIndices: number[] = [0];
  let bestHand = hands[0];

  for (let i = 1; i < hands.length; i++) {
    const comparison = compareHands(hands[i], bestHand);
    if (comparison > 0) {
      bestHand = hands[i];
      bestIndices = [i];
    } else if (comparison === 0) {
      bestIndices.push(i);
    }
  }

  return bestIndices;
}


