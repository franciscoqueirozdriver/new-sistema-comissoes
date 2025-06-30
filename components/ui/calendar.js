"use client"

import { useState } from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

export function Calendar() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="rounded-lg border shadow bg-white w-full max-w-[280px] overflow-hidden">
      <div className="p-4">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={setSelected}
          className="text-sm"
          classNames={{
            caption: "flex justify-start", // alinhamento do mês
          }}
        />
        {selected && (
          <p className="mt-2 text-gray-600 text-center text-sm">
            Data selecionada:{" "}
            <strong>{selected.toLocaleDateString("pt-BR")}</strong>
          </p>
        )}
      </div>
    </div>
  )
}
