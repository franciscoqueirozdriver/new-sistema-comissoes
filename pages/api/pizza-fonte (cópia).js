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

  const config = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Configuracoes!A1:Z1000",
  })

  const configValues = config.data.values || []
  const fontesValidas = configValues
    .slice(1)
    .map(row => row[2]) // coluna C (índice 2) = fonte
    .filter(Boolean)

  const oportunidades = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Oportunidades!A1:Z1000",
  })

  const header = oportunidades.data.values[0]
  const rows = oportunidades.data.values.slice(1)

  const colIndexFonte = header.findIndex(h => h.trim().toLowerCase() === "fonte")

  const counts = {}

  for (const row of rows) {
    const fonte = (row[colIndexFonte] || "").trim()
    if (!fonte || !fontesValidas.includes(fonte)) continue

    counts[fonte] = (counts[fonte] || 0) + 1
  }

  const resultado = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }))

  res.status(200).json(resultado)
}

