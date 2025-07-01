// components/ui/calendar.js
import { useEffect, useState } from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

export function Calendar() {
  const [pagamentos, setPagamentos] = useState([])

  useEffect(() => {
    fetch("/api/pagamentos-calendario")
      .then(res => res.json())
      .then(data => {
        const formatado = data.map(p => ({
          ...p,
          date: new Date(p.date),
        }))
        setPagamentos(formatado)
      })
  }, [])

  function renderDay(day) {
    const item = pagamentos.find(p => p.date.toDateString() === day.toDateString())
    const title = item?.tooltip?.join("\n") || undefined
    return <div title={title}>{day.getDate()}</div>
  }

  return (
    <DayPicker
      mode="single"
      showOutsideDays
      fixedWeeks
      modifiers={{
        recebido: pagamentos.filter(p => p.color === "green").map(p => p.date),
        previsto: pagamentos.filter(p => p.color === "orange").map(p => p.date),
        vencido: pagamentos.filter(p => p.color === "red").map(p => p.date),
      }}
      modifiersStyles={{
        recebido: { color: "green" },
        previsto: { color: "orange" },
        vencido: { color: "red" },
      }}
      renderDay={renderDay}
    />
  )
}

