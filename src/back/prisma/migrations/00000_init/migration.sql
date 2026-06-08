
-- ATENÇÃO: este arquivo foi gerado por `prisma migrate diff` e em seguida
-- editado à mão para corrigir a coluna `subtotal` de `item_pedido`
-- (Prisma 7 não modela colunas GENERATED ALWAYS AS, então gerou
--  `DEFAULT (...)`, que o Postgres rejeita). Se for regerar este arquivo,
-- reaplique a mão o `GENERATED ALWAYS AS ((quantidade)::numeric *
-- preco_unitario) STORED` para a coluna `subtotal`.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "forma_pagamento" AS ENUM ('CARTAO_CREDITO', 'PIX');

-- CreateEnum
CREATE TYPE "origem_cancelamento" AS ENUM ('CLIENTE', 'COMERCIANTE', 'SISTEMA');

-- CreateEnum
CREATE TYPE "status_anuncio" AS ENUM ('ATIVO', 'ENCERRADO_COM_RESERVA', 'ENCERRADO_COM_SOBRA');

-- CreateEnum
CREATE TYPE "status_pagamento" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "status_pedido" AS ENUM ('RECEBIDO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA', 'RETIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "tipo_usuario" AS ENUM ('cliente', 'comerciante');

-- CreateTable
CREATE TABLE "anuncio" (
    "id" BIGSERIAL NOT NULL,
    "id_produto" BIGINT NOT NULL,
    "id_estabelecimento" BIGINT NOT NULL,
    "preco_promocional" DECIMAL(10,2) NOT NULL,
    "quantidade_inicial" INTEGER NOT NULL,
    "quantidade_disponivel" INTEGER NOT NULL,
    "quantidade_sobra" INTEGER NOT NULL DEFAULT 0,
    "prazo_retirada" TIMESTAMP(6) NOT NULL,
    "data_publicacao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "status_anuncio" NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "anuncio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id" BIGSERIAL NOT NULL,
    "id_pedido" BIGINT NOT NULL,
    "id_estabelecimento" BIGINT NOT NULL,
    "nota" SMALLINT NOT NULL,
    "comentario" VARCHAR(500),
    "data_avaliacao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id_usuario" BIGINT NOT NULL,
    "latitude_atual" DECIMAL(10,7),
    "longitude_atual" DECIMAL(10,7),

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "comerciante" (
    "id_usuario" BIGINT NOT NULL,
    "cnpj" CHAR(18) NOT NULL,

    CONSTRAINT "comerciante_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "device_token" (
    "id" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "plataforma" VARCHAR(10) NOT NULL,
    "data_registro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endereco" (
    "id" BIGSERIAL NOT NULL,
    "rua" VARCHAR(120) NOT NULL,
    "numero" VARCHAR(10) NOT NULL,
    "bairro" VARCHAR(60) NOT NULL,
    "cidade" VARCHAR(60) NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" CHAR(9) NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,

    CONSTRAINT "endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estabelecimento" (
    "id" BIGSERIAL NOT NULL,
    "id_comerciante" BIGINT NOT NULL,
    "id_endereco" BIGINT NOT NULL,
    "nome_fantasia" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "horario_funcionamento" VARCHAR(120),
    "nota_media" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "logo_url" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "estabelecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_pedido" (
    "id" BIGSERIAL NOT NULL,
    "id_pedido" BIGINT NOT NULL,
    "id_anuncio" BIGINT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL GENERATED ALWAYS AS ((quantidade)::numeric * preco_unitario) STORED,

    CONSTRAINT "item_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "titulo" VARCHAR(120) NOT NULL,
    "corpo" TEXT NOT NULL,
    "deep_link" VARCHAR(255),
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data_envio" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" BIGSERIAL NOT NULL,
    "id_pedido" BIGINT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "forma_pagamento" "forma_pagamento" NOT NULL,
    "data_pagamento" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_transacao" VARCHAR(60),
    "status_pagamento" "status_pagamento" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id" BIGSERIAL NOT NULL,
    "id_cliente" BIGINT NOT NULL,
    "id_estabelecimento" BIGINT NOT NULL,
    "data_pedido" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "taxa_comissao" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "valor_comissao" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "codigo_retirada" VARCHAR(20) NOT NULL,
    "status" "status_pedido" NOT NULL DEFAULT 'RECEBIDO',
    "cancelado_por" "origem_cancelamento",
    "motivo_cancelamento" TEXT,
    "data_cancelamento" TIMESTAMP(6),

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferencia_notificacao" (
    "id" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "novos_anuncios_proximos" BOOLEAN NOT NULL DEFAULT true,
    "status_pedido" BOOLEAN NOT NULL DEFAULT true,
    "promocoes" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preferencia_notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto" (
    "id" BIGSERIAL NOT NULL,
    "id_estabelecimento" BIGINT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "preco_regular" DECIMAL(10,2) NOT NULL,
    "categoria" VARCHAR(60),
    "imagem" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" BIGSERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20),
    "tipo" "tipo_usuario" NOT NULL,
    "foto_url" VARCHAR(255),
    "data_cadastro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_anuncio_estabelecimento" ON "anuncio"("id_estabelecimento");

-- CreateIndex
CREATE INDEX "idx_anuncio_status" ON "anuncio"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_avaliacao_pedido" ON "avaliacao"("id_pedido");

-- CreateIndex
CREATE INDEX "idx_avaliacao_estabelecimento" ON "avaliacao"("id_estabelecimento");

-- CreateIndex
CREATE UNIQUE INDEX "uq_comerciante_cnpj" ON "comerciante"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "uq_device_token" ON "device_token"("token");

-- CreateIndex
CREATE INDEX "idx_device_token_usuario" ON "device_token"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "uq_estab_comerciante" ON "estabelecimento"("id_comerciante");

-- CreateIndex
CREATE UNIQUE INDEX "uq_estab_endereco" ON "estabelecimento"("id_endereco");

-- CreateIndex
CREATE INDEX "idx_estab_comerciante" ON "estabelecimento"("id_comerciante");

-- CreateIndex
CREATE INDEX "idx_item_pedido" ON "item_pedido"("id_pedido");

-- CreateIndex
CREATE INDEX "idx_notificacao_lida" ON "notificacao"("id_usuario", "lida");

-- CreateIndex
CREATE INDEX "idx_notificacao_usuario" ON "notificacao"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pagamento_pedido" ON "pagamento"("id_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pedido_codigo_retirada" ON "pedido"("codigo_retirada");

-- CreateIndex
CREATE INDEX "idx_pedido_cliente" ON "pedido"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_pedido_estabelecimento" ON "pedido"("id_estabelecimento");

-- CreateIndex
CREATE INDEX "idx_pedido_status" ON "pedido"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pref_usuario" ON "preferencia_notificacao"("id_usuario");

-- CreateIndex
CREATE INDEX "idx_produto_estabelecimento" ON "produto"("id_estabelecimento");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuario_email" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "idx_usuario_email" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "idx_usuario_tipo" ON "usuario"("tipo");

-- AddForeignKey
ALTER TABLE "anuncio" ADD CONSTRAINT "fk_anuncio_estabelecimento" FOREIGN KEY ("id_estabelecimento") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anuncio" ADD CONSTRAINT "fk_anuncio_produto" FOREIGN KEY ("id_produto") REFERENCES "produto"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "fk_avaliacao_estabelecimento" FOREIGN KEY ("id_estabelecimento") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "fk_avaliacao_pedido" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "fk_cliente_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comerciante" ADD CONSTRAINT "fk_comerciante_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "device_token" ADD CONSTRAINT "fk_device_token_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estabelecimento" ADD CONSTRAINT "fk_estab_comerciante" FOREIGN KEY ("id_comerciante") REFERENCES "comerciante"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "estabelecimento" ADD CONSTRAINT "fk_estab_endereco" FOREIGN KEY ("id_endereco") REFERENCES "endereco"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "fk_item_anuncio" FOREIGN KEY ("id_anuncio") REFERENCES "anuncio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item_pedido" ADD CONSTRAINT "fk_item_pedido" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "fk_notificacao_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "fk_pagamento_pedido" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "fk_pedido_cliente" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "fk_pedido_estabelecimento" FOREIGN KEY ("id_estabelecimento") REFERENCES "estabelecimento"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preferencia_notificacao" ADD CONSTRAINT "fk_pref_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "produto" ADD CONSTRAINT "fk_produto_estabelecimento" FOREIGN KEY ("id_estabelecimento") REFERENCES "estabelecimento"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

