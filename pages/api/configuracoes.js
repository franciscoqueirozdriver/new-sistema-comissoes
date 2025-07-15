import { getSheetData, updateSheet } from "@/lib/googleSheetsService";

const ABA_CONFIGURACOES = "Configuracoes";

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "GET": {
        // --- LER E ENVIAR AS CONFIGURAÇÕES ---
        const { header, rows } = await getSheetData(ABA_CONFIGURACOES);
        const configData = {};

        // Transforma as colunas da planilha em um objeto
        header.forEach((colName, colIndex) => {
          // Para cada coluna, pega todos os seus itens, ignorando células vazias
          const items = rows.map(row => row[colIndex]).filter(item => item);
          configData[colName] = items;
        });

        return res.status(200).json(configData);
      }

      case "PUT": {
        // --- RECEBER E SALVAR AS NOVAS CONFIGURAÇÕES ---
        const newConfig = req.body;
        const header = Object.keys(newConfig);
        const columns = Object.values(newConfig);

        // Encontra o tamanho da maior coluna para saber quantas linhas a planilha terá
        const maxLength = Math.max(...columns.map(col => col.length));

        const newRows = [];
        // Cria as linhas da planilha a partir do objeto
        for (let i = 0; i < maxLength; i++) {
          const newRow = header.map(colName => newConfig[colName][i] || "");
          newRows.push(newRow);
        }

        // Prepara os dados finais (cabeçalho + linhas)
        const dataToSave = [header, ...newRows];

        // Usa nosso serviço para limpar a aba e escrever os novos dados
        await updateSheet(ABA_CONFIGURACOES, dataToSave);

        return res.status(200).json({ success: true, message: "Configurações salvas com sucesso." });
      }

      default:
        res.setHeader("Allow", ["GET", "PUT"]);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error("Erro na API /api/configuracoes:", error);
    res.status(500).json({ error: "Erro ao processar as configurações.", details: error.message });
  }
}