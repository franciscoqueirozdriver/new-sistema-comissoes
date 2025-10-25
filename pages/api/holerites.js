import { appendRows, getSheetData } from '@/lib/googleSheetsService';
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

  const { mes, salario_base, comissao, dsr, dias_dsr, data_pagamento = '', user_email, fonte_arquivo } = req.body;

  if (!mes || !salario_base || !comissao || !dsr || !dias_dsr || !user_email || !fonte_arquivo) {
    return res.status(400).json({ error: 'Dados insuficientes.' });
  }

  try {
    const { header, rows } = await getSheetData('Holerites');
    const idxMes = header.indexOf('mes');
    const idxSalario = header.indexOf('salario_base');
    const idxComissao = header.indexOf('comissao');
    const idxDsr = header.indexOf('dsr');
    const idxDiasDsr = header.indexOf('dias_dsr');
    const idxEmail = header.indexOf('user_email');
    const idxId = header.indexOf('holerite_id');

    const duplicado =
      idxMes !== -1 &&
      idxSalario !== -1 &&
      idxComissao !== -1 &&
      idxDsr !== -1 &&
      idxDiasDsr !== -1 &&
      idxEmail !== -1 &&
      rows.some(
        (r) =>
          r[idxMes] === mes &&
          r[idxSalario] === salario_base &&
          r[idxComissao] === comissao &&
          r[idxDsr] === dsr &&
          r[idxDiasDsr] === dias_dsr &&
          r[idxEmail] === user_email
      );

    if (duplicado) {
      console.log(
        `❌ Holerite duplicado detectado para ${mes} - usuário ${user_email} - valores iguais já existem.`
      );
      return res
        .status(409)
        .json({ error: 'Holerite já existente com os mesmos dados para este usuário e mês.' });
    }

    function gerarHoleriteID(mes, email, existing) {
      const [mm, aaaa] = mes.split('/');
      const userHash = email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4);

      const prefix = `${mm}${aaaa}-${userHash}`;
      const count = existing.filter((row) => row.holerite_ID?.startsWith(prefix)).length + 1;

      return `${prefix}-${count}`;
    }

    const existingForId = rows.map((r) => ({
      holerite_ID: idxId !== -1 ? r[idxId] : undefined,
    }));

    const holeriteID = gerarHoleriteID(mes, user_email, existingForId);
    console.log('holerite_ID gerado:', holeriteID);

    const row = [
      mes,
      salario_base,
      comissao,
      dsr,
      dias_dsr,
      data_pagamento,
      user_email,
      fonte_arquivo,
      holeriteID,
    ];
    console.log('Dados enviados para planilha Holerites:', row);
    await appendRows('Holerites', [row]);
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar holerite:', error);
    return res.status(500).json({ error: 'Erro ao salvar holerite.' });
  }
}

