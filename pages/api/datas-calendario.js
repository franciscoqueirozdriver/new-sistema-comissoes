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

  const values = response.data.values
  const header = values[0]
  const rows = values.slice(1)

  const colData = header.findIndex(h => h.toLowerCase().includes("data_prevista"))
  const colStatus = header.findIndex(h => h.toLowerCase().includes("status"))
  const colRecebido = header.findIndex(h => h.toLowerCase().includes("data_recebida"))

  const datas = []

  for (const row of rows) {
    const dataPrevista = row[colData]
    const status = (row[colStatus] || "").toLowerCase()
    const dataRecebida = row[colRecebido]

    if (!dataPrevista) continue

    datas.push({
      data: dataPrevista,
      status: status === "recebido" ? "verde" : "vermelho",
    })
  }

  res.status(200).json(datas)
}
