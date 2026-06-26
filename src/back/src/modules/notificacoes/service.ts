import { ErrorCode, type StatusPedido } from '@foodloop/lib';

import { prisma } from '../../db/client.js';
import { HttpError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';

interface NotificacaoInput {
  titulo: string;
  corpo: string;
  deepLink?: string;
}

// Cria a notificação, respeitando a preferência do usuário (status_pedido).
async function emitir(idUsuario: bigint, n: NotificacaoInput): Promise<void> {
  const pref = await prisma.preferencia_notificacao.findUnique({
    where: { id_usuario: idUsuario },
    select: { status_pedido: true },
  });
  if (pref && !pref.status_pedido) return; // usuário desativou avisos de pedido
  await prisma.notificacao.create({
    data: { id_usuario: idUsuario, titulo: n.titulo, corpo: n.corpo, deep_link: n.deepLink ?? null },
  });
}

// Best-effort: emitir notificação nunca deve derrubar a operação principal.
async function seguro(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    logger.warn({ err: e }, 'falha ao emitir notificação');
  }
}

export async function notificarNovoPedido(idEstabelecimento: number, idPedido: number): Promise<void> {
  await seguro(async () => {
    const estab = await prisma.estabelecimento.findUnique({
      where: { id: BigInt(idEstabelecimento) },
      select: { id_comerciante: true },
    });
    if (!estab) return;
    await emitir(estab.id_comerciante, {
      titulo: 'Novo pedido',
      corpo: `Você recebeu o pedido #${idPedido}.`,
      deepLink: '/comerciante/pedidos',
    });
  });
}

export async function notificarStatusPedido(
  idCliente: number,
  idPedido: number,
  status: StatusPedido,
): Promise<void> {
  await seguro(() =>
    emitir(BigInt(idCliente), {
      titulo: 'Atualização do pedido',
      corpo: `Seu pedido #${idPedido} está ${status}.`,
      deepLink: `/pedidos/${idPedido}`,
    }),
  );
}

export async function notificarCancelamento(
  pedido: { id: number; id_cliente: number; id_estabelecimento: number },
  canceladoPor: 'CLIENTE' | 'COMERCIANTE',
): Promise<void> {
  await seguro(async () => {
    if (canceladoPor === 'CLIENTE') {
      const estab = await prisma.estabelecimento.findUnique({
        where: { id: BigInt(pedido.id_estabelecimento) },
        select: { id_comerciante: true },
      });
      if (!estab) return;
      await emitir(estab.id_comerciante, {
        titulo: 'Pedido cancelado',
        corpo: `O cliente cancelou o pedido #${pedido.id}.`,
        deepLink: '/comerciante/pedidos',
      });
    } else {
      await emitir(BigInt(pedido.id_cliente), {
        titulo: 'Pedido cancelado',
        corpo: `Seu pedido #${pedido.id} foi cancelado pelo estabelecimento.`,
        deepLink: `/pedidos/${pedido.id}`,
      });
    }
  });
}

function shape(n: {
  id: bigint;
  titulo: string;
  corpo: string;
  deep_link: string | null;
  lida: boolean;
  data_envio: Date;
}) {
  return {
    id: Number(n.id),
    titulo: n.titulo,
    corpo: n.corpo,
    deep_link: n.deep_link,
    lida: n.lida,
    data_envio: n.data_envio.toISOString(),
  };
}

export async function listar(idUsuario: number, filtros: { lida?: boolean; pagina: number; limit: number }) {
  const where = {
    id_usuario: BigInt(idUsuario),
    ...(filtros.lida === undefined ? {} : { lida: filtros.lida }),
  };
  const [data, total, naoLidas] = await Promise.all([
    prisma.notificacao.findMany({
      where,
      orderBy: { data_envio: 'desc' },
      skip: (filtros.pagina - 1) * filtros.limit,
      take: filtros.limit,
    }),
    prisma.notificacao.count({ where }),
    prisma.notificacao.count({ where: { id_usuario: BigInt(idUsuario), lida: false } }),
  ]);
  return {
    data: data.map(shape),
    meta: { pagina: filtros.pagina, tamanho: filtros.limit, total, nao_lidas: naoLidas },
  };
}

export async function marcarLida(idUsuario: number, idNotificacao: number): Promise<void> {
  // updateMany com id_usuario no where evita IDOR (só marca a própria notificação).
  const r = await prisma.notificacao.updateMany({
    where: { id: BigInt(idNotificacao), id_usuario: BigInt(idUsuario) },
    data: { lida: true },
  });
  if (r.count === 0) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Notificação não encontrada');
  }
}

export async function marcarTodasLidas(idUsuario: number): Promise<{ atualizadas: number }> {
  const r = await prisma.notificacao.updateMany({
    where: { id_usuario: BigInt(idUsuario), lida: false },
    data: { lida: true },
  });
  return { atualizadas: r.count };
}
