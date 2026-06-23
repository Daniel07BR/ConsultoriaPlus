-- Recibos de leitura das mensagens de chamado (estilo WhatsApp).
CREATE TABLE "ticket_message_reads" (
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_message_reads_pkey" PRIMARY KEY ("message_id","user_id")
);

CREATE INDEX "ticket_message_reads_message_id_idx" ON "ticket_message_reads"("message_id");

ALTER TABLE "ticket_message_reads" ADD CONSTRAINT "ticket_message_reads_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "ticket_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_message_reads" ADD CONSTRAINT "ticket_message_reads_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
