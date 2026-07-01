-- Consultor responsável pelo chamado ("assumir o chamado"): aponta quem está
-- atendendo mesmo antes de qualquer resposta. Nullable; SetNull se o consultor sair.
ALTER TABLE "tickets" ADD COLUMN "assignee_id" TEXT;
ALTER TABLE "tickets" ADD COLUMN "assigned_at" TIMESTAMP(3);

CREATE INDEX "tickets_assignee_id_idx" ON "tickets"("assignee_id");

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_fkey"
  FOREIGN KEY ("assignee_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
