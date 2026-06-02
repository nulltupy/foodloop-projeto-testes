import { describe, it, expect } from 'vitest';
import { RegisterRequestSchema } from './auth.js';

describe('RegisterRequestSchema', () => {
  const baseCliente = {
    nome: 'Maria',
    email: 'Maria@Exemplo.COM',
    senha: 'segredo123',
    telefone: '+5531999998888',
    tipo: 'cliente' as const,
  };

  it('aceita cliente válido e normaliza email para lowercase', () => {
    const parsed = RegisterRequestSchema.parse(baseCliente);
    expect(parsed.email).toBe('maria@exemplo.com');
  });

  it('rejeita comerciante sem CNPJ', () => {
    const result = RegisterRequestSchema.safeParse({ ...baseCliente, tipo: 'comerciante' });
    expect(result.success).toBe(false);
  });

  it('aceita comerciante com CNPJ', () => {
    const result = RegisterRequestSchema.safeParse({
      ...baseCliente,
      tipo: 'comerciante',
      cnpj: '12345678000190',
    });
    expect(result.success).toBe(true);
  });
});
