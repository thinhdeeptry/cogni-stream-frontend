"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value?: number;
  defaultValue?: number;
  count?: number;
  onChange?: (value: number) => void;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  label?: string;
  error?: string;
}

const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value,
      defaultValue = 0,
      count = 5,
      onChange,
      className,
      disabled = false,
      size = "md",
      readonly = false,
      label,
      error,
      ...props
    },
    ref,
  ) => {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const controlledValue = value !== undefined ? value : internalValue;

    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const handleInteraction = (index: number) => {
      if (disabled || readonly) return;
      const newValue = index + 1;
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleInteraction(index);
      }
    };

    return (
      <div className={cn("flex flex-col gap-1", className)} {...props}>
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-1.5",
            disabled && "opacity-60",
            readonly && "pointer-events-none",
          )}
          onMouseLeave={() => !disabled && !readonly && setHoverValue(null)}
          role="radiogroup"
          aria-label={label || "Rating"}
        >
          {Array.from({ length: count }).map((_, index) => {
            const isActive = index < (hoverValue ?? controlledValue);
            return (
              <button
                key={index}
                type="button"
                disabled={disabled}
                className={cn(
                  "relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded",
                  sizeClasses[size],
                  !disabled && !readonly && "cursor-pointer",
                )}
                onMouseEnter={() =>
                  !disabled && !readonly && setHoverValue(index + 1)
                }
                onClick={() => handleInteraction(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              >
                <Star
                  className={cn(
                    "transition-all duration-150",
                    sizeClasses[size],
                    isActive
                      ? "fill-blue-600 text-blue-600"
                      : "fill-gray-200 text-gray-300",
                    !disabled && !readonly && "hover:scale-110",
                  )}
                />
              </button>
            );
          })}
          {controlledValue > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              {controlledValue} / {count}
            </span>
          )}
        </div>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    );
  },
);

Rating.displayName = "Rating";

export { Rating };
