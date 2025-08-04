import fs from 'fs';
import formidable from 'formidable';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { PDFDocument, PDFName } from 'pdf-lib';
import { appendRows } from '@/lib/googleSheetsService';
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

async function pdfToImages(buffer) {
  const pdfDoc = await PDFDocument.load(buffer);
  const pages = pdfDoc.getPages();
  const images = [];

  for (const page of pages) {
    const resources = page.node.Resources();
    const xObject = resources.lookup(PDFName.of('XObject'));
    if (!xObject) continue;

    xObject.entries().forEach(([name, ref]) => {
      const obj = pdfDoc.context.lookup(ref);
      const subtype = obj.dict.get(PDFName.of('Subtype'));
      if (subtype !== PDFName.of('Image')) return;

      const bytes = obj.getContents();
      const filter = obj.dict.get(PDFName.of('Filter'));
      let ext = 'png';
      if (filter === PDFName.of('DCTDecode')) ext = 'jpg';
      images.push({ buffer: Buffer.from(bytes), ext });
    });
  }

  return images;
}

async function runOcrOnImages(images) {
  let ocrText = '';
  let count = 0;
  for (const img of images) {
    const { data } = await Tesseract.recognize(img.buffer, 'por');
    ocrText += data.text + '\n';
    count += 1;
  }
  console.log(`OCR executado em ${count} página(s)`);
  return ocrText;
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
      return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });
    }

    const mimetype = file.mimetype || file.type || '';
    console.log('Tipo de arquivo recebido:', mimetype);

    const filePath = file.filepath || file.path;
    const buffer = fs.readFileSync(filePath);
    let text = '';
    let parsedText = false;

    try {
      if (mimetype.includes('pdf')) {
        const parsed = await pdfParse(buffer).catch(() => ({ text: '' }));
        parsedText = parsed.text && parsed.text.trim().length > 0;
        console.log('pdf-parse encontrou texto:', parsedText);
        if (parsedText) {
          text = parsed.text;
        } else {
          const images = await pdfToImages(buffer);
          text = await runOcrOnImages(images);
        }
      } else if (mimetype.startsWith('image/')) {
        console.log('OCR executado em imagem única');
        const { data } = await Tesseract.recognize(filePath, 'por');
        text = data.text;
      } else {
        return res.status(400).json({ success: false, error: 'Formato de arquivo não suportado.' });
      }
    } finally {
      fs.unlink(filePath, () => {});
    }

    const dados = extractFields(text);
    dados.user_email = session.user.email;
    dados.fonte_arquivo = file.originalFilename || file.newFilename || file.name;

    try {
      await appendRows('Holerites', [[
        dados.mes,
        dados.salario_base,
        dados.comissao,
        dados.dsr,
        dados.dias_dsr,
        dados.data_pagamento,
        dados.user_email,
        dados.fonte_arquivo,
      ]]);
    } catch (err) {
      console.error('Erro ao salvar holerite:', err);
      return res.status(500).json({ success: false, error: 'Erro ao salvar holerite.' });
    }

    return res.status(200).json({ success: true, data: dados });
  } catch (error) {
    console.error('Erro ao importar holerite:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

