// pages/api/configuracoes.js
import { google } from "googleapis";

export default async function handler(req, res) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Configuracoes!A1:Z1000",
  });

  const values = response.data.values || [];
  const header = values[0] || [];
  const rows = values.slice(1);

  const idxFonte = header.findIndex(h => h.toLowerCase().trim() === "fonte");
  const idxFase = header.findIndex(h => h.toLowerCase().trim() === "fase_do_funil");

  const fontes = new Set();
  const fases = new Set();

  for (const row of rows) {
    if (row[idxFonte]) fontes.add(row[idxFonte].trim());
    if (row[idxFase]) fases.add(row[idxFase].trim());
  }

  res.status(200).json({
    fontes: Array.from(fontes),
    fases: Array.from(fases),
  });
}

