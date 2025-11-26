import { Card, SUITS, RANKS, Suit, Rank } from "@/types/poker";

// create a fresh 52-card deck
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

// fisher-yates shuffle
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// draw cards from deck (mutates deck)
export function drawCards(deck: Card[], count: number): Card[] {
  if (deck.length < count) {
    throw new Error(`Not enough cards in deck. Requested ${count}, have ${deck.length}`);
  }
  return deck.splice(0, count);
}

// get rank value for comparison (2=2, 3=3, ..., J=11, Q=12, K=13, A=14)
export function getRankValue(rank: Rank): number {
  const index = RANKS.indexOf(rank);
  return index + 2; // 2 is index 0, so add 2
}

// get suit symbol for display
export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return symbols[suit];
}

// get suit color
export function getSuitColor(suit: Suit): "red" | "black" {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

// format card for display
export function formatCard(card: Card): string {
  return `${card.rank}${getSuitSymbol(card.suit)}`;
}

// compare two cards by rank (returns negative if a < b, 0 if equal, positive if a > b)
export function compareCards(a: Card, b: Card): number {
  return getRankValue(a.rank) - getRankValue(b.rank);
}

// create a new shuffled deck
export function createShuffledDeck(): Card[] {
  return shuffleDeck(createDeck());
}

