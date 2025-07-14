import { getSheetData, updateSheet } from "@/lib/googleSheetsService";
import { gerarPagamentos } from "@/lib/financeiroService";

const ABA_OPORTUNIDADES = "Oportunidades";
const ABA_PAGAMENTOS = "Pagamentos";

/**
 * Handler para buscar um, atualizar ou deletar uma oportunidade específica.
 */
export default async function handler(req, res) {
  const { id } = req.query; // Pega o ID da URL, ex: /api/oportunidades/63 -> id = "63"

  try {
    switch (req.method) {
      case "GET": {
        // --- Buscar uma única oportunidade ---
        const { header, rows } = await getSheetData(ABA_OPORTUNIDADES);
        const idIndex = header.indexOf("id");

        const linhaEncontrada = rows.find(row => String(row[idIndex]) === String(id));

        if (!linhaEncontrada) {
          return res.status(404).json({ error: `Oportunidade com ID ${id} não encontrada.` });
        }

        const oportunidade = {};
        header.forEach((key, i) => {
          oportunidade[key] = linhaEncontrada[i] || "";
        });

        return res.status(200).json(oportunidade);
      }

      case "PUT": {
        // --- Atualizar uma oportunidade ---
        const dadosAtualizados = req.body;
        const { header, rows } = await getSheetData(ABA_OPORTUNIDADES);
        const idIndex = header.indexOf("id");

        const rowIndexToUpdate = rows.findIndex(row => String(row[idIndex]) === String(id));

        if (rowIndexToUpdate === -1) {
          return res.status(404).json({ error: `Oportunidade com ID ${id} não encontrada para atualização.` });
        }

        // Garante que a linha atualizada mantenha a ordem correta das colunas
        const linhaAtualizadaArray = header.map(colName => dadosAtualizados[colName] || "");
        
        // Substitui a linha antiga pela nova no array de dados
        const novasLinhasOp = [...rows];
        novasLinhasOp[rowIndexToUpdate] = linhaAtualizadaArray;
        
        // ATENÇÃO: Se os dados financeiros mudaram, os pagamentos precisam ser recalculados.
        // A abordagem mais segura é excluir os pagamentos antigos e gerar novos.
        const pagamentosData = await getSheetData(ABA_PAGAMENTOS);
        const idPagIndex = pagamentosData.header.indexOf("id_oportunidade");

        const pagamentosRestantes = pagamentosData.rows.filter(row => String(row[idPagIndex]) !== String(id));
        const novosPagamentos = gerarPagamentos(id, dadosAtualizados);
        
        const todosOsPagamentosAtualizados = [pagamentosData.header, ...pagamentosRestantes, ...novosPagamentos];
        const todasAsOportunidadesAtualizadas = [header, ...novasLinhasOp];

        // Executa as duas atualizações em paralelo
        await Promise.all([
            updateSheet(ABA_OPORTUNIDADES, todasAsOportunidadesAtualizadas),
            updateSheet(ABA_PAGAMENTOS, todosOsPagamentosAtualizados)
        ]);
        
        return res.status(200).json({ success: true, id: id });
      }

      case "DELETE": {
        // --- Excluir uma oportunidade e seus pagamentos ---
        const [oportunidadesData, pagamentosData] = await Promise.all([
          getSheetData(ABA_OPORTUNIDADES),
          getSheetData(ABA_PAGAMENTOS)
        ]);

        const idOpIndex = oportunidadesData.header.indexOf("id");
        const idPagIndex = pagamentosData.header.indexOf("id_oportunidade");

        const oportunidadesRestantes = oportunidadesData.rows.filter(row => String(row[idOpIndex]) !== String(id));

        // Validação para garantir que o item existia antes de deletar
        if (oportunidadesRestantes.length === oportunidadesData.rows.length) {
            return res.status(404).json({ error: `Oportunidade com ID ${id} não encontrada para exclusão.` });
        }

        const pagamentosRestantes = pagamentosData.rows.filter(row => String(row[idPagIndex]) !== String(id));

        // Executa a reescrita das planilhas com os dados filtrados
        await Promise.all([
            updateSheet(ABA_OPORTUNIDADES, [oportunidadesData.header, ...oportunidadesRestantes]),
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
    res.status(500).json({ error: "Erro ao processar a requisição.", details: error.message });
  }
}
