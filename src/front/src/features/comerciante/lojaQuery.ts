import { api } from '@foodloop/lib';
import type { Estabelecimento } from '@foodloop/lib';
import { statusErro } from '../../lib/erros';

export const CHAVE_LOJA = ['estabelecimento-meu'];

export async function buscarMinhaLoja(): Promise<Estabelecimento | null> {
  try {
    return await api.estabelecimentos.getMeu();
  } catch (e) {
    if (statusErro(e) === 404) return null;
    throw e;
  }
}
