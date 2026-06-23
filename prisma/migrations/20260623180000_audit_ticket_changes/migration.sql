-- Auditoria passa a cobrir também alterações do chamado (título/citação),
-- que não têm mensagem associada: message_id vira opcional.
ALTER TABLE "ticket_message_revisions" ALTER COLUMN "message_id" DROP NOT NULL;
