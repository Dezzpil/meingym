"use client";

import { DayMouseEventHandler, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useMemo, useState, useTransition } from "react";
import moment from "moment";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DateFormat } from "@/tools/dates";
import { handleCreateTraining } from "@/app/trainings/create/actions";

import { ru } from "date-fns/locale";

function getHashKey(date: Date) {
  return moment(date).format("YYYYMMDD");
}

type Props = {
  trainings: { id: number; plannedTo: Date; completedAt: Date | null }[];
};

export function TrainingsPicker({ trainings }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentMonth = useMemo(() => {
    const m = searchParams.get("month");
    const y = searchParams.get("year");
    if (m && y) {
      return new Date(parseInt(y), parseInt(m) - 1);
    }
    return new Date();
  }, [searchParams]);

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

  const handleMonthChange = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", (date.getMonth() + 1).toString());
    params.set("year", date.getFullYear().toString());
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className={isPending ? "opacity-50" : ""}>
      <DayPicker
        locale={ru}
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
        month={currentMonth}
        onMonthChange={handleMonthChange}
      />
    </div>
  );
}
