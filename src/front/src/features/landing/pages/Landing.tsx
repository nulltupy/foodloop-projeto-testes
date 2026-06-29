import { Link } from 'react-router-dom';

// Página pública de entrada: apresenta o FoodLoop a visitantes não autenticados
// e direciona para login/cadastro. Reutiliza os tokens do design system
// (brand/accent/ink/surface) e os mesmos padrões de botão/card das demais telas.

const botaoPrimario =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-5 font-medium text-white';
const botaoSecundario =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-500 px-5 font-medium text-brand-700';

function ComoFunciona({ passo, titulo, texto }: { passo: string; titulo: string; texto: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-surface-200 bg-white p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
        {passo}
      </span>
      <h3 className="font-semibold text-ink-900">{titulo}</h3>
      <p className="text-sm text-ink-500">{texto}</p>
    </div>
  );
}

function CartaoOds({ numero, titulo, texto }: { numero: string; titulo: string; texto: string }) {
  return (
    <div className="flex gap-4 rounded-lg border border-surface-200 bg-white p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
        {numero}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-ink-900">{titulo}</h3>
        <p className="text-sm text-ink-500">{texto}</p>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-brand-50">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center md:py-24">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
            Menos desperdício, mais economia
          </span>
          <h1 className="text-3xl font-bold text-ink-900 md:text-5xl">
            Comida boa que sobrou, com <span className="text-brand-600">preço reduzido</span>
          </h1>
          <p className="max-w-2xl text-base text-ink-700 md:text-lg">
            O FoodLoop conecta padarias, lanchonetes e restaurantes que têm excedentes ao fim do dia a pessoas
            que querem comer bem pagando menos — combatendo o desperdício de alimentos.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/cadastro/cliente" className={botaoPrimario}>
              Quero economizar
            </Link>
            <Link to="/cadastro/comerciante" className={botaoSecundario}>
              Sou um comércio
            </Link>
          </div>
          <p className="text-sm text-ink-500">
            Já tem conta?{' '}
            <Link to="/login" className="font-medium text-brand-700">
              Entrar
            </Link>
          </p>
        </div>
      </section>

      {/* Problema */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold text-brand-700">O problema</h2>
            <p className="text-ink-700">
              Todos os dias, comércios de alimentação descartam produtos perfeitamente bons só porque não
              foram vendidos antes de fechar. É prejuízo para o estabelecimento e desperdício de comida que
              poderia alimentar pessoas.
            </p>
            <p className="text-ink-700">
              Do outro lado, há quem queira comer bem gastando menos, mas não tem como saber o que está
              sobrando por perto naquele momento.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            <li className="rounded-lg border border-surface-200 bg-white p-4 text-ink-700">
              <span className="font-semibold text-ink-900">Excedente vira perda.</span> Sem um canal de
              escoamento, o que sobra no balcão acaba no lixo.
            </li>
            <li className="rounded-lg border border-surface-200 bg-white p-4 text-ink-700">
              <span className="font-semibold text-ink-900">Descoberta difícil.</span> O consumidor não enxerga
              as ofertas de última hora perto de casa ou do trabalho.
            </li>
            <li className="rounded-lg border border-surface-200 bg-white p-4 text-ink-700">
              <span className="font-semibold text-ink-900">Impacto ambiental.</span> Comida descartada
              significa recursos e trabalho jogados fora.
            </li>
          </ul>
        </div>
      </section>

      {/* Proposta de valor / Como funciona */}
      <section className="bg-surface-100">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-semibold text-brand-700">Como o FoodLoop funciona</h2>
            <p className="mx-auto max-w-2xl text-ink-700">
              Uma plataforma web simples, que abre direto no navegador, para os dois lados da economia
              circular de alimentos.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ComoFunciona
              passo="1"
              titulo="Encontre ofertas próximas"
              texto="Veja, a partir da sua localização ou CEP, os excedentes com desconto disponíveis perto de você."
            />
            <ComoFunciona
              passo="2"
              titulo="Reserve em segundos"
              texto="Garanta o item antes de sair de casa e receba um código de retirada para apresentar no balcão."
            />
            <ComoFunciona
              passo="3"
              titulo="Retire e pague no local"
              texto="Vá ao estabelecimento dentro do prazo, mostre o código e pague presencialmente ao retirar."
            />
          </div>

          <div className="mt-8 rounded-lg border border-surface-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900">Para o seu comércio</h3>
            <p className="mt-2 text-ink-700">
              Cadastre seu estabelecimento, publique os produtos que sobraram com preço promocional e
              acompanhe os pedidos recebidos pelo painel. Transforme o que iria para o lixo em uma nova venda
              e em clientes recorrentes.
            </p>
            <Link to="/cadastro/comerciante" className={`${botaoPrimario} mt-4`}>
              Cadastrar meu comércio
            </Link>
          </div>
        </div>
      </section>

      {/* ODS */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-semibold text-brand-700">Compromisso com a sustentabilidade</h2>
          <p className="mx-auto max-w-2xl text-ink-700">
            O FoodLoop nasce alinhado aos Objetivos de Desenvolvimento Sustentável (ODS) da ONU.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <CartaoOds
            numero="2"
            titulo="ODS 2 — Fome Zero e Agricultura Sustentável"
            texto="Ao reaproveitar alimentos que seriam descartados e oferecê-los a preços acessíveis, ampliamos o acesso à comida e reduzimos perdas na cadeia."
          />
          <CartaoOds
            numero="12"
            titulo="ODS 12 — Consumo e Produção Responsáveis"
            texto="Incentivamos o consumo consciente e a redução do desperdício, promovendo uma economia circular para os excedentes de alimentos."
          />
        </div>
      </section>

      {/* Quem somos */}
      <section className="bg-surface-100">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-2xl font-semibold text-brand-700">Quem somos</h2>
          <p className="mt-4 text-ink-700">
            O FoodLoop é um projeto acadêmico desenvolvido por estudantes de Tecnologia, criado para enfrentar
            o desperdício de alimentos no comércio local. A solução foi idealizada em parceria com pequenos
            estabelecimentos da região, começando pelo Couto Lanches, com o objetivo de gerar impacto
            ambiental e social real por meio da tecnologia.
          </p>
          <p className="mt-4 text-ink-700">
            Acreditamos que reduzir o desperdício pode ser simples, vantajoso para o comércio e bom para o
            bolso de quem compra.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-600">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-14 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Pronto para fechar o ciclo do desperdício?
          </h2>
          <p className="max-w-xl text-brand-50">
            Crie sua conta gratuitamente e comece a economizar — ou a vender o que sobrou — hoje mesmo.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/cadastro/cliente"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 font-medium text-brand-700"
            >
              Criar conta
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white px-5 font-medium text-white"
            >
              Entrar
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-ink-500">
          FoodLoop — economia circular de alimentos.
        </div>
      </footer>
    </main>
  );
}
