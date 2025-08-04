import fs from 'fs';
import formidable from 'formidable';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { PDFDocument, PDFName } from 'pdf-lib';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: false,
  },
};

export const dynamic = 'force-dynamic';

function extractFields(text) {
  const lines = text.split(/\r?\n/);

  const monthMap = {
    janeiro: '01',
    fevereiro: '02',
    março: '03',
    marco: '03',
    abril: '04',
    maio: '05',
    junho: '06',
    julho: '07',
    agosto: '08',
    setembro: '09',
    outubro: '10',
    novembro: '11',
    dezembro: '12',
  };

  const headerMatch = text.match(/([A-Za-zçÇãÃéÉôÔ]+)\s+de\s+(\d{4})/i);
  let mes = '';
  if (headerMatch) {
    const m = headerMatch[1].toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (monthMap[m]) mes = `${monthMap[m]}/${headerMatch[2]}`;
  }

  const findValue = (pattern) => {
    const regex = new RegExp(pattern, 'i');
    const line = lines.find((l) => regex.test(l)) || '';
    const match = line.match(/([0-9]+[0-9.,]*)\s*$/);
    return match ? match[1] : '';
  };

  const salario_base = findValue('HORAS\s+NORMAIS');
  const comissao = findValue('COMISS[OÕ]ES');

  let dsr = '';
  let dias_dsr = '';
  const dsrLine = lines.find((l) => /REFLEXO\s+COMISS[OÕ]ES\s+DSR/i.test(l)) || '';
  const dsrMatch = dsrLine.match(/([0-9]+)\s+([0-9.,]+)\s*$/);
  if (dsrMatch) {
    dias_dsr = dsrMatch[1];
    dsr = dsrMatch[2];
  }

  const dataMatch = text.match(/Data\s+Pagamento[:\s]+([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);
  const data_pagamento = dataMatch ? dataMatch[1] : '';

  return { mes, salario_base, comissao, dsr, dias_dsr, data_pagamento };
}

function extractImagesFromResources(resources, pdfDoc, images) {
  if (!resources) return;
  const xObject = resources.lookup(PDFName.of('XObject'));
  if (!xObject) return;

  xObject.entries().forEach(([name, ref]) => {
    const obj = pdfDoc.context.lookup(ref);
    const subtype = obj.dict.get(PDFName.of('Subtype'));
    if (subtype === PDFName.of('Image')) {
      const bytes = obj.getContents();
      const filter = obj.dict.get(PDFName.of('Filter'));
      let ext = 'png';
      if (filter === PDFName.of('DCTDecode')) ext = 'jpg';
      images.push({ buffer: Buffer.from(bytes), ext });
    } else if (subtype === PDFName.of('Form')) {
      const res = obj.dict.get(PDFName.of('Resources'));
      extractImagesFromResources(res, pdfDoc, images);
    }
  });
}

async function pdfToImages(buffer) {
  const pdfDoc = await PDFDocument.load(buffer);
  const pages = pdfDoc.getPages();
  const images = [];

  for (const page of pages) {
    const resources = page.node.Resources();
    extractImagesFromResources(resources, pdfDoc, images);
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
          console.log('Páginas extraídas para OCR:', images.length);
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
    const fileName = file.originalFilename || file.newFilename || file.name;

    return res.status(200).json({
      requiresMapping: true,
      detectedFields: dados,
      fileName,
    });
  } catch (error) {
    console.error('Erro ao importar holerite:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

