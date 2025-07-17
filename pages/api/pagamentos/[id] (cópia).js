import { getSheetData, updateSheet } from "@/lib/googleSheetsService";
import { getServerSession } from "next-auth/next";
// --- CAMINHO CORRIGIDO AQUI ---
import { authOptions } from "../auth/[...nextauth]"; 

export const dynamic = 'force-dynamic';

const ABA_PAGAMENTOS = "Pagamentos";
const ABA_OPORTUNIDADES = "Oportunidades";

// Função para converter linhas da planilha em objetos
const rowsToObjects = (header, rows) => {
    return rows.map((row) => {
        const obj = {};
        header.forEach((key, i) => {
            obj[key.toLowerCase().replace(/ /g, '_')] = row[i] || "";
        });
        return obj;
    });
};


export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: idPagamento } = req.query;

  try {
    // --- VERIFICAÇÃO DE PERMISSÃO ---
    if (session.user.role !== 'admin') {
        const [pagamentosData, oportunidadesData] = await Promise.all([
            getSheetData(ABA_PAGAMENTOS),
            getSheetData(ABA_OPORTUNIDADES)
        ]);
        
        const pagamentos = rowsToObjects(pagamentosData.header, pagamentosData.rows);
        const oportunidades = rowsToObjects(oportunidadesData.header, oportunidadesData.rows);

        const pagamentoParaEditar = pagamentos.find(p => p.id_pagamento === idPagamento);
        if (!pagamentoParaEditar) {
            return res.status(404).json({ error: `Pagamento com ID ${idPagamento} não encontrado.` });
        }

        const oportunidadeDona = oportunidades.find(op => op.id === pagamentoParaEditar.id_oportunidade);
        if (!oportunidadeDona || oportunidadeDona.user_email !== session.user.email) {
            return res.status(403).json({ error: "Você não tem permissão para editar este pagamento." });
        }
    }
    // --- FIM DA VERIFICAÇÃO DE PERMISSÃO ---


    switch (req.method) {
      case "PUT": {
        const dadosAtualizados = req.body;
        const { header, rows } = await getSheetData(ABA_PAGAMENTOS);
        
        const idPagamentoIndex = header.indexOf("id_pagamento");
        if (idPagamentoIndex === -1) {
          throw new Error("A coluna 'id_pagamento' não foi encontrada na planilha de Pagamentos.");
        }

        let pagamentoEncontrado = false;
        const novasLinhas = rows.map(row => {
          if (String(row[idPagamentoIndex]) === String(idPagamento)) {
            pagamentoEncontrado = true;
            return header.map(colName => dadosAtualizados[colName] || "");
          }
          return row;
        });

        if (!pagamentoEncontrado) {
          return res.status(404).json({ error: `Pagamento com ID ${idPagamento} não encontrado.` });
        }

        await updateSheet(ABA_PAGAMENTOS, [header, ...novasLinhas]);
        
        return res.status(200).json({ success: true, id: idPagamento });
      }

      default:
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error(`Erro na API /api/pagamentos/${idPagamento}:`, error);
    res.status(500).json({ error: "Erro ao processar a requisição.", details: error.message });
  }
}
