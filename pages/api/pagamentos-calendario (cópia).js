// pages/api/pagamentos-calendario.js
import { google } from 'googleapis'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function handler(req, res) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  })

  const sheets = google.sheets({ version: 'v4', auth })

  const spreadsheetId = process.env.SPREADSHEET_ID
  const pagamentos = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Pagamentos!A2:J'
  })

  const oportunidades = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Oportunidades!A2:B'
  })

  const nomesPorId = Object.fromEntries(
    oportunidades.data.values?.map(([id, nome]) => [id, nome]) || []
  )

  const eventos = (pagamentos.data.values || [])
    .filter(l => l[8]) // data_prevista
    .map(l => {
      const dataPrevista = new Date(l[8])
      const nome = nomesPorId[l[1]] || 'Sem nome'
      const status = l[9] || ''
      const cor = status === 'Recebido' ? 'green' : status === 'Previsto' ? 'red' : 'orange'
      const valor = parseFloat((l[4] || '0').replace(/\./g, '').replace(',', '.'))
      const valorFormatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      })
      return {
        date: format(dataPrevista, 'yyyy-MM-dd'),
        color: cor,
        tooltip: [`${nome}: ${valorFormatado}`]
      }
    })

  const agrupado = eventos.reduce((acc, ev) => {
    const existente = acc.find(e => e.date === ev.date)
    if (existente) {
      existente.tooltip.push(...ev.tooltip)
    } else {
      acc.push(ev)
    }
    return acc
  }, [])

  res.status(200).json(agrupado)
}

