import type {
  TrainingDifficultyBoostStrategy,
  TrainingExerciseWithApproaches,
} from "./boostStrategy";
import { prisma } from "@/tools/db";
import {
  calculateStats,
  findInfoForCalculateStatsForApproach,
} from "@/core/stats";
import type { ApproachData } from "@/core/approaches";

export class ExtraApproachesBoostStrategy
  implements TrainingDifficultyBoostStrategy
{
  /**
   * Adds one extra boost approach per exercise (duplicates the last/heaviest approach).
   */
  async apply(exercises: TrainingExerciseWithApproaches[]): Promise<void> {
    for (const exercise of exercises) {
      const approaches = exercise.approachGroup.Approaches;
      if (approaches.length === 0) continue;

      // Already has boost approaches — skip
      if (approaches.some((a) => a.isBoost)) continue;

      // Use the last approach as a template for the boost approach
      const template = approaches[approaches.length - 1];
      const boostPriority = approaches.length; // next priority after existing

      await prisma.approach.create({
        data: {
          groupId: exercise.approachGroupId,
          weight: template.weight,
          count: template.count,
          priority: boostPriority,
          isBoost: true,
        },
      });

      // Recalculate ApproachesGroup stats
      await this.recalculateGroupStats(exercise.approachGroupId);
    }
  }

  /**
   * Removes all boost approaches from exercises.
   */
  async revert(exercises: TrainingExerciseWithApproaches[]): Promise<void> {
    for (const exercise of exercises) {
      const boostApproaches = exercise.approachGroup.Approaches.filter(
        (a) => a.isBoost,
      );
      if (boostApproaches.length === 0) continue;

      await prisma.approach.deleteMany({
        where: {
          groupId: exercise.approachGroupId,
          isBoost: true,
        },
      });

      // Recalculate ApproachesGroup stats
      await this.recalculateGroupStats(exercise.approachGroupId);
    }
  }

  private async recalculateGroupStats(groupId: number): Promise<void> {
    const approaches = await prisma.approach.findMany({
      where: { groupId },
      orderBy: { priority: "asc" },
    });

    const info = await findInfoForCalculateStatsForApproach(groupId);
    const data: ApproachData[] = approaches.map((a) => ({
      count: a.count,
      weight: a.weight,
      priority: a.priority,
      isBoost: a.isBoost,
    }));
    const stats = calculateStats(data, info.actionrig, info.userweight);

    await prisma.approachesGroup.update({
      where: { id: groupId },
      data: {
        count: approaches.length,
        mean: stats.weightMean,
        sum: stats.weightSum,
        max: stats.weightMax,
        countTotal: stats.countSum,
        countMean: stats.countMean,
      },
    });
  }
}
