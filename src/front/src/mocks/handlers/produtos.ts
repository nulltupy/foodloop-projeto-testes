import { http, HttpResponse } from 'msw';
import { CreateProdutoRequestSchema, ErrorCode } from '@foodloop/lib';
import { db, usuarioPorAuth } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

export const produtosHandlers = [
  // Produtos do comerciante autenticado.
  http.get('/api/v1/produtos', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const meus = db.produtos.filter((p) => p.id_estabelecimento === usuario.id_estabelecimento);
    return HttpResponse.json(meus);
  }),

  // Produtos de um estabelecimento (vitrine pública).
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

    const id = db.produtos.length + 1;
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
];
