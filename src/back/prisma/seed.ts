import bcrypt from 'bcryptjs';

import { disconnectDb, prisma } from '../src/db/client.js';
import { logger } from '../src/shared/logger.js';

const SENHA_DEMO = 'demo1234';
const BCRYPT_COST = 10;

const ESTABS = [
  {
    // Couto Lanches é o piloto real do FoodLoop. Endereço, bairro e coords
    // vindos do Google Maps. Os outros 4 estabelecimentos são fictícios em
    // bairros próximos pra demo ter variedade de distância.
    nome: 'Couto Lanches',
    rua: 'Rua Conceição Rosa Lima',
    numero: '390',
    bairro: 'Ingá',
    cep: '32604-480',
    lat: -19.9540017,
    lng: -44.1991884,
    prods: ['X-Tudo', 'Pastel de carne', 'Misto quente', 'Refrigerante 350ml'],
  },
  {
    nome: 'Padaria Pão Quente',
    rua: 'Avenida Edméia Mata Machado',
    numero: '250',
    bairro: 'Angola',
    cep: '32672-100',
    lat: -19.9722,
    lng: -44.2034,
    prods: ['Pão na chapa', 'Coxinha', 'Pão de queijo', 'Suco de laranja'],
  },
  {
    nome: 'Sabor Caseiro',
    rua: 'Avenida Goiás',
    numero: '1200',
    bairro: 'Centro',
    cep: '32600-100',
    lat: -19.9612,
    lng: -44.1918,
    prods: ['Marmita executiva', 'Prato do dia', 'Sobremesa do dia', 'Água mineral'],
  },
  {
    nome: 'Açaí da Praça',
    rua: 'Praça da Bandeira',
    numero: '50',
    bairro: 'PTB',
    cep: '32650-100',
    lat: -19.9595,
    lng: -44.2055,
    prods: ['Açaí 500ml', 'Vitamina', 'Tapioca', 'Smoothie de banana'],
  },
  {
    nome: 'Bistrô do Bairro',
    rua: 'Rua Belo Horizonte',
    numero: '800',
    bairro: 'Citrolândia',
    cep: '32690-100',
    lat: -19.9755,
    lng: -44.1903,
    prods: ['Quiche', 'Salada Caesar', 'Torta de frango', 'Café espresso'],
  },
] as const;

const CATEGORIAS = ['Lanches', 'Bebidas', 'Sobremesa', 'Padaria'] as const;

const NOTAS_MEDIAS = [4.2, 4.3, 4.4, 4.5, 4.6] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function imgUrl(slug: string, n: number): string {
  return `https://picsum.photos/seed/${slug}-${n}/400/300`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function limparDadosDemo(): Promise<void> {
  // CASCADE elimina device_token, notificacao, preferencia_notificacao
  // automaticamente via FK para usuario. RESTART IDENTITY zera autoincrement
  // para os IDs ficarem previsíveis (1..N) em cada rodada de seed.
  await prisma.$executeRawUnsafe(
    'TRUNCATE pedido, item_pedido, pagamento, avaliacao, anuncio, produto, estabelecimento, endereco, comerciante, cliente, usuario RESTART IDENTITY CASCADE',
  );
}

async function criarClientes(): Promise<void> {
  for (let i = 1; i <= 3; i++) {
    const u = await prisma.usuario.create({
      data: {
        nome: `Cliente Demo ${i}`,
        email: `cliente${i}@demo.foodloop`,
        senha_hash: await bcrypt.hash(SENHA_DEMO, BCRYPT_COST),
        telefone: `+553199999${pad2(i)}00`,
        tipo: 'cliente',
      },
    });
    await prisma.cliente.create({ data: { id_usuario: u.id } });
  }
}

async function criarEstabsComProdutosEAnuncios(): Promise<void> {
  const agora = Date.now();

  for (const [i, e] of ESTABS.entries()) {
    const idx = i + 1;
    const slug = slugify(e.nome);

    const comercianteUser = await prisma.usuario.create({
      data: {
        nome: `${e.nome} (admin)`,
        email: `comerciante${idx}@demo.foodloop`,
        senha_hash: await bcrypt.hash(SENHA_DEMO, BCRYPT_COST),
        telefone: `+553188888${pad2(idx)}00`,
        tipo: 'comerciante',
      },
    });

    await prisma.comerciante.create({
      data: {
        id_usuario: comercianteUser.id,
        cnpj: `${pad2(idx)}.111.111/0001-00`,
      },
    });

    const end = await prisma.endereco.create({
      data: {
        rua: e.rua,
        numero: e.numero,
        bairro: e.bairro,
        cidade: 'Betim',
        estado: 'MG',
        cep: e.cep,
        latitude: e.lat,
        longitude: e.lng,
      },
    });

    const est = await prisma.estabelecimento.create({
      data: {
        id_comerciante: comercianteUser.id,
        id_endereco: end.id,
        nome_fantasia: e.nome,
        descricao: `Estabelecimento demo em ${e.bairro}, Betim/MG.`,
        horario_funcionamento: '11:00 às 22:00',
        nota_media: NOTAS_MEDIAS[i],
        ativo: true,
      },
    });

    for (let p = 0; p < 4; p++) {
      const produto = await prisma.produto.create({
        data: {
          id_estabelecimento: est.id,
          nome: e.prods[p],
          descricao: 'Delicioso, fresco, do dia.',
          preco_regular: 25 + p * 5,
          categoria: CATEGORIAS[p % CATEGORIAS.length],
          imagem: imgUrl(slug, p),
          ativo: true,
        },
      });

      await prisma.anuncio.create({
        data: {
          id_produto: produto.id,
          id_estabelecimento: est.id,
          preco_promocional: (25 + p * 5) * 0.5,
          quantidade_inicial: 5,
          quantidade_disponivel: 5,
          prazo_retirada: new Date(agora + (2 + p) * 60 * 60 * 1000),
          status: 'ATIVO',
        },
      });
    }
  }
}

async function main(): Promise<void> {
  logger.info('seed demo: iniciando');
  await limparDadosDemo();
  await criarClientes();
  await criarEstabsComProdutosEAnuncios();
  logger.info('seed demo OK: 3 clientes + 5 estabelecimentos + 20 anúncios');
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, 'seed falhou');
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
