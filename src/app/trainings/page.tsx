import { prisma } from "@/tools/db";
import Link from "next/link";
import { TrainingListItem } from "@/app/trainings/listItem";
import { Purpose } from "@prisma/client";

type TrainingId = number;
export type MuscleGroupTitleToExercisesCnt = Record<string, number>;
export type ActionPurposeCnt = Record<"MASS" | "STRENGTH", number>;

export default async function TrainingsPage() {
  const trainings = await prisma.training.findMany({
    include: {
      TrainingExercise: {
        include: {
          Action: {
            include: {
              MusclesAgony: {
                include: {
                  Muscle: {
                    include: {
                      Group: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { plannedTo: "desc" },
  });

  const groupsToTrainingsMap = new Map<
    TrainingId,
    MuscleGroupTitleToExercisesCnt
  >();
  const purposeToTrainingMap = new Map<TrainingId, ActionPurposeCnt>();
  for (const t of trainings) {
    const groupCounter: MuscleGroupTitleToExercisesCnt = {};
    const purposeCounter = { MASS: 0, STRENGTH: 0 };
    for (const e of t.TrainingExercise) {
      e.purpose === Purpose.MASS
        ? (purposeCounter.MASS += 1)
        : (purposeCounter.STRENGTH += 1);
      for (const m of e.Action.MusclesAgony) {
        const group = m.Muscle.Group.title;
        if (!(group in groupCounter)) {
          groupCounter[group] = 0;
        }
        groupCounter[group] += 1;
      }
      groupsToTrainingsMap.set(t.id, groupCounter);
      purposeToTrainingMap.set(t.id, purposeCounter);
    }
  }

  return (
    <>
      <header className="mb-3">Список тренировок</header>
      <div className="mb-3">
        <Link href={`/trainings/create`} className="btn btn-primary">
          Добавить
        </Link>
      </div>
      {trainings.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Запланирована</th>
              <th>Упражнений</th>
              <th>Мышцы-агонисты</th>
              <th>Сила / масса</th>
              <th>Выполнение</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map((t) => (
              <TrainingListItem
                training={t}
                key={t.id}
                muscleGroupsCounts={
                  groupsToTrainingsMap.get(
                    t.id,
                  ) as MuscleGroupTitleToExercisesCnt
                }
                purposeCounts={purposeToTrainingMap.get(t.id)}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <p>Список пуст</p>
      )}
    </>
  );
}
