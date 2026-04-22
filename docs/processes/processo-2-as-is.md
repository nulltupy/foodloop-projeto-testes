# Processo 2 AS IS – Gestão de Sobras no Fim do Expediente

O processo atual consiste na destinação dos salgados que não foram vendidos durante o expediente. Atualmente, esse processo é realizado de forma totalmente manual pelo atendente ou pelo proprietário no momento do fechamento, sem qualquer sistema de controle de estoque ou de perdas.

Como o comércio não possui mecanismo de remarcação, promoções ou canal digital de divulgação, os produtos que sobram ao final do dia não encontram nenhuma forma de escoamento e são integralmente descartados, representando perda financeira para o estabelecimento.

**Fluxo do processo**

1. Encerramento do expediente
2. Identificação dos salgados não vendidos
3. Recolhimento dos produtos do balcão
4. Descarte dos produtos não consumidos
5. Processo finalizado

![Modelo BPMN do PROCESSO 2](../images/GestaoSobras.png)

## Detalhamento das atividades

### Encerramento do Expediente

Nesta atividade, o atendente ou proprietário encerra as operações de venda do dia. O fechamento segue o horário padrão do estabelecimento e marca o início das rotinas de avaliação dos produtos que ainda permanecem expostos no balcão.

| Campo | Tipo | Restrições | Valor default |
|---|---|---|---|
| horário de fechamento | horário | segue o horário operacional do comércio | — |

| Comandos | Destino | Tipo |
|---|---|---|
| encerrar | Identificação de Sobras | default |

### Identificação das Sobras

Nesta atividade, o atendente realiza a verificação visual dos produtos que permanecem no balcão após o fechamento. A contagem é manual e baseada exclusivamente no que está fisicamente exposto, uma vez que não existe registro informatizado de estoque.

| Campo | Tipo | Restrições | Valor default |
|---|---|---|---|
| itens não vendidos | observação visual | contagem manual dos produtos no balcão | — |

| Comandos | Destino | Tipo |
|---|---|---|
| identificar | Recolhimento dos Produtos | default |

### Recolhimento dos Produtos

Nesta atividade, o atendente retira fisicamente do balcão todos os produtos que não foram comercializados durante o expediente. Os itens são agrupados para serem destinados ao descarte, pois não há alternativa de reaproveitamento ou escoamento disponível.

| Campo | Tipo | Restrições | Valor default |
|---|---|---|---|
| produtos recolhidos | físico | todos os itens não vendidos do dia | — |

| Comandos | Destino | Tipo |
|---|---|---|
| recolher | Descarte | default |

### Descarte

Nesta atividade, os produtos não vendidos são descartados pelo comércio, configurando perda financeira integral do estoque remanescente do dia. Não há destinação alternativa (doação, remarcação ou venda promocional) porque o estabelecimento não dispõe de nenhum canal para converter esses produtos em receita antes do fechamento.

| Campo | Tipo | Restrições | Valor default |
|---|---|---|---|
| produtos descartados | físico | total das sobras do dia | — |

| Comandos | Destino | Tipo |
|---|---|---|
| descartar | Fim do Processo 2 | default |
