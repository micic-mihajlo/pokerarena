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
}

const sizes = {
  sm: { card: "w-9 h-14", text: "text-sm" },
  md: { card: "w-12 h-[68px]", text: "text-base" },
  lg: { card: "w-16 h-[88px]", text: "text-xl" },
};

export function PlayingCard({ card, faceDown = false, size = "md", className }: CardProps) {
  const showBack = faceDown || !card;
  const s = sizes[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded shadow-md flex items-center justify-center",
        s.card,
        showBack ? "bg-slate-700 border border-slate-600" : "bg-white",
        className
      )}
    >
      {showBack ? (
        <span className="text-slate-500 text-base">♠</span>
      ) : (
        <span className={cn(
          "font-bold",
          s.text,
          getSuitColor(card!.suit) === "red" ? "text-red-600" : "text-slate-900"
        )}>
          {card!.rank}{getSuitSymbol(card!.suit)}
        </span>
      )}
    </motion.div>
  );
}
