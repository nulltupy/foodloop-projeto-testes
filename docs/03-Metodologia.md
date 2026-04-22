
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

> **Links úteis**:
> - [Tutorial GitHub](https://guides.github.com/activities/hello-world/)
> - [Git e GitHub](https://www.youtube.com/playlist?list=PLHz_AreHm4dm7ZULPAmadvNhH6vk9oNZA)
> - [Comparando fluxos de trabalho](https://www.atlassian.com/br/git/tutorials/comparing-workflows)
> - [Understanding the GitHub flow](https://guides.github.com/introduction/flow/)
> - [The gitflow workflow - in less than 5 mins](https://www.youtube.com/watch?v=1SXpE08hvGs)

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
- _Scrum master_: AlunaY
- Desenvolvedor _front-end_: AlunoX
- Desenvolvedor _back-end_: AlunoK
- Testes: AlunaZ

###  Quadro de tarefas

> Apresente a divisão de tarefas entre os membros do grupo e o acompanhamento da execução, conforme o exemplo abaixo.

#### Sprint 1

Atualizado em: 17/03/2026

| Responsável   | Tarefa/Requisito | Iniciado em    | Prazo      | Status | Terminado em    |
| :----         |    :----         |      :----:    | :----:     | :----: | :----:          |
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

Legenda:
- ✔️: terminado
- 📝: em execução
- ⌛: atrasado
- ❌: não iniciado


> **Links úteis**:
> - [11 passos essenciais para implantar Scrum no seu projeto](https://mindmaster.com.br/scrum-11-passos/)
> - [Scrum em 9 minutos](https://www.youtube.com/watch?v=XfvQWnRgxG0)
> - [Os papéis do Scrum e a verdade sobre cargos nessa técnica](https://www.atlassian.com/br/agile/scrum/roles)

### Processo

O grupo adotou uma abordagem baseada em Scrum, com entregas organizadas em Sprints. O gerenciamento das tarefas foi realizado por meio do GitHub Projects, utilizando um quadro Kanban onde cada tarefa foi cadastrada como um card e distribuída entre os membros da equipe. Os integrantes selecionavam as tarefas disponíveis no quadro e atualizavam o status conforme o andamento, permitindo acompanhar o progresso da Sprint de forma colaborativa e transparente.

O quadro do projeto pode ser acessado em: https://github.com/orgs/ICEI-PUC-Minas-PBE-SI-TI/projects/6/views/1

> **Links úteis**:
> - [Planejamento e gestão ágil de projetos](https://pucminas.instructure.com/courses/87878/pages/unidade-2-tema-2-utilizacao-de-ferramentas-para-controle-de-versoes-de-software)
> - [Sobre quadros de projeto](https://docs.github.com/pt/issues/organizing-your-work-with-project-boards/managing-project-boards/about-project-boards)
> - [Project management, made simple](https://github.com/features/project-management/)
> - [Como criar backlogs no GitHub](https://www.youtube.com/watch?v=RXEy6CFu9Hk)
> - [Tutorial slack](https://slack.com/intl/en-br/)

## Ferramentas

Os artefatos do projeto são desenvolvidos a partir de diversas plataformas. A relação dos ambientes com seus respectivos propósitos deverá ser apresentada em uma tabela que especifique e detalhe Ambiente, Plataforma e Link de Acesso. Sempre que possível, inclua também frameworks, bibliotecas e demais tecnologias utilizadas, indicando seu uso em contextos específicos, como aplicações móveis, web ou outros.

Os artefatos do projeto são desenvolvidos a partir de diversas plataformas e a relação dos ambientes com seus respectivos propósitos é apresentada na tabela a seguir.

| Ambiente                            | Plataforma                         | Link de acesso                         |
|-------------------------------------|------------------------------------|----------------------------------------|
| Repositório de código fonte         | GitHub                             | https://github.com/ICEI-PUC-Minas-PBE-SI-TI/2026-1-p5-tias-foodloop |
| Documentos do projeto               | GitHub                             | https://github.com/ICEI-PUC-Minas-PBE-SI-TI/2026-1-p5-tias-foodloop/tree/main/docs |
| Gerenciamento do projeto            | GitHub Projects                    | https://github.com/orgs/ICEI-PUC-Minas-PBE-SI-TI/projects/6/views/1 |
| Comunicação da equipe               | WhatsApp                           | —                                      |
| Desenvolvimento mobile              | React Native (Expo)                | https://reactnative.dev/   -   https://expo.dev/            |
| Banco de dados e autenticação       | Firebase                           | https://firebase.google.com/           |
 
