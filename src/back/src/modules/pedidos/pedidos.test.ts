import { ErrorCode, type StatusPedido } from '@foodloop/lib';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';
import { signAccessToken } from '../../shared/jwt.js';
import { criarAnuncioParaTeste } from '../anuncios/test-helpers.js';

const app = buildApp();

// Alfabeto canônico do código de retirada (sem I, L, O, 0, 1).
const ALFABETO_CANONICO = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;

let contador = 0;

// Cria um pedido num dado status, pertencente a um comerciante, com um código
// de retirada conhecido. Reutiliza o helper de anúncios pro setup de comércio.
async function seedPedido(status: StatusPedido = 'RECEBIDO') {
  const n = ++contador;
  const { anuncio, estabelecimento, comercianteUser } = await criarAnuncioParaTeste();

  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const clienteUser = await prisma.usuario.create({
    data: {
      nome: `Cliente Pedido ${n}`,
      email: `cliente-pedido${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'cliente',
    },
  });
  await prisma.cliente.create({ data: { id_usuario: clienteUser.id } });

  const codigo = `PEDIDO${String(n).padStart(2, '0')}`; // 8 chars, único por teste
  const pedido = await prisma.pedido.create({
    data: {
      id_cliente: clienteUser.id,
      id_estabelecimento: estabelecimento.id,
      valor_total: 15,
      codigo_retirada: codigo,
      status,
      item_pedido: { create: { id_anuncio: anuncio.id, quantidade: 1, preco_unitario: 15 } },
    },
  });

  return {
    pedidoId: Number(pedido.id),
    codigo,
    comercianteToken: signAccessToken({ sub: comercianteUser.id.toString(), tipo: 'comerciante' }),
    clienteToken: signAccessToken({ sub: clienteUser.id.toString(), tipo: 'cliente' }),
  };
}

function patchStatus(pedidoId: number, token: string | null, body: unknown) {
  const req = request(app).patch(`/api/v1/pedidos/${pedidoId}/status`);
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body as object);
}

describe('PATCH /api/v1/pedidos/:id/status — máquina de estados', () => {
  it('avança RECEBIDO → EM_PREPARO (200)', async () => {
    const { pedidoId, comercianteToken } = await seedPedido('RECEBIDO');
    const res = await patchStatus(pedidoId, comercianteToken, { novo_status: 'EM_PREPARO' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('EM_PREPARO');
  });

  it('rejeita transição inválida EM_PREPARO → RECEBIDO (409)', async () => {
    const { pedidoId, comercianteToken } = await seedPedido('EM_PREPARO');
    const res = await patchStatus(pedidoId, comercianteToken, { novo_status: 'RECEBIDO' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });

  it('exige código ao marcar RETIRADO (400 VALIDACAO)', async () => {
    const { pedidoId, comercianteToken } = await seedPedido('PRONTO_PARA_RETIRADA');
    const res = await patchStatus(pedidoId, comercianteToken, { novo_status: 'RETIRADO' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });

  it('rejeita código de retirada incorreto (400 CODIGO_RETIRADA_INVALIDO)', async () => {
    const { pedidoId, comercianteToken } = await seedPedido('PRONTO_PARA_RETIRADA');
    const res = await patchStatus(pedidoId, comercianteToken, {
      novo_status: 'RETIRADO',
      codigo_retirada: 'ERRADO99',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.CODIGO_RETIRADA_INVALIDO);
  });

  it('conclui RETIRADO com código correto (200)', async () => {
    const { pedidoId, comercianteToken, codigo } = await seedPedido('PRONTO_PARA_RETIRADA');
    const res = await patchStatus(pedidoId, comercianteToken, {
      novo_status: 'RETIRADO',
      codigo_retirada: codigo,
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('RETIRADO');
  });
});

describe('PATCH /api/v1/pedidos/:id/status — autorização', () => {
  it('bloqueia comerciante de outro estabelecimento (403)', async () => {
    const { pedidoId } = await seedPedido('RECEBIDO');
    const { comercianteUser } = await criarAnuncioParaTeste();
    const tokenOutro = signAccessToken({ sub: comercianteUser.id.toString(), tipo: 'comerciante' });
    const res = await patchStatus(pedidoId, tokenOutro, { novo_status: 'EM_PREPARO' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });

  it('bloqueia não-comerciante (403)', async () => {
    const { pedidoId, clienteToken } = await seedPedido('RECEBIDO');
    const res = await patchStatus(pedidoId, clienteToken, { novo_status: 'EM_PREPARO' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });

  it('exige autenticação (401)', async () => {
    const { pedidoId } = await seedPedido('RECEBIDO');
    const res = await patchStatus(pedidoId, null, { novo_status: 'EM_PREPARO' });
    expect(res.status).toBe(401);
  });

  it('retorna 404 para pedido inexistente', async () => {
    const { comercianteToken } = await seedPedido('RECEBIDO');
    const res = await patchStatus(999_999, comercianteToken, { novo_status: 'EM_PREPARO' });
    expect(res.status).toBe(404);
  });

  it('rejeita id inválido (400 VALIDACAO)', async () => {
    const { comercianteToken } = await seedPedido('RECEBIDO');
    const res = await request(app)
      .patch('/api/v1/pedidos/abc/status')
      .set('Authorization', `Bearer ${comercianteToken}`)
      .send({ novo_status: 'EM_PREPARO' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });

  it('rejeita novo_status fora do enum (400 VALIDACAO)', async () => {
    const { pedidoId, comercianteToken } = await seedPedido('RECEBIDO');
    const res = await patchStatus(pedidoId, comercianteToken, { novo_status: 'VOANDO' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });
});

describe('POST /api/v1/pedidos — código de retirada canônico', () => {
  it('gera código sem caracteres ambíguos (usa a função do lib)', async () => {
    const { anuncio } = await criarAnuncioParaTeste();
    const senhaHash = await bcrypt.hash('senha-teste-123', 4);
    const clienteUser = await prisma.usuario.create({
      data: {
        nome: 'Cliente Code',
        email: 'cliente-code@test.foodloop',
        senha_hash: senhaHash,
        tipo: 'cliente',
      },
    });
    await prisma.cliente.create({ data: { id_usuario: clienteUser.id } });
    const token = signAccessToken({ sub: clienteUser.id.toString(), tipo: 'cliente' });

    const res = await request(app)
      .post('/api/v1/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({ itens: [{ id_anuncio: Number(anuncio.id), quantidade: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body.codigo_retirada).toMatch(ALFABETO_CANONICO);
  });
});

async function novoClienteToken(): Promise<string> {
  const n = ++contador;
  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const u = await prisma.usuario.create({
    data: {
      nome: `Cli Over ${n}`,
      email: `cli-over${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'cliente',
    },
  });
  await prisma.cliente.create({ data: { id_usuario: u.id } });
  return signAccessToken({ sub: u.id.toString(), tipo: 'cliente' });
}

function postPedido(token: string, idAnuncio: number, quantidade = 1) {
  return request(app)
    .post('/api/v1/pedidos')
    .set('Authorization', `Bearer ${token}`)
    .send({ itens: [{ id_anuncio: idAnuncio, quantidade }] });
}

describe('POST /api/v1/pedidos — reserva de estoque', () => {
  it('decrementa o estoque ao criar (201)', async () => {
    const { anuncio } = await criarAnuncioParaTeste({ quantidadeDisponivel: 3 });
    const res = await postPedido(await novoClienteToken(), Number(anuncio.id));
    expect(res.status).toBe(201);
    const a = await prisma.anuncio.findUniqueOrThrow({ where: { id: anuncio.id } });
    expect(a.quantidade_disponivel).toBe(2);
  });

  it('rejeita quantidade acima do disponível (409 ANUNCIO_ESGOTADO)', async () => {
    const { anuncio } = await criarAnuncioParaTeste({ quantidadeDisponivel: 1 });
    const res = await postPedido(await novoClienteToken(), Number(anuncio.id), 2);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.ANUNCIO_ESGOTADO);
  });

  it('não faz oversell em corrida pela última unidade', async () => {
    const { anuncio } = await criarAnuncioParaTeste({ quantidadeDisponivel: 1 });
    const [t1, t2] = [await novoClienteToken(), await novoClienteToken()];
    const id = Number(anuncio.id);

    const [r1, r2] = await Promise.all([postPedido(t1, id), postPedido(t2, id)]);

    expect([r1.status, r2.status].sort()).toEqual([201, 409]); // um ganha, um esgota
    const a = await prisma.anuncio.findUniqueOrThrow({ where: { id: anuncio.id } });
    expect(a.quantidade_disponivel).toBe(0);
    const total = await prisma.pedido.count({ where: { id_estabelecimento: a.id_estabelecimento } });
    expect(total).toBe(1); // exatamente 1 pedido criado
  });
});
