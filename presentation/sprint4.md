---
marp: true
paginate: true
size: 16:9
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  :root {
    --ink: #0f1611;
    --muted: #5b6b62;
    --line: #e5ebe7;
    --bg: #fafaf7;
    --brand: #15803d;
  }
  section {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--ink);
    padding: 80px 100px;
    font-size: 28px;
    line-height: 1.45;
    letter-spacing: -0.005em;
  }
  h1 {
    font-size: 64px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.05;
    margin: 0 0 24px 0;
  }
  h2 {
    font-size: 44px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 28px 0;
  }
  h3 {
    font-size: 28px;
    font-weight: 600;
    color: var(--muted);
    margin: 0 0 16px 0;
  }
  p { margin: 0 0 16px 0; }
  strong { font-weight: 700; }
  em { font-style: normal; color: var(--brand); font-weight: 600; }
  a { color: var(--brand); text-decoration: none; border-bottom: 2px solid var(--brand); }
  blockquote {
    border: none;
    border-left: 5px solid var(--brand);
    margin: 28px 0;
    padding: 0 0 0 24px;
    font-style: normal;
    font-weight: 500;
    font-size: 30px;
    line-height: 1.35;
  }
  ul, ol { margin: 0; padding-left: 28px; }
  li { margin-bottom: 12px; }
  li::marker { color: var(--brand); }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 24px;
    margin-top: 20px;
  }
  th, td {
    text-align: left;
    padding: 16px 18px;
    border-bottom: 1px solid var(--line);
  }
  th {
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 17px;
    border-bottom: 2px solid var(--ink);
  }
  section::after {
    content: attr(data-marpit-pagination) ' / ' attr(data-marpit-pagination-total);
    color: var(--muted);
    font-size: 14px;
    letter-spacing: 0.06em;
    bottom: 32px;
    right: 100px;
  }
  header {
    color: var(--brand);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    top: 40px;
    left: 100px;
  }
  section.cover {
    background: linear-gradient(135deg, #0f1611 0%, #1a2e21 100%);
    color: #f5f7f4;
    padding: 100px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  section.cover h1 {
    font-size: 120px;
    line-height: 0.95;
    color: #f5f7f4;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  section.cover h3 {
    color: #6ee7a3;
    font-size: 32px;
    font-weight: 500;
    margin-top: 28px;
  }
  section.cover p {
    color: #9ab2a4;
    font-size: 18px;
    letter-spacing: 0.04em;
  }
  section.cover::after { display: none; }
  section.metric {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 100px;
  }
  section.metric .big {
    font-size: 220px;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.05em;
    color: var(--brand);
    margin: 0;
  }
  section.metric .label {
    font-size: 36px;
    font-weight: 600;
    color: var(--ink);
    margin: 32px 0 12px 0;
    max-width: 900px;
    line-height: 1.2;
  }
  section.metric .source {
    font-size: 18px;
    color: var(--muted);
    letter-spacing: 0.05em;
    margin-top: 24px;
  }
  section.product {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }
  section.product .text h2 { font-size: 40px; margin-bottom: 16px; }
  section.product .shot {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 24px 60px -20px rgba(15,22,17,0.18);
    aspect-ratio: 9 / 16;
    max-height: 580px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  section.product .shot img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  section.product .shot .placeholder {
    color: var(--muted);
    font-size: 18px;
    text-align: center;
    padding: 40px;
    line-height: 1.4;
  }
  section.close {
    background: #0f1611;
    color: #f5f7f4;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 100px;
  }
  section.close h1 {
    color: #f5f7f4;
    font-size: 80px;
    font-weight: 800;
    line-height: 1.05;
  }
  section.close p { font-size: 28px; color: #9ab2a4; }
  section.close strong { color: #6ee7a3; }
  section.close::after { display: none; }
---

<!-- _class: cover -->
<!-- _paginate: false -->

<div>
<p>FOODLOOP · PITCH SPRINT 4 · 1º/2026</p>
</div>

<div>

# FoodLoop.

### Comer melhor por menos. Desperdiçar nada.

</div>

<div>
<p>foodloop-front.onrender.com</p>
</div>

---

<!-- _header: O PROBLEMA -->

# Um terço da comida do mundo vai pro lixo.

Boa parte dela ainda estava **pronta pra ser vendida.**

---

<!-- _class: metric -->

<p class="big">1,3 bi</p>
<p class="label">de toneladas de alimento desperdiçadas por ano no mundo</p>
<p class="source">FAO · State of Food and Agriculture, 2024</p>

---

<!-- _class: metric -->

<p class="big">R$ 41 bi</p>
<p class="label">é o tamanho do desperdício do varejo alimentício no Brasil — 30% disso é comida ainda <em>própria para consumo</em></p>
<p class="source">EMBRAPA · ABRAS, 2025</p>

---

<!-- _header: QUEM SENTE -->

## Três lados perdendo ao mesmo tempo

| Quem                                   | Dor                                                   |
| -------------------------------------- | ----------------------------------------------------- |
| **Padaria · lanchonete · restaurante** | Fim do expediente vira lixo. Margem evapora.          |
| **Cliente do bairro**                  | Quer comida boa por preço justo. Não encontra oferta. |
| **Cidade**                             | Orgânico no aterro vira metano — 28× pior que CO₂.    |

> O excedente existe. A demanda existe. **Falta o canal.**

---

<!-- _header: NOSSA HIPÓTESE -->

# Marketplace hiperlocal de excedente do dia.

Comerciante publica o que vai sobrar **hoje**. Cliente vê, reserva, e retira com um código de 8 caracteres. Sem entrega, sem cadeia complexa.

**Piloto:** Couto Lanches · Centro de Betim/MG.

---

<!-- _header: O PRODUTO -->

# A jornada em 4 telas

Próximas slides: app real, deployado em produção, dados reais de Betim.

---

<!-- _class: product -->
<!-- _header: 1 · BUSCAR -->

<div class="text">

## Lista ordenada por distância

- Geolocalização do browser
- Raio ajustável: **1 / 3 / 5 / 10 km**
- Filtro por preço e categoria
- Preço **promocional** ao lado do regular
- p95 de **21 ms** com 1.000 anúncios

</div>

<div class="shot">

![](screenshots/home.png)

</div>

---

<!-- _class: product -->
<!-- _header: 2 · DECIDIR -->

<div class="text">

## Detalhe com contagem regressiva

- Preço cheio riscado vs. promocional
- Contagem **ao vivo** até o prazo
- Endereço completo do estabelecimento
- Botão único: **Reservar agora**

</div>

<div class="shot">

![](screenshots/detalhe.png)

</div>

---

<!-- _class: product -->
<!-- _header: 3 · RESERVAR -->

<div class="text">

## Checkout em um toque

- Reserva em **transação atômica**
- Estoque decrementa, pagamento PIX criado como PENDENTE
- Pedido nasce `RECEBIDO`
- Cliente recebe **código de retirada** de 8 caracteres
- Alfabeto sem ambiguidade (sem I, O, 1, 0)

</div>

<div class="shot">

![](screenshots/checkout.png)

</div>

---

<!-- _class: product -->
<!-- _header: 4 · RETIRAR -->

<div class="text">

## Validação física do código

- Código aparece em letras grandes no celular
- Comerciante confere visualmente
- Status: **RECEBIDO → PRONTO → RETIRADO**
- Sobra do dia: **zero**

</div>

<div class="shot">

![](screenshots/confirmacao.png)

</div>

---

<!-- _header: ARQUITETURA -->

## Web-first, produção real desde o dia 1

- **Front** — React + Tailwind, CDN global, sem cold start
- **API** — Express + Prisma 7 na Render
- **Banco** — PostgreSQL no Neon, sa-east-1, com Haversine inline em SQL
- **CI/CD** verde · deploy automático em `main` · branch protection com 1 approval

---

<!-- _header: MERCADO -->

## O tamanho da oportunidade

| Camada                                     | Tamanho/ano    |
| ------------------------------------------ | -------------- |
| **TAM** — varejo alimentício no Brasil     | R$ 1,1 trilhão |
| **SAM** — pequeno e médio varejo perecível | R$ 180 bilhões |
| **SOM** — Betim + região metropolitana BH  | R$ 600 milhões |

**Modelo:** comissão por transação · MVP = 0% · onboarding manual no piloto

---

<!-- _header: TIMING -->

## Por que agora

- **Hábito instalado** — apps de entrega educaram o consumidor
- **Inflação alimentar** sustenta busca por preço promocional
- **Marco regulatório** — Lei 14.016/2020 incentiva venda e doação de excedente
- **Geolocalização no browser** é commodity — sem app store, sem instalar

---

<!-- _class: close -->
<!-- _paginate: false -->

# Reduzir desperdício é vender o que ia pro lixo.

<p style="margin-top: 60px"><strong>foodloop-front.onrender.com</strong></p>

<p style="margin-top: 20px">Comer melhor por menos. Desperdiçar nada.</p>
