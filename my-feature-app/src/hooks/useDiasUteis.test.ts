import { describe, it, expect } from 'vitest';
import { calcularDias } from './useDiasUteis';

describe('calcularDias', () => {
  it('should correctly calculate workdays and rest days for a month without holidays', () => {
    // August 2024 has 31 days. 4 Sundays, 5 Saturdays. 22 workdays (Mon-Fri).
    const { diasSemSabado, diasComSabado, diasDescanso } = calcularDias(2024, 8, []);
    expect(diasSemSabado).toBe(22);
    expect(diasComSabado).toBe(27); // 22 + 5 Saturdays
    expect(diasDescanso).toBe(4); // 4 Sundays
  });

  it('should correctly calculate days when a holiday falls on a weekday', () => {
    // August 15, 2024 is a Thursday.
    const feriados = ['2024-08-15'];
    const { diasSemSabado, diasComSabado, diasDescanso } = calcularDias(2024, 8, feriados);
    expect(diasSemSabado).toBe(21); // 22 - 1 holiday
    expect(diasComSabado).toBe(26); // 27 - 1 holiday
    expect(diasDescanso).toBe(5);  // 4 Sundays + 1 holiday
  });

  it('should correctly calculate days when a holiday falls on a Saturday', () => {
    // June 1, 2024 is a Saturday. Month has 30 days, 5 Saturdays, 5 Sundays.
    const feriados = ['2024-06-01'];
    const result = calcularDias(2024, 6, feriados); // 20 workdays, 5 Sat, 5 Sun
    expect(result.diasSemSabado).toBe(20); // Unchanged
    expect(result.diasComSabado).toBe(24); // 20 weekdays + 4 non-holiday Saturdays
    expect(result.diasDescanso).toBe(6);  // 5 Sundays + 1 holiday Saturday
  });

  it('should correctly handle a month with no workdays (hypothetical)', () => {
    // A month where every day is a holiday
    const feriados = Array.from({ length: 31 }, (_, i) => `2024-08-${String(i + 1).padStart(2, '0')}`);
    const { diasSemSabado, diasComSabado, diasDescanso } = calcularDias(2024, 8, feriados);
    expect(diasSemSabado).toBe(0);
    expect(diasComSabado).toBe(0);
    expect(diasDescanso).toBe(31);
  });

  it('should handle February in a leap year', () => {
    // Feb 2024 is a leap year, 29 days. 4 Sun, 4 Sat, 21 weekdays.
    const { diasSemSabado, diasComSabado, diasDescanso } = calcularDias(2024, 2, []);
    expect(diasSemSabado).toBe(21);
    expect(diasComSabado).toBe(25);
    expect(diasDescanso).toBe(4);
  });
});
