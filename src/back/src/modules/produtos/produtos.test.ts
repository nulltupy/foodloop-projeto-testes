import { ErrorCode } from '@foodloop/lib';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';
import { signAccessToken } from '../../shared/jwt.js';

const app = buildApp();

// Conta como sai do POST /auth/register: usuario + comerciante, SEM estabelecimento.
async function registrarComerciante(n: number) {
  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const usuario = await prisma.usuario.create({
    data: {
      nome: `Comerciante Produto ${n}`,
      email: `comerciante-produto${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'comerciante',
    },
  });
  await prisma.comerciante.create({
    data: { id_usuario: usuario.id, cnpj: `8${n}.222.333/0001-0${n}` },
  });
  const token = signAccessToken({ sub: usuario.id.toString(), tipo: 'comerciante' });
  return { usuario, token };
}

const PRODUTO = { nome: 'Coxinha', preco_regular: 8.5, categoria: 'Lanche' };

describe('POST /api/v1/produtos — comerciante sem estabelecimento', () => {
  it('cria estabelecimento default e o produto (201)', async () => {
    const { usuario, token } = await registrarComerciante(1);

    const res = await request(app)
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send(PRODUTO);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: 'Coxinha', preco_regular: 8.5, ativo: true });

    const estab = await prisma.estabelecimento.findFirst({
      where: { id_comerciante: usuario.id },
      include: { endereco: true },
    });
    expect(estab).not.toBeNull();
    expect(res.body.id_estabelecimento).toBe(Number(estab!.id));
    // Endereço default no centro de Betim — onde está o seed de demonstração,
    // pra anúncios desse estab aparecerem na home sem onboarding de endereço.
    expect(Number(estab!.endereco.latitude)).toBeCloseTo(-19.954, 3);
    expect(Number(estab!.endereco.longitude)).toBeCloseTo(-44.199, 3);
  });

  it('GET /api/v1/produtos lista produtos após o lazy-create', async () => {
    const { token } = await registrarComerciante(2);

    await request(app).post('/api/v1/produtos').set('Authorization', `Bearer ${token}`).send(PRODUTO);

    const res = await request(app).get('/api/v1/produtos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('Coxinha');
  });

  it('fluxo completo: produto novo + anúncio aparecem na listagem geo de Betim', async () => {
    const { token } = await registrarComerciante(3);

    const produto = await request(app)
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send(PRODUTO);
    expect(produto.status).toBe(201);

    const anuncio = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_produto: produto.body.id,
        preco_promocional: 4.25,
        quantidade_inicial: 5,
        prazo_retirada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(anuncio.status).toBe(201);

    const lista = await request(app)
      .get('/api/v1/anuncios')
      .query({ lat: -19.954, lng: -44.199, raio_km: 5 });
    expect(lista.status).toBe(200);
    expect(lista.body.data.map((a: { id: number }) => a.id)).toContain(anuncio.body.id);
  });

  it('cliente segue bloqueado com 403', async () => {
    const senhaHash = await bcrypt.hash('senha-teste-123', 4);
    const cliente = await prisma.usuario.create({
      data: {
        nome: 'Cliente',
        email: 'cliente-produto@test.foodloop',
        senha_hash: senhaHash,
        tipo: 'cliente',
      },
    });
    await prisma.cliente.create({ data: { id_usuario: cliente.id } });
    const token = signAccessToken({ sub: cliente.id.toString(), tipo: 'cliente' });

    const res = await request(app)
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send(PRODUTO);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });
});

describe('GET /api/v1/anuncios/meus e ciclo de vida do anúncio', () => {
  it('lista os anúncios do comerciante autenticado', async () => {
    const { token } = await registrarComerciante(5);
    const produto = await request(app)
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send(PRODUTO);
    const anuncio = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_produto: produto.body.id,
        preco_promocional: 4.25,
        quantidade_inicial: 5,
        prazo_retirada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(anuncio.status).toBe(201);

    const res = await request(app).get('/api/v1/anuncios/meus').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: anuncio.body.id, status: 'ATIVO' });
  });

  it('desativar produto encerra anúncios ativos dele (some da home)', async () => {
    const { token } = await registrarComerciante(6);
    const produto = await request(app)
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send(PRODUTO);
    const anuncio = await request(app)
      .post('/api/v1/anuncios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_produto: produto.body.id,
        preco_promocional: 4.25,
        quantidade_inicial: 5,
        prazo_retirada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(anuncio.status).toBe(201);

    const del = await request(app)
      .delete(`/api/v1/produtos/${produto.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const lista = await request(app)
      .get('/api/v1/anuncios')
      .query({ lat: -19.954, lng: -44.199, raio_km: 5 });
    expect(lista.body.data.map((a: { id: number }) => a.id)).not.toContain(anuncio.body.id);

    const meus = await request(app).get('/api/v1/anuncios/meus').set('Authorization', `Bearer ${token}`);
    expect(meus.body[0].status).toBe('ENCERRADO_COM_SOBRA');
  });
});

describe('DELETE /api/v1/produtos/:id — produto some da listagem', () => {
  it('produto excluído não aparece mais no GET /api/v1/produtos', async () => {
    const { token } = await registrarComerciante(7);
    const produto = await request(app)
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send(PRODUTO);

    await request(app).delete(`/api/v1/produtos/${produto.body.id}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/v1/produtos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
