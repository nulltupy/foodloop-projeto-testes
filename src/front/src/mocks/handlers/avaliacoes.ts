import { http, HttpResponse } from 'msw';
import { CriarAvaliacaoRequestSchema, CriarComentarioRequestSchema, ErrorCode } from '@foodloop/lib';
import type { AvaliacaoPerfilItem } from '@foodloop/lib';
import { db, usuarioPorAuth, type AvaliacaoMock } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

const JANELA_AVALIACAO_MS = 24 * 60 * 60 * 1000;

// Recalcula a nota_media do estabelecimento (no back é feito por trigger).
function recalcularNota(idEstabelecimento: number) {
  const notas = db.avaliacoes.filter((a) => a.id_estabelecimento === idEstabelecimento).map((a) => a.nota);
  const est = db.estabelecimentos.find((e) => e.id === idEstabelecimento);
  if (est) {
    est.nota_media = notas.length ? Number((notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(2)) : 0;
  }
}

function nomePublico(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'Cliente';
  const inicial = partes[1]?.[0];
  return inicial ? `${partes[0]} ${inicial}.` : partes[0]!;
}

function montarPerfil(avaliacao: AvaliacaoMock): AvaliacaoPerfilItem {
  const autor = db.usuarios.find((u) => u.id === avaliacao.id_cliente);
  return {
    id: avaliacao.id,
    nota: avaliacao.nota,
    comentario: avaliacao.comentario,
    data_avaliacao: avaliacao.data_avaliacao,
    autor: { nome: autor ? nomePublico(autor.nome) : 'Cliente' },
    comentarios: db.comentarios.filter((c) => c.id_avaliacao === avaliacao.id),
  };
}

export const avaliacoesHandlers = [
  http.post('/api/v1/avaliacoes', async ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    if (usuario.tipo !== 'cliente')
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao cliente', 403);

    const parsed = CriarAvaliacaoRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Payload inválido', 400);

    const pedido = db.pedidos.find((p) => p.id === parsed.data.id_pedido);
    if (!pedido) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado', 404);
    if (pedido.id_cliente !== usuario.id)
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Pedido de outro cliente', 403);
    if (pedido.status !== 'RETIRADO') {
      return erro(ErrorCode.PEDIDO_NAO_ENTREGUE, 'Só é possível avaliar pedidos entregues', 409);
    }
    if (db.avaliacoes.some((a) => a.id_pedido === pedido.id)) {
      return erro(ErrorCode.AVALIACAO_DUPLICADA, 'Este pedido já foi avaliado', 409);
    }
    const dataRetirada = pedido.data_retirada ? new Date(pedido.data_retirada) : null;
    const expiraEm = dataRetirada ? new Date(dataRetirada.getTime() + JANELA_AVALIACAO_MS) : null;
    if (!expiraEm || expiraEm.getTime() < Date.now()) {
      return erro(ErrorCode.AVALIACAO_PRAZO_EXPIRADO, 'Prazo para avaliação expirado', 409);
    }

    const avaliacao: AvaliacaoMock = {
      id: db.proximoId.avaliacao++,
      id_pedido: pedido.id,
      id_estabelecimento: pedido.id_estabelecimento,
      nota: parsed.data.nota,
      comentario: parsed.data.comentario?.trim() ? parsed.data.comentario.trim() : null,
      data_avaliacao: new Date().toISOString(),
      id_cliente: usuario.id,
    };
    db.avaliacoes.push(avaliacao);
    recalcularNota(pedido.id_estabelecimento);

    const { id_cliente: _omit, ...resposta } = avaliacao;
    return HttpResponse.json(resposta, { status: 201 });
  }),

  http.post('/api/v1/avaliacoes/:id/comentarios', async ({ params, request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);

    const avaliacao = db.avaliacoes.find((a) => a.id === Number(params.id));
    if (!avaliacao) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Avaliação não encontrada', 404);

    const pedido = db.pedidos.find((p) => p.id === avaliacao.id_pedido);
    const est = db.estabelecimentos.find((e) => e.id === avaliacao.id_estabelecimento);
    const donoEst = db.usuarios.find((u) => u.id_estabelecimento === est?.id);
    const ehCliente = pedido?.id_cliente === usuario.id;
    const ehComerciante = donoEst?.id === usuario.id;
    if (!ehCliente && !ehComerciante) {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Sem permissão para comentar esta avaliação', 403);
    }

    const parsed = CriarComentarioRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Payload inválido', 400);

    const comentario = {
      id: db.proximoId.comentario++,
      id_avaliacao: avaliacao.id,
      comentario: parsed.data.comentario.trim(),
      data_comentario: new Date().toISOString(),
      autor: { nome: usuario.nome, tipo: usuario.tipo },
      id_usuario: usuario.id,
    };
    db.comentarios.push(comentario);
    const { id_usuario: _omit, ...resposta } = comentario;
    return HttpResponse.json(resposta, { status: 201 });
  }),

  http.get('/api/v1/avaliacoes/:id/comentarios', ({ params }) => {
    const avaliacao = db.avaliacoes.find((a) => a.id === Number(params.id));
    if (!avaliacao) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Avaliação não encontrada', 404);
    const comentarios = db.comentarios
      .filter((c) => c.id_avaliacao === avaliacao.id)
      .map(({ id_usuario: _omit, ...c }) => c);
    return HttpResponse.json(comentarios);
  }),

  http.get('/api/v1/estabelecimentos/:id/avaliacoes', ({ params }) => {
    const idEstabelecimento = Number(params.id);
    const itens = db.avaliacoes
      .filter((a) => a.id_estabelecimento === idEstabelecimento)
      .sort((a, b) => b.data_avaliacao.localeCompare(a.data_avaliacao))
      .map(montarPerfil);
    return HttpResponse.json(itens);
  }),
];
