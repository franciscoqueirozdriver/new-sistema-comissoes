import { google } from "googleapis";
import { auth } from "@/lib/auth";

export default async function handler(req, res) {
  const sheets = google.sheets({ version: "v4", auth });
  const { ano } = req.query;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Pagamentos!A2:J",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json({ totalReceberAno: 0, totalRecebidoAno: 0 });
    }

    let totalReceberAno = 0;
    let totalRecebidoAno = 0;

    for (const row of rows) {
      const [ , , , , , , valorLiquidoStr, dataPrevistaStr, dataRecebidaStr, status ] = row;

      if (!valorLiquidoStr) continue;

      const valor = parseFloat(
        valorLiquidoStr
          .replace(/\./g, "")
          .replace(",", ".")
      );

      if (dataPrevistaStr) {
        const dataPrevista = new Date(dataPrevistaStr);
        if (dataPrevista.getFullYear() === parseInt(ano)) {
          totalReceberAno += valor;
        }
      }

      if (status === "Recebido" && dataRecebidaStr) {
        const dataRecebida = new Date(dataRecebidaStr);
        if (dataRecebida.getFullYear() === parseInt(ano)) {
          totalRecebidoAno += valor;
        }
      }
    }

    res.status(200).json({ totalReceberAno, totalRecebidoAno });
  } catch (error) {
    console.error("Erro ao buscar estatísticas do ano:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas do ano." });
  }
}

