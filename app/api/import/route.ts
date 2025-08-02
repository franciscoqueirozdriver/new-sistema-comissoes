import { NextRequest, NextResponse } from 'next/server';
import xlsx from 'xlsx';
import pdf from 'pdf-parse';
import Tesseract from 'tesseract.js';

interface ImportResponse {
  columns: string[];
  rows: string[][];
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const name = file.name.toLowerCase();

  try {
    let columns: string[] = [];
    let rows: string[][] = [];

    if (name.endsWith('.xlsx') || name.endsWith('.csv')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      columns = (json[0] || []) as string[];
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
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const response: ImportResponse = { columns, rows };
    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
