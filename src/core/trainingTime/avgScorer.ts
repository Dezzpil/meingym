import { TrainingTimeScorer } from "@/core/trainingTime/scorer";
import { prisma } from "@/tools/db";
import { Purpose } from "@prisma/client";

const PurposesToMinsMap = {
  [Purpose.STRENGTH]: 5,
  [Purpose.MASS]: 3.5,
  [Purpose.LOSS]: 2,
};

export class TrainingTimeAvgScorer extends TrainingTimeScorer {
  async score(trainingId: number): Promise<number[]> {
    const scores = [];
    let timeScoreInMins = 0;
    let timeScoreInSecs = 0;

    const exercises = await prisma.trainingExercise.findMany({
      where: { trainingId },
    });
    for (const exercise of exercises) {
      const approachesGroup = await prisma.approachesGroup.findUnique({
        where: { id: exercise.approachGroupId },
        include: {
          Approaches: true,
        },
      });
      let score =
        (PurposesToMinsMap[exercise.purpose] || 0) *
          approachesGroup!.Approaches.length || 0;
      timeScoreInSecs += score * 60;
      timeScoreInMins += score;
      scores.push(score);
    }

    await prisma.training.update({
      where: { id: trainingId },
      data: {
        timeScoreInMins,
        timeScoreInSecs: timeScoreInSecs + "",
        timeScoredAt: new Date(),
      },
    });

    return scores;
  }
}
