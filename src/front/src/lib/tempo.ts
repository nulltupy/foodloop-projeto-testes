// Contagem regressiva do prazo de retirada (tela de detalhe da oferta).
// Refatoração 1 do Projeto de Testes: a função morava dentro de
// OfertaDetalhe.tsx, com números mágicos (3_600_000, 60_000...) e sem como
// ser testada isoladamente.

const MS_POR_SEGUNDO = 1000;
const MS_POR_MINUTO = 60 * MS_POR_SEGUNDO;
const MS_POR_HORA = 60 * MS_POR_MINUTO;

export const PRAZO_ENCERRADO = 'Prazo encerrado';

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

// Devolve "HH:MM:SS" até o prazo, ou "Prazo encerrado" se ele já passou.
export function tempoRestante(prazoIso: string, agora: number): string {
  const restante = new Date(prazoIso).getTime() - agora;
  if (restante <= 0) return PRAZO_ENCERRADO;

  const horas = Math.floor(restante / MS_POR_HORA);
  const minutos = Math.floor((restante % MS_POR_HORA) / MS_POR_MINUTO);
  const segundos = Math.floor((restante % MS_POR_MINUTO) / MS_POR_SEGUNDO);
  return [horas, minutos, segundos].map(doisDigitos).join(':');
}
