export const importConfig = {
  pagamentos: {
    requiredFields: ['Cliente', 'Valor', 'Data'],
    mappings: ['Cliente', 'Valor', 'Data'],
  },
  oportunidades: {
    requiredFields: ['Cliente', 'Valor do Negócio', 'Fase', 'Data de Fechamento'],
    mappings: ['Cliente', 'Valor do Negócio', 'Fase', 'Data de Fechamento'],
  },
  dsr: {
    requiredFields: ['Colaborador', 'Valor', 'Data'],
    mappings: ['Colaborador', 'Valor', 'Data'],
  },
};
