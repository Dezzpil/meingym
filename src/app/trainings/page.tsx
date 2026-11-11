import { prisma } from "@/tools/db";
import { getCachedMuscleGroups } from "@/tools/cachedQueries";
import { getCurrentUserId } from "@/tools/auth";
import { TrainingListCard } from "@/app/trainings/components/TrainingListCard";
import { PageParams } from "@/tools/types";
import { TrainingsPicker } from "@/components/TrainingsPicker";
import TrainingCreateForm from "@/app/trainings/components/TrainingCreateForm";
import { BiCalendarPlus } from "react-icons/bi";
import { computeBatchDynamics } from "@/core/dynamics";
import Link from "next/link";

type TrainingId = number;
export type MuscleGroupTitleToExercisesCnt = Record<string, number>;

export default async function TrainingsPage({ searchParams }: PageParams) {
  const userId = await getCurrentUserId();
  const q =
    searchParams.q && searchParams.q.trim().length
      ? searchParams.q.trim()
      : null;
  const groupId = searchParams.group ? parseInt(searchParams.group) : null;

  const month = parseInt(searchParams.month) || new Date().getMonth() + 1;
  const year = parseInt(searchParams.year) || new Date().getFullYear();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const isPastMonth =
    year < currentYear || (year === currentYear && month < currentMonth);
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isFiltered = q !== null || groupId !== null;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // Для динамики нужен контекст: последние 3 месяца без фильтров
  const dynamicsStartDate = new Date(year, month - 4, 1);

  const groups = await getCachedMuscleGroups();
  
  // Тренировки для отображения (с фильтрами)
  const trainings = await prisma.training.findMany({
    where: {
      plannedTo: {
        gte: startDate,
        lt: endDate,
      },
      commonComment: q ? { contains: q } : {},
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
        select: {
          id: true,
          purpose: true,
          liftedSum: true,
          liftedCountTotal: true,
          Action: {
            select: {
              title: true,
              isMarkDownInDesc: false,
              desc: false,
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
      MuscleLoad: {
        select: {
          plannedLoad: true,
          executedLoad: true,
          agonyCnt: true,
          MuscleGroup: { select: { title: true } },
        },
      },
      PersonalRecords: { select: { id: true } },
    },
    orderBy: { plannedTo: "desc" },
  });

  // Тренировки для расчёта динамики (последние 3 месяца, без фильтров)
  const trainingsForDynamics = await prisma.training.findMany({
    where: {
      plannedTo: {
        gte: dynamicsStartDate,
        lt: endDate,
      },
      userId,
    },
    select: {
      id: true,
      difficultyScore: true,
      muscleSignature: true,
      plannedTo: true,
    },
    orderBy: { plannedTo: "asc" },
  });

  const dynamicsMap = computeBatchDynamics(trainingsForDynamics);

  const groupsToTrainingsMap = new Map<
    TrainingId,
    MuscleGroupTitleToExercisesCnt
  >();
  for (const t of trainings) {
    const groupCounter: MuscleGroupTitleToExercisesCnt = {};
    for (const e of t.TrainingExercise) {
      for (const m of e.Action.MusclesAgony) {
        const group = m.Muscle.Group.title;
        if (!(group in groupCounter)) {
          groupCounter[group] = 0;
        }
        groupCounter[group] += 1;
      }
    }
    groupsToTrainingsMap.set(t.id, groupCounter);
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Тренировки</h1>
        <Link href="/trainings/dynamics" className="btn btn-outline-primary btn-sm">
          Динамика →
        </Link>
      </div>
      <div className="mb-3 hstack gap-5">
        <form
          method="GET"
          className="row row-cols-lg-auto g-3 align-items-center"
        >
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />
          <div className="col-12">
            <select
              name="group"
              className="form-select"
              defaultValue={groupId ? groupId : undefined}
            >
              <option value="">&mdash;</option>
              {groups.map((g) => (
                <option value={g.id} key={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <input
              type="text"
              className="form-control"
              name="q"
              defaultValue={q ? q : ""}
            />
          </div>
          <div className="col-12 hstack gap-3">
            <button type="submit" className="btn btn-primary">
              Найти
            </button>
          </div>
        </form>
      </div>
      <div className="mb-5">
        <TrainingsPicker trainings={trainings} />
      </div>
      {trainings.length ? (
        trainings.map((t) => (
          <TrainingListCard
            training={t}
            key={t.id}
            muscleGroupsCounts={
              groupsToTrainingsMap.get(t.id) as MuscleGroupTitleToExercisesCnt
            }
            dynamics={dynamicsMap.get(t.id)}
            now={now}
          />
        ))
      ) : isFiltered ? (
        <p className="mb-3 text-muted text-center">
          В этом месяце тренировки по указанному фильтру не найдены
        </p>
      ) : isPastMonth ? (
        <p className="mb-3 text-muted text-center">
          К сожалению, в этом месяце Вы совсем не тренировались :(
        </p>
      ) : isCurrentMonth ? (
        <div className="text-center py-5 bg-light rounded-3 border">
          <div className="mb-3 text-secondary opacity-50">
            <BiCalendarPlus size={48} />
          </div>
          <h4 className="fw-bold">В этом месяце пока затишье</h4>
          <p className="text-muted mb-4">
            Лучшее время для тренировки — сейчас!
          </p>
          <div className="d-flex justify-content-center">
            <TrainingCreateForm />
          </div>
        </div>
      ) : (
        <p className="mb-3 text-muted text-center">
          <span className="fw-bold">В здором теле - здоровый дух!</span>
          <br />
          <span>С надеждой смотрим в будущее!</span>
        </p>
      )}
    </>
  );
}
