-- DropIndex
DROP INDEX "LearningProgress_userId_moduleId_key";

-- AlterTable
ALTER TABLE "LearningProgress" ADD COLUMN     "lessonId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_moduleId_lessonId_key" ON "LearningProgress"("userId", "moduleId", "lessonId");
