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

  const config = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Configuracoes!A1:Z1000",
  });
  const configValues = config.data.values || [];
  const fontesValidas = configValues
    .slice(1)
    .map(row => row[2])
    .filter(Boolean);

  const oportunidades = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Oportunidades!A1:Z1000",
  });
  const header = oportunidades.data.values[0];
  const rows = oportunidades.data.values.slice(1);

  const colFonte = header.findIndex(h => h.trim().toLowerCase() === "fonte");
  const colFase = header.findIndex(h => h.trim().toLowerCase() === "fase_do_funil");
  const colDataFechamento = header.findIndex(h => h.trim().toLowerCase() === "data_fechamento");
  const colPrevisaoFechamento = header.findIndex(h => h.trim().toLowerCase() === "previsao_fechamento");

  const counts = {};

  for (const row of rows) {
    const fonte = (row[colFonte] || "").trim();
    const fase = (row[colFase] || "").trim().toLowerCase();
    let dataStr = fase === "ganho" ? row[colDataFechamento] : row[colPrevisaoFechamento];
    const data = new Date(dataStr);

    if (!fonte || isNaN(data) || data.getFullYear() !== +ano) continue;
    if (!fontesValidas.includes(fonte)) continue;

    counts[fonte] = (counts[fonte] || 0) + 1;
  }

  const resultado = Object.entries(counts).map(([name, value]) => ({ name, value }));
  res.status(200).json(resultado);
}

