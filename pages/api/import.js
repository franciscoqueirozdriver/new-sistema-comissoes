import xlsx from 'xlsx';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { convert } from 'pdf-poppler';

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

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return resolve();
      }

      try {
        const name = (file.originalFilename || '').toLowerCase();
        const buffer = await fs.promises.readFile(file.filepath);

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
          let text = data?.text?.trim() || '';
          if (!text) {
            // Attempt OCR on each PDF page by converting to images
            const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pdf-'));
            await convert(file.filepath, { format: 'png', out_dir: tmpDir, out_prefix: 'page' });
            const images = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort();
            let combined = '';
            for (const img of images) {
              const { data: { text: pageText } } = await Tesseract.recognize(path.join(tmpDir, img), 'eng');
              combined += '\n' + pageText;
              await fs.promises.unlink(path.join(tmpDir, img));
            }
            await fs.promises.rmdir(tmpDir);
            text = combined.trim();
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

        res.status(200).json(result);
      } catch (e) {
        console.error('Import error:', e);
        res.status(500).json({ error: e.message });
      }

      resolve();
    });
  });
}

