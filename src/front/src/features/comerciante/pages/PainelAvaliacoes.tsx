import { useQuery } from '@tanstack/react-query';
import { AvaliacoesEstabelecimento } from '../../avaliacoes/components/AvaliacoesEstabelecimento';
import { buscarMinhaLoja, CHAVE_LOJA } from '../lojaQuery';

export function PainelAvaliacoes() {
  const lojaQ = useQuery({ queryKey: CHAVE_LOJA, queryFn: buscarMinhaLoja, retry: false });

  if (lojaQ.isLoading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-canvas-line/60" />;
  }

  if (lojaQ.isError || !lojaQ.data) {
    return (
      <div className="rounded-2xl bg-danger-50 p-4 text-sm font-semibold text-danger-dark">
        Não foi possível carregar suas avaliações. Tente novamente.
      </div>
    );
  }

  const loja = lojaQ.data;
  return (
    <section className="card p-4 sm:p-5">
      <h2 className="text-lg font-extrabold text-ink">Avaliações</h2>
      <p className="mt-0.5 text-sm text-ink-soft">
        Veja o que os clientes acharam e responda às avaliações da sua loja.
      </p>
      <AvaliacoesEstabelecimento estabelecimentoId={loja.id} />
    </section>
  );
}
