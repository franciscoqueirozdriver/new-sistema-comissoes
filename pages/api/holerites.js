import { appendRows } from '@/lib/googleSheetsService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export const dynamic = 'force-dynamic';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  const { mes, salario_base, comissao, dsr, dias_dsr, data_pagamento, fonte_arquivo } = req.body;

  if (!mes || !salario_base || !comissao || !dsr || !dias_dsr || !data_pagamento) {
    return res.status(400).json({ error: 'Dados insuficientes.' });
  }

  try {
    await appendRows('Holerites', [[
      mes,
      salario_base,
      comissao,
      dsr,
      dias_dsr,
      data_pagamento,
      session.user.email,
      fonte_arquivo || '',
    ]]);
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar holerite:', error);
    return res.status(500).json({ error: 'Erro ao salvar holerite.' });
  }
}

