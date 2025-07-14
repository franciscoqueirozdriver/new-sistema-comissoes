// pages/api/pizza-funil.js
import { google } from "googleapis";

export default async function handler(req, res) {
  const { ano } = req.query;
  if (!ano) return res.status(400).json({ error: "Parâmetro ano é obrigatório" });

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const oportunidades = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Oportunidades!A1:Z1000",
  });

  const header = oportunidades.data.values[0];
  const rows = oportunidades.data.values.slice(1);

  const colFase = header.findIndex(h => h.trim().toLowerCase() === "fase_do_funil");
  const colDataFechamento = header.findIndex(h => h.trim().toLowerCase() === "data_fechamento");
  const colPrevisaoFechamento = header.findIndex(h => h.trim().toLowerCase() === "previsao_fechamento");

  const counts = {};

  for (const row of rows) {
    const fase = (row[colFase] || "").trim();
    if (!fase) continue;

    const isGanho = fase.toLowerCase() === "ganho";
    const dataStr = isGanho ? row[colDataFechamento] : row[colPrevisaoFechamento];
    const data = new Date(dataStr);

    if (isNaN(data) || data.getFullYear() !== +ano) continue;

    const nomeFase = fase.charAt(0).toUpperCase() + fase.slice(1).toLowerCase();
    counts[nomeFase] = (counts[nomeFase] || 0) + 1;
  }

  const resultado = Object.entries(counts).map(([name, value]) => ({ name, value }));
  res.status(200).json(resultado);
}

