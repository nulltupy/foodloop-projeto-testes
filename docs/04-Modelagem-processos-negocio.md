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

Tendo identificado os gargalos dos modelos AS-IS, apresentem uma descrição da proposta de solução, buscando maior eficiência com a introdução da tecnologia. Abordem também os limites dessa solução e seu alinhamento com as estratégias e objetivos do contexto de negócio escolhido.

Cole aqui os modelos da solução proposta (modelo TO-BE), elaborados com o apoio da ferramenta baseada em BPMN utilizada na disciplina. Cada processo identificado deve ter seu modelo TO-BE específico. Descrevam as oportunidades de melhoria de cada processo da solução proposta.

Apresente aqui uma descrição da sua proposta, abordando seus limites e suas ligações com as estratégias e objetivos do negócio. Apresente também as oportunidades de melhoria.

## Modelagem dos processos

[PROCESSO 1 AS IS - Nome do processo](./processes/processo-1-as-is.md "Detalhamento do processo 1 AS IS.")

[PROCESSO 1 TO BE - Nome do processo](./processes/processo-1-to-be.md "Detalhamento do processo 1 TO BE.")

[PROCESSO 2 AS IS - Nome do processo](./processes/processo-2-as-is.md "Detalhamento do processo 2 AS IS.")

[PROCESSO 2 TO BE - Nome do processo](./processes/processo-2-to-be.md "Detalhamento do processo 2 TO BE.")

## Indicadores de desempenho

Apresente aqui os principais indicadores de desempenho e algumas metas para o processo. Atenção: as informações necessárias para gerar os indicadores devem estar contempladas no diagrama de classe. Coloque no mínimo 5 indicadores.

Use o seguinte modelo:

| **Indicador** | **Objetivos** | **Descrição** | **Fonte de dados** | **Fórmula de cálculo** |
| ---           | ---           | ---           | ---             | ---             |
| Percentual de reclamações | Avaliar quantitativamente as reclamações | Percentual de reclamações em relação ao total de atendimentos | Tabela Reclamações | número total de reclamações / número total de atendimentos |
| Taxa de requisições atendidas | Melhorar a prestação de serviços medindo a porcentagem de requisições atendidas| Mede a % de requisições atendidas na semana | Tabela Solicitações | (número de requisições atendidas / número total de requisições) * 100 |
| Taxa de entrega de material | Manter controle sobre os materiais que estão sendo entregues | Mede % de material entregue dentro do mês | Tabela Pedidos | (número de pedidos entregues / número total de pedidos) * 100 |


Obs.: todas as informações necessárias para gerar os indicadores devem estar no diagrama de classe a ser apresentado posteriormente.
