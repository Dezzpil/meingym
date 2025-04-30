import { prisma } from "@/tools/db";
import Link from "next/link";
import moment from "moment";
import { getCurrentUserId } from "@/tools/auth";
import { DateFormat, getCurrentDayBorders } from "@/tools/dates";
import TrainingCreateForm from "@/app/trainings/components/TrainingCreateForm";
import TrainingPeriodManager from "@/app/components/TrainingPeriodManager";
import { getCurrentTrainingPeriod, pickOnlyOptsFromItem } from "@/core/periods";

export default async function HomePage() {
  const userId = await getCurrentUserId();
  const { gte, lt } = getCurrentDayBorders();

  const currentPeriod = await getCurrentTrainingPeriod(userId);

  let progressionOpts = null;
  if (currentPeriod) {
    const item = await prisma.progressionStrategySimpleOpts.findUnique({
      where: {
        trainingPeriodId: currentPeriod.id,
      },
    });
    if (item) progressionOpts = pickOnlyOptsFromItem(item);
  }

  const trainings = await prisma.training.findMany({
    where: {
      userId,
      completedAt: null,
      plannedTo: { gte, lt },
    },
    orderBy: {
      plannedTo: "asc",
    },
    include: {
      TrainingExercise: {
        orderBy: { priority: "asc" },
        include: { Action: true },
      },
    },
  });

  return (
    <div>
      <TrainingPeriodManager
        currentPeriod={currentPeriod}
        progressionOpts={progressionOpts}
        userId={userId}
      />

      {trainings.length ? (
        trainings.map((t) => (
          <div className="card" key={t.id}>
            <div className="card-body">
              <h5 className="card-title">
                Тренировка на {moment(t.plannedTo).format(DateFormat)}
              </h5>
              <div className="card-text">
                Упражнения:{" "}
                {t.TrainingExercise.map((e) => e.Action.title).join(", ")}
              </div>
              <div className="card-link d-flex gap-3">
                <Link href={`/trainings/${t.id}/execute`}>Погнали</Link>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div>
          <TrainingCreateForm btnTitle="Назначить тренировку" />
        </div>
      )}
    </div>
  );
}
