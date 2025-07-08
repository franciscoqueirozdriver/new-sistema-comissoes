import { google } from "googleapis"

export default async function handler(req, res) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  const sheets = google.sheets({ version: "v4", auth })
  const spreadsheetId = process.env.SPREADSHEET_ID

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pagamentos!A1:Z1000",
  })

  const rows = response.data.values
  if (!rows || rows.length < 2) {
    return res.status(200).json([])
  }

  const header = rows[0]
  const dataRows = rows.slice(1)

  const idxStatus = header.indexOf("status")
  const idxData = header.indexOf("data_prevista")
  const idxValor = header.indexOf("valor_liquido_comissao")

  const mensal = {}

  dataRows.forEach(row => {
    const status = row[idxStatus]
    const data = row[idxData]
    const valor = parseFloat(row[idxValor]?.replace(",", ".") || 0)

    const date = new Date(data)
    if (isNaN(date)) return

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    if (!mensal[key]) mensal[key] = { name: key, realizado: 0, previsto: 0 }

    mensal[key].previsto += valor
    if (status === "Recebido") mensal[key].realizado += valor
  })

  const resultado = Object.values(mensal)
  res.status(200).json(resultado)
}
