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
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Период тренировок</Card.Title>
        {currentPeriod ? (
          <div>
            <p>
              Текущий период: с{" "}
              {moment(currentPeriod.startDate).format(DateFormat)}
              {currentPeriod.endDate &&
                ` по ${moment(currentPeriod.endDate).format(DateFormat)}`}
            </p>
            <Button variant="outline-danger" onClick={handleEndPeriod}>
              Завершить период
            </Button>
          </div>
        ) : (
          <div>
            <p>У вас нет активного периода тренировок</p>
            <Button variant="primary" onClick={handleCreate}>
              Создать новый период
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
