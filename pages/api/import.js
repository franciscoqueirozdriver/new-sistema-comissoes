import xlsx from 'xlsx';
import pdf from 'pdf-parse';
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

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to parse form' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = await fs.promises.readFile(file.filepath);
      const name = (file.originalFilename || '').toLowerCase();

      let columns = [];
      let rows = [];

      if (name.endsWith('.xlsx') || name.endsWith('.csv')) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        columns = json[0] || [];
        rows = json.slice(1).map(r => columns.map((_, idx) => (r[idx] ?? '').toString()));
      } else if (name.endsWith('.pdf')) {
        const data = await pdf(buffer);
        let text = data.text.trim();
        if (!text) {
          const ocr = await Tesseract.recognize(buffer, 'eng');
          text = ocr.data.text;
        }
        const lines = text.split('\n').filter(Boolean);
        rows = lines.map(line => line.split(/[\s,;]+/));
        columns = rows.shift() || [];
      } else if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
        const ocr = await Tesseract.recognize(buffer, 'eng');
        const lines = ocr.data.text.split('\n').filter(Boolean);
        rows = lines.map(line => line.split(/[\s,;]+/));
        columns = rows.shift() || [];
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      return res.status(200).json({ columns, rows });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
}

