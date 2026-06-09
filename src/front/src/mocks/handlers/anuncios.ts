import { http, HttpResponse } from 'msw';
import { ErrorCode, ListarAnunciosQuerySchema } from '@foodloop/lib';
import type { Anuncio, AnuncioListItem } from '@foodloop/lib';
import { db, distanciaKm, usuarioPorAuth } from '../db';

function erro(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

const PAGINA_TAMANHO = 20;

function montarListItem(
  anuncio: Anuncio,
  origem: { latitude: number; longitude: number },
): AnuncioListItem | undefined {
  const produto = db.produtos.find((p) => p.id === anuncio.id_produto);
  const estab = db.estabelecimentos.find((e) => e.id === anuncio.id_estabelecimento);
  if (!produto || !estab) return undefined;
  return {
    ...anuncio,
    produto_nome: produto.nome,
    produto_imagem: produto.imagem ?? null,
    preco_regular: produto.preco_regular,
    nome_fantasia: estab.nome_fantasia,
    nota_media: estab.nota_media ?? null,
    distancia_km: distanciaKm(origem, estab.endereco),
  };
}

export const anunciosHandlers = [
  // Anúncios do comerciante autenticado (precede ':id' para não ser capturado).
  http.get('/api/v1/anuncios/meus', ({ request }) => {
    const usuario = usuarioPorAuth(request.headers.get('Authorization'));
    if (!usuario || usuario.tipo !== 'comerciante') {
      return erro(ErrorCode.PERMISSAO_NEGADA, 'Acesso restrito ao comerciante', 403);
    }
    const meus = db.anuncios.filter((a) => a.id_estabelecimento === usuario.id_estabelecimento);
    return HttpResponse.json(meus);
  }),

  // Listagem geo (cliente).
  http.get('/api/v1/anuncios', ({ request }) => {
    const url = new URL(request.url);
    const parsed = ListarAnunciosQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return erro(ErrorCode.VALIDACAO, 'Parâmetros inválidos', 400);
    const q = parsed.data;
    const origem = { latitude: q.lat, longitude: q.lng };

    let itens = db.anuncios
      .filter((a) => a.status === 'ATIVO' && a.quantidade_disponivel > 0)
      .map((a) => montarListItem(a, origem))
      .filter((li): li is AnuncioListItem => li !== undefined)
      .filter((li) => li.distancia_km <= q.raio_km);

    if (q.preco_max !== undefined) {
      itens = itens.filter((li) => li.preco_promocional <= q.preco_max!);
    }
    if (q.categoria) {
      itens = itens.filter((li) => {
        const produto = db.produtos.find((p) => p.id === li.id_produto);
        return produto?.categoria === q.categoria;
      });
    }

    itens.sort((a, b) => a.distancia_km - b.distancia_km);

    const inicio = (q.pagina - 1) * PAGINA_TAMANHO;
    return HttpResponse.json(itens.slice(inicio, inicio + PAGINA_TAMANHO));
  }),

  // Detalhe (bare Anuncio, conforme AnuncioSchema).
  http.get('/api/v1/anuncios/:id', ({ params }) => {
    const id = Number(params.id);
    const anuncio = db.anuncios.find((a) => a.id === id);
    if (!anuncio) return erro(ErrorCode.RECURSO_NAO_ENCONTRADO, 'Anúncio não encontrado', 404);
    return HttpResponse.json(anuncio);
  }),
];
