import { ErrorCode } from '@foodloop/lib';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../shared/errors.js';
import { signAccessToken } from '../../shared/jwt.js';

import { geocodingEndereco } from '../geocoding/service.js';

// Geocoding mockado: testa o CRUD sem rede nem o limiter (1,1s) do Nominatim.
vi.mock('../geocoding/service.js', () => ({ geocodingEndereco: vi.fn() }));
const geoMock = vi.mocked(geocodingEndereco);

const app = buildApp();

const COORDS = {
  latitude: -19.9676,
  longitude: -44.1986,
  endereco_normalizado: 'Av. Amazonas, Centro, Betim, MG',
};

const ENDERECO = {
  rua: 'Avenida Amazonas',
  numero: '100',
  bairro: 'Centro',
  cidade: 'Betim',
  estado: 'MG',
  cep: '32600-000',
};
const PAYLOAD = {
  nome_fantasia: 'Padaria Pão Quente',
  descricao: 'Pães e doces do dia',
  horario_funcionamento: 'Seg-Sex 7h-19h',
  endereco: ENDERECO,
};

async function registrarComerciante(n: number) {
  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const usuario = await prisma.usuario.create({
    data: {
      nome: `Comerciante Estab ${n}`,
      email: `comerciante-estab${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'comerciante',
    },
  });
  // CNPJ formatado tem 18 chars fixos; pad pra não estourar a coluna quando n ≥ 10.
  const p = String(n).padStart(2, '0');
  await prisma.comerciante.create({ data: { id_usuario: usuario.id, cnpj: `${p}.222.333/0001-${p}` } });
  const token = signAccessToken({ sub: usuario.id.toString(), tipo: 'comerciante' });
  return { usuario, token };
}

async function registrarCliente(n: number) {
  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const usuario = await prisma.usuario.create({
    data: {
      nome: `Cliente Estab ${n}`,
      email: `cliente-estab${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'cliente',
    },
  });
  const token = signAccessToken({ sub: usuario.id.toString(), tipo: 'cliente' });
  return { usuario, token };
}

beforeEach(() => {
  geoMock.mockReset();
  geoMock.mockResolvedValue(COORDS);
});

describe('POST /api/v1/estabelecimentos', () => {
  it('cria estabelecimento + endereço com coordenadas do geocoding (201)', async () => {
    const { token } = await registrarComerciante(1);

    const res = await request(app)
      .post('/api/v1/estabelecimentos')
      .set('Authorization', `Bearer ${token}`)
      .send(PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome_fantasia: 'Padaria Pão Quente', ativo: true });
    expect(res.body.endereco.latitude).toBe(-19.9676);
    expect(res.body.endereco.longitude).toBe(-44.1986);
    expect(geoMock).toHaveBeenCalledOnce();
    expect(String(geoMock.mock.calls[0]![0])).toContain('Avenida Amazonas');
  });

  it('rejeita 2º estabelecimento do mesmo comerciante (409) sem deixar endereço órfão', async () => {
    const { token } = await registrarComerciante(2);
    await request(app).post('/api/v1/estabelecimentos').set('Authorization', `Bearer ${token}`).send(PAYLOAD);

    const enderecosAntes = await prisma.endereco.count();
    const res = await request(app)
      .post('/api/v1/estabelecimentos')
      .set('Authorization', `Bearer ${token}`)
      .send(PAYLOAD);
    const enderecosDepois = await prisma.endereco.count();

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.ESTABELECIMENTO_JA_EXISTE);
    expect(enderecosDepois).toBe(enderecosAntes); // 409 antes do geocoding/tx → nada criado
  });

  it('propaga falha do geocoding como 422 GEOCODING_FALHOU', async () => {
    const { token } = await registrarComerciante(3);
    geoMock.mockRejectedValueOnce(new HttpError(422, ErrorCode.GEOCODING_FALHOU, 'Não localizado'));

    const res = await request(app)
      .post('/api/v1/estabelecimentos')
      .set('Authorization', `Bearer ${token}`)
      .send(PAYLOAD);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(ErrorCode.GEOCODING_FALHOU);
  });

  it('exige autenticação (401)', async () => {
    const res = await request(app).post('/api/v1/estabelecimentos').send(PAYLOAD);
    expect(res.status).toBe(401);
  });

  it('bloqueia não-comerciante (403)', async () => {
    const { token } = await registrarCliente(4);
    const res = await request(app)
      .post('/api/v1/estabelecimentos')
      .set('Authorization', `Bearer ${token}`)
      .send(PAYLOAD);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });

  it('valida o payload (400)', async () => {
    const { token } = await registrarComerciante(5);
    const res = await request(app)
      .post('/api/v1/estabelecimentos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome_fantasia: 'x', endereco: ENDERECO }); // nome_fantasia < 2 chars
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });
});

describe('GET /api/v1/estabelecimentos', () => {
  it('GET /:id é público (200, sem auth)', async () => {
    const { token } = await registrarComerciante(6);
    const criado = await request(app)
      .post('/api/v1/estabelecimentos')
      .set('Authorization', `Bearer ${token}`)
      .send(PAYLOAD);

    const res = await request(app).get(`/api/v1/estabelecimentos/${criado.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.endereco.cidade).toBe('Betim');
  });

  it('GET /me retorna o estabelecimento do comerciante (200)', async () => {
    const { token } = await registrarComerciante(7);
    await request(app).post('/api/v1/estabelecimentos').set('Authorization', `Bearer ${token}`).send(PAYLOAD);

    const res = await request(app).get('/api/v1/estabelecimentos/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.nome_fantasia).toBe('Padaria Pão Quente');
  });

  it('GET /me retorna 404 quando o comerciante não tem estabelecimento', async () => {
    const { token } = await registrarComerciante(8);
    const res = await request(app).get('/api/v1/estabelecimentos/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/estabelecimentos/me', () => {
  it('atualiza nome sem mexer no endereço (200, sem geocoding)', async () => {
    const { token } = await registrarComerciante(9);
    await request(app).post('/api/v1/estabelecimentos').set('Authorization', `Bearer ${token}`).send(PAYLOAD);
    geoMock.mockClear();

    const res = await request(app)
      .patch('/api/v1/estabelecimentos/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome_fantasia: 'Padaria Renovada' });

    expect(res.status).toBe(200);
    expect(res.body.nome_fantasia).toBe('Padaria Renovada');
    expect(geoMock).not.toHaveBeenCalled();
  });

  it('re-geocodifica quando o endereço muda', async () => {
    const { token } = await registrarComerciante(10);
    await request(app).post('/api/v1/estabelecimentos').set('Authorization', `Bearer ${token}`).send(PAYLOAD);

    geoMock.mockResolvedValueOnce({ latitude: -19.8, longitude: -44.05, endereco_normalizado: 'Novo' });
    const res = await request(app)
      .patch('/api/v1/estabelecimentos/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ endereco: { ...ENDERECO, rua: 'Rua Nova', bairro: 'Jardim' } });

    expect(res.status).toBe(200);
    expect(res.body.endereco.latitude).toBe(-19.8);
    expect(res.body.endereco.rua).toBe('Rua Nova');
  });
});
