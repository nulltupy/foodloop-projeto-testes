import { http, HttpResponse } from 'msw';
import { ErrorCode, LoginRequestSchema, RegisterRequestSchema } from '@foodloop/lib';
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
