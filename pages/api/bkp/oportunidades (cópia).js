// pages/api/oportunidades.js
import { google } from "googleapis";

export default async function handler(req, res) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  const getOportunidades = async () => {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Oportunidades!A1:Z1000",
    });
    return result.data.values || [];
  };

  const getPagamentos = async () => {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Pagamentos!A1:Z1000",
    });
    return result.data.values || [];
  };

  const writePagamentos = async (pagamentos) => {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Pagamentos!A1",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: pagamentos,
      },
    });
  };

  const deletePagamentosByIdOportunidade = async (id) => {
    const data = await getPagamentos();
    const header = data[0];
    const linhas = data.slice(1);
    const idIdx = header.findIndex(h => h.toLowerCase() === "id_oportunidade");

    const novas = [header, ...linhas.filter(l => l[idIdx] !== id.toString())];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Pagamentos!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: novas },
    });
  };

  const gerarPagamentos = (idOportunidade, dados) => {
    const parseFloatBR = v => parseFloat(v.replace(".", "").replace(",", "."));
    const pagamentos = [];

    const valorImplantacao = parseFloatBR(dados[6]);
    const parcelasImplantacao = parseInt(dados[7]);
    const valorMensalidade = parseFloatBR(dados[8]);
    const qtdMensalidades = parseInt(dados[9]);
    const dataBase = new Date(dados[11]);
    const percentualImposto = parseFloat(dados[12]);

    let id_pagamento = Date.now();

    const gerarParcela = (tipo, valor, qtd) => {
      const valorUnit = valor / qtd;
      for (let i = 0; i < qtd; i++) {
        const dataPrevista = new Date(dataBase);
        dataPrevista.setDate(dataPrevista.getDate() + i * 30);

        const valorLiquido = valorUnit * 0.2 * (1 - percentualImposto);

        pagamentos.push([
          (id_pagamento++).toString(),
          idOportunidade,
          tipo,
          (i + 1).toString(),
          valorUnit.toFixed(2).replace(".", ","),
          percentualImposto.toString().replace(".", ","),
          valorLiquido.toFixed(2).replace(".", ","),
          dataPrevista.toISOString().split("T")[0],
          "",
          "Previsto",
        ]);
      }
    };

    if (valorImplantacao > 0 && parcelasImplantacao > 0) {
      gerarParcela("Implantacao", valorImplantacao, parcelasImplantacao);
    }
    if (valorMensalidade > 0 && qtdMensalidades > 0) {
      gerarParcela("Mensalidade", valorMensalidade * qtdMensalidades, qtdMensalidades);
    }

    return pagamentos;
  };

  try {
    if (req.method === "GET") {
      const linhas = await getOportunidades();
      const [header, ...dados] = linhas;
      const objetos = dados.map(linha => {
        const obj = {};
        header.forEach((h, i) => {
          obj[h] = linha[i] || "";
        });
        return obj;
      });
      return res.status(200).json(objetos);
    }

    if (req.method === "POST") {
      const dados = req.body;
      const linhas = await getOportunidades();
      const header = linhas[0];

      const idIndex = header.indexOf("id");
      const proximoId = Math.max(...linhas.slice(1).map(l => +l[idIndex] || 0)) + 1;

      const novaLinha = [];
      for (let i = 0; i < header.length; i++) {
        const campo = header[i];
        if (campo === "id") {
          novaLinha.push(proximoId.toString());
        } else {
          novaLinha.push(dados[campo] || "");
        }
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Oportunidades!A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [novaLinha],
        },
      });

      const pagamentos = gerarPagamentos(proximoId, novaLinha);
      await writePagamentos(pagamentos);

      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (error) {
    console.error("Erro na API /api/oportunidades:", error);
    res.status(500).json({ error: "Erro ao processar a requisição." });
  }
}

