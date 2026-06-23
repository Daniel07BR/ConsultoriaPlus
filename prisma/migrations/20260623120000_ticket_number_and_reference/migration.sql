-- Numeração sequencial humana dos chamados (#) + citação de chamado anterior.

-- 1) Coluna de número (provisoriamente nullable para backfill)
ALTER TABLE "tickets" ADD COLUMN "number" INTEGER;

-- 2) Backfill em ordem de criação (chamados antigos recebem 1,2,3,…)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM "tickets"
)
UPDATE "tickets" t SET "number" = o.rn FROM ordered o WHERE t.id = o.id;

-- 3) Sequência própria, continuando após o maior número já atribuído
CREATE SEQUENCE "tickets_number_seq";
SELECT setval('tickets_number_seq', COALESCE((SELECT MAX("number") FROM "tickets"), 0) + 1, false);
ALTER TABLE "tickets" ALTER COLUMN "number" SET DEFAULT nextval('tickets_number_seq');
ALTER TABLE "tickets" ALTER COLUMN "number" SET NOT NULL;
ALTER SEQUENCE "tickets_number_seq" OWNED BY "tickets"."number";

-- 4) Unicidade do número
CREATE UNIQUE INDEX "tickets_number_key" ON "tickets"("number");

-- 5) Citação de chamado anterior (auto-relação, opcional)
ALTER TABLE "tickets" ADD COLUMN "reference_id" TEXT;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reference_id_fkey"
  FOREIGN KEY ("reference_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "tickets_reference_id_idx" ON "tickets"("reference_id");
