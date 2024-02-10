import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import AddExerciseForm from "@/components/trainings/AddExerciseForm";
import React from "react";
import ExerciseItemControl from "@/components/trainings/ExerciseItemControl";

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
      <header className="mb-3">Тренировка {training.plannedToStr}</header>
      {exercises.length ? (
        <ul className="list-group mb-3">
          {exercises.map((e) => (
            <li className="list-group-item mb-3" key={e.id}>
              <ExerciseItemControl e={e} />
            </li>
          ))}
        </ul>
      ) : (
        <p>Упражнения еще не добавлены...</p>
      )}
      <AddExerciseForm training={training} actions={actions} />
    </>
  );
}
