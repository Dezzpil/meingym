import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import AddExerciseForm from "@/components/trainings/AddExerciseForm";
import { ApproachesManagement } from "@/components/approaches/Managment";
import React from "react";
import Link from "next/link";

export default async function TrainingPage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  const training = await prisma.training.findUniqueOrThrow({
    where: { id },
  });
  const actions = await prisma.action.findMany({});
  const exercises = await prisma.trainingExercise.findMany({
    where: { trainingId: id },
    include: {
      Action: true,
      ApproachGroup: {
        include: {
          Approaches: { orderBy: { priority: "asc" } },
        },
      },
    },
    orderBy: { priority: "asc" },
  });
  return (
    <>
      <header className="mb-3">
        Тренировка {training.planedTo.toString()}
      </header>
      <ul className="list-group mb-3">
        {exercises.map((e) => (
          <li className="list-group-item mb-3" key={e.id}>
            <div className="row">
              <div className="mb-3 col-md-3 col-sm-12">
                <Link href={`/actions/${e.Action.id}`}>
                  {e.Action.alias ? e.Action.alias : e.Action.title}
                </Link>
                <div>
                  <small className="small text-muted">{e.purpose}</small>
                </div>
                <div className="d-inline-flex gap-2">
                  {e.ApproachGroup.Approaches.map((a) => (
                    <span key={a.id}>
                      {a.weight}x{a.count}
                    </span>
                  ))}
                </div>
                <div>
                  <button className="btn btn-sm btn-secondary">
                    Редактировать
                  </button>
                </div>
              </div>
              <div className="col-md-9 col-sm-12" hidden>
                <ApproachesManagement
                  update={{ groupId: e.approachGroupId }}
                  approaches={e.ApproachGroup.Approaches}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <AddExerciseForm
        training={training}
        actions={actions}
        exercises={exercises}
      />
    </>
  );
}
