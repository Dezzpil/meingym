import { prisma } from "@/tools/db";
import axios from "axios";

const sql = `SELECT
                 te.id,
                 COUNT(te.*) as exercises,
                 te.priority as exercise_priority,
                 CASE te.purpose
                     WHEN 'MASS' THEN 1
                     WHEN 'LOSS' THEN 2
                     WHEN 'STRENGTH' THEN 3
                     ELSE 0
                     END as exercise_purpose,
                 ag."count" as execution_cnt,
                 ag."countTotal" as execution_plannedCntSum,
--         COUNT(exec.*) as execution_cnt,
--         SUM(exec."plannedCount") as execution_plannedCntSum,
                 CAST(t."isCircuit" as INTEGER) as train_isCircuit,
                 CAST(extract(dow from t."plannedTo") as INTEGER) as train_startedAt_day,
                 CAST(extract(hour from t."plannedTo") as INTEGER) as train_startedAt_hour,
                 CASE a.rig
                     WHEN 'BLOCKS' THEN 1
                     WHEN 'DUMBBELL' THEN 2
                     WHEN 'BARBELL' THEN 2
                     WHEN 'OTHER' THEN 4
                     ELSE 0
                     END as action_rig,
                 CAST(a."bigCount" as INTEGER) as action_bigCount,
                 CAST(a."strengthAllowed" as INTEGER) as action_strengthAllowed,
                 CAST(a."allowCheating" as INTEGER) as action_allowCheating,
                 round(extract(epoch from te."completedAt" - te."startedAt")) as exercise_totalDurationInSec /* target */
             FROM "TrainingExercise" te
                      LEFT JOIN "ApproachesGroup" ag ON te."approachGroupId" = ag.id
                      LEFT JOIN "Training" t ON te."trainingId" = t.id
                      LEFT JOIN "Action" a ON te."actionId" = a.id
             WHERE te."completedAt" IS NULL AND t."id" = $1
             GROUP BY te.id, t.id, a.id, ag.id
    ;
`;

export class IntegrationTrainingTimeScorer {
  constructor(private _port = 5001) {}

  async predict(trainingId: number): Promise<number[]> {
    const result = await prisma.$queryRawUnsafe<any>(sql, trainingId);
    let jsonl = "";
    for (const item of result) {
      jsonl +=
        JSON.stringify(item, (key, value) =>
          typeof value === "bigint" ? parseInt(value.toString(), 10) : value,
        ) + "\n";
    }
    const response = await axios.post(
      `http://127.0.0.1:${this._port}/predict`,
      jsonl.trimEnd(),
      { headers: { "Content-Type": "application/x-ndjson" } },
    );
    return response.status === 200 ? response.data.predictions : null;
  }

  async update(trainingId: number) {
    let predictions: number[] = [];
    try {
      predictions = await this.predict(trainingId);
      if (predictions && predictions.length > 0) {
        const timeScoreInMins = predictions.reduce((acc, p) => acc + p, 0) / 60;
        await prisma.training.update({
          where: { id: trainingId },
          data: {
            timeScoreInMins,
            timeScoreInSecs: predictions.map((p) => p.toFixed(2)).join(", "),
            timeScoredAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.log(
        `There is an error while try to predict training time score: ${error}`,
      );
    }
    return predictions;
  }
}
