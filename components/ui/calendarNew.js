"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Calendar({
  className,
  events = [],
  month,
  onMonthChange,
  ...props
}) {
  const { modifiers } = React.useMemo(() => {
    const modifierMap = {
      green: [],
      red: [],
      orange: [],
    };
    if (events && Array.isArray(events)) {
      events.forEach((event) => {
        const dateObject = new Date(event.date + "T00:00:00");
        if (event.date && !isNaN(dateObject)) {
          if (event.color && modifierMap[event.color]) {
            modifierMap[event.color].push(dateObject);
          }
        }
      });
    }
    return { modifiers: modifierMap };
  }, [events]);

  return (
    <DayPicker
      showOutsideDays={true}
      className={cn("p-3", className)}
      month={month}
      onMonthChange={onMonthChange}
      modifiers={modifiers}
      modifiersClassNames={{
        green: 'rd-day--green',
        red: 'rd-day--red',
        orange: 'rd-day--orange'
      }}
      locale={ptBR}
      
      // --- Propriedades para ativar os menus ---
      captionLayout="dropdown-buttons"
      fromYear={2023}
      toYear={2030}
       components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
