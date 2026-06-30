import {
  type AuthResponse,
  ErrorCode,
  type LoginRequest,
  type RegisterComercianteRequest,
  type RegisterRequest,
} from '@foodloop/lib';
import bcrypt from 'bcryptjs';

import { prisma } from '../../db/client.js';
import { authConfig } from '../../shared/config/auth.js';
import { HttpError } from '../../shared/errors.js';
import { signAccessToken } from '../../shared/jwt.js';
import { normalizarCep, queriesGeocoding } from '../estabelecimentos/endereco.js';
import { geocodingEnderecoComFallback } from '../geocoding/service.js';

function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  if (!('code' in err)) return false;
  return (err as { code: unknown }).code === 'P2002';
}

export async function registrar(input: RegisterRequest): Promise<AuthResponse> {
  const senha_hash = await bcrypt.hash(input.senha, authConfig.bcryptCost);

  let usuario;
  try {
    usuario = await prisma.$transaction(async (tx) => {
      const novoUsuario = await tx.usuario.create({
        data: {
          nome: input.nome,
          email: input.email,
          senha_hash,
          telefone: input.telefone,
          tipo: input.tipo,
        },
      });

      if (input.tipo === 'cliente') {
        await tx.cliente.create({ data: { id_usuario: novoUsuario.id } });
      } else {
        // Refine do schema já garante isto; o guard explícito troca um `!` por
        // um erro de runtime caso a invariante do schema se perca.
        const { cnpj } = input;
        if (!cnpj) {
          throw new Error('CNPJ ausente para comerciante (invariante do schema violada)');
        }
        await tx.comerciante.create({
          data: { id_usuario: novoUsuario.id, cnpj },
        });
      }

      await tx.preferencia_notificacao.create({ data: { id_usuario: novoUsuario.id } });

      return novoUsuario;
    });
  } catch (err) {
    // Não diferenciamos email vs cnpj: se cada um tivesse código próprio,
    // o cliente poderia enumerar quem já está cadastrado.
    if (isUniqueConstraintError(err)) {
      throw new HttpError(409, ErrorCode.CADASTRO_DUPLICADO, 'Cadastro duplicado');
    }
    throw err;
  }

  const token = signAccessToken({ sub: usuario.id.toString(), tipo: usuario.tipo });

  return {
    usuario: {
      id: Number(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    },
    token,
  };
}

export async function registrarComerciante(input: RegisterComercianteRequest): Promise<AuthResponse> {
  const senha_hash = await bcrypt.hash(input.senha, authConfig.bcryptCost);
  const [emailExistente, cnpjExistente] = await Promise.all([
    prisma.usuario.findUnique({ where: { email: input.email }, select: { id: true } }),
    prisma.comerciante.findUnique({ where: { cnpj: input.cnpj }, select: { id_usuario: true } }),
  ]);
  if (emailExistente || cnpjExistente) {
    throw new HttpError(409, ErrorCode.CADASTRO_DUPLICADO, 'Cadastro duplicado');
  }

  const coords = await geocodingEnderecoComFallback(queriesGeocoding(input.estabelecimento.endereco));

  let usuario;
  try {
    usuario = await prisma.$transaction(async (tx) => {
      const novoUsuario = await tx.usuario.create({
        data: {
          nome: input.nome,
          email: input.email,
          senha_hash,
          telefone: input.telefone,
          tipo: 'comerciante',
        },
      });

      await tx.comerciante.create({
        data: { id_usuario: novoUsuario.id, cnpj: input.cnpj },
      });
      await tx.preferencia_notificacao.create({ data: { id_usuario: novoUsuario.id } });

      const endereco = await tx.endereco.create({
        data: {
          rua: input.estabelecimento.endereco.rua,
          numero: input.estabelecimento.endereco.numero,
          bairro: input.estabelecimento.endereco.bairro,
          cidade: input.estabelecimento.endereco.cidade,
          estado: input.estabelecimento.endereco.estado,
          cep: normalizarCep(input.estabelecimento.endereco.cep),
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });

      await tx.estabelecimento.create({
        data: {
          id_comerciante: novoUsuario.id,
          id_endereco: endereco.id,
          nome_fantasia: input.estabelecimento.nome_fantasia,
          descricao: input.estabelecimento.descricao ?? null,
          horario_funcionamento: input.estabelecimento.horario_funcionamento ?? null,
        },
      });

      return novoUsuario;
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new HttpError(409, ErrorCode.CADASTRO_DUPLICADO, 'Cadastro duplicado');
    }
    throw err;
  }

  const token = signAccessToken({ sub: usuario.id.toString(), tipo: usuario.tipo });

  return {
    usuario: {
      id: Number(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    },
    token,
  };
}

export async function autenticar(input: LoginRequest): Promise<AuthResponse> {
  // select explícito para limitar blast radius: novas colunas em `usuario` não
  // entram automaticamente em logs/erros que possam derivar daqui.
  const usuario = await prisma.usuario.findUnique({
    where: { email: input.email },
    select: { id: true, nome: true, email: true, tipo: true, senha_hash: true },
  });
  // Uma única ramificação de falha: email inexistente e senha errada compartilham
  // mesmo status, mesmo code e mesma mensagem. Diferenciá-los abre user enumeration.
  // TODO: paridade de timing (dummy bcrypt.compare no path !usuario) está deferida
  // — mesma decisão do cadastro, pra não regredir contra um alvo ainda não atingido.
  if (!usuario || !(await bcrypt.compare(input.senha, usuario.senha_hash))) {
    throw new HttpError(401, ErrorCode.CREDENCIAIS_INVALIDAS, 'Email ou senha inválidos');
  }

  const token = signAccessToken({ sub: usuario.id.toString(), tipo: usuario.tipo });

  return {
    usuario: {
      id: Number(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    },
    token,
  };
}
