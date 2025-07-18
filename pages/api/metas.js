import { getSheetData, updateSheet } from "@/lib/googleSheetsService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export const dynamic = 'force-dynamic';

const ABA_METAS = "Metas";

function rowsToObjects(header, rows) {
  return rows.map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      const cleanKey = key.toLowerCase().replace(/ /g, '_');
      obj[cleanKey] = row[i] || "";
    });
    return obj;
  });
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: "Não autorizado." });
  }

  try {
    switch (req.method) {
      case "GET": {
        const { visao } = req.query; // Pega o novo parâmetro 'visao'
        const { header, rows } = await getSheetData(ABA_METAS);
        if (header.length === 0) return res.status(200).json([]);
        
        let metas = rowsToObjects(header, rows);

        // --- LÓGICA DE SEGURANÇA ATUALIZADA ---
        // A condição para filtrar agora é: se o usuário NÃO for admin, OU se ele FOR admin mas NÃO estiver pedindo a visão 'todos'.
        if (session.user.role !== 'admin' || visao !== 'todos') {
          metas = metas.filter(meta => meta.user_email === session.user.email);
        }
        // ------------------------------------

        return res.status(200).json(metas);
      }

      case "PUT": {
        const metasEnviadasPeloUsuario = req.body;
        
        const metasParaSalvar = metasEnviadasPeloUsuario.map(meta => ({
          ...meta,
          user_email: session.user.email
        }));
        
        const { header, rows } = await getSheetData(ABA_METAS);
        const todasAsMetas = rowsToObjects(header, rows);
        
        const outrasMetas = todasAsMetas.filter(meta => meta.user_email !== session.user.email);
        
        const dadosFinaisParaSalvar = [...outrasMetas, ...metasParaSalvar];
        
        if (!Array.isArray(dadosFinaisParaSalvar) || dadosFinaisParaSalvar.length === 0) {
            await updateSheet(ABA_METAS, [["mes", "meta_implantacao", "meta_mensalidade", "user_email"]]);
            return res.status(200).json({ success: true, message: "Nenhuma meta para salvar." });
        }
        
        const newHeader = Object.keys(dadosFinaisParaSalvar[0]);
        const newRows = dadosFinaisParaSalvar.map(meta => newHeader.map(colName => meta[colName] || ""));
        const dataToSave = [newHeader, ...newRows];
        
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
