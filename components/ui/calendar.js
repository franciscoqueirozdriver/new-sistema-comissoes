"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Esta versão não precisa mais do Popover, pois o estilo padrão não entra em conflito.
// Simplificamos para maior estabilidade.

export function Calendar({
  className,
  classNames, // A propriedade classNames vinda de fora será ignorada
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
        // Adicionamos 'T00:00:00' para evitar problemas de fuso horário
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
      // O OBJETO `classNames` FOI REMOVIDO DAQUI
      month={month}
      onMonthChange={onMonthChange}
      modifiers={modifiers}
      // Esta é a única parte que precisamos para o estilo de pontos
      modifiersClassNames={{
        green: 'rd-day--green',
        red: 'rd-day--red',
        orange: 'rd-day--orange'
      }}
      locale={ptBR}
      {...props}
    />
  );
}
