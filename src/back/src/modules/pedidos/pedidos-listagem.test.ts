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

async function novoCliente() {
  const n = ++contador;
  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const user = await prisma.usuario.create({
    data: {
      nome: `Cliente ${n}`,
      email: `cli-list${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'cliente',
    },
  });
  await prisma.cliente.create({ data: { id_usuario: user.id } });
  return { user, token: signAccessToken({ sub: user.id.toString(), tipo: 'cliente' }) };
}

// Comerciante COM estabelecimento + um anúncio (reusa o helper de anúncios).
async function novoComercio() {
  const { estabelecimento, anuncio, comercianteUser } = await criarAnuncioParaTeste();
  return {
    estabId: estabelecimento.id,
    anuncioId: anuncio.id,
    token: signAccessToken({ sub: comercianteUser.id.toString(), tipo: 'comerciante' }),
  };
}

async function criarPedido(
  clienteId: bigint,
  estabId: bigint,
  anuncioId: bigint,
  status: StatusPedido = 'RECEBIDO',
) {
  const n = ++contador;
  return prisma.pedido.create({
    data: {
      id_cliente: clienteId,
      id_estabelecimento: estabId,
      valor_total: 15,
      codigo_retirada: `COD${String(n).padStart(5, '0')}`, // 8 chars únicos
      status,
      item_pedido: { create: { id_anuncio: anuncioId, quantidade: 1, preco_unitario: 15 } },
    },
  });
}

describe('GET /api/v1/pedidos/meus', () => {
  it('lista os próprios pedidos do cliente (200)', async () => {
    const cliente = await novoCliente();
    const comercio = await novoComercio();
    await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId);
    await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId);

    const res = await request(app)
      .get('/api/v1/pedidos/meus')
      .set('Authorization', `Bearer ${cliente.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ pagina: 1, tamanho: 20, total: 2 });
  });

  it('nunca retorna pedido de outro cliente', async () => {
    const a = await novoCliente();
    const b = await novoCliente();
    const comercio = await novoComercio();
    await criarPedido(a.user.id, comercio.estabId, comercio.anuncioId);
    await criarPedido(b.user.id, comercio.estabId, comercio.anuncioId);

    const res = await request(app).get('/api/v1/pedidos/meus').set('Authorization', `Bearer ${a.token}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(
      Number((await prisma.pedido.findFirstOrThrow({ where: { id_cliente: a.user.id } })).id),
    );
  });

  it('aplica o filtro ?status=', async () => {
    const cliente = await novoCliente();
    const comercio = await novoComercio();
    await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId, 'RECEBIDO');
    await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId, 'RETIRADO');

    const res = await request(app)
      .get('/api/v1/pedidos/meus?status=RECEBIDO')
      .set('Authorization', `Bearer ${cliente.token}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('RECEBIDO');
  });

  it('pagina com meta correto', async () => {
    const cliente = await novoCliente();
    const comercio = await novoComercio();
    for (let i = 0; i < 3; i++) await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId);

    const res = await request(app)
      .get('/api/v1/pedidos/meus?pagina=1&limit=2')
      .set('Authorization', `Bearer ${cliente.token}`);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ pagina: 1, tamanho: 2, total: 3 });
  });

  it('inclui codigo_retirada na visão do cliente', async () => {
    const cliente = await novoCliente();
    const comercio = await novoComercio();
    await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId);

    const res = await request(app)
      .get('/api/v1/pedidos/meus')
      .set('Authorization', `Bearer ${cliente.token}`);
    expect(res.body.data[0].codigo_retirada).toMatch(/^.{8}$/);
    expect(res.body.data[0].itens[0].produto_nome).toBeTruthy();
  });

  it('bloqueia comerciante em /meus (403)', async () => {
    const comercio = await novoComercio();
    const res = await request(app)
      .get('/api/v1/pedidos/meus')
      .set('Authorization', `Bearer ${comercio.token}`);
    expect(res.status).toBe(403);
  });

  it('exige autenticação (401)', async () => {
    const res = await request(app).get('/api/v1/pedidos/meus');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/pedidos/comerciante', () => {
  it('lista pedidos do próprio estabelecimento (200)', async () => {
    const cliente = await novoCliente();
    const comercio = await novoComercio();
    await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId);
    await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId);

    const res = await request(app)
      .get('/api/v1/pedidos/comerciante')
      .set('Authorization', `Bearer ${comercio.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('omite codigo_retirada e inclui o nome do cliente', async () => {
    const cliente = await novoCliente();
    const comercio = await novoComercio();
    await criarPedido(cliente.user.id, comercio.estabId, comercio.anuncioId);

    const res = await request(app)
      .get('/api/v1/pedidos/comerciante')
      .set('Authorization', `Bearer ${comercio.token}`);
    expect(res.body.data[0].codigo_retirada).toBeUndefined();
    expect(res.body.data[0].cliente.nome).toBe(cliente.user.nome);
  });

  it('retorna 404 quando o comerciante não tem estabelecimento', async () => {
    const n = ++contador;
    const senhaHash = await bcrypt.hash('senha-teste-123', 4);
    const user = await prisma.usuario.create({
      data: {
        nome: `Sem Estab ${n}`,
        email: `sem-estab${n}@test.foodloop`,
        senha_hash: senhaHash,
        tipo: 'comerciante',
      },
    });
    const p = String(n % 100).padStart(2, '0');
    await prisma.comerciante.create({ data: { id_usuario: user.id, cnpj: `${p}.000.000/0001-99` } });
    const token = signAccessToken({ sub: user.id.toString(), tipo: 'comerciante' });

    const res = await request(app).get('/api/v1/pedidos/comerciante').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.RECURSO_NAO_ENCONTRADO);
  });

  it('bloqueia cliente em /comerciante (403)', async () => {
    const cliente = await novoCliente();
    const res = await request(app)
      .get('/api/v1/pedidos/comerciante')
      .set('Authorization', `Bearer ${cliente.token}`);
    expect(res.status).toBe(403);
  });
});
