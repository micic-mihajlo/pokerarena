"use client";

import { cn } from "@/lib/utils";

interface ChipStackProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ChipStack({ amount, size = "md", className }: ChipStackProps) {
  const sizeClasses = {
    sm: "min-w-[28px] h-5 text-[10px]",
    md: "min-w-[36px] h-6 text-xs",
    lg: "min-w-[44px] h-7 text-sm",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full",
        "bg-red-600 text-white font-bold font-mono shadow",
        sizeClasses[size],
        className
      )}
    >
      {amount}
    </div>
  );
}
