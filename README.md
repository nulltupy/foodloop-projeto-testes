# FoodLoop

> [!NOTE]
> **Projeto de Testes — Teste e Manutenção de Software (2026/2)**
>
> Este repositório usa o FoodLoop (TI de 2026/1) como base para o Projeto de Testes do grupo de
> Caio Vieira, Cristiano Tupynambá, Eduardo Antunes, Guilherme de Aguilar Coelho,
> Gustavo de Aguilar Coelho, Mateus Enrico e Max Augusto.
>
> - **Tudo sobre os testes:** [`testes-tms/`](testes-tms) (com o passo a passo para rodar)
> - **Plano de testes:** [Word](testes-tms/Plano%20de%20Testes%20-%20FoodLoop.docx) ·
>   [PDF](testes-tms/Plano%20de%20Testes%20-%20FoodLoop.pdf)
> - **Testes unitários:** [`src/front/src/testes-tms/unitarios.test.ts`](src/front/src/testes-tms/unitarios.test.ts)
> - **Testes Selenium:** [`testes-tms/selenium/specs/foodloop.spec.js`](testes-tms/selenium/specs/foodloop.spec.js)
>
> O restante deste README é o original do TI.

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

## Deployments

| Componente | URL                                       |
| ---------- | ----------------------------------------- |
| Back (API) | https://foodloop-back.onrender.com        |
| Health     | https://foodloop-back.onrender.com/health |
| Front      | https://foodloop-front.onrender.com       |

> O back roda no Render Free em `oregon` (única opção do tier gratuito) e
> hiberna após 15 min sem requisições — a primeira chamada após hibernação
> tem cold start de ~30 s. O front é Static Site distribuído via CDN global
> e não tem cold start (sem servidor).

### Deploy do back

O deploy é declarativo via [`render.yaml`](./src/render.yaml) em `src/` e disparado
pelo CI (`.github/workflows/deploy-back.yml`) sempre que um commit em `main`
toca `src/back/**` ou `src/lib/**`. O workflow chama o Deploy Hook do Render
(secret `RENDER_BACK_DEPLOY_HOOK`); se o secret não estiver configurado, o
workflow falha-soft e segue em frente.

Para disparar um deploy manual:

```bash
curl -fsSL -X POST "$RENDER_BACK_DEPLOY_HOOK"
```

### Deploy do front

O front é um Render Static Site declarado no mesmo [`render.yaml`](./src/render.yaml).
Reaproveita a integração GitHub já autorizada pela organização — sem novo app,
sem token de API, sem secret no GitHub Actions. Build e publicação rodam direto
no Render (`autoDeployTrigger: commit` + `buildFilter`); cada commit em `main`
que toque `src/front/**`, `src/lib/**`, `src/render.yaml`, `package.json` ou
`package-lock.json` dispara um redeploy automático.

Setup único (na primeira vez que o Blueprint subir):

1. Render dashboard → Blueprints → `foodloop` → **Sync** (lê o `src/render.yaml` da
   `main` e cria o serviço `foodloop-front`). Se o Blueprint ainda não existir,
   criar via New → Blueprint apontando para este repo.
2. Aguardar o primeiro build em `foodloop-front` → Logs (~2–3 min).
3. Atualizar a env `FRONT_URL` em `foodloop-back` → Environment para
   `https://foodloop-front.onrender.com` e salvar (o back redeploya sozinho).

Smoke test:

```bash
curl -sI https://foodloop-front.onrender.com | head -3
curl -sI https://foodloop-front.onrender.com/rota-inexistente | head -3   # SPA fallback → 200
```

### Instruções de utilização

Cadastre um usuário via `POST /api/v1/auth/register` (ou pela tela de cadastro
do front) e use as credenciais retornadas para autenticar nos endpoints
subsequentes.

#### Contas demo (após rodar `npm run -w src/back seed`)

Senha de todos: `demo1234`.

| Tipo        | Email                                                                                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cliente     | `cliente1@demo.foodloop`, `cliente2@demo.foodloop`, `cliente3@demo.foodloop`                                                                                                                                                                 |
| Comerciante | `comerciante1@demo.foodloop` (Couto Lanches), `comerciante2@demo.foodloop` (Padaria Pão Quente), `comerciante3@demo.foodloop` (Sabor Caseiro), `comerciante4@demo.foodloop` (Açaí da Praça), `comerciante5@demo.foodloop` (Bistrô do Bairro) |

O seed apaga e recria todo o dado de demo a cada execução (`TRUNCATE … CASCADE`),
então rodar é idempotente — usar com cuidado em ambientes compartilhados.

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
docker compose -f src/docker-compose.dev.yml up -d

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

| Arquivo           | Quando roda                                           | O que faz                                                                                                                                                      |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`          | PR + push em `main`                                   | Detecta diffs por path; roda lint+test+build dos workspaces afetados em paralelo; converge em `ci-success` — único `required check` em branch protection.      |
| `deploy-back.yml` | Push em `main` afetando `src/back/**` ou `src/lib/**` | Aplica `prisma migrate deploy` em prod e, se passar, aciona o deploy hook do Render. Pula o deploy se `RENDER_BACK_DEPLOY_HOOK` ainda não estiver configurado. |
| `keep-alive.yml`  | Cron a cada 10 min, 20-02 UTC (17h-23h BR)            | Pinga `/health` para combater cold start. Pula se `vars.BACK_HEALTH_URL` ainda não estiver setado.                                                             |
| `db-migrate.yml`  | `workflow_dispatch` manual                            | Aplica `prisma migrate deploy` em prod. Exige digitar `MIGRATE` como input e passa por `environment: production` (required reviewers).                         |
| `seed-prod.yml`   | `workflow_dispatch` manual                            | Roda `npm run -w src/back seed` contra `PROD_DATABASE_URL`. Exige digitar `SEED` como input. Apaga e recria todos os dados de demo (TRUNCATE CASCADE).         |
| `e2e.yml`         | `workflow_dispatch` manual                            | Stub até o card de Playwright entrar. `on.schedule` está comentado.                                                                                            |

**Secrets/variables que o maintainer precisa configurar** (Settings → Secrets and variables → Actions):

- Secrets: `RENDER_BACK_DEPLOY_HOOK`, `PROD_DATABASE_URL`.
- Variables: `BACK_HEALTH_URL`, `FRONT_BASE_URL`.

**Environment `production`** (Settings → Environments). O script `setup-branch-protection.sh` configura automaticamente: branch restriction para `main`, prevent self-review e wait timer de 5 min. Falta apenas adicionar **required reviewers** manualmente (a API exige user IDs numéricos; mais simples pelo painel).

### Branch protection em `main`

Regras aplicadas (script idempotente em [`.github/scripts/setup-branch-protection.sh`](.github/scripts/setup-branch-protection.sh)):

- PR obrigatório com 1 approval; aprovações são descartadas em novo push.
- `ci-success` precisa estar verde para mergear.
- Branch precisa estar atualizada com `main` antes do merge.
- Todas as conversas no PR têm que estar resolvidas.
- Histórico linear (apenas squash merge habilitado no repo); merge commits e rebase merges desabilitados.
- Force push e deletion bloqueados.
- Branch da feature é deletada automaticamente após o merge.

Reaplicar (precisa de token admin via `gh auth login`):

```bash
bash .github/scripts/setup-branch-protection.sh
```

# Apresentação

- <a href="presentation/README.md">Apresentação do projeto</a>
