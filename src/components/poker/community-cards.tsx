"use client";

import { Card } from "@/types/poker";
import { PlayingCard } from "./card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { communityCardVariants } from "@/lib/animations";

interface CommunityCardsProps {
  cards: Card[];
  className?: string;
}

export function CommunityCards({ cards, className }: CommunityCardsProps) {
  return (
    <div className={cn("flex gap-2 items-center justify-center", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          variants={communityCardVariants}
          initial="hidden"
          animate={cards[i] ? "visible" : "hidden"}
          custom={i}
        >
          {cards[i] ? (
            <PlayingCard card={cards[i]} size="lg" index={i} />
          ) : (
            <div className="w-[72px] h-[100px] rounded-lg border-2 border-dashed border-white/10 bg-white/5 backdrop-blur-sm" />
          )}
        </motion.div>
      ))}
    </div>
  );
}
