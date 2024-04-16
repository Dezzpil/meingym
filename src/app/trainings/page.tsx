import { prisma } from "@/tools/db";
import Link from "next/link";
import { TrainingListItem } from "@/app/trainings/listItem";

type TrainingId = number;
export type MuscleGroupTitleToExercisesCnt = Record<string, number>;

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
  for (const t of trainings) {
    const counter: MuscleGroupTitleToExercisesCnt = {};
    for (const e of t.TrainingExercise) {
      for (const m of e.Action.MusclesAgony) {
        const group = m.Muscle.Group.title;
        if (!(group in counter)) {
          counter[group] = 0;
        }
        counter[group] += 1;
      }
      groupsToTrainingsMap.set(t.id, counter);
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
              <th>Группы</th>
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
