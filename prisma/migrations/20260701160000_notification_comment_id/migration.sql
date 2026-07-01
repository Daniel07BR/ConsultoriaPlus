-- Notificação de comentário/pergunta aponta o comentário específico, para o
-- clique abrir a publicação já posicionada nele. Nullable (registros antigos ficam sem).
ALTER TABLE "notifications" ADD COLUMN "comment_id" TEXT;
