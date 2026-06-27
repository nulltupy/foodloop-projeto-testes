import { http, HttpResponse } from 'msw';
import { ErrorCode } from '@foodloop/lib';
import type { NotificacaoMock } from '../db';
import { db, usuarioPorAuth } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function semDono(n: NotificacaoMock) {
  return {
    id: n.id,
    titulo: n.titulo,
    corpo: n.corpo,
    deep_link: n.deep_link,
    lida: n.lida,
    data_envio: n.data_envio,
  };
}

export const notificacoesHandlers = [
  http.get('/api/v1/notificacoes', ({ request }) => {
    const u = usuarioPorAuth(request.headers.get('Authorization'));
    if (!u) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    const minhas = db.notificacoes.filter((n) => n.id_usuario === u.id);
    const lida = new URL(request.url).searchParams.get('lida');
    const data = lida === null ? minhas : minhas.filter((n) => n.lida === (lida === 'true'));
    const naoLidas = minhas.filter((n) => !n.lida).length;
    return HttpResponse.json({
      data: data.map(semDono),
      meta: { pagina: 1, tamanho: 20, total: data.length, nao_lidas: naoLidas },
    });
  }),

  // Precede '/:id/lida' para não casar "ler-todas" como id.
  http.patch('/api/v1/notificacoes/ler-todas', ({ request }) => {
    const u = usuarioPorAuth(request.headers.get('Authorization'));
    if (!u) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    let atualizadas = 0;
    db.notificacoes.forEach((n) => {
      if (n.id_usuario === u.id && !n.lida) {
        n.lida = true;
        atualizadas++;
      }
    });
    return HttpResponse.json({ atualizadas });
  }),

  http.patch('/api/v1/notificacoes/:id/lida', ({ params, request }) => {
    const u = usuarioPorAuth(request.headers.get('Authorization'));
    if (!u) return erro(ErrorCode.TOKEN_INVALIDO, 'Token inválido', 401);
    const notif = db.notificacoes.find((n) => n.id === Number(params.id) && n.id_usuario === u.id);
    if (!notif) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Notificação não encontrada', 404);
    notif.lida = true;
    return new HttpResponse(null, { status: 204 });
  }),
];
