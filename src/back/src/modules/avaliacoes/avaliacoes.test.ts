import { ErrorCode, type StatusPedido } from '@foodloop/lib';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';
import { signAccessToken } from '../../shared/jwt.js';
import { criarAnuncioParaTeste } from '../anuncios/test-helpers.js';

const app = buildApp();

let contador = 0;

// Semeia um pedido num dado status (default RETIRADO = entregue) pertencente a um
// comerciante, com cliente próprio. Reutiliza o helper de anúncios pro comércio.
async function seedPedido(status: StatusPedido = 'RETIRADO') {
  const n = ++contador;
  const { anuncio, estabelecimento, comercianteUser } = await criarAnuncioParaTeste();

  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const clienteUser = await prisma.usuario.create({
    data: {
      nome: `Cliente Avaliacao ${n}`,
      email: `cliente-avaliacao${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'cliente',
    },
  });
  await prisma.cliente.create({ data: { id_usuario: clienteUser.id } });

  const pedido = await prisma.pedido.create({
    data: {
      id_cliente: clienteUser.id,
      id_estabelecimento: estabelecimento.id,
      valor_total: 15,
      codigo_retirada: `AVAL${String(n).padStart(4, '0')}`,
      status,
      item_pedido: { create: { id_anuncio: anuncio.id, quantidade: 1, preco_unitario: 15 } },
    },
  });

  return {
    pedidoId: Number(pedido.id),
    estabId: Number(estabelecimento.id),
    clienteToken: signAccessToken({ sub: clienteUser.id.toString(), tipo: 'cliente' }),
    comercianteToken: signAccessToken({ sub: comercianteUser.id.toString(), tipo: 'comerciante' }),
  };
}

function postAvaliacao(token: string | null, body: unknown) {
  const req = request(app).post('/api/v1/avaliacoes');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body as object);
}

describe('POST /api/v1/avaliacoes — criação', () => {
  it('cria avaliação de um pedido entregue do próprio cliente (201)', async () => {
    const { pedidoId, clienteToken } = await seedPedido('RETIRADO');
    const res = await postAvaliacao(clienteToken, { id_pedido: pedidoId, nota: 5, comentario: 'Ótimo!' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id_pedido: pedidoId, nota: 5, comentario: 'Ótimo!' });
  });

  it('aceita avaliação sem comentário (comentario fica null)', async () => {
    const { pedidoId, clienteToken } = await seedPedido('RETIRADO');
    const res = await postAvaliacao(clienteToken, { id_pedido: pedidoId, nota: 4 });
    expect(res.status).toBe(201);
    expect(res.body.comentario).toBeNull();
  });

  it('recalcula a nota_media do estabelecimento via trigger', async () => {
    const { pedidoId, estabId, clienteToken } = await seedPedido('RETIRADO');
    await postAvaliacao(clienteToken, { id_pedido: pedidoId, nota: 3 });
    const estab = await prisma.estabelecimento.findUniqueOrThrow({ where: { id: BigInt(estabId) } });
    expect(Number(estab.nota_media)).toBe(3);
  });

  it('rejeita pedido não entregue (409 PEDIDO_NAO_ENTREGUE)', async () => {
    const { pedidoId, clienteToken } = await seedPedido('EM_PREPARO');
    const res = await postAvaliacao(clienteToken, { id_pedido: pedidoId, nota: 5 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.PEDIDO_NAO_ENTREGUE);
  });

  it('bloqueia avaliar pedido de outro cliente (403)', async () => {
    const { pedidoId } = await seedPedido('RETIRADO');
    const outro = await seedPedido('RETIRADO');
    const res = await postAvaliacao(outro.clienteToken, { id_pedido: pedidoId, nota: 5 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });

  it('impede duas avaliações para o mesmo pedido (409 AVALIACAO_DUPLICADA)', async () => {
    const { pedidoId, clienteToken } = await seedPedido('RETIRADO');
    await postAvaliacao(clienteToken, { id_pedido: pedidoId, nota: 5 });
    const res = await postAvaliacao(clienteToken, { id_pedido: pedidoId, nota: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.AVALIACAO_DUPLICADA);
  });

  it('rejeita nota fora de 1..5 (400 VALIDACAO)', async () => {
    const { pedidoId, clienteToken } = await seedPedido('RETIRADO');
    for (const nota of [0, 6, 3.5]) {
      const res = await postAvaliacao(clienteToken, { id_pedido: pedidoId, nota });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
    }
  });

  it('exige autenticação de cliente (401 sem token, 403 comerciante)', async () => {
    const { pedidoId, comercianteToken } = await seedPedido('RETIRADO');
    expect((await postAvaliacao(null, { id_pedido: pedidoId, nota: 5 })).status).toBe(401);
    expect((await postAvaliacao(comercianteToken, { id_pedido: pedidoId, nota: 5 })).status).toBe(403);
  });

  it('404 para pedido inexistente', async () => {
    const { clienteToken } = await seedPedido('RETIRADO');
    const res = await postAvaliacao(clienteToken, { id_pedido: 999999, nota: 5 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.RECURSO_NAO_ENCONTRADO);
  });
});

// Cria uma avaliação direto no banco para testar a thread de comentários.
async function seedAvaliacao() {
  const seed = await seedPedido('RETIRADO');
  const res = await postAvaliacao(seed.clienteToken, { id_pedido: seed.pedidoId, nota: 4 });
  return { ...seed, avaliacaoId: res.body.id as number };
}

function postComentario(avaliacaoId: number, token: string | null, body: unknown) {
  const req = request(app).post(`/api/v1/avaliacoes/${avaliacaoId}/comentarios`);
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body as object);
}

describe('POST /api/v1/avaliacoes/:id/comentarios — thread', () => {
  it('cliente autor comenta na própria avaliação (201)', async () => {
    const { avaliacaoId, clienteToken } = await seedAvaliacao();
    const res = await postComentario(avaliacaoId, clienteToken, { comentario: 'Voltarei!' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ comentario: 'Voltarei!', autor: { tipo: 'cliente' } });
  });

  it('comerciante dono responde a avaliação (201)', async () => {
    const { avaliacaoId, comercianteToken } = await seedAvaliacao();
    const res = await postComentario(avaliacaoId, comercianteToken, { comentario: 'Obrigado!' });
    expect(res.status).toBe(201);
    expect(res.body.autor.tipo).toBe('comerciante');
  });

  it('bloqueia terceiro sem relação com a avaliação (403)', async () => {
    const { avaliacaoId } = await seedAvaliacao();
    const outro = await seedPedido('RETIRADO');
    const res = await postComentario(avaliacaoId, outro.clienteToken, { comentario: 'oi' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });

  it('rejeita comentário vazio (400)', async () => {
    const { avaliacaoId, clienteToken } = await seedAvaliacao();
    const res = await postComentario(avaliacaoId, clienteToken, { comentario: '   ' });
    expect(res.status).toBe(400);
  });

  it('404 para avaliação inexistente', async () => {
    const { clienteToken } = await seedAvaliacao();
    const res = await postComentario(999999, clienteToken, { comentario: 'oi' });
    expect(res.status).toBe(404);
  });
});

describe('listagens públicas de avaliações', () => {
  it('GET /estabelecimentos/:id/avaliacoes traz avaliação com autor e thread', async () => {
    const { avaliacaoId, estabId, clienteToken, comercianteToken } = await seedAvaliacao();
    await postComentario(avaliacaoId, clienteToken, { comentario: 'Pergunta' });
    await postComentario(avaliacaoId, comercianteToken, { comentario: 'Resposta' });

    const res = await request(app).get(`/api/v1/estabelecimentos/${estabId}/avaliacoes`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ nota: 4, autor: { nome: expect.any(String) } });
    expect(res.body[0].comentarios).toHaveLength(2);
    expect(res.body[0].comentarios.map((c: { comentario: string }) => c.comentario)).toEqual([
      'Pergunta',
      'Resposta',
    ]);
  });

  it('GET /avaliacoes/:id/comentarios devolve a thread em ordem cronológica', async () => {
    const { avaliacaoId, clienteToken } = await seedAvaliacao();
    await postComentario(avaliacaoId, clienteToken, { comentario: 'primeiro' });
    await postComentario(avaliacaoId, clienteToken, { comentario: 'segundo' });
    const res = await request(app).get(`/api/v1/avaliacoes/${avaliacaoId}/comentarios`);
    expect(res.status).toBe(200);
    expect(res.body.map((c: { comentario: string }) => c.comentario)).toEqual(['primeiro', 'segundo']);
  });
});
