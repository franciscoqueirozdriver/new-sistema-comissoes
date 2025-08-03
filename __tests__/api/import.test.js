import path from 'path';
import fs from 'fs';
import request from 'supertest';
import handler from '../../pages/api/import';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

jest.mock('pdf-parse');
jest.mock('tesseract.js', () => ({ recognize: jest.fn() }));
jest.mock('pdf-lib');

const server = (req, res) => handler(req, res);

const fixtures = (file) => path.join(__dirname, '..', 'fixtures', file);

describe('/api/import', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('processa PDF digital com pdf-parse', async () => {
    pdfParse.mockResolvedValue({ text: 'Col1 Col2\nVal1 Val2' });
    const res = await request(server)
      .post('/api/import')
      .attach('file', fixtures('sample.pdf'));

    expect(pdfParse).toHaveBeenCalled();
    expect(Tesseract.recognize).not.toHaveBeenCalled();
    expect(res.body.parsedData.columns).toEqual(['Col1', 'Col2']);
    expect(res.body.success).toBe(true);
  });

  test('processa PDF escaneado com OCR', async () => {
    pdfParse.mockResolvedValue({ text: '' });
    PDFDocument.load.mockResolvedValue({
      getPages: () => [{
        node: {
          Resources: () => ({
            lookup: () => ({
              entries: () => [[null, { contents: fs.readFileSync(fixtures('scan.png')) }]],
              lookup: () => ({ contents: fs.readFileSync(fixtures('scan.png')) }),
            }),
          }),
        },
      }],
    });
    Tesseract.recognize.mockResolvedValue({ data: { text: 'Col1 Col2\nVal1 Val2' } });

    const res = await request(server)
      .post('/api/import')
      .attach('file', fixtures('scan.pdf'));

    expect(PDFDocument.load).toHaveBeenCalled();
    expect(Tesseract.recognize).toHaveBeenCalled();
    expect(res.body.parsedData.columns).toEqual(['Col1', 'Col2']);
    expect(res.body.success).toBe(true);
  });

  test('processa imagem com OCR direto', async () => {
    Tesseract.recognize.mockResolvedValue({ data: { text: 'Col1 Col2\nVal1 Val2' } });

    const res = await request(server)
      .post('/api/import')
      .attach('file', fixtures('sample.png'));

    expect(pdfParse).not.toHaveBeenCalled();
    expect(Tesseract.recognize).toHaveBeenCalled();
    expect(res.body.parsedData.columns).toEqual(['Col1', 'Col2']);
    expect(res.body.success).toBe(true);
  });
});

