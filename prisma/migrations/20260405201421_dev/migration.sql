-- CreateEnum
CREATE TYPE "GalleryMediaType" AS ENUM ('photo', 'video', 'audio');

-- CreateTable
CREATE TABLE "gallery_media" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GalleryMediaType" NOT NULL,
    "source" TEXT NOT NULL,
    "thumbnail" TEXT,
    "mimeType" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_media_type_published_createdAt_idx" ON "gallery_media"("type", "published", "createdAt");
