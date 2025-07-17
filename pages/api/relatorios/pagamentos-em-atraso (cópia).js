import { getSheetData } from "@/lib/googleSheetsService";

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
  if (req.method !== 'GET') {
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  try {
    const [pagamentosData, oportunidadesData] = await Promise.all([
      getSheetData("Pagamentos"),
      getSheetData("Oportunidades"),
    ]);

    const pagamentos = rowsToObjects(pagamentosData.header, pagamentosData.rows);
    const oportunidades = rowsToObjects(oportunidadesData.header, oportunidadesData.rows);
    
    // --- CORREÇÃO APLICADA AQUI ---
    // Cria um mapa que armazena a FASE e o NOME da empresa para cada oportunidade
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
          fase_oportunidade: infoOp ? infoOp.fase : "desconhecida", // Adiciona a fase ao pagamento
          dataPrevistaObj: dataPrevista
        };
      })
      .filter(p => {
        // Agora, o filtro inclui a verificação da fase "ganho"
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
