"use client";

import { Card } from "@/types/poker";
import { PlayingCard } from "./card";
import { cn } from "@/lib/utils";

interface CommunityCardsProps {
  cards: Card[];
  className?: string;
}

export function CommunityCards({ cards, className }: CommunityCardsProps) {
  return (
    <div className={cn("flex gap-1.5 items-center justify-center", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          {cards[i] ? (
            <PlayingCard card={cards[i]} size="md" />
          ) : (
            <div className="w-12 h-[68px] rounded border border-dashed border-white/20" />
          )}
        </div>
      ))}
    </div>
  );
}
