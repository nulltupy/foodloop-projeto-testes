
# Projeto de interface

<span style="color:red">Pré-requisitos: <a href="02-Especificacao.md"> Especificação do projeto</a></span>

Visão geral da interação do usuário pelas telas do sistema e protótipo interativo das telas com as funcionalidades que fazem parte do sistema (wireframes).

Apresente as principais interfaces da plataforma. Discuta como ela foi elaborada de forma a atender os requisitos funcionais, não funcionais e histórias de usuário abordados na <a href="02-Especificacao.md"> Especificação do projeto</a>.

## User flow

Fluxo de usuário (user flow) é uma técnica que permite ao desenvolvedor mapear todo o fluxo de navegação do usuário na aplicação. Essa técnica serve para alinhar os caminhos e as possíveis ações que o usuário pode realizar junto com os membros da equipe.

![Exemplo de user flow](../docs/images/User_Flow.png)

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



## Wireframes
 
São protótipos usados no design de interface para sugerir a estrutura de um site web e seu relacionamento entre suas páginas. Um wireframe web é uma ilustração que mostra o layout dos elementos fundamentais na interface.
 
![Wireframe FoodLoop](images/Wireframe_FoodLoop.jpeg)

## Protótipo interativo
 
O protótipo interativo do FoodLoop foi desenvolvido no Figma e contempla a navegação simulada entre as telas do sistema para os perfis de Consumidor e Parceiro Comercial. O protótipo reflete as funcionalidades e interações planejadas, abrangendo os fluxos de cadastro, autenticação, compra de produtos, cadastro de itens excedentes e acompanhamento de pedidos, servindo como base para validação com usuários e equipe.
 
Acesse o protótipo interativo pelo link abaixo:
 
[🔗 Protótipo FoodLoop — Figma](https://www.figma.com/design/d2W9AGF2pEhukY9mHSVo51/Projeto_interativo?node-id=11-2979&t=e0ou0fcTieZ1B54Y-1)

## Jornada do usuário

## Texto Explicativo — Jornada do Usuário

A jornada do usuário do FoodLoop foi desenvolvida com base no modelo AIDA, permitindo representar as etapas percorridas pelo consumidor desde o primeiro contato com a plataforma até o pós-uso do serviço. O objetivo é compreender como o usuário interage com a aplicação, identificando ações, pontos de contato e percepções ao longo da experiência.

Na fase de conscientização, o usuário conhece o FoodLoop por meio de anúncios, redes sociais, influenciadores ou indicações, despertando curiosidade e interesse pela proposta do aplicativo. Em seguida, na etapa de interesse, o consumidor acessa a aplicação web pelo navegador, cria sua conta e começa a explorar as ofertas disponíveis.

Na fase de desejo, o usuário compara preços, avaliações, localização e produtos disponíveis, aumentando sua intenção de compra. Já na etapa de ação, ocorre a reserva ou compra do alimento excedente, seguida da retirada no estabelecimento parceiro.

Por fim, no pós-uso, o consumidor avalia a experiência, compartilha sua opinião e pode reutilizar a plataforma futuramente, fortalecendo a fidelização e incentivando práticas de consumo mais sustentáveis. Dessa forma, a jornada demonstra como o FoodLoop busca unir tecnologia, economia e redução do desperdício de alimentos em uma experiência simples e acessível para os usuários.

![Exemplo Jornada de Usuario](images/jordanadeusuario.png)


## Interface do sistema
 
Este tópico apresenta todas as interfaces do sistema FoodLoop em sua versão final, descrevendo a função de cada tela e evidenciando aquelas diretamente relacionadas aos processos de negócio modelados em BPMN, conforme documentado no item <a href="04-Modelagem-processos-negocio.md">Modelagem dos processos de negócio</a>.
 
O aplicativo é estruturado para atender dois perfis distintos de usuário: o **consumidor**, que localiza e adquire produtos alimentícios com desconto, e o **parceiro** (estabelecimento comercial), que cadastra e gerencia anúncios de itens excedentes. As interfaces foram desenvolvidas para dispositivos móveis, com identidade visual coesa em paleta verde escuro, representando o posicionamento sustentável da plataforma. O conjunto completo compreende 12 telas funcionais e um conjunto de overlays de feedback ao usuário.
 
---
 
### Tela principal do sistema
 
A tela principal do sistema, exibida após a autenticação do consumidor, é a **tela de Listagem de Produtos**. Ela constitui o ponto central de navegação do aplicativo, reunindo busca, filtragem por categoria e visualização dos anúncios publicados pelos estabelecimentos cadastrados.
 
A interface é composta pelos seguintes elementos:
 
- **Campo de busca** (*Buscar restaurante ou produto*): permite pesquisa textual por estabelecimento ou produto;
- **Filtros de categoria**: etiquetas selecionáveis para *Padaria*, *Doces*, *Refeições*, *Frutas*, *Até 1 km*, *Salada* e *Bebidas*;
- **Cards de produtos**: cada cartão exibe imagem do item, nome, descrição resumida, avaliação em estrelas e botão de adição ao carrinho;
- **Barra de navegação inferior**: acesso rápido às seções de Mapa, Início e Perfil.

![Tela Principal — Listagem de Produtos](images/tela_principal.jpeg)
 
---
 
### Telas dos processos BPMN
 
#### Processo 1 — Compra de Produto pelo Consumidor
 
O Processo 1 modela o fluxo digital de aquisição de produtos excedentes pelo consumidor, substituindo a dependência do atendimento presencial por uma experiência geolocalizada. As telas descritas a seguir cobrem as etapas de acesso ao sistema, descoberta de produtos, seleção, pagamento e confirmação do pedido.
 
---
 
**Tela 1.1 — Login do Consumidor**
 
Tela exibida ao usuário já cadastrado que deseja autenticar-se na plataforma. Corresponde à **etapa 1 do Processo 1** (acesso ao aplicativo FoodLoop).
 
Elementos da interface:
 
- Mensagem de engajamento (*"Pronto para fechar mais um ciclo? Entre na sua conta e faça parte da nossa revolução sustentável."*);
- Campos de entrada para **Endereço de e-mail** e **Senha**;
- Botão **Entrar**, para autenticação com credenciais cadastradas;
- Botão **Criar conta**, para redirecionamento ao fluxo de cadastro;
- Botão **Seja nosso parceiro**, para acesso ao cadastro de estabelecimentos;
- Botão **Continuar com o Google**, para autenticação via conta Google;
- Link **Saiba +**, que redireciona à tela institucional da plataforma.

![Tela de Login do Consumidor](images/tela_login_usuario.png)
 
---
 
**Tela 1.2 — Listagem de Produtos**
 
Após autenticação, o consumidor é direcionado à tela principal descrita anteriormente. No contexto do Processo 1, esta tela corresponde às **etapas 2 a 4**: visualização dos estabelecimentos próximos e consulta aos anúncios disponíveis. O consumidor pode utilizar filtros de categoria ou o campo de busca para localizar produtos de seu interesse.
 
![Tela de Listagem de Produtos](images/tela_principal.jpeg)
 
---
 
**Tela 1.3 — Mapa de Estabelecimentos**
 
Exibe em interface cartográfica interativa a localização dos estabelecimentos parceiros cadastrados. Suporta a **etapa 2 do Processo 1**, na qual o cliente visualiza comércios próximos à sua localização.
 
Elementos da interface:
 
- **Mapa interativo** com marcadores posicionados nos estabelecimentos parceiros;
- **Seleção de marcador**: cada ponto pode ser selecionado para exibição de informações do estabelecimento;
- **Barra de navegação inferior** com acesso a Mapa, Início e Perfil.

![Tela de Mapa de Estabelecimentos](images/maps.png)
 
---
 
**Tela 1.4 — Detalhe do Produto e Seleção de Pagamento**
 
Exibida quando o consumidor seleciona um produto para aquisição. Cobre as **etapas 5 e 6 do Processo 1**: adição do produto ao carrinho, confirmação do pedido e escolha do método de pagamento.
 
Elementos da interface:
 
- **Carrossel de imagens** do produto com indicador de posição;
- **Nome e descrição** do produto anunciado;
- **Seção de método de pagamento**, com as opções: *PIX*, *Dinheiro (Apenas no local)* e *Cartão de crédito*.

![Tela de Detalhe do Produto e Pagamento](images/tela_pagamento.png)
 
---
 
**Tela 1.5 — Confirmação de Pedido**
 
Tela exibida imediatamente após a conclusão do pagamento, informando o consumidor sobre o resultado da transação. Contempla dois estados distintos:
 
- **Pagamento confirmado**: mensagem de sucesso com indicação de que o estabelecimento foi notificado e o pedido está sendo preparado;
- **Pedido recusado**: mensagem de erro com orientação para nova tentativa ou troca de forma de pagamento.

Esta tela encerra o fluxo de compra do lado do consumidor e dá início ao acompanhamento do status do pedido.

![Tela de Confirmação de Pedido](images/confirmacao_pedido.jpeg)
 
---
 
#### Processo 2 — Cadastro e Publicação de Anúncio pelo Parceiro
 
O Processo 2 modela o fluxo pelo qual o estabelecimento comercial identifica produtos excedentes, cadastra-os na plataforma e os disponibiliza com preço promocional para consumidores próximos.
 
---
 
**Tela 2.1 — Cadastro de Parceiro**
 
Tela de registro inicial do estabelecimento comercial, ponto de entrada para que o parceiro acesse as funcionalidades do Processo 2.
 
Campos disponíveis:
 
- **Nome Completo** (representante do estabelecimento);
- **Endereço de e-mail**;
- **Senha** e **Confirme sua senha**;
- **CNPJ**;
- **Telefone**.

Ações disponíveis: **Criar conta** e **Entrar**.

![Tela de Cadastro de Parceiro](images/cadastro_parceiro.jpeg)
 
---
 
**Tela 2.2 — Painel do Parceiro / Dashboard**
 
Interface central de gestão do estabelecimento comercial. Corresponde à **etapa 2 do Processo 2** (acesso ao painel) e às **etapas 8 e 9** (acompanhamento de reservas e preparação para retirada).
 
Elementos da interface:
 
- **Cabeçalho** com nome do estabelecimento (*Couto Lanches*), endereço, horário de funcionamento e botão **Cadastrar Item**;
- **Lista de pedidos ativos** com nome do item, valor e indicador de status;
- **Painel de métricas**: Receita do dia (R$ 105), Pedidos do dia (7), Avaliação média (4,5) e Ticket médio (R$ 15,00);
- **Painel de impacto sustentável**: CO₂ evitado (0,8 kg) e Refeições salvas (90).

![Tela do Painel do Parceiro](images/Dashboard.jpeg)
 
---
 
**Tela 2.3 — Cadastro de Item**
 
Operacionaliza as **etapas 3, 4 e 5 do Processo 2**: cadastro do anúncio, definição do preço promocional e publicação do produto excedente.
 
Campos e elementos disponíveis:
 
- **Tipo de anúncio**: *Refeição* ou *Sacola surpresa*;
- **Nome do item** e **Descrição**;
- **Categoria**: seleção por etiquetas (*Padaria*, *Doce*, *Refeição*, *Lanche*, *Suco*, *Fruta*, *Pudim*);
- **Quantidade disponível**: controle numérico com incremento e decremento;
- **Disponível até**: campo de data para prazo de retirada;
- **Valor original** e **Valor especial**: precificação promocional;
- **Upload de foto** do produto;
- Botão **Enviar** para publicação do anúncio.

![Tela de Cadastro de Item](images/cadastro_item.jpeg)
 
---
 
**Tela 2.4 — Dashboard Expandido do Parceiro**
 
Versão expandida do painel do parceiro, exibindo o detalhamento financeiro dos pedidos ativos e o histórico de pedidos finalizados. Suporta as **etapas 8 e 9 do Processo 2**, oferecendo ao estabelecimento visibilidade completa sobre as reservas recebidas e o desempenho operacional.
 
Elementos da interface:
 
- **Cabeçalho** com nome do estabelecimento e acesso ao cadastro de novos itens;
- **Resumo financeiro dos pedidos ativos**: listagem com nome do item, preço unitário, quantidade disponível e valor acumulado;
- **Histórico de pedidos**: registro dos pedidos já realizados no estabelecimento, com indicação de status;
- **Aviso de análise de pedidos em andamento**, sinalizando pedidos aguardando confirmação.

![Tela de Dashboard Expandido do Parceiro](images/dashboard_pedidos.jpeg)
 
---
 
### Demais telas do sistema
 
Esta seção apresenta as telas do FoodLoop que complementam a experiência do sistema sem estarem vinculadas diretamente a um processo BPMN específico.
 
---
 
**Cadastro de Consumidor**
 
Tela de registro inicial de novos consumidores. Coleta as informações necessárias para criação da conta e oferece alternativa de autenticação via Google.
 
Campos: **Endereço de e-mail**, **Nome Completo**, **Senha** e **Confirme sua senha**.  
Ações: **Criar conta**, **Entrar** e **Inscrever-se com o Google**.
 
![Tela de Cadastro de Consumidor](images/cadastro_consumidor.jpeg)
 
---
 
**Perfil do Consumidor e Impacto Sustentável**
 
Reúne informações pessoais e indicadores de impacto ambiental gerado pelo uso da plataforma.
 
Elementos da interface:
 
- **Cabeçalho** com iniciais, nome completo e endereço do usuário (*Gustavo Pontes, Rua Redelvim Andrade 215, Betim*);
- **Último pedido**: nome do item adquirido mais recentemente (*Morango*);
- **Painel "Seu impacto sustentável"**: CO₂ Evitado (5,7 kg) e Pedidos realizados (27);
- **Avaliação de pedidos recentes**: card do último pedido com sistema de avaliação por estrelas.

![Tela de Perfil e Impacto Sustentável](images/perfil_consumidor.jpeg)
 
---
 
**Tela Institucional — Sobre o FoodLoop**
 
Tela informativa acessível pelo link *Saiba +* na tela de login, apresentando a proposta de valor e a missão da plataforma para novos usuários.
 
Blocos de conteúdo:
 
- **"O Ciclo da Abundância"**: posicionamento do FoodLoop como ponte tecnológica entre estabelecimentos com excedentes e pessoas que buscam alimentos de qualidade por preço justo;
- **"Nossa Missão"**: compromisso com o consumo consciente, redução de emissões de efeito estufa e promoção da economia circular;
- **Ícones de benefícios**: síntese visual dos três pilares da plataforma.

![Tela Institucional — Sobre o FoodLoop](images/sobre.jpeg)
 
---
 
**Overlays de feedback ao usuário**
 
O sistema conta com um conjunto de overlays modais que fornecem retorno imediato ao usuário após ações críticas, sem necessidade de navegação para nova tela. Os overlays identificados no protótipo são:
 
| Overlay | Descrição |
|---|---|
| **Edit_profile** | Formulário de edição de perfil do consumidor (nome, endereço, bairro, cidade e CEP) |
| **Frame 3** | Confirmação de conta criada com sucesso, orientando o usuário a verificar o e-mail para validação |
| **Produto cadastrado com sucesso** | Confirmação de que o anúncio foi publicado com êxito na plataforma |
| **Forma seu Espaço** | Formulário de endereço do estabelecimento (campos: endereço, bairro, cidade e CEP) |
| **Pedido realizado com sucesso** | Confirmação de pedido com nome do produto e ID do pedido, com botão de acompanhamento |
| **Pedido cancelado** | Notificação de cancelamento de pedido com informações resumidas e confirmação via botão *OK* |
| **Preparo do pedido** | Notificação ao parceiro com nome do cliente e ID do pedido a ser preparado |
 
![Overlays de feedback ao usuário](images/overlays.jpeg)
 
---
