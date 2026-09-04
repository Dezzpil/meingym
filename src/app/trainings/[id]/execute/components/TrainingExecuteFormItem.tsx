"use client";

import { GiBelt, GiWeight } from "react-icons/gi";
import React, { useCallback, useRef, useState } from "react";
import type { Action, TrainingExerciseExecution } from "@prisma/client";
import { GrCheckmark } from "react-icons/gr";
import classNames from "classnames";
import {
  FaCircleQuestion,
  FaFireFlameCurved,
  FaSpinner,
} from "react-icons/fa6";
import { postApi } from "@/tools/fetch";
import Modal from "react-bootstrap/Modal";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import SegmentedSlider from "@/components/SegmentedSlider";
import PlusOneCounter from "@/components/PlusOneCounter";
import ToggleChip from "@/components/ToggleChip";
import {
  ExecutionBurning,
  ExecutionCheating,
  ExecutionRating,
  ExecutionRefusing,
  ExecutionTechnique,
} from "@prisma/client";
import { TrainingsExerciseCompleteDTO } from "@/app/api/trainings/exercise/execution/complete/route";
import {
  cheatingSliderOptions,
  ratingSliderOptions,
  refusingSliderOptions,
  techniqueSliderOptions,
  TechniqueSliderValue,
} from "@/app/trainings/[id]/execute/components/feedbackOptions";

const EXTRA_COUNT_MAX = 8;

type Props = {
  exec: TrainingExerciseExecution;
  action: Action;
  disabled: boolean;
  noFeedback: boolean;
};

export default function TrainingExecuteFormItem({
  action,
  exec,
  disabled,
  noFeedback,
}: Props) {
  const [isCompleted, setCompleted] = useState<boolean>(!!exec.executedAt);
  const [waitForCompleted, setWaitForCompleted] = useState<boolean>(false);

  const [liftedWeight, setLiftedWeight] = useState(exec.plannedWeigth);
  const [liftedCount, setLiftedCount] = useState(exec.plannedCount);

  const [rating, setRating] = useState<ExecutionRating>(ExecutionRating.OK);
  const [extraCount, setExtraCount] = useState<number>(exec.extraCount ?? 0);
  const [techniqueState, setTechniqueState] =
    useState<TechniqueSliderValue>("OK");
  const [cheating, setCheating] = useState<ExecutionCheating>(
    ExecutionCheating.NO,
  );
  const [refusing, setRefusing] = useState<ExecutionRefusing>(
    ExecutionRefusing.NO,
  );
  const [useBelt, setUseBelt] = useState<boolean>(false);
  const [burning, setBurning] = useState<boolean>(false);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [modalShowed, setModalShowed] = useState(false);

  const closeModal = useCallback(() => {
    postApi<TrainingsExerciseCompleteDTO>(
      `/api/trainings/exercise/execution/complete?id=${exec.id}`,
      {
        id: exec.id,
        liftedWeight,
        liftedCount,
        rating,
        technique:
          techniqueState === "WORSE"
            ? ExecutionTechnique.FLAW
            : ExecutionTechnique.OK,
        techniqueUpgrade: techniqueState === "BETTER",
        cheating: action.allowCheating ? cheating : ExecutionCheating.NO,
        refusing,
        burning: burning ? ExecutionBurning.YES : ExecutionBurning.NO,
        comment: commentTextareaRef.current?.value,
        useBelt,
        extraCount,
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
    burning,
    cheating,
    exec.id,
    extraCount,
    isCompleted,
    liftedCount,
    liftedWeight,
    rating,
    refusing,
    techniqueState,
    useBelt,
  ]);

  const onComplete = useCallback(() => {
    setWaitForCompleted(true);

    if (!isCompleted) {
      if (noFeedback) {
        // Skip feedback modal and send minimal payload
        postApi<TrainingsExerciseCompleteDTO>(
          `/api/trainings/exercise/execution/complete?id=${exec.id}`,
          {
            id: exec.id,
            liftedWeight,
            liftedCount,
          },
        )
          .then(() => {
            setCompleted(true);
          })
          .finally(() => {
            setWaitForCompleted(false);
          });
      } else {
        setModalShowed(true);
      }
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
  }, [exec.id, isCompleted, liftedCount, liftedWeight, noFeedback]);

  const updateLiftedCount = useCallback((e: any) => {
    e.preventDefault();
    setLiftedCount(parseInt(e.target.value));
  }, []);

  const updateLiftedWeight = useCallback((e: any) => {
    e.preventDefault();
    setLiftedWeight(parseInt(e.target.value));
  }, []);

  const isDuration = action.isDurationBased;

  return (
    <div className="mb-1 d-flex gap-2">
      <div className="input-group">
        {isDuration ? (
          <>
            {action.durationParamLabel && (
              <>
                <span className="input-group-text">
                  {action.durationParamLabel}
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
                {action.durationParamUnit && (
                  <span className="input-group-text">
                    {action.durationParamUnit}
                  </span>
                )}
              </>
            )}
            <span className="input-group-text">Длительность</span>
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
              defaultValue={
                exec.liftedCount ? exec.liftedCount : exec.plannedCount
              }
            />
            <span className="input-group-text">с</span>
          </>
        ) : (
          <>
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
              defaultValue={
                exec.liftedCount ? exec.liftedCount : exec.plannedCount
              }
            />
          </>
        )}
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
          <div className="d-flex flex-column gap-3">
            <div>
              <div className="exec-field-label">Сложность</div>
              <SegmentedSlider
                ariaLabel="Сложность"
                options={ratingSliderOptions}
                value={rating}
                onChange={setRating}
              />
            </div>
            <div>
              <div className="exec-field-label">Техника</div>
              <SegmentedSlider
                ariaLabel="Техника выполнения"
                options={techniqueSliderOptions}
                value={techniqueState}
                onChange={setTechniqueState}
              />
            </div>
            <div>
              <div className="exec-field-label">Отказ</div>
              <SegmentedSlider
                ariaLabel="Отказ"
                options={refusingSliderOptions}
                value={refusing}
                onChange={setRefusing}
              />
            </div>
            {action.allowCheating && !isDuration && (
              <div>
                <div className="exec-field-label">Читинг</div>
                <SegmentedSlider
                  ariaLabel="Читинг"
                  options={cheatingSliderOptions}
                  value={cheating}
                  onChange={setCheating}
                />
              </div>
            )}
            <div className="d-flex align-items-center flex-wrap gap-2">
              {!isDuration && (
                <ToggleChip
                  checked={useBelt}
                  onChange={setUseBelt}
                  icon={<GiBelt />}
                  ariaLabel="Использовался ремень"
                  tone="secondary"
                />
              )}
              <ToggleChip
                checked={burning}
                onChange={setBurning}
                icon={<FaFireFlameCurved />}
                label="Жжение"
                tone="warning"
                celebrate
              />
              {!isDuration && (
                <div className="d-flex align-items-center gap-2 ms-auto">
                  <PlusOneCounter
                    value={extraCount}
                    onChange={setExtraCount}
                    max={EXTRA_COUNT_MAX}
                  />
                  <OverlayTrigger
                    trigger="click"
                    rootClose
                    placement="top"
                    overlay={
                      <Popover id="extraCountPopover">
                        <Popover.Body>
                          Если удалось выполнить чуть больше заявленного
                          количества
                        </Popover.Body>
                      </Popover>
                    }
                  >
                    <button
                      type="button"
                      className="exec-field-icon-btn"
                      aria-label="Подсказка"
                    >
                      <FaCircleQuestion />
                    </button>
                  </OverlayTrigger>
                </div>
              )}
            </div>
            <textarea
              rows={2}
              className="form-control"
              ref={commentTextareaRef}
              placeholder="Комментарий ..."
            ></textarea>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-success exec-submit-btn"
            onClick={closeModal}
          >
            Выполнено
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
