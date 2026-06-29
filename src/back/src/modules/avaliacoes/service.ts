import {
  type Avaliacao,
  type AvaliacaoPerfilItem,
  type ComentarioAvaliacao,
  type CriarAvaliacaoRequest,
  ErrorCode,
  type TipoUsuario,
} from '@foodloop/lib';

import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../shared/errors.js';

// Cria a avaliação de um pedido entregue do próprio cliente. A nota_media do
// estabelecimento é recalculada pelo trigger trg_nota_media — não mexemos nela aqui.
export async function criar(clienteId: number, input: CriarAvaliacaoRequest): Promise<Avaliacao> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: BigInt(input.id_pedido) },
    select: { id_cliente: true, id_estabelecimento: true, status: true },
  });
  if (!pedido) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado');
  }
  if (pedido.id_cliente !== BigInt(clienteId)) {
    throw new HttpError(403, ErrorCode.PERMISSAO_NEGADA, 'Pedido de outro cliente');
  }
  // Só avalia o que recebeu: a entrega é o estado RETIRADO.
  if (pedido.status !== 'RETIRADO') {
    throw new HttpError(409, ErrorCode.PEDIDO_NAO_ENTREGUE, 'Só é possível avaliar pedidos entregues');
  }

  try {
    const criada = await prisma.avaliacao.create({
      data: {
        id_pedido: BigInt(input.id_pedido),
        id_estabelecimento: pedido.id_estabelecimento,
        nota: input.nota,
        comentario: input.comentario?.trim() ? input.comentario.trim() : null,
      },
    });
    return shape(criada);
  } catch (e) {
    // uq_avaliacao_pedido: uma avaliação por pedido. Corrida ou repique vira 409.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new HttpError(409, ErrorCode.AVALIACAO_DUPLICADA, 'Este pedido já foi avaliado');
    }
    throw e;
  }
}

interface AvaliacaoRow {
  id: bigint;
  id_pedido: bigint;
  id_estabelecimento: bigint;
  nota: number;
  comentario: string | null;
  data_avaliacao: Date;
}

function shape(a: AvaliacaoRow): Avaliacao {
  return {
    id: Number(a.id),
    id_pedido: Number(a.id_pedido),
    id_estabelecimento: Number(a.id_estabelecimento),
    nota: a.nota,
    comentario: a.comentario,
    data_avaliacao: a.data_avaliacao.toISOString(),
  };
}

const incluiComentarios = {
  include: { usuario: { select: { nome: true, tipo: true } } },
  orderBy: { data_comentario: 'asc' },
} as const;

const incluiPerfil = {
  pedido: { include: { cliente: { include: { usuario: { select: { nome: true } } } } } },
  comentario_avaliacao: incluiComentarios,
} as const;

type AvaliacaoPerfil = Prisma.avaliacaoGetPayload<{ include: typeof incluiPerfil }>;
type ComentarioRow = Prisma.comentario_avaliacaoGetPayload<{ include: typeof incluiComentarios.include }>;

function shapeComentario(c: ComentarioRow): ComentarioAvaliacao {
  return {
    id: Number(c.id),
    id_avaliacao: Number(c.id_avaliacao),
    comentario: c.comentario,
    data_comentario: c.data_comentario.toISOString(),
    autor: { nome: c.usuario.nome, tipo: c.usuario.tipo },
  };
}

function shapePerfil(a: AvaliacaoPerfil): AvaliacaoPerfilItem {
  return {
    id: Number(a.id),
    nota: a.nota,
    comentario: a.comentario,
    data_avaliacao: a.data_avaliacao.toISOString(),
    autor: { nome: a.pedido.cliente.usuario.nome },
    comentarios: a.comentario_avaliacao.map(shapeComentario),
  };
}

// Lista as avaliações de um estabelecimento (perfil público), mais recentes
// primeiro, com a thread de comentários de cada uma.
export async function listarDoEstabelecimento(idEstabelecimento: number): Promise<AvaliacaoPerfilItem[]> {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { id_estabelecimento: BigInt(idEstabelecimento) },
    include: incluiPerfil,
    orderBy: { data_avaliacao: 'desc' },
  });
  return avaliacoes.map(shapePerfil);
}

// Adiciona um comentário à thread de uma avaliação. Só o cliente que avaliou ou
// o comerciante dono do estabelecimento avaliado podem comentar.
export async function comentar(
  usuario: { id: number; tipo: TipoUsuario },
  idAvaliacao: number,
  comentario: string,
): Promise<ComentarioAvaliacao> {
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id: BigInt(idAvaliacao) },
    select: {
      pedido: { select: { id_cliente: true } },
      estabelecimento: { select: { id_comerciante: true } },
    },
  });
  if (!avaliacao) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Avaliação não encontrada');
  }

  const ehCliente = avaliacao.pedido.id_cliente === BigInt(usuario.id);
  const ehComerciante = avaliacao.estabelecimento.id_comerciante === BigInt(usuario.id);
  if (!ehCliente && !ehComerciante) {
    throw new HttpError(403, ErrorCode.PERMISSAO_NEGADA, 'Sem permissão para comentar esta avaliação');
  }

  const criado = await prisma.comentario_avaliacao.create({
    data: {
      id_avaliacao: BigInt(idAvaliacao),
      id_usuario: BigInt(usuario.id),
      comentario: comentario.trim(),
    },
    include: { usuario: { select: { nome: true, tipo: true } } },
  });
  return shapeComentario(criado);
}

// Thread de comentários de uma avaliação (público), mais antigos primeiro.
export async function listarComentarios(idAvaliacao: number): Promise<ComentarioAvaliacao[]> {
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id: BigInt(idAvaliacao) },
    select: { id: true },
  });
  if (!avaliacao) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Avaliação não encontrada');
  }
  const comentarios = await prisma.comentario_avaliacao.findMany({
    where: { id_avaliacao: BigInt(idAvaliacao) },
    include: { usuario: { select: { nome: true, tipo: true } } },
    orderBy: { data_comentario: 'asc' },
  });
  return comentarios.map(shapeComentario);
}
