import { getSheetData, updateSheet } from "@/lib/googleSheetsService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export const dynamic = 'force-dynamic';

const ABA_CONFIGURACOES = "Configuracoes";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // --- VERIFICAÇÃO DE SESSÃO E PERMISSÃO ---
  // Apenas admins podem acessar qualquer funcionalidade desta API
  if (!session || !session.user || session.user.role !== 'admin') {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }

  try {
    switch (req.method) {
      case "GET": {
        const { header, rows } = await getSheetData(ABA_CONFIGURACOES);
        const configData = {};

        if (!header || header.length === 0) {
            return res.status(200).json({});
        }

        header.forEach((colName, colIndex) => {
          const items = rows.map(row => row[colIndex]).filter(item => item && item.trim() !== '');
          const uniqueItems = [...new Set(items)];
          configData[colName.toLowerCase().replace(/ /g, '_')] = uniqueItems;
        });

        return res.status(200).json(configData);
      }

      case "PUT": {
        const newConfig = req.body;
        if (!newConfig || Object.keys(newConfig).length === 0) {
            return res.status(400).json({ error: "Nenhum dado de configuração recebido." });
        }
        
        const header = Object.keys(newConfig);
        const columns = Object.values(newConfig);
        const maxLength = Math.max(0, ...columns.map(col => col.length));

        const newRows = [];
        for (let i = 0; i < maxLength; i++) {
          const newRow = header.map(colName => newConfig[colName][i] || "");
          newRows.push(newRow);
        }

        const dataToSave = [header, ...newRows];
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
