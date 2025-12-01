"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface CalendarProps {
  className?: string;
  selected?: {
    from?: Date;
    to?: Date;
  };
  onSelect?: (range: { from?: Date; to?: Date } | undefined) => void;
  mode?: "single" | "range";
  initialFocus?: boolean;
  numberOfMonths?: number;
}

function Calendar({
  className,
  selected,
  onSelect,
  mode = "single",
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const selectDate = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    if (mode === "range") {
      if (!selected?.from || (selected?.from && selected?.to)) {
        onSelect?.({ from: selectedDate, to: undefined });
      } else if (selected?.from && !selected?.to) {
        if (selectedDate >= selected.from) {
          onSelect?.({ from: selected.from, to: selectedDate });
        } else {
          onSelect?.({ from: selectedDate, to: selected.from });
        }
      }
    } else {
      onSelect?.({ from: selectedDate, to: undefined });
    }
  };

  const isSelected = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    if (!selected?.from) return false;

    if (mode === "range" && selected?.to) {
      return date >= selected.from && date <= selected.to;
    }

    return date.toDateString() === selected.from.toDateString();
  };

  const isToday = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={previousMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {currentMonth.toLocaleString("vi-VN", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div
            key={day}
            className="text-center text-sm text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((day) => (
          <div key={`empty-${day}`} className="h-9 w-9"></div>
        ))}
        {days.map((day) => (
          <Button
            key={day}
            variant="ghost"
            className={cn(
              "h-9 w-9 p-0 font-normal hover:bg-accent",
              isSelected(day) &&
                "bg-primary text-primary-foreground hover:bg-primary",
              isToday(day) &&
                !isSelected(day) &&
                "bg-accent text-accent-foreground",
            )}
            onClick={() => selectDate(day)}
          >
            {day}
          </Button>
        ))}
      </div>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
