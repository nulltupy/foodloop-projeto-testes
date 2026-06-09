# FoodLoop

`CURSO: Sistemas de Informação`

`DISCIPLINA: Trabalho Interdisciplinar Aplicações para Sustentabilidade`

`1º Semestre/2026`

O objetivo do projeto FoodLoop é desenvolver uma plataforma digital que conecte estabelecimentos que possuem excedente de alimentos, como restaurantes, padarias e supermercados, com consumidores interessados em comprar esses produtos por preços reduzidos. Dessa forma, o sistema permite que alimentos que seriam descartados possam ser aproveitados, criando uma solução prática para diminuir o desperdício e ao mesmo tempo gerar benefícios econômicos tanto para as empresas quanto para os usuários.

Além disso, o projeto busca incentivar práticas de consumo mais conscientes e sustentáveis na sociedade. Ao facilitar o reaproveitamento de alimentos que ainda estão próprios para consumo, o FoodLoop contribui para a redução do lixo gerado e promove maior conscientização sobre o impacto do desperdício de comida no meio ambiente, ajudando a construir um ciclo mais sustentável entre empresas e consumidores.

## Integrantes

- Cristiano Tupynambá Reis
- Diogo Lamera dos Santos
- Gabriel Xavier de souza
- Gabriel Santos Arpini
- Guilherme Setragni
- Rafael Lucas Mota Oliveira

## Professor

- Amália Soares Vieira de Vasconcelos

## Instruções de utilização

Assim que a primeira versão do sistema estiver disponível, deverá complementar com as instruções de utilização. Descreva como instalar eventuais dependências e como executar a aplicação.

Não deixe de informar o link onde a aplicação estará disponível para acesso (por exemplo: https://adota-pet.herokuapp.com/src/index.html).

Se houver usuário de teste, o login e a senha também deverão ser informados aqui (por exemplo: usuário - admin / senha - admin).

O link e o usuário/senha descritos acima são apenas exemplos de como tais informações deverão ser apresentadas.

# Documentação

<ol>
<li><a href="docs/01-Contexto.md"> Documentação de contexto</a></li>
<li><a href="docs/02-Especificacao.md"> Especificação do projeto</a></li>
<li><a href="docs/03-Metodologia.md"> Metodologia</a></li>
<li><a href="docs/04-Modelagem-processos-negocio.md"> Modelagem dos processos de negócios</a></li>
<li><a href="docs/05-Projeto-interface.md"> Projeto de interface</a></li>
<li><a href="docs/06-Template-padrao.md"> Template padrão da aplicação</a></li>
<li><a href="docs/07-Arquitetura-solucao.md"> Arquitetura da solução</a></li>
<li><a href="docs/08-Plano-testes-software.md"> Plano de testes de software</a></li>
<li><a href="docs/09-Registro-testes-software.md"> Registro de testes de software</a></li>
<li><a href="docs/10-Plano-testes-usabilidade.md"> Plano de testes de usabilidade</a></li>
<li><a href="docs/11-Registro-testes-usabilidade.md"> Registro de testes de usabilidade</a></li>
<li><a href="docs/12-Conclusao.md"> Conclusão</a></li>
<li><a href="docs/13-Referencias.md"> Referências</a></li>
</ol>

# Código

- <a href="src/README.md">Código</a>

## Como rodar localmente

Pré-requisitos: Node 20 LTS (`nvm use` lê o `.nvmrc`), npm 10+, Docker (para o Postgres local).

```bash
# Clonar e entrar
git clone git@github.com:ICEI-PUC-Minas-PBE-SI-TI/2026-1-p5-tias-foodloop.git
cd 2026-1-p5-tias-foodloop

# Instalar todos os workspaces de uma vez
npm install

# Verificações por workspace
npm run -w src/lib build       # gera dist/ do pacote portável
npm run typecheck              # roda em todos os workspaces
npm run lint                   # idem
npm run test                   # idem
```

Os pacotes vivem em `src/back`, `src/front` e `src/lib` (este último contém código compartilhado entre back e front via `@foodloop/lib`).

### Subir o back com Postgres local

```bash
# 1. Subir o Postgres local (porta 5433 do host)
docker compose -f docker-compose.dev.yml up -d

# 2. Configurar variáveis de ambiente do back
cp src/back/.env.example src/back/.env

# 3. Aplicar as migrations no banco
npx --prefix src/back prisma migrate deploy

# 4. Rodar o back em modo dev (PORT padrão 3010)
npm run -w src/back dev

# 5. Verificar
curl http://localhost:3010/health
# esperado: {"status":"ok", ...}
```

### Subir o front

```bash
# 1. Build inicial do pacote portável (gera dist/ que o front consome)
npm run -w src/lib build

# 2. (Opcional) sobrescrever a URL do back
cp src/front/.env.example src/front/.env

# 3. Dev server em http://localhost:5173
npm run -w src/front dev
```

Detalhes do front (scripts, layout, stack) em [`src/front/README.md`](src/front/README.md).

## CI/CD

Workflows em `.github/workflows/`:

| Arquivo           | Quando roda                                           | O que faz                                                                                                                                                                                                                                 |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`          | PR + push em `main`                                   | Detecta diffs por path; roda lint+test+build dos workspaces afetados em paralelo; converge em `ci-success` — o check designado para ser o único `required check` em branch protection (a regra em si será configurada em um card futuro). |
| `deploy-back.yml` | Push em `main` afetando `src/back/**` ou `src/lib/**` | Aciona o deploy hook do Render. Pula se o secret `RENDER_BACK_DEPLOY_HOOK` ainda não estiver configurado.                                                                                                                                 |
| `keep-alive.yml`  | Cron a cada 10 min, 20-02 UTC (17h-23h BR)            | Pinga `/health` para combater cold start. Pula se `vars.BACK_HEALTH_URL` ainda não estiver setado.                                                                                                                                        |
| `db-backup.yml`   | Cron 04 UTC (01h BR)                                  | `pg_dump` da prod, upload para R2. Falha cedo se algum secret estiver faltando.                                                                                                                                                           |
| `db-migrate.yml`  | `workflow_dispatch` manual                            | Aplica `prisma migrate deploy` em prod. Exige digitar `MIGRATE` como input e passa por `environment: production` (required reviewers).                                                                                                    |
| `e2e.yml`         | `workflow_dispatch` manual                            | Stub até o card de Playwright entrar. `on.schedule` está comentado.                                                                                                                                                                       |

**Secrets/variables que o maintainer precisa configurar** (Settings → Secrets and variables → Actions):

- Secrets: `RENDER_BACK_DEPLOY_HOOK`, `PROD_DATABASE_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`.
- Variables: `BACK_HEALTH_URL`, `FRONT_BASE_URL`.

**Infra fora do GitHub** que precisa existir antes de cada workflow rodar de verdade:

- Bucket R2 chamado `foodloop-backups` (referenciado em `db-backup.yml`). Precisa ser criado manualmente no painel do Cloudflare antes do primeiro `pg_dump` rodar.

**Environment `production`** (Settings → Environments) deve ter: required reviewers, branch restriction para `main`, prevent self-review habilitado, wait timer de 5 min.

# Apresentação

- <a href="presentation/README.md">Apresentação do projeto</a>
