import { ErrorCode, type UpdateUsuarioRequest } from '@foodloop/lib';

import { prisma } from '../../db/client.js';
import { HttpError } from '../../shared/errors.js';

// Usuário autenticado serializado para resposta: BigInt vira number e o
// senha_hash nunca entra (select explícito não o inclui).
export interface UsuarioMe {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  tipo: 'cliente' | 'comerciante';
  foto_url: string | null;
  data_cadastro: string;
}

export async function getMe(userId: number): Promise<UsuarioMe> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: BigInt(userId) },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      tipo: true,
      foto_url: true,
      data_cadastro: true,
    },
  });
  if (!usuario) {
    throw new HttpError(404, ErrorCode.RECURSO_NAO_ENCONTRADO, 'Usuário não encontrado');
  }

  return {
    id: Number(usuario.id),
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    tipo: usuario.tipo,
    foto_url: usuario.foto_url,
    data_cadastro: usuario.data_cadastro.toISOString(),
  };
}

// Atualiza apenas nome/telefone/foto_url. email e tipo não são alterados: o
// schema descarta qualquer outra chave, então eles nunca chegam ao update.
export async function updateMe(userId: number, patch: UpdateUsuarioRequest): Promise<UsuarioMe> {
  const data: { nome?: string; telefone?: string; foto_url?: string } = {};
  if (patch.nome !== undefined) data.nome = patch.nome;
  if (patch.telefone !== undefined) data.telefone = patch.telefone;
  if (patch.foto_url !== undefined) data.foto_url = patch.foto_url;

  await prisma.usuario.update({ where: { id: BigInt(userId) }, data });
  return getMe(userId);
}
