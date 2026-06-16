-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "rating_label" TEXT;

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");
