-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "thumb_url" TEXT,
ALTER COLUMN "youtube_id" DROP NOT NULL;

