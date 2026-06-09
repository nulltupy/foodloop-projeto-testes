import { http, HttpResponse } from 'msw';
import {
  AtualizarStatusRequestSchema,
  CriarPedidoRequestSchema,
  ErrorCode,
  gerarCodigoRetirada,
} from '@foodloop/lib';
import type { ItemPedido, Pedido } from '@foodloop/lib';
import { db, usuarioPorAuth } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const pedidosHandlers = [
  http.post('/api/v1/pedidos', async ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);

    const parsed = CriarPedidoRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Pedido inválido', 400);

    const item = parsed.data.itens[0];
    if (!item) return erro(ErrorCode.VALIDACAO, 'Pedido sem itens', 400);

    const anuncio = db.anuncios.find((a) => a.id === item.id_anuncio);
    if (!anuncio) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Anúncio não encontrado', 404);
    if (anuncio.status !== 'ATIVO') {
      return erro(ErrorCode.ANUNCIO_NAO_ATIVO, 'Anúncio não está mais ativo', 409);
    }
    if (anuncio.quantidade_disponivel < item.quantidade) {
      return erro(ErrorCode.ANUNCIO_ESGOTADO, 'Quantidade indisponível', 409);
    }

    anuncio.quantidade_disponivel -= item.quantidade;
    const subtotal = Number((anuncio.preco_promocional * item.quantidade).toFixed(2));
    const itemPedido: ItemPedido = {
      id: 1,
      id_anuncio: anuncio.id,
      quantidade: item.quantidade,
      preco_unitario: anuncio.preco_promocional,
      subtotal,
    };
    const pedido: Pedido = {
      id: db.proximoId.pedido++,
      id_cliente: usuario.id,
      id_estabelecimento: anuncio.id_estabelecimento,
      valor_total: subtotal,
      status: 'RECEBIDO',
      codigo_retirada: gerarCodigoRetirada(),
      data_pedido: new Date().toISOString(),
      itens: [itemPedido],
    };
    db.pedidos.push(pedido);
    return HttpResponse.json(pedido, { status: 201 });
  }),

  http.get('/api/v1/pedidos/meus', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    return HttpResponse.json(db.pedidos.filter((p) => p.id_cliente === usuario.id));
  }),

  http.get('/api/v1/pedidos/comerciante', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    return HttpResponse.json(db.pedidos.filter((p) => p.id_estabelecimento === usuario.id_estabelecimento));
  }),

  http.get('/api/v1/pedidos/:id', ({ params }) => {
    const pedido = db.pedidos.find((p) => p.id === Number(params.id));
    if (!pedido) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado', 404);
    return HttpResponse.json(pedido);
  }),

  http.patch('/api/v1/pedidos/:id/status', async ({ params, request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const pedido = db.pedidos.find((p) => p.id === Number(params.id));
    if (!pedido) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado', 404);
    const parsed = AtualizarStatusRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Status inválido', 400);
    pedido.status = parsed.data.novo_status;
    return HttpResponse.json(pedido);
  }),
];
