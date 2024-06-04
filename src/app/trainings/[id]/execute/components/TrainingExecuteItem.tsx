"use client";

import { GiWeight } from "react-icons/gi";
import React, { useCallback, useRef, useState } from "react";
import type { Action, TrainingExerciseExecution } from "@prisma/client";
import { GrCheckmark } from "react-icons/gr";
import classNames from "classnames";
import type { RegisterOptions } from "react-hook-form";
import { FaSpinner } from "react-icons/fa6";
import { postApi } from "@/tools/fetch";
import Modal from "react-bootstrap/Modal";
import {
  BurningOptions,
  CheatingOptions,
  RatingOptions,
  RefusingOptions,
} from "@/app/trainings/[id]/execute/types";
import { ExecutionBurning } from ".prisma/client";
import { ExecutionCheating } from "@prisma/client";

type Props = {
  exec: TrainingExerciseExecution;
  action: Action;
  register: CallableFunction;
  disabled: boolean;
};
export default function TrainingExecuteItem({
  action,
  exec,
  register,
  disabled,
}: Props) {
  const [isCompleted, setCompleted] = useState<boolean>(!!exec.executedAt);
  const [waitForCompleted, setWaitForCompleted] = useState<boolean>(false);

  const [liftedWeight, setLiftedWeight] = useState(exec.plannedWeigth);
  const [liftedCount, setLiftedCount] = useState(exec.plannedCount);

  const ratingSelectRef = useRef<HTMLSelectElement | null>(null);
  const cheatingSelectRef = useRef<HTMLSelectElement | null>(null);
  const refusingSelectRef = useRef<HTMLSelectElement | null>(null);
  const burningSelectRef = useRef<HTMLSelectElement | null>(null);

  const [modalShowed, setModalShowed] = useState(false);
  const closeModal = useCallback(() => {
    postApi(`/api/trainings/exercise/execution/complete?id=${exec.id}`, {
      id: exec.id,
      liftedWeight,
      liftedCount,
      rating: ratingSelectRef.current?.value,
      cheating: action.allowCheating
        ? cheatingSelectRef.current?.value
        : ExecutionCheating.NO,
      refusing: refusingSelectRef.current?.value,
      burning: action.bigCount
        ? burningSelectRef.current?.value
        : ExecutionBurning.NO,
    })
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
          {...register(`[${exec.id}].liftedWeight`, {
            valueAsNumber: true,
            min: 0,
            value: exec.liftedWeight ? exec.liftedWeight : exec.plannedWeigth,
          } as RegisterOptions)}
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
          {...register(`[${exec.id}].liftedCount`, {
            valueAsNumber: false,
            min: 0,
            value: exec.liftedCount ? exec.liftedCount : exec.plannedCount,
          } as RegisterOptions)}
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
              <select className="form-control" ref={burningSelectRef}>
                {Object.entries(BurningOptions).map((entry) => (
                  <option key={entry[0]} value={entry[0]}>
                    {entry[1]}
                  </option>
                ))}
              </select>
            )}
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
