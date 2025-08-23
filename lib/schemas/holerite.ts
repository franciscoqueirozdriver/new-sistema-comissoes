import { z } from 'zod';

export const HoleriteSchema = z.object({
  mes: z.string().min(1),
  competencia: z.string().min(1),
  empresa: z.string().min(1),
  salario_base: z.string().min(1),
  comissao: z.string().min(1),
  dsr: z.string().min(1),
  dias_dsr: z.string().min(1),
  valor_bruto: z.string().min(1),
  valor_liquido: z.string().min(1),
  data_pagamento: z.string().min(1),
  user_email: z.string().min(1),
  fonte_arquivo: z.string().min(1),
  holerite_ID: z.string().min(1),
  rubricas_json: z.string().default(''),
  status_validacao: z.string().default('pendente'),
});

export type HoleriteInput = z.infer<typeof HoleriteSchema>;

// Não realizar cálculos ou conversões numéricas; preservar pt-BR.
