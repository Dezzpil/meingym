-- DropForeignKey
ALTER TABLE "MuscleGroupLink" DROP CONSTRAINT "MuscleGroupLink_linkedGroupId_fkey";

-- DropForeignKey
ALTER TABLE "MuscleGroupLink" DROP CONSTRAINT "MuscleGroupLink_muscleGroupId_fkey";

-- DropForeignKey
ALTER TABLE "SimilarMuscles" DROP CONSTRAINT "SimilarMuscles_muscleId_fkey";

-- DropForeignKey
ALTER TABLE "SimilarMuscles" DROP CONSTRAINT "SimilarMuscles_similarMuscleId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingDifficultyHistory" DROP CONSTRAINT "TrainingDifficultyHistory_trainingId_fkey";

-- AlterTable
ALTER TABLE "Muscle" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Training" DROP COLUMN "calculatedDifficulty",
DROP COLUMN "difficultyVersion";

-- DropTable
DROP TABLE "MuscleGroupLink";

-- DropTable
DROP TABLE "SimilarMuscles";

-- DropTable
DROP TABLE "TrainingDifficultyHistory";

-- DropEnum
DROP TYPE "MuscleRole";
