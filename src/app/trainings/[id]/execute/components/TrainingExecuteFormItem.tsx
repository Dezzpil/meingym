"use client";

import { GiWeight } from "react-icons/gi";
import React, { useCallback, useRef, useState } from "react";
import type {
  Action,
  ExecutionTechnique,
  TrainingExerciseExecution,
} from "@prisma/client";
import { GrCheckmark } from "react-icons/gr";
import classNames from "classnames";
import { FaSpinner } from "react-icons/fa6";
import { postApi } from "@/tools/fetch";
import Modal from "react-bootstrap/Modal";
import {
  BurningOptions,
  CheatingOptions,
  RatingOptions,
  RefusingOptions,
  TechniqueOptions,
} from "@/app/trainings/[id]/execute/types";
import { ExecutionBurning } from ".prisma/client";
import {
  ExecutionCheating,
  ExecutionRating,
  ExecutionRefusing,
} from "@prisma/client";
import { TrainingsExerciseCompleteDTO } from "@/app/api/trainings/exercise/execution/complete/route";

type Props = {
  exec: TrainingExerciseExecution;
  action: Action;
  disabled: boolean;
};

export default function TrainingExecuteFormItem({
  action,
  exec,
  disabled,
}: Props) {
  const [isCompleted, setCompleted] = useState<boolean>(!!exec.executedAt);
  const [waitForCompleted, setWaitForCompleted] = useState<boolean>(false);

  const [liftedWeight, setLiftedWeight] = useState(exec.plannedWeigth);
  const [liftedCount, setLiftedCount] = useState(exec.plannedCount);

  const ratingSelectRef = useRef<HTMLSelectElement | null>(null);
  const techSelectRef = useRef<HTMLSelectElement | null>(null);
  const techUpCheckboxRef = useRef<HTMLInputElement | null>(null);
  const cheatingSelectRef = useRef<HTMLSelectElement | null>(null);
  const refusingSelectRef = useRef<HTMLSelectElement | null>(null);
  const burningSelectRef = useRef<HTMLSelectElement | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [modalShowed, setModalShowed] = useState(false);

  const closeModal = useCallback(() => {
    postApi<TrainingsExerciseCompleteDTO>(
      `/api/trainings/exercise/execution/complete?id=${exec.id}`,
      {
        id: exec.id,
        liftedWeight,
        liftedCount,
        rating: ratingSelectRef.current?.value as ExecutionRating,
        technique: techSelectRef.current?.value as ExecutionTechnique,
        techniqueUpgrade: !!techUpCheckboxRef.current?.value,
        cheating: action.allowCheating
          ? (cheatingSelectRef.current?.value as ExecutionCheating)
          : ExecutionCheating.NO,
        refusing: refusingSelectRef.current?.value as ExecutionRefusing,
        burning: action.bigCount
          ? (burningSelectRef.current?.value as ExecutionBurning)
          : ExecutionBurning.NO,
        comment: commentTextareaRef.current?.value,
      },
    )
      .then((data) => {
        setCompleted(!isCompleted);
      })
      .finally(() => {
        setWaitForCompleted(false);
        setModalShowed(false);
      });
  }, [
    action.allowCheating,
    action.bigCount,
    exec.id,
    isCompleted,
    liftedCount,
    liftedWeight,
  ]);

  const onComplete = useCallback(() => {
    setWaitForCompleted(true);

    if (!isCompleted) {
      setModalShowed(true);
    } else {
      postApi(`/api/trainings/exercise/execution/uncomplete?id=${exec.id}`, {
        id: exec.id,
      })
        .then((data) => {
          setCompleted(!isCompleted);
        })
        .finally(() => {
          setWaitForCompleted(false);
        });
    }
  }, [exec.id, isCompleted]);

  const updateLiftedCount = useCallback((e: any) => {
    e.preventDefault();
    setLiftedCount(parseInt(e.target.value));
  }, []);

  const updateLiftedWeight = useCallback((e: any) => {
    e.preventDefault();
    setLiftedWeight(parseInt(e.target.value));
  }, []);

  return (
    <div className="mb-1 d-flex gap-2">
      <div className="input-group">
        <span className="input-group-text">
          <GiWeight />
        </span>
        <input
          type="number"
          step={0.5}
          className={classNames("form-control", {
            "text-success":
              exec.liftedWeight && exec.liftedWeight > exec.plannedWeigth,
            "text-warning":
              exec.liftedWeight && exec.liftedWeight < exec.plannedWeigth,
            "text-muted": exec.isPassed,
          })}
          disabled={disabled || isCompleted}
          onInput={updateLiftedWeight}
          defaultValue={
            exec.liftedWeight ? exec.liftedWeight : exec.plannedWeigth
          }
          min={0}
        />
        <span className="input-group-text">x</span>
        <input
          type="number"
          step="1"
          className={classNames("form-control", {
            "text-success":
              exec.liftedCount && exec.liftedCount > exec.plannedCount,
            "text-warning":
              exec.liftedCount && exec.liftedCount < exec.plannedCount,
            "text-muted": exec.isPassed,
          })}
          disabled={disabled || isCompleted}
          onInput={updateLiftedCount}
          min={0}
          defaultValue={exec.liftedCount ? exec.liftedCount : exec.plannedCount}
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        className={classNames("btn", {
          "btn-light": !isCompleted,
          "btn-success": isCompleted,
        })}
        onClick={onComplete}
      >
        {waitForCompleted ? <FaSpinner /> : <GrCheckmark />}
      </button>
      <Modal show={modalShowed} onHide={closeModal}>
        <Modal.Header>
          <Modal.Title>Оценка выполнения подхода</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <select className="form-control mb-2" ref={ratingSelectRef}>
              {Object.entries(RatingOptions).map((entry) => (
                <option key={entry[0]} value={entry[0]}>
                  {entry[1]}
                </option>
              ))}
            </select>
            <select className="form-control mb-2" ref={techSelectRef}>
              {Object.entries(TechniqueOptions).map((entry) => (
                <option key={entry[0]} value={entry[0]}>
                  {entry[1]}
                </option>
              ))}
            </select>
            <div className="form-check mb-2">
              <input
                type="checkbox"
                id="techniqueUpgrade"
                className="form-check-input"
                ref={techUpCheckboxRef}
              />
              <label htmlFor="techniqueUpgrade" className="form-check-label">
                Улучшение техники?
              </label>
            </div>
            {action.allowCheating && (
              <select className="form-control mb-2" ref={cheatingSelectRef}>
                {Object.entries(CheatingOptions).map((entry) => (
                  <option key={entry[0]} value={entry[0]}>
                    {entry[1]}
                  </option>
                ))}
              </select>
            )}
            <select className="form-control mb-2" ref={refusingSelectRef}>
              {Object.entries(RefusingOptions).map((entry) => (
                <option key={entry[0]} value={entry[0]}>
                  {entry[1]}
                </option>
              ))}
            </select>
            {action.bigCount && (
              <select className="form-control mb-2" ref={burningSelectRef}>
                {Object.entries(BurningOptions).map((entry) => (
                  <option key={entry[0]} value={entry[0]}>
                    {entry[1]}
                  </option>
                ))}
              </select>
            )}
            <textarea
              rows={2}
              className="form-control"
              ref={commentTextareaRef}
              placeholder="Комментарий ..."
            ></textarea>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="btn btn-success" onClick={closeModal}>
            Выполнено
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
