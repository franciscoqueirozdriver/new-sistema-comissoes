import { calcularDSRporPagamento, formatCurrency } from '@/src/lib/calculoDSRporPagamento';

interface Pagamento {
    id_pagamento: string;
    data_prevista: string;
    empresa: string;
    tipo: string;
    parcela_formatada?: string;
    num_parcela: number;
    valor_bruto: string;
    percentual_imposto: string;
    percentual_comissao: string;
    status: string;
    // Add other properties from your pagamentos data structure
}

interface Mostrar {
    comissaoBruto: boolean;
    comissaoLiquido: boolean;
    dsrBruto: boolean;
    dsrLiquido: boolean;
}

interface RelatorioDSRTableProps {
    pagamentos: Pagamento[];
    mostrar: Mostrar;
    usarComSabado: boolean;
    diasComSabado: number;
    diasSemSabado: number;
    diasDescanso: number;
    compacto?: boolean;
    ocultarData?: boolean;
    ocultarStatus?: boolean;
    ocultarTipo?: boolean;
}

export default function RelatorioDSRTable({
  pagamentos,
  mostrar,
  usarComSabado,
  diasComSabado,
  diasSemSabado,
  diasDescanso,
  compacto = false,
  ocultarData = false,
  ocultarStatus = false,
  ocultarTipo = false
}: RelatorioDSRTableProps) {
  const linhas = pagamentos.map(p => ({
    row: p,
    calc: calcularDSRporPagamento(p, {
      usarComSabado,
      diasComSabado,
      diasSemSabado,
      diasDescanso
    })
  }));

  const hideData = compacto || ocultarData;
  const hideStatus = compacto || ocultarStatus;
  const hideTipo = compacto || ocultarTipo;

  const totais = linhas.reduce((acc, l) => {
    acc.comissaoBruta += l.calc.comissaoBruta;
    acc.comissaoLiquida += l.calc.comissaoLiquida;
    acc.dsrBruto += l.calc.dsrBruto;
    acc.dsrLiquido += l.calc.dsrLiquido;
    return acc;
  }, {
    comissaoBruta: 0,
    comissaoLiquida: 0,
    dsrBruto: 0,
    dsrLiquido: 0
  });

  const baseColSpan = 8 - [hideData, hideTipo].filter(Boolean).length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-gray-100">
          <tr>
            {!hideData && <th className="p-2 border">Data de Pagamento</th>}
            <th className="p-2 border">Empresa</th>
            {!hideTipo && <th className="p-2 border">Tipo</th>}
            <th className="p-2 border">Parcela</th>
            <th className="p-2 border">Valor Bruto</th>
            <th className="p-2 border">% Imposto</th>
            <th className="p-2 border">Líquido da Venda</th>
            <th className="p-2 border">% Comissão</th>
            {mostrar.comissaoBruto && <th className="p-2 border">Comissão Bruta</th>}
            {mostrar.comissaoLiquido && <th className="p-2 border">Comissão Líquida</th>}
            {mostrar.dsrBruto && <th className="p-2 border">DSR Bruto</th>}
            {mostrar.dsrLiquido && <th className="p-2 border">DSR Líquido</th>}
            {!hideStatus && <th className="p-2 border">Status</th>}
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ row, calc }) => (
            <tr key={row.id_pagamento} className="border-b">
              {!hideData && <td className="p-2 border">{row.data_prevista}</td>}
              <td className="p-2 border">{row.empresa}</td>
              {!hideTipo && <td className="p-2 border">{row.tipo}</td>}
              <td className="p-2 border">{row.parcela_formatada || row.num_parcela}</td>
              <td className="p-2 border">{row.valor_bruto}</td>
              <td className="p-2 border">{row.percentual_imposto}</td>
              <td className="p-2 border">{formatCurrency(calc.liquidoVenda)}</td>
              <td className="p-2 border">{row.percentual_comissao}</td>
              {mostrar.comissaoBruto && <td className="p-2 border">{formatCurrency(calc.comissaoBruta)}</td>}
              {mostrar.comissaoLiquido && <td className="p-2 border">{formatCurrency(calc.comissaoLiquida)}</td>}
              {mostrar.dsrBruto && <td className="p-2 border">{formatCurrency(calc.dsrBruto)}</td>}
              {mostrar.dsrLiquido && <td className="p-2 border">{formatCurrency(calc.dsrLiquido)}</td>}
              {!hideStatus && <td className="p-2 border">{row.status}</td>}
            </tr>
          ))}
        </tbody>
        <tfoot className="font-bold bg-gray-50">
          <tr>
            <td colSpan={baseColSpan} className="p-2 border text-right">Totais</td>
            {mostrar.comissaoBruto && <td className="p-2 border">{formatCurrency(totais.comissaoBruta)}</td>}
            {mostrar.comissaoLiquido && <td className="p-2 border">{formatCurrency(totais.comissaoLiquida)}</td>}
            {mostrar.dsrBruto && <td className="p-2 border">{formatCurrency(totais.dsrBruto)}</td>}
            {mostrar.dsrLiquido && <td className="p-2 border">{formatCurrency(totais.dsrLiquido)}</td>}
            {!hideStatus && <td className="p-2 border"></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
