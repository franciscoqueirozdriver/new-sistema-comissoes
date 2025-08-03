import { ImportConfigItem } from '@/app/config/importConfig';

describe('validationMessages indexing', () => {
  it('returns custom messages for missing fields', () => {
    const cfg: ImportConfigItem = {
      title: '',
      requiredFields: [],
      mappings: [],
      validationMessages: {
        Foo: 'Foo é obrigatório.',
      },
    };
    const missing = ['Foo', 'Bar'];
    const vm = cfg.validationMessages as Record<string, string> | undefined;
    const messages = missing.map(f => vm?.[f] || `${f} é obrigatório.`);
    expect(messages).toEqual(['Foo é obrigatório.', 'Bar é obrigatório.']);
  });
});
