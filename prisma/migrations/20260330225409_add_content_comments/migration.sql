-- CreateEnum
CREATE TYPE "ContentCommentSection" AS ENUM ('news', 'activities', 'projects', 'publications');

-- CreateTable
CREATE TABLE "content_comments" (
    "id" TEXT NOT NULL,
    "contentType" "ContentCommentSection" NOT NULL,
    "contentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_comments_contentType_contentId_createdAt_idx" ON "content_comments"("contentType", "contentId", "createdAt");
