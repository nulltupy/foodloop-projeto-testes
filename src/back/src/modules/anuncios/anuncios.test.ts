import { ErrorCode } from '@foodloop/lib';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { prisma } from '../../db/client.js';

import { criarAnuncioParaTeste, resetContadorTeste } from './test-helpers.js';

const app = buildApp();

// Centro de Betim, próximo ao Couto Lanches piloto.
const BETIM_LAT = -19.954;
const BETIM_LNG = -44.199;

beforeEach(() => {
  resetContadorTeste();
});

describe('GET /api/v1/anuncios — validação', () => {
  it('rejeita lat ausente com 400 VALIDACAO', async () => {
    const res = await request(app).get('/api/v1/anuncios').query({ lng: BETIM_LNG });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
    expect(res.body.error.details.fields).toContain('lat');
  });

  it('rejeita lat fora do range [-90, 90]', async () => {
    const res = await request(app).get('/api/v1/anuncios').query({ lat: 91, lng: BETIM_LNG });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ErrorCode.VALIDACAO);
  });

  it('aceita só lat+lng (defaults pra raio_km=5 e pagina=1)', async () => {
    await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG });
    const res = await request(app).get('/api/v1/anuncios').query({ lat: BETIM_LAT, lng: BETIM_LNG });
    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ pagina: 1, tamanho: 20 });
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/anuncios — filtro de raio', () => {
  it('retorna só os dentro do raio', async () => {
    await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG });
    await criarAnuncioParaTeste({ lat: -20.05, lng: -44.3 });
    await criarAnuncioParaTeste({ lat: -23.55, lng: -46.63 });

    const res = await request(app)
      .get('/api/v1/anuncios')
      .query({ lat: BETIM_LAT, lng: BETIM_LNG, raio_km: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].distancia_km).toBeLessThan(5);
    expect(res.body.meta.total).toBe(1);
  });

  it('ordena por distância ASC e devolve campo distancia_km em cada item', async () => {
    await criarAnuncioParaTeste({ lat: -19.97, lng: -44.2 });
    await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG });

    const res = await request(app)
      .get('/api/v1/anuncios')
      .query({ lat: BETIM_LAT, lng: BETIM_LNG, raio_km: 50 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].distancia_km).toBeLessThan(res.body.data[1].distancia_km);
    for (const item of res.body.data) {
      expect(typeof item.distancia_km).toBe('number');
      expect(item.distancia_km).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('GET /api/v1/anuncios — filtros adicionais', () => {
  it('filtra por preco_max', async () => {
    await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG, precoPromocional: 10 });
    await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG, precoPromocional: 50 });

    const res = await request(app)
      .get('/api/v1/anuncios')
      .query({ lat: BETIM_LAT, lng: BETIM_LNG, preco_max: 20 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].preco_promocional).toBe(10);
  });

  it('exclui status não-ATIVO, quantidade_disponivel 0, prazo no passado', async () => {
    await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG });
    await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG, status: 'ENCERRADO_COM_SOBRA' });
    await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG, quantidadeDisponivel: 0 });

    // Cria um com prazo válido e depois empurra prazo+data_publicacao pra trás,
    // mantendo prazo > data_publicacao (constraint ck_anuncio_prazo) mas
    // prazo < NOW() pra exercitar o filtro do service.
    const expirado = await criarAnuncioParaTeste({ lat: BETIM_LAT, lng: BETIM_LNG });
    await prisma.$executeRaw`
      UPDATE anuncio
      SET data_publicacao = NOW() - INTERVAL '2 hour',
          prazo_retirada = NOW() - INTERVAL '1 hour'
      WHERE id = ${expirado.anuncio.id}
    `;

    const res = await request(app).get('/api/v1/anuncios').query({ lat: BETIM_LAT, lng: BETIM_LNG });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/anuncios — paginação', () => {
  it('pagina retorna meta correta', async () => {
    for (let i = 0; i < 25; i++) {
      await criarAnuncioParaTeste({ lat: BETIM_LAT + i * 0.0001, lng: BETIM_LNG });
    }

    const p1 = await request(app)
      .get('/api/v1/anuncios')
      .query({ lat: BETIM_LAT, lng: BETIM_LNG, raio_km: 10, pagina: 1 });
    const p2 = await request(app)
      .get('/api/v1/anuncios')
      .query({ lat: BETIM_LAT, lng: BETIM_LNG, raio_km: 10, pagina: 2 });

    expect(p1.body.data).toHaveLength(20);
    expect(p2.body.data).toHaveLength(5);
    expect(p1.body.meta).toMatchObject({ pagina: 1, tamanho: 20, total: 25 });
    expect(p2.body.meta).toMatchObject({ pagina: 2, tamanho: 20, total: 25 });
  });
});

describe('GET /api/v1/anuncios — benchmark', () => {
  // Seed dedicado ao benchmark: o helper canônico monta CNPJ a partir de `n`
  // como `${n}.123.456/0001-${n%100}`, o que estoura Char(18) quando n >= 100.
  // Aqui inserimos em massa com CNPJs formatados pra caber em Char(18).
  async function seedAnuncioBenchmark(idx: number, lat: number, lng: number) {
    const tag = String(idx).padStart(6, '0'); // 6 dígitos cobrem até 999_999
    const comerciante = await prisma.usuario.create({
      data: {
        nome: `Bench ${tag}`,
        email: `bench${tag}@test.foodloop`,
        senha_hash: 'x',
        telefone: `+5531${tag}0000`,
        tipo: 'comerciante',
      },
    });

    // CNPJ formato `XX.XXX.XXX/XXXX-XX` = 18 chars. Embuti o índice em segmentos.
    const cnpj = `${tag.slice(0, 2)}.${tag.slice(0, 3)}.${tag.slice(3, 6)}/0001-${tag.slice(4, 6)}`;
    await prisma.comerciante.create({
      data: { id_usuario: comerciante.id, cnpj },
    });

    const endereco = await prisma.endereco.create({
      data: {
        rua: 'R',
        numero: tag,
        bairro: 'B',
        cidade: 'Betim',
        estado: 'MG',
        cep: '32600-000',
        latitude: lat,
        longitude: lng,
      },
    });

    const estab = await prisma.estabelecimento.create({
      data: {
        id_comerciante: comerciante.id,
        id_endereco: endereco.id,
        nome_fantasia: `E${tag}`,
        descricao: 'd',
        horario_funcionamento: '11-22',
        nota_media: 4.5,
        ativo: true,
      },
    });

    const produto = await prisma.produto.create({
      data: {
        id_estabelecimento: estab.id,
        nome: `P${tag}`,
        descricao: 'd',
        preco_regular: 30,
        categoria: 'Lanches',
        imagem: null,
        ativo: true,
      },
    });

    await prisma.anuncio.create({
      data: {
        id_produto: produto.id,
        id_estabelecimento: estab.id,
        preco_promocional: 15,
        quantidade_inicial: 5,
        quantidade_disponivel: 5,
        prazo_retirada: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'ATIVO',
      },
    });
  }

  it('p95 < 500ms com 1000 anúncios', async () => {
    for (let i = 0; i < 1000; i++) {
      const lat = BETIM_LAT + ((i % 100) - 50) * 0.005;
      const lng = BETIM_LNG + (Math.floor(i / 100) - 5) * 0.05;
      await seedAnuncioBenchmark(i, lat, lng);
    }

    const times: number[] = [];
    for (let i = 0; i < 20; i++) {
      const t0 = performance.now();
      const res = await request(app)
        .get('/api/v1/anuncios')
        .query({ lat: BETIM_LAT, lng: BETIM_LNG, raio_km: 10 });
      const t1 = performance.now();
      expect(res.status).toBe(200);
      times.push(t1 - t0);
    }

    const sorted = [...times].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    console.log(`/api/v1/anuncios p95 over 20 runs: ${p95.toFixed(1)}ms`);
    expect(p95).toBeLessThan(500);
  }, 120_000);
});
