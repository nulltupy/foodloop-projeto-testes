import { anunciosHandlers } from './anuncios';
import { authHandlers } from './auth';
import { estabelecimentosHandlers } from './estabelecimentos';
import { pedidosHandlers } from './pedidos';
import { produtosHandlers } from './produtos';

// Ordem importa: rotas específicas (ex.: /meus) já vêm antes de ':id'
// dentro de cada arquivo.
export const handlers = [
  ...authHandlers,
  ...anunciosHandlers,
  ...estabelecimentosHandlers,
  ...produtosHandlers,
  ...pedidosHandlers,
];
