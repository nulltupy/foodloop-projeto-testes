import { http, HttpResponse } from 'msw';
import {
  ErrorCode,
  LoginRequestSchema,
  RegisterComercianteRequestSchema,
  RegisterRequestSchema,
} from '@foodloop/lib';
import type { Endereco } from '@foodloop/lib';
import { abrirSessao, db, usuarioPorAuth } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const authHandlers = [
  http.post('/api/v1/auth/register', async ({ request }) => {
    const parsed = RegisterRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Dados inválidos', 400);
    const data = parsed.data;
    if (db.usuarios.some((u) => u.email === data.email || (data.cnpj && u.cnpj === data.cnpj))) {
      return erro(ErrorCode.CADASTRO_DUPLICADO, 'E-mail ou CNPJ já cadastrado', 409);
    }
    const id = db.proximoId.usuario++;
    db.usuarios.push({
      id,
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      telefone: data.telefone,
      tipo: data.tipo,
      cnpj: data.cnpj,
    });
    const token = abrirSessao(id);
    return HttpResponse.json(
      { usuario: { id, nome: data.nome, email: data.email, tipo: data.tipo }, token },
      { status: 201 },
    );
  }),

  http.post('/api/v1/auth/register-comerciante', async ({ request }) => {
    const parsed = RegisterComercianteRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Dados inválidos', 400);
    const data = parsed.data;
    if (db.usuarios.some((u) => u.email === data.email || u.cnpj === data.cnpj)) {
      return erro(ErrorCode.CADASTRO_DUPLICADO, 'E-mail ou CNPJ já cadastrado', 409);
    }

    const idUsuario = db.proximoId.usuario++;
    const idEstabelecimento = db.estabelecimentos.length + 1;
    const endereco: Endereco = {
      id: idEstabelecimento,
      ...data.estabelecimento.endereco,
      latitude: -23.55,
      longitude: -46.63,
    };
    db.estabelecimentos.push({
      id: idEstabelecimento,
      nome_fantasia: data.estabelecimento.nome_fantasia,
      descricao: data.estabelecimento.descricao ?? null,
      horario_funcionamento: data.estabelecimento.horario_funcionamento ?? null,
      nota_media: null,
      ativo: true,
      endereco,
    });
    db.usuarios.push({
      id: idUsuario,
      nome: data.nome,
      email: data.email,
      senha: data.senha,
      telefone: data.telefone,
      tipo: 'comerciante',
      cnpj: data.cnpj,
      id_estabelecimento: idEstabelecimento,
    });
    const token = abrirSessao(idUsuario);
    return HttpResponse.json(
      { usuario: { id: idUsuario, nome: data.nome, email: data.email, tipo: 'comerciante' }, token },
      { status: 201 },
    );
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const parsed = LoginRequestSchema.safeParse(await request.json());
    // Mensagem genérica: não revela se o e-mail existe.
    if (!parsed.success) {
      return erro(ErrorCode.CREDENCIAIS_INVALIDAS, 'E-mail ou senha inválidos', 401);
    }
    const { email, senha } = parsed.data;
    const usuario = db.usuarios.find((u) => u.email === email && u.senha === senha);
    if (!usuario) {
      return erro(ErrorCode.CREDENCIAIS_INVALIDAS, 'E-mail ou senha inválidos', 401);
    }
    const token = abrirSessao(usuario.id);
    return HttpResponse.json({
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
      token,
    });
  }),

  http.get('/api/v1/usuarios/me', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    return HttpResponse.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      tipo: usuario.tipo,
    });
  }),
];
