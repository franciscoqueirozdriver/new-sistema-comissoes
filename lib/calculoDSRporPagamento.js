export function parseCurrency(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor || typeof valor !== 'string') return 0;
  const numeroLimpo = valor
    .replace(/R\$\s?/, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(numeroLimpo) || 0;
}

export function parsePercentage(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor || typeof valor !== 'string') return 0;
  const numeroLimpo = valor.replace('%', '').replace(',', '.');
  return parseFloat(numeroLimpo) || 0;
}

export function formatCurrency(valor) {
  return (valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function calcularDSRporPagamento(row, {
  usarComSabado,
  diasComSabado,
  diasSemSabado,
  diasDescanso
}) {
  const valorBruto = parseCurrency(row.valor_bruto);
  const percentualImposto = parsePercentage(row.percentual_imposto);
  const percentualComissao = parsePercentage(row.percentual_comissao);

  const liquidoVenda = valorBruto * (1 - percentualImposto / 100);
  const comissaoBruta = valorBruto * (percentualComissao / 100);
  const comissaoLiquida = liquidoVenda * (percentualComissao / 100);

  const divisor = usarComSabado ? diasComSabado : diasSemSabado;
  const dsrBruto = divisor ? (comissaoBruta / divisor) * diasDescanso : 0;
  const dsrLiquido = divisor ? (comissaoLiquida / divisor) * diasDescanso : 0;

  return {
    liquidoVenda,
    comissaoBruta,
    comissaoLiquida,
    dsrBruto,
    dsrLiquido
  };
}
