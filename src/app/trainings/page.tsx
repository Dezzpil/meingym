import { prisma } from "@/tools/db";
import { Purpose } from "@prisma/client";
import { getCurrentUserId } from "@/tools/auth";
import { TrainingListCard } from "@/app/trainings/components/TrainingListCard";
import { PageParams } from "@/tools/types";
import TrainingCreateForm from "@/app/trainings/components/TrainingCreateForm";

type TrainingId = number;
export type MuscleGroupTitleToExercisesCnt = Record<string, number>;
export type ActionPurposeCnt = Record<"MASS" | "STRENGTH", number>;

export default async function TrainingsPage({ searchParams }: PageParams) {
  const userId = await getCurrentUserId();
  const groupId = searchParams.group ? parseInt(searchParams.group) : null;
  const groups = await prisma.muscleGroup.findMany({});
  const trainings = await prisma.training.findMany({
    where: {
      TrainingExercise:
        groupId !== null
          ? {
              some: {
                Action: { MusclesAgony: { some: { Muscle: { groupId } } } },
              },
            }
          : {},
      userId,
    },
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
      <div className="mb-3 hstack gap-5">
        <form
          method="GET"
          className="row row-cols-lg-auto g-3 align-items-center"
        >
          <div className="col-12">
            <select name="group" className="form-select">
              <option value="">&mdash;</option>
              {groups.map((g) => (
                <option
                  value={g.id}
                  key={g.id}
                  selected={groupId ? g.id === groupId : false}
                >
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 hstack gap-3">
            <button type="submit" className="btn btn-primary">
              Найти
            </button>
          </div>
        </form>
        <TrainingCreateForm />
      </div>
      {trainings.length ? (
        trainings.map((t) => (
          <TrainingListCard
            training={t}
            key={t.id}
            muscleGroupsCounts={
              groupsToTrainingsMap.get(t.id) as MuscleGroupTitleToExercisesCnt
            }
            purposeCounts={purposeToTrainingMap.get(t.id)}
          />
        ))
      ) : (
        <p>Список пуст</p>
      )}
    </>
  );
}
