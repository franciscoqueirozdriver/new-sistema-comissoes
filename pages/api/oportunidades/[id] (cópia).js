import { getSheetData, updateSheet } from "@/lib/googleSheetsService";
import { gerarPagamentos } from "@/lib/financeiroService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export const dynamic = 'force-dynamic';

const ABA_OPORTUNIDADES = "Oportunidades";
const ABA_PAGAMENTOS = "Pagamentos";

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
        dadosAtualizados.user_email = oportunidadeRow[userEmailIndex];
        
        const rowIndexToUpdate = oppRows.findIndex(row => String(row[idIndex]) === String(id));
        const linhaAtualizadaArray = oppHeader.map(colName => dadosAtualizados[colName] || "");
        
        const novasLinhasOp = [...oppRows];
        novasLinhasOp[rowIndexToUpdate] = linhaAtualizadaArray;
        
        const pagamentosData = await getSheetData(ABA_PAGAMENTOS);
        const pagamentosRestantes = pagamentosData.rows.filter(row => String(row[pagamentosData.header.indexOf("id_oportunidade")]) !== String(id));
        const novosPagamentos = gerarPagamentos(id, dadosAtualizados);
        
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

