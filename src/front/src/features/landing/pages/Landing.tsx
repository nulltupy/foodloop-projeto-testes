import { Link } from 'react-router-dom';

const botaoPrimario = 'btn btn-primary w-full px-6 text-sm sm:w-auto';
const botaoSecundario =
  'btn btn-outline w-full border-leaf-200 bg-white px-6 text-sm text-leaf-dark sm:w-auto';
const botaoClaro =
  'btn w-full bg-white px-6 text-sm font-bold text-leaf-dark shadow-pop hover:-translate-y-0.5 hover:bg-leaf-50 sm:w-auto';

function Indicador({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="border-l border-canvas-line pl-4 first:border-l-0 first:pl-0">
      <strong className="block text-2xl font-extrabold leading-none text-ink">{valor}</strong>
      <span className="mt-1 block text-xs font-semibold uppercase text-ink-mute">{rotulo}</span>
    </div>
  );
}

function ComoFunciona({ passo, titulo, texto }: { passo: string; titulo: string; texto: string }) {
  return (
    <div className="card flex min-h-full flex-col gap-3 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-leaf-50 font-extrabold text-leaf-dark">
        {passo}
      </span>
      <h3 className="text-lg font-extrabold text-ink">{titulo}</h3>
      <p className="text-sm leading-6 text-ink-soft">{texto}</p>
    </div>
  );
}

function CartaoOds({ numero, titulo, texto }: { numero: string; titulo: string; texto: string }) {
  return (
    <div className="card flex gap-4 p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-leaf text-lg font-extrabold text-white shadow-pop">
        {numero}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-extrabold text-ink">{titulo}</h3>
        <p className="text-sm leading-6 text-ink-soft">{texto}</p>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <main className="overflow-hidden bg-canvas">
      <section className="bg-canvas-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-10 lg:py-12">
          <div className="flex flex-col items-start gap-5">
            <span className="pill bg-citrus-50 text-ink">Sobra boa. Preço justo. Retirada rápida.</span>

            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-ink sm:text-5xl sm:leading-[0.98]">
                Comida boa que sobrou, com preço reduzido
              </h1>
              <p className="max-w-2xl text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
                O FoodLoop conecta padarias, lanchonetes e restaurantes que têm excedentes ao fim do dia a
                pessoas que querem comer bem pagando menos, combatendo o desperdício de alimentos.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/cadastro/cliente" className={botaoPrimario}>
                Quero economizar
              </Link>
              <Link to="/cadastro/comerciante" className={botaoSecundario}>
                Sou um comércio
              </Link>
            </div>

            <p className="text-sm font-semibold text-ink-soft">
              Já tem conta?{' '}
              <Link to="/login" className="text-leaf-dark underline decoration-leaf-200 underline-offset-4">
                Entrar
              </Link>
            </p>
          </div>

          <aside
            aria-label="Prévia da aplicação FoodLoop"
            className="relative mx-auto hidden w-full max-w-lg md:block"
          >
            <div className="overflow-hidden rounded-2xl shadow-[0_24px_60px_-16px_rgba(20,40,28,0.28)]">
              <div className="bg-canvas px-4 pb-4 pt-4">
                <h2 className="text-lg font-extrabold leading-tight text-ink">
                  Comida boa, <span className="text-leaf-dark">preço de resgate</span>.
                </h2>
                <p className="mt-1 text-xs text-ink-soft">Ofertas perto de você, antes que vá pro lixo.</p>

                <div className="mt-3 mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-canvas-line bg-canvas-card px-3 py-1.5 text-xs font-bold text-ink shadow-soft">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
                    </svg>
                    Filtrar
                  </span>
                  <span className="text-xs font-semibold text-ink-mute">2 ofertas</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Card 1 */}
                  <div className="flex flex-col overflow-hidden rounded-2xl border border-canvas-line bg-canvas-card shadow-card">
                    <div className="relative flex h-24 items-center justify-center bg-leaf-50">
                      <span className="text-4xl" aria-hidden="true">
                        🥪
                      </span>
                      <span className="selo absolute right-2 top-2 h-[40px] w-[40px] text-[11px] leading-tight">
                        −41%
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      <p className="truncate text-[10px] font-semibold text-ink-mute">Couto Lanches</p>
                      <h3 className="mt-0.5 truncate text-xs font-extrabold text-ink">
                        Combo salgado + suco
                      </h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-leaf-dark">R$ 12,90</span>
                        <span className="text-[10px] text-ink-mute line-through">R$ 21,90</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="inline-flex items-center rounded-full bg-leaf-50 px-1.5 py-0.5 text-[9px] font-semibold text-leaf-dark">
                          0,4 km
                        </span>
                        <span className="inline-flex items-center rounded-full bg-leaf-50 px-1.5 py-0.5 text-[9px] font-semibold text-leaf-dark">
                          até 21h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="flex flex-col overflow-hidden rounded-2xl border border-canvas-line bg-canvas-card shadow-card">
                    <div className="relative flex h-24 items-center justify-center bg-leaf-50">
                      <span className="text-4xl" aria-hidden="true">
                        🥖
                      </span>
                      <span className="selo absolute right-2 top-2 h-[40px] w-[40px] text-[11px] leading-tight">
                        −43%
                      </span>
                      <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                        ⚡ fecha logo
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      <p className="truncate text-[10px] font-semibold text-ink-mute">Padaria Central</p>
                      <h3 className="mt-0.5 truncate text-xs font-extrabold text-ink">Sacola de pães</h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-leaf-dark">R$ 8,50</span>
                        <span className="text-[10px] text-ink-mute line-through">R$ 15,00</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="inline-flex items-center rounded-full bg-leaf-50 px-1.5 py-0.5 text-[9px] font-semibold text-leaf-dark">
                          1,2 km
                        </span>
                        <span className="inline-flex items-center rounded-full bg-citrus-50 px-1.5 py-0.5 text-[9px] font-semibold text-citrus-dark">
                          até 20h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 rounded-lg border border-canvas-line bg-canvas-card p-4 sm:grid-cols-3">
          <Indicador valor="30%" rotulo="menos no balcão" />
          <Indicador valor="3 min" rotulo="para reservar" />
          <Indicador valor="0" rotulo="app para instalar" />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div>
            <p className="lbl">Por que existe</p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
              O excedente precisa circular.
            </h2>
          </div>
          <div className="grid gap-4 md:col-span-2 sm:grid-cols-2">
            <div className="card p-5">
              <h3 className="text-lg font-extrabold text-ink">Para quem compra</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Descobre ofertas de última hora perto de casa, reserva antes de sair e retira direto no
                balcão.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="text-lg font-extrabold text-ink">Para quem vende</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Publica o que sobrou, reduz perda no fechamento e transforma excedente em nova receita.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-leaf-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="lbl">O problema</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Comida boa não deveria virar descarte.</h2>
            <p className="mt-4 leading-8 text-ink-soft">
              Todos os dias, comércios de alimentação descartam produtos perfeitamente bons só porque não
              foram vendidos antes de fechar. É prejuízo para o estabelecimento e desperdício de comida que
              poderia alimentar pessoas.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              ['Excedente vira perda', 'Sem um canal de escoamento, o que sobra no balcão acaba no lixo.'],
              [
                'Descoberta difícil',
                'O consumidor não enxerga as ofertas de última hora perto de casa ou do trabalho.',
              ],
              ['Impacto ambiental', 'Comida descartada significa recursos, energia e trabalho jogados fora.'],
            ].map(([titulo, texto]) => (
              <div
                key={titulo}
                className="flex gap-3 rounded-lg border border-leaf-200 bg-white p-4 shadow-soft"
              >
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-citrus" aria-hidden="true" />
                <p className="text-sm leading-6 text-ink-soft">
                  <strong className="text-ink">{titulo}.</strong> {texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <p className="lbl">Como funciona</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Reserva simples, retirada sem atrito.</h2>
          <p className="mt-3 leading-8 text-ink-soft">
            Uma plataforma web que abre direto no navegador para os dois lados da economia circular de
            alimentos.
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
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1fr_0.9fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-leaf-100">Para o seu comércio</p>
            <h2 className="mt-2 text-3xl font-extrabold">Venda o que sobrou antes de fechar.</h2>
            <p className="mt-4 max-w-2xl leading-8 text-leaf-100">
              Cadastre seu estabelecimento, publique produtos com preço promocional e acompanhe os pedidos
              pelo painel. O que iria para o lixo vira venda, fluxo no balcão e clientes recorrentes.
            </p>
            <Link to="/cadastro/comerciante" className={`${botaoClaro} mt-6`}>
              Cadastrar meu comércio
            </Link>
          </div>
          <div className="grid gap-3">
            {['Cadastro do estabelecimento', 'Publicação de ofertas', 'Pedido com código de retirada'].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-4"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-citrus font-extrabold text-ink">
                    ✓
                  </span>
                  <span className="font-bold">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <p className="lbl">Sustentabilidade</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Impacto prático no consumo local.</h2>
          <p className="mt-3 leading-8 text-ink-soft">
            O FoodLoop nasce alinhado aos Objetivos de Desenvolvimento Sustentável da ONU, aproximando
            economia, acesso e redução de desperdício.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <CartaoOds
            numero="2"
            titulo="ODS 2: Fome Zero e Agricultura Sustentável"
            texto="Ao reaproveitar alimentos que seriam descartados e oferecê-los a preços acessíveis, ampliamos o acesso à comida e reduzimos perdas na cadeia."
          />
          <CartaoOds
            numero="12"
            titulo="ODS 12: Consumo e Produção Responsáveis"
            texto="Incentivamos o consumo consciente e a redução do desperdício, promovendo uma economia circular para os excedentes de alimentos."
          />
        </div>
      </section>

      <section className="border-y border-canvas-line bg-canvas-card">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <p className="lbl">Sobre o projeto</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">Quem somos</h2>
          <p className="mt-3 text-xl font-extrabold text-ink">
            Tecnologia contra desperdício no comércio local.
          </p>
          <p className="mt-4 leading-8 text-ink-soft">
            O FoodLoop é um projeto acadêmico desenvolvido por estudantes de Tecnologia, criado para enfrentar
            o desperdício de alimentos no comércio local. A solução foi idealizada em parceria com pequenos
            estabelecimentos da região, começando pelo Couto Lanches.
          </p>
          <p className="mt-4 leading-8 text-ink-soft">
            Reduzir desperdício pode ser simples, vantajoso para o comércio e bom para o bolso de quem compra.
          </p>
        </div>
      </section>

      <section className="bg-leaf">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center">
          <h2 className="max-w-2xl text-3xl font-extrabold text-white">
            Pronto para fechar o ciclo do desperdício?
          </h2>
          <p className="max-w-xl leading-7 text-leaf-50">
            Crie sua conta gratuitamente e comece a economizar ou a vender o que sobrou hoje mesmo.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/cadastro/cliente" className={botaoClaro}>
              Criar conta
            </Link>
            <Link
              to="/login"
              className="btn w-full border border-white/70 px-6 text-sm font-bold text-white hover:bg-white/10 sm:w-auto"
            >
              Entrar
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-canvas-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm font-semibold text-ink-mute">
          FoodLoop — economia circular de alimentos.
        </div>
      </footer>
    </main>
  );
}
