import { ErrorCode } from '@foodloop/lib';
import bcrypt from 'bcryptjs';
import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';
import { verifyAccessToken } from '../../shared/jwt.js';
import { geocodingEnderecoComFallback } from '../geocoding/service.js';

vi.mock('../geocoding/service.js', () => ({ geocodingEnderecoComFallback: vi.fn() }));
const geoMock = vi.mocked(geocodingEnderecoComFallback);

const app = buildApp();

const COORDS = {
  latitude: -19.9676,
  longitude: -44.1986,
  endereco_normalizado: 'Av. Amazonas, Centro, Betim, MG',
};

const clienteValido = {
  nome: 'Cliente Teste',
  email: 'cliente@teste.com',
  senha: 'senha-forte-123',
  telefone: '+5531999990001',
  tipo: 'cliente' as const,
};

const comercianteValido = {
  nome: 'Comerciante Teste',
  email: 'comerciante@teste.com',
  senha: 'senha-forte-123',
  telefone: '+5531999990002',
  tipo: 'comerciante' as const,
  cnpj: '12345678000190',
};

const estabelecimentoValido = {
  nome_fantasia: 'Padaria Teste',
  descricao: 'Pães do dia',
  endereco: {
    rua: 'Avenida Amazonas',
    numero: '100',
    bairro: 'Centro',
    cidade: 'Betim',
    estado: 'MG',
    cep: '32600-000',
  },
};

beforeEach(() => {
  geoMock.mockReset();
  geoMock.mockResolvedValue(COORDS);
});

describe('POST /api/v1/auth/register', () => {
  it('cadastra cliente e devolve usuario + token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(clienteValido);

    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({
      nome: clienteValido.nome,
      email: clienteValido.email,
      tipo: 'cliente',
    });
    expect(typeof res.body.usuario.id).toBe('number');
    expect(typeof res.body.token).toBe('string');
  });

  it('token devolvido decodifica com sub, tipo e exp futuros (com iss/aud)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(clienteValido).expect(201);

    const decoded = verifyAccessToken(res.body.token);
    expect(decoded.sub).toBe(String(res.body.usuario.id));
    expect(decoded.tipo).toBe('cliente');
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('senha persistida é hash bcrypt da senha original', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(clienteValido).expect(201);

    const row = await prisma.usuario.findUnique({
      where: { id: BigInt(res.body.usuario.id) },
      select: { senha_hash: true },
    });
    expect(row).not.toBeNull();
    expect(await bcrypt.compare(clienteValido.senha, row!.senha_hash)).toBe(true);
  });

  it('cadastra comerciante com CNPJ', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(comercianteValido);

    expect(res.status).toBe(201);
    expect(res.body.usuario.tipo).toBe('comerciante');
  });

  it('email duplicado retorna 409 CADASTRO_DUPLICADO', async () => {
    await request(app).post('/api/v1/auth/register').send(clienteValido).expect(201);

    const res = await request(app).post('/api/v1/auth/register').send(clienteValido);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.CADASTRO_DUPLICADO);
  });

  it('CNPJ duplicado retorna 409 CADASTRO_DUPLICADO', async () => {
    await request(app).post('/api/v1/auth/register').send(comercianteValido).expect(201);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...comercianteValido, email: 'outro@teste.com' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ErrorCode.CADASTRO_DUPLICADO);
  });

  it('nunca devolve senha nem senha_hash na resposta', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(clienteValido).expect(201);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('senha_hash');
    expect(body).not.toContain(clienteValido.senha);
  });

  it('cria preferencia_notificacao default para o usuário', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(clienteValido).expect(201);

    const pref = await prisma.preferencia_notificacao.findUnique({
      where: { id_usuario: BigInt(res.body.usuario.id) },
    });
    expect(pref).not.toBeNull();
    expect(pref?.novos_anuncios_proximos).toBe(true);
    expect(pref?.status_pedido).toBe(true);
    expect(pref?.promocoes).toBe(true);
  });

  it('payload inválido (sem nome) retorna 400 VALIDACAO', async () => {
    const { nome: _nome, ...semNome } = clienteValido;
    const res = await request(app).post('/api/v1/auth/register').send(semNome);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });
});

describe('POST /api/v1/auth/register-comerciante', () => {
  it('cadastra comerciante e estabelecimento sem exigir horário', async () => {
    const res = await request(app).post('/api/v1/auth/register-comerciante').send({
      nome: 'Comerciante com Loja',
      email: 'comerciante-loja@teste.com',
      senha: 'senha-forte-123',
      telefone: '+5531999990003',
      cnpj: '12345678000191',
      estabelecimento: estabelecimentoValido,
    });

    expect(res.status).toBe(201);
    expect(res.body.usuario.tipo).toBe('comerciante');
    expect(typeof res.body.token).toBe('string');

    const estabelecimento = await prisma.estabelecimento.findFirst({
      where: { id_comerciante: BigInt(res.body.usuario.id) },
      include: { endereco: true },
    });
    expect(estabelecimento).not.toBeNull();
    expect(estabelecimento).toMatchObject({
      nome_fantasia: 'Padaria Teste',
      descricao: 'Pães do dia',
      horario_funcionamento: null,
      ativo: true,
    });
    expect(estabelecimento?.endereco.cep).toBe('32600-000');
    expect(geoMock).toHaveBeenCalledOnce();
  });
});

describe('POST /api/v1/auth/login', () => {
  // App fresco por teste: cada buildApp() cria limiters novos, então o teste de
  // 429 não polui os outros e nenhum teste sofre com contagem residual.
  let appLogin: Express;
  beforeEach(() => {
    appLogin = buildApp();
  });

  it('login válido retorna 200 com token decodificável', async () => {
    await request(appLogin).post('/api/v1/auth/register').send(clienteValido).expect(201);

    const res = await request(appLogin)
      .post('/api/v1/auth/login')
      .send({ email: clienteValido.email, senha: clienteValido.senha });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({
      nome: clienteValido.nome,
      email: clienteValido.email,
      tipo: 'cliente',
    });
    const decoded = verifyAccessToken(res.body.token);
    expect(decoded.sub).toBe(String(res.body.usuario.id));
    expect(decoded.tipo).toBe('cliente');
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('senha errada retorna 401 CREDENCIAIS_INVALIDAS', async () => {
    await request(appLogin).post('/api/v1/auth/register').send(clienteValido).expect(201);

    const res = await request(appLogin)
      .post('/api/v1/auth/login')
      .send({ email: clienteValido.email, senha: 'senha-errada-123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.CREDENCIAIS_INVALIDAS);
    expect(res.body.error.message).toBe('Email ou senha inválidos');
    expect(typeof res.body.error.requestId).toBe('string');
  });

  it('email inexistente retorna 401 CREDENCIAIS_INVALIDAS com mesma forma', async () => {
    // Sem cadastrar nada antes: o usuário não existe.
    const inexistente = await request(appLogin)
      .post('/api/v1/auth/login')
      .send({ email: 'nao-existe@teste.com', senha: 'senha-forte-123' });

    expect(inexistente.status).toBe(401);
    expect(inexistente.body.error.code).toBe(ErrorCode.CREDENCIAIS_INVALIDAS);
    expect(inexistente.body.error.message).toBe('Email ou senha inválidos');
    expect(typeof inexistente.body.error.requestId).toBe('string');

    // Compara contra senha-errada num usuário existente: o shape (modulo
    // requestId) deve ser idêntico — qualquer diff vira oráculo de enumeração.
    await request(appLogin).post('/api/v1/auth/register').send(clienteValido).expect(201);
    const senhaErrada = await request(appLogin)
      .post('/api/v1/auth/login')
      .send({ email: clienteValido.email, senha: 'senha-errada-123' });

    expect(senhaErrada.status).toBe(inexistente.status);

    // Comparação estrutural: chaves de `error` idênticas E payload byte-equal
    // após zerar o requestId (único campo que legitimamente difere).
    const normalize = (b: { error: Record<string, unknown> }) => ({
      ...b,
      error: { ...b.error, requestId: '<rid>' },
    });
    expect(Object.keys(senhaErrada.body.error).sort()).toEqual(Object.keys(inexistente.body.error).sort());
    expect(normalize(senhaErrada.body)).toEqual(normalize(inexistente.body));
  });

  it('6ª tentativa em 1 min do mesmo IP retorna 429 com headers ratelimit', async () => {
    await request(appLogin).post('/api/v1/auth/register').send(clienteValido).expect(201);

    const tentativaInvalida = () =>
      request(appLogin)
        .post('/api/v1/auth/login')
        .send({ email: clienteValido.email, senha: 'senha-errada-123' });

    for (let i = 0; i < 5; i++) {
      const r = await tentativaInvalida();
      expect(r.status).toBe(401);
    }
    const sexta = await tentativaInvalida();
    expect(sexta.status).toBe(429);
    expect(sexta.body.error.code).toBe(ErrorCode.RATE_LIMIT);
    expect(typeof sexta.body.error.requestId).toBe('string');
    // standardHeaders: true expõe ratelimit-* + retry-after; clientes educados
    // dependem desses headers pra back off em vez de retry imediato.
    expect(sexta.headers['ratelimit-limit']).toBe('5');
    expect(sexta.headers['retry-after']).toBeDefined();
  });

  it('payload inválido (sem senha) retorna 400 VALIDACAO', async () => {
    const res = await request(appLogin).post('/api/v1/auth/login').send({ email: clienteValido.email });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
    expect(res.body.error.details?.fields).toContain('senha');
    expect(typeof res.body.error.requestId).toBe('string');
  });

  it('nunca devolve senha nem senha_hash na resposta de sucesso', async () => {
    await request(appLogin).post('/api/v1/auth/register').send(clienteValido).expect(201);
    const res = await request(appLogin)
      .post('/api/v1/auth/login')
      .send({ email: clienteValido.email, senha: clienteValido.senha })
      .expect(200);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('senha_hash');
    expect(body).not.toContain(clienteValido.senha);
  });
});
