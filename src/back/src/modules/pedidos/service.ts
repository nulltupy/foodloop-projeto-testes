import { ErrorCode, gerarCodigoRetirada, type StatusPedido, type TipoUsuario } from '@foodloop/lib';

import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../shared/errors.js';
import * as notificacoes from '../notificacoes/service.js';

interface CriarParams {
  id_cliente: number;
  itens: { id_anuncio: number; quantidade: number }[];
}

// Avanço linear do ciclo do pedido. Cancelamento (* → CANCELADO) é pós-MVP.
const TRANSICOES_OK: Partial<Record<StatusPedido, StatusPedido[]>> = {
  RECEBIDO: ['EM_PREPARO'],
  EM_PREPARO: ['PRONTO_PARA_RETIRADA'],
  PRONTO_PARA_RETIRADA: ['RETIRADO'],
};

export async function criar(params: CriarParams) {
  const resultado = await prisma.$transaction(async (tx) => {
    const item = params.itens[0]!;

    // findUnique só pra erros amigáveis (404 / não ativo) e pegar preço + estab.
    // A reserva de estoque NÃO se baseia nesta leitura — ver decremento atômico abaixo.
    const anuncio = await tx.anuncio.findUnique({
      where: { id: BigInt(item.id_anuncio) },
      include: { estabelecimento: { select: { ativo: true } } },
    });
    if (!anuncio) {
      throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Anúncio não encontrado');
    }
    if (anuncio.status !== 'ATIVO') {
      throw new HttpError(409, ErrorCode.ANUNCIO_NAO_ATIVO, 'Anúncio não disponível');
    }
    if (!anuncio.estabelecimento.ativo) {
      throw new HttpError(409, ErrorCode.ANUNCIO_NAO_ATIVO, 'Estabelecimento fechado');
    }

    // Decremento atômico: o UPDATE ... WHERE quantidade_disponivel >= qty é avaliado
    // sob lock de linha no Postgres, então corridas pela última unidade não dão
    // oversell — quem perde recebe count 0.
    const reserva = await tx.anuncio.updateMany({
      where: { id: anuncio.id, status: 'ATIVO', quantidade_disponivel: { gte: item.quantidade } },
      data: { quantidade_disponivel: { decrement: item.quantidade } },
    });
    if (reserva.count === 0) {
      throw new HttpError(409, ErrorCode.ANUNCIO_ESGOTADO, 'Quantidade insuficiente');
    }

    const precoUnitario = Number(anuncio.preco_promocional);
    const subtotal = precoUnitario * item.quantidade;

    let codigo = gerarCodigoRetirada();
    // Retry simples em caso de colisão (1 em 32^8 — quase impossível).
    for (let i = 0; i < 5; i++) {
      const existe = await tx.pedido.findUnique({ where: { codigo_retirada: codigo } });
      if (!existe) break;
      codigo = gerarCodigoRetirada();
    }

    const pedido = await tx.pedido.create({
      data: {
        id_cliente: BigInt(params.id_cliente),
        id_estabelecimento: anuncio.id_estabelecimento,
        valor_total: subtotal,
        codigo_retirada: codigo,
        status: 'RECEBIDO',
        item_pedido: {
          create: {
            id_anuncio: anuncio.id,
            quantidade: item.quantidade,
            preco_unitario: precoUnitario,
          },
        },
        pagamento: {
          create: {
            valor: subtotal,
            forma_pagamento: 'PIX',
            status_pagamento: 'PENDENTE',
          },
        },
      },
      include: { item_pedido: true },
    });

    return montar(pedido);
  });
  await notificacoes.notificarNovoPedido(resultado.id_estabelecimento, resultado.id);
  return resultado;
}

export async function getById(id: number) {
  const p = await prisma.pedido.findUnique({
    where: { id: BigInt(id) },
    include: { item_pedido: true },
  });
  if (!p) return null;
  return montar(p);
}

export async function avancarStatus(
  comercianteId: number,
  pedidoId: number,
  novoStatus: StatusPedido,
  codigoRetirada?: string,
) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: BigInt(pedidoId) },
    include: { estabelecimento: true },
  });
  if (!pedido) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado');
  }
  // estabelecimento.id_comerciante já é o id do usuário comerciante — não precisa
  // joinar comerciante.
  if (pedido.estabelecimento.id_comerciante !== BigInt(comercianteId)) {
    throw new HttpError(403, ErrorCode.PERMISSAO_NEGADA, 'Pedido de outro estabelecimento');
  }

  if (!TRANSICOES_OK[pedido.status]?.includes(novoStatus)) {
    throw new HttpError(409, ErrorCode.VALIDACAO, `Transição inválida: ${pedido.status} → ${novoStatus}`);
  }

  // Retirada só se confirma com o código que o cliente apresenta.
  if (novoStatus === 'RETIRADO') {
    if (!codigoRetirada) {
      throw new HttpError(400, ErrorCode.VALIDACAO, 'Código de retirada obrigatório');
    }
    if (codigoRetirada !== pedido.codigo_retirada) {
      throw new HttpError(400, ErrorCode.CODIGO_RETIRADA_INVALIDO, 'Código de retirada incorreto');
    }
  }

  const atualizado = await prisma.pedido.update({
    where: { id: pedido.id },
    data: { status: novoStatus },
    include: { item_pedido: true },
  });
  const resultado = montar(atualizado);
  await notificacoes.notificarStatusPedido(resultado.id_cliente, resultado.id, novoStatus);
  return resultado;
}

// Estados a partir dos quais o pedido ainda pode ser cancelado.
const CANCELAVEL: StatusPedido[] = ['RECEBIDO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA'];

export async function cancelar(
  usuario: { id: number; tipo: TipoUsuario },
  pedidoId: number,
  motivo?: string,
) {
  const resultado = await prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id: BigInt(pedidoId) },
      include: { estabelecimento: true },
    });
    if (!pedido) {
      throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado');
    }

    const ehDono = pedido.id_cliente === BigInt(usuario.id);
    const ehComerciante = pedido.estabelecimento.id_comerciante === BigInt(usuario.id);
    if (!ehDono && !ehComerciante) {
      throw new HttpError(403, ErrorCode.PERMISSAO_NEGADA, 'Pedido de outro usuário');
    }

    if (!CANCELAVEL.includes(pedido.status)) {
      throw new HttpError(
        409,
        ErrorCode.PEDIDO_NAO_CANCELAVEL,
        `Pedido ${pedido.status} não pode ser cancelado`,
      );
    }
    // Cliente só cancela antes do preparo começar; o comerciante pode em qualquer
    // estado não-terminal.
    if (ehDono && !ehComerciante && pedido.status !== 'RECEBIDO') {
      throw new HttpError(
        409,
        ErrorCode.PEDIDO_NAO_CANCELAVEL,
        'Pedido já em preparo; fale com o estabelecimento',
      );
    }

    const canceladoPor: 'COMERCIANTE' | 'CLIENTE' = ehComerciante ? 'COMERCIANTE' : 'CLIENTE';
    // Transição atômica: o WHERE re-checa o status sob lock de linha, então dois
    // cancelamentos concorrentes não geram dois 200 (o perdedor recebe count 0).
    // O estoque é devolvido pelo trigger trg_controle_estoque ao virar CANCELADO.
    const estadosPermitidos: StatusPedido[] = ehComerciante ? CANCELAVEL : ['RECEBIDO'];
    const reserva = await tx.pedido.updateMany({
      where: { id: pedido.id, status: { in: estadosPermitidos } },
      data: {
        status: 'CANCELADO',
        cancelado_por: canceladoPor,
        motivo_cancelamento: motivo ?? null,
        data_cancelamento: new Date(),
      },
    });
    if (reserva.count === 0) {
      throw new HttpError(409, ErrorCode.PEDIDO_NAO_CANCELAVEL, 'Pedido não pode mais ser cancelado');
    }
    const cancelado = await tx.pedido.findUniqueOrThrow({
      where: { id: pedido.id },
      include: { item_pedido: true },
    });
    return { pedido: montar(cancelado), canceladoPor };
  });
  await notificacoes.notificarCancelamento(
    {
      id: resultado.pedido.id,
      id_cliente: resultado.pedido.id_cliente,
      id_estabelecimento: resultado.pedido.id_estabelecimento,
    },
    resultado.canceladoPor,
  );
  return resultado.pedido;
}

interface PedidoWithItens {
  id: bigint;
  id_cliente: bigint;
  id_estabelecimento: bigint;
  valor_total: { toNumber: () => number } | number;
  codigo_retirada: string;
  status: 'RECEBIDO' | 'EM_PREPARO' | 'PRONTO_PARA_RETIRADA' | 'RETIRADO' | 'CANCELADO';
  data_pedido: Date;
  item_pedido: Array<{
    id: bigint;
    id_anuncio: bigint;
    quantidade: number;
    preco_unitario: { toNumber: () => number } | number;
    subtotal: { toNumber: () => number } | number;
  }>;
}

function montar(p: PedidoWithItens) {
  return {
    id: Number(p.id),
    id_cliente: Number(p.id_cliente),
    id_estabelecimento: Number(p.id_estabelecimento),
    valor_total: Number(p.valor_total),
    status: p.status,
    codigo_retirada: p.codigo_retirada,
    data_pedido: p.data_pedido.toISOString(),
    itens: p.item_pedido.map((i) => ({
      id: Number(i.id),
      id_anuncio: Number(i.id_anuncio),
      quantidade: i.quantidade,
      preco_unitario: Number(i.preco_unitario),
      subtotal: Number(i.subtotal),
    })),
  };
}

interface ListaFiltros {
  status?: StatusPedido;
  pagina: number;
  limit: number;
}

const includeCliente = {
  estabelecimento: true,
  item_pedido: { include: { anuncio: { include: { produto: true } } } },
} as const;

const includeComerciante = {
  cliente: { include: { usuario: true } },
  item_pedido: { include: { anuncio: { include: { produto: true } } } },
} as const;

type PedidoCliente = Prisma.pedidoGetPayload<{ include: typeof includeCliente }>;
type PedidoComerciante = Prisma.pedidoGetPayload<{ include: typeof includeComerciante }>;

function shapeItens(itens: PedidoCliente['item_pedido']) {
  return itens.map((i) => ({
    id: Number(i.id),
    produto_nome: i.anuncio.produto.nome,
    quantidade: i.quantidade,
    preco_unitario: Number(i.preco_unitario),
    subtotal: Number(i.subtotal),
  }));
}

// Visão do cliente: inclui o código de retirada (é dele, mostra na retirada).
function shapeCliente(p: PedidoCliente) {
  return {
    id: Number(p.id),
    status: p.status,
    valor_total: Number(p.valor_total),
    data_pedido: p.data_pedido.toISOString(),
    codigo_retirada: p.codigo_retirada,
    estabelecimento: {
      id: Number(p.estabelecimento.id),
      nome_fantasia: p.estabelecimento.nome_fantasia,
    },
    itens: shapeItens(p.item_pedido),
  };
}

// Visão do comerciante: SEM código de retirada (segredo do cliente; o comerciante
// valida digitando o que o cliente apresenta). Inclui o nome do cliente.
function shapeComerciante(p: PedidoComerciante) {
  return {
    id: Number(p.id),
    status: p.status,
    valor_total: Number(p.valor_total),
    data_pedido: p.data_pedido.toISOString(),
    cliente: { nome: p.cliente.usuario.nome },
    itens: shapeItens(p.item_pedido),
  };
}

export async function listarDoCliente(clienteId: number, filtros: ListaFiltros) {
  const where: Prisma.pedidoWhereInput = {
    id_cliente: BigInt(clienteId),
    ...(filtros.status ? { status: filtros.status } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: includeCliente,
      orderBy: { data_pedido: 'desc' },
      skip: (filtros.pagina - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.pedido.count({ where }),
  ]);
  return { data: data.map(shapeCliente), meta: { pagina: filtros.pagina, tamanho: filtros.limit, total } };
}

export async function listarDoComerciante(comercianteUserId: number, filtros: ListaFiltros) {
  const estab = await prisma.estabelecimento.findFirst({
    where: { id_comerciante: BigInt(comercianteUserId) },
    select: { id: true },
  });
  if (!estab) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Estabelecimento não encontrado');
  }
  const where: Prisma.pedidoWhereInput = {
    id_estabelecimento: estab.id,
    ...(filtros.status ? { status: filtros.status } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: includeComerciante,
      orderBy: { data_pedido: 'desc' },
      skip: (filtros.pagina - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.pedido.count({ where }),
  ]);
  return {
    data: data.map(shapeComerciante),
    meta: { pagina: filtros.pagina, tamanho: filtros.limit, total },
  };
}
