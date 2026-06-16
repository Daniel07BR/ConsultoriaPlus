-- AlterTable
ALTER TABLE "studies" ADD COLUMN     "nexus_announcement_id" TEXT;

-- CreateTable
CREATE TABLE "study_views" (
    "study_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origin" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "study_views_pkey" PRIMARY KEY ("study_id","user_id")
);

-- CreateIndex
CREATE INDEX "study_views_study_id_idx" ON "study_views"("study_id");

-- AddForeignKey
ALTER TABLE "study_views" ADD CONSTRAINT "study_views_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_views" ADD CONSTRAINT "study_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
