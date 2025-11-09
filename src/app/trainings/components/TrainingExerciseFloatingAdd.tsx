"use client";

import React, { useCallback, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { BiPlus } from "react-icons/bi";
import type { Training, TrainingExercise } from "@prisma/client";
import { CurrentPurpose } from "@/core/types";
import { ActionWithMusclesType } from "@/app/actions/types";
import { TrainingExerciseAddSearch } from "@/app/trainings/components/TrainingExerciseAddSearch";

type Props = {
  training: Training;
  actions: ActionWithMusclesType[];
  exercises: { actionId: number }[]; // enough to exclude existing
  defaultPurpose: CurrentPurpose;
};

export function TrainingExerciseFloatingAdd({
  training,
  actions,
  exercises,
  defaultPurpose,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const excludeIds = useMemo(
    () => (exercises || []).map((e) => e.actionId),
    [exercises],
  );

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary rounded-circle position-fixed"
        style={{
          width: 56,
          height: 56,
          right: 16,
          bottom: 16,
          zIndex: 1050,
          boxShadow: "0 0.5rem 1rem rgba(0,0,0,.15)",
        }}
        onClick={open}
        aria-label="Добавить упражнение"
        title="Добавить упражнение"
      >
        <BiPlus size={28} />
      </button>

      <Modal show={isOpen} onHide={close} centered>
        <Modal.Header closeButton>
          <Modal.Title>Добавить упражнение</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TrainingExerciseAddSearch
            trainingId={training.id}
            baseActions={actions}
            defaultPurpose={defaultPurpose}
            onAdded={close}
            excludeActionIds={excludeIds}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
