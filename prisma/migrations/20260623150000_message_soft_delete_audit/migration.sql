-- Exclusão suave + edição com trilha de auditoria nas mensagens de chamado.

ALTER TABLE "ticket_messages"
  ADD COLUMN "edited_at" TIMESTAMP(3),
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "deleted_by_id" TEXT,
  ADD COLUMN "deleted_by_name" TEXT,
  ADD COLUMN "deleted_by_role" TEXT,
  ADD COLUMN "delete_reason" TEXT;

CREATE TABLE "ticket_message_revisions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_text" TEXT NOT NULL,
    "new_text" TEXT,
    "reason" TEXT,
    "editor_id" TEXT NOT NULL,
    "editor_name" TEXT NOT NULL,
    "editor_role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_message_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ticket_message_revisions_ticket_id_idx" ON "ticket_message_revisions"("ticket_id");
CREATE INDEX "ticket_message_revisions_message_id_idx" ON "ticket_message_revisions"("message_id");

ALTER TABLE "ticket_message_revisions" ADD CONSTRAINT "ticket_message_revisions_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "ticket_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
