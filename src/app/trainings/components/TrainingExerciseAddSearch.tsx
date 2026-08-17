"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { debounce } from "@/tools/func";
import { ActionMuscles } from "@/app/actions/components/ActionMuscles";
import { ActionWithMusclesType } from "@/app/actions/types";
import { ActionRequire, ActionRig, Purpose } from "@prisma/client";
import { CurrentPurpose } from "@/core/types";
import { handleAddExercise } from "@/app/trainings/exercises/actions";
import { BiPlus } from "react-icons/bi";

type Props = {
  trainingId: number;
  baseActions: ActionWithMusclesType[];
  defaultPurpose: CurrentPurpose;
  equipmentRigs: ActionRig[];
  equipmentRequires: ActionRequire[];
  onAdded?: () => void;
  excludeActionIds?: number[]; // optionally exclude some actions
};

export function TrainingExerciseAddSearch({
  trainingId,
  baseActions,
  defaultPurpose,
  equipmentRigs = [],
  equipmentRequires = [],
  onAdded,
  excludeActionIds = [],
}: Props) {
  const filteredBase = useMemo(() => {
    if (!excludeActionIds?.length) return baseActions;
    const exclude = new Set(excludeActionIds);
    return baseActions.filter((a) => !exclude.has(a.id));
  }, [baseActions, excludeActionIds]);

  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionWithMusclesType[]>(
    filteredBase.slice(0, 10),
  );
  const [purpose, setPurpose] = useState<Purpose>(defaultPurpose);
  const [addingId, setAddingId] = useState<number | null>(null);

  const search = async (e: any) => {
    setError(null);
    setSearching(true);
    const term = encodeURIComponent(e.target.value);
    if (term) {
      const url = `/api/actions/search?term=${term}`;
      const result = await fetch(
        [
          url,
          `rigs=${equipmentRigs.join(",")}`,
          `requires=${equipmentRequires.join(",")}`,
        ].join("&"),
      );
      if (result.ok) {
        const items =
          (await result.json()) as unknown as ActionWithMusclesType[];
        // If exclude list provided, filter it out
        const exclude = new Set(excludeActionIds);
        setActions(items.filter((a) => !exclude.has(a.id)));
      } else {
        setActions([]);
        setError(result.statusText);
      }
    } else {
      setActions(filteredBase.slice(0, 10));
    }
    setSearching(false);

    console.log(actions);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useCallback(debounce(search, 1000), [
    filteredBase,
    excludeActionIds,
  ]);

  const onPurposeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value as Purpose;
      setPurpose(val);
    },
    [],
  );

  const handleSelect = useCallback(
    async (e: any) => {
      console.log("handling select");
      try {
        setError(null);
        const elem = e.target;
        let actionId: number | null = null;
        let action: ActionWithMusclesType | undefined;
        if (elem instanceof HTMLAnchorElement) {
          actionId = Number(elem.dataset["id"]);
          action = actions.find((a) => a.id === actionId);
        }
        console.log(actionId);
        console.log(action);
        console.log(actions);
        if (!actionId) return;

        setAddingId(actionId);

        // If strength not allowed, fallback from STRENGTH to MASS
        const finalPurpose =
          purpose === Purpose.STRENGTH && action && !action.strengthAllowed
            ? Purpose.MASS
            : purpose;

        console.log("requesting");
        const result = await handleAddExercise(trainingId, {
          actionId: actionId,
          purpose: finalPurpose,
        } as any);
        if (result && !(result as any).ok) {
          setError((result as any).error);
        } else {
          onAdded && onAdded();
        }
      } catch (err: any) {
        setError(err.message || "Произошла ошибка при добавлении упражнения");
      } finally {
        setAddingId(null);
      }
    },
    [actions, onAdded, purpose, trainingId],
  );

  return (
    <>
      <div className="d-flex gap-2 mb-2">
        <Form.Control
          type="text"
          placeholder="Введите название ..."
          autoFocus
          onChange={onChange}
        />
        <Form.Select
          value={purpose}
          onChange={onPurposeChange}
          style={{ maxWidth: 220 }}
        >
          <option value={Purpose.MASS}>На массу</option>
          <option value={Purpose.LOSS}>На снижение веса</option>
          <option value={Purpose.STRENGTH}>На силу</option>
        </Form.Select>
      </div>
      {searching ? (
        <Spinner size="sm" />
      ) : (
        <>
          {error && <div className="alert alert-danger">{error}</div>}
          {actions.length ? (
            <ul className="list-group mb-2">
              {actions.slice(0, 50).map((a) => (
                <li className="list-group-item" key={a.id}>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bolder d-inline-flex gap-1 align-items-baseline flex-column">
                        {a.alias ? a.alias : a.title}{" "}
                        <span className="badge bg-secondary fw-normal">
                          База: {a.base}
                        </span>
                      </span>
                      <a
                        href="#"
                        onClick={handleSelect}
                        data-id={a.id}
                        data-name={a.alias ? a.alias : a.title}
                        className="btn btn-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: 44,
                          height: 44,
                          right: 3,
                          bottom: 3,
                          zIndex: 1050,
                        }}
                      >
                        {addingId === a.id ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            aria-hidden="true"
                          ></span>
                        ) : (
                          <BiPlus size={24} data-id={a.id} />
                        )}
                      </a>
                    </div>
                  </div>
                  <div>
                    <ActionMuscles action={a} short />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-2"></p>
          )}
        </>
      )}
    </>
  );
}
