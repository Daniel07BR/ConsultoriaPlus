-- Feed discriminator: separa o "Feed de estudos" do novo "Feed de Gestão".
-- Linhas existentes recebem 'estudos' pelo DEFAULT (sem passo de backfill).

ALTER TABLE "studies"    ADD COLUMN "feed" TEXT NOT NULL DEFAULT 'estudos';
ALTER TABLE "categories" ADD COLUMN "feed" TEXT NOT NULL DEFAULT 'estudos';

-- categoria passa a ser única por (feed, name), não mais global por nome
DROP INDEX "categories_name_key";
CREATE UNIQUE INDEX "categories_feed_name_key" ON "categories"("feed", "name");

-- troca os índices de coluna única dos estudos por índices compostos com o feed
DROP INDEX "studies_category_idx";
DROP INDEX "studies_created_at_idx";
CREATE INDEX "studies_feed_category_idx"   ON "studies"("feed", "category");
CREATE INDEX "studies_feed_created_at_idx" ON "studies"("feed", "created_at");
CREATE INDEX "categories_feed_position_idx" ON "categories"("feed", "position");

-- semente: 1 categoria padrão do Feed de Gestão (o resto a liderança cria no app)
INSERT INTO "categories" ("id", "name", "feed", "color", "position", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'Geral', 'gestao', '#ff5c89', 0, now(), now());
