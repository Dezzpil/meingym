"use client";

import type {
  Action,
  Muscle,
  ActionsOnMusclesAgony,
  ActionsOnMusclesSynergy,
  ActionsOnMusclesStabilizer,
  ExerciseImage,
} from "@prisma/client";
import { useForm } from "react-hook-form";
import { ActionsFormFieldsType } from "@/app/actions/types";
import { useState, useRef, useEffect, useCallback } from "react";
import { handleUpdate } from "@/app/actions/actions";
import { ActionRig } from "@prisma/client";
import { ActionImagePasteArea } from "@/app/actions/components/ActionImagePasteArea";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

type Props = {
  muscles: Array<Muscle & { Group: { title: string } }>;
  action: Action & {
    MusclesSynergy: ActionsOnMusclesAgony[];
    MusclesAgony: ActionsOnMusclesSynergy[];
    MusclesStabilizer: ActionsOnMusclesStabilizer[];
    ExerciseImages?: ExerciseImage[];
  };
  control?: boolean;
};

export default function ActionForm({ muscles, action, control }: Props) {
  const [error, setError] = useState<null | string>(null);
  const [handling, setHandling] = useState<boolean>(false);
  const [images, setImages] = useState<ExerciseImage[]>(
    action.ExerciseImages || [],
  );
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
  const imgTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Define fetchImages with useCallback to avoid recreation on each render
  const fetchImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      const response = await fetch(`/api/images?actionId=${action.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }
      const data = await response.json();
      setImages(data.images);
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      setIsLoadingImages(false);
    }
  }, [action.id]);

  // Fetch images when component mounts
  useEffect(() => {
    if (action.ExerciseImages) {
      setImages(action.ExerciseImages);
    } else {
      fetchImages();
    }
  }, [action.ExerciseImages, fetchImages]);

  const form = useForm<ActionsFormFieldsType>({
    defaultValues: action,
    disabled: !control,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    setHandling(true);
    try {
      await handleUpdate(action.id, data);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    }
    setHandling(false);
  });

  const handleImageUploaded = () => {
    // Refresh images list
    fetchImages();
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      const response = await fetch(`/api/images?id=${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Remove the deleted image from state
      setImages(images.filter((img) => img.id !== imageId));
      toast.success("Изображение удалено");
    } catch (err: any) {
      console.error("Error deleting image:", err);
      toast.error(err.message || "Ошибка при удалении изображения");
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    try {
      const response = await fetch(`/api/images?id=${imageId}&setMain=true`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to set main image");
      }

      // Update images in state
      const updatedImages = images.map((img) => ({
        ...img,
        isMain: img.id === imageId,
      }));

      setImages(updatedImages);
      toast.success("Главное изображение установлено");
    } catch (err: any) {
      console.error("Error setting main image:", err);
      toast.error(err.message || "Ошибка при установке главного изображения");
    }
  };
  return (
    <>
      <Toaster position="top-right" />
      <form onSubmit={onSubmit} className="form">
        <div className="mb-2">
          <label className="form-label">Название</label>
          <input
            className="form-control"
            {...form.register("title", { required: true })}
          />
        </div>
        <div className="row row-cols-lg-auto g-3 align-items-center mb-2">
          <div className="col-12">
            <div className="form-check">
              <input
                type="checkbox"
                id="strengthAllowed"
                className="form-check-input"
                {...form.register("strengthAllowed", {})}
              />
              <label htmlFor="strengthAllowed" className="form-check-label">
                Допустимо выполнение на силу?
              </label>
            </div>
          </div>
          <div className="col-12">
            <div className="form-check col-auto">
              <input
                type="checkbox"
                id="bigCount"
                className="form-check-input"
                {...form.register("bigCount", {})}
              />
              <label htmlFor="bigCount" className="form-check-label">
                Многоповторное?
              </label>
            </div>
          </div>
          <div className="col-12">
            <div className="form-check col-auto">
              <input
                type="checkbox"
                id="allowCheating"
                className="form-check-input"
                {...form.register("allowCheating", {})}
              />
              <label htmlFor="allowCheating" className="form-check-label">
                Позволяет читинг?
              </label>
            </div>
          </div>
        </div>
        <div className="mb-2">
          <label className="form-label">Мышцы-агонисты</label>
          <select
            multiple
            className="form-control"
            {...form.register("musclesAgonyIds", { valueAsNumber: true })}
          >
            {muscles.map((m) => (
              <option
                key={m.id}
                value={m.id}
                selected={
                  action &&
                  action.MusclesAgony.reduce((prev, curr) => {
                    return prev || curr.muscleId === m.id;
                  }, false)
                }
              >
                {m.Group.title}: {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Мышцы-синергисты</label>
          <select
            multiple
            className="form-control"
            {...form.register("musclesSynergyIds", { valueAsNumber: true })}
          >
            {muscles.map((m) => (
              <option
                key={m.id}
                value={m.id}
                selected={
                  action &&
                  action.MusclesSynergy.reduce((prev, curr) => {
                    return prev || curr.muscleId === m.id;
                  }, false)
                }
              >
                {m.Group.title}: {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Мышцы-стабилизаторы</label>
          <select
            multiple
            className="form-control"
            {...form.register("musclesStabilizerIds", { valueAsNumber: true })}
          >
            {muscles.map((m) => (
              <option
                key={m.id}
                value={m.id}
                selected={
                  action &&
                  action.MusclesStabilizer.reduce((prev, curr) => {
                    return prev || curr.muscleId === m.id;
                  }, false)
                }
              >
                {m.Group.title}: {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Отягощение</label>
          <select className="form-control" {...form.register("rig")}>
            {[
              { value: ActionRig.BLOCKS, label: "Блочное" },
              { value: ActionRig.BARBELL, label: "Со штангой" },
              { value: ActionRig.DUMBBELL, label: "С гантелей" },
              { value: ActionRig.OTHER, label: "С собственным весом" },
            ].map((opt) => (
              <option value={opt.value} key={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>{" "}
        <div className="mb-2">
          <label className="form-label">Описание</label>
          <textarea
            className="form-control"
            {...form.register("desc", { required: false })}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Изображения</label>
          <textarea
            className="form-control"
            placeholder={"Ctrl+V изображение сюда"}
            name={"images"}
            id={"images"}
            ref={imgTextareaRef}
          />

          {/* Display existing images */}
          {images.length > 0 && (
            <div className="mt-3 mb-3">
              <label className="form-label">Изображения упражнения</label>
              <div className="row g-2">
                {images.map((image) => (
                  <div key={image.id} className="col-md-4 col-sm-6">
                    <div className="card h-100">
                      <img
                        src={image.path}
                        className="card-img-top"
                        alt="Изображение упражнения"
                        style={{ maxHeight: "150px", objectFit: "contain" }}
                      />
                      <div className="card-body d-flex flex-column">
                        <p className="card-text small text-muted mb-2">
                          {new Date(image.createdAt).toLocaleDateString()}
                          {image.isMain && (
                            <span className="badge bg-primary ms-2">
                              Главное
                            </span>
                          )}
                        </p>
                        {control && (
                          <div className="d-flex gap-2 mt-auto">
                            {!image.isMain && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleSetMainImage(image.id)}
                              >
                                Сделать главным
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteImage(image.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoadingImages && (
            <div className="d-flex justify-content-center my-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
            </div>
          )}

          {control && (
            <ActionImagePasteArea
              actionId={action.id}
              onImageUploaded={handleImageUploaded}
            />
          )}
        </div>
        <div className="mb-2">
          <label className="form-label">Другие названия</label>
          <textarea
            className="form-control"
            {...form.register("anotherTitles", { required: false })}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Сокращенное название</label>
          <input
            className="form-control"
            {...form.register("alias", { required: false })}
          />
        </div>
        {control && (
          <>
            <div className="mb-2">
              <button className="btn btn-success" disabled={handling}>
                Сохранить
              </button>
            </div>
            {error && <div className="mb-2 alert alert-danger">{error}</div>}
          </>
        )}
      </form>
    </>
  );
}
