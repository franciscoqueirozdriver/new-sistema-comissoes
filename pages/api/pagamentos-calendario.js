// pages/api/pagamentos-calendario.js
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

  // Leitura da aba Oportunidades
  const oportunidadesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Oportunidades!A1:Z1000",
  })
  const oportunidadesRows = oportunidadesRes.data.values
  const oportunidadesHeader = oportunidadesRows[0]
  const oportunidadesData = oportunidadesRows.slice(1)

  const idxIdOportunidade = oportunidadesHeader.findIndex(h => h.trim().toLowerCase() === "id")
  const idxEmpresa = oportunidadesHeader.findIndex(h => h.trim().toLowerCase() === "empresa")

  const mapaClientes = {}
  for (const row of oportunidadesData) {
    const id = row[idxIdOportunidade]?.trim()
    const empresa = row[idxEmpresa]?.trim()
    if (id && empresa) {
      mapaClientes[id] = empresa
    }
  }

  // Leitura da aba Pagamentos
  const pagamentosRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pagamentos!A1:Z1000",
  })
  const rows = pagamentosRes.data.values
  const header = rows[0]
  const data = rows.slice(1)

  const idxDataPrevista = header.findIndex(h => h.trim().toLowerCase() === "data_prevista")
  const idxDataRecebida = header.findIndex(h => h.trim().toLowerCase() === "data_recebida")
  const idxStatus = header.findIndex(h => h.trim().toLowerCase() === "status")
  const idxValor = header.findIndex(h => h.trim().toLowerCase() === "valor_bruto")
  const idxIdOportunidadePag = header.findIndex(h => h.trim().toLowerCase() === "id_oportunidade")

  const resultado = {}
  const hoje = new Date()

  for (const row of data) {
    const dataPrevista = row[idxDataPrevista]
    const dataRecebida = row[idxDataRecebida]
    const status = row[idxStatus]?.trim().toLowerCase()
    const valor = parseFloat(row[idxValor]?.replace(',', '.') || 0)
    const idOportunidade = row[idxIdOportunidadePag]?.trim()
    const cliente = mapaClientes[idOportunidade] || "(Cliente não encontrado)"

    let data = null
    let cor = "orange"

    if (status === "recebido" && dataRecebida) {
      data = new Date(dataRecebida)
      cor = "green"
    } else if (dataPrevista) {
      const dataPrev = new Date(dataPrevista)
      data = dataPrev
      if (dataPrev < hoje) cor = "red"
    }

    if (!data) continue

    const key = data.toISOString().split("T")[0]
    if (!resultado[key]) resultado[key] = []

    resultado[key].push({ cliente, valor, cor })
  }

  const final = Object.entries(resultado).map(([date, items]) => ({
    date,
    color: items[0].cor,
    tooltip: items.map(item => `${item.cliente}: R$ ${item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`),
  }))

  res.status(200).json(final)
}

