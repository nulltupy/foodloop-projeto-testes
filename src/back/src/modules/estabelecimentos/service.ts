import { prisma } from '../../db/client.js';

export async function getById(id: number) {
  const e = await prisma.estabelecimento.findUnique({
    where: { id: BigInt(id) },
    include: { endereco: true },
  });
  if (!e) return null;
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
