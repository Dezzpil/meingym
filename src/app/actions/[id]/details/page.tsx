import { prisma } from "@/tools/db";
import { ItemPageParams } from "@/tools/types";
import { ActionTabs } from "@/app/actions/[id]/ActionTabs";
import { Purpose } from "@prisma/client";

export default async function ActionDetailsPage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
    include: {
      TrainingExercise: true,
    },
  });

  return (
    <>
      <h2 className="mb-3">{action.alias ? action.alias : action.title}</h2>
      <ActionTabs id={id} current={"details"} className={"mb-2"} />
      <div className="card mb-2">
        <div className="card-header">Поисковая строка</div>
        <div className="card-body">{action.search}</div>
      </div>
      <div className="card mb-2">
        <div className="card-header">
          Выбрано в тренировках: {action.TrainingExercise.length}
        </div>
        <div className="card-body d-flex gap-3">
          <span>
            На массу:{" "}
            {action.TrainingExercise.reduce(
              (prev, cur) => prev + (cur.purpose === Purpose.MASS ? 1 : 0),
              0,
            )}
          </span>
          <span>
            На силу:{" "}
            {action.TrainingExercise.reduce(
              (prev, cur) => prev + (cur.purpose === Purpose.STRENGTH ? 1 : 0),
              0,
            )}
          </span>
          <span>
            На снижение веса:{" "}
            {action.TrainingExercise.reduce(
              (prev, cur) => prev + (cur.purpose === Purpose.LOSS ? 1 : 0),
              0,
            )}
          </span>
        </div>
      </div>
    </>
  );
}
