import { getSheetData, appendRows } from "@/lib/googleSheetsService";
import { gerarPagamentos } from "@/lib/financeiroService";

export const dynamic = 'force-dynamic'; // <-- LINHA ADICIONADA

const ABA_OPORTUNIDADES = "Oportunidades";
const ABA_PAGAMENTOS = "Pagamentos";

/**
 * Transforma linhas de uma planilha em um array de objetos, usando o cabeçalho como chaves.
 */
function rowsToObjects(header, rows) {
  return rows.map(row => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i] || "";
    });
    return obj;
  });
}

/**
 * Encontra o próximo ID disponível.
 * ATENÇÃO: Este método não é seguro contra concorrência (race conditions).
 */
function getNextId(rows, header) {
  const idIndex = header.indexOf("id");
  if (idIndex === -1) throw new Error("A coluna 'id' não foi encontrada na planilha de Oportunidades.");
  
  const maxId = Math.max(0, ...rows.map(row => parseInt(row[idIndex], 10) || 0));
  return maxId + 1;
}

/**
 * Handler para listar (GET) e criar (POST) oportunidades.
 */
export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "GET":
        const { header, rows } = await getSheetData(ABA_OPORTUNIDADES);
        const oportunidades = rowsToObjects(header, rows);
        return res.status(200).json(oportunidades);

      case "POST":
        const novaOportunidade = req.body;
        const sheetData = await getSheetData(ABA_OPORTUNIDADES);

        const proximoId = getNextId(sheetData.rows, sheetData.header);
        novaOportunidade.id = String(proximoId);

        const novaLinhaArray = sheetData.header.map(colName => novaOportunidade[colName] || "");
        
        await Promise.all([
            appendRows(ABA_OPORTUNIDADES, [novaLinhaArray]),
            appendRows(ABA_PAGAMENTOS, gerarPagamentos(proximoId, novaOportunidade))
        ]);

        return res.status(201).json({ success: true, id: proximoId });

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error(`Erro na API /api/oportunidades:`, error);
    res.status(500).json({ error: "Erro ao processar a requisição.", details: error.message });
  }
}
