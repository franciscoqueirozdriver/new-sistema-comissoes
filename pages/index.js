// /pages/index.js (Versão Final com Todos os Gráficos)

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Calendar } from "@/components/ui/calendarNew";

const MESES_ABREVIADOS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const CORES_GRAFICO = ["#8B5CF6", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#EC4899", "#6366F1"];

const formatarMoeda = (valor) => (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayedMonth, setDisplayedMonth] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const ano = displayedMonth.getFullYear();
        const mes = displayedMonth.getMonth() + 1;

        const response = await fetch(`/api/dashboard?ano=${ano}&mes=${mes}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao carregar os dados do dashboard.");
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [displayedMonth]);

  const anoAtual = displayedMonth.getFullYear();

  const dadosGraficoBarras = useMemo(() => {
    if (!dashboardData?.graficoMensal) return [];
    return MESES_ABREVIADOS.map((mesNome, i) => {
      const mesRef = `${anoAtual}-${String(i + 1).padStart(2, '0')}`;
      const entradaDoMes = dashboardData.graficoMensal.find(d => d.name === mesRef) || {};
      return {
        name: mesNome,
        realizado: entradaDoMes.realizado || 0,
        previsto: entradaDoMes.previsto || 0,
      };
    });
  }, [dashboardData, anoAtual]);

  if (loading) return <div className="p-6 text-center">Carregando dashboard...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Erro ao carregar: {error}</div>;
  if (!dashboardData) return <div className="p-6 text-center">Nenhum dado encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard {anoAtual}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4">A Receber no mês<br /><strong className="text-xl">{formatarMoeda(dashboardData.kpis.totalReceberMes)}</strong></CardContent></Card>
        <Card><CardContent className="p-4">A Receber no ano<br /><strong className="text-xl">{formatarMoeda(dashboardData.kpis.totalReceberAno)}</strong></CardContent></Card>
        <Card><CardContent className="p-4">Recebido no ano<br /><strong className="text-xl">{formatarMoeda(dashboardData.kpis.totalRecebidoAno)}</strong></CardContent></Card>
        <Card><CardContent className="p-4">Contratos Mês<br /><strong className="text-xl">{dashboardData.kpis.vendidosMes || 0}</strong></CardContent></Card>
        <Card><CardContent className="p-4">Contratos Ano<br /><strong className="text-xl">{dashboardData.kpis.vendidosAno || 0}</strong></CardContent></Card>
      </div>

      {/* --- SEÇÃO DO GRÁFICO DE BARRAS E CALENDÁRIO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <h2 className="font-bold text-lg mb-2">Realizado x Previsto ({anoAtual})</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosGraficoBarras}>
                <YAxis tickFormatter={(value) => `${value/1000}k`} />
                <XAxis dataKey="name" />
                <Tooltip formatter={(value) => formatarMoeda(value)} />
                <Legend />
                <Bar dataKey="realizado" fill="#10B981" name="Realizado" />
                <Bar dataKey="previsto" fill="#A8A29E" name="Previsto" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg">Calendário de Pagamentos</h2>
              <Calendar
                month={displayedMonth}
                onMonthChange={setDisplayedMonth}
                events={dashboardData.eventosCalendario}
              />
            </CardContent>
        </Card>
      </div>

      {/* --- SEÇÃO DOS GRÁFICOS DE ROSCA (PIZZA) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold text-sm mb-2">Funil de Vendas ({anoAtual})</h2>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Tooltip />
                  <Pie data={dashboardData.pizzaFunil} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                    {dashboardData.pizzaFunil.map((entry, index) => (
                      <Cell key={`cell-funil-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
           <CardContent className="p-4">
            <h2 className="font-bold text-sm mb-2">Fontes de Oportunidades ({anoAtual})</h2>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Tooltip />
                  <Pie data={dashboardData.pizzaFonte} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                    {dashboardData.pizzaFonte.map((entry, index) => (
                      <Cell key={`cell-fonte-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
