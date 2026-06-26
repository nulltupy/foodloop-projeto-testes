import {
  type CreateEstabelecimentoRequest,
  type Estabelecimento,
  ErrorCode,
  type StatusPedido,
  type UpdateEstabelecimentoRequest,
} from '@foodloop/lib';

import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../db/client.js';
import { geocodingEndereco } from '../geocoding/service.js';
import * as notificacoes from '../notificacoes/service.js';
import { HttpError } from '../../shared/errors.js';

// Inclui o endereço — formato de retorno comum a getById/getMeu/criar/atualizar.
const comEndereco = { endereco: true } as const;

type EstabComEndereco = Prisma.estabelecimentoGetPayload<{ include: typeof comEndereco }>;

function shape(e: EstabComEndereco): Estabelecimento {
  return {
    id: Number(e.id),
    nome_fantasia: e.nome_fantasia,
    descricao: e.descricao,
    horario_funcionamento: e.horario_funcionamento,
    nota_media: e.nota_media === null ? null : Number(e.nota_media),
    ativo: e.ativo,
    endereco: {
      id: Number(e.endereco.id),
      rua: e.endereco.rua,
      numero: e.endereco.numero,
      bairro: e.endereco.bairro,
      cidade: e.endereco.cidade,
      estado: e.endereco.estado,
      cep: e.endereco.cep,
      latitude: Number(e.endereco.latitude),
      longitude: Number(e.endereco.longitude),
    },
  };
}

// Coluna é Char(9): normaliza para o formato com hífen (#####-###).
function normalizarCep(cep: string): string {
  const digitos = cep.replace(/\D/g, '');
  return `${digitos.slice(0, 5)}-${digitos.slice(5, 8)}`;
}

function queryGeocoding(endereco: CreateEstabelecimentoRequest['endereco']): string {
  return [endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado, 'Brasil']
    .filter((parte) => parte && parte.trim().length > 0)
    .join(', ');
}

export async function getById(id: number): Promise<Estabelecimento | null> {
  const e = await prisma.estabelecimento.findUnique({ where: { id: BigInt(id) }, include: comEndereco });
  return e ? shape(e) : null;
}

export async function getMeu(comercianteId: number): Promise<Estabelecimento | null> {
  const e = await prisma.estabelecimento.findFirst({
    where: { id_comerciante: BigInt(comercianteId) },
    include: comEndereco,
  });
  return e ? shape(e) : null;
}

export async function criar(
  comercianteId: number,
  input: CreateEstabelecimentoRequest,
): Promise<Estabelecimento> {
  // Checa antes de geocodificar: evita queimar uma chamada upstream e criar um
  // endereço órfão quando o comerciante já tem estabelecimento (inclui o default
  // lazy criado pelo fluxo de produtos).
  const existente = await prisma.estabelecimento.findFirst({
    where: { id_comerciante: BigInt(comercianteId) },
    select: { id: true },
  });
  if (existente) {
    throw new HttpError(409, ErrorCode.ESTABELECIMENTO_JA_EXISTE, 'Comerciante já possui estabelecimento');
  }

  const coords = await geocodingEndereco(queryGeocoding(input.endereco));

  try {
    const criado = await prisma.$transaction(async (tx) => {
      const endereco = await tx.endereco.create({
        data: {
          rua: input.endereco.rua,
          numero: input.endereco.numero,
          bairro: input.endereco.bairro,
          cidade: input.endereco.cidade,
          estado: input.endereco.estado,
          cep: normalizarCep(input.endereco.cep),
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
      return tx.estabelecimento.create({
        data: {
          id_comerciante: BigInt(comercianteId),
          id_endereco: endereco.id,
          nome_fantasia: input.nome_fantasia,
          descricao: input.descricao ?? null,
          horario_funcionamento: input.horario_funcionamento ?? null,
        },
        include: comEndereco,
      });
    });
    return shape(criado);
  } catch (e) {
    // Corrida: dois POST concorrentes passam pelo check e batem na uq_estab_comerciante.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new HttpError(409, ErrorCode.ESTABELECIMENTO_JA_EXISTE, 'Comerciante já possui estabelecimento');
    }
    throw e;
  }
}

export async function atualizar(
  comercianteId: number,
  patch: UpdateEstabelecimentoRequest,
): Promise<Estabelecimento> {
  const estab = await prisma.estabelecimento.findFirst({
    where: { id_comerciante: BigInt(comercianteId) },
    include: comEndereco,
  });
  if (!estab) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Estabelecimento não encontrado');
  }

  // Geocodifica fora da transação quando o endereço muda.
  const coords = patch.endereco ? await geocodingEndereco(queryGeocoding(patch.endereco)) : null;

  const atualizado = await prisma.$transaction(async (tx) => {
    if (patch.endereco && coords) {
      await tx.endereco.update({
        where: { id: estab.id_endereco },
        data: {
          rua: patch.endereco.rua,
          numero: patch.endereco.numero,
          bairro: patch.endereco.bairro,
          cidade: patch.endereco.cidade,
          estado: patch.endereco.estado,
          cep: normalizarCep(patch.endereco.cep),
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
    }
    return tx.estabelecimento.update({
      where: { id: estab.id },
      data: {
        nome_fantasia: patch.nome_fantasia,
        descricao: patch.descricao,
        horario_funcionamento: patch.horario_funcionamento,
      },
      include: comEndereco,
    });
  });
  return shape(atualizado);
}

// Pedidos ainda em aberto (não-terminais) que o fechamento precisa cancelar.
const PEDIDOS_ABERTOS: StatusPedido[] = ['RECEBIDO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA'];

async function meuEstabId(comercianteId: number): Promise<bigint> {
  const estab = await prisma.estabelecimento.findFirst({
    where: { id_comerciante: BigInt(comercianteId) },
    select: { id: true },
  });
  if (!estab) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Estabelecimento não encontrado');
  }
  return estab.id;
}

// Fecha a loja: inativa o estabelecimento, encerra os anúncios ativos e cancela
// os pedidos em aberto. O estoque dos pedidos cancelados é devolvido pelo trigger
// trg_controle_estoque (um UPDATE por linha dispara o trigger por linha).
export async function fechar(comercianteId: number, motivo?: string): Promise<Estabelecimento> {
  const id = await meuEstabId(comercianteId);
  // Captura os pedidos que serão cancelados antes do update, pra poder notificar os clientes.
  const abertos = await prisma.pedido.findMany({
    where: { id_estabelecimento: id, status: { in: PEDIDOS_ABERTOS } },
    select: { id: true, id_cliente: true },
  });
  await prisma.$transaction([
    prisma.estabelecimento.update({ where: { id }, data: { ativo: false } }),
    prisma.anuncio.updateMany({
      where: { id_estabelecimento: id, status: 'ATIVO' },
      data: { status: 'ENCERRADO_COM_SOBRA' },
    }),
    prisma.pedido.updateMany({
      where: { id_estabelecimento: id, status: { in: PEDIDOS_ABERTOS } },
      data: {
        status: 'CANCELADO',
        cancelado_por: 'COMERCIANTE',
        motivo_cancelamento: motivo ?? 'Estabelecimento fechado',
        data_cancelamento: new Date(),
      },
    }),
  ]);
  // Notifica cada cliente cujo pedido foi cancelado pelo fechamento (notificar é best-effort).
  for (const p of abertos) {
    await notificacoes.notificarCancelamento(
      { id: Number(p.id), id_cliente: Number(p.id_cliente), id_estabelecimento: Number(id) },
      'COMERCIANTE',
    );
  }
  const atualizado = await prisma.estabelecimento.findUniqueOrThrow({ where: { id }, include: comEndereco });
  return shape(atualizado);
}

// Reabre a loja. Anúncios/pedidos encerrados não voltam — o comerciante recria os anúncios.
export async function abrir(comercianteId: number): Promise<Estabelecimento> {
  const id = await meuEstabId(comercianteId);
  const atualizado = await prisma.estabelecimento.update({
    where: { id },
    data: { ativo: true },
    include: comEndereco,
  });
  return shape(atualizado);
}

export async function listarProdutos(idEstabelecimento: number) {
  const produtos = await prisma.produto.findMany({
    where: { id_estabelecimento: BigInt(idEstabelecimento), ativo: true },
    orderBy: { id: 'asc' },
  });
  return produtos.map((p) => ({
    id: Number(p.id),
    id_estabelecimento: Number(p.id_estabelecimento),
    nome: p.nome,
    descricao: p.descricao,
    preco_regular: Number(p.preco_regular),
    categoria: p.categoria,
    imagem: p.imagem,
    ativo: p.ativo,
  }));
}
