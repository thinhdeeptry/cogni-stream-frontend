"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function Rating({
  value,
  onChange,
  readonly = false,
  size = "md",
  showValue = false,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            className={cn(
              "transition-colors duration-150",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default",
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-150",
                rating <= displayValue
                  ? "text-yellow-500 fill-current"
                  : "text-gray-300",
                !readonly && "hover:text-yellow-400",
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700 ml-2">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Static display component for showing ratings without interaction
interface RatingDisplayProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function RatingDisplay({
  value,
  size = "md",
  showValue = true,
  className,
}: RatingDisplayProps) {
  return (
    <Rating
      value={value}
      readonly
      size={size}
      showValue={showValue}
      className={className}
    />
  );
}
