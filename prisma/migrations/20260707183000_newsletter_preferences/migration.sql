ALTER TABLE "newsletter_subscribers"
ADD COLUMN "wantsNews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "wantsActivities" BOOLEAN NOT NULL DEFAULT true;
