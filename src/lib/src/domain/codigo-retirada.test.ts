import { describe, it, expect } from 'vitest';
import { gerarCodigoRetirada } from './codigo-retirada.js';
import { calcularComissao } from './comissao.js';

const PERMITIDOS = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
const PROIBIDOS = /[ILO01]/;

describe('gerarCodigoRetirada', () => {
  it('default tem 8 caracteres', () => {
    expect(gerarCodigoRetirada()).toHaveLength(8);
  });

  it('respeita length customizado', () => {
    expect(gerarCodigoRetirada({ length: 12 })).toHaveLength(12);
  });

  it('nunca gera caracteres ambíguos (I, L, O, 0, 1)', () => {
    for (let i = 0; i < 1000; i++) {
      const codigo = gerarCodigoRetirada();
      expect(PERMITIDOS.test(codigo)).toBe(true);
      expect(PROIBIDOS.test(codigo)).toBe(false);
    }
  });

  it('é determinístico com rng injetado', () => {
    expect(gerarCodigoRetirada({ rng: () => 0 })).toBe('AAAAAAAA');
  });
});

describe('calcularComissao', () => {
  it('taxa 0 retorna valor total ao parceiro', () => {
    expect(calcularComissao(100, 0)).toEqual({ valorComissao: 0, valorLiquidoParceiro: 100 });
  });

  it('taxa > 0 ainda não implementada', () => {
    expect(() => calcularComissao(100, 5)).toThrow('NAO_IMPLEMENTADO_MVP');
  });
});
