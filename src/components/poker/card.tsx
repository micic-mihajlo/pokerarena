"use client";

import { Card as CardType } from "@/types/poker";
import { getSuitSymbol, getSuitColor } from "@/lib/poker/deck";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { cardDealVariants } from "@/lib/animations";

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  index?: number;
}

const sizes = {
  sm: {
    card: "w-10 h-[56px]",
    rank: "text-base",
    suit: "text-lg",
    corner: "text-[8px]",
    cornerSuit: "text-[6px]",
  },
  md: {
    card: "w-14 h-[76px]",
    rank: "text-xl",
    suit: "text-2xl",
    corner: "text-[9px]",
    cornerSuit: "text-[7px]",
  },
  lg: {
    card: "w-[72px] h-[100px]",
    rank: "text-2xl",
    suit: "text-3xl",
    corner: "text-[10px]",
    cornerSuit: "text-[8px]",
  },
};

export function PlayingCard({ card, faceDown = false, size = "md", className, index = 0 }: CardProps) {
  const showBack = faceDown || !card;
  const s = sizes[size];
  const isRed = card && getSuitColor(card.suit) === "red";

  return (
    <motion.div
      variants={cardDealVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={cn(
        "relative rounded-lg overflow-hidden shadow-lg",
        s.card,
        className
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {showBack ? (
        // Card back - premium casino style
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border border-slate-500/50">
          {/* Inner decorative border */}
          <div className="absolute inset-1.5 rounded-md border border-slate-500/30">
            {/* Pattern background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-900/20 to-rose-950/30" />
            {/* Center emblem */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600/30 to-amber-800/30 border border-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400/60 text-sm">♠</span>
              </div>
            </div>
          </div>
          {/* Glossy reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        </div>
      ) : (
        // Card face - professional look
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-slate-200/80">
          {/* Corner indices - top left */}
          <div className={cn(
            "absolute top-1 left-1.5 flex flex-col items-center leading-none",
            isRed ? "text-red-600" : "text-slate-800"
          )}>
            <span className={cn("font-bold", s.corner)}>{card!.rank}</span>
            <span className={s.cornerSuit}>{getSuitSymbol(card!.suit)}</span>
          </div>

          {/* Corner indices - bottom right (rotated) */}
          <div className={cn(
            "absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180",
            isRed ? "text-red-600" : "text-slate-800"
          )}>
            <span className={cn("font-bold", s.corner)}>{card!.rank}</span>
            <span className={s.cornerSuit}>{getSuitSymbol(card!.suit)}</span>
          </div>

          {/* Center rank and suit */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "font-bold leading-none",
              s.rank,
              isRed ? "text-red-600 drop-shadow-[0_0_2px_rgba(220,38,38,0.2)]" : "text-slate-800"
            )}>
              {card!.rank}
            </span>
            <span className={cn(
              "leading-none -mt-0.5",
              s.suit,
              isRed ? "text-red-600" : "text-slate-800"
            )}>
              {getSuitSymbol(card!.suit)}
            </span>
          </div>

          {/* Glossy reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
        </div>
      )}
    </motion.div>
  );
}
