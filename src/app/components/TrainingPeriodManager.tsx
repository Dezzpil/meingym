"use client";

import React, { useState } from "react";
import { Button, Card, Modal, Form } from "react-bootstrap";
import moment from "moment";
import { DateFormat } from "@/tools/dates";
import { TrainingPeriod } from "@prisma/client";
import {
  ProgressionStrategySimpleOptsType,
  ProgressionStrategySimpleOptsDefaults,
} from "@/core/progression/strategy/simple";
import {
  createTrainingPeriodAction,
  endTrainingPeriodAction,
} from "@/app/actions/training-period";

interface TrainingPeriodManagerProps {
  currentPeriod: TrainingPeriod | null;
  progressionOpts?: ProgressionStrategySimpleOptsType | null;
  userId: string;
}

export default function TrainingPeriodManager({
  currentPeriod,
  progressionOpts,
  userId,
}: TrainingPeriodManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ProgressionStrategySimpleOptsType>(
    progressionOpts || ProgressionStrategySimpleOptsDefaults,
  );

  const handleCreatePeriod = async () => {
    try {
      const result = await createTrainingPeriodAction(userId, formData);
      if (result.success) {
        setShowModal(false);
      } else {
        console.error("Error creating training period:", result.error);
      }
    } catch (error) {
      console.error("Error creating training period:", error);
    }
  };

  const handleEndPeriod = async () => {
    try {
      const result = await endTrainingPeriodAction(userId);
      if (!result.success) {
        console.error("Error ending training period:", result.error);
      }
    } catch (error) {
      console.error("Error ending training period:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    });
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
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Создать новый период
            </Button>
          </div>
        )}
      </Card.Body>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Создание периода тренировок</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <h5>Параметры стратегии прогрессии</h5>
            <Form.Group className="mb-3">
              <Form.Label>Количество рабочих подходов (сила)</Form.Label>
              <Form.Control
                type="number"
                name="strengthWorkingSetsCount"
                value={formData.strengthWorkingSetsCount}
                onChange={handleInputChange}
                min={1}
                max={4}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Количество подготовительных подходов (сила)
              </Form.Label>
              <Form.Control
                type="number"
                name="strengthPrepareSetsCount"
                value={formData.strengthPrepareSetsCount}
                onChange={handleInputChange}
                min={1}
                max={4}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Шаг увеличения веса (сила)</Form.Label>
              <Form.Control
                type="number"
                name="strengthWeightDelta"
                value={formData.strengthWeightDelta}
                onChange={handleInputChange}
                min={1.25}
                max={5}
                step={1.25}
              />
            </Form.Group>
            <hr />
            <Form.Group className="mb-3">
              <Form.Label>Количество подходов (масса)</Form.Label>
              <Form.Control
                type="number"
                name="massSetsCount"
                value={formData.massSetsCount}
                onChange={handleInputChange}
                min={1}
                max={10}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Добавлять дроп-сет (масса)"
                name="massAddDropSet"
                checked={formData.massAddDropSet}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Коэффициент для упражнений с большим количеством повторений
                (масса){" "}
              </Form.Label>
              <Form.Control
                type="number"
                name="massBigCountCoef"
                value={formData.massBigCountCoef}
                onChange={handleInputChange}
                min={1}
                max={3}
                step={0.1}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Шаг увеличения веса (масса)</Form.Label>
              <Form.Control
                type="number"
                name="massWeightDelta"
                value={formData.massWeightDelta}
                onChange={handleInputChange}
                min={1.25}
                max={5}
                step={1.25}
              />
            </Form.Group>
            <hr />
            <Form.Group className="mb-3">
              <Form.Label>Шаг увеличения повторений (снижение веса)</Form.Label>
              <Form.Control
                type="number"
                name="lossCountStep"
                value={formData.lossCountStep}
                onChange={handleInputChange}
                min={1}
                max={5}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Максимум повторений (вес)</Form.Label>
              <Form.Control
                type="number"
                name="lossCountMax"
                value={formData.lossCountMax}
                onChange={handleInputChange}
                min={10}
                max={20}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Максимум подходов (вес)</Form.Label>
              <Form.Control
                type="number"
                name="lossMaxSets"
                value={formData.lossMaxSets}
                onChange={handleInputChange}
                min={3}
                max={8}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Шаг увеличения веса (вес)</Form.Label>
              <Form.Control
                type="number"
                name="lossWeightDelta"
                value={formData.lossWeightDelta}
                onChange={handleInputChange}
                min={1.25}
                max={5}
                step={1.25}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleCreatePeriod}>
            Создать
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
