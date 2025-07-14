// /pages/api/dashboard.js (Versão final consolidada)

import { getSheetData } from "@/lib/googleSheetsService";

// --- Funções de Cálculo (Lógica de Negócio Isolada) ---

/**
 * Converte uma string de moeda no formato "1.234,56" para um número.
 */
const parseCurrency = (value) => parseFloat(String(value || "0").replace(/\./g, "").replace(",", "."));

/**
 * Calcula os KPIs principais para os cards do dashboard.
 */
function calculateKpis(pagamentosData, oportunidadesData, ano, mes) {
  const { header: pagamentosHeader, rows: pagamentosRows } = pagamentosData;
  const { header: oportunidadesHeader, rows: oportunidadesRows } = oportunidadesData;

  const idxDataPrevista = pagamentosHeader.indexOf('data_prevista');
  const idxStatus = pagamentosHeader.indexOf('status');
  const idxValor = pagamentosHeader.indexOf('valor_liquido_comissao');
  const idxDataFechamento = oportunidadesHeader.indexOf('data_fechamento');
  const idxFaseFunil = oportunidadesHeader.indexOf('fase_do_funil');
  
  let totalReceberMes = 0;
  let totalReceberAno = 0;
  let totalRecebidoAno = 0;

  // Calcula totais de pagamentos
  for (const row of pagamentosRows) {
    const dataPrevistaStr = row[idxDataPrevista];
    if (!dataPrevistaStr) continue;

    const dataPrevista = new Date(dataPrevistaStr + 'T00:00:00');
    if (isNaN(dataPrevista) || dataPrevista.getFullYear() !== ano) continue;

    const status = String(row[idxStatus] || "").toLowerCase();
    const valor = parseCurrency(row[idxValor]);

    if (status === 'recebido') {
      totalRecebidoAno += valor;
    } else {
      totalReceberAno += valor;
      if (dataPrevista.getMonth() + 1 === mes) {
        totalReceberMes += valor;
      }
    }
  }

  // Calcula totais de vendas
  const oportunidadesGanhas = oportunidadesRows.filter(row => String(row[idxFaseFunil]).toLowerCase() === 'ganho');
  
  const vendidosAno = oportunidadesGanhas.filter(row => {
    const dataFechamento = new Date(row[idxDataFechamento] + 'T00:00:00');
    return !isNaN(dataFechamento) && dataFechamento.getFullYear() === ano;
  }).length;

  const vendidosMes = oportunidadesGanhas.filter(row => {
    const dataFechamento = new Date(row[idxDataFechamento] + 'T00:00:00');
    return !isNaN(dataFechamento) && dataFechamento.getFullYear() === ano && dataFechamento.getMonth() + 1 === mes;
  }).length;
  
  return { totalReceberMes, totalReceberAno, totalRecebidoAno, vendidosMes, vendidosAno };
}

/**
 * Prepara os dados agregados por mês para o gráfico de barras.
 */
function calculateGraficoMensal(pagamentosData, ano) {
  const { header, rows } = pagamentosData;
  const meses = Array.from({ length: 12 }, () => ({ realizado: 0, previsto: 0 }));
  
  const idxDataPrevista = header.indexOf('data_prevista');
  const idxStatus = header.indexOf('status');
  const idxValor = header.indexOf('valor_liquido_comissao');

  for (const row of rows) {
    const dataPagamentoStr = row[idxDataPrevista];
    if (!dataPagamentoStr) continue;

    const dataPagamento = new Date(dataPagamentoStr + 'T00:00:00');
    if (isNaN(dataPagamento) || dataPagamento.getFullYear() !== ano) continue;
    
    const status = String(row[idxStatus] || "").toLowerCase();
    const valor = parseCurrency(row[idxValor]);
    const mesIndex = dataPagamento.getMonth();

    if (status === 'recebido') {
      meses[mesIndex].realizado += valor;
    } else {
      meses[mesIndex].previsto += valor;
    }
  }
  return meses.map((v, i) => ({ name: `${ano}-${String(i + 1).padStart(2, "0")}`, ...v }));
}

/**
 * Prepara os dados para o gráfico de pizza do funil de vendas.
 */
function calculatePizzaFunil(oportunidadesData, ano) {
    const { header, rows } = oportunidadesData;
    const counts = {};

    const idxFase = header.indexOf('fase_do_funil');
    const idxPrevisao = header.indexOf('previsao_fechamento');

    for (const row of rows) {
        const fase = String(row[idxFase] || "").trim();
        if (!fase) continue;

        const dataStr = String(row[idxPrevisao] || "");
        if (!dataStr) continue;

        const data = new Date(dataStr + 'T00:00:00');
        if (!isNaN(data) && data.getFullYear() === ano) {
            counts[fase] = (counts[fase] || 0) + 1;
        }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

/**
 * Prepara os eventos para o calendário.
 */
function calculateEventosCalendario(pagamentosData, oportunidadesData) {
    const { header: pagHeader, rows: pagRows } = pagamentosData;
    const { header: oppHeader, rows: oppRows } = oportunidadesData;

    const idxOppIdHeader = oppHeader.indexOf('id');
    const idxEmpresaHeader = oppHeader.indexOf('empresa');
    const empresaPorId = new Map(oppRows.map(row => [row[idxOppIdHeader], row[idxEmpresaHeader]]));
    
    const eventos = {};

    const idxOppIdPag = pagHeader.indexOf('id_oportunidade');
    const idxDataPag = pagHeader.indexOf('data_prevista');
    const idxValorPag = pagHeader.indexOf('valor_liquido_comissao');
    const idxStatusPag = pagHeader.indexOf('status');

    for (const row of pagRows) {
        const dataStr = row[idxDataPag];
        if (!dataStr) continue;

        const data = dataStr.split("T")[0];
        const nomeEmpresa = empresaPorId.get(row[idxOppIdPag]) || "Desconhecido";
        const valor = parseCurrency(row[idxValorPag]);
        const status = String(row[idxStatusPag] || "").toLowerCase();
        
        const cor = status === "recebido" ? "green" : "red";
        const valorFormatado = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const tooltipItem = `${nomeEmpresa}: ${valorFormatado}`;

        if (!eventos[data]) {
            eventos[data] = { color: cor, tooltip: [tooltipItem] };
        } else {
            eventos[data].tooltip.push(tooltipItem);
            if (cor === "red") eventos[data].color = "red";
        }
    }
    return Object.entries(eventos).map(([date, { color, tooltip }]) => ({ date, color, tooltip }));
}

// --- Handler Principal da API ---
export default async function handler(req, res) {
  try {
    const { ano: anoQuery, mes: mesQuery } = req.query;
    if (!anoQuery || !mesQuery) {
      return res.status(400).json({ error: "Parâmetros 'ano' e 'mes' são obrigatórios." });
    }

    const ano = parseInt(anoQuery, 10);
    const mes = parseInt(mesQuery, 10);

    // 1. Busca todos os dados necessários de uma só vez, usando nosso serviço
    const [pagamentosData, oportunidadesData] = await Promise.all([
      getSheetData("Pagamentos"),
      getSheetData("Oportunidades"),
    ]);

    // 2. Executa as funções de cálculo com os dados já em memória
    const kpis = calculateKpis(pagamentosData, oportunidadesData, ano, mes);
    const graficoMensal = calculateGraficoMensal(pagamentosData, ano);
    const pizzaFunil = calculatePizzaFunil(oportunidadesData, ano);
    const eventosCalendario = calculateEventosCalendario(pagamentosData, oportunidadesData);
    
    // 3. Retorna um único objeto JSON com todos os dados que o frontend precisa
    res.status(200).json({
      kpis,
      graficoMensal,
      pizzaFunil,
      eventosCalendario,
    });

  } catch (error) {
    console.error("Erro na API /api/dashboard:", error);
    res.status(500).json({ error: "Erro interno ao processar os dados do dashboard.", details: error.message });
  }
}
