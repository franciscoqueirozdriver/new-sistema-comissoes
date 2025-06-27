import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calendar } from "@/components/ui/calendar"

export default function Dashboard() {
  const data = [
    { name: "Jan", realizado: 20, previsto: 30 },
    { name: "Feb", realizado: 25, previsto: 30 },
    { name: "Mar", realizado: 30, previsto: 35 },
    { name: "Apr", realizado: 32, previsto: 36 },
    { name: "May", realizado: 38, previsto: 40 },
    { name: "Jun", realizado: 40, previsto: 42 },
    { name: "Jul", realizado: 41, previsto: 45 },
    { name: "Aug", realizado: 43, previsto: 46 },
    { name: "Sep", realizado: 45, previsto: 48 },
    { name: "Oct", realizado: 47, previsto: 50 },
    { name: "Nov", realizado: 49, previsto: 52 },
    { name: "Dec", realizado: 50, previsto: 55 },
  ]

  const pieOportunidade = [
    { name: "Indicação", value: 35 },
    { name: "Orgânico", value: 20 },
    { name: "Mídia Paga", value: 20 },
    { name: "Outros", value: 25 },
  ]

  const pieFunil = [
    { name: "Realizado", value: 50 },
    { name: "Qualificação", value: 25 },
    { name: "Negociação", value: 25 },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-violet-950 text-white p-4 space-y-6">
        <h2 className="text-xl font-bold">Sistema de Comissões</h2>
        <nav className="flex flex-col gap-4">
          <button className="text-left hover:text-violet-400">Dashboard</button>
          <button className="text-left">Oportunidades</button>
          <button className="text-left">Pagamentos</button>
          <button className="text-left">Despesas</button>
          <button className="text-left">Outras Receitas</button>
          <button className="text-left">Configurações</button>
        </nav>
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Sistema de Comissões</h1>

        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div>Total a Receber<br /><strong>€ 35.000</strong></div></CardContent></Card>
          <Card><CardContent className="p-4"><div>Total Pago<br /><strong>€ 24.000</strong></div></CardContent></Card>
          <Card><CardContent className="p-4"><div>Despesas<br /><strong>€ 12.300</strong></div></CardContent></Card>
          <Card><CardContent className="p-4"><div>Outras Receitas<br /><strong>$ 3.200</strong></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <CardContent className="pb-2">
              <h2 className="font-bold text-sm mb-2">Realizado x Previsto (Mensal)</h2>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="realizado" fill="#8b5cf6" />
                    <Bar dataKey="previsto" fill="#d1d5db" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">Calendário de Pagamentos</h2>
              <Calendar mode="single" selected={new Date()} className="rounded-md border mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">Fontes de Oportunidade</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieOportunidade} dataKey="value" nameKey="name" outerRadius={70} label>
                    {pieOportunidade.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#7C3AED", "#A78BFA", "#C4B5FD", "#DDD6FE"][index % 4]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">Fases do Funil</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieFunil} dataKey="value" nameKey="name" outerRadius={70} label>
                    {pieFunil.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#7C3AED", "#A78BFA", "#C4B5FD"][index % 3]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

