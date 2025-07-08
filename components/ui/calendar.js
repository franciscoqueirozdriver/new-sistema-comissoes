"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { addDays, format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function CustomCaption({ displayMonth, onPrevClick, onNextClick }) {
  return (
    <div className="flex justify-between items-center px-2 py-2">
      <button
        onClick={() => onPrevClick()}
        className={buttonVariants({ variant: "ghost" })}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium">
        {format(displayMonth, "MMMM yyyy", { locale: ptBR })}
      </span>
      <button
        onClick={() => onNextClick()}
        className={buttonVariants({ variant: "ghost" })}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onSelect,
  onMonthChange,
  events = [],
  ...props
}) {
  const [hoveredDay, setHoveredDay] = React.useState(null);
  const tooltips = {};

  events.forEach((event) => {
    tooltips[event.date] = event.tooltip;
  });

  return (
    <div className="relative">
      <DayPicker
        fromYear={2024}
        toYear={2026}
        showOutsideDays={showOutsideDays}
        selected={selected}
        onSelect={onSelect}
        locale={ptBR}
        modifiers={{
          ...events.reduce(
            (acc, curr) => ({
              ...acc,
              [curr.color]: (date) =>
                format(date, "yyyy-MM-dd") === curr.date,
            }),
            {}
          ),
        }}
        modifiersClassNames={{
          green: "bg-green-200 text-green-800",
          red: "bg-red-200 text-red-800",
          orange: "bg-orange-200 text-orange-800",
        }}
        onDayMouseEnter={(day) => setHoveredDay(format(day, "yyyy-MM-dd"))}
        onDayMouseLeave={() => setHoveredDay(null)}
        onMonthChange={(date) => {
          const ano = date.getFullYear();
          const mes = date.getMonth() + 1;
          if (onMonthChange) onMonthChange(ano, mes);
        }}
        components={{
          Caption: CustomCaption,
        }}
        className={cn("p-3", className)}
        classNames={{
          ...classNames,
          day_selected: "bg-blue-500 text-white",
          day_today: "border border-blue-500",
        }}
        {...props}
      />
      {hoveredDay && tooltips[hoveredDay] && (
        <div className="absolute z-10 mt-2 p-2 text-sm bg-white border rounded shadow-lg max-w-sm">
          {tooltips[hoveredDay].map((text, index) => (
            <div key={index}>{text}</div>
          ))}
        </div>
      )}
    </div>
  );
}

