import { getSheetData } from "@/lib/googleSheetsService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export const dynamic = 'force-dynamic';

function rowsToObjects(header, rows) {
  return rows.map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key.toLowerCase().replace(/ /g, '_')] = row[i] || "";
    });
    return obj;
  });
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.status !== 'aprovado') {
    return res.status(401).json({ error: "Não autorizado." });
  }

  if (req.method !== 'GET') {
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  try {
    const { visao } = req.query; // Pega o novo parâmetro 'visao'

    let [pagamentosData, oportunidadesData] = await Promise.all([
      getSheetData("Pagamentos"),
      getSheetData("Oportunidades"),
    ]);

    let pagamentos = rowsToObjects(pagamentosData.header, pagamentosData.rows);
    let oportunidades = rowsToObjects(oportunidadesData.header, oportunidadesData.rows);
    
    // --- LÓGICA DE SEGURANÇA ATUALIZADA ---
    // A condição para filtrar agora é: se o usuário NÃO for admin, OU se ele FOR admin mas NÃO estiver pedindo a visão 'todos'.
    if (session.user.role !== 'admin' || visao !== 'todos') {
      const userOportunidades = oportunidades.filter(op => op.user_email === session.user.email);
      const idsPermitidos = new Set(userOportunidades.map(op => op.id));
      
      // Filtra os pagamentos e as oportunidades antes de qualquer cálculo
      oportunidades = userOportunidades;
      pagamentos = pagamentos.filter(p => idsPermitidos.has(p.id_oportunidade));
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---
    
    const infoOportunidades = new Map(oportunidades.map(op => [
        op.id, 
        { 
            empresa: op.empresa, 
            fase: String(op.fase_do_funil || "").toLowerCase() 
        }
    ]));

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const pagamentosAtrasados = pagamentos
      .map(p => {
        const dataPrevista = p.data_prevista ? new Date(p.data_prevista + 'T00:00:00') : null;
        const infoOp = infoOportunidades.get(p.id_oportunidade);
        
        return {
          ...p,
          empresa: infoOp ? infoOp.empresa : "Desconhecido",
          fase_oportunidade: infoOp ? infoOp.fase : "desconhecida",
          dataPrevistaObj: dataPrevista
        };
      })
      .filter(p => {
        const statusValido = p.status && p.status.toLowerCase() === 'previsto';
        const dataValida = p.dataPrevistaObj instanceof Date && !isNaN(p.dataPrevistaObj);
        const oportunidadeGanha = p.fase_oportunidade === 'ganho';
        
        return statusValido && dataValida && oportunidadeGanha && p.dataPrevistaObj < hoje;
      })
      .map(p => {
        const diffTime = Math.abs(hoje - p.dataPrevistaObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return { ...p, dias_em_atraso: diffDays };
      });

    const pagamentosOrdenados = pagamentosAtrasados.sort((a, b) => b.dias_em_atraso - a.dias_em_atraso);

    res.status(200).json(pagamentosOrdenados);

  } catch (error) {
    console.error("Erro na API de Pagamentos em Atraso:", error);
    res.status(500).json({ error: "Erro interno ao gerar o relatório." });
  }
}
