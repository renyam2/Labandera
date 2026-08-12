/*
  Warnings:

  - You are about to drop the column `image` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "image";

-- CreateTable
CREATE TABLE "ArticleImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "ArticleImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArticleImage" ADD CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
