# Especificação do projeto

<span style="color:red">Pré-requisitos: <a href="01-Contexto.md"> Documentação de contexto</a></span>

Esta seção apresenta a definição do problema e a proposta de solução sob a perspectiva do usuário, utilizando técnicas de modelagem que permitam compreender e detalhar as necessidades do negócio e as funcionalidades esperadas do sistema.  

Nesta seção são apresentadas as personas, histórias de usuários, requisitos funcionais e não funcionais, bem como as restrições do projeto. Também são descritas as ferramentas e metodologias empregadas para elaborar essas especificações, garantindo que todos os participantes possuam uma compreensão unificada do escopo, dos objetivos e das prioridades do trabalho.

## Modelo de negócio (*Business Model Canvas*)

O Business Model Canvas (BMC) foi elaborado com base na proposta do FoodLoop, considerando seus públicos, proposta de valor, canais, recursos, custos e fontes de receita.

A seguir, apresenta-se o modelo de negócio desenvolvido para o projeto.

![Modelo de negócio do FoodLoop](images/ModeloDeNegócio.png)

## Personas

![Persona 01](images/Persona_1)

![Persona 02](images/Persona_2)

![Persona 03](images/Persona_3)

![Persona 04](images/Persona_4)

![Persona 05](images/Persona_5)

![Persona 06](images/Persona_6)

> **Links úteis**:
> - [Rock content](https://rockcontent.com/blog/personas/)
> - [Hotmart](https://blog.hotmart.com/pt-br/como-criar-persona-negocio/)
> - [O que é persona?](https://resultadosdigitais.com.br/blog/persona-o-que-e/)
> - [Persona x público-alvo](https://flammo.com.br/blog/persona-e-publico-alvo-qual-a-diferenca/)
> - [Mapa de empatia](https://resultadosdigitais.com.br/blog/mapa-da-empatia/)
> - [Mapa de stalkeholders](https://www.racecomunicacao.com.br/blog/como-fazer-o-mapeamento-de-stakeholders/)


## Histórias de usuários

Com base na análise das personas, foram identificadas as seguintes histórias de usuários:

|EU COMO... `PERSONA`| QUERO/PRECISO ... `FUNCIONALIDADE` |PARA ... `MOTIVO/VALOR`                 |
|--------------------|------------------------------------|----------------------------------------|
|Usuário do sistema  | Registrar minhas tarefas           | Não esquecer de fazê-las               |
|Administrador       | Alterar permissões                 | Permitir que possam administrar contas |

Apresente aqui as histórias de usuários que são relevantes para o projeto da sua solução. As histórias de usuários consistem em uma ferramenta poderosa para a compreensão e elicitação dos requisitos funcionais e não funcionais da sua aplicação. Se possível, agrupe as histórias de usuários por contexto, para facilitar consultas recorrentes a esta parte do documento.

> **Links úteis**:
> - [Histórias de usuários com exemplos e template](https://www.atlassian.com/br/agile/project-management/user-stories)
> - [Como escrever boas histórias de usuário (user stories)](https://medium.com/vertice/como-escrever-boas-users-stories-hist%C3%B3rias-de-usu%C3%A1rios-b29c75043fac)
> - [User stories: requisitos que humanos entendem](https://www.luiztools.com.br/post/user-stories-descricao-de-requisitos-que-humanos-entendem/)
> - [Histórias de usuários: mais exemplos](https://www.reqview.com/doc/user-stories-example.html)
> - [9 common user story mistakes](https://airfocus.com/blog/user-story-mistakes/)

## Requisitos

As tabelas a seguir apresentam os requisitos funcionais e não funcionais que detalham o escopo do projeto, alinhados com as diretrizes mapeadas no Business Model Canvas (BMC). Para determinar a prioridade dos requisitos, aplicou-se a técnica de valor de negócio e urgência.

### Requisitos funcionais

| ID | Descrição do Requisito | Prioridade |
| :--- | :--- | :--- |
| **RF-001** | O sistema deve permitir o cadastro e login de usuários (Consumidores e Estabelecimentos Parceiros). | ALTA |
| **RF-002** | O estabelecimento deve poder publicar e gerenciar (CRUD) suas ofertas de excedentes do fim do expediente. | ALTA |
| **RF-003** | O sistema deve listar as ofertas disponíveis para o consumidor, filtradas por geolocalização (GPS). | ALTA |
| **RF-004** | O sistema deve processar reservas e pagamentos, calculando automaticamente a comissão retida pela plataforma FoodLoop. | ALTA |
| **RF-005** | O sistema deve permitir a aplicação de cupons de desconto e oferecer benefícios para usuários frequentes. | MÉDIA |
| **RF-006** | O sistema deve permitir que os consumidores avaliem os estabelecimentos parceiros após a retirada do pedido. | MÉDIA |
| **RF-007** | O sistema deve oferecer suporte à adesão de planos de assinatura para estabelecimentos que desejam maior destaque e espaço promocional no app. | BAIXA |
| **RF-008** | O sistema deve enviar notificações push sobre o status do pedido e promoções próximas. | MÉDIA |

### Requisitos não funcionais

| ID | Descrição do Requisito | Prioridade |
| :--- | :--- | :--- |
| **RNF-001** | O aplicativo deve ser desenvolvido no framework **React Native**, garantindo compatibilidade com dispositivos móveis (Android e iOS). | ALTA |
| **RNF-002** | A persistência de dados e a autenticação de usuários devem ser implementadas utilizando a plataforma **Firebase** (Auth, Firestore). | ALTA |
| **RNF-003** | A integração com os provedores de meios de pagamento deve seguir protocolos de segurança avançados e criptografia ponta a ponta. | ALTA |
| **RNF-004** | O tempo de carregamento da listagem de ofertas no mapa não deve ultrapassar 3 segundos. | MÉDIA |




Com base nas histórias de usuários, enumere os requisitos da sua solução. Classifique esses requisitos em dois grupos:

- [Requisitos funcionais
 (RF)](https://pt.wikipedia.org/wiki/Requisito_funcional):
 correspondem a uma funcionalidade que deve estar presente na
  plataforma (ex: cadastro de usuário).
- [Requisitos não funcionais
  (RNF)](https://pt.wikipedia.org/wiki/Requisito_n%C3%A3o_funcional):
  correspondem a uma característica técnica, seja de usabilidade,
  desempenho, confiabilidade, segurança ou outro (ex: suporte a
  dispositivos iOS e Android).

Lembre-se de que cada requisito deve corresponder a uma e somente uma característica-alvo da sua solução. Além disso, certifique-se de que todos os aspectos capturados nas histórias de usuários foram cobertos.

> **Links úteis**:
> - [O que são requisitos funcionais e requisitos não funcionais?](https://codificar.com.br/requisitos-funcionais-nao-funcionais/)
> - [Entenda o que são requisitos de software, a diferença entre requisito funcional e não funcional, e como identificar e documentar cada um deles](https://analisederequisitos.com.br/requisitos-funcionais-e-requisitos-nao-funcionais-o-que-sao/)

## Restrições

O projeto está restrito aos itens apresentados na tabela a seguir, que delimitam o escopo de execução, as escolhas tecnológicas e os recursos disponíveis.

| ID | Restrição |
| :--- | :--- |
| **001** | O projeto e a apresentação deverão ser entregues obrigatoriamente dentro do prazo estipulado pelo cronograma acadêmico. |
| **002** | O desenvolvimento do software deve ser realizado exclusivamente pelos integrantes do grupo, sendo proibida a contratação de terceiros. |
| **003** | A arquitetura de software está restrita ao uso de React Native (Front-end) e Firebase (Back-end/BaaS), conforme validação técnica da equipe. |
| **004** | O custo total do projeto deve ser contido no orçamento zero, utilizando apenas os planos gratuitos (*Free Tier*) de plataformas de hospedagem e APIs. |
## Diagrama de casos de uso

O diagrama de casos de uso é o próximo passo após a elicitação de requisitos. Ele utiliza um modelo gráfico e uma tabela com as descrições sucintas dos casos de uso e dos atores. O diagrama contempla a fronteira do sistema e o detalhamento dos requisitos funcionais, com a indicação dos atores, casos de uso e seus relacionamentos.

As referências abaixo irão auxiliá-lo na geração do artefato “diagrama de casos de uso”.

> **Links úteis**:
> - [Criando casos de uso](https://www.ibm.com/docs/pt-br/engineering-lifecycle-management-suite/design-rhapsody/10.0?topic=cases-creating-use)
> - [Como criar diagrama de caso de uso: tutorial passo a passo](https://gitmind.com/pt/fazer-diagrama-de-caso-uso.html/)
> - [Lucidchart](https://www.lucidchart.com/)
> - [Astah](https://astah.net/)
> - [Diagrams](https://app.diagrams.net/)
