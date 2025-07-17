// /lib/financeiroService.js (Versão Definitiva com Conversores Corretos)

// Converte strings de moeda (ex: "1.500,50") para número
const parseCurrency = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

// Converte strings de percentual (ex: "0,19") para número
const parsePercentage = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    const numeroLimpo = String(valor).replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

// Formata um número para string com vírgula decimal para salvar na planilha
const formatForSheet = (num) => String(Number(num).toFixed(2)).replace('.', ',');

export function gerarPagamentos(idOportunidade, dadosOportunidade) {
  const pagamentos = [];
  
  // Usa o conversor CORRETO para cada campo
  const percentualImposto = parsePercentage(dadosOportunidade.percentual_imposto);
  const dataBase = new Date(dadosOportunidade.data_primeiro_pagamento_mensal + 'T00:00:00');
  const percentualComissao = parsePercentage(dadosOportunidade.comissao);

  let proximoIdPagamento = new Date().getTime(); 

  // --- LÓGICA PARA IMPLANTAÇÃO ---
  const valorImplantacao = parseCurrency(dadosOportunidade.valor_implantacao);
  const parcelasImplantacao = parseInt(dadosOportunidade.parcelas_implantacao, 10);
  if (valorImplantacao > 0 && parcelasImplantacao > 0) {
    const valorUnitario = valorImplantacao / parcelasImplantacao;
    // O cálculo agora usa os valores corretos (ex: 1 - 0.19)
    const valorLiquido = valorUnitario * percentualComissao * (1 - percentualImposto);
    
    for (let i = 0; i < parcelasImplantacao; i++) {
      const dataPrevista = new Date(dataBase);
      dataPrevista.setMonth(dataPrevista.getMonth() + i);
      
      pagamentos.push([
        String(proximoIdPagamento++), String(idOportunidade), 'Implantação', String(i + 1),
        formatForSheet(valorUnitario),
        formatForSheet(percentualImposto),
        formatForSheet(valorLiquido),
        dataPrevista.toISOString().split("T")[0], "", "Previsto",
      ]);
    }
  }
  
  // --- LÓGICA PARA MENSALIDADE ---
  const valorMensalidade = parseCurrency(dadosOportunidade.valor_mensalidade);
  const qtdMensalidades = parseInt(dadosOportunidade.qtde_mensalidades, 10);
  if (valorMensalidade > 0 && qtdMensalidades > 0) {
    const valorBrutoMensalidade = valorMensalidade;
    const valorLiquido = valorBrutoMensalidade * percentualComissao * (1 - percentualImposto);
    
    for (let i = 0; i < qtdMensalidades; i++) {
      const startMonthOffset = parcelasImplantacao || 0;
      const dataPrevista = new Date(dataBase);
      dataPrevista.setMonth(dataPrevista.getMonth() + startMonthOffset + i);

      pagamentos.push([
        String(proximoIdPagamento++), String(idOportunidade), 'Mensalidade', String(i + 1),
        formatForSheet(valorBrutoMensalidade),
        formatForSheet(percentualImposto),
        formatForSheet(valorLiquido),
        dataPrevista.toISOString().split("T")[0], "", "Previsto",
      ]);
    }
  }

  return pagamentos;
}
