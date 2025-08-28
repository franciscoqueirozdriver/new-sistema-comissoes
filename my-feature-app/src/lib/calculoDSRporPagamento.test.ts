import { describe, it, expect } from 'vitest';
import { parseCurrency, parsePercentage, calcularDSRporPagamento } from './calculoDSRporPagamento';

describe('calculoDSRporPagamento', () => {
  describe('parseCurrency', () => {
    it('should parse a formatted currency string to a float', () => {
      expect(parseCurrency('R$ 1.500,50')).toBe(1500.50);
    });

    it('should handle strings without currency symbol', () => {
      expect(parseCurrency('2.000,75')).toBe(2000.75);
    });

    it('should return 0 for invalid or empty strings', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency(null)).toBe(0);
      expect(parseCurrency(undefined)).toBe(0);
    });

    it('should return the number if a number is passed', () => {
      expect(parseCurrency(123.45)).toBe(123.45);
    });
  });

  describe('parsePercentage', () => {
    it('should parse a percentage string to a float', () => {
      expect(parsePercentage('15%')).toBe(15);
    });

    it('should handle percentage strings with comma decimals', () => {
      expect(parsePercentage('7,5%')).toBe(7.5);
    });

    it('should return 0 for invalid or empty strings', () => {
      expect(parsePercentage('')).toBe(0);
    });

    it('should return the number if a number is passed', () => {
        expect(parsePercentage(10.5)).toBe(10.5);
    });
  });

  describe('calcularDSRporPagamento', () => {
    const row = {
      valor_bruto: 'R$ 2.500,00',
      percentual_imposto: '10%',
      percentual_comissao: '5%',
    };

    const options = {
      usarComSabado: false,
      diasSemSabado: 20,
      diasComSabado: 24,
      diasDescanso: 5,
    };

    it('should calculate all values correctly without saturday', () => {
      const result = calcularDSRporPagamento(row, options);
      expect(result.liquidoVenda).toBeCloseTo(2250); // 2500 * (1 - 0.10)
      expect(result.comissaoBruta).toBeCloseTo(125);   // 2500 * 0.05
      expect(result.comissaoLiquida).toBeCloseTo(112.5); // 2250 * 0.05
      expect(result.dsrBruto).toBeCloseTo(31.25);   // (125 / 20) * 5
      expect(result.dsrLiquido).toBeCloseTo(28.125);  // (112.5 / 20) * 5
    });

    it('should calculate all values correctly with saturday', () => {
        const optionsComSabado = { ...options, usarComSabado: true };
        const result = calcularDSRporPagamento(row, optionsComSabado);
        expect(result.dsrBruto).toBeCloseTo(26.04, 2);   // (125 / 24) * 5
        expect(result.dsrLiquido).toBeCloseTo(23.44, 2);  // (112.5 / 24) * 5
    });

    it('should handle zero division', () => {
        const optionsZeroDivisor = { ...options, diasSemSabado: 0 };
        const result = calcularDSRporPagamento(row, optionsZeroDivisor);
        expect(result.dsrBruto).toBe(0);
        expect(result.dsrLiquido).toBe(0);
    });
  });
});
