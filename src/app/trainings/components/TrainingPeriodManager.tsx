"use client";

import React from "react";
import { Button, Card } from "react-bootstrap";
import moment from "moment";
import { DateFormat } from "@/tools/dates";
import { TrainingPeriod } from "@prisma/client";
import {
  createTrainingPeriodAction,
  endTrainingPeriodAction,
} from "@/app/trainings/periods/actions";

interface TrainingPeriodManagerProps {
  currentPeriod: TrainingPeriod | null;
  userId: string;
}

export default function TrainingPeriodManager({
  currentPeriod,
  userId,
}: TrainingPeriodManagerProps) {
  const handleCreate = async () => {
    await createTrainingPeriodAction(userId);
  };

  const handleEndPeriod = async () => {
    await endTrainingPeriodAction(userId);
  };

  return (
    <div className="mb-3">
      <h5>Период тренировок</h5>
      {currentPeriod ? (
        <div>
          <span>
            Текущий период: с{" "}
            {moment(currentPeriod.startDate).format(DateFormat)}
            {currentPeriod.endDate &&
              ` по ${moment(currentPeriod.endDate).format(DateFormat)}`}
            .
          </span>
          <br />
          <span className="pointer text-danger" onClick={handleEndPeriod}>
            Завершить период
          </span>
        </div>
      ) : (
        <div>
          <span>У вас нет активного периода тренировок.</span>
          <br />
          <span className="pointer text-primary" onClick={handleCreate}>
            Создать новый период
          </span>
        </div>
      )}
    </div>
  );
}
