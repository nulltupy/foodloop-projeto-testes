-- ============================================================
-- Comentários públicos numa avaliação (thread review <-> estabelecimento).
-- O autor (id_usuario) pode ser o cliente que avaliou ou o comerciante dono
-- do estabelecimento avaliado; a autorização é resolvida no service.
-- ============================================================

-- CreateTable
CREATE TABLE "comentario_avaliacao" (
    "id" BIGSERIAL NOT NULL,
    "id_avaliacao" BIGINT NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "comentario" VARCHAR(500) NOT NULL,
    "data_comentario" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentario_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_comentario_avaliacao" ON "comentario_avaliacao"("id_avaliacao");

-- AddForeignKey
ALTER TABLE "comentario_avaliacao" ADD CONSTRAINT "fk_comentario_avaliacao" FOREIGN KEY ("id_avaliacao") REFERENCES "avaliacao"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comentario_avaliacao" ADD CONSTRAINT "fk_comentario_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CHECK: comentário não pode ser vazio (Prisma não modela CHECK).
ALTER TABLE "comentario_avaliacao"
    ADD CONSTRAINT "ck_comentario_nao_vazio"
    CHECK (length(btrim(comentario)) > 0);
