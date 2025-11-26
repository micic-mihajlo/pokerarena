"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ChipStackProps {
  amount: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// chip colors by denomination
const chipColors = [
  { min: 0, color: "bg-gray-400", border: "border-gray-500" },      // white - 1
  { min: 5, color: "bg-red-500", border: "border-red-600" },        // red - 5
  { min: 25, color: "bg-green-500", border: "border-green-600" },   // green - 25
  { min: 100, color: "bg-blue-500", border: "border-blue-600" },    // blue - 100
  { min: 500, color: "bg-purple-500", border: "border-purple-600" }, // purple - 500
  { min: 1000, color: "bg-yellow-400", border: "border-yellow-500" }, // gold - 1000
];

function getChipColor(amount: number) {
  for (let i = chipColors.length - 1; i >= 0; i--) {
    if (amount >= chipColors[i].min) {
      return chipColors[i];
    }
  }
  return chipColors[0];
}

const sizeClasses = {
  sm: "w-6 h-6 text-[8px]",
  md: "w-8 h-8 text-[10px]",
  lg: "w-10 h-10 text-xs",
};

export function ChipStack({ amount, className, size = "md" }: ChipStackProps) {
  if (amount <= 0) return null;

  const { color, border } = getChipColor(amount);
  const stackCount = Math.min(Math.ceil(amount / 100), 5);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn("relative flex flex-col-reverse items-center", className)}
    >
      {/* stacked chips visual */}
      {Array.from({ length: stackCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full border-2 shadow-md",
            color,
            border,
            sizeClasses[size],
            i > 0 && "-mt-3"
          )}
          style={{ zIndex: stackCount - i }}
        />
      ))}

      {/* amount label */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-mono font-bold">
          {formatAmount(amount)}
        </span>
      </div>
    </motion.div>
  );
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toString();
}

