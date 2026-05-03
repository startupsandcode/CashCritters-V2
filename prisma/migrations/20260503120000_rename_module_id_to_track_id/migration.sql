-- DropIndex
DROP INDEX "LearningProgress_userId_moduleId_lessonId_key";

-- AlterTable
ALTER TABLE "LearningProgress" RENAME COLUMN "moduleId" TO "trackId";

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_trackId_lessonId_key" ON "LearningProgress"("userId", "trackId", "lessonId");
