import bcrypt from 'bcryptjs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';
import { signAccessToken } from '../../shared/jwt.js';
import { criarAnuncioParaTeste } from '../anuncios/test-helpers.js';

const app = buildApp();
let cnt = 0;

async function novoCliente() {
  const n = ++cnt;
  const senhaHash = await bcrypt.hash('senha-teste-123', 4);
  const user = await prisma.usuario.create({
    data: {
      nome: `Cli Notif ${n}`,
      email: `cli-notif${n}@test.foodloop`,
      senha_hash: senhaHash,
      tipo: 'cliente',
    },
  });
  await prisma.cliente.create({ data: { id_usuario: user.id } });
  return { user, token: signAccessToken({ sub: user.id.toString(), tipo: 'cliente' }) };
}

const tokenComerciante = (idUsuario: bigint) =>
  signAccessToken({ sub: idUsuario.toString(), tipo: 'comerciante' });

const fazerPedido = (clienteToken: string, idAnuncio: bigint) =>
  request(app)
    .post('/api/v1/pedidos')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({ itens: [{ id_anuncio: Number(idAnuncio), quantidade: 1 }] });

const listar = (token: string, query = '') =>
  request(app).get(`/api/v1/notificacoes${query}`).set('Authorization', `Bearer ${token}`);

describe('Notificações — emissão por eventos', () => {
  it('novo pedido gera notificação para o comerciante', async () => {
    const { anuncio, comercianteUser } = await criarAnuncioParaTeste();
    const cliente = await novoCliente();
    await fazerPedido(cliente.token, anuncio.id);

    const res = await listar(tokenComerciante(comercianteUser.id));
    expect(res.status).toBe(200);
    expect(res.body.data[0].titulo).toBe('Novo pedido');
    expect(res.body.meta.nao_lidas).toBeGreaterThanOrEqual(1);
  });

  it('avançar status gera notificação para o cliente', async () => {
    const { anuncio, comercianteUser } = await criarAnuncioParaTeste();
    const cliente = await novoCliente();
    const ped = await fazerPedido(cliente.token, anuncio.id);
    await request(app)
      .patch(`/api/v1/pedidos/${ped.body.id}/status`)
      .set('Authorization', `Bearer ${tokenComerciante(comercianteUser.id)}`)
      .send({ novo_status: 'EM_PREPARO' });

    const res = await listar(cliente.token);
    expect(res.body.data.some((n: { titulo: string }) => n.titulo === 'Atualização do pedido')).toBe(true);
  });

  it('cliente cancela → comerciante é notificado', async () => {
    const { anuncio, comercianteUser } = await criarAnuncioParaTeste();
    const cliente = await novoCliente();
    const ped = await fazerPedido(cliente.token, anuncio.id);
    await request(app)
      .post(`/api/v1/pedidos/${ped.body.id}/cancelar`)
      .set('Authorization', `Bearer ${cliente.token}`)
      .send({});

    const res = await listar(tokenComerciante(comercianteUser.id));
    expect(res.body.data.some((n: { titulo: string }) => n.titulo === 'Pedido cancelado')).toBe(true);
  });

  it('respeita preferência: status_pedido=false não gera notificação', async () => {
    const { anuncio, comercianteUser } = await criarAnuncioParaTeste();
    await prisma.preferencia_notificacao.create({
      data: { id_usuario: comercianteUser.id, status_pedido: false },
    });
    const cliente = await novoCliente();
    await fazerPedido(cliente.token, anuncio.id);

    const res = await listar(tokenComerciante(comercianteUser.id));
    expect(res.body.data.length).toBe(0);
  });
});

describe('Notificações — leitura', () => {
  it('marca uma notificação como lida (204) e bloqueia a de outro usuário (404)', async () => {
    const { anuncio, comercianteUser } = await criarAnuncioParaTeste();
    const cliente = await novoCliente();
    await fazerPedido(cliente.token, anuncio.id);
    const comTok = tokenComerciante(comercianteUser.id);

    const id = (await listar(comTok)).body.data[0].id;
    expect(
      (await request(app).patch(`/api/v1/notificacoes/${id}/lida`).set('Authorization', `Bearer ${comTok}`))
        .status,
    ).toBe(204);
    // Outro usuário não consegue marcar a notificação alheia.
    const alheio = await request(app)
      .patch(`/api/v1/notificacoes/${id}/lida`)
      .set('Authorization', `Bearer ${cliente.token}`);
    expect(alheio.status).toBe(404);
  });

  it('ler-todas zera as não lidas', async () => {
    const { anuncio, comercianteUser } = await criarAnuncioParaTeste();
    const cliente = await novoCliente();
    await fazerPedido(cliente.token, anuncio.id);
    const comTok = tokenComerciante(comercianteUser.id);

    const r = await request(app)
      .patch('/api/v1/notificacoes/ler-todas')
      .set('Authorization', `Bearer ${comTok}`);
    expect(r.status).toBe(200);
    expect(r.body.atualizadas).toBeGreaterThanOrEqual(1);
    const naoLidas = await listar(comTok, '?lida=false');
    expect(naoLidas.body.data.length).toBe(0);
  });

  it('exige autenticação (401)', async () => {
    const res = await request(app).get('/api/v1/notificacoes');
    expect(res.status).toBe(401);
  });
});
