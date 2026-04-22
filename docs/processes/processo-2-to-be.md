# PROCESSO 2 TO-BE – ANÚNCIO DE EXCEDENTE COM DESCONTO

## 1 Descrição do processo

O processo proposto confere ao estabelecimento a capacidade de publicar, a qualquer momento, anúncios promocionais a respeito de produtos em excedente, estabelecendo um canal digital inexistente no AS-IS para o escoamento desses itens antes do término do expediente.

A digitalização desse fluxo converte em receita potencial o que hoje constitui perda financeira integral, uma vez que os produtos remanescentes passam a contar com divulgação geolocalizada e notificação direcionada a clientes próximos.

## 2 Fluxo do processo

1. Comércio identifica produtos em excedente;
2. Comércio acessa o painel do comércio no FoodLoop;
3. Comércio cadastra o anúncio do produto;
4. Comércio define preço promocional e prazo de retirada;
5. Comércio publica o anúncio;
6. Sistema exibe o anúncio aos clientes próximos;
7. Sistema notifica clientes com interesse compatível;
8. Comércio acompanha as reservas recebidas;
9. Comércio prepara o produto para retirada ou registra sobra residual ao fim do prazo;
10. Processo finalizado.

**Figura 1 – Diagrama de atividades do processo de anúncio de excedente com desconto (TO-BE)**

![Diagrama TO-BE do Processo 2](/docs/images/AnuncioExcedenteTOBE.png)

Fonte: Elaborado pelos autores (2026).

## 3 Detalhamento das atividades

### 3.1 Identificação do excedente

O comerciante avalia, ao longo do expediente ou nas proximidades do fechamento, quais produtos apresentam estoque superior à demanda esperada. Tal avaliação é realizada a partir da observação do balcão, mas passa a contar com histórico digital das vendas registradas no FoodLoop para subsidiar decisões futuras.

**Quadro 1 – Campos da atividade "Identificação do excedente"**

| Campo | Tipo | Restrições | Valor default |
|---|---|---|---|
| produto em excedente | seleção | item do catálogo do estabelecimento | — |
| quantidade disponível | número | maior que 0 | — |

Fonte: Elaborado pelos autores (2026).

**Quadro 2 – Comandos da atividade "Identificação do excedente"**

| Comando | Destino | Tipo |
|---|---|---|
| cadastrar anúncio | Cadastro e publicação do anúncio | default |

Fonte: Elaborado pelos autores (2026).

### 3.2 Cadastro e publicação do anúncio

No painel do comércio, o comerciante cria um anúncio contendo os dados do produto, o preço promocional e o prazo para retirada. Após a revisão das informações, o anúncio é publicado e passa a estar disponível para visualização no aplicativo.

**Quadro 3 – Campos da atividade "Cadastro e publicação do anúncio"**

| Campo | Tipo | Restrições | Valor default |
|---|---|---|---|
| produto | seleção | item do catálogo | — |
| quantidade | número | maior que 0 | 1 |
| preço promocional | número | menor que o preço regular | — |
| prazo de retirada | data/hora | posterior ao momento atual | fim do expediente |
| descrição adicional | área de texto | opcional | — |

Fonte: Elaborado pelos autores (2026).

**Quadro 4 – Comandos da atividade "Cadastro e publicação do anúncio"**

| Comando | Destino | Tipo |
|---|---|---|
| publicar | Divulgação e notificação | default |
| cancelar | Fim do Processo 2 | cancel |

Fonte: Elaborado pelos autores (2026).

### 3.3 Divulgação e notificação aos clientes

Após a publicação, o sistema FoodLoop exibe automaticamente o anúncio para clientes localizados no raio de alcance do estabelecimento e, adicionalmente, envia notificação ativa aos usuários que manifestaram interesse compatível com o produto anunciado.

**Quadro 5 – Campos da atividade "Divulgação e notificação aos clientes"**

| Campo | Tipo | Restrições | Valor default |
|---|---|---|---|
| raio de divulgação | número | em quilômetros | 5 |
| público-alvo | automático | clientes com preferências compatíveis | — |

Fonte: Elaborado pelos autores (2026).

**Quadro 6 – Comandos da atividade "Divulgação e notificação aos clientes"**

| Comando | Destino | Tipo |
|---|---|---|
| divulgar automaticamente | Acompanhamento e fechamento | default |

Fonte: Elaborado pelos autores (2026).

### 3.4 Acompanhamento e fechamento do anúncio

O comerciante acompanha, em tempo real, as reservas realizadas sobre o anúncio. Ao final do prazo, o anúncio é encerrado automaticamente: caso todos os itens tenham sido reservados, o produto é separado para retirada; caso contrário, o sistema registra a sobra residual para subsídio de análises futuras de desperdício e de eficácia de precificação.

**Quadro 7 – Campos da atividade "Acompanhamento e fechamento do anúncio"**

| Campo | Tipo | Restrições | Valor default |
|---|---|---|---|
| reservas recebidas | número | entre 0 e a quantidade anunciada | 0 |
| status do anúncio | seleção | ativo / encerrado com reserva / encerrado com sobra | ativo |

Fonte: Elaborado pelos autores (2026).

**Quadro 8 – Comandos da atividade "Acompanhamento e fechamento do anúncio"**

| Comando | Destino | Tipo |
|---|---|---|
| encerrar com reserva | Preparação para retirada | default |
| encerrar com sobra | Fim do Processo 2 | cancel |

Fonte: Elaborado pelos autores (2026).
