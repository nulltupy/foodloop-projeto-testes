import { http, HttpResponse } from 'msw';
import {
  CreateEstabelecimentoRequestSchema,
  ErrorCode,
  UpdateEstabelecimentoRequestSchema,
} from '@foodloop/lib';
import type { Endereco } from '@foodloop/lib';
import { db, usuarioPorAuth } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const estabelecimentosHandlers = [
  // Estabelecimento do comerciante autenticado (precede ':id').
  http.get('/api/v1/estabelecimentos/me', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const estab = db.estabelecimentos.find((e) => e.id === usuario.id_estabelecimento);
    if (!estab) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Sem estabelecimento', 404);
    return HttpResponse.json(estab);
  }),

  http.get('/api/v1/estabelecimentos/:id', ({ params }) => {
    const estab = db.estabelecimentos.find((e) => e.id === Number(params.id));
    if (!estab) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Estabelecimento não encontrado', 404);
    return HttpResponse.json(estab);
  }),

  http.post('/api/v1/estabelecimentos', async ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    if (usuario.id_estabelecimento) {
      return erro(ErrorCode.ESTABELECIMENTO_JA_EXISTE, 'Comerciante já possui estabelecimento', 409);
    }
    const parsed = CreateEstabelecimentoRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Dados inválidos', 400);

    const id = db.estabelecimentos.length + 1;
    // Geocoding simulado: o back computaria lat/lng; aqui usamos o centro.
    const endereco: Endereco = {
      id,
      ...parsed.data.endereco,
      latitude: -23.55,
      longitude: -46.63,
    };
    const novo = {
      id,
      nome_fantasia: parsed.data.nome_fantasia,
      descricao: parsed.data.descricao ?? null,
      horario_funcionamento: parsed.data.horario_funcionamento ?? null,
      nota_media: null,
      ativo: true,
      endereco,
    };
    db.estabelecimentos.push(novo);
    usuario.id_estabelecimento = id;
    return HttpResponse.json(novo, { status: 201 });
  }),

  http.patch('/api/v1/estabelecimentos/me', async ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const estab = db.estabelecimentos.find((e) => e.id === usuario.id_estabelecimento);
    if (!estab) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Sem estabelecimento', 404);
    const parsed = UpdateEstabelecimentoRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Dados inválidos', 400);
    const d = parsed.data;
    if (d.nome_fantasia !== undefined) estab.nome_fantasia = d.nome_fantasia;
    if (d.descricao !== undefined) estab.descricao = d.descricao ?? null;
    if (d.horario_funcionamento !== undefined) {
      estab.horario_funcionamento = d.horario_funcionamento;
    }
    if (d.endereco) estab.endereco = { ...estab.endereco, ...d.endereco };
    return HttpResponse.json(estab);
  }),

  http.post('/api/v1/estabelecimentos/me/fechar', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const estab = db.estabelecimentos.find((e) => e.id === usuario.id_estabelecimento);
    if (!estab) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Sem estabelecimento', 404);
    estab.ativo = false;
    return HttpResponse.json(estab);
  }),

  http.post('/api/v1/estabelecimentos/me/abrir', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const estab = db.estabelecimentos.find((e) => e.id === usuario.id_estabelecimento);
    if (!estab) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Sem estabelecimento', 404);
    estab.ativo = true;
    return HttpResponse.json(estab);
  }),
];
