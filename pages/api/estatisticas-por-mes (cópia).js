// pages/api/estatisticas-por-mes.js
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

  const pagamentosRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pagamentos!A1:Z1000",
  })

  const rows = pagamentosRes.data.values
  const header = rows[0]
  const data = rows.slice(1)

  const idxDataPrevista = header.findIndex(h => h.toLowerCase().trim() === "data_prevista")
  const idxStatus = header.findIndex(h => h.toLowerCase().trim() === "status")
  const idxValorBruto = header.findIndex(h => h.toLowerCase().trim() === "valor_liquido_comissao")

  let totalReceberMes = 0

  for (const row of data) {
    const dataPrevista = row[idxDataPrevista]
    const status = row[idxStatus]?.toLowerCase().trim()
    const valor = parseFloat(row[idxValorBruto]?.replace(",", ".") || "0")

    if (!dataPrevista || status === "recebido") continue

    const data = new Date(dataPrevista)
    if (
      data.getFullYear() === parseInt(ano) &&
      data.getMonth() + 1 === parseInt(mes)
    ) {
      totalReceberMes += valor
    }
  }

  res.status(200).json({ totalReceberMes })
}

