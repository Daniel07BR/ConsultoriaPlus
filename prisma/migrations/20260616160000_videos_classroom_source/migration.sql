-- DropForeignKey
ALTER TABLE "videos" DROP CONSTRAINT "videos_author_id_fkey";

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "course_title" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "source_ref" TEXT,
ADD COLUMN     "source_url" TEXT,
ALTER COLUMN "author_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "videos_source_ref_key" ON "videos"("source_ref");

-- CreateIndex
CREATE INDEX "videos_source_idx" ON "videos"("source");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

