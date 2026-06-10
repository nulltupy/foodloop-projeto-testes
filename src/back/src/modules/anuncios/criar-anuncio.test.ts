import { ErrorCode } from '@foodloop/lib';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';
import { signAccessToken } from '../../shared/jwt.js';

const app = buildApp();

let contador = 0;

async function criarComerciante(opts: { comEstabelecimento?: boolean } = {}) {
  const n = ++contador;
  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const usuario = await prisma.usuario.create({
    data: {
      nome: `Comerciante Anuncio ${n}`,
      email: `comerciante-anuncio${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'comerciante',
    },
  });
  await prisma.comerciante.create({
    data: {
      id_usuario: usuario.id,
      cnpj: `9${String(n).padStart(1, '0')}.111.222/0001-${String(n % 100).padStart(2, '0')}`,
    },
  });

  let estabelecimento = null;
  if (opts.comEstabelecimento !== false) {
    const endereco = await prisma.endereco.create({
      data: {
        rua: 'Rua Anuncio',
        numero: String(n),
        bairro: 'Centro',
        cidade: 'Betim',
        estado: 'MG',
        cep: '32600-000',
        latitude: -19.954,
        longitude: -44.199,
      },
    });
    estabelecimento = await prisma.estabelecimento.create({
      data: {
        id_comerciante: usuario.id,
        id_endereco: endereco.id,
        nome_fantasia: `Estab Anuncio ${n}`,
        ativo: true,
      },
    });
  }

  const token = signAccessToken({ sub: usuario.id.toString(), tipo: 'comerciante' });
  return { usuario, estabelecimento, token };
}

async function criarProduto(idEstabelecimento: bigint) {
  return prisma.produto.create({
    data: {
      id_estabelecimento: idEstabelecimento,
      nome: 'Produto pra anunciar',
      preco_regular: 20,
      categoria: 'Lanche',
      ativo: true,
    },
  });
}

function payloadValido(idProduto: number) {
  return {
    id_produto: idProduto,
    preco_promocional: 9.9,
    quantidade_inicial: 5,
    prazo_retirada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

beforeEach(() => {
  contador = 0;
});

describe('POST /api/v1/anuncios', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/v1/anuncios').send(payloadValido(1));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.TOKEN_INVALIDO);
  });

  it('retorna 403 para cliente autenticado', async () => {
    const senhaHash = await bcrypt.hash('senha-teste-123', 4);
    const cliente = await prisma.usuario.create({
      data: {
        nome: 'Cliente',
        email: 'cliente-anuncio@test.foodloop',
        senha_hash: senhaHash,
        tipo: 'cliente',
      },
    });
    await prisma.cliente.create({ data: { id_usuario: cliente.id } });
    const token = signAccessToken({ sub: cliente.id.toString(), tipo: 'cliente' });

    const res = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send(payloadValido(1));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });

  it('retorna 400 VALIDACAO para payload inválido', async () => {
    const { token } = await criarComerciante();
    const res = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send({ preco_promocional: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });

  it('retorna 404 quando o produto não existe', async () => {
    const { token } = await criarComerciante();
    const res = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send(payloadValido(99999));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.RECURSO_NAO_ENCONTRADO);
  });

  it('retorna 403 quando o produto pertence a outro comerciante', async () => {
    const dono = await criarComerciante();
    const produto = await criarProduto(dono.estabelecimento!.id);
    const intruso = await criarComerciante();

    const res = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${intruso.token}`)
      .send(payloadValido(Number(produto.id)));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });

  it('retorna 404 quando o comerciante não tem estabelecimento', async () => {
    const { token } = await criarComerciante({ comEstabelecimento: false });
    const res = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send(payloadValido(1));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(ErrorCode.RECURSO_NAO_ENCONTRADO);
  });

  it('cria anúncio com 201: disponível = inicial, status ATIVO', async () => {
    const { token, estabelecimento } = await criarComerciante();
    const produto = await criarProduto(estabelecimento!.id);
    const payload = payloadValido(Number(produto.id));

    const res = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id_produto: Number(produto.id),
      id_estabelecimento: Number(estabelecimento!.id),
      preco_promocional: 9.9,
      quantidade_inicial: 5,
      quantidade_disponivel: 5,
      status: 'ATIVO',
    });
    expect(typeof res.body.id).toBe('number');
    expect(new Date(res.body.prazo_retirada).getTime()).toBe(new Date(payload.prazo_retirada).getTime());
  });

  it('anúncio criado aparece na listagem geo perto de Betim', async () => {
    const { token, estabelecimento } = await criarComerciante();
    const produto = await criarProduto(estabelecimento!.id);

    const criado = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send(payloadValido(Number(produto.id)));
    expect(criado.status).toBe(201);

    const lista = await request(app)
      .get('/api/v1/anuncios')
      .query({ lat: -19.954, lng: -44.199, raio_km: 5 });
    expect(lista.status).toBe(200);
    expect(lista.body.data).toHaveLength(1);
    expect(lista.body.data[0].id).toBe(criado.body.id);
  });
});
