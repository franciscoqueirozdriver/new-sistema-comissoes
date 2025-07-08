import { google } from "googleapis";
import { auth } from "@/lib/auth";

export default async function handler(req, res) {
  const sheets = google.sheets({ version: "v4", auth });

  try {
    const pagamentosRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Pagamentos!A2:J",
    });

    const oportunidadesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Oportunidades!A2:N",
    });

    const pagamentos = pagamentosRes.data.values || [];
    const oportunidades = oportunidadesRes.data.values || [];

    // Mapeia IDs de oportunidade para nomes das empresas
    const empresaPorId = {};
    for (const row of oportunidades) {
      const [id, empresa] = row;
      empresaPorId[id] = empresa;
    }

    // Agrupa os pagamentos por data prevista
    const eventos = {};

    for (const row of pagamentos) {
      const [ , idOportunidade, , , , , valorStr, dataPrevistaStr, , status ] = row;

      if (!dataPrevistaStr || !valorStr || !idOportunidade) continue;

      const data = dataPrevistaStr.split("T")[0]; // Remove hora se houver
      const nomeEmpresa = empresaPorId[idOportunidade] || "Desconhecido";

      const valor = parseFloat(valorStr.replace(/\./g, "").replace(",", "."));
      if (isNaN(valor)) continue;

      const cor =
        status === "Recebido"
          ? "green"
          : status === "Previsto"
          ? "red"
          : "orange";

      const valorFormatado = valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      });

      const entrada = `${nomeEmpresa}: ${valorFormatado}`;

      if (!eventos[data]) {
        eventos[data] = { color: cor, tooltip: [entrada] };
      } else {
        eventos[data].tooltip.push(entrada);
        if (cor === "red") eventos[data].color = "red";
        else if (cor === "orange" && eventos[data].color !== "red")
          eventos[data].color = "orange";
      }
    }

    const resultado = Object.entries(eventos).map(([date, { color, tooltip }]) => ({
      date,
      color,
      tooltip,
    }));

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar dados do calendário:", error);
    res.status(500).json({ error: "Erro ao buscar dados do calendário." });
  }
}

