-- =====================================================================
-- FoodLoop - Schema do Banco de Dados (PostgreSQL 16)
-- =====================================================================
-- Modelo físico do FoodLoop. Cobre as entidades de usuários, comércios,
-- ofertas, pedidos, pagamentos, avaliações e infraestrutura de
-- notificações push (DeviceToken, Notificacao, PreferenciaNotificacao).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tipos enumerados
-- ---------------------------------------------------------------------

CREATE TYPE tipo_usuario AS ENUM ('cliente', 'comerciante');

CREATE TYPE status_anuncio AS ENUM (
    'ATIVO',
    'ENCERRADO_COM_RESERVA',
    'ENCERRADO_COM_SOBRA'
);

CREATE TYPE status_pedido AS ENUM (
    'RECEBIDO',
    'EM_PREPARO',
    'PRONTO_PARA_RETIRADA',
    'RETIRADO',
    'CANCELADO'
);

CREATE TYPE forma_pagamento AS ENUM (
    'CARTAO_CREDITO',
    'PIX'
);

CREATE TYPE status_pagamento AS ENUM (
    'PENDENTE',
    'APROVADO',
    'RECUSADO'
);

CREATE TYPE origem_cancelamento AS ENUM (
    'CLIENTE',
    'COMERCIANTE',
    'SISTEMA'
);


-- ---------------------------------------------------------------------
-- 2. Tabela usuario  (entidade abstrata da herança)
-- ---------------------------------------------------------------------

CREATE TABLE usuario (
    id            BIGSERIAL       PRIMARY KEY,
    nome          VARCHAR(120)    NOT NULL,
    email         VARCHAR(120)    NOT NULL,
    senha_hash    VARCHAR(255)    NOT NULL,
    telefone      VARCHAR(20),
    tipo          tipo_usuario    NOT NULL,
    foto_url      VARCHAR(255),
    data_cadastro TIMESTAMP       NOT NULL DEFAULT NOW(),
    ativo         BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_usuario_email UNIQUE (email)
);

CREATE INDEX idx_usuario_email ON usuario (email);
CREATE INDEX idx_usuario_tipo  ON usuario (tipo);


-- ---------------------------------------------------------------------
-- 3. Tabela cliente  (subtipo de usuario)
-- ---------------------------------------------------------------------

CREATE TABLE cliente (
    id_usuario      BIGINT          PRIMARY KEY,
    latitude_atual  NUMERIC(10,7),
    longitude_atual NUMERIC(10,7),
    CONSTRAINT fk_cliente_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------
-- 4. Tabela comerciante  (subtipo de usuario)
-- ---------------------------------------------------------------------

CREATE TABLE comerciante (
    id_usuario  BIGINT      PRIMARY KEY,
    cnpj        CHAR(18)    NOT NULL,
    CONSTRAINT uq_comerciante_cnpj UNIQUE (cnpj),
    CONSTRAINT fk_comerciante_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------
-- 5. Tabela endereco
-- ---------------------------------------------------------------------

CREATE TABLE endereco (
    id         BIGSERIAL       PRIMARY KEY,
    rua        VARCHAR(120)    NOT NULL,
    numero     VARCHAR(10)     NOT NULL,
    bairro     VARCHAR(60)     NOT NULL,
    cidade     VARCHAR(60)     NOT NULL,
    estado     CHAR(2)         NOT NULL,
    cep        CHAR(9)         NOT NULL,
    latitude   NUMERIC(10,7)   NOT NULL,
    longitude  NUMERIC(10,7)   NOT NULL
);


-- ---------------------------------------------------------------------
-- 6. Tabela estabelecimento
-- ---------------------------------------------------------------------

CREATE TABLE estabelecimento (
    id                    BIGSERIAL       PRIMARY KEY,
    id_comerciante        BIGINT          NOT NULL,
    id_endereco           BIGINT          NOT NULL,
    nome_fantasia         VARCHAR(120)    NOT NULL,
    descricao             TEXT,
    horario_funcionamento VARCHAR(120),
    nota_media            NUMERIC(3,2)    NOT NULL DEFAULT 0.00,
    logo_url              VARCHAR(255),
    ativo                 BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_estab_comerciante UNIQUE (id_comerciante),
    CONSTRAINT uq_estab_endereco    UNIQUE (id_endereco),
    CONSTRAINT fk_estab_comerciante
        FOREIGN KEY (id_comerciante) REFERENCES comerciante (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_estab_endereco
        FOREIGN KEY (id_endereco) REFERENCES endereco (id) ON DELETE RESTRICT,
    CONSTRAINT ck_estab_nota CHECK (nota_media >= 0.00 AND nota_media <= 5.00)
);

CREATE INDEX idx_estab_comerciante ON estabelecimento (id_comerciante);


-- ---------------------------------------------------------------------
-- 7. Tabela produto
-- ---------------------------------------------------------------------

CREATE TABLE produto (
    id                   BIGSERIAL       PRIMARY KEY,
    id_estabelecimento   BIGINT          NOT NULL,
    nome                 VARCHAR(120)    NOT NULL,
    descricao            TEXT,
    preco_regular        NUMERIC(10,2)   NOT NULL,
    categoria            VARCHAR(60),
    imagem               VARCHAR(255),
    ativo                BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_produto_estabelecimento
        FOREIGN KEY (id_estabelecimento) REFERENCES estabelecimento (id) ON DELETE CASCADE,
    CONSTRAINT ck_produto_preco CHECK (preco_regular > 0)
);

CREATE INDEX idx_produto_estabelecimento ON produto (id_estabelecimento);


-- ---------------------------------------------------------------------
-- 8. Tabela anuncio
-- ---------------------------------------------------------------------

CREATE TABLE anuncio (
    id                    BIGSERIAL         PRIMARY KEY,
    id_produto            BIGINT            NOT NULL,
    id_estabelecimento    BIGINT            NOT NULL,
    preco_promocional     NUMERIC(10,2)     NOT NULL,
    quantidade_inicial    INTEGER           NOT NULL,
    quantidade_disponivel INTEGER           NOT NULL,
    quantidade_sobra      INTEGER           NOT NULL DEFAULT 0,
    prazo_retirada        TIMESTAMP         NOT NULL,
    data_publicacao       TIMESTAMP         NOT NULL DEFAULT NOW(),
    status                status_anuncio    NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT fk_anuncio_produto
        FOREIGN KEY (id_produto) REFERENCES produto (id) ON DELETE CASCADE,
    CONSTRAINT fk_anuncio_estabelecimento
        FOREIGN KEY (id_estabelecimento) REFERENCES estabelecimento (id) ON DELETE CASCADE,
    CONSTRAINT ck_anuncio_preco CHECK (preco_promocional > 0),
    CONSTRAINT ck_anuncio_quantidade_inicial CHECK (quantidade_inicial > 0),
    CONSTRAINT ck_anuncio_quantidade_disponivel CHECK (quantidade_disponivel >= 0),
    CONSTRAINT ck_anuncio_quantidade_sobra CHECK (quantidade_sobra >= 0),
    CONSTRAINT ck_anuncio_prazo CHECK (prazo_retirada > data_publicacao)
);

CREATE INDEX idx_anuncio_status          ON anuncio (status);
CREATE INDEX idx_anuncio_estabelecimento ON anuncio (id_estabelecimento);


-- ---------------------------------------------------------------------
-- 9. Tabela pedido
-- ---------------------------------------------------------------------

CREATE TABLE pedido (
    id                    BIGSERIAL              PRIMARY KEY,
    id_cliente            BIGINT                 NOT NULL,
    id_estabelecimento    BIGINT                 NOT NULL,
    data_pedido           TIMESTAMP              NOT NULL DEFAULT NOW(),
    valor_total           NUMERIC(10,2)          NOT NULL,
    taxa_comissao         NUMERIC(5,2)           NOT NULL DEFAULT 0.00,
    valor_comissao        NUMERIC(10,2)          NOT NULL DEFAULT 0.00,
    codigo_retirada       VARCHAR(20)            NOT NULL,
    status                status_pedido          NOT NULL DEFAULT 'RECEBIDO',
    cancelado_por         origem_cancelamento,
    motivo_cancelamento   TEXT,
    data_cancelamento     TIMESTAMP,
    CONSTRAINT uq_pedido_codigo_retirada UNIQUE (codigo_retirada),
    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (id_cliente) REFERENCES cliente (id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_estabelecimento
        FOREIGN KEY (id_estabelecimento) REFERENCES estabelecimento (id) ON DELETE RESTRICT,
    CONSTRAINT ck_pedido_valor CHECK (valor_total > 0),
    CONSTRAINT ck_pedido_taxa_comissao CHECK (taxa_comissao >= 0 AND taxa_comissao <= 100),
    CONSTRAINT ck_pedido_valor_comissao CHECK (valor_comissao >= 0),
    -- cancelado_por e data_cancelamento só fazem sentido quando status = CANCELADO
    CONSTRAINT ck_pedido_cancelamento CHECK (
        (status = 'CANCELADO' AND cancelado_por IS NOT NULL AND data_cancelamento IS NOT NULL)
        OR status != 'CANCELADO'
    )
);

CREATE INDEX idx_pedido_cliente         ON pedido (id_cliente);
CREATE INDEX idx_pedido_estabelecimento ON pedido (id_estabelecimento);
CREATE INDEX idx_pedido_status          ON pedido (status);


-- ---------------------------------------------------------------------
-- 10. Tabela item_pedido  (composição do pedido)
-- ---------------------------------------------------------------------

CREATE TABLE item_pedido (
    id             BIGSERIAL       PRIMARY KEY,
    id_pedido      BIGINT          NOT NULL,
    id_anuncio     BIGINT          NOT NULL,
    quantidade     INTEGER         NOT NULL,
    preco_unitario NUMERIC(10,2)   NOT NULL,
    subtotal       NUMERIC(10,2)   NOT NULL GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    CONSTRAINT fk_item_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedido (id) ON DELETE CASCADE,
    CONSTRAINT fk_item_anuncio
        FOREIGN KEY (id_anuncio) REFERENCES anuncio (id) ON DELETE RESTRICT,
    CONSTRAINT ck_item_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_item_preco CHECK (preco_unitario > 0)
);

CREATE INDEX idx_item_pedido ON item_pedido (id_pedido);


-- ---------------------------------------------------------------------
-- 11. Tabela pagamento
-- ---------------------------------------------------------------------

CREATE TABLE pagamento (
    id                 BIGSERIAL           PRIMARY KEY,
    id_pedido          BIGINT              NOT NULL,
    valor              NUMERIC(10,2)       NOT NULL,
    forma_pagamento    forma_pagamento     NOT NULL,
    data_pagamento     TIMESTAMP           NOT NULL DEFAULT NOW(),
    codigo_transacao   VARCHAR(60),
    status_pagamento   status_pagamento    NOT NULL DEFAULT 'PENDENTE',
    CONSTRAINT uq_pagamento_pedido UNIQUE (id_pedido),
    CONSTRAINT fk_pagamento_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedido (id) ON DELETE CASCADE,
    CONSTRAINT ck_pagamento_valor CHECK (valor > 0)
);


-- ---------------------------------------------------------------------
-- 12. Tabela avaliacao
-- ---------------------------------------------------------------------

CREATE TABLE avaliacao (
    id                   BIGSERIAL   PRIMARY KEY,
    id_pedido            BIGINT      NOT NULL,
    id_estabelecimento   BIGINT      NOT NULL,
    nota                 SMALLINT    NOT NULL,
    comentario           VARCHAR(500),
    data_avaliacao       TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_avaliacao_pedido UNIQUE (id_pedido),
    CONSTRAINT fk_avaliacao_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedido (id) ON DELETE CASCADE,
    CONSTRAINT fk_avaliacao_estabelecimento
        FOREIGN KEY (id_estabelecimento) REFERENCES estabelecimento (id) ON DELETE CASCADE,
    CONSTRAINT ck_avaliacao_nota CHECK (nota BETWEEN 1 AND 5)
);

CREATE INDEX idx_avaliacao_estabelecimento ON avaliacao (id_estabelecimento);


-- ---------------------------------------------------------------------
-- 13. Tabela device_token  (tokens FCM por dispositivo)
-- ---------------------------------------------------------------------

CREATE TABLE device_token (
    id             BIGSERIAL       PRIMARY KEY,
    id_usuario     BIGINT          NOT NULL,
    token          VARCHAR(255)    NOT NULL,
    plataforma     VARCHAR(10)     NOT NULL,
    data_registro  TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_token UNIQUE (token),
    CONSTRAINT fk_device_token_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT ck_device_plataforma CHECK (plataforma IN ('android', 'ios'))
);

CREATE INDEX idx_device_token_usuario ON device_token (id_usuario);


-- ---------------------------------------------------------------------
-- 14. Tabela notificacao  (histórico com suporte a deep link)
-- ---------------------------------------------------------------------

CREATE TABLE notificacao (
    id          BIGSERIAL       PRIMARY KEY,
    id_usuario  BIGINT          NOT NULL,
    titulo      VARCHAR(120)    NOT NULL,
    corpo       TEXT            NOT NULL,
    deep_link   VARCHAR(255),
    lida        BOOLEAN         NOT NULL DEFAULT FALSE,
    data_envio  TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notificacao_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE INDEX idx_notificacao_usuario ON notificacao (id_usuario);
CREATE INDEX idx_notificacao_lida    ON notificacao (id_usuario, lida);


-- ---------------------------------------------------------------------
-- 15. Tabela preferencia_notificacao
-- ---------------------------------------------------------------------

CREATE TABLE preferencia_notificacao (
    id                      BIGSERIAL   PRIMARY KEY,
    id_usuario              BIGINT      NOT NULL,
    novos_anuncios_proximos BOOLEAN     NOT NULL DEFAULT TRUE,
    status_pedido           BOOLEAN     NOT NULL DEFAULT TRUE,
    promocoes               BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_pref_usuario UNIQUE (id_usuario),
    CONSTRAINT fk_pref_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------
-- 16. Trigger - atualização da nota_media do estabelecimento
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_atualizar_nota_media()
RETURNS TRIGGER AS $$
DECLARE
    v_id_estabelecimento BIGINT;
BEGIN
    -- usa OLD em DELETE, NEW em INSERT/UPDATE
    IF TG_OP = 'DELETE' THEN
        v_id_estabelecimento := OLD.id_estabelecimento;
    ELSE
        v_id_estabelecimento := NEW.id_estabelecimento;
    END IF;

    UPDATE estabelecimento
    SET    nota_media = (
        SELECT COALESCE(AVG(nota), 0)
        FROM   avaliacao
        WHERE  id_estabelecimento = v_id_estabelecimento
    )
    WHERE id = v_id_estabelecimento;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nota_media
AFTER INSERT OR UPDATE OR DELETE ON avaliacao
FOR EACH ROW EXECUTE FUNCTION fn_atualizar_nota_media();


-- ---------------------------------------------------------------------
-- 17. Trigger - controle de estoque transacional
-- Devolve o estoque ao anuncio quando um pedido é cancelado.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_controle_estoque()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CANCELADO' AND OLD.status != 'CANCELADO' THEN
        UPDATE anuncio a
        SET    quantidade_disponivel = a.quantidade_disponivel + ip.quantidade
        FROM   item_pedido ip
        WHERE  ip.id_pedido = NEW.id
          AND  ip.id_anuncio = a.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_controle_estoque
AFTER UPDATE ON pedido
FOR EACH ROW EXECUTE FUNCTION fn_controle_estoque();
