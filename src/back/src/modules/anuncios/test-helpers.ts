import bcrypt from 'bcryptjs';

import { prisma } from '../../db/client.js';

export interface CriarAnuncioOverrides {
  lat?: number;
  lng?: number;
  precoPromocional?: number;
  precoRegular?: number;
  categoria?: string;
  status?: 'ATIVO' | 'ENCERRADO_COM_SOBRA' | 'ENCERRADO_COM_RESERVA';
  quantidadeDisponivel?: number;
  prazoRetiradaMs?: number;
  nomeFantasia?: string;
  nomeProduto?: string;
  notaMedia?: number | null;
}

let contadorEntidades = 0;

export async function criarAnuncioParaTeste(overrides: CriarAnuncioOverrides = {}) {
  const n = ++contadorEntidades;
  const senhaHash = await bcrypt.hash('senha-teste-123', 4);

  const comercianteUser = await prisma.usuario.create({
    data: {
      nome: `Comerciante ${n}`,
      email: `comerciante${n}@test.foodloop`,
      senha_hash: senhaHash,
      telefone: `+5531999${String(n).padStart(6, '0')}`,
      tipo: 'comerciante',
    },
  });

  await prisma.comerciante.create({
    data: {
      id_usuario: comercianteUser.id,
      cnpj: `${String(n).padStart(2, '0')}.123.456/0001-${String(n % 100).padStart(2, '0')}`,
    },
  });

  const endereco = await prisma.endereco.create({
    data: {
      rua: 'Rua Teste',
      numero: String(n),
      bairro: 'Bairro Teste',
      cidade: 'Betim',
      estado: 'MG',
      cep: '32600-000',
      latitude: overrides.lat ?? -19.97,
      longitude: overrides.lng ?? -44.2,
    },
  });

  const estabelecimento = await prisma.estabelecimento.create({
    data: {
      id_comerciante: comercianteUser.id,
      id_endereco: endereco.id,
      nome_fantasia: overrides.nomeFantasia ?? `Estab ${n}`,
      descricao: 'Estabelecimento de teste.',
      horario_funcionamento: '11:00 às 22:00',
      nota_media: overrides.notaMedia === null ? 0 : (overrides.notaMedia ?? 4.5),
      ativo: true,
    },
  });

  const produto = await prisma.produto.create({
    data: {
      id_estabelecimento: estabelecimento.id,
      nome: overrides.nomeProduto ?? `Produto ${n}`,
      descricao: 'Produto de teste.',
      preco_regular: overrides.precoRegular ?? 30,
      categoria: overrides.categoria ?? 'Lanches',
      imagem: `https://picsum.photos/seed/p${n}/400/300`,
      ativo: true,
    },
  });

  const anuncio = await prisma.anuncio.create({
    data: {
      id_produto: produto.id,
      id_estabelecimento: estabelecimento.id,
      preco_promocional: overrides.precoPromocional ?? 15,
      quantidade_inicial: 5,
      quantidade_disponivel: overrides.quantidadeDisponivel ?? 5,
      prazo_retirada: new Date(Date.now() + (overrides.prazoRetiradaMs ?? 2 * 60 * 60 * 1000)),
      status: overrides.status ?? 'ATIVO',
    },
  });

  return { anuncio, produto, estabelecimento, endereco, comercianteUser };
}

export function resetContadorTeste(): void {
  contadorEntidades = 0;
}
