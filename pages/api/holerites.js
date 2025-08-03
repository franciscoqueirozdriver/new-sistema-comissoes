import { getSheetData, appendRows } from '@/lib/googleSheetsService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { normalizeMes } from '@/lib/mesUtils';

export const dynamic = 'force-dynamic';

const SHEET_NAME = 'Holerite';
const HEADER = ['mes','salario_base','comissao','dsr','dias_dsr','data_pagamento','user_email','fonte_arquivo'];

function rowsToObjects(header, rows){
  return rows.map(row => {
    const obj = {};
    header.forEach((key, i) => { obj[key] = row[i] || ''; });
    return obj;
  });
}

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: 'Não autorizado ou pendente de aprovação.' });
  }

  try {
    if (req.method === 'POST') {
      const { rows } = req.body; // array of objects
      if (!Array.isArray(rows)) return res.status(400).json({ error: 'Corpo inválido' });
      const toAppend = rows.map(r => {
        const normalizedMes = normalizeMes(r.mes);
        const dias = parseInt(String(r.dias_dsr).replace(/[^0-9]/g,''),10) || 0;
        const obj = {
          mes: normalizedMes,
          salario_base: r.salario_base || '',
          comissao: r.comissao || '',
          dsr: r.dsr || '',
          dias_dsr: String(dias),
          data_pagamento: r.data_pagamento || '',
          user_email: session.user.email,
          fonte_arquivo: r.fonte_arquivo || '',
        };
        return HEADER.map(h => obj[h] || '');
      });
      await appendRows(SHEET_NAME, toAppend);
      return res.status(201).json({ success: true });
    }

    if (req.method === 'GET') {
      const { mes, user_email } = req.query;
      const normalizedMes = normalizeMes(mes);
      const { header, rows } = await getSheetData(SHEET_NAME);
      const objs = rowsToObjects(header, rows);
      const filtered = objs.filter(r => {
        const mesOk = normalizedMes ? normalizeMes(r.mes) === normalizedMes : true;
        const email = user_email || session.user.email;
        return r.user_email === email && mesOk;
      });
      return res.status(200).json(filtered);
    }

    res.setHeader('Allow', ['GET','POST']);
    return res.status(405).end(`Método ${req.method} não permitido.`);
  } catch (err) {
    console.error('Erro na API /api/holerites:', err);
    return res.status(500).json({ error: 'Erro ao processar a requisição.', details: err.message });
  }
}
