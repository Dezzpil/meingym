import { TrainingTimeScorer } from "@/core/trainingTime/scorer";
import { estimateExerciseTimeInMins } from "@/core/trainingTime/estimate";
import { prisma } from "@/tools/db";

export class TrainingTimeAvgScorer extends TrainingTimeScorer {
  async score(trainingId: number): Promise<number[]> {
    const scores: number[] = [];
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
      let score = estimateExerciseTimeInMins(
        exercise.purpose,
        approachesGroup!.Approaches.length,
      );
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
