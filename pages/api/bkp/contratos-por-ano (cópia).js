// pages/api/contratos-ano.js
import { google } from "googleapis"

export default async function handler(req, res) {
  const { ano } = req.query

  if (!ano) {
    return res.status(400).json({ error: "Parâmetro ano é obrigatório" })
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  const sheets = google.sheets({ version: "v4", auth })
  const spreadsheetId = process.env.SPREADSHEET_ID

  const oportunidadesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Oportunidades!A1:Z1000",
  })

  const rows = oportunidadesRes.data.values
  const header = rows[0]
  const data = rows.slice(1)

  const idxDataFechamento = header.findIndex(h => h.trim().toLowerCase() === "data_fechamento")

  let vendidosAno = 0

  for (const row of data) {
    const dataFechamento = row[idxDataFechamento]
    if (!dataFechamento) continue

    const data = new Date(dataFechamento)
    if (data.getFullYear() === parseInt(ano)) {
      vendidosAno++
    }
  }

  res.status(200).json({ vendidosAno })
}
