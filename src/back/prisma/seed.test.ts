import { execSync } from 'node:child_process';

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { disconnectDb, prisma } from '../src/db/client.js';

describe('seed demo', () => {
  // O setup global em test/setup.ts roda TRUNCATE usuario CASCADE antes de
  // cada teste. Por isso resemeamos a cada `it()` em vez de usar beforeAll —
  // caso contrário só o primeiro teste enxerga os dados. tsx prisma/seed.ts
  // é o comando registrado em package.json#prisma.seed; cwd implícita é
  // src/back porque os scripts npm rodam na pasta do workspace.
  beforeEach(() => {
    execSync('npm run seed', { stdio: 'inherit' });
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('cria exatamente 3 clientes, 5 estabelecimentos, 20 produtos, 20 anúncios', async () => {
    const [clientes, estabs, produtos, anuncios] = await Promise.all([
      prisma.cliente.count(),
      prisma.estabelecimento.count(),
      prisma.produto.count(),
      prisma.anuncio.count(),
    ]);

    expect({ clientes, estabs, produtos, anuncios }).toEqual({
      clientes: 3,
      estabs: 5,
      produtos: 20,
      anuncios: 20,
    });
  });

  it('todo anúncio tem status ATIVO e prazo_retirada no futuro', async () => {
    const agora = new Date();
    const anuncios = await prisma.anuncio.findMany({
      select: { status: true, prazo_retirada: true },
    });
    expect(anuncios).toHaveLength(20);
    for (const a of anuncios) {
      expect(a.status).toBe('ATIVO');
      expect(a.prazo_retirada.getTime()).toBeGreaterThan(agora.getTime());
    }
  });

  it('5 estabelecimentos espalhados em Betim/MG (lat ~-19.9x, lng ~-44.1x/-44.2x)', async () => {
    const estabs = await prisma.estabelecimento.findMany({
      include: { endereco: true },
    });
    expect(estabs).toHaveLength(5);
    for (const e of estabs) {
      expect(e.endereco.cidade).toBe('Betim');
      expect(e.endereco.estado).toBe('MG');
      const lat = e.endereco.latitude.toNumber();
      const lng = e.endereco.longitude.toNumber();
      expect(lat).toBeGreaterThan(-19.99);
      expect(lat).toBeLessThan(-19.95);
      expect(lng).toBeGreaterThan(-44.21);
      expect(lng).toBeLessThan(-44.18);
    }
  });
});
