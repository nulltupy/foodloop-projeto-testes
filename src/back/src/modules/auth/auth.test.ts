import { ErrorCode } from '@foodloop/lib';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';
import { verifyAccessToken } from '../../shared/jwt.js';

const app = buildApp();

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
