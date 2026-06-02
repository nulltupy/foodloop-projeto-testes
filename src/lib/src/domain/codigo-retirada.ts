// Alfabeto sem ambiguidades visuais (sem I, O, 0, 1, L).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface GerarCodigoRetiradaOpts {
  length?: number;
  rng?: () => number;
}

export function gerarCodigoRetirada(opts: GerarCodigoRetiradaOpts = {}): string {
  const len = opts.length ?? 8;
  const rng = opts.rng ?? Math.random;
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rng() * ALPHABET.length)];
  return s;
}
