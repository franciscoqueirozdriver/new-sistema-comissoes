// pages/api/estatisticas-por-ano.js
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

  const pagamentosRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pagamentos!A1:Z1000",
  })

  const rows = pagamentosRes.data.values
  const header = rows[0]
  const data = rows.slice(1)

  const idxDataPrevista = header.findIndex(h => h.toLowerCase().trim() === "data_prevista")
  const idxDataRecebida = header.findIndex(h => h.toLowerCase().trim() === "data_recebida")
  const idxStatus = header.findIndex(h => h.toLowerCase().trim() === "status")
  const idxValor = header.findIndex(h => h.toLowerCase().trim() === "valor_liquido_comissao")

  let totalReceberAno = 0
  let totalRecebidoAno = 0

  for (const row of data) {
    const status = row[idxStatus]?.toLowerCase().trim()
    const valor = parseFloat(row[idxValor]?.replace(",", ".") || "0")

    if (status === "recebido") {
      const dataRecebida = row[idxDataRecebida]
      if (dataRecebida && new Date(dataRecebida).getFullYear() === parseInt(ano)) {
        totalRecebidoAno += valor
      }
    } else {
      const dataPrevista = row[idxDataPrevista]
      if (dataPrevista && new Date(dataPrevista).getFullYear() === parseInt(ano)) {
        totalReceberAno += valor
      }
    }
  }

  res.status(200).json({ totalReceberAno, totalRecebidoAno })
}
