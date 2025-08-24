import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { getSheetData, appendRows, updateSheet } from "@/lib/googleSheetsService";

export const dynamic = 'force-dynamic';

const COLUMNS = [
  "mes","competencia","empresa","salario_base","comissao","dsr","dias_dsr",
  "valor_bruto","valor_liquido","data_pagamento","user_email","fonte_arquivo",
  "holerite_ID","rubricas_json","status_validacao"
];

export default async function handler(req, res){
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  try {
    const body = req.body || {};
    const required = ["competencia","empresa","comissao","dsr","valor_bruto","valor_liquido","user_email","fonte_arquivo","holerite_ID","status_validacao"];
    for(const f of required){
      if(!body[f]) return res.status(400).json({ error: `Campo obrigatório: ${f}` });
    }

    if(body.data_pagamento && !body.mes){
      body.mes = body.data_pagamento.slice(0,7);
    }

    const { header, rows } = await getSheetData('Holerites');
    const idIndex = header.indexOf('holerite_id');
    let rowIndex = -1;
    if(idIndex >=0){
      rowIndex = rows.findIndex(r => r[idIndex] === body.holerite_ID);
    }
    if(rowIndex === -1){
      const empIdx = header.indexOf('empresa');
      const compIdx = header.indexOf('competencia');
      const userIdx = header.indexOf('user_email');
      const fonteIdx = header.indexOf('fonte_arquivo');
      if(empIdx>=0 && compIdx>=0 && userIdx>=0 && fonteIdx>=0){
        rowIndex = rows.findIndex(r => r[empIdx]===body.empresa && r[compIdx]===body.competencia && r[userIdx]===body.user_email && r[fonteIdx]===body.fonte_arquivo);
      }
    }

    const row = COLUMNS.map(c => body[c] || "");
    if(rowIndex >=0){
      rows[rowIndex] = row;
      await updateSheet('Holerites', [header, ...rows]);
      return res.status(200).json({ success:true, holerite_ID: body.holerite_ID, updated: true });
    } else {
      await appendRows('Holerites', [row]);
      return res.status(201).json({ success:true, holerite_ID: body.holerite_ID });
    }
  } catch (error){
    console.error('Erro API /api/holerites', error);
    return res.status(500).json({ error: 'Erro ao gravar holerite' });
  }
}
