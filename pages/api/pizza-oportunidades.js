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

  // Busca a lista de tipos de oportunidade na aba Configuracoes
  const tipos = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Configuracoes!A2:A",
  })

  const tiposOportunidade = tipos.data.values.flat().filter(Boolean)

  // Busca os dados da aba Oportunidades
  const dados = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Oportunidades!A1:Z",
  })

  const [header, ...rows] = dados.data.values
  const idxFonte = header.indexOf("fonte")

  const contagem = {}

  for (const tipo of tiposOportunidade) {
    contagem[tipo] = 0
  }

  for (const row of rows) {
    const fontes = (row[idxFonte] || "").split(";").map(f => f.trim())
    for (const fonte of fontes) {
      if (contagem[fonte] !== undefined) {
        contagem[fonte]++
      }
    }
  }

  const resultado = Object.entries(contagem).map(([name, value]) => ({ name, value }))
  res.status(200).json(resultado)
}
