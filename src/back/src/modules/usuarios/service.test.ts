import { ErrorCode } from '@foodloop/lib';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';

const app = buildApp();

const cliente = {
  nome: 'Maria Silva',
  email: 'maria@teste.com',
  senha: 'senha-forte-123',
  telefone: '+5531999990001',
  tipo: 'cliente' as const,
};

async function registrar(): Promise<string> {
  const res = await request(app).post('/api/v1/auth/register').send(cliente).expect(201);
  return res.body.token as string;
}

describe('GET /api/v1/usuarios/me', () => {
  it('sem token retorna 401', async () => {
    const res = await request(app).get('/api/v1/usuarios/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ErrorCode.TOKEN_INVALIDO);
  });

  it('com token retorna os dados do usuário sem senha_hash', async () => {
    const token = await registrar();

    const res = await request(app).get('/api/v1/usuarios/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: cliente.email, nome: cliente.nome, tipo: 'cliente' });
    expect(JSON.stringify(res.body)).not.toContain('senha_hash');
  });
});

describe('PATCH /api/v1/usuarios/me', () => {
  it('nome válido atualiza e devolve o usuário', async () => {
    const token = await registrar();

    const res = await request(app)
      .patch('/api/v1/usuarios/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Maria Souza' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Maria Souza');
  });

  it('payload só com email (campo não permitido) retorna 400 VALIDACAO', async () => {
    const token = await registrar();

    const res = await request(app)
      .patch('/api/v1/usuarios/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'hacker@teste.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });

  it('email enviado junto de um campo válido é ignorado (não muda email/tipo)', async () => {
    const token = await registrar();

    const res = await request(app)
      .patch('/api/v1/usuarios/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Maria Nova', email: 'hacker@teste.com', tipo: 'comerciante' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Maria Nova');
    expect(res.body.email).toBe(cliente.email);
    expect(res.body.tipo).toBe('cliente');
  });
});
