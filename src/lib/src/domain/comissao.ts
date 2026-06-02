// Stub: pós-MVP implementa cálculo real com banker's rounding em centavos.

export interface CalculoComissao {
  valorComissao: number;
  valorLiquidoParceiro: number;
}

export function calcularComissao(valorTotal: number, taxaPercentual: number): CalculoComissao {
  if (taxaPercentual === 0) return { valorComissao: 0, valorLiquidoParceiro: valorTotal };
  throw new Error('NAO_IMPLEMENTADO_MVP');
}
