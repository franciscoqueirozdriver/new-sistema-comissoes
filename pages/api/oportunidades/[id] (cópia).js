// /pages/api/oportunidades/[id].js

import { getSheetData, updateSheet } from "@/lib/googleSheetsService";
import { gerarPagamentos } from "@/lib/financeiroService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export const dynamic = 'force-dynamic';

const ABA_OPORTUNIDADES = "Oportunidades";
const ABA_PAGAMENTOS = "Pagamentos";

function parseCurrency(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor || typeof valor !== 'string') return 0;
  const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(numeroLimpo) || 0;
}

function parsePercentage(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor || typeof valor !== 'string') return 0;
  const numeroLimpo = String(valor).replace(',', '.');
  return parseFloat(numeroLimpo) || 0;
}

function formatForSheet(num) {
  return String(Number(num).toFixed(2)).replace('.', ',');
}

function pagamentosToRows(idOportunidade, pagamentos, dadosOportunidade) {
  const percImp = parsePercentage(dadosOportunidade.percentual_imposto);
  const percCom = parsePercentage(dadosOportunidade.comissao);
  const userEmail = dadosOportunidade.user_email || '';

  let nextId = Date.now();
  const contadores = {};

  return pagamentos.map(p => {
    const val = parseCurrency(p.valor_bruto);
    const liquido = val * percCom * (1 - percImp);
    const tipo = p.tipo;
    if (!contadores[tipo]) contadores[tipo] = 1;
    const numParcela = contadores[tipo]++;

    return [
      String(nextId++),
      idOportunidade,
      tipo,
      String(numParcela),
      formatForSheet(val),
      formatForSheet(percImp),
      formatForSheet(liquido),
      p.data_prevista,
      p.data_recebida || '',
      p.status || 'Previsto',
      userEmail
    ];
  });
}


export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id } = req.query;

  try {
    const { header: oppHeader, rows: oppRows } = await getSheetData(ABA_OPORTUNIDADES);
    const idIndex = oppHeader.indexOf("id");
    const userEmailIndex = oppHeader.indexOf("user_email");
    const oportunidadeRow = oppRows.find(row => String(row[idIndex]) === String(id));

    if (!oportunidadeRow) {
      return res.status(404).json({ error: `Oportunidade com ID ${id} não encontrada.` });
    }
    if (session.user.role !== 'admin' && oportunidadeRow[userEmailIndex] !== session.user.email) {
      return res.status(403).json({ error: "Você não tem permissão para acessar este recurso." });
    }

    switch (req.method) {
      case "GET": {
        const oportunidade = {};
        oppHeader.forEach((key, i) => {
          oportunidade[key] = oportunidadeRow[i] || "";
        });
        return res.status(200).json(oportunidade);
      }

      case "PUT": {
        const dadosAtualizados = req.body;
        
                const pagamentosCustom = dadosAtualizados.pagamentos || null;
        delete dadosAtualizados.pagamentos;
        
        dadosAtualizados.user_email = oportunidadeRow[userEmailIndex];
        
        const rowIndexToUpdate = oppRows.findIndex(row => String(row[idIndex]) === String(id));
        const linhaAtualizadaArray = oppHeader.map(colName => dadosAtualizados[colName] || "");
        
        const novasLinhasOp = [...oppRows];
        novasLinhasOp[rowIndexToUpdate] = linhaAtualizadaArray;
        
        const pagamentosData = await getSheetData(ABA_PAGAMENTOS);
        const pagamentosRestantes = pagamentosData.rows.filter(row => String(row[pagamentosData.header.indexOf("id_oportunidade")]) !== String(id));
       

        const novosPagamentos = pagamentosCustom
          ? pagamentosToRows(id, pagamentosCustom, dadosAtualizados)
          : gerarPagamentos(id, dadosAtualizados);        
        
        await Promise.all([
            updateSheet(ABA_OPORTUNIDADES, [oppHeader, ...novasLinhasOp]),
            updateSheet(ABA_PAGAMENTOS, [pagamentosData.header, ...pagamentosRestantes, ...novosPagamentos])
        ]);
        
        return res.status(200).json({ success: true, id: id });
      }

      case "DELETE": {
        const pagamentosData = await getSheetData(ABA_PAGAMENTOS);
        const idPagIndex = pagamentosData.header.indexOf("id_oportunidade");
        const oportunidadesRestantes = oppRows.filter(row => String(row[idIndex]) !== String(id));
        const pagamentosRestantes = pagamentosData.rows.filter(row => String(row[idPagIndex]) !== String(id));

        await Promise.all([
            updateSheet(ABA_OPORTUNIDADES, [oppHeader, ...oportunidadesRestantes]),
            updateSheet(ABA_PAGAMENTOS, [pagamentosData.header, ...pagamentosRestantes])
        ]);

        return res.status(200).json({ success: true, message: `Oportunidade ${id} e seus pagamentos foram excluídos.` });
      }

      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error(`Erro na API /api/oportunidades/${id}:`, error);
    res.status(500).json({ error: "Erro ao processar a requisição." });
  }
}

