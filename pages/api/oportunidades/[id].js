import { getSheetData, updateSheet } from "@/lib/googleSheetsService";
import { gerarPagamentos } from "@/lib/financeiroService";

export const dynamic = 'force-dynamic'; // <-- LINHA ADICIONADA

const ABA_OPORTUNIDADES = "Oportunidades";
const ABA_PAGAMENTOS = "Pagamentos";

/**
 * Handler para buscar um, atualizar ou deletar uma oportunidade específica.
 */
export default async function handler(req, res) {
  const { id } = req.query; 

  try {
    switch (req.method) {
      case "GET": {
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
        const dadosAtualizados = req.body;
        const { header, rows } = await getSheetData(ABA_OPORTUNIDADES);
        const idIndex = header.indexOf("id");
        const rowIndexToUpdate = rows.findIndex(row => String(row[idIndex]) === String(id));

        if (rowIndexToUpdate === -1) {
          return res.status(404).json({ error: `Oportunidade com ID ${id} não encontrada para atualização.` });
        }

        const linhaAtualizadaArray = header.map(colName => dadosAtualizados[colName] || "");
        const novasLinhasOp = [...rows];
        novasLinhasOp[rowIndexToUpdate] = linhaAtualizadaArray;
        
        const pagamentosData = await getSheetData(ABA_PAGAMENTOS);
        const idPagIndex = pagamentosData.header.indexOf("id_oportunidade");
        const pagamentosRestantes = pagamentosData.rows.filter(row => String(row[idPagIndex]) !== String(id));
        const novosPagamentos = gerarPagamentos(id, dadosAtualizados);
        
        const todosOsPagamentosAtualizados = [pagamentosData.header, ...pagamentosRestantes, ...novosPagamentos];
        const todasAsOportunidadesAtualizadas = [header, ...novasLinhasOp];

        await Promise.all([
            updateSheet(ABA_OPORTUNIDADES, todasAsOportunidadesAtualizadas),
            updateSheet(ABA_PAGAMENTOS, todosOsPagamentosAtualizados)
        ]);
        
        return res.status(200).json({ success: true, id: id });
      }

      case "DELETE": {
        const [oportunidadesData, pagamentosData] = await Promise.all([
          getSheetData(ABA_OPORTUNIDADES),
          getSheetData(ABA_PAGAMENTOS)
        ]);

        const idOpIndex = oportunidadesData.header.indexOf("id");
        const idPagIndex = pagamentosData.header.indexOf("id_oportunidade");
        const oportunidadesRestantes = oportunidadesData.rows.filter(row => String(row[idOpIndex]) !== String(id));

        if (oportunidadesRestantes.length === oportunidadesData.rows.length) {
            return res.status(404).json({ error: `Oportunidade com ID ${id} não encontrada para exclusão.` });
        }

        const pagamentosRestantes = pagamentosData.rows.filter(row => String(row[idPagIndex]) !== String(id));

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
