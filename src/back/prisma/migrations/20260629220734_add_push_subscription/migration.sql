-- CreateTable
CREATE TABLE "push_subscription" (
    "id" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "endpoint" VARCHAR(2048) NOT NULL,
    "p256dh" VARCHAR(255) NOT NULL,
    "auth" VARCHAR(255) NOT NULL,
    "user_agent" VARCHAR(255),
    "expiration_time" TIMESTAMP(6),
    "data_registro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_envio_ok" TIMESTAMP(6),

    CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_push_subscription_endpoint" ON "push_subscription"("endpoint");

-- CreateIndex
CREATE INDEX "idx_push_subscription_usuario" ON "push_subscription"("id_usuario");

-- AddForeignKey
ALTER TABLE "push_subscription" ADD CONSTRAINT "fk_push_subscription_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
