# Modelagem dos processos de negócio

<span style="color:red">Pré-requisitos: <a href="02-Especificacao.md"> Especificação do projeto</a></span>

> **Links úteis**:
> - [Modelagem de processos AS-IS x TO-BE](https://dheka.com.br/modelagem-as-is-to-be/)
> - [20 dicas práticas de modelagem de processos](https://dheka.com.br/20-dicas-praticas-de-modelagem-de-processos/)

Com o tema do projeto definido, escolham dois processos no contexto de negócios do cliente. Para ilustrar os potenciais ganhos com a automatização, imaginem processos manuais, ineficientes e/ou com muitas idas e vindas, gerando, assim, retrabalho. 

## Modelagem da situação atual (Modelagem AS IS)

Modelagem da situação atual (Modelagem AS-IS)
O contexto de negócio analisado é uma lanchonete que comercializa salgados e sucos para consumo local. O estabelecimento opera de forma inteiramente presencial, sem sistema informatizado de vendas, sem presença em redes sociais e sem política de promoções — os preços são fixos e pré-determinados pelo proprietário. A interação com o cliente ocorre integralmente no balcão, e a única forma atual de registro público de opinião sobre o comércio é via avaliações no Google. Ao final do expediente, os produtos que não foram vendidos durante o dia tornam-se perda para o estabelecimento, uma vez que não há mecanismo para escoá-los antes do fechamento.

Como a proposta do FoodLoop envolve funcionalidades que o estabelecimento ainda não executa de forma tecnológica (anúncio de produtos com desconto, descoberta geolocalizada, avaliações internas ao app, compra via aplicativo), o modelo AS-IS descreve como essas tarefas acontecem hoje no mundo real, mesmo quando realizadas de forma manual, improvisada ou inexistente. Foram identificados três processos principais que serão impactados pela solução proposta:

Processo de venda presencial — fluxo completo de atendimento ao cliente no balcão.
Processo de gestão de sobras ao final do expediente — destinação dos salgados não vendidos.
Processo de avaliação do estabelecimento pelo cliente — como a reputação é construída hoje, via Google.

## Descrição geral da proposta (Modelagem TO BE)

A partir dos gargalos identificados nos modelos AS IS, a proposta do FoodLoop consiste em introduzir uma plataforma mobile que permite à Couto Lanches cadastrar seus produtos excedentes ao final do expediente com desconto e tornar essas ofertas visíveis, em tempo real, a consumidores próximos por meio de busca geolocalizada. A transição da operação exclusivamente manual e presencial para uma camada digital de anúncio e reserva rompe com o modelo atual em que todo alimento não vendido durante o dia é integralmente descartado, convertendo parte dessa perda em receita recuperada.

### Oportunidades de melhoria por processo

**Processo 1, Cadastro e Publicação de Alimentos.** No cenário AS IS, a venda ocorre apenas no balcão, sem qualquer registro digital, cardápio online ou possibilidade de alcançar clientes fora do estabelecimento. No TO BE, o proprietário passa a cadastrar no aplicativo os alimentos excedentes com quantidade, data de validade e preço reduzido, publicando-os para uma base ampla de consumidores. As principais oportunidades de melhoria são: (1) ampliação do alcance comercial para além do fluxo presencial da lanchonete; (2) controle digital do estoque disponível, evitando reservas sobre itens esgotados; (3) possibilidade de aplicar desconto progressivo conforme o produto se aproxima do vencimento, antecipando o escoamento.

**Processo 2, Solicitação de Alimento.** No cenário AS IS, os produtos não comercializados durante o expediente são descartados integralmente, sem mecanismo de escoamento ou registro da perda. No TO BE, o consumidor localiza, seleciona e reserva diretamente pelo aplicativo os alimentos disponibilizados com desconto, concluindo o pagamento online e retirando o produto presencialmente. As oportunidades de melhoria são: (1) substituição do descarte por uma transação efetiva, transformando perda em receita marginal; (2) redução do atrito do consumidor, que descobre a oferta sem precisar se deslocar para verificar disponibilidade; (3) geração automática de histórico de reservas e avaliações, que alimenta os indicadores de desempenho do negócio.

### Alinhamento com objetivos estratégicos

A proposta atende diretamente aos objetivos específicos declarados no documento de contexto: permite o cadastro dos excedentes, viabiliza a visualização em tempo real pelos consumidores, reduz o desperdício ao final do dia, mitiga a perda financeira do estabelecimento, reforça a adesão ao ODS 02 e amplia a visibilidade comercial da lanchonete por meio da plataforma digital. Do ponto de vista da viabilidade, a Restrição 004 (custo zero) é compatível com o uso dos planos gratuitos do Firebase, preservando o alinhamento com o escopo acadêmico.

### Limites da solução

A proposta não substitui a venda regular ao longo do dia, que continua ocorrendo presencialmente, mas atua apenas na camada de escoamento de excedentes. Também não resolve problemas estruturais anteriores à oferta, como eventuais erros de produção excessiva ou de precificação dos produtos principais. Por fim, a efetividade do app depende da adesão simultânea de parceiros comerciais e consumidores na mesma região geográfica, o que no piloto com a Couto Lanches significa atuar de forma concentrada em um raio restrito ao redor do estabelecimento, antes de qualquer escalabilidade para outros parceiros ou regiões.

## Modelagem dos processos

[PROCESSO 1 AS IS - Nome do processo](./processes/processo-1-as-is.md "Detalhamento do processo 1 AS IS.")

[PROCESSO 1 TO BE - Nome do processo](./processes/processo-1-to-be.md "Detalhamento do processo 1 TO BE.")

[PROCESSO 2 AS IS - Nome do processo](./processes/processo-2-as-is.md "Detalhamento do processo 2 AS IS.")

[PROCESSO 2 TO BE - Nome do processo](./processes/processo-2-to-be.md "Detalhamento do processo 2 TO BE.")

## Indicadores de desempenho

Os indicadores a seguir foram definidos para monitorar os dois processos modelados (Cadastro e Publicação de Alimentos e Solicitação de Alimento) e a missão central do FoodLoop: reduzir o desperdício de alimentos ao conectar excedentes de estabelecimentos a consumidores. Cada indicador cobre uma dimensão distinta, sendo elas: **missão/impacto**, **funil de conversão**, **operacional**, **qualidade**, **velocidade de escoamento** e **engajamento**, de modo a evitar pontos cegos no acompanhamento do negócio. Todas as informações necessárias estão previstas no diagrama de classe (entidades `Usuario`, `Oferta`, `Pedido`, `Avaliacao`).

| **Indicador** | **Objetivos** | **Descrição** | **Fonte de dados** | **Fórmula de cálculo** | **Meta** |
| --- | --- | --- | --- | --- | --- |
| Taxa de aproveitamento de ofertas | Medir quanto do alimento publicado efetivamente deixa de ser descartado, traduzindo diretamente a missão de sustentabilidade da plataforma | Percentual das unidades cadastradas em ofertas que foram retiradas por consumidores (reservas/compras concluídas), em relação ao total publicado no período | Tabelas `Oferta` e `Pedido` (status concluído) | (Σ quantidade de pedidos concluídos no período / Σ quantidade publicada nas ofertas do período) × 100 | ≥ 40% ao mês |
| Taxa de conversão de ofertas em pedidos | Avaliar a atratividade das ofertas publicadas e a eficácia do funil entre descoberta e reserva | Percentual de ofertas publicadas que receberam ao menos um pedido confirmado antes do vencimento | Tabelas `Oferta` e `Pedido` | (nº de ofertas com ao menos 1 pedido confirmado / nº total de ofertas publicadas no período) × 100 | ≥ 30% ao mês |
| Taxa de cancelamento de pedidos | Monitorar a confiabilidade operacional da plataforma e identificar atrito entre consumidores e estabelecimentos | Percentual de pedidos que foram cancelados (pelo consumidor ou pelo estabelecimento) em relação ao total de pedidos criados | Tabela `Pedido` (status = cancelado) | (nº de pedidos cancelados no período / nº total de pedidos criados no período) × 100 | ≤ 15% ao mês |
| Avaliação média dos estabelecimentos | Garantir a qualidade dos parceiros e oferecer aos consumidores um critério confiável de escolha | Média ponderada das notas atribuídas pelos consumidores aos estabelecimentos após a retirada do pedido | Tabela `Avaliacao` | Σ (nota das avaliações) / nº total de avaliações no período | ≥ 3,5 (escala de 1 a 5) |
| Tempo médio de escoamento de oferta | Medir a velocidade com que ofertas publicadas encontram consumidores, indicando eficiência da descoberta geolocalizada | Tempo médio, em horas, entre a publicação de uma oferta e a primeira reserva confirmada da mesma | Tabelas `Oferta` (data_publicacao) e `Pedido` (data_criacao) | AVG (data_primeiro_pedido_confirmado − data_publicacao_oferta), em horas, considerando apenas ofertas com pelo menos uma reserva | ≤ 6 horas |
| Volume de desperdício evitado | Quantificar o impacto ambiental direto gerado pela plataforma, para uso em relatórios de sustentabilidade e comunicação com stakeholders | Soma das unidades (ou quilos, quando aplicável) de alimentos comercializados/doados via app no período, que teriam sido descartadas sem a plataforma | Tabelas `Oferta` e `Pedido` (status concluído) | Σ (quantidade de cada pedido concluído no período) | ≥ 45 unidades ao mês |

Obs.: todas as informações necessárias para gerar os indicadores acima estão contempladas nas entidades `Usuario`, `Oferta`, `Pedido` e `Avaliacao` do diagrama de classe a ser apresentado na seção de Arquitetura da Solução.
