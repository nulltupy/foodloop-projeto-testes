
# Metodologia

<span style="color:red">Pré-requisitos: <a href="02-Especificacao.md"> Especificação do projeto</a></span>

Descreva aqui a metodologia de trabalho do grupo para abordar o problema. Inclua definições sobre os ambientes de trabalho utilizados pela equipe para desenvolver o projeto. Isso abrange a relação dos ambientes utilizados, a estrutura para a gestão do código-fonte, além da definição do processo e das ferramentas por meio dos quais a equipe se organiza (gestão de equipes).


## Controle de versão

A ferramenta de controle de versão adotada no projeto foi o [Git](https://git-scm.com/), sendo que o [GitHub](https://github.com) foi utilizado para hospedagem do repositório.

O projeto adota as seguintes convenções para branches:

- `feat/` — nova funcionalidade
- `docs/` — documentação
- `fix/` — correção de bug
- `chore/` — manutenção (configurações, dependências, etc.)

Para commits, adota-se o mesmo prefixo seguido de uma descrição curta:

- `feat: descrição` — nova funcionalidade
- `docs: descrição` — documentação
- `fix: descrição` — correção de bug
- `chore: descrição` — manutenção

Merges são realizados sempre via Pull Request, nunca diretamente na `main`. As issues são gerenciadas pelo GitHub Projects e vinculadas aos PRs com `Closes #<número>`, permitindo o fechamento automático ao merge.

## Planejamento do projeto

###  Divisão de papéis

> Apresente a divisão de papéis entre os membros do grupo em cada Sprint. O desejável é que, em cada Sprint, o aluno assuma papéis diferentes na equipe. Siga o modelo do exemplo abaixo:

#### Sprint 1
- _Scrum master_: Gabriel Santos Arpini
- Documentação (Personas): Gabriel Xavier de Souza
- Documentação (BMC): Diogo Lamera dos Santos
- Documentação (Requisitos e Restrições): Rafael Lucas Mota Oliveira
- Documentação (Histórias de usuário): Gabriel Santos Arpini

#### Sprint 2
- _Scrum master_: Gabriel Santos Arpini
- Documentação: Cristiano Tupynambá Reis
- Documentação: Diogo Lamera dos Santos
- Documentação: Gabriel Xavier de Souza
- Documentação: Guilherme Setragni Freitas
- Documentação: Rafael Lucas Mota Oliveira

#### Sprint 3
- _Scrum master_: Gabriel Santos Arpini
- Documentação (BPMN — processos AS-IS/TO-BE): Cristiano Tupynambá Reis
- Documentação (Arquitetura da solução e diagrama de classes): Diogo Lamera dos Santos
- Documentação (Jornada do usuário e ajustes em interface): Gabriel Xavier de Souza
- Documentação (User flow, tecnologias e hospedagem): Gabriel Santos Arpini
- Documentação (Modelo conceitual, relacional e físico do banco de dados): Guilherme Setragni Freitas
- Documentação (Wireframes, telas do sistema e apresentação): Rafael Lucas Mota Oliveira

###  Quadro de tarefas

> Apresente a divisão de tarefas entre os membros do grupo e o acompanhamento da execução, conforme o exemplo abaixo.

#### Sprint 1

Atualizado em: 17/03/2026

| Responsável   | Tarefa/Requisito | Iniciado em    | Prazo      | Status | Terminado em    |
| :----         |    :----         |      :----:    | :----:     | :----: | :----:          |
| Cristiano Tupynamba Reis   | Contexto                  | 11/03/2026 | 17/03/2026 | ✔️ | 17/03/2026 |
| Guilherme Setragni de Freitas   | Contexto                  | 11/03/2026 | 17/03/2026 | ✔️ | 17/03/2026 |
| Gabriel Santos Arpini      | Histórias de usuário      | 11/03/2026 | 17/03/2026 | ✔️ | 17/03/2026 |
| Gabriel Xavier de Souza    | Personas                  | 11/03/2026 | 17/03/2026 | ✔️ | 17/03/2026 |
| Diogo Lamera dos Santos    | Business Model Canvas     | 11/03/2026 | 17/03/2026 | ✔️ | 16/03/2026 |
| Rafael Lucas Mota Oliveira | Requisitos funcionais     | 11/03/2026 | 17/03/2026 | ✔️ | 17/03/2026 |
| Rafael Lucas Mota Oliveira | Requisitos não funcionais | 11/03/2026 | 17/03/2026 | ✔️ | 17/03/2026 |
| Rafael Lucas Mota Oliveira | Restrições                | 11/03/2026 | 17/03/2026 | ✔️ | 17/03/2026 |

#### Sprint 2

Atualizado em: 21/04/2026

| Responsável   | Tarefa/Requisito | Iniciado em    | Prazo      | Status | Terminado em    |
| :----         |    :----         |      :----:    | :----:     | :----: | :----:          |
| Diogo Lamera dos Santos    | Update das ferramentas              | 08/04/2026   | 22/04/2026 | ✔️ | 16/04/2026 |
| Cristiano Tupynamba Reis   | Preencher carta do estabelecimento  | 08/04/2026   | 22/04/2026 | ✔️ | 21/04/2026 |
| Rafael Lucas Mota Oliveira | Preencher quadro de tarefas         | 08/04/2026   | 22/04/2026 | ✔️ | 22/04/2026 |
| Rafael Lucas Mota Oliveira | Criar os slides                     | 08/04/2026   | 22/04/2026 | ✔️ | 21/04/2026 |
| Diogo Lamera dos Santos    | Descrição geral da proposta         | 08/04/2026   | 22/04/2026 | ✔️ | 22/04/2026 |
| Gabriel Santos Arpini      | Indicadores de desempenho           | 08/04/2026   | 22/04/2026 | ✔️ | 22/04/2026 |
| Gabriel Xavier de Souza    | Processo 1 - TO BE                  | 08/04/2026   | 22/04/2026 | ✔️ | 22/04/2026 |
| Cristiano Tupynamba Reis   | Processo 1 - AS IS                  | 08/04/2026   | 22/04/2026 | ✔️ | 21/04/2026 |
| Guilherme Setragni Freitas | Modelagem da situação atual         | 08/04/2026   | 22/04/2026 | ✔️ | 22/04/2026 |

#### Sprint 3

Atualizado em: 12/05/2026

| Responsável   | Tarefa/Requisito | Iniciado em    | Prazo      | Status | Terminado em    |
| :----         |    :----         |      :----:    | :----:     | :----: | :----:          |
| Cristiano Tupynambá Reis   | BPMN — Processo 1 e 2 (AS-IS e TO-BE)            | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Diogo Lamera dos Santos    | Arquitetura da solução                           | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Diogo Lamera dos Santos    | Diagrama de classes                              | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Gabriel Xavier de Souza    | Jornada do usuário (modelo AIDA)                 | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Gabriel Santos Arpini      | User flow e diagramas de fluxo (Mermaid)         | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Gabriel Santos Arpini      | Tecnologias e hospedagem                         | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Guilherme Setragni Freitas | Modelo conceitual (DER em Peter Chen)            | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Guilherme Setragni Freitas | Modelo relacional (notação Pé de Galinha)        | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Guilherme Setragni Freitas | Modelo físico (DDL PostgreSQL em src/db)         | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Rafael Lucas Mota Oliveira | Wireframes e telas do sistema                    | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |
| Rafael Lucas Mota Oliveira | Apresentação (slides) da Sprint 3                | 29/04/2026 | 13/05/2026 | ✔️ | 12/05/2026 |

Legenda:
- ✔️: terminado
- 📝: em execução
- ⌛: atrasado
- ❌: não iniciado

### Processo

O grupo adotou uma abordagem baseada em Scrum, com entregas organizadas em Sprints. O gerenciamento das tarefas foi realizado por meio do GitHub Projects, utilizando um quadro Kanban onde cada tarefa foi cadastrada como um card e distribuída entre os membros da equipe. Os integrantes selecionavam as tarefas disponíveis no quadro e atualizavam o status conforme o andamento, permitindo acompanhar o progresso da Sprint de forma colaborativa e transparente.

O quadro do projeto pode ser acessado em: https://github.com/orgs/ICEI-PUC-Minas-PBE-SI-TI/projects/6/views/1

Imagem da Sprint 1 ![Sprint 1](images/sprint1.png)

 ![sprint 1](images/spint1.png)
 
Imagem da Sprint 2

 ![sprint 2](images/sprin2.png)

Imagem da Sprint 3

 ![sprint 3](images/sprint3.png)



## Ferramentas

Os artefatos do projeto são desenvolvidos a partir de diversas plataformas. A relação dos ambientes com seus respectivos propósitos deverá ser apresentada em uma tabela que especifique e detalhe Ambiente, Plataforma e Link de Acesso. Sempre que possível, inclua também frameworks, bibliotecas e demais tecnologias utilizadas, indicando seu uso em contextos específicos, como aplicações móveis, web ou outros.

Os artefatos do projeto são desenvolvidos a partir de diversas plataformas e a relação dos ambientes com seus respectivos propósitos é apresentada na tabela a seguir.

| Ambiente                            | Plataforma                         | Link de acesso                         |
|-------------------------------------|------------------------------------|----------------------------------------|
| Repositório de código fonte         | GitHub                             | https://github.com/ICEI-PUC-Minas-PBE-SI-TI/2026-1-p5-tias-foodloop |
| Documentos do projeto               | GitHub                             | https://github.com/ICEI-PUC-Minas-PBE-SI-TI/2026-1-p5-tias-foodloop/tree/main/docs |
| Gerenciamento do projeto            | GitHub Projects                    | https://github.com/orgs/ICEI-PUC-Minas-PBE-SI-TI/projects/6/views/1 |
| Comunicação da equipe               | WhatsApp                           | —                                      |
| Desenvolvimento web (front-end)     | React + Vite + TypeScript          | https://react.dev/   -   https://vitejs.dev/               |
| Back-end, banco e hospedagem        | Render (Node.js + Express + PostgreSQL) | https://render.com/                |
| Armazenamento de mídia e push       | Firebase (Storage e Cloud Messaging) | https://firebase.google.com/         |
| Mapas e geolocalização              | ViaCEP + Nominatim/OpenStreetMap + links Google Maps | https://viacep.com.br/ - https://nominatim.org/ - https://maps.google.com |
| Gateway de pagamento                | Mercado Pago                       | https://www.mercadopago.com.br/developers |
 
