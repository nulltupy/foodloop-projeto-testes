import { http, HttpResponse } from 'msw';
import {
  AtualizarStatusRequestSchema,
  CriarAvaliacaoRequestSchema,
  CriarPedidoRequestSchema,
  ErrorCode,
  gerarCodigoRetirada,
} from '@foodloop/lib';
import type {
  ItemPedido,
  ItemPedidoResumo,
  Pedido,
  PedidoClienteListItem,
  PedidoComercianteListItem,
} from '@foodloop/lib';
import { db, usuarioPorAuth } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

const CriarAvaliacaoPedidoRequestSchema = CriarAvaliacaoRequestSchema.omit({ id_pedido: true });

// Resolve o nome do produto a partir do anúncio do item, para as listagens.
function resumirItens(itens: ItemPedido[]): ItemPedidoResumo[] {
  return itens.map((item) => {
    const anuncio = db.anuncios.find((a) => a.id === item.id_anuncio);
    const produto = anuncio ? db.produtos.find((p) => p.id === anuncio.id_produto) : undefined;
    return {
      id: item.id,
      produto_nome: produto?.nome ?? 'Produto',
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal,
    };
  });
}

function envelopar<T>(data: T[]) {
  return { data, meta: { pagina: 1, tamanho: 20, total: data.length } };
}

const JANELA_AVALIACAO_MS = 24 * 60 * 60 * 1000;

function avaliacaoDoPedido(idPedido: number) {
  const avaliacao = db.avaliacoes.find((a) => a.id_pedido === idPedido);
  if (!avaliacao) return null;
  return {
    id: avaliacao.id,
    nota: avaliacao.nota,
    comentario: avaliacao.comentario,
    data_avaliacao: avaliacao.data_avaliacao,
  };
}

function elegibilidadeAvaliacao(pedido: Pedido) {
  const retirada = pedido.data_retirada ? new Date(pedido.data_retirada) : null;
  const expira = retirada ? new Date(retirada.getTime() + JANELA_AVALIACAO_MS) : null;
  const avaliacao = avaliacaoDoPedido(pedido.id);
  return {
    data_retirada: pedido.data_retirada ?? null,
    avaliacao,
    pode_avaliar:
      pedido.status === 'RETIRADO' && !avaliacao && expira !== null && expira.getTime() >= Date.now(),
    avaliacao_expira_em: expira?.toISOString() ?? null,
  };
}

function atualizarNotaMedia(idEstabelecimento: number) {
  const estab = db.estabelecimentos.find((e) => e.id === idEstabelecimento);
  if (!estab) return;
  const notas = db.avaliacoes.filter((a) => a.id_estabelecimento === idEstabelecimento).map((a) => a.nota);
  estab.nota_media = notas.length
    ? Number((notas.reduce((acc, n) => acc + n, 0) / notas.length).toFixed(2))
    : 0;
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
      data_retirada: null,
      itens: [itemPedido],
    };
    db.pedidos.push(pedido);
    return HttpResponse.json(pedido, { status: 201 });
  }),

  http.get('/api/v1/pedidos/meus', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    const itens: PedidoClienteListItem[] = db.pedidos
      .filter((p) => p.id_cliente === usuario.id)
      .map((p) => {
        const est = db.estabelecimentos.find((e) => e.id === p.id_estabelecimento);
        return {
          id: p.id,
          status: p.status,
          valor_total: p.valor_total,
          data_pedido: p.data_pedido,
          codigo_retirada: p.codigo_retirada,
          estabelecimento: { id: p.id_estabelecimento, nome_fantasia: est?.nome_fantasia ?? 'Loja' },
          ...elegibilidadeAvaliacao(p),
          itens: resumirItens(p.itens),
        };
      });
    return HttpResponse.json(envelopar(itens));
  }),

  http.get('/api/v1/pedidos/comerciante', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const itens: PedidoComercianteListItem[] = db.pedidos
      .filter((p) => p.id_estabelecimento === usuario.id_estabelecimento)
      .map((p) => {
        const cliente = db.usuarios.find((u) => u.id === p.id_cliente);
        return {
          id: p.id,
          status: p.status,
          valor_total: p.valor_total,
          data_pedido: p.data_pedido,
          cliente: { nome: cliente?.nome ?? 'Cliente' },
          itens: resumirItens(p.itens),
        };
      });
    return HttpResponse.json(envelopar(itens));
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
    if (parsed.data.novo_status === 'RETIRADO' && parsed.data.codigo_retirada !== pedido.codigo_retirada) {
      return erro(ErrorCode.CODIGO_RETIRADA_INVALIDO, 'Código de retirada inválido', 400);
    }
    pedido.status = parsed.data.novo_status;
    if (pedido.status === 'RETIRADO') {
      pedido.data_retirada = new Date().toISOString();
    }
    return HttpResponse.json(pedido);
  }),

  http.post('/api/v1/pedidos/:id/avaliacao', async ({ params, request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'cliente')
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito', 403);
    const pedido = db.pedidos.find((p) => p.id === Number(params.id));
    if (!pedido) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado', 404);
    if (pedido.id_cliente !== usuario.id)
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Pedido de outro cliente', 403);
    if (db.avaliacoes.some((a) => a.id_pedido === pedido.id)) {
      return erro(ErrorCode.AVALIACAO_DUPLICADA, 'Este pedido já foi avaliado', 409);
    }
    if (!elegibilidadeAvaliacao(pedido).pode_avaliar) {
      return erro(ErrorCode.AVALIACAO_PRAZO_EXPIRADO, 'Prazo para avaliação expirado', 409);
    }
    const parsed = CriarAvaliacaoPedidoRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Avaliação inválida', 400);

    const avaliacao = {
      id: db.proximoId.avaliacao++,
      id_pedido: pedido.id,
      id_estabelecimento: pedido.id_estabelecimento,
      nota: parsed.data.nota,
      comentario: parsed.data.comentario?.trim() || null,
      data_avaliacao: new Date().toISOString(),
      id_cliente: usuario.id,
    };
    db.avaliacoes.push(avaliacao);
    atualizarNotaMedia(pedido.id_estabelecimento);
    const { id_cliente: _omit, ...resposta } = avaliacao;
    return HttpResponse.json(resposta, { status: 201 });
  }),

  http.post('/api/v1/pedidos/:id/cancelar', ({ params, request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    const pedido = db.pedidos.find((p) => p.id === Number(params.id));
    if (!pedido) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado', 404);
    if (pedido.status === 'RETIRADO' || pedido.status === 'CANCELADO') {
      return erro(ErrorCode.PEDIDO_NAO_CANCELAVEL, 'Pedido não pode ser cancelado', 409);
    }
    pedido.status = 'CANCELADO';
    return HttpResponse.json(pedido);
  }),
];
