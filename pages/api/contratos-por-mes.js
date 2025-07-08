// pages/api/contratos-por-mes.js
import { google } from "googleapis"

export default async function handler(req, res) {
  const { ano, mes } = req.query

  if (!ano || !mes) {
    return res.status(400).json({ error: "Parâmetros ano e mes são obrigatórios" })
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

  const idxDataFechamento = header.findIndex(h => h.toLowerCase().trim() === "data_fechamento")
  let count = 0

  for (const row of data) {
    const dataFechamento = row[idxDataFechamento]
    if (!dataFechamento) continue

    const data = new Date(dataFechamento)
    if (data.getFullYear() === parseInt(ano) && data.getMonth() + 1 === parseInt(mes)) {
      count++
    }
  }

  res.status(200).json({ contratosNoMes: count })
}

