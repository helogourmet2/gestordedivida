import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  daysUntilDue,
  daysUntilDueText,
  parseCurrencyInput,
  toDateInputValue,
} from '../utils/formatters';

describe('formatCurrency', () => {
  it('formata valor em reais', () => {
    expect(formatCurrency(1500)).toBe('R$\u00a01.500,00');
  });

  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00');
  });

  it('formata valor undefined como zero', () => {
    expect(formatCurrency(undefined)).toBe('R$\u00a00,00');
  });

  it('formata centavos corretamente', () => {
    expect(formatCurrency(9.99)).toBe('R$\u00a09,99');
  });
});

describe('formatDate', () => {
  it('formata data ISO para DD/MM/AAAA', () => {
    const result = formatDate('2026-05-23T00:00:00.000Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('retorna string vazia para valor nulo', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('formatDateShort', () => {
  it('formata data curta DD/MM', () => {
    const result = formatDateShort('2026-05-23T00:00:00.000Z');
    expect(result).toMatch(/\d{2}\/\d{2}/);
  });
});

describe('daysUntilDue', () => {
  it('retorna 0 para hoje', () => {
    const today = new Date().toISOString();
    expect(daysUntilDue(today)).toBe(0);
  });

  it('retorna número positivo para data futura', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysUntilDue(future.toISOString())).toBe(5);
  });

  it('retorna número negativo para data passada', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(daysUntilDue(past.toISOString())).toBe(-3);
  });

  it('retorna 0 para valor nulo', () => {
    expect(daysUntilDue(null)).toBe(0);
  });
});

describe('daysUntilDueText', () => {
  it('retorna "Vence hoje!" para hoje', () => {
    const today = new Date().toISOString();
    expect(daysUntilDueText(today)).toBe('Vence hoje!');
  });

  it('retorna "Vence amanhã" para amanhã', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(daysUntilDueText(tomorrow.toISOString())).toBe('Vence amanhã');
  });

  it('retorna texto com dias para datas futuras', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(daysUntilDueText(future.toISOString())).toBe('Vence em 10 dias');
  });

  it('retorna texto de vencida para datas passadas', () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(daysUntilDueText(past.toISOString())).toBe('Vencida há 2 dias');
  });

  it('retorna singular para 1 dia vencida', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(daysUntilDueText(past.toISOString())).toBe('Vencida há 1 dia');
  });
});

describe('parseCurrencyInput', () => {
  it('converte string com vírgula para float', () => {
    expect(parseCurrencyInput('1.500,99')).toBe(1500.99);
  });

  it('retorna 0 para string inválida', () => {
    expect(parseCurrencyInput('abc')).toBe(0);
  });
});

describe('toDateInputValue', () => {
  it('retorna formato YYYY-MM-DD', () => {
    const result = toDateInputValue('2026-05-23T12:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('retorna string vazia para valor nulo', () => {
    expect(toDateInputValue(null)).toBe('');
    expect(toDateInputValue(undefined)).toBe('');
  });
});
