-- CreateTable
CREATE TABLE "video_watches" (
    "video_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_watches_pkey" PRIMARY KEY ("video_id","user_id")
);

-- AddForeignKey
ALTER TABLE "video_watches" ADD CONSTRAINT "video_watches_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_watches" ADD CONSTRAINT "video_watches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

