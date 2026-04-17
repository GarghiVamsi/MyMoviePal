"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
  max?: number;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  value,
  onChange,
  max = 10,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizeClass = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-8 h-8" }[size];
  const textClass = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const filled = n <= (readonly ? value : hovered || value);
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(n)}
            onMouseEnter={() => !readonly && setHovered(n)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              sizeClass,
              "transition-transform",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
            aria-label={`Rate ${n} out of ${max}`}
          >
            <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}
              className={cn(filled ? "text-amber-400" : "text-gray-600", "w-full h-full")}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        );
      })}
      {value > 0 && (
        <span className={cn("ml-1 font-semibold text-amber-400", textClass)}>
          {value}/{max}
        </span>
      )}
    </div>
  );
}
