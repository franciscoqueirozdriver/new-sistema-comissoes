import fs from "fs";
import formidable from "formidable";
import pdf from "pdf-parse";
import Tesseract from "tesseract.js";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseNumeroBR(str) {
  if (typeof str !== "string") return 0;
  const s = str.trim();
  if (!s) return 0;
  const isPt = /,\d{2}$/.test(s);
  const normalized = isPt
    ? s.replace(/\./g, "").replace(/,/g, ".")
    : s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatBRL(n) {
  return (n ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcularQuintoDiaUtil(competencia) {
  if (!competencia) return "";
  let month, year;
  if (/\d{2}\/\d{4}/.test(competencia)) {
    [month, year] = competencia.split("/");
  } else if (/\d{4}-\d{2}/.test(competencia)) {
    [year, month] = competencia.split("-");
  } else {
    return "";
  }
  const date = new Date(Number(year), Number(month));
  let count = 0;
  while (true) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      count++;
      if (count === 5) break;
    }
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

function toISO(brDate) {
  if (!brDate) return "";
  const [d, m, y] = brDate.split("/");
  return `${y}-${m}-${d}`;
}

function extractValue(lines, regex) {
  const l = lines.find((line) => regex.test(line));
  if (!l) return 0;
  const nums = l.match(/\d+[\.,]\d+/g);
  if (!nums) return 0;
  return parseNumeroBR(nums[nums.length - 1]);
}

function extractQuantity(lines, regex) {
  const l = lines.find((line) => regex.test(line));
  if (!l) return "";
  const nums = l.match(/\d+[\.,]\d+/g);
  if (!nums) return "";
  return parseNumeroBR(nums[0]);
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  const form = formidable({ keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erro no upload", err);
      return res.status(500).json({ error: "Erro no upload" });
    }
    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "Arquivo não encontrado" });
    }

    try {
      const buffer = await fs.promises.readFile(file.filepath);
      let text = "";
      if (file.mimetype === "application/pdf") {
        try {
          const data = await pdf(buffer);
          text = data.text || "";
        } catch (e) {
          console.debug("pdf-parse falhou, usando OCR", e);
        }
      }
      if (!text.trim()) {
        try {
          const result = await Promise.race([
            Tesseract.recognize(buffer, "por"),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000)),
          ]);
          text = result.data.text;
        } catch (e) {
          console.debug("tesseract falhou", e);
        }
      }
      const texto_bruto = text;
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const rubricas = [];
      for (const l of lines) {
        const m = l.match(/^(\d{3,})?\s*([A-ZÇÃÂÊÍÓÚ\s\.]+)\s+(\d+[\.,]\d+)?\s+(\d+[\.,]\d+)?\s+(\d+[\.,]\d+)?/i);
        if (m) {
          rubricas.push({
            codigo: m[1] || undefined,
            descricao: m[2].trim(),
            referencia: m[3] ? parseNumeroBR(m[3]) : undefined,
            provento: m[4] ? formatBRL(parseNumeroBR(m[4])) : undefined,
            desconto: m[5] ? formatBRL(parseNumeroBR(m[5])) : undefined,
          });
        }
      }
      const numeros_extraidos = text.match(/\d+[\.,]\d+/g) || [];

      const empresaMatch = text.match(/(?:RAZ[ÃA]O SOCIAL|EMPRESA|EMPREGADOR)[:\s]+([^\n]+)/i);
      const empresa = empresaMatch ? empresaMatch[1].trim() : "";

      let competencia = "";
      const compMatch = text.match(/(\d{2}\/\d{4})/);
      if (compMatch) competencia = compMatch[1];

      const salario_base = extractValue(lines, /SAL[ÁA]RIO\s*BASE/i);
      const comissao = extractValue(lines, /COMISS[ÃA]OES?/i);
      const dsr = extractValue(lines, /DSR|REFLEXO\s+COMISS[ÃA]OES?\s*DSR/i);
      const dias_dsr = extractQuantity(lines, /REFLEXO\s+COMISS[ÃA]OES?\s*DSR/i);
      const valor_bruto = extractValue(lines, /TOTAL\s+(DE\s+)?VENCIMENTOS|PROVENTOS/i);
      const valor_liquido = extractValue(lines, /L[IÍ]QUIDO/i);
      const data_pagamento_raw = (text.match(/PAGAMENTO[:\s]*(\d{2}\/\d{2}\/\d{4})/) || [])[1];
      const data_pagamento = data_pagamento_raw ? toISO(data_pagamento_raw) : calcularQuintoDiaUtil(competencia);
      const mes = data_pagamento ? data_pagamento.slice(0, 7) : "";

      const fieldsExtracted = {
        mes,
        competencia,
        empresa,
        salario_base: formatBRL(salario_base),
        comissao: formatBRL(comissao),
        dsr: formatBRL(dsr),
        dias_dsr: dias_dsr ? String(dias_dsr) : "",
        valor_bruto: formatBRL(valor_bruto),
        valor_liquido: formatBRL(valor_liquido),
        data_pagamento,
        user_email: session.user.email,
        fonte_arquivo: file.originalFilename || file.newFilename,
        holerite_ID: uuidv4(),
        rubricas_json: JSON.stringify(rubricas),
        status_validacao: "pendente",
      };

      return res.status(200).json({
        requiresMapping: true,
        fieldsExtracted,
        fileName: file.originalFilename || file.newFilename,
        texto_bruto,
        rubricas,
        numeros_extraidos,
      });
    } catch (error) {
      console.error("Erro ao processar holerite", error);
      return res.status(500).json({ error: "Erro ao processar holerite" });
    }
  });
}
