"use client";

import { Card } from "@/types/poker";
import { PlayingCard } from "./card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface CommunityCardsProps {
  cards: Card[];
  className?: string;
}

export function CommunityCards({ cards, className }: CommunityCardsProps) {
  return (
    <motion.div
      className={cn("flex gap-2 items-center justify-center", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          {cards[i] ? (
            <PlayingCard card={cards[i]} size="lg" delay={i * 0.1} />
          ) : (
            <div className="w-20 h-28 rounded-md border-2 border-dashed border-white/20" />
          )}
        </div>
      ))}
    </motion.div>
  );
}
