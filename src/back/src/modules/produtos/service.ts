import { type CreateProdutoRequest, ErrorCode, type Produto, type UpdateProdutoRequest } from '@foodloop/lib';

import { prisma } from '../../db/client.js';
import { HttpError } from '../../shared/errors.js';

const produtoSelect = {
  id: true,
  id_estabelecimento: true,
  nome: true,
  descricao: true,
  preco_regular: true,
  categoria: true,
  imagem: true,
  ativo: true,
} as const;

function shape(p: {
  id: bigint;
  id_estabelecimento: bigint;
  nome: string;
  descricao: string | null;
  preco_regular: { toString(): string };
  categoria: string | null;
  imagem: string | null;
  ativo: boolean;
}): Produto {
  return {
    id: Number(p.id),
    id_estabelecimento: Number(p.id_estabelecimento),
    nome: p.nome,
    descricao: p.descricao,
    preco_regular: Number(p.preco_regular.toString()),
    categoria: p.categoria ?? 'Outros',
    imagem: p.imagem,
    ativo: p.ativo,
  };
}

async function meuEstabId(userId: number): Promise<bigint> {
  const estab = await prisma.estabelecimento.findFirst({
    where: { id_comerciante: BigInt(userId) },
    select: { id: true },
  });
  if (estab) return estab.id;
  throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Estabelecimento não encontrado');
}

export async function listarMeus(userId: number): Promise<Produto[]> {
  const estabId = await meuEstabId(userId);
  // Excluir é soft-delete (pedidos antigos referenciam o produto via anúncio),
  // mas pro comerciante o produto desativado deixa de existir: fica fora da lista.
  const lista = await prisma.produto.findMany({
    where: { id_estabelecimento: estabId, ativo: true },
    select: produtoSelect,
    orderBy: { id: 'desc' },
  });
  return lista.map(shape);
}

export async function listarPublicos(): Promise<Produto[]> {
  const lista = await prisma.produto.findMany({
    where: { ativo: true },
    select: produtoSelect,
    orderBy: { id: 'desc' },
    take: 100,
  });
  return lista.map(shape);
}

export async function criar(input: CreateProdutoRequest, userId: number): Promise<Produto> {
  const estabId = await meuEstabId(userId);
  const novo = await prisma.produto.create({
    data: {
      id_estabelecimento: estabId,
      nome: input.nome,
      descricao: input.descricao ?? null,
      preco_regular: input.preco_regular,
      categoria: input.categoria,
      imagem: input.imagem ?? null,
    },
    select: produtoSelect,
  });
  return shape(novo);
}

async function assertOwnership(id: number, userId: number): Promise<bigint> {
  const estabId = await meuEstabId(userId);
  const produto = await prisma.produto.findUnique({
    where: { id: BigInt(id) },
    select: { id_estabelecimento: true },
  });
  if (!produto) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Produto não encontrado');
  }
  if (produto.id_estabelecimento !== estabId) {
    throw new HttpError(403, ErrorCode.PERMISSAO_NEGADA, 'Produto não pertence ao seu estabelecimento');
  }
  return estabId;
}

export async function atualizar(id: number, input: UpdateProdutoRequest, userId: number): Promise<Produto> {
  await assertOwnership(id, userId);
  const atualizado = await prisma.produto.update({
    where: { id: BigInt(id) },
    data: {
      nome: input.nome,
      descricao: input.descricao,
      preco_regular: input.preco_regular,
      categoria: input.categoria,
      imagem: input.imagem,
    },
    select: produtoSelect,
  });
  return shape(atualizado);
}

export async function desativar(id: number, userId: number): Promise<void> {
  await assertOwnership(id, userId);
  // Encerrar os anúncios ativos junto, senão a oferta continua na home do
  // cliente apontando pra um produto que o comerciante removeu.
  await prisma.$transaction([
    prisma.produto.update({
      where: { id: BigInt(id) },
      data: { ativo: false },
    }),
    prisma.anuncio.updateMany({
      where: { id_produto: BigInt(id), status: 'ATIVO' },
      data: { status: 'ENCERRADO_COM_SOBRA' },
    }),
  ]);
}
