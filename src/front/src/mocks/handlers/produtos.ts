import { http, HttpResponse } from 'msw';
import { CreateProdutoRequestSchema, ErrorCode, UpdateProdutoRequestSchema } from '@foodloop/lib';
import { db, usuarioPorAuth } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const produtosHandlers = [
  // Vitrine pública: todos os produtos ativos sem auth.
  http.get('/api/v1/produtos/publicos', () => {
    const publicos = db.produtos.filter((p) => p.ativo);
    return HttpResponse.json(publicos);
  }),

  // Produtos do comerciante autenticado.
  http.get('/api/v1/produtos', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const meus = db.produtos.filter((p) => p.id_estabelecimento === usuario.id_estabelecimento && p.ativo);
    return HttpResponse.json(meus);
  }),

  // Produtos de um estabelecimento (vitrine pública por estab).
  http.get('/api/v1/estabelecimentos/:id/produtos', ({ params }) => {
    const produtos = db.produtos.filter((p) => p.id_estabelecimento === Number(params.id) && p.ativo);
    return HttpResponse.json(produtos);
  }),

  http.post('/api/v1/produtos', async ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante' || !usuario.id_estabelecimento) {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const parsed = CreateProdutoRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Dados inválidos', 400);

    const id = (db.produtos.at(-1)?.id ?? 0) + 1;
    const novo = {
      id,
      id_estabelecimento: usuario.id_estabelecimento,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      preco_regular: parsed.data.preco_regular,
      categoria: parsed.data.categoria,
      imagem: parsed.data.imagem ?? null,
      ativo: true,
    };
    db.produtos.push(novo);
    return HttpResponse.json(novo, { status: 201 });
  }),

  http.patch('/api/v1/produtos/:id', async ({ request, params }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante' || !usuario.id_estabelecimento) {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const id = Number(params.id);
    const atual = db.produtos.find((p) => p.id === id);
    if (!atual) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Produto não encontrado', 404);
    if (atual.id_estabelecimento !== usuario.id_estabelecimento) {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Produto não é seu', 403);
    }
    const parsed = UpdateProdutoRequestSchema.safeParse(await request.json());
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Dados inválidos', 400);
    Object.assign(atual, {
      nome: parsed.data.nome ?? atual.nome,
      descricao: parsed.data.descricao ?? atual.descricao,
      preco_regular: parsed.data.preco_regular ?? atual.preco_regular,
      categoria: parsed.data.categoria ?? atual.categoria,
      imagem: parsed.data.imagem ?? atual.imagem,
    });
    return HttpResponse.json(atual);
  }),

  http.delete('/api/v1/produtos/:id', ({ request, params }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante' || !usuario.id_estabelecimento) {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const id = Number(params.id);
    const atual = db.produtos.find((p) => p.id === id);
    if (!atual) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Produto não encontrado', 404);
    if (atual.id_estabelecimento !== usuario.id_estabelecimento) {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Produto não é seu', 403);
    }
    atual.ativo = false;
    return new HttpResponse(null, { status: 204 });
  }),
];
