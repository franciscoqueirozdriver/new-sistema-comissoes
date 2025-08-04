import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: false,
  },
};

export const dynamic = 'force-dynamic';

function extractFields(text) {
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

  const mesMatch = text.match(
    /(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\s+de\s+(\d{4})/i
  );
  let mes = '';
  if (mesMatch) {
    const norm = mesMatch[1]
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    if (monthMap[norm]) mes = `${monthMap[norm]}/${mesMatch[2]}`;
  }

  const salarioMatch = text.match(/Horas\s+Normais[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  const comissaoMatch = text.match(/Comiss(?:ões|oes)[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  const dsrMatch = text.match(
    /Reflexo\s+Comiss(?:ões|oes)\s+DSR[\s\S]*?(\d+)[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/i
  );
  const dataMatch = text.match(/Data\s+Pagamento[:\s]+(\d{2}\/\d{2}\/\d{4})/i);

  return {
    mes,
    salario_base: salarioMatch ? salarioMatch[1] : '',
    comissao: comissaoMatch ? comissaoMatch[1] : '',
    dsr: dsrMatch ? dsrMatch[2] : '',
    dias_dsr: dsrMatch ? dsrMatch[1] : '',
    data_pagamento: dataMatch ? dataMatch[1] : '',
  };
}

function calcularQuintoDiaUtil(mes) {
  const [mesStr, anoStr] = mes.split('/');
  let mesNum = parseInt(mesStr, 10);
  let anoNum = parseInt(anoStr, 10);
  // próximo mês
  mesNum += 1;
  if (mesNum > 12) {
    mesNum = 1;
    anoNum += 1;
  }
  const date = new Date(anoNum, mesNum - 1, 1);
  let uteis = 0;
  while (uteis < 5) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      uteis += 1;
    }
    if (uteis < 5) {
      date.setDate(date.getDate() + 1);
    }
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function convertFirstPage(pdfPath) {
  const outputDir = path.dirname(pdfPath) || '/tmp';
  const converter = fromPath(pdfPath, {
    density: 300,
    saveFilename: 'page',
    savePath: outputDir,
    format: 'png',
    width: 1200,
    height: 1600,
  });
  const result = await converter(1);
  console.log('Imagem gerada em:', result.path);
  try {
    const stats = fs.statSync(result.path);
    console.log('Tamanho do PNG gerado:', stats.size, 'bytes');
  } catch (e) {
    console.log('Falha ao obter tamanho do PNG:', e.message);
  }
  return result.path;
}

async function runOcr(imagePath) {
  const { data } = await Tesseract.recognize(imagePath, 'por', {
    logger: (m) => console.log(m),
  });
  console.log('Texto OCR extraído:', data.text.trim().slice(0, 80));
  return data.text;
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
    const form = formidable({ multiples: false, keepExtensions: true, uploadDir: '/tmp' });
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
    console.log('PDF salvo em:', filePath);
    const buffer = fs.readFileSync(filePath);
    let text = '';
    let parsedText = false;

    let imagePathToDelete = null;
    try {
      if (mimetype.includes('pdf')) {
        const parsed = await pdfParse(buffer).catch(() => ({ text: '', numpages: 0 }));
        parsedText = parsed.text && parsed.text.trim().length > 0;
        console.log('pdf-parse encontrou texto:', parsedText);
        if (parsedText) {
          text = parsed.text;
        } else {
          const imagePath = await convertFirstPage(filePath);
          imagePathToDelete = imagePath;
          text = await runOcr(imagePath);
        }
      } else if (mimetype.startsWith('image/')) {
        const stats = fs.statSync(filePath);
        console.log('Imagem recebida:', filePath, 'tamanho:', stats.size, 'bytes');
        text = await runOcr(filePath);
      } else {
        return res.status(400).json({ success: false, error: 'Formato de arquivo não suportado.' });
      }
    } finally {
      if (imagePathToDelete) fs.unlink(imagePathToDelete, () => {});
      fs.unlink(filePath, () => {});
    }

    const dados = extractFields(text);
    if (!dados.data_pagamento && dados.mes) {
      dados.data_pagamento = calcularQuintoDiaUtil(dados.mes);
      console.log('Data de pagamento calculada automaticamente:', dados.data_pagamento);
    }
    console.log('Campos extraídos por regex:', dados);
    const numerosExtraidos = text.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})/g) || [];
    console.log('Números extraídos:', numerosExtraidos);
    const fileName = file.originalFilename || file.newFilename || file.name;

    return res.status(200).json({
      requiresMapping: true,
      fieldsExtracted: dados,
      fileName,
      texto_bruto: text,
      campos_extraidos: dados,
      numeros_extraidos: numerosExtraidos,
    });
  } catch (error) {
    console.error('Erro ao importar holerite:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

