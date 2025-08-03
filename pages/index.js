"use client";
import { useEffect, useState, useMemo } from "react";
import { parseISO, format as formatDate } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Calendar } from "@/components/ui/calendarNew"; // Verifique se o nome do arquivo é 'calendarNew' ou 'calendar'
import { useSession } from "next-auth/react";

const MESES_ABREVIADOS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const CORES_GRAFICO = ["#8B5CF6", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#EC4899", "#6366F1"];
const formatarMoeda = (valor) => (valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  
    const handleDataInputChange = (e) => {
    const valor = e.target.value;
    try {
      const novaData = parseISO(valor);
      if (!isNaN(novaData)) {
        setDisplayedMonth(novaData);
      }
    } catch (_) {
      // ignore invalid date
    }
  };


  // --- NOVO ESTADO PARA O FILTRO DE VISÃO ---
  const [visao, setVisao] = useState('propria'); // 'propria' ou 'todos'

  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.status === 'aprovado') {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const ano = displayedMonth.getFullYear();
          const mes = displayedMonth.getMonth() + 1;
          
          // Adiciona o parâmetro de visão à chamada da API se necessário
          const params = new URLSearchParams({ ano, mes });
          if (session.user.role === 'admin' && visao === 'todos') {
            params.append('visao', 'todos');
          }

          const response = await fetch(`/api/dashboard?${params.toString()}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Falha ao carregar os dados.");
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
    } else if (sessionStatus !== "loading") {
      setLoading(false);
    }
  }, [displayedMonth, session, sessionStatus, visao]); // Adiciona 'visao' às dependências

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

  if (sessionStatus === "loading" || (loading && sessionStatus === "authenticated")) {
    return <div className="p-6 text-center">Carregando...</div>;
  }
  
  if (sessionStatus === "unauthenticated") {
    return <div className="p-6 text-center">Por favor, faça o login para ver o dashboard.</div>;
  }

  if (session?.user?.status === 'pendente') {
    return <div className="p-6 text-center">Sua conta está pendente de aprovação pelo administrador.</div>;
  }
  
  if (error) {
    return <div className="p-6 text-center text-red-500">Erro ao carregar dados: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="p-6 text-center">Nenhum dado para exibir.</div>;
  }

  const { kpis, graficoMensal, pizzaFunil, pizzaFonte, eventosCalendario } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard {anoAtual}</h1>
        
        {/* --- SELETOR DE VISÃO PARA ADMINS --- */}
        {session?.user?.role === 'admin' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Visão:</label>
            <select
              value={visao}
              onChange={(e) => setVisao(e.target.value)}
              className="p-2 border rounded bg-white"
            >
              <option value="propria">Meus Dados</option>
              <option value="todos">Todos os Dados</option>
            </select>
          </div>
        )}
      </div>
      
      {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card><CardContent className="p-4">A Receber no mês<br /><strong className="text-xl">{formatarMoeda(kpis.totalReceberMes)}</strong></CardContent></Card>
            <Card><CardContent className="p-4">A Receber no ano<br /><strong className="text-xl">{formatarMoeda(kpis.totalReceberAno)}</strong></CardContent></Card>
            <Card><CardContent className="p-4">Recebido no ano<br /><strong className="text-xl">{formatarMoeda(kpis.totalRecebidoAno)}</strong></CardContent></Card>
            <Card><CardContent className="p-4">Contratos Mês<br /><strong className="text-xl">{kpis.vendidosMes || 0}</strong></CardContent></Card>
            <Card><CardContent className="p-4">Contratos Ano<br /><strong className="text-xl">{kpis.vendidosAno || 0}</strong></CardContent></Card>
          </div>
      )}

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
                <div className="mb-2">
                  <input
                    type="date"
                    className="p-1 border rounded"
                    value={formatDate(displayedMonth, 'yyyy-MM-dd')}
                    onChange={handleDataInputChange}
                  />
                </div>                
                
                <Calendar
                    month={displayedMonth}
                    onMonthChange={setDisplayedMonth}
                    events={eventosCalendario || []}
                />
            </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold text-sm mb-2">Funil de Vendas ({anoAtual})</h2>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Tooltip />
                  <Pie data={pizzaFunil || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                    {(pizzaFunil || []).map((entry, index) => (
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
                  <Pie data={pizzaFonte || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                    {(pizzaFonte || []).map((entry, index) => (
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
