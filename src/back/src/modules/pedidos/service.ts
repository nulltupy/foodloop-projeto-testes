import { ErrorCode, gerarCodigoRetirada, type StatusPedido } from '@foodloop/lib';

import { prisma } from '../../db/client.js';
import { HttpError } from '../../shared/errors.js';

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
  return prisma.$transaction(async (tx) => {
    const item = params.itens[0]!;

    // Lock pessimista via update with returning para evitar oversell.
    const anuncio = await tx.anuncio.findUnique({ where: { id: BigInt(item.id_anuncio) } });
    if (!anuncio) {
      throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Anúncio não encontrado');
    }
    if (anuncio.status !== 'ATIVO') {
      throw new HttpError(409, ErrorCode.ANUNCIO_NAO_ATIVO, 'Anúncio não disponível');
    }
    if (anuncio.quantidade_disponivel < item.quantidade) {
      throw new HttpError(409, ErrorCode.ANUNCIO_ESGOTADO, 'Quantidade insuficiente');
    }

    await tx.anuncio.update({
      where: { id: anuncio.id },
      data: { quantidade_disponivel: anuncio.quantidade_disponivel - item.quantidade },
    });

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
  return montar(atualizado);
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
