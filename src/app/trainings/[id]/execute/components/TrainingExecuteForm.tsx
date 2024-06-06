"use client";

import TrainingExecuteFormItem from "@/app/trainings/[id]/execute/components/TrainingExecuteFormItem";
import React, { useCallback, useRef, useState } from "react";
import type {
  TrainingExercise,
  TrainingExerciseExecution,
  Action,
  ApproachesGroup,
} from "@prisma/client";
import {
  countExerciseNonExecuted,
  handleAddExecutionApproach,
  handleTrainingExerciseExecuted,
} from "@/app/trainings/[id]/execute/actions";
import moment from "moment";
import { FaSpinner } from "react-icons/fa6";
import Modal from "react-bootstrap/Modal";
import { TrainingRating } from "@prisma/client";
import classNames from "classnames";
import { TrainingRatingEmoji } from "@/app/trainings/components/TrainingRatingEmoji";
import { SetsStatsForExercise } from "@/components/SetsStats";

type Props = {
  exercise: TrainingExercise & {
    Action: Action;
    ApproachGroup: ApproachesGroup;
    TrainingExerciseExecution: TrainingExerciseExecution[];
  };
  disabled: boolean;
};

export function TrainingExecuteForm({ exercise, disabled }: Props) {
  const [modalShowed, setModalShowed] = useState(false);

  const showModal = useCallback(async () => {
    let force = true;
    const result = await countExerciseNonExecuted(exercise.id);
    if (result) {
      force = confirm("Не все подходы выполнены, завершить упражнение?");
    }
    if (force) {
      setModalShowed(true);
    }
  }, [exercise.id]);

  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeHandling, setCompleteHandling] = useState<boolean>(false);
  const commentTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const ratingSelectRef = useRef<HTMLSelectElement | null>(null);

  const submit = useCallback(async () => {
    setCompleteError(null);
    setCompleteHandling(true);
    const rating = ratingSelectRef.current?.value as TrainingRating | null;
    const comment = commentTextAreaRef.current?.value;
    const result = await handleTrainingExerciseExecuted(
      exercise,
      rating,
      comment,
    );
    if (result.error) {
      setCompleteError(result.error);
    }
    setModalShowed(false);
    setCompleteHandling(false);
  }, [exercise]);

  const [isAddingApproach, setAddingApproach] = useState<boolean>(false);
  const [errorAddingApproach, setErrorAddingApproach] = useState<string | null>(
    null,
  );
  const addApproach = useCallback(async () => {
    setErrorAddingApproach(null);
    setAddingApproach(true);
    try {
      await handleAddExecutionApproach(exercise.trainingId, exercise.id);
    } catch (e: any) {
      console.error(e);
      setErrorAddingApproach(e.message);
    } finally {
      setAddingApproach(false);
    }
  }, [exercise.id, exercise.trainingId]);

  return (
    <>
      <div>
        <div className="row mb-2">
          {exercise.TrainingExerciseExecution.map((exec) => (
            <TrainingExecuteFormItem
              key={exec.id}
              action={exercise.Action}
              exec={exec}
              disabled={disabled}
            />
          ))}
        </div>

        <div>
          {exercise.completedAt ? (
            <div
              className={classNames(
                "alert mb-0",
                exercise.isPassed ? "alert-warning" : "alert-success",
              )}
            >
              <div>
                {exercise.isPassed ? (
                  <span>Упражнение пропущено</span>
                ) : (
                  <div className="hstack gap-2">
                    <span>
                      Упражнение выполнено в{" "}
                      {moment(exercise.completedAt).format("H:mm")}
                    </span>
                    <span>
                      (+
                      {moment(exercise.completedAt).diff(
                        moment(exercise.startedAt),
                        "minute",
                      )}{" "}
                      мин.)
                    </span>
                    <TrainingRatingEmoji rating={exercise.rating} />
                  </div>
                )}
              </div>
              <SetsStatsForExercise exercise={exercise} className="mb-1" />
              {exercise.comment && (
                <div className="text-muted hstack gap-1">
                  <span>Комментарий:</span>
                  <span>{exercise.comment}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between gap-2">
                <button
                  onClick={addApproach}
                  type="button"
                  disabled={isAddingApproach || disabled}
                  className="btn btn-default"
                >
                  {isAddingApproach ? <FaSpinner /> : <span>Еще подход!</span>}
                </button>
                <button
                  onClick={showModal}
                  type="button"
                  disabled={disabled}
                  className="btn btn-outline-success"
                >
                  Закончили!
                </button>
              </div>
              {errorAddingApproach && (
                <div className="alert alert-danger">{errorAddingApproach}</div>
              )}
            </>
          )}
          {completeError && (
            <div className="alert alert-danger">{completeError}</div>
          )}
        </div>

        <Modal show={modalShowed} onHide={submit}>
          <Modal.Header>
            <Modal.Title>Оценка выполнения упражнения</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <select
              ref={ratingSelectRef}
              defaultValue={TrainingRating.OK}
              className="form-control mb-2"
            >
              <option value={TrainingRating.EASY}>Легко</option>
              <option value={TrainingRating.OK}>ОК</option>
              <option value={TrainingRating.HARD}>
                Тяжело, но силы остались
              </option>
              <option value={TrainingRating.IMPOSSIBLE}>
                Очень тяжело, без сил
              </option>
            </select>
            <textarea
              rows={2}
              className="mb-2 form-control"
              placeholder="Комментарий ..."
              ref={commentTextAreaRef}
            ></textarea>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-success"
              type="button"
              onClick={submit}
              disabled={completeHandling}
            >
              Закончили
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
