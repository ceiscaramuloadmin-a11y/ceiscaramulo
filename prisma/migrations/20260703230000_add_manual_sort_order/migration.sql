ALTER TABLE "news" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "activities" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "news_sortOrder_idx" ON "news"("sortOrder");
CREATE INDEX "activities_sortOrder_idx" ON "activities"("sortOrder");
