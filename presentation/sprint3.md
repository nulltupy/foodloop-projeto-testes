---
marp: true
theme: default
size: 16:9
paginate: false
style: |
  section {
    background: #f7faf7;
    color: #1f3a2f;
    font-family: Helvetica, Arial, sans-serif;
    padding: 70px 90px;
    justify-content: center;
  }

  section.dark {
    background: linear-gradient(135deg, #1f3a2f 0%, #2d5a3f 100%);
    color: #ffffff;
  }
  section.dark h1, section.dark h2, section.dark p, section.dark strong { color: #ffffff; }
  section.dark .accent { color: #a8e6b8; }

  section.cover {
    background: linear-gradient(135deg, #1f3a2f 0%, #4a8b5f 100%);
    color: #ffffff;
    text-align: center;
  }
  section.cover h1 {
    font-size: 5.5em;
    font-weight: 900;
    margin: 0;
    line-height: 1;
    color: #ffffff;
  }
  section.cover h2 {
    font-size: 1.4em;
    font-weight: 400;
    margin-top: 0.4em;
    color: #ffffff;
    opacity: 0.95;
  }
  section.cover p {
    font-size: 0.9em;
    margin-top: 2.5em;
    color: #ffffff;
    opacity: 0.85;
  }

  h1 {
    font-size: 2.6em;
    font-weight: 900;
    line-height: 1.1;
    margin: 0 0 0.4em 0;
    color: #1f3a2f;
  }
  h2 {
    font-size: 1.4em;
    font-weight: 700;
    color: #2d5a3f;
    margin: 0 0 0.3em 0;
  }
  p { font-size: 1.2em; line-height: 1.5; }

  .huge { font-size: 5.5em; font-weight: 900; color: #2d5a3f; line-height: 1; margin: 0; }
  .accent { color: #4a8b5f; }
  .label {
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: #4a8b5f;
    font-weight: 700;
    margin-bottom: 0.8em;
  }

  table { font-size: 0.95em; border-collapse: collapse; width: 100%; }
  th { background: #2d5a3f; color: white; padding: 10px; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #d4e6dc; }

  code { background: #e8f3ec; color: #1f3a2f; padding: 2px 8px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #1f3a2f; color: #e8f3ec; padding: 18px; border-radius: 8px; font-size: 0.7em; }
  pre code, pre code * { color: #e8f3ec !important; background: transparent !important; }
  pre code .hljs-keyword, pre code .hljs-built_in { color: #ffd680 !important; }
  pre code .hljs-string { color: #a8e6b8 !important; }
  pre code .hljs-number { color: #ffb380 !important; }
  pre code .hljs-comment { color: #7fa389 !important; }

  h1 strong { color: #4a8b5f; }
  section.dark h1 strong { color: #a8e6b8; }
  section.cover h1 strong { color: #ffffff; }

  section.team h1 { font-size: 1.7em; }
  section.team table { width: auto; font-size: 0.85em; }
  section.team table td { border: 0; padding: 5px 12px 5px 0; }
---

<!-- _class: cover -->

# FoodLoop

## Tecnologia contra o desperdício de alimentos

Sprint 3 · Projeto da Solução

---

<!-- _class: dark -->

<p class="label">O problema</p>

# <span class="accent">41 kg</span> de comida<br>jogados fora<br>por brasileiro / ano

<p style="font-size: 0.85em; opacity: 0.7;">Fonte: ONU Brasil · Índice de Desperdício de Alimentos 2024</p>

---

<p class="label">A solução</p>

# Conectamos<br><span class="accent">comércios com excedente</span><br>a quem busca preço justo

Aplicativo mobile que transforma desperdício em economia circular.

---

<p class="label">Como funciona</p>

# Em 3 passos.

|       |       |       |
|-------|-------|-------|
| <span class="huge">1</span> | <span class="huge">2</span> | <span class="huge">3</span> |
| **Anuncia** | **Reserva** | **Retira** |
| Comércio publica excedente com desconto | Cliente encontra no mapa, paga via Pix ou cartão | Apresenta o QR no balcão e avalia depois |

---

![bg right:50%](../docs/images/tela_principal.jpeg)

<p class="label">Produto</p>

# 12 telas,<br>7 fluxos.

Login, mapa, busca, carrinho, pagamento, painel do parceiro, dashboard de impacto.

---

![bg right:55% w:680](../docs/images/foodloop_fluxo.png)

<p class="label">User flow</p>

# Caminho<br>completo.

Da descoberta ao pós-venda — com decisões, validações e fluxos de exceção.

---

![bg right:50%](../docs/images/Wireframe_FoodLoop.jpeg)

<p class="label">Wireframes & Protótipo</p>

# Da estrutura<br>ao **Figma**.

Wireframes em baixa fidelidade validaram a navegação antes do design final.

---

![bg right:55% w:680](../docs/images/JornadadoUsuario.jpg)

<p class="label">Jornada do usuário</p>

# Modelo<br>**AIDA**.

Conscientização → Interesse → Desejo → Ação → Pós-uso.

Mapeia ações, canais e emoções em cada etapa.

---

![bg fit](../docs/images/DiagramaClasses.png)

---

<p class="label">Banco de dados</p>

# Do conceitual ao **PostgreSQL**.

|  |  |  |
|---|---|---|
| <span class="huge">14</span> | <span class="huge">13</span> | <span class="huge">2</span> |
| **Entidades** no DER (Peter Chen) | **Tabelas** no relacional (Pé de Galinha) | **Triggers** no DDL PostgreSQL 16 |

---

![bg fit](../docs/images/ModeloRelacional.png)

---

<!-- _class: dark -->

<p class="label">Modelo físico</p>

# DDL versionado em <span class="accent">`src/db/`</span>

```sql
CREATE TABLE pedido (
    id              BIGSERIAL          PRIMARY KEY,
    id_cliente      BIGINT             NOT NULL,
    valor_total     NUMERIC(10,2)      NOT NULL,
    valor_comissao  NUMERIC(10,2)      NOT NULL DEFAULT 0.00,
    codigo_retirada VARCHAR(20)        NOT NULL UNIQUE,
    status          status_pedido      NOT NULL DEFAULT 'RECEBIDO',
    cancelado_por   origem_cancelamento,
    CONSTRAINT ck_pedido_cancelamento CHECK (
        (status = 'CANCELADO' AND cancelado_por IS NOT NULL)
        OR status != 'CANCELADO'
    )
);
```

Restrições no banco. Não confiamos só na aplicação.

---

<p class="label">Qualidade — ISO/IEC 25010</p>

# Metas mensuráveis.

| Característica | Métrica | Meta |
|---|---|---|
| Eficiência | Carregamento do mapa | **≤ 3 s** |
| Eficiência | Tempo de resposta REST | **≤ 500 ms** |
| Usabilidade | Pontuação SUS | **≥ 70** |
| Confiabilidade | Uptime 18h–22h | **≥ 99%** |
| Segurança | Transações criptografadas | **100%** |
| Compatibilidade | Telas Android e iOS | **100%** |

---

<!-- _class: team -->

![bg right:45%](../docs/images/sprint3.png)

<p class="label">Time</p>

# Scrum + GitHub Projects.

| | |
|---|---|
| **Cristiano** | BPMN |
| **Diogo** | Arquitetura, classes |
| **Gabriel A.** | User flow, infra |
| **Gabriel X.** | Jornada AIDA |
| **Guilherme** | Banco de dados |
| **Rafael** | Wireframes, slides |

---

<!-- _class: cover -->

# Obrigado.

## Perguntas?

github.com/ICEI-PUC-Minas-PBE-SI-TI/2026-1-p5-tias-foodloop
