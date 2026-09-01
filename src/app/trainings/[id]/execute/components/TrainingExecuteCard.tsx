"use client";

import React, { useCallback } from "react";
import {
  handleTrainingExercisePass,
  handleTrainingExerciseStart,
} from "@/app/trainings/[id]/execute/actions";
import { TrainingExercise } from "@prisma/client";
import { TrainingExecuteForm } from "@/app/trainings/[id]/execute/components/TrainingExecuteForm";
import { PurposeText } from "@/components/PurposeText";
import classNames from "classnames";
import { Accordion, useAccordionButton } from "react-bootstrap";
import { HiDotsVertical } from "react-icons/hi";
import { TrainingExerciseItemExtraControl } from "@/app/trainings/components/TrainingExerciseItemExtraControl";
import { TrainingExerciseType } from "@/app/trainings/exercises/types";

type Props = {
  exercise: TrainingExerciseType;
  disabled: boolean;
  allExercises: TrainingExercise[];
  noFeedback: boolean;
};

function ExtraButtonsToggle({ children, eventKey }) {
  const decoratedOnClick = useAccordionButton(eventKey, () => {
    // pass
  });

  return (
    <button className="btn btn-default" onClick={decoratedOnClick}>
      {children}
    </button>
  );
}

export function TrainingExecuteCard({
  exercise,
  disabled,
  allExercises,
  noFeedback,
}: Props) {
  const start = useCallback(async () => {
    await handleTrainingExerciseStart(exercise.id, exercise.trainingId);
  }, [exercise]);

  const pass = useCallback(async () => {
    await handleTrainingExercisePass(exercise.id, exercise.trainingId);
  }, [exercise]);

  return (
    <div className="card mb-3" key={exercise.id}>
      <div className="card-header">
        <ul className="col-lg-6 col-md-12 list-inline mb-0">
          <li
            className={classNames("list-inline-item", {
              "fw-semibold": exercise.startedAt && !exercise.completedAt,
            })}
          >
            {exercise.Action.alias
              ? exercise.Action.alias
              : exercise.Action.title}
          </li>
          <li className="list-inline-item">
            <PurposeText purpose={exercise.purpose} />
          </li>
        </ul>
        <div className="col-lg-6 col-md-12"></div>
      </div>

      <div className="card-body">
        {!disabled && (
          <>
            {exercise.startedAt ? (
              <div className="d-flex justify-content-end mb-2">
                <TrainingExerciseItemExtraControl
                  exercise={exercise}
                  allExercises={allExercises}
                />
              </div>
            ) : (
              <Accordion className="mb-2">
                <div className="d-flex justify-content-end">
                  <div className="d-flex gap-2">
                    {!exercise.completedAt && (
                      <ExtraButtonsToggle eventKey="0">
                        <HiDotsVertical />
                      </ExtraButtonsToggle>
                    )}
                    <button className="btn btn-primary" onClick={start}>
                      Погнали!
                    </button>
                  </div>
                </div>

                {!exercise.completedAt && (
                  <Accordion.Collapse eventKey="0">
                    <div className="d-flex justify-content-between alert alert-light p-2 mt-2">
                      <button
                        className="btn btn-outline-secondary d-inline-flex align-items-center"
                        onClick={pass}
                        title="Пропустить упражнение"
                      >
                        Пропустить
                      </button>
                      <TrainingExerciseItemExtraControl
                        exercise={exercise}
                        allExercises={allExercises}
                      />
                    </div>
                  </Accordion.Collapse>
                )}
              </Accordion>
            )}
          </>
        )}
        <TrainingExecuteForm
          exercise={exercise}
          disabled={!exercise.startedAt || !!exercise.completedAt || disabled}
          noFeedback={noFeedback}
        />
      </div>
    </div>
  );
}
