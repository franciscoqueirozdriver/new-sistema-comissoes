// /pages/api/relatorios/metas-vs-realizado.js
import { getSheetData } from "@/lib/googleSheetsService";

export const dynamic = 'force-dynamic';

const parseCurrency = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  try {
    const { ano } = req.query;
    if (!ano) {
      return res.status(400).json({ error: "O parâmetro 'ano' é obrigatório." });
    }
    const anoNum = parseInt(ano, 10);

    // Busca as metas e oportunidades em paralelo
    const [metasData, oportunidadesData] = await Promise.all([
      getSheetData("Metas"),
      getSheetData("Oportunidades"),
    ]);

    // 1. Processa as Metas
    const metasPorMes = new Map();
    metasData.rows.forEach(row => {
      const [mes, anoMeta] = row[0].split('/');
      if (parseInt(anoMeta, 10) === anoNum) {
        metasPorMes.set(parseInt(mes, 10), {
          meta_implantacao: parseCurrency(row[1]),
          meta_mensalidade: parseCurrency(row[2]),
        });
      }
    });

    // 2. Processa os Valores Realizados
    const realizadoPorMes = Array.from({ length: 12 }, () => ({
      realizado_implantacao: 0,
      realizado_mensalidade: 0,
    }));

    oportunidadesData.rows.forEach(row => {
      // Usando 'data_fechamento' para considerar uma oportunidade como "realizada"
      const dataFechamentoStr = row[oportunidadesData.header.indexOf('data_fechamento')];
      if (!dataFechamentoStr) return;

      try {
        const dataFechamento = new Date(dataFechamentoStr + 'T00:00:00');
        if (dataFechamento.getFullYear() === anoNum) {
          const mesIndex = dataFechamento.getMonth(); // 0-11
          
          if (String(row[oportunidadesData.header.indexOf('fase_do_funil')]).toLowerCase() === 'ganho') {
            realizadoPorMes[mesIndex].realizado_implantacao += parseCurrency(row[oportunidadesData.header.indexOf('valor_implantacao')]);
            realizadoPorMes[mesIndex].realizado_mensalidade += parseCurrency(row[oportunidadesData.header.indexOf('valor_mensalidade')]);
          }
        }
      } catch (e) {
        // Ignora datas mal formatadas
      }
    });

    // 3. Monta o relatório final
    const relatorioFinal = [];
    for (let i = 1; i <= 12; i++) {
      const meta = metasPorMes.get(i) || { meta_implantacao: 0, meta_mensalidade: 0 };
      const realizado = realizadoPorMes[i - 1]; // Ajusta o índice do array (0-11)
      relatorioFinal.push({
        mes: `${String(i).padStart(2, '0')}/${anoNum}`,
        ...meta,
        ...realizado,
      });
    }

    res.status(200).json(relatorioFinal);

  } catch (error) {
    console.error("Erro na API de Relatório de Metas:", error);
    res.status(500).json({ error: "Erro interno ao gerar o relatório de metas." });
  }
}
