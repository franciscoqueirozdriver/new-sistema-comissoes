import { getSheetData, updateSheet } from "@/lib/googleSheetsService";

const ABA_METAS = "Metas";

/**
 * Transforma linhas de uma planilha em um array de objetos, usando o cabeçalho como chaves.
 */
function rowsToObjects(header, rows) {
  return rows.map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      // Garante que a chave seja padronizada para o frontend
      const cleanKey = key.toLowerCase().replace(/ /g, '_');
      obj[cleanKey] = row[i] || "";
    });
    return obj;
  });
}

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "GET": {
        // --- LER E ENVIAR AS METAS ---
        const { header, rows } = await getSheetData(ABA_METAS);
        if (header.length === 0) {
            return res.status(200).json([]); // Retorna array vazio se a planilha não tiver cabeçalho
        }
        const metas = rowsToObjects(header, rows);
        return res.status(200).json(metas);
      }

      case "PUT": {
        // --- RECEBER E SALVAR AS NOVAS METAS ---
        const newMetas = req.body; // Recebe um array de objetos
        if (!Array.isArray(newMetas) || newMetas.length === 0) {
            // Se não houver metas, limpa a planilha (exceto o cabeçalho, se desejado)
            // Por segurança, vamos apenas salvar um cabeçalho vazio se a lista for vazia
            await updateSheet(ABA_METAS, [["mes", "meta_implantacao", "meta_mensalidade"]]);
            return res.status(200).json({ success: true, message: "Nenhuma meta para salvar. Planilha limpa." });
        }
        
        // Converte o array de objetos de volta para um array de arrays para salvar
        const header = Object.keys(newMetas[0]);
        const newRows = newMetas.map(meta => header.map(colName => meta[colName] || ""));
        const dataToSave = [header, ...newRows];
        
        // Usa nosso serviço para limpar a aba e escrever os novos dados
        await updateSheet(ABA_METAS, dataToSave);

        return res.status(200).json({ success: true, message: "Metas salvas com sucesso." });
      }

      default:
        res.setHeader("Allow", ["GET", "PUT"]);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error("Erro na API /api/metas:", error);
    res.status(500).json({ error: "Erro ao processar as metas.", details: error.message });
  }
}