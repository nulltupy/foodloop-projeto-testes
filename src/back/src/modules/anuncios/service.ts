import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../db/client.js';

export const TAMANHO_PAGINA = 20;

interface ListarParams {
  lat: number;
  lng: number;
  raio_km: number;
  preco_max?: number;
  categoria?: string;
  pagina: number;
}

interface RawRow {
  id: bigint;
  id_produto: bigint;
  id_estabelecimento: bigint;
  preco_promocional: Prisma.Decimal;
  quantidade_inicial: number;
  quantidade_disponivel: number;
  prazo_retirada: Date;
  status: 'ATIVO' | 'ENCERRADO_COM_SOBRA' | 'ENCERRADO_COM_RESERVA';
  produto_nome: string;
  produto_imagem: string | null;
  preco_regular: Prisma.Decimal;
  nome_fantasia: string;
  nota_media: Prisma.Decimal | null;
  distancia_km: number;
}

function filtroPrecoMax(precoMax: number | undefined): Prisma.Sql {
  return precoMax === undefined ? Prisma.empty : Prisma.sql`AND a.preco_promocional <= ${precoMax}`;
}

function filtroCategoria(categoria: string | undefined): Prisma.Sql {
  return categoria === undefined ? Prisma.empty : Prisma.sql`AND p.categoria = ${categoria}`;
}

export async function listarProximos(params: ListarParams) {
  const offset = (params.pagina - 1) * TAMANHO_PAGINA;
  const precoFiltro = filtroPrecoMax(params.preco_max);
  const catFiltro = filtroCategoria(params.categoria);

  // Subquery wraps the Haversine expression so the outer WHERE can filter by
  // the computed alias `distancia_km`. PG não aceita HAVING sem GROUP BY com
  // referência a coluna não-agregada. Raio Terra = 6371 km.
  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT * FROM (
      SELECT
        a.id, a.id_produto, a.id_estabelecimento,
        a.preco_promocional, a.quantidade_inicial, a.quantidade_disponivel,
        a.prazo_retirada, a.status,
        p.nome AS produto_nome, p.imagem AS produto_imagem, p.preco_regular,
        e.nome_fantasia, e.nota_media,
        (6371 * acos(
          cos(radians(${params.lat})) * cos(radians(en.latitude)) *
          cos(radians(en.longitude) - radians(${params.lng})) +
          sin(radians(${params.lat})) * sin(radians(en.latitude))
        ))::float8 AS distancia_km
      FROM anuncio a
      JOIN produto p ON p.id = a.id_produto
      JOIN estabelecimento e ON e.id = a.id_estabelecimento
      JOIN endereco en ON en.id = e.id_endereco
      WHERE a.status = 'ATIVO'
        AND a.quantidade_disponivel > 0
        AND a.prazo_retirada > NOW()
        ${precoFiltro}
        ${catFiltro}
    ) sub
    WHERE sub.distancia_km <= ${params.raio_km}
    ORDER BY sub.distancia_km ASC, sub.preco_promocional ASC
    LIMIT ${TAMANHO_PAGINA} OFFSET ${offset}
  `;

  const total = await contarProximos(params);

  return {
    data: rows.map((r) => ({
      id: Number(r.id),
      id_produto: Number(r.id_produto),
      id_estabelecimento: Number(r.id_estabelecimento),
      preco_promocional: Number(r.preco_promocional),
      quantidade_inicial: r.quantidade_inicial,
      quantidade_disponivel: r.quantidade_disponivel,
      prazo_retirada: r.prazo_retirada.toISOString(),
      status: r.status,
      produto_nome: r.produto_nome,
      produto_imagem: r.produto_imagem,
      preco_regular: Number(r.preco_regular),
      nome_fantasia: r.nome_fantasia,
      nota_media: r.nota_media === null ? null : Number(r.nota_media),
      distancia_km: r.distancia_km,
    })),
    meta: {
      pagina: params.pagina,
      tamanho: TAMANHO_PAGINA,
      total,
    },
  };
}

async function contarProximos(params: ListarParams): Promise<number> {
  const precoFiltro = filtroPrecoMax(params.preco_max);
  const catFiltro = filtroCategoria(params.categoria);

  const result = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*)::bigint AS total FROM (
      SELECT
        (6371 * acos(
          cos(radians(${params.lat})) * cos(radians(en.latitude)) *
          cos(radians(en.longitude) - radians(${params.lng})) +
          sin(radians(${params.lat})) * sin(radians(en.latitude))
        ))::float8 AS distancia_km
      FROM anuncio a
      JOIN produto p ON p.id = a.id_produto
      JOIN estabelecimento e ON e.id = a.id_estabelecimento
      JOIN endereco en ON en.id = e.id_endereco
      WHERE a.status = 'ATIVO'
        AND a.quantidade_disponivel > 0
        AND a.prazo_retirada > NOW()
        ${precoFiltro}
        ${catFiltro}
    ) sub
    WHERE sub.distancia_km <= ${params.raio_km}
  `;

  return Number(result[0]?.total ?? 0n);
}
