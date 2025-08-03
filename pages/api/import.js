import xlsx from 'xlsx';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });

  await new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Failed to parse form' });
        return resolve();
      }

      console.log('Import API - Campos:', fields);
      console.log('Import API - Arquivos recebidos:', files);

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return resolve();
      }

      try {
        const name = (file.originalFilename || '').toLowerCase();
        const buffer = await fs.promises.readFile(file.filepath);

        console.log('API Import - Tipo de arquivo:', file.mimetype);
        let result = { columns: [], rows: [] };

        if (name.endsWith('.xlsx') || name.endsWith('.csv')) {
          const workbook = xlsx.read(buffer, { type: 'buffer' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
          const columns = json[0] || [];
          const rows = json.slice(1).map(r => columns.map((_, idx) => (r[idx] ?? '').toString()));
          result = { columns, rows };
        } else if (name.endsWith('.pdf')) {
          const data = await pdfParse(buffer).catch(() => null);
          const text = data?.text?.trim();
          if (!text) {
            console.log('API Import - PDF sem texto detectado');
            res.status(400).json({ error: 'PDF sem texto ou não suportado para importação.' });
            return resolve();
          }
          const lines = text.split('\n').filter(Boolean);
          const rows = lines.map(line => line.split(/[\s,;]+/));
          const columns = rows.shift() || [];
          result = { columns, rows };
        } else if (name.match(/\.(png|jpg|jpeg)$/)) {
          const ocr = await Tesseract.recognize(buffer, 'eng');
          const lines = ocr.data.text.split('\n').filter(Boolean);
          const rows = lines.map(line => line.split(/[\s,;]+/));
          const columns = rows.shift() || [];
          result = { columns, rows };
        } else {
          res.status(400).json({ error: 'Unsupported file type' });
          return resolve();
        }

        console.log('API Import - Dados extraídos:', result);
        res.status(200).json({ success: true, parsedData: result });
        return resolve();
      } catch (e) {
        console.error('Import error:', e);
        res.status(500).json({ error: e.message });
        return resolve();
      }
    });
  });
}

