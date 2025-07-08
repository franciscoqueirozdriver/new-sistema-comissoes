// pages/api/dashboard.js
import { google } from "googleapis"

export default async function handler(req, res) {
  const { ano, mes } = req.query
  if (!ano || !mes) return res.status(400).json({ error: "Parâmetros ano e mes são obrigatórios" })

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  const sheets = google.sheets({ version: "v4", auth })
  const spreadsheetId = process.env.SPREADSHEET_ID

  // --- PAGAMENTOS ---
  const pagamentosRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pagamentos!A1:Z1000",
  })
  const rowsPag = pagamentosRes.data.values
  const headerPag = rowsPag[0]
  const dataPag = rowsPag.slice(1)

  const idxDataPrevista = headerPag.findIndex(h => h.toLowerCase().trim() === "data_prevista")
  const idxStatus = headerPag.findIndex(h => h.toLowerCase().trim() === "status")
  const idxValor = headerPag.findIndex(h => h.toLowerCase().trim() === "valor_liquido_comissao")

  let totalReceberMes = 0
  let totalReceberAno = 0
  let totalRecebidoAno = 0

  for (const row of dataPag) {
  const rawDataPrevista = row[idxDataPrevista]
  const dataPrevista = rawDataPrevista ? new Date(rawDataPrevista) : null
  const status = row[idxStatus]?.toLowerCase().trim()
  const valor = parseFloat(row[idxValor]?.replace(".", "").replace(",", ".") || "0")

  if (dataPrevista instanceof Date && !isNaN(dataPrevista)) {
    const rowAno = dataPrevista.getFullYear()
    const rowMes = dataPrevista.getMonth() + 1

    if (status === "recebido" && rowAno === +ano) {
      totalRecebidoAno += valor
    }

    if (status !== "recebido" && rowAno === +ano) {
      totalReceberAno += valor
      if (rowMes === +mes) {
        totalReceberMes += valor
      }
    }
  }
}


  // --- OPORTUNIDADES ---
  const oportunidadesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Oportunidades!A1:Z1000",
  })
  const rowsOpp = oportunidadesRes.data.values
  const headerOpp = rowsOpp[0]
  const dataOpp = rowsOpp.slice(1)

  const idxFase = headerOpp.findIndex(h => h.toLowerCase().trim() === "fase_do_funil")
  const idxDataFechamento = headerOpp.findIndex(h => h.toLowerCase().trim() === "data_fechamento")

  let vendidosMes = 0
  let vendidosAno = 0

  for (const row of dataOpp) {
    const fase = row[idxFase]?.toLowerCase().trim()
    const data = new Date(row[idxDataFechamento])

    if (fase === "ganho" && !isNaN(data)) {
      const rowAno = data.getFullYear()
      const rowMes = data.getMonth() + 1

      if (rowAno === +ano) vendidosAno++
      if (rowAno === +ano && rowMes === +mes) vendidosMes++
    }
  }

  res.status(200).json({
    totalReceberMes,
    totalReceberAno,
    totalRecebidoAno,
    vendidosMes,
    vendidosAno
  })
}
