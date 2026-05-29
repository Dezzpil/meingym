"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
  muscleId: number;
  onImageUploaded: () => void;
};

export function MuscleImagePasteArea({ muscleId, onImageUploaded }: Props) {
  const [isPasting, setIsPasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") === 0) {
          const file = items[i].getAsFile();
          if (!file) continue;

          if (file.type !== "image/gif" && file.type !== "image/png") {
            setError("Только GIF и PNG изображения разрешены");
            toast.error("Только GIF и PNG изображения разрешены");
            return;
          }

          if (file.size > 1024 * 1024 * 3) {
            setError("Размер изображения не должен превышать 3MB");
            toast.error("Размер изображения не должен превышать 3MB");
            return;
          }

          setIsPasting(true);
          setError(null);

          try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("muscleId", muscleId.toString());

            const response = await fetch("/api/muscle-images", {
              method: "POST",
              body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || "Ошибка загрузки изображения");
            }

            onImageUploaded();
            toast.success("Изображение успешно загружено");
          } catch (err: any) {
            setError(err.message || "Ошибка загрузки изображения");
            toast.error(err.message || "Ошибка загрузки изображения");
          } finally {
            setIsPasting(false);
          }

          event.preventDefault();
          break;
        }
      }
    },
    [muscleId, onImageUploaded],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  return (
    <div className="image-paste-area text-muted mb-2">
      <small>
        Вы можете вставить GIF или PNG изображение из буфера обмена (Ctrl+V).
        Максимальный размер: 3MB.
      </small>
      {isPasting && (
        <div className="mt-2">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <span className="ms-2">Загрузка изображения...</span>
        </div>
      )}
      {error && <div className="text-danger mt-2">{error}</div>}
    </div>
  );
}
