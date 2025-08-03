import fs from 'fs';
import formidable from 'formidable';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: false,
  },
};

export const dynamic = 'force-dynamic';

function extractFields(text) {
  const get = (regex) => {
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    mes: get(/M[êe]s\/Ano[:\s]+([0-9]{2}\/[0-9]{4})/i),
    salario_base: get(/Sal[áa]rio Base[:\s]+([0-9.,]+)/i),
    comissao: get(/Comiss[oõ]es?[:\s]+([0-9.,]+)/i),
    dsr: get(/DSR[:\s]+([0-9.,]+)/i),
    dias_dsr: get(/Dias de DSR[:\s]+([0-9]+)/i),
    data_pagamento: get(/Data Pagamento[:\s]+([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i),
  };
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  try {
    const form = formidable({ multiples: false, keepExtensions: true });
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'Arquivo não enviado.' });
    }

    const filePath = file.filepath || file.path;
    const buffer = fs.readFileSync(filePath);
    let text = '';

    try {
      const parsed = await pdfParse(buffer);
      if (parsed.text && parsed.text.trim()) {
        text = parsed.text;
      } else {
        const ocr = await Tesseract.recognize(filePath, 'por');
        text = ocr.data.text;
      }
    } finally {
      fs.unlink(filePath, () => {});
    }

    const dados = extractFields(text);
    dados.user_email = session.user.email;
    dados.fonte_arquivo = file.originalFilename || file.newFilename || file.name;

    return res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao importar holerite:', error);
    return res.status(500).json({ error: 'Falha ao processar holerite.' });
  }
}

