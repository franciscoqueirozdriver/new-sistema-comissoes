// pages/api/pizza-fonte.js
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
  const range = "Oportunidades!A1:Z1000"
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range,
  })

  const [header, ...rows] = data.values
  const idxFonte = header.indexOf("fonte")

  const contagem = {}
  rows.forEach(row => {
    const valor = row[idxFonte]
    if (valor) {
      contagem[valor] = (contagem[valor] || 0) + 1
    }
  })

  const resultado = Object.entries(contagem).map(([name, value]) => ({ name, value }))
  res.status(200).json(resultado)
}
