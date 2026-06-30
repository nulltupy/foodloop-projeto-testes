import {
  type Avaliacao,
  type AvaliacaoPerfilItem,
  type ComentarioAvaliacao,
  type CriarAvaliacaoRequest,
  ErrorCode,
  type StatusPedido,
  type TipoUsuario,
} from '@foodloop/lib';

import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../db/client.js';
import { HttpError } from '../../shared/errors.js';
import * as notificacoes from '../notificacoes/service.js';

const JANELA_AVALIACAO_MS = 24 * 60 * 60 * 1000;

interface AvaliacaoResumoInput {
  id: bigint;
  nota: number;
  comentario: string | null;
  data_avaliacao: Date;
}

interface AvaliacaoRow extends AvaliacaoResumoInput {
  id_pedido: bigint;
  id_estabelecimento: bigint;
}

export function shapeAvaliacaoResumo(a: AvaliacaoResumoInput | null) {
  if (!a) return null;
  return {
    id: Number(a.id),
    nota: a.nota,
    comentario: a.comentario,
    data_avaliacao: a.data_avaliacao.toISOString(),
  };
}

export function elegibilidadeAvaliacao(params: {
  status: StatusPedido;
  data_retirada: Date | null;
  avaliacao: AvaliacaoResumoInput | null;
}) {
  const expiraEm = params.data_retirada
    ? new Date(params.data_retirada.getTime() + JANELA_AVALIACAO_MS)
    : null;
  const podeAvaliar =
    params.status === 'RETIRADO' &&
    !params.avaliacao &&
    expiraEm !== null &&
    expiraEm.getTime() >= Date.now();

  return {
    avaliacao: shapeAvaliacaoResumo(params.avaliacao),
    data_retirada: params.data_retirada?.toISOString() ?? null,
    pode_avaliar: podeAvaliar,
    avaliacao_expira_em: expiraEm?.toISOString() ?? null,
  };
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

function nomePublico(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'Cliente';
  const inicial = partes[1]?.[0];
  return inicial ? `${partes[0]} ${inicial}.` : partes[0]!;
}

// Cria a avaliação de um pedido retirado do próprio cliente. A nota_media do
// estabelecimento é recalculada pelo trigger trg_nota_media.
export async function criar(clienteId: number, input: CriarAvaliacaoRequest): Promise<Avaliacao> {
  const pedido = await prisma.pedido.findUnique({
    where: { id: BigInt(input.id_pedido) },
    include: { avaliacao: true },
  });
  if (!pedido) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Pedido não encontrado');
  }
  if (pedido.id_cliente !== BigInt(clienteId)) {
    throw new HttpError(403, ErrorCode.PERMISSAO_NEGADA, 'Pedido de outro cliente');
  }
  if (pedido.avaliacao) {
    throw new HttpError(409, ErrorCode.AVALIACAO_DUPLICADA, 'Este pedido já foi avaliado');
  }
  if (pedido.status !== 'RETIRADO') {
    throw new HttpError(409, ErrorCode.PEDIDO_NAO_ENTREGUE, 'Só é possível avaliar pedidos entregues');
  }

  const elegibilidade = elegibilidadeAvaliacao({
    status: pedido.status,
    data_retirada: pedido.data_retirada,
    avaliacao: pedido.avaliacao,
  });
  if (!elegibilidade.pode_avaliar) {
    throw new HttpError(409, ErrorCode.AVALIACAO_PRAZO_EXPIRADO, 'Prazo para avaliação expirado');
  }

  try {
    const criada = await prisma.avaliacao.create({
      data: {
        id_pedido: pedido.id,
        id_estabelecimento: pedido.id_estabelecimento,
        nota: input.nota,
        comentario: input.comentario?.trim() ? input.comentario.trim() : null,
      },
    });
    await notificacoes.notificarNovaAvaliacao(Number(criada.id_estabelecimento), criada.nota);
    return shape(criada);
  } catch (e) {
    // uq_avaliacao_pedido: uma avaliação por pedido. Corrida ou repique vira 409.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new HttpError(409, ErrorCode.AVALIACAO_DUPLICADA, 'Este pedido já foi avaliado');
    }
    throw e;
  }
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
    autor: { nome: nomePublico(a.pedido.cliente.usuario.nome) },
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
