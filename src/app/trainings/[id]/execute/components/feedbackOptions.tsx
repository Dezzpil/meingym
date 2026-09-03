import React from "react";
import { FaArrowTrendDown, FaArrowTrendUp } from "react-icons/fa6";
import {
  ExecutionCheating,
  ExecutionRating,
  ExecutionRefusing,
  ExecutionTechnique,
} from "@prisma/client";
import type { SegmentedSliderOption } from "@/components/SegmentedSlider";
import {
  CheatingOptions,
  RatingOptions,
  RefusingOptions,
  TechniqueOptions,
} from "@/app/trainings/[id]/execute/types";

export const ratingSliderOptions: SegmentedSliderOption<ExecutionRating>[] = [
  {
    value: ExecutionRating.EASY,
    label: "Легко",
    hint: RatingOptions[ExecutionRating.EASY],
    tone: "warning",
  },
  {
    value: ExecutionRating.OK,
    label: "ОК",
    hint: RatingOptions[ExecutionRating.OK],
    tone: "success",
  },
  {
    value: ExecutionRating.HARD,
    label: "Тяжело",
    hint: RatingOptions[ExecutionRating.HARD],
    tone: "warning",
  },
];

// техника + улучшение техники одним ползунком: ухудшилась / ОК / улучшилась
export type TechniqueSliderValue = "WORSE" | "OK" | "BETTER";

export const techniqueSliderOptions: SegmentedSliderOption<TechniqueSliderValue>[] =
  [
    {
      value: "WORSE",
      ariaLabel: "Ухудшилась",
      hint: TechniqueOptions[ExecutionTechnique.FLAW],
      tone: "warning",
      icon: <FaArrowTrendDown />,
    },
    {
      value: "OK",
      label: "ОК",
      hint: "Техника как обычно",
      tone: "secondary",
    },
    {
      value: "BETTER",
      ariaLabel: "Улучшилась",
      hint: "Техника стала лучше",
      tone: "success",
      icon: <FaArrowTrendUp />,
    },
  ];

export const refusingSliderOptions: SegmentedSliderOption<ExecutionRefusing>[] =
  [
    {
      value: ExecutionRefusing.SOON,
      label: "Близко",
      hint: RefusingOptions[ExecutionRefusing.SOON],
      tone: "warning",
    },
    {
      value: ExecutionRefusing.NO,
      label: "Нет",
      hint: RefusingOptions[ExecutionRefusing.NO],
      tone: "success",
    },
    {
      value: ExecutionRefusing.YES,
      label: "Отказ",
      hint: RefusingOptions[ExecutionRefusing.YES],
      tone: "warning",
    },
  ];

export const cheatingSliderOptions: SegmentedSliderOption<ExecutionCheating>[] =
  [
    {
      value: ExecutionCheating.NO,
      label: "Без",
      hint: CheatingOptions[ExecutionCheating.NO],
      tone: "success",
    },
    {
      value: ExecutionCheating.PART,
      label: "Частично",
      hint: CheatingOptions[ExecutionCheating.PART],
      tone: "warning",
    },
    {
      value: ExecutionCheating.FULL,
      label: "Полный",
      hint: CheatingOptions[ExecutionCheating.FULL],
      tone: "warning",
    },
  ];
