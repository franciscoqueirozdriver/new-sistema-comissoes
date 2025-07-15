import { getSheetData } from "@/lib/googleSheetsService";

export const dynamic = 'force-dynamic'; // <-- LINHA ADICIONADA

// --- Funções de Cálculo (Lógica de Negócio Isolada) ---

const parseCurrency = (value) => parseFloat(String(value || "0").replace(/\./g, "").replace(",", "."));

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

  const oportunidadesGanhas = oportunidadesRows.filter(row => String(row[idxFaseFunil]).toLowerCase() === 'ganho');
  const vendidosAno = oportunidadesGanhas.filter(row => new Date(row[idxDataFechamento] + 'T00:00:00').getFullYear() === ano).length;
  const vendidosMes = oportunidadesGanhas.filter(row => {
    const dataFechamento = new Date(row[idxDataFechamento] + 'T00:00:00');
    return dataFechamento.getFullYear() === ano && dataFechamento.getMonth() + 1 === mes;
  }).length;
  
  return { totalReceberMes, totalReceberAno, totalRecebidoAno, vendidosMes, vendidosAno };
}

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

function calculatePizzaFunil(oportunidadesData, ano) {
    const { header, rows } = oportunidadesData;
    const counts = {};
    const idxFase = header.indexOf('fase_do_funil');
    const idxPrevisao = header.indexOf('previsao_fechamento');
    for (const row of rows) {
        let fase = String(row[idxFase] || "").trim();
        if (!fase) continue;
        const dataStr = String(row[idxPrevisao] || "");
        if (!dataStr) continue;
        const data = new Date(dataStr + 'T00:00:00');
        if (!isNaN(data) && data.getFullYear() === ano) {
            const nomeFaseFormatado = fase.charAt(0).toUpperCase() + fase.slice(1).toLowerCase();
            counts[nomeFaseFormatado] = (counts[nomeFaseFormatado] || 0) + 1;
        }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function calculatePizzaFonte(oportunidadesData, ano) {
    const { header, rows } = oportunidadesData;
    const counts = {};
    const idxFonte = header.indexOf('fonte');
    const idxPrevisao = header.indexOf('previsao_fechamento');
    for (const row of rows) {
        const fonte = String(row[idxFonte] || "").trim();
        if (!fonte) continue;
        const dataStr = String(row[idxPrevisao] || "");
        if (!dataStr) continue;
        const data = new Date(dataStr + 'T00:00:00');
        if (!isNaN(data) && data.getFullYear() === ano) {
            counts[fonte] = (counts[fonte] || 0) + 1;
        }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function calculateEventosCalendario(pagamentosData, oportunidadesData) {
    const { header: pagHeader, rows: pagRows } = pagamentosData;
    const { header: oppHeader, rows: oppRows } = oportunidadesData;
    const empresaPorId = new Map(oppRows.map(row => [row[oppHeader.indexOf('id')], row[oppHeader.indexOf('empresa')]]));
    const eventos = {};
    const idxOppId = pagHeader.indexOf('id_oportunidade');
    const idxData = pagHeader.indexOf('data_prevista');
    const idxValor = pagHeader.indexOf('valor_liquido_comissao');
    const idxStatus = pagHeader.indexOf('status');
    for (const row of pagRows) {
        const dataStr = row[idxData];
        if (!dataStr) continue;
        const data = dataStr.split("T")[0];
        const nomeEmpresa = empresaPorId.get(row[idxOppId]) || "Desconhecido";
        const valor = parseCurrency(row[idxValor]);
        const status = String(row[idxStatus] || "").toLowerCase();
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

    const [pagamentosData, oportunidadesData] = await Promise.all([
      getSheetData("Pagamentos"),
      getSheetData("Oportunidades"),
    ]);

    const kpis = calculateKpis(pagamentosData, oportunidadesData, ano, mes);
    const graficoMensal = calculateGraficoMensal(pagamentosData, ano);
    const pizzaFunil = calculatePizzaFunil(oportunidadesData, ano);
    const pizzaFonte = calculatePizzaFonte(oportunidadesData, ano);
    const eventosCalendario = calculateEventosCalendario(pagamentosData, oportunidadesData);
    
    res.status(200).json({
      kpis,
      graficoMensal,
      pizzaFunil,
      pizzaFonte,
      eventosCalendario,
    });
  } catch (error) {
    console.error("Erro na API /api/dashboard:", error);
    res.status(500).json({ error: "Erro interno ao processar os dados do dashboard.", details: error.message });
  }
}
