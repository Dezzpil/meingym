"use client";

import { Form, Spinner } from "react-bootstrap";
import React, { useCallback, useState } from "react";
import { debounce } from "@/tools/func";
import { ActionMuscles } from "@/app/actions/components/ActionMuscles";
import { ActionWithMusclesType } from "@/app/actions/types";
type Props = {
  baseActions: ActionWithMusclesType[];
  onClick: CallableFunction;
};
export function TrainingExerciseSearch({ baseActions, onClick }: Props) {
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionWithMusclesType[]>(baseActions);

  const search = async (e: any) => {
    setActions([]);
    setError(null);
    setSearching(true);
    const term = encodeURIComponent(e.target.value);
    if (term) {
      const result = await fetch(`/api/actions/search?term=${term}`);
      if (result.ok) {
        const items =
          (await result.json()) as unknown as ActionWithMusclesType[];
        setActions(items);
      } else {
        setActions([]);
        setError(result.statusText);
      }
    } else {
      setActions(baseActions);
    }
    setSearching(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useCallback(debounce(search, 1000), []);

  const onClickCallback = useCallback(
    (e: any) => {
      onClick(e);
    },
    [onClick],
  );

  return (
    <>
      <Form.Control
        type="text"
        placeholder="Введите название ..."
        autoFocus
        onChange={onChange}
        className="mb-2"
      />
      {searching ? (
        <Spinner size="sm" />
      ) : (
        <>
          {actions.length ? (
            <ul className="list-group mb-2">
              {actions.map((a) => (
                <li className="list-group-item" key={a.id}>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between">
                      <span className="fw-bolder">
                        {a.alias ? a.alias : a.title}
                      </span>
                      <a
                        href="#"
                        onClick={onClickCallback}
                        data-id={a.id}
                        data-name={a.alias ? a.alias : a.title}
                      >
                        Выбрать
                      </a>
                    </div>
                    {a.search && (
                      <div className="text-muted small">{a.search}</div>
                    )}
                  </div>
                  <div className="small">
                    <ActionMuscles action={a} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-2">Движения не найдены</p>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
        </>
      )}
    </>
  );
}
