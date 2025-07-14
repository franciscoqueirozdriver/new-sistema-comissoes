// /lib/financeiroService.js (Versão com cálculo de mensalidade corrigido)

const parseFloatBR = (value) => parseFloat(String(value || "0").replace(/\./g, "").replace(",", "."));
const parseDecimal = (value) => parseFloat(String(value || "0").replace(",", "."));

export function gerarPagamentos(idOportunidade, dadosOportunidade) {
  const pagamentos = [];
  
  const percentualImposto = parseDecimal(dadosOportunidade.percentual_imposto);
  const dataBase = new Date(dadosOportunidade.data_primeiro_pagamento_mensal + 'T00:00:00');
  
  let proximoIdPagamento = new Date().getTime(); 

  // --- LÓGICA PARA IMPLANTAÇÃO (continua a mesma) ---
  const valorImplantacao = parseFloatBR(dadosOportunidade.valor_implantacao);
  const parcelasImplantacao = parseInt(dadosOportunidade.parcelas_implantacao, 10);
  if (valorImplantacao > 0 && parcelasImplantacao > 0) {
    const valorUnitario = valorImplantacao / parcelasImplantacao;
    const valorLiquido = valorUnitario * 0.2 * (1 - percentualImposto);
    for (let i = 0; i < parcelasImplantacao; i++) {
      const dataPrevista = new Date(dataBase);
      dataPrevista.setMonth(dataPrevista.getMonth() + i);
      pagamentos.push([
        String(proximoIdPagamento++), String(idOportunidade), 'Implantação', String(i + 1),
        String(valorUnitario.toFixed(2)).replace(".", ","),
        String(percentualImposto.toFixed(2)).replace(".", ","),
        String(valorLiquido.toFixed(2)).replace(".", ","),
        dataPrevista.toISOString().split("T")[0], "", "Previsto",
      ]);
    }
  }
  
  // --- LÓGICA CORRIGIDA PARA MENSALIDADE (sem divisão) ---
  const valorMensalidade = parseFloatBR(dadosOportunidade.valor_mensalidade);
  const qtdMensalidades = parseInt(dadosOportunidade.qtde_mensalidades, 10);
  if (valorMensalidade > 0 && qtdMensalidades > 0) {
    // O valor bruto da parcela É o valor da mensalidade, sem dividir.
    const valorBrutoMensalidade = valorMensalidade;
    const valorLiquido = valorBrutoMensalidade * 0.2 * (1 - percentualImposto);
    for (let i = 0; i < qtdMensalidades; i++) {
      const startMonthOffset = parcelasImplantacao || 0;
      const dataPrevista = new Date(dataBase);
      dataPrevista.setMonth(dataPrevista.getMonth() + startMonthOffset + i);
      pagamentos.push([
        String(proximoIdPagamento++), String(idOportunidade), 'Mensalidade', String(i + 1),
        // Salva o valor da mensalidade sem dividir
        String(valorBrutoMensalidade.toFixed(2)).replace(".", ","),
        String(percentualImposto.toFixed(2)).replace(".", ","),
        String(valorLiquido.toFixed(2)).replace(".", ","),
        dataPrevista.toISOString().split("T")[0], "", "Previsto",
      ]);
    }
  }

  return pagamentos;
}
