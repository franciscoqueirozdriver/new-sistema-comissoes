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
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Método ${req.method} não permitido.`);
  }

  try {
    const { ano, mes, empresa, status, id_oportunidade, visao } = req.query;

    const [pagamentosData, oportunidadesData] = await Promise.all([
      getSheetData("Pagamentos"),
      getSheetData("Oportunidades"),
    ]);
    
    let pagamentos = rowsToObjects(pagamentosData.header, pagamentosData.rows);
    let oportunidades = rowsToObjects(oportunidadesData.header, oportunidadesData.rows);

    // --- LÓGICA DE SEGURANÇA ATUALIZADA ---
    if (session.user.role !== 'admin' || visao !== 'todos') {
      const userOportunidades = oportunidades.filter(op => op.user_email === session.user.email);
      const idsPermitidos = new Set(userOportunidades.map(op => op.id));
      oportunidades = userOportunidades;
      pagamentos = pagamentos.filter(p => idsPermitidos.has(p.id_oportunidade));
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    const infoOportunidades = new Map(oportunidades.map(op => [
        op.id, { 
          empresa: op.empresa, 
          comissao: op.comissao,
          percentual_imposto: op.percentual_imposto
        }
    ]));
    
    const totalParcelas = {};
    pagamentos.forEach(p => {
        const key = `${p.id_oportunidade}_${p.tipo}`;
        if (!totalParcelas[key]) totalParcelas[key] = 0;
        totalParcelas[key] += 1;
    });

    let pagamentosEnriquecidos = pagamentos.map(pagamento => {
      const infoOp = infoOportunidades.get(pagamento.id_oportunidade);
      const valorBruto = parseFloat(String(pagamento.valor_bruto || "0").replace(/\./g, "").replace(",", "."));
      const impostoPct = infoOp ? parseFloat(String(infoOp.percentual_imposto || "0").replace(",", ".")) : 0;
      const comissaoPct = infoOp ? parseFloat(String(infoOp.comissao || "0").replace(",", ".")) : 0.20;
      const liquidoVenda = valorBruto * (1 - impostoPct);
      const totalKey = `${pagamento.id_oportunidade}_${pagamento.tipo}`;
      const total = totalParcelas[totalKey] || 1;
      const parcelaFormatada = `${pagamento.num_parcela} de ${total}`;
      
      return {
        ...pagamento,
        empresa: infoOp ? infoOp.empresa : "Desconhecido",
        valor_bruto: valorBruto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        liquido_venda: liquidoVenda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        valor_liquido_comissao: (liquidoVenda * comissaoPct).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        percentual_imposto: `${(impostoPct * 100).toFixed(0)}%`,
        percentual_comissao: `${(comissaoPct * 100).toFixed(0)}%`,
        parcela_formatada: parcelaFormatada,
      };
    });

    if (id_oportunidade) {
        pagamentosEnriquecidos = pagamentosEnriquecidos.filter(p => p.id_oportunidade === id_oportunidade);
    } else {
        if (ano && mes) {
            const anoNum = parseInt(ano, 10);
            const mesNum = parseInt(mes, 10);
            pagamentosEnriquecidos = pagamentosEnriquecidos.filter(p => {
                if (!p.data_prevista) return false;
                try {
                    const data = new Date(p.data_prevista + 'T00:00:00');
                    return data.getFullYear() === anoNum && data.getMonth() + 1 === mesNum;
                } catch (e) { return false; }
            });
        }
        if (status) {
            pagamentosEnriquecidos = pagamentosEnriquecidos.filter(p => p.status && p.status.toLowerCase() === status.toLowerCase());
        }
        if (empresa) {
            pagamentosEnriquecidos = pagamentosEnriquecidos.filter(p => p.empresa && p.empresa.toLowerCase().includes(empresa.toLowerCase()));
        }
    }

    res.status(200).json(pagamentosEnriquecidos);

  } catch (error) {
    console.error("Erro na API /api/pagamentos:", error);
    res.status(500).json({ error: "Erro interno ao buscar pagamentos." });
  }
}
