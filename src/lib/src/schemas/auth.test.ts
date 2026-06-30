import { describe, it, expect } from 'vitest';
import { RegisterComercianteRequestSchema, RegisterRequestSchema } from './auth.js';

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

describe('RegisterComercianteRequestSchema', () => {
  it('aceita estabelecimento sem horário de funcionamento', () => {
    const result = RegisterComercianteRequestSchema.safeParse({
      nome: 'Comerciante',
      email: 'comerciante@exemplo.com',
      senha: 'segredo123',
      telefone: '+5531999997777',
      cnpj: '12345678000191',
      estabelecimento: {
        nome_fantasia: 'Padaria Exemplo',
        descricao: 'Pães do dia',
        endereco: {
          rua: 'Rua Um',
          numero: '100',
          bairro: 'Centro',
          cidade: 'Betim',
          estado: 'MG',
          cep: '32600-000',
        },
      },
    });

    expect(result.success).toBe(true);
  });
});
