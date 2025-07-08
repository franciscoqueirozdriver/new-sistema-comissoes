import { useEffect, useState } from "react"
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
  Legend,
} from "recharts"
import { Calendar } from "@/components/ui/calendar"

export default function Dashboard() {
  const [cards, setCards] = useState({})
  const [grafico, setGrafico] = useState([])
  const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
  const anoAtual = new Date().getFullYear()
  const cores = ["#7C3AED", "#10B981", "#F59E0B", "#3B82F6", "#EF4444"]
  const [pieOportunidade, setPieOportunidade] = useState([])
  const [pieFunil, setPieFunil] = useState([])
  const [anoMesAtual, setAnoMesAtual] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 })

  useEffect(() => {
    fetch("/api/cards").then(res => res.json()).then(setCards)
  }, [])

  useEffect(() => {
    fetch(`/api/dashboard?ano=${anoMesAtual.ano}&mes=${anoMesAtual.mes}`)
      .then(res => res.json())
      .then(data => setCards(prev => ({
        ...prev,
        totalMes: data.totalReceberMes,
        totalAno: data.totalReceberAno,
        totalRecebido: data.totalRecebidoAno,
        vendidosMes: data.vendidosMes,
        vendidosAno: data.vendidosAno
      })))

    fetch(`/api/grafico-mensal?ano=${anoMesAtual.ano}`)
      .then(res => res.json())
      .then(setGrafico)

    fetch(`/api/pizza-fonte?ano=${anoMesAtual.ano}&mes=${anoMesAtual.mes}`)
      .then(res => res.json())
      .then(data => setPieOportunidade(Array.isArray(data) ? data : []))

    fetch(`/api/pizza-funil?ano=${anoMesAtual.ano}&mes=${anoMesAtual.mes}`)
      .then(res => res.json())
      .then(data => setPieFunil(Array.isArray(data) ? data : []))
  }, [anoMesAtual])

  const dadosPorMes = Array.from({ length: 12 }, (_, i) => {
    const mes = `${anoMesAtual.ano}-${(i + 1).toString().padStart(2, '0')}`
    const entrada = grafico.find(d => d.name === mes) || {}

    return {
      name: meses[i],
      realizado: entrada.realizado || 0,
      previsto: entrada.previsto || 0,
    }
  })

  const formatarMoeda = valor => (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-48 bg-violet-950 text-white p-4 space-y-6">
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

        <div className="grid grid-cols-5 gap-4">
          <Card><CardContent className="p-4">A Receber no mês<br /><strong>{formatarMoeda(cards.totalMes)}</strong></CardContent></Card>
          <Card><CardContent className="p-4">A Receber no ano<br /><strong>{formatarMoeda(cards.totalAno)}</strong></CardContent></Card>
          <Card><CardContent className="p-4">Recebido no ano<br /><strong>{formatarMoeda(cards.totalRecebido)}</strong></CardContent></Card>
          <Card><CardContent className="p-4">Contratos Mês<br /><strong>{cards.vendidosMes || 0}</strong></CardContent></Card>
          <Card><CardContent className="p-4">Contratos Ano<br /><strong>{cards.vendidosAno || 0}</strong></CardContent></Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <CardContent className="pb-2">
              <h2 className="font-bold text-sm mb-2">Realizado x Previsto (Mensal)</h2>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosPorMes}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="realizado" fill="#8b5cf6" />
                    <Bar dataKey="previsto" fill="#d1d5db" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <div className="flex gap-4 px-4 pb-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  <Pie
                    data={pieOportunidade}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={50}
                    innerRadius={30}
                  >
                    {Array.isArray(pieOportunidade) && pieOportunidade.map((entry, index) => (
                      <Cell key={`cell-o-${index}`} fill={cores[index % cores.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  <Pie
                    data={pieFunil}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={50}
                    innerRadius={30}
                  >
                    {Array.isArray(pieFunil) && pieFunil.map((entry, index) => (
                      <Cell key={`cell-f-${index}`} fill={cores[index % cores.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold">Calendário de Pagamentos</h2>
              <Calendar onMonthChange={(ano, mes) => setAnoMesAtual({ ano, mes })} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

