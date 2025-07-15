import { getSheetData } from "@/lib/googleSheetsService";

export const dynamic = 'force-dynamic'; // <-- LINHA ADICIONADA

/**
 * Transforma linhas de uma planilha em um array de objetos, usando o cabeçalho como chaves.
 */
function rowsToObjects(header, rows) {
  return rows.map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i] || "";
    });
    return obj;
  });
}

export default async function handler(req, res) {
  // O endpoint só aceitará o método GET por enquanto
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  try {
    // 1. Extrai os filtros da URL da requisição
    const { ano, mes, empresa, status } = req.query;

    // 2. Busca os dados brutos das duas planilhas em paralelo
    const [pagamentosData, oportunidadesData] = await Promise.all([
      getSheetData("Pagamentos"),
      getSheetData("Oportunidades"),
    ]);
    
    // Transforma os dados em arrays de objetos para facilitar a manipulação
    let pagamentos = rowsToObjects(pagamentosData.header, pagamentosData.rows);
    const oportunidades = rowsToObjects(oportunidadesData.header, oportunidadesData.rows);

    // 3. Cria um "mapa" para ligar o ID da oportunidade ao nome da empresa
    const empresaPorId = new Map(oportunidades.map(op => [op.id, op.empresa]));

    // 4. Enriquece os dados de pagamento com o nome da empresa
    let pagamentosEnriquecidos = pagamentos.map(pagamento => ({
      ...pagamento,
      empresa: empresaPorId.get(pagamento.id_oportunidade) || "Desconhecido",
    }));

    // 5. Aplica os filtros, se eles foram fornecidos na URL
    if (ano && mes) {
      const anoNum = parseInt(ano, 10);
      const mesNum = parseInt(mes, 10);
      pagamentosEnriquecidos = pagamentosEnriquecidos.filter(p => {
        if (!p.data_prevista) return false;
        const data = new Date(p.data_prevista + 'T00:00:00');
        return data.getFullYear() === anoNum && data.getMonth() + 1 === mesNum;
      });
    }

    if (status) {
      pagamentosEnriquecidos = pagamentosEnriquecidos.filter(p => 
        p.status && p.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    if (empresa) {
        pagamentosEnriquecidos = pagamentosEnriquecidos.filter(p => 
        p.empresa && p.empresa.toLowerCase().includes(empresa.toLowerCase())
      );
    }

    // 6. Retorna a lista de pagamentos (já filtrada)
    res.status(200).json(pagamentosEnriquecidos);

  } catch (error) {
    console.error("Erro na API /api/pagamentos:", error);
    res.status(500).json({ error: "Erro interno ao buscar pagamentos." });
  }
}
