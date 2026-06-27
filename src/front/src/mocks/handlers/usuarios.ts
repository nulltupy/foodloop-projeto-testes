import { http, HttpResponse } from 'msw';
import { ErrorCode, UpdateUsuarioRequestSchema } from '@foodloop/lib';
import { usuarioPorAuth, type UsuarioMock } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function paraUsuario(u: UsuarioMock) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    telefone: u.telefone,
    tipo: u.tipo,
    foto_url: u.foto_url ?? null,
    data_cadastro: '2026-01-01T00:00:00.000Z',
  };
}

export const usuariosHandlers = [
  http.get('/api/v1/usuarios/me', ({ request }) => {
    const u = usuarioPorAuth(request.headers.get('Authorization'));
    if (!u) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    return HttpResponse.json(paraUsuario(u));
  }),

  http.patch('/api/v1/usuarios/me', async ({ request }) => {
    const u = usuarioPorAuth(request.headers.get('Authorization'));
    if (!u) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    const parsed = UpdateUsuarioRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Dados inválidos', 400);
    if (parsed.data.nome !== undefined) u.nome = parsed.data.nome;
    if (parsed.data.telefone !== undefined) u.telefone = parsed.data.telefone;
    if (parsed.data.foto_url !== undefined) u.foto_url = parsed.data.foto_url;
    return HttpResponse.json(paraUsuario(u));
  }),
];
