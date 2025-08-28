export function parseCurrency(valor: string | number | null | undefined): number {
  if (typeof valor === 'number') return valor;
  if (!valor || typeof valor !== 'string') return 0;
  const numeroLimpo = valor
    .replace(/R\$\s?/, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(numeroLimpo) || 0;
}

export function parsePercentage(valor: string | number | null | undefined): number {
  if (typeof valor === 'number') return valor;
  if (!valor || typeof valor !== 'string') return 0;
  const numeroLimpo = valor.replace('%', '').replace(',', '.');
  return parseFloat(numeroLimpo) || 0;
}

export function formatCurrency(valor: number): string {
  return (valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

interface PagamentoRow {
    valor_bruto: string | number;
    percentual_imposto: string | number;
    percentual_comissao: string | number;
}

interface CalculoOptions {
    usarComSabado: boolean;
    diasComSabado: number;
    diasSemSabado: number;
    diasDescanso: number;
}

export function calcularDSRporPagamento(row: PagamentoRow, {
  usarComSabado,
  diasComSabado,
  diasSemSabado,
  diasDescanso
}: CalculoOptions) {
  const valorBruto = parseCurrency(row.valor_bruto);
  const percentualImposto = parsePercentage(row.percentual_imposto);
  const percentualComissao = parsePercentage(row.percentual_comissao);

  const liquidoVenda = valorBruto * (1 - percentualImposto / 100);
  const comissaoBruta = valorBruto * (percentualComissao / 100);
  const comissaoLiquida = liquidoVenda * (percentualComissao / 100);

  const divisor = usarComSabado ? diasComSabado : diasSemSabado;
  const dsrBruto = divisor > 0 ? (comissaoBruta / divisor) * diasDescanso : 0;
  const dsrLiquido = divisor > 0 ? (comissaoLiquida / divisor) * diasDescanso : 0;

  return {
    liquidoVenda,
    comissaoBruta,
    comissaoLiquida,
    dsrBruto,
    dsrLiquido
  };
}
