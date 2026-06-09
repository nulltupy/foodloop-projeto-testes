import { describe, it, expect } from 'vitest';

// O server do MSW é iniciado globalmente em src/test/setup.ts.
const BASE = 'http://localhost:3010';

async function postJson(path: string, body: unknown, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function getJson(path: string, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, body: await res.json() };
}

describe('MSW handlers', () => {
  describe('auth', () => {
    it('login com credenciais inválidas retorna 401 genérico', async () => {
      const r = await postJson('/api/v1/auth/login', {
        email: 'naoexiste@foodloop.dev',
        senha: 'errada123',
      });
      expect(r.status).toBe(401);
      expect(r.body.error.code).toBe('CREDENCIAIS_INVALIDAS');
    });

    it('login do usuário demo retorna 200 com token', async () => {
      const r = await postJson('/api/v1/auth/login', {
        email: 'cliente@foodloop.dev',
        senha: 'senha123',
      });
      expect(r.status).toBe(200);
      expect(r.body.token).toBeTruthy();
      expect(r.body.usuario.tipo).toBe('cliente');
    });

    it('registro novo retorna 201 e duplicado retorna 409', async () => {
      const novo = {
        nome: 'Fulano Teste',
        email: 'fulano@foodloop.dev',
        senha: 'senha123',
        telefone: '+5511988887777',
        tipo: 'cliente',
      };
      const r1 = await postJson('/api/v1/auth/register', novo);
      expect(r1.status).toBe(201);
      expect(r1.body.token).toBeTruthy();

      const r2 = await postJson('/api/v1/auth/register', novo);
      expect(r2.status).toBe(409);
      expect(r2.body.error.code).toBe('CADASTRO_DUPLICADO');
    });
  });

  describe('anúncios', () => {
    it('lista filtrada por geo retorna itens ordenados por distância', async () => {
      const r = await getJson('/api/v1/anuncios?lat=-23.55&lng=-46.63&raio_km=50');
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
      expect(r.body.length).toBeGreaterThan(0);

      const distancias: number[] = r.body.map((x: { distancia_km: number }) => x.distancia_km);
      const ordenado = [...distancias].sort((a, b) => a - b);
      expect(distancias).toEqual(ordenado);
      for (const d of distancias) expect(d).toBeLessThanOrEqual(50);
    });

    it('detalhe retorna o anúncio e inexistente retorna 404', async () => {
      const ok = await getJson('/api/v1/anuncios/1');
      expect(ok.status).toBe(200);
      expect(ok.body.id).toBe(1);
      expect(ok.body).toHaveProperty('preco_promocional');

      const naoEncontrado = await getJson('/api/v1/anuncios/99999');
      expect(naoEncontrado.status).toBe(404);
    });
  });

  describe('pedidos', () => {
    it('cria pedido e recupera por id com código de retirada', async () => {
      const login = await postJson('/api/v1/auth/login', {
        email: 'cliente@foodloop.dev',
        senha: 'senha123',
      });
      const token: string = login.body.token;

      const lista = await getJson('/api/v1/anuncios?lat=-23.55&lng=-46.63&raio_km=50');
      const anuncio = lista.body[0];

      const criado = await postJson(
        '/api/v1/pedidos',
        { itens: [{ id_anuncio: anuncio.id, quantidade: 1 }] },
        token,
      );
      expect(criado.status).toBe(201);
      expect(criado.body.codigo_retirada).toHaveLength(8);
      expect(criado.body.status).toBe('RECEBIDO');

      const recuperado = await getJson(`/api/v1/pedidos/${criado.body.id}`, token);
      expect(recuperado.status).toBe(200);
      expect(recuperado.body.id).toBe(criado.body.id);
    });
  });
});
