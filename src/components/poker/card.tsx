"use client";

import { Card as CardType } from "@/types/poker";
import { getSuitSymbol, getSuitColor } from "@/lib/poker/deck";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  delay?: number;
}

const sizeClasses = {
  sm: "w-10 h-14",
  md: "w-12 h-17",
  lg: "w-16 h-22",
};

const fontSizes = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

export function PlayingCard({ card, faceDown = false, size = "md", className, delay = 0 }: CardProps) {
  const showBack = faceDown || !card;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay }}
      className={cn(
        "relative rounded-md shadow-md flex items-center justify-center",
        sizeClasses[size],
        showBack ? "bg-slate-700" : "bg-white",
        className
      )}
    >
      {showBack ? (
        <div className="text-slate-500 text-lg font-bold">♠</div>
      ) : (
        <CardFace card={card!} size={size} />
      )}
    </motion.div>
  );
}

function CardFace({ card, size }: { card: CardType; size: "sm" | "md" | "lg" }) {
  const symbol = getSuitSymbol(card.suit);
  const color = getSuitColor(card.suit);
  const textColor = color === "red" ? "text-red-600" : "text-slate-900";

  return (
    <div className={cn("font-bold", fontSizes[size], textColor)}>
      {card.rank}{symbol}
    </div>
  );
}
