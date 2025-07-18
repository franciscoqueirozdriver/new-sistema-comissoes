import { getSheetData } from "@/lib/googleSheetsService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export const dynamic = 'force-dynamic';

// --- Funções de Utilidade ---
const parseCurrency = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

const rowsToObjects = (header, rows) => {
  return rows.map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key.toLowerCase().replace(/ /g, '_')] = row[i] || "";
    });
    return obj;
  });
};

// --- Funções de Cálculo (Mantidas do seu código validado) ---
function calculateKpis(pagamentos, oportunidades, ano, mes) {
  let totalReceberMes = 0, totalReceberAno = 0, totalRecebidoAno = 0;
  for (const p of pagamentos) {
    try {
      const dataPrevista = new Date(p.data_prevista + 'T00:00:00');
      if (isNaN(dataPrevista) || dataPrevista.getFullYear() !== ano) continue;
      const valor = parseCurrency(p.valor_liquido_comissao);
      if (String(p.status).toLowerCase() === 'recebido') {
        totalRecebidoAno += valor;
      } else {
        totalReceberAno += valor;
        if (dataPrevista.getMonth() + 1 === mes) {
          totalReceberMes += valor;
        }
      }
    } catch(e) { continue; }
  }
  const oportunidadesGanhas = oportunidades.filter(op => String(op.fase_do_funil).toLowerCase() === 'ganho');
  const vendidosAno = oportunidadesGanhas.filter(op => {
      try { return new Date(op.data_fechamento + 'T00:00:00').getFullYear() === ano; } catch(e) { return false; }
  }).length;
  const vendidosMes = oportunidadesGanhas.filter(op => {
    try {
      const data = new Date(op.data_fechamento + 'T00:00:00');
      return data.getFullYear() === ano && data.getMonth() + 1 === mes;
    } catch(e) { return false; }
  }).length;
  return { totalReceberMes, totalReceberAno, totalRecebidoAno, vendidosMes, vendidosAno };
}

function calculateGraficoMensal(pagamentos, ano) {
    const meses = Array.from({ length: 12 }, () => ({ realizado: 0, previsto: 0 }));
    for (const p of pagamentos) {
      try {
        const dataPagamento = new Date(p.data_prevista + 'T00:00:00');
        if (isNaN(dataPagamento) || dataPagamento.getFullYear() !== ano) continue;
        const valor = parseCurrency(p.valor_liquido_comissao);
        const mesIndex = dataPagamento.getMonth();
        if (String(p.status).toLowerCase() === 'recebido') {
            meses[mesIndex].realizado += valor;
        } else {
            meses[mesIndex].previsto += valor;
        }
      } catch(e) { continue; }
    }
    return meses.map((v, i) => ({ name: `${ano}-${String(i + 1).padStart(2, "0")}`, ...v }));
}

function calculatePizzaFunil(oportunidades, ano) {
    const counts = {};
    for (const op of oportunidades) {
        let fase = String(op.fase_do_funil || "").trim();
        if (!fase) continue;
        try {
            const data = new Date(op.previsao_fechamento + 'T00:00:00');
            if (!isNaN(data) && data.getFullYear() === ano) {
                const nomeFaseFormatado = fase.charAt(0).toUpperCase() + fase.slice(1).toLowerCase();
                counts[nomeFaseFormatado] = (counts[nomeFaseFormatado] || 0) + 1;
            }
        } catch(e) { continue; }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function calculatePizzaFonte(oportunidades, ano) {
    const counts = {};
    for (const op of oportunidades) {
        const fonte = String(op.fonte || "").trim();
        if (!fonte) continue;
        try {
            const data = new Date(op.previsao_fechamento + 'T00:00:00');
            if (!isNaN(data) && data.getFullYear() === ano) {
                counts[fonte] = (counts[fonte] || 0) + 1;
            }
        } catch(e) { continue; }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function calculateEventosCalendario(pagamentos) {
    const eventos = {};
    for (const p of pagamentos) {
        const dataStr = p.data_prevista;
        if (!dataStr) continue;
        const valor = parseCurrency(p.valor_liquido_comissao);
        const status = String(p.status || "").toLowerCase();
        const cor = status === "recebido" ? "green" : "red";
        const valorFormatado = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        const tooltipItem = `${p.empresa}: ${valorFormatado}`;
        if (!eventos[dataStr]) {
            eventos[dataStr] = { color: cor, tooltip: [tooltipItem] };
        } else {
            eventos[dataStr].tooltip.push(tooltipItem);
            if (cor === "red") eventos[dataStr].color = "red";
        }
    }
    return Object.entries(eventos).map(([date, { color, tooltip }]) => ({ date, color, tooltip }));
}

// --- HANDLER DA API COM LÓGICA DE VISÃO DO ADMIN ---
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: "Não autorizado." });
  }

  try {
    const { ano: anoQuery, mes: mesQuery, visao } = req.query; // Pega o novo parâmetro 'visao'
    if (!anoQuery || !mesQuery) return res.status(400).json({ error: "Parâmetros 'ano' e 'mes' são obrigatórios." });
    
    const ano = parseInt(anoQuery, 10);
    const mes = parseInt(mesQuery, 10);

    let [pagamentosData, oportunidadesData] = await Promise.all([
      getSheetData("Pagamentos"),
      getSheetData("Oportunidades"),
    ]);

    let pagamentos = rowsToObjects(pagamentosData.header, pagamentosData.rows);
    let oportunidades = rowsToObjects(oportunidadesData.header, oportunidadesData.rows);

    // --- LÓGICA DE SEGURANÇA ATUALIZADA ---
    // A condição para filtrar agora é: se o usuário NÃO for admin, OU se ele FOR admin mas NÃO estiver pedindo a visão 'todos'.
    if (session.user.role !== 'admin' || visao !== 'todos') {
      const userOportunidades = oportunidades.filter(op => op.user_email === session.user.email);
      const idsPermitidos = new Set(userOportunidades.map(op => op.id));
      const userPagamentos = pagamentos.filter(p => idsPermitidos.has(p.id_oportunidade));
      
      oportunidades = userOportunidades;
      pagamentos = userPagamentos;
    }
    
    // Adiciona o nome da empresa aos pagamentos (após o filtro)
    const empresaPorId = new Map(oportunidades.map(op => [op.id, op.empresa]));
    pagamentos.forEach(p => { p.empresa = empresaPorId.get(p.id_oportunidade) || "Desconhecido"; });

    // As funções de cálculo agora recebem apenas os dados já filtrados
    const kpis = calculateKpis(pagamentos, oportunidades, ano, mes);
    const graficoMensal = calculateGraficoMensal(pagamentos, ano);
    const pizzaFunil = calculatePizzaFunil(oportunidades, ano);
    const pizzaFonte = calculatePizzaFonte(oportunidades, ano);
    const eventosCalendario = calculateEventosCalendario(pagamentos);
    
    res.status(200).json({
      kpis,
      graficoMensal,
      pizzaFunil,
      pizzaFonte,
      eventosCalendario,
    });

  } catch (error) {
    console.error("Erro na API /api/dashboard:", error);
    res.status(500).json({ error: "Erro interno ao processar dados do dashboard.", details: error.message });
  }
}
