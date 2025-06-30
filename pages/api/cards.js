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

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Pagamentos!A1:Z1000",
  })

  const rows = response.data.values
  if (!rows || rows.length === 0) {
    return res.status(200).json({})
  }

  const header = rows[0]
  const registros = rows.slice(1).map(row =>
    Object.fromEntries(header.map((key, i) => [key.trim().toLowerCase().replaceAll(" ", "_"), row[i]]))
  )

  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()

  const totalMes = registros
    .filter(r => {
      const data = new Date(r.data_prevista)
      return r.status !== "Recebido" && data.getMonth() === mesAtual && data.getFullYear() === anoAtual
    })
    .reduce((acc, r) => acc + Number(r.valor_liquido_comissao || 0), 0)

  const totalAno = registros
    .filter(r => {
      const data = new Date(r.data_prevista)
      return r.status !== "Recebido" && data.getFullYear() === anoAtual
    })
    .reduce((acc, r) => acc + Number(r.valor_liquido_comissao || 0), 0)

  const totalRecebido = registros
    .filter(r => r.status === "Recebido")
    .reduce((acc, r) => acc + Number(r.valor_liquido_comissao || 0), 0)

  const contratosVendidosMes = registros
    .filter(r => {
      const data = new Date(r.data_prevista)
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual
    })
    .map(r => r.id_oportunidade)
    .filter((v, i, a) => v && a.indexOf(v) === i).length

  const contratosVendidosAno = registros
    .filter(r => {
      const data = new Date(r.data_prevista)
      return data.getFullYear() === anoAtual
    })
    .map(r => r.id_oportunidade)
    .filter((v, i, a) => v && a.indexOf(v) === i).length

  res.status(200).json({
    totalMes,
    totalAno,
    totalRecebido,
    vendidosMes: contratosVendidosMes,
    vendidosAno: contratosVendidosAno,
  })
}
