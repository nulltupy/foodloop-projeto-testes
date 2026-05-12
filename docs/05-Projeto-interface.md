
# Projeto de interface

<span style="color:red">Pré-requisitos: <a href="02-Especificacao.md"> Especificação do projeto</a></span>

Visão geral da interação do usuário pelas telas do sistema e protótipo interativo das telas com as funcionalidades que fazem parte do sistema (wireframes).

Apresente as principais interfaces da plataforma. Discuta como ela foi elaborada de forma a atender os requisitos funcionais, não funcionais e histórias de usuário abordados na <a href="02-Especificacao.md"> Especificação do projeto</a>.

## User flow

Fluxo de usuário (user flow) é uma técnica que permite ao desenvolvedor mapear todo o fluxo de navegação do usuário na aplicação. Essa técnica serve para alinhar os caminhos e as possíveis ações que o usuário pode realizar junto com os membros da equipe.

![Exemplo de user flow](images/user_flow.jpg)

> **Links úteis**:
> - [User flow: o quê é e como fazer?](https://medium.com/7bits/fluxo-de-usu%C3%A1rio-user-flow-o-que-%C3%A9-como-fazer-79d965872534)
> - [User flow vs site maps](http://designr.com.br/sitemap-e-user-flow-quais-as-diferencas-e-quando-usar-cada-um/)
> - [Top 25 user flow tools & templates for smooth](https://www.mockplus.com/blog/post/user-flow-tools)

### Diagrama de fluxo

O diagrama apresenta o estudo do fluxo de interação do usuário com o sistema interativo, muitas vezes sem a necessidade de desenhar o design das telas da interface. Isso permite que o design das interações seja bem planejado e tenha impacto na qualidade do design do wireframe interativo que será desenvolvido logo em seguida.

O diagrama de fluxo pode ser desenvolvido com “boxes” que possuem, internamente, a indicação dos principais elementos de interface — tais como menus e acessos — e funcionalidades, como editar, pesquisar, filtrar e configurar, além da conexão entre esses boxes a partir do processo de interação.

Os diagramas a seguir alinham os caminhos e ações possíveis com a especificação do projeto, em particular com os atores Consumidor e Estabelecimento/Parceiro Comercial e com os processos TO-BE descritos em [Modelagem dos processos de negócio](04-Modelagem-processos-negocio.md). O escopo principal cobre os dois atores operacionais da plataforma, porque eles concentram os processos essenciais modelados: compra via aplicativo, anúncio de excedente e avaliação pós-retirada.

A notação adotada segue a convenção tradicional de diagramas de fluxo: retângulos representam telas, losangos representam pontos de decisão (do usuário ou do sistema), e setas representam transições entre estados.

As decisões de fluxo priorizam:

- **Entrada rápida e segura:** operações críticas exigem usuário autenticado, conforme o caso de uso `<<include>> Autenticar Usuário`.
- **Poucos passos para o consumidor:** descoberta geolocalizada, seleção, carrinho, pagamento e retirada presencial.
- **Operação simples para o comerciante:** criação rápida de anúncio, acompanhamento de reservas, validação da retirada e consulta de desempenho.
- **Registro de impacto:** cada pedido concluído alimenta histórico, dashboard, comissão da plataforma e indicadores de desperdício evitado.

### Fluxo 1 — Acesso e roteamento por perfil

Apresenta a entrada do aplicativo, o cadastro, o login, a recuperação de senha e o roteamento do usuário até a Home correspondente ao seu perfil. Cobre RF-001 e mantém o gate rígido de autenticação para operações críticas.

```mermaid
flowchart TD
    A[Abrir app] --> B{Já tem conta?}
    B -- Não --> CAD[Tela de cadastro]
    CAD --> TP{Tipo de conta}
    TP -- Consumidor --> FC[Formulário Consumidor<br/>nome, email, telefone, senha]
    TP -- Estabelecimento --> FE[Formulário Comerciante<br/>nome, email, telefone, senha, CNPJ]
    FC --> VC{Email único<br/>e senha válida?}
    VC -- Não --> FC
    VC -- Sim --> CRC[Criar usuario tipo=cliente<br/>+ linha em cliente]
    CRC --> HC[Home Consumidor]
    FE --> VE{Email único<br/>+ CNPJ válido?}
    VE -- Não --> FE
    VE -- Sim --> CRE[Criar usuario tipo=comerciante<br/>+ linha em comerciante]
    CRE --> END[Formulário de endereço<br/>e dados do estabelecimento]
    END --> GEO[Buscar latitude/longitude<br/>via Google Maps Geocoding]
    GEO --> QG{Geocoding bem-sucedido?}
    QG -- Não --> MAN[Inserir coordenadas manualmente]
    MAN --> EST[Criar endereco + estabelecimento]
    QG -- Sim --> EST
    EST --> HE[Home Estabelecimento]
    B -- Sim --> LOG[Tela de login]
    LOG --> CRED[Inserir email e senha]
    CRED --> AUT{Credenciais válidas<br/>e usuario.ativo = TRUE?}
    AUT -- Não --> ERL[Mensagem genérica<br/>credenciais inválidas] --> CRED
    AUT -- Sim --> TOK[Emitir tokens JWT]
    TOK --> ROT{Perfil do usuário}
    ROT -- Consumidor --> HC
    ROT -- Estabelecimento --> HE
    LOG --> REC[Esqueci minha senha]
    REC --> EMR[Informar email cadastrado]
    EMR --> ENV[Resposta neutra<br/>se o email existir, enviaremos link]
    ENV --> NS[Tela de nova senha<br/>via deep link]
    NS --> UP[Atualizar senha_hash<br/>e invalidar tokens]
    UP --> LOG
```

### Fluxo 2 — Compra via App (Consumidor)

Corresponde ao **Processo 1 TO-BE — Compra via App FoodLoop**. Cobre RF-003 (listagem com filtros), RF-004 (reserva e pagamento), RF-005 (cancelamento pelo consumidor), RF-006 (histórico de pedidos do consumidor), RF-009 (notificações de status) e RF-011 (cálculo da comissão sobre transações concluídas). O fluxo respeita a retirada presencial definida nos limites da solução e evita qualquer etapa de entrega.

```mermaid
flowchart TD
    H1[Home Consumidor<br/>mapa/lista de ofertas próximas] --> GPS{Permissão de localização?}
    GPS -- Sim --> MAP[Mapa com comércios próximos]
    GPS -- Não --> LOC[Informar localização manual] --> MAP
    MAP --> FILT[Aplicar filtros<br/>distância e preço]
    FILT --> MAP
    MAP --> BUS[Busca textual<br/>nome do comércio ou produto]
    BUS --> MAP
    MAP --> ESTAB[Perfil do estabelecimento<br/>nota média e anúncios]
    ESTAB --> D1[Detalhes da oferta<br/>preço, quantidade, validade e retirada]
    D1 --> DISP{Oferta ativa<br/>e estoque disponível?}
    DISP -- Não --> MAP
    DISP -- Sim --> CART[Carrinho<br/>quantidade]
    CART --> Q1{Confirmar pedido?}
    Q1 -- Não --> MAP
    Q1 -- Sim --> RESV{Reservar estoque<br/>com sucesso?}
    RESV -- Não --> EST_FAIL[Mensagem de estoque esgotado] --> MAP
    RESV -- Sim --> P1[Tela de pagamento<br/>cartão ou PIX]
    P1 --> Q2{Resultado inicial<br/>do pagamento}
    Q2 -- Recusado --> ERR1[Mensagem de erro<br/>tentar novamente ou trocar forma] --> P1
    Q2 -- Pendente PIX --> AGW[Aguardar webhook<br/>do Mercado Pago]
    AGW --> Q2W{Webhook chegou<br/>e aprovou?}
    Q2W -- Recusado --> ERR1
    Q2W -- Aprovado --> PED
    Q2 -- Aprovado --> PED[Pedido criado status=RECEBIDO<br/>comissão RF-011 gravada]
    PED --> CONF1[Comprovante digital<br/>código/QR de retirada]
    CONF1 --> WAIT[Aguardar preparo<br/>push de status RF-009]
    WAIT --> ACAO{Ação disponível}
    ACAO -- Solicitar cancelamento --> CANC[Cancelar pedido<br/>Fluxo 6]
    ACAO -- Continuar acompanhando --> STATUS{Status do pedido}
    STATUS -- RECEBIDO --> WAIT
    STATUS -- EM_PREPARO --> WAIT
    STATUS -- PRONTO_PARA_RETIRADA --> RET[Apresentar código no balcão]
    STATUS -- CANCELADO pelo comércio ou sistema --> REEMB[Notificação de cancelamento<br/>e estorno automático]
    CANC --> H1
    REEMB --> H1
    RET --> HIST[Pedido status=RETIRADO<br/>histórico RF-006]
    HIST --> PERF[Fluxo 5: Perfil e histórico]
    HIST --> FLUXO4[Fluxo 4: Avaliação]
```

### Fluxo 3 — Gestão de anúncios e reservas (Estabelecimento)

Corresponde ao **Processo 2 TO-BE — Anúncio de Excedente com Desconto**. Cobre RF-002 (CRUD de ofertas com estoque em tempo real), RF-005 (cancelamento pelo estabelecimento), RF-006 (dashboard de desempenho) e RF-009 (notificações de reservas recebidas). Também inclui a validação presencial da retirada, etapa em que o pedido passa para `RETIRADO`.

```mermaid
flowchart TD
    HE[Home Estabelecimento<br/>dashboard de ofertas ativas] --> AC{Ação}
    AC -- Nova oferta --> NEW[Formulário de oferta<br/>produto, preço promocional,<br/>quantidade e prazo de retirada]
    AC -- Editar oferta --> EDIT[Editar oferta existente]
    AC -- Ver reservas --> RES[Lista de reservas recebidas]
    AC -- Ver desempenho --> DASH[Fluxo 7: Notificações e dashboard]
    NEW --> VALID{Dados válidos<br/>e preço menor que regular?}
    VALID -- Não --> ERR2[Mensagem de erro<br/>destacar campos inválidos] --> NEW
    VALID -- Sim --> PUB[Anúncio publicado<br/>status_anuncio = ATIVO]
    PUB --> NOTIF[Notificar clientes próximos<br/>RF-009]
    NOTIF --> HE
    PED_NOVO[Nova reserva criada por consumidor<br/>Fluxo 2] --> PUSH_COM[Push ao comerciante<br/>RF-009 reserva recebida]
    PUSH_COM --> HE
    EDIT --> Q5{Atualizar ou encerrar?}
    Q5 -- Atualizar --> ATU[Anúncio atualizado<br/>estoque em tempo real] --> HE
    Q5 -- Encerrar oferta --> ENCER[Sistema avalia reservas recebidas]
    ENCER --> Q_SOB{Há reservas pendentes?}
    Q_SOB -- Sim --> ENC1[Status = ENCERRADO_COM_RESERVA<br/>separar produtos para retirada] --> HE
    Q_SOB -- Não --> ENC2[Status = ENCERRADO_COM_SOBRA<br/>registrar quantidade_sobra] --> HE
    RES --> RD[Detalhes da reserva]
    RD --> Q6{Ação do parceiro}
    Q6 -- Aceitar pedido --> ACEITA[Status pedido = EM_PREPARO]
    ACEITA --> HE
    Q6 -- Marcar como pronto --> PRONTO[Status pedido = PRONTO_PARA_RETIRADA<br/>push ao consumidor]
    Q6 -- Validar retirada --> MOD{Modo de validação}
    MOD -- Ler QR --> QR[Abrir câmera<br/>escanear QR do consumidor]
    MOD -- Digitar código --> COD[Inserir codigo_retirada]
    QR --> CHK{Código válido<br/>para o estabelecimento?}
    COD --> CHK
    CHK -- Não --> ERRV[Mensagem de código inválido] --> RES
    CHK -- Sim --> CHK_ST{Status do pedido}
    CHK_ST -- PRONTO_PARA_RETIRADA --> RET[Status pedido = RETIRADO<br/>disparar convite de avaliação]
    CHK_ST -- Outro status --> BLOQ[Mensagem de retirada bloqueada] --> RES
    Q6 -- Cancelar reserva --> CANCE[Cancelar reserva<br/>Fluxo 6]
    PRONTO --> HE
    RET --> HE
    CANCE --> HE
    DASH --> HE
```

### Fluxo 4 — Avaliação pós-retirada (Consumidor)

Corresponde ao **Processo 3 TO-BE — Avaliação do Estabelecimento no FoodLoop**. Cobre RF-008 (avaliação após a retirada) e reforça a qualidade percebida pelos consumidores ao exibir reputação no perfil do estabelecimento. É disparado por push notification (RF-009) imediatamente após a validação da retirada pelo Fluxo 3.

```mermaid
flowchart TD
    TRIG[Retirada confirmada<br/>push RF-009 ou deep link] --> GRD{pedido.status = RETIRADO<br/>e ainda sem avaliação?}
    GRD -- Não --> BLQ[Mensagem: avaliação indisponível]
    BLQ --> HOME[Home Consumidor]
    GRD -- Sim --> AVL[Tela de avaliação]
    AVL --> Q7{Ação do usuário}
    Q7 -- Ignorar ou pular --> HOME
    Q7 -- Avaliar --> NOTA[Selecionar nota 1 a 5<br/>+ comentário opcional, até 500 caracteres]
    NOTA --> Q8{Enviar?}
    Q8 -- Não --> AVL
    Q8 -- Sim --> SUB[Avaliação vinculada<br/>ao pedido e ao estabelecimento]
    SUB --> MEDIA[Atualizar nota média<br/>e perfil público]
    MEDIA --> HOME
```

### Fluxo 5 — Perfis, catálogo e histórico

Reúne a gestão de perfil do consumidor, a gestão dos dados do estabelecimento, o catálogo de produtos e o histórico de pedidos. Cobre RF-001 e RF-006. O catálogo de `Produto` é pré-requisito para a criação de anúncios no Fluxo 3.

```mermaid
flowchart TD
    INI[Tela de perfil] --> PERFIL{Perfil autenticado}
    PERFIL -- Consumidor --> PC[Tela Meu perfil]
    PC --> OPC{Ação do consumidor}
    OPC -- Editar dados --> ED[Editar nome, telefone]
    ED --> SV1[Salvar em usuario] --> PC
    OPC -- Trocar foto --> FT[Upload de nova foto]
    FT --> SV2[Atualizar usuario.foto_url<br/>via Firebase Storage] --> PC
    OPC -- Trocar senha --> SN[Senha atual + nova senha]
    SN --> SV3[Atualizar usuario.senha_hash] --> PC
    OPC -- Histórico de pedidos --> HP[Listar pedidos por id_cliente]
    HP --> DET[Detalhe do pedido<br/>itens, pagamento, avaliação] --> PC
    OPC -- Notificações --> NT[Fluxo 7]
    OPC -- Excluir conta --> CONF_DEL{Confirmação dupla}
    CONF_DEL -- Não --> PC
    CONF_DEL -- Sim --> SOFT[UPDATE usuario.ativo = FALSE]
    SOFT --> LOGIN[Tela de login]
    OPC -- Logout --> OUT[Limpar JWT local] --> LOGIN
    PERFIL -- Estabelecimento --> PE[Tela Meu estabelecimento]
    PE --> OPE{Ação}
    OPE -- Editar comércio --> EC[Editar nome fantasia,<br/>descrição, horário]
    EC --> SVE[Salvar em estabelecimento] --> PE
    OPE -- Trocar logo --> LG[Upload de nova logo]
    LG --> SVL[Atualizar estabelecimento.logo_url] --> PE
    OPE -- Editar endereço --> EE[Editar campos do endereco<br/>com nova geocodificação]
    EE --> SVED[Salvar em endereco] --> PE
    OPE -- Catálogo de produtos --> CAT[Lista de produtos do estabelecimento]
    CAT --> ACAT{Ação no catálogo}
    ACAT -- Novo produto --> NP[Formulário<br/>nome, descrição, preço regular,<br/>categoria, imagem]
    NP --> SVP[INSERT em produto] --> CAT
    ACAT -- Editar --> EP[Editar produto existente]
    EP --> UPP[UPDATE em produto] --> CAT
    ACAT -- Desativar --> DP[produto.ativo = FALSE] --> CAT
    OPE -- Avaliações recebidas --> AV[Lista de avaliacao<br/>por id_estabelecimento] --> PE
    OPE -- Notificações --> NT2[Fluxo 7]
    OPE -- Excluir conta --> CONF_DEL2{Confirmação dupla}
    CONF_DEL2 -- Não --> PE
    CONF_DEL2 -- Sim --> SOFT2[UPDATE usuario.ativo = FALSE<br/>+ estabelecimento.ativo = FALSE]
    SOFT2 --> LIE[Tela de login]
    OPE -- Logout --> OUTE[Limpar JWT] --> LIE
```

### Fluxo 6 — Cancelamento e estorno

Expande o item de cancelamento que aparece compactado nos Fluxos 2 e 3. RF-005 (ALTA) prevê três caminhos: consumidor cancela, estabelecimento cancela, sistema cancela por timeout. O sistema considera dois timers distintos: o **prazo de retirada do anúncio** (cancela pedidos cujo prazo expirou sem retirada) e a **janela máxima de espera entre `PRONTO_PARA_RETIRADA` e retirada efetiva**.

Em todos os três caminhos, se o pedido já estiver em `PRONTO_PARA_RETIRADA` o cancelamento é permitido mas sinaliza no histórico que houve preparo desperdiçado, alimentando o dashboard do estabelecimento.

```mermaid
flowchart TD
    INIC[Pedido ativo<br/>RECEBIDO, EM_PREPARO ou PRONTO_PARA_RETIRADA] --> ATOR{Quem cancela?}
    ATOR -- Consumidor --> CC[Solicitar cancelamento no app]
    CC --> JC[Selecionar motivo + confirmação dupla]
    JC --> EXC[Registrar cancelado_por=cliente,<br/>motivo, data_cancelamento]
    ATOR -- Estabelecimento --> CE[Cancelar reserva no painel]
    CE --> JE[Selecionar motivo<br/>ex.: sem estoque, encerrando expediente]
    JE --> EXC2[Registrar cancelado_por=comerciante,<br/>motivo, data_cancelamento]
    ATOR -- Sistema --> CS{Origem do timeout}
    CS -- Prazo de retirada vencido --> EXC3[Registrar cancelado_por=sistema,<br/>motivo=prazo_vencido]
    CS -- Janela de espera após PRONTO esgotada --> EXC4[Registrar cancelado_por=sistema,<br/>motivo=espera_excedida]
    EXC --> EFE[Efeitos colaterais]
    EXC2 --> EFE
    EXC3 --> EFE
    EXC4 --> EFE
    EFE --> Q_PAG{status_pagamento = APROVADO?}
    Q_PAG -- Sim --> EST[Solicitar estorno ao Mercado Pago] --> STK
    Q_PAG -- Não --> STK[Devolver quantidade ao anuncio.quantidade_disponivel]
    STK --> PUSH[Push notification ao outro lado da transação]
    PUSH --> FIM[pedido.status = CANCELADO]
```

### Fluxo 7 — Notificações e dashboard

Reúne o centro de notificações e o dashboard do estabelecimento. Cobre RF-006 pelo lado dos indicadores operacionais do parceiro e RF-009 pelo lado dos alertas e histórico de notificações.

```mermaid
flowchart TD
    INI[Tela inicial] --> AREA{Área acessada}
    AREA -- Notificações --> CN[Tela Notificações]
    CN --> LST[Listar notificações<br/>ordenadas por data]
    LST --> TIPO{Tipo da notificação}
    TIPO -- Reserva recebida --> AB1[Abrir detalhe da reserva<br/>Fluxo 3]
    TIPO -- Pedido pronto --> AB2[Abrir status do pedido<br/>Fluxo 2]
    TIPO -- Pedido cancelado --> AB3[Abrir histórico<br/>Fluxo 5]
    TIPO -- Convite a avaliar --> AB4[Abrir tela de avaliação<br/>Fluxo 4]
    TIPO -- Promoção próxima --> AB5[Abrir mapa filtrado<br/>Fluxo 2]
    LST --> LIDA[Marcar como lida]
    LIDA --> LST
    CN --> CFG[Preferências de notificação<br/>habilitar/desabilitar por tipo]
    CFG --> SVCFG[Salvar preferências] --> CN
    AREA -- Dashboard parceiro --> DS[Dashboard do parceiro]
    DS --> FT[Selecionar período<br/>hoje, 7d, 30d, customizado]
    FT --> CALC[Calcular indicadores]
    CALC --> KPI1[Receita líquida<br/>Σ pedido.valor_total - Σ pedido.valor_comissao<br/>de pedidos com status = RETIRADO]
    CALC --> KPI2[Taxa de aproveitamento<br/>Σ quantidade de pedidos RETIRADO / Σ anuncio.quantidade_inicial<br/>conforme 04-Modelagem indicador 1]
    CALC --> KPI3[Volume de desperdício evitado<br/>Σ item_pedido.quantidade de pedidos RETIRADO<br/>conforme 04-Modelagem indicador 6]
    CALC --> KPI4[Avaliação média<br/>estabelecimento.nota_media]
    CALC --> KPI5[Tempo médio de escoamento<br/>AVG MIN data_pedido por anuncio - anuncio.data_publicacao]
    CALC --> KPI6[Taxa de cancelamento<br/>pedidos CANCELADO / total pedidos criados]
    KPI1 --> GR[Gráficos e tabelas exportáveis]
    KPI2 --> GR
    KPI3 --> GR
    KPI4 --> GR
    KPI5 --> GR
    KPI6 --> GR
    GR --> DRILL[Drill-down em anúncio individual] --> DS
```



> **Links úteis**:
> - [Como criar um diagrama de fluxo de usuário](https://www.lucidchart.com/blog/how-to-make-a-user-flow-diagram)
> - [Fluxograma online: seis sites para fazer gráfico sem instalar nada](https://www.techtudo.com.br/listas/2019/03/fluxograma-online-seis-sites-para-fazer-grafico-sem-instalar-nada.ghtml)
> - Os diagramas acima foram escritos em [Mermaid](https://mermaid.js.org/), renderizado nativamente pelo GitHub. Para gerar imagens estáticas (PNG/SVG) basta colar o código em [mermaid.live](https://mermaid.live) e exportar.

## Wireframes

São protótipos usados no design de interface para sugerir a estrutura de um site web e seu relacionamento entre suas páginas. Um wireframe web é uma ilustração que mostra o layout dos elementos fundamentais na interface.

![Exemplo de wireframe](images/wireframe.png)
 
> **Links úteis**:
> - [Protótipos: baixa, média ou alta fidelidade?](https://medium.com/ladies-that-ux-br/prot%C3%B3tipos-baixa-m%C3%A9dia-ou-alta-fidelidade-71d897559135)
> - [Protótipos vs wireframes](https://www.nngroup.com/videos/prototypes-vs-wireframes-ux-projects/)
> - [Ferramentas de wireframes](https://rockcontent.com/blog/wireframes/)
> - [MarvelApp](https://marvelapp.com/developers/documentation/tutorials/)
> - [Figma](https://www.figma.com/)
> - [Adobe XD](https://www.adobe.com/br/products/xd.html#scroll)
> - [Axure](https://www.axure.com/edu) (Licença Educacional)
> - [InvisionApp](https://www.invisionapp.com/) (Licença Educacional)

## Protótipo interativo

Apresente o protótipo interativo das telas da aplicação, permitindo a navegação simulada pelo sistema. Esse protótipo deve refletir as funcionalidades e interações planejadas, e servir como base para validação com usuários e equipe.  

> **Exemplo:** inserir link para o protótipo no Figma, MarvelApp, InvisionApp, etc.


## Jornada do usuário

A jornada do usuário descreve, em alto nível de detalhes, as etapas que diferentes perfis de usuários realizam para concluir uma tarefa específica na aplicação. Essa técnica ajuda a identificar pontos fortes e oportunidades de melhoria na experiência.  

O mapa da jornada do usuário deve contemplar:  
- Etapas: desde a descoberta até a finalização da tarefa.  
- Ações do usuário: o que o usuário faz em cada etapa.  
- Pontos de contato: onde a interação acontece (site, app, suporte).  
- Emoções e percepções: como o usuário se sente em cada momento.  

**Fases baseadas no modelo AIDA**:  
1. Conscientização: despertar conhecimento sobre o produto (inspiração)  
2. Interesse: aumentar o interesse e engajamento (favoritismo)  
3. Desejo: estimular a intenção de uso/compra (desejo)  
4. Ação: execução da ação esperada (implementação)  

![Exemplo Jornada de Usuario](images/JornadadoUsuario.jpg)

> **Links úteis**:
> - [Dicas sobre como mapear uma jornada do usuário](https://www.userinterviews.com/blog/best-customer-journey-map-templates-examples)
> - [Jornada do usuário versus user flow](https://www.nngroup.com/articles/user-journeys-vs-user-flows/)


## Interface do sistema

Apresente **todas as interfaces do sistema**, em sua versão final, descrevendo brevemente a função de cada tela.

Dê ênfase especial às telas relacionadas aos processos BPMN já mapeados e documentados no item <a href="04-Modelagem-processos-negocio.md"> Modelagem dos processos de negócio</a>.

### Tela principal do sistema

Descrição da tela principal do sistema.

> Insira aqui a imagem da tela principal do sistema.

### Telas dos processos BPMN

#### Processo 1

Descrição das telas relativas às atividades do processo 1.

> Inserir imagens das telas correspondentes às atividades do processo 1.

#### Processo 2

Descrição das telas relativas às atividades do processo 2.

> Inserir imagens das telas correspondentes às atividades do processo 2.

### Demais telas do sistema

Apresente e descreva brevemente as demais telas que compõem o sistema, mesmo que não estejam vinculadas diretamente a processos BPMN.

> Inserir imagens das demais telas.
