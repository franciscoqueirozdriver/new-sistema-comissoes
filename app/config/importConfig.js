export const importConfig = {
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
    requiredFields: ['Colaborador', 'Período', 'Salário Base', 'Comissão', 'DSR', 'Data de Pagamento'],
    mappings: ['Colaborador', 'Período', 'Salário Base', 'Comissão', 'DSR', 'Data de Pagamento'],
    validationMessages: {
      Colaborador: 'O campo Colaborador é obrigatório.',
      'Período': 'O campo Período é obrigatório.',
      'Salário Base': 'O Salário Base é obrigatório.',
      'Comissão': 'O campo Comissão é obrigatório.',
      'DSR': 'O campo DSR é obrigatório.',
      'Data de Pagamento': 'A Data de Pagamento é obrigatória.'
    }
  }
};
