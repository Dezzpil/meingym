"use client";

import React, { useState } from "react";
import {
  ProgressionStrategySimpleOptsDefaults,
  ProgressionStrategySimpleOptsType,
} from "@/core/progression/strategy/simple";
import { Button, Form } from "react-bootstrap";
import { handleUpdateProgressionStrategySimpleOpts } from "@/app/trainings/periods/actions";
import { ProgressionStrategySimpleOpts } from "@prisma/client";

type Props = {
  item: ProgressionStrategySimpleOpts;
};

export function SimpleProgressionOptsForm({ item }: Props) {
  const data: ProgressionStrategySimpleOptsType = {
    lossCountMax: item.lossCountMax,
    lossCountStep: item.lossCountStep,
    lossMaxSets: item.lossMaxSets,
    lossWeightDelta: item.lossWeightDelta,
    massAddDropSet: item.massAddDropSet,
    massBigCountCoef: item.massBigCountCoef,
    massSetsCount: item.massSetsCount,
    massWeightDelta: item.massWeightDelta,
    strengthWeightDelta: item.strengthWeightDelta,
    strengthPrepareSetsCount: item.strengthPrepareSetsCount,
    strengthWorkingSetsCount: item.strengthWorkingSetsCount,
  };
  const [formData, setFormData] = useState<ProgressionStrategySimpleOptsType>(
    data || ProgressionStrategySimpleOptsDefaults,
  );
  const [handling, setHandling] = useState<boolean>(false);
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

  const handleSubmit = async () => {
    setHandling(true);
    await handleUpdateProgressionStrategySimpleOpts(item.id, formData);
    setHandling(false);
  };

  return (
    <Form className="mb-3">
      <h5>Параметры прогрессии нагрузок</h5>
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
        <Form.Label>Количество подготовительных подходов (сила)</Form.Label>
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
          Коэффициент для упражнений с большим количеством повторений (масса){" "}
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
      <div className="d-flex justify-content-end">
        <Button variant="primary" onClick={handleSubmit} disabled={handling}>
          Сохранить
        </Button>
      </div>
    </Form>
  );
}
