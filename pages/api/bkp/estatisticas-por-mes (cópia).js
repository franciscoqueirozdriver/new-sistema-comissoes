import { google } from "googleapis";
import { auth } from "@/lib/auth";

export default async function handler(req, res) {
  const sheets = google.sheets({ version: "v4", auth });
  const { ano, mes } = req.query;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Pagamentos!A2:J",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json({ totalReceberMes: 0 });
    }

    let total = 0;

    for (const row of rows) {
      const [ , , , , valorBrutoStr, , valorLiquidoStr, dataPrevistaStr, , status ] = row;

      if (!valorLiquidoStr || !dataPrevistaStr) continue;

      const valor = parseFloat(
        valorLiquidoStr
          .replace(/\./g, "")   // remove milhar
          .replace(",", ".")    // troca decimal
      );

      const dataPrevista = new Date(dataPrevistaStr);
      if (
        dataPrevista.getFullYear() === parseInt(ano) &&
        dataPrevista.getMonth() + 1 === parseInt(mes)
      ) {
        total += valor;
      }
    }

    res.status(200).json({ totalReceberMes: total });
  } catch (error) {
    console.error("Erro ao buscar estatísticas do mês:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas do mês." });
  }
}

