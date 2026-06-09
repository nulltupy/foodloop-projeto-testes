import { ErrorCode } from '@foodloop/lib';
import express, { type Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../db/client.js';
import { authConfig } from '../config/auth.js';
import { errorHandler } from '../errors.js';
import { signAccessToken } from '../jwt.js';
import { requireAuth, requireRole } from './auth.js';

// App mínimo só para exercitar os middlewares de forma isolada.
function buildTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.get('/protegida', requireAuth, (req, res) => {
    res.json({ usuario: req.usuario });
  });
  app.get('/so-comerciante', requireAuth, requireRole('comerciante'), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

async function criarUsuario(tipo: 'cliente' | 'comerciante', email: string) {
  const usuario = await prisma.usuario.create({
    data: { nome: 'Teste', email, senha_hash: 'hash-fake', telefone: '+5531999990000', tipo },
  });
  if (tipo === 'cliente') {
    await prisma.cliente.create({ data: { id_usuario: usuario.id } });
  } else {
    await prisma.comerciante.create({ data: { id_usuario: usuario.id, cnpj: '12345678000190' } });
  }
  return usuario;
}

function tokenDe(usuario: { id: bigint; tipo: 'cliente' | 'comerciante' }): string {
  return signAccessToken({ sub: usuario.id.toString(), tipo: usuario.tipo });
}

describe('requireAuth', () => {
  let app: Express;
  beforeEach(() => {
    app = buildTestApp();
  });

  it('sem header Authorization retorna 401 TOKEN_INVALIDO', async () => {
    const res = await request(app).get('/protegida');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.TOKEN_INVALIDO);
  });

  it('header sem Bearer / token malformado retorna 401', async () => {
    const res = await request(app).get('/protegida').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.TOKEN_INVALIDO);
  });

  it('token expirado retorna 401', async () => {
    const usuario = await criarUsuario('cliente', 'expira@teste.com');
    const expirado = jwt.sign({ sub: usuario.id.toString(), tipo: usuario.tipo }, authConfig.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '-10s',
      issuer: authConfig.jwtIssuer,
      audience: authConfig.jwtAudience,
    });
    const res = await request(app).get('/protegida').set('Authorization', `Bearer ${expirado}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.TOKEN_INVALIDO);
  });

  it('usuário removido após emitir o token retorna 401', async () => {
    const usuario = await criarUsuario('cliente', 'sumiu@teste.com');
    const token = tokenDe(usuario);
    await prisma.usuario.delete({ where: { id: usuario.id } });

    const res = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.TOKEN_INVALIDO);
  });

  it('token válido popula req.usuario e segue para o handler', async () => {
    const usuario = await criarUsuario('cliente', 'ok@teste.com');
    const token = tokenDe(usuario);

    const res = await request(app).get('/protegida').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({
      id: Number(usuario.id),
      email: 'ok@teste.com',
      tipo: 'cliente',
    });
  });
});

describe('requireRole', () => {
  let app: Express;
  beforeEach(() => {
    app = buildTestApp();
  });

  it('cliente em rota de comerciante retorna 403 PERMISSAO_NEGADA', async () => {
    const usuario = await criarUsuario('cliente', 'cliente@teste.com');
    const res = await request(app)
      .get('/so-comerciante')
      .set('Authorization', `Bearer ${tokenDe(usuario)}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(ErrorCode.PERMISSAO_NEGADA);
  });

  it('comerciante na rota de comerciante segue para o handler', async () => {
    const usuario = await criarUsuario('comerciante', 'comerciante@teste.com');
    const res = await request(app)
      .get('/so-comerciante')
      .set('Authorization', `Bearer ${tokenDe(usuario)}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
