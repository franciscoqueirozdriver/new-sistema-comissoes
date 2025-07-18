import { getSheetData, appendRows } from "@/lib/googleSheetsService";
import { gerarPagamentos } from "@/lib/financeiroService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export const dynamic = 'force-dynamic';

function rowsToObjects(header, rows) {
  return rows.map(row => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i] || "";
    });
    return obj;
  });
}

function getNextId(rows, header) {
  const idIndex = header.indexOf("id");
  if (idIndex === -1) throw new Error("A coluna 'id' não foi encontrada na planilha de Oportunidades.");
  
  const maxId = Math.max(0, ...rows.map(row => parseInt(row[idIndex], 10) || 0));
  return maxId + 1;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: "Não autorizado ou pendente de aprovação." });
  }

  try {
    switch (req.method) {
      case "GET": {
        const { visao } = req.query; // Pega o novo parâmetro 'visao'
        const { header, rows } = await getSheetData("Oportunidades");
        let oportunidades = rowsToObjects(header, rows);
        
        // --- LÓGICA DE SEGURANÇA ATUALIZADA ---
        // A condição para filtrar agora é: se o usuário NÃO for admin, OU se ele FOR admin mas NÃO estiver pedindo a visão 'todos'.
        if (session.user.role !== 'admin' || visao !== 'todos') {
          const userEmailIndex = header.indexOf("user_email");
          if (userEmailIndex === -1) {
            console.error("A coluna 'user_email' não foi encontrada na aba Oportunidades.");
            return res.status(200).json([]);
          }
          const userRows = rows.filter(row => row[userEmailIndex] === session.user.email);
          oportunidades = rowsToObjects(header, userRows);
        }
        
        return res.status(200).json(oportunidades);
      }

      case "POST": {
        const novaOportunidade = req.body;
        const { header, rows } = await getSheetData("Oportunidades");

        const proximoId = getNextId(rows, header);
        novaOportunidade.id = String(proximoId);
        novaOportunidade.user_email = session.user.email;
        
        const novaLinhaArray = header.map(colName => novaOportunidade[colName] || "");
        
        await Promise.all([
            appendRows("Oportunidades", [novaLinhaArray]),
            appendRows("Pagamentos", gerarPagamentos(proximoId, novaOportunidade))
        ]);

        return res.status(201).json({ success: true, id: proximoId });
      }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error(`Erro na API /api/oportunidades:`, error);
    res.status(500).json({ error: "Erro ao processar a requisição.", details: error.message });
  }
}
