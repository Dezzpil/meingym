"use client";

import { DayMouseEventHandler, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useMemo, useState } from "react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { DateFormat } from "@/tools/dates";
import { handleCreateTraining } from "@/app/trainings/create/actions";

function getHashKey(date: Date) {
  return moment(date).format("YYYYMMDD");
}

type Props = {
  trainings: { id: number; plannedTo: Date; completedAt: Date | null }[];
};

export function TrainingsPicker({ trainings }: Props) {
  const [modifiersMap, dataMap] = useMemo(() => {
    const planned = new Set();
    const completed = new Set();
    const map: Record<string, any> = {};
    trainings.forEach((t) => {
      t.completedAt ? completed.add(t.plannedTo) : planned.add(t.plannedTo);
      // TODO поддержка нескольких тренировок за день
      map[getHashKey(t.plannedTo).toString()] = t;
    });
    return [
      {
        completed: Array.from(completed) as Date[],
        planned: Array.from(planned) as Date[],
      },
      map,
    ];
  }, [trainings]);

  const router = useRouter();

  const handleDayClick: DayMouseEventHandler = async (
    day,
    { planned, completed },
  ) => {
    if (planned || completed) {
      const key = getHashKey(day).toString();
      if (key in dataMap) {
        router.push(`/trainings/${dataMap[key].id}`);
      } else {
        alert(`Error: no ${key} in training map`);
      }
    } else {
      if (
        confirm(`Назначить тренировку на ${moment(day).format(DateFormat)}`)
      ) {
        const plannedTo = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          0,
          0,
          0,
        );
        await handleCreateTraining({ plannedTo });
      }
    }
  };

  const [selected, setSelected] = useState<Date>();
  return (
    <DayPicker
      numberOfMonths={1}
      mode="single"
      selected={selected}
      onSelect={setSelected}
      modifiers={modifiersMap}
      modifiersClassNames={{
        planned: "badge rounded-pill text-bg-success",
        completed: "badge rounded-pill text-bg-secondary",
      }}
      onDayClick={handleDayClick}
    />
  );
}
