export interface ImportConfigItem {
  title: string;
  requiredFields: string[];
  mappings: string[];
  validationMessages?: Record<string, string>;
}

export const importConfig: Record<string, ImportConfigItem> = {
  pagamentos: {
    title: 'Importar Pagamentos',
    requiredFields: ['Cliente', 'Valor', 'Data'],
    mappings: ['Cliente', 'Valor', 'Data'],
    validationMessages: {
      Cliente: 'O campo Cliente é obrigatório.',
      Valor: 'O campo Valor é obrigatório.',
      Data: 'O campo Data é obrigatório.'
    }
  },
  oportunidades: {
    title: 'Importar Oportunidades',
    requiredFields: ['Cliente', 'Valor da Oportunidade', 'Fase', 'Data de Fechamento'],
    mappings: ['Cliente', 'Valor da Oportunidade', 'Fase', 'Data de Fechamento'],
    validationMessages: {
      Cliente: 'O campo Cliente é obrigatório.',
      'Valor da Oportunidade': 'O Valor da Oportunidade é obrigatório.',
      Fase: 'O campo Fase é obrigatório.',
      'Data de Fechamento': 'A Data de Fechamento é obrigatória.'
    }
  },
  dsr: {
    title: 'Importar Holerites (DSR)',
    requiredFields: ['mes', 'salario_base', 'comissao', 'dsr', 'dias_dsr', 'data_pagamento'],
    mappings: ['mes', 'salario_base', 'comissao', 'dsr', 'dias_dsr', 'data_pagamento'],
    validationMessages: {
      mes: 'O campo mês é obrigatório.',
      salario_base: 'O campo salário base é obrigatório.',
      comissao: 'O campo comissão é obrigatório.',
      dsr: 'O campo DSR é obrigatório.',
      dias_dsr: 'O campo dias de DSR é obrigatório.',
      data_pagamento: 'O campo data de pagamento é obrigatório.'
    }
  }
};
