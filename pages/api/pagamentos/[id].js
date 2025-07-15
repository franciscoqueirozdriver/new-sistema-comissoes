import { getSheetData, updateSheet } from "@/lib/googleSheetsService";

export const dynamic = 'force-dynamic'; // <-- LINHA ADICIONADA

const ABA_PAGAMENTOS = "Pagamentos";

export default async function handler(req, res) {
  // Pega o ID do pagamento da URL
  const { id } = req.query;

  try {
    switch (req.method) {
      case "PUT": {
        // --- Atualizar um pagamento existente ---
        const dadosAtualizados = req.body;

        const { header, rows } = await getSheetData(ABA_PAGAMENTOS);
        
        const idPagamentoIndex = header.indexOf("id_pagamento");
        if (idPagamentoIndex === -1) {
          throw new Error("A coluna 'id_pagamento' não foi encontrada na planilha de Pagamentos.");
        }

        let pagamentoEncontrado = false;
        // Mapeia as linhas e atualiza a que corresponder ao ID
        const novasLinhas = rows.map(row => {
          if (String(row[idPagamentoIndex]) === String(id)) {
            pagamentoEncontrado = true;
            // Retorna uma nova linha na ordem correta do cabeçalho
            return header.map(colName => dadosAtualizados[colName] || "");
          }
          return row;
        });

        if (!pagamentoEncontrado) {
          return res.status(404).json({ error: `Pagamento com ID ${id} não encontrado.` });
        }

        // Re-escreve a planilha inteira com a linha atualizada
        await updateSheet(ABA_PAGAMENTOS, [header, ...novasLinhas]);
        
        return res.status(200).json({ success: true, id: id });
      }

      default:
        res.setHeader("Allow", ["PUT"]);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error(`Erro na API /api/pagamentos/${id}:`, error);
    res.status(500).json({ error: "Erro ao processar a requisição.", details: error.message });
  }
}
