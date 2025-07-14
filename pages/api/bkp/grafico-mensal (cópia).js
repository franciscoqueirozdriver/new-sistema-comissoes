// pages/api/grafico-mensal.js
import { google } from "googleapis";

export default async function handler(req, res) {
  const { ano } = req.query;
  if (!ano) return res.status(400).json({ error: "Parâmetro ano é obrigatório" });

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const pagamentosRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Pagamentos!A1:Z1000",
  });
  const rows = pagamentosRes.data.values;
  const header = rows[0];
  const data = rows.slice(1);

  const idxDataPrevista = header.findIndex(h => h.toLowerCase().trim() === "data_prevista");
  const idxStatus = header.findIndex(h => h.toLowerCase().trim() === "status");
  const idxValor = header.findIndex(h => h.toLowerCase().trim() === "valor_liquido_comissao");

  const meses = Array.from({ length: 12 }, () => ({ realizado: 0, previsto: 0 }));

  for (const row of data) {
    const dataPagamento = new Date(row[idxDataPrevista]);
    const status = row[idxStatus]?.toLowerCase();
    const valor = parseFloat(row[idxValor]?.replace(".", "").replace(",", ".") || "0");

    if (!isNaN(dataPagamento)) {
      const rowAno = dataPagamento.getFullYear();
      const rowMes = dataPagamento.getMonth();

      if (rowAno === +ano) {
        if (status === "recebido") {
          meses[rowMes].realizado += valor;
        } else {
          meses[rowMes].previsto += valor;
        }
      }
    }
  }

  const resultado = meses.map((v, i) => ({ name: `${ano}-${String(i + 1).padStart(2, "0")}`, ...v }));
  res.status(200).json(resultado);
}

