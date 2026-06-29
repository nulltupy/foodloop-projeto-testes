ALTER TABLE "pedido"
    ADD COLUMN "data_retirada" TIMESTAMP(6);

UPDATE "pedido"
SET "data_retirada" = "data_pedido"
WHERE "status" = 'RETIRADO'
  AND "data_retirada" IS NULL;
