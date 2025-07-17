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

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: "Não autorizado." });
  }

  try {
    switch (req.method) {
      case "GET": {
        const { header, rows } = await getSheetData("Oportunidades");
        let oportunidades = rowsToObjects(header, rows);
        if (session.user.role !== 'admin') {
          oportunidades = oportunidades.filter(op => op.user_email === session.user.email);
        }
        return res.status(200).json(oportunidades);
      }

      case "POST": {
        const novaOportunidade = req.body;
        const { header, rows } = await getSheetData("Oportunidades");

        const proximoId = String(Date.now());
        novaOportunidade.id = proximoId;
        novaOportunidade.user_email = session.user.email;

        // ✅ Converte tudo para string para evitar formatação automática
        const novaLinhaArray = header.map(colName => String(novaOportunidade[colName] || ""));

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
    res.status(500).json({ error: "Erro ao processar a requisição." });
  }
}

