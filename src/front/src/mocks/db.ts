// Banco em memória do MSW: usuários, estabelecimentos, produtos, anúncios e
// pedidos. Os dados seguem os schemas de @foodloop/lib para que os handlers
// devolvam payloads conformes ao contrato. Seed determinístico com faker.
import { faker } from '@faker-js/faker';
import type {
  Anuncio,
  Avaliacao,
  ComentarioAvaliacao,
  Endereco,
  Estabelecimento,
  Notificacao,
  Pedido,
  Produto,
  TipoUsuario,
} from '@foodloop/lib';

// Usuário interno do mock: inclui a senha (em texto) só para casar no login.
export interface UsuarioMock {
  id: number;
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  tipo: TipoUsuario;
  cnpj?: string;
  id_estabelecimento?: number;
  foto_url?: string | null;
}

// Notificação do mock com o dono, para filtrar por usuário autenticado.
export type NotificacaoMock = Notificacao & { id_usuario: number };

// Avaliação do mock com o autor (cliente do pedido), para resolver o nome na
// listagem do perfil sem alterar o contrato.
export type AvaliacaoMock = Avaliacao & { id_cliente: number };

// Comentário do mock guarda o id do autor para a autorização e o nome resolvido.
export type ComentarioMock = ComentarioAvaliacao & { id_usuario: number };

export interface MockDb {
  usuarios: UsuarioMock[];
  estabelecimentos: Estabelecimento[];
  produtos: Produto[];
  anuncios: Anuncio[];
  pedidos: Pedido[];
  notificacoes: NotificacaoMock[];
  avaliacoes: AvaliacaoMock[];
  comentarios: ComentarioMock[];
  // token -> id do usuário autenticado
  sessoes: Map<string, number>;
  proximoId: { usuario: number; pedido: number; avaliacao: number; comentario: number };
}

// Centro aproximado de São Paulo, usado como origem das coordenadas fake.
const CENTRO = { latitude: -23.55, longitude: -46.63 };
const CATEGORIAS = ['Padaria', 'Lanche', 'Refeição', 'Doce', 'Bebida', 'Hortifruti'];

function coordsProximas(): { latitude: number; longitude: number } {
  return {
    latitude: CENTRO.latitude + faker.number.float({ min: -0.05, max: 0.05 }),
    longitude: CENTRO.longitude + faker.number.float({ min: -0.05, max: 0.05 }),
  };
}

function criarEndereco(id: number): Endereco {
  const c = coordsProximas();
  return {
    id,
    rua: faker.location.street(),
    numero: String(faker.number.int({ min: 1, max: 1999 })),
    bairro: faker.location.county(),
    cidade: 'São Paulo',
    estado: 'SP',
    cep: faker.string.numeric(5) + '-' + faker.string.numeric(3),
    latitude: c.latitude,
    longitude: c.longitude,
  };
}

function semear(): MockDb {
  faker.seed(20260101);

  const estabelecimentos: Estabelecimento[] = [];
  const produtos: Produto[] = [];
  const anuncios: Anuncio[] = [];

  let produtoId = 1;
  let anuncioId = 1;

  // 5 estabelecimentos com 3 produtos cada.
  for (let e = 1; e <= 5; e++) {
    estabelecimentos.push({
      id: e,
      nome_fantasia: faker.company.name(),
      descricao: faker.company.catchPhrase(),
      horario_funcionamento: '08:00 - 20:00',
      nota_media: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
      ativo: true,
      endereco: criarEndereco(e),
    });

    for (let p = 0; p < 3; p++) {
      produtos.push({
        id: produtoId,
        id_estabelecimento: e,
        nome: faker.commerce.productName(),
        descricao: faker.commerce.productDescription(),
        preco_regular: faker.number.float({ min: 10, max: 60, fractionDigits: 2 }),
        categoria: faker.helpers.arrayElement(CATEGORIAS),
        imagem: faker.image.urlLoremFlickr({ category: 'food' }),
        ativo: true,
      });
      produtoId++;
    }
  }

  // 50 anúncios distribuídos entre os produtos existentes.
  while (anuncioId <= 50) {
    const produto = faker.helpers.arrayElement(produtos);
    const inicial = faker.number.int({ min: 1, max: 12 });
    const disponivel = faker.number.int({ min: 0, max: inicial });
    anuncios.push({
      id: anuncioId,
      id_produto: produto.id,
      id_estabelecimento: produto.id_estabelecimento,
      preco_promocional: Number((produto.preco_regular * 0.5).toFixed(2)),
      quantidade_inicial: inicial,
      quantidade_disponivel: disponivel,
      prazo_retirada: faker.date.soon({ days: 2 }).toISOString(),
      status: 'ATIVO',
    });
    anuncioId++;
  }

  // Usuários demo para login manual durante o desenvolvimento.
  const usuarios: UsuarioMock[] = [
    {
      id: 1,
      nome: 'Cliente Demo',
      email: 'cliente@foodloop.dev',
      senha: 'senha123',
      telefone: '+5511999990001',
      tipo: 'cliente',
    },
    {
      id: 2,
      nome: 'Comerciante Demo',
      email: 'comerciante@foodloop.dev',
      senha: 'senha123',
      telefone: '+5511999990002',
      tipo: 'comerciante',
      cnpj: '12345678000199',
      id_estabelecimento: 1,
    },
  ];

  // Notificações de exemplo para o cliente demo (id 1).
  const notificacoes: NotificacaoMock[] = [
    {
      id: 1,
      id_usuario: 1,
      titulo: 'Bem-vindo ao FoodLoop',
      corpo: 'Aproveite as ofertas perto de você.',
      deep_link: null,
      lida: false,
      data_envio: new Date().toISOString(),
    },
    {
      id: 2,
      id_usuario: 1,
      titulo: 'Atualização do pedido',
      corpo: 'Seu pedido está pronto para retirada.',
      deep_link: '/pedidos/1',
      lida: false,
      data_envio: new Date().toISOString(),
    },
  ];

  return {
    usuarios,
    estabelecimentos,
    produtos,
    anuncios,
    pedidos: [],
    notificacoes,
    avaliacoes: [],
    comentarios: [],
    sessoes: new Map(),
    proximoId: { usuario: 3, pedido: 1, avaliacao: 1, comentario: 1 },
  };
}

export let db: MockDb = semear();

// Recria o estado inicial (usado entre testes para garantir isolamento).
export function resetarDb(): void {
  db = semear();
}

// Haversine simples: distância em km entre duas coordenadas.
export function distanciaKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Number((2 * R * Math.asin(Math.sqrt(h))).toFixed(2));
}

// Gera um token opaco e registra a sessão.
export function abrirSessao(idUsuario: number): string {
  const token = `mock.${idUsuario}.${faker.string.alphanumeric(24)}`;
  db.sessoes.set(token, idUsuario);
  return token;
}

// Resolve o usuário a partir do header Authorization (Bearer <token>).
export function usuarioPorAuth(header: string | null): UsuarioMock | undefined {
  if (!header?.startsWith('Bearer ')) return undefined;
  const id = db.sessoes.get(header.slice('Bearer '.length));
  return id ? db.usuarios.find((u) => u.id === id) : undefined;
}
