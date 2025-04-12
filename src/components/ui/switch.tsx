"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };

    return (
      <label
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full",
          className,
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <span
          className={cn(
            "absolute h-full w-full rounded-full transition-colors",
            checked ? "bg-primary" : "bg-input",
          )}
        ></span>
        <span
          className={cn(
            "absolute h-4 w-4 rounded-full bg-background shadow-lg transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        ></span>
      </label>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
