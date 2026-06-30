import { anunciosHandlers } from './anuncios';
import { authHandlers } from './auth';
import { avaliacoesHandlers } from './avaliacoes';
import { estabelecimentosHandlers } from './estabelecimentos';
import { notificacoesHandlers } from './notificacoes';
import { pedidosHandlers } from './pedidos';
import { produtosHandlers } from './produtos';
import { usuariosHandlers } from './usuarios';

// Ordem importa: rotas específicas (ex.: /meus) já vêm antes de ':id'
// dentro de cada arquivo.
export const handlers = [
  ...authHandlers,
  ...usuariosHandlers,
  ...anunciosHandlers,
  ...estabelecimentosHandlers,
  ...produtosHandlers,
  ...pedidosHandlers,
  ...notificacoesHandlers,
  ...avaliacoesHandlers,
];
