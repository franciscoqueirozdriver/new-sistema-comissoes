const parseCurrency = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    const numeroLimpo = String(valor).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

const parsePercentage = (valor) => {
    if (typeof valor === 'number') return valor;
    if (!valor || typeof valor !== 'string') return 0;
    const numeroLimpo = String(valor).replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
};

const formatForSheet = (num) => String(Number(num).toFixed(2)).replace('.', ',');

export function gerarPagamentos(idOportunidade, dadosOportunidade) {
  const pagamentos = [];

  const percentualImposto = parsePercentage(dadosOportunidade.percentual_imposto);
  const percentualComissao = parsePercentage(dadosOportunidade.comissao);
  const dataBase = new Date(dadosOportunidade.data_primeiro_pagamento_mensal + 'T00:00:00');
  const userEmail = dadosOportunidade.user_email || "";

  const parcelasImplantacao = parseInt(dadosOportunidade.parcelas_implantacao, 10);
  const valorImplantacao = parseCurrency(dadosOportunidade.valor_implantacao);

  const qtdMensalidades = parseInt(dadosOportunidade.qtde_mensalidades, 10);
  const valorMensalidade = parseCurrency(dadosOportunidade.valor_mensalidade);

  let proximoIdPagamento = Date.now();

  // --- IMPLANTAÇÃO ---
  if (valorImplantacao > 0 && parcelasImplantacao > 0) {
    const valorUnitario = valorImplantacao / parcelasImplantacao;
    const valorLiquido = valorUnitario * percentualComissao * (1 - percentualImposto);

    for (let i = 0; i < parcelasImplantacao; i++) {
      const dataPrevista = new Date(dataBase);
      dataPrevista.setMonth(dataPrevista.getMonth() + i);

      pagamentos.push([
        String(proximoIdPagamento++),           // id_pagamento
        idOportunidade,                         // id_oportunidade
        "Implantação",                          // tipo
        String(i + 1),                          // num_parcela
        formatForSheet(valorUnitario),          // valor_bruto
        formatForSheet(percentualImposto),      // percentual_imposto
        formatForSheet(valorLiquido),           // valor_liquido_comissao
        dataPrevista.toISOString().split("T")[0], // data_prevista
        "",                                     // data_recebida
        "Previsto",                             // status
        userEmail                               // user_email
      ]);
    }
  }

  // --- MENSALIDADE ---
  if (valorMensalidade > 0 && qtdMensalidades > 0) {
    const valorLiquido = valorMensalidade * percentualComissao * (1 - percentualImposto);
    // Mensalidades devem iniciar no mesmo mês da primeira parcela de implantação
    // portanto não aplicamos nenhum deslocamento baseado nas parcelas de implantação
    const offsetMeses = 0;

    for (let i = 0; i < qtdMensalidades; i++) {
      const dataPrevista = new Date(dataBase);
      dataPrevista.setMonth(dataPrevista.getMonth() + offsetMeses + i);

      pagamentos.push([
        String(proximoIdPagamento++),           // id_pagamento
        idOportunidade,                         // id_oportunidade
        "Mensalidade",                          // tipo
        String(i + 1),                          // num_parcela
        formatForSheet(valorMensalidade),       // valor_bruto
        formatForSheet(percentualImposto),      // percentual_imposto
        formatForSheet(valorLiquido),           // valor_liquido_comissao
        dataPrevista.toISOString().split("T")[0], // data_prevista
        "",                                     // data_recebida
        "Previsto",                             // status
        userEmail                               // user_email
      ]);
    }
  }

  return pagamentos;
}

