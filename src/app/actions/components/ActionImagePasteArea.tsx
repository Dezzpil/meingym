"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type ImagePasteAreaProps = {
  actionId: number;
  onImageUploaded: () => void;
};

export function ActionImagePasteArea({
  actionId,
  onImageUploaded,
}: ImagePasteAreaProps) {
  const [isPasting, setIsPasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      // Look for image items in clipboard
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") === 0) {
          const file = items[i].getAsFile();
          if (!file) continue;

          console.log(file);
          // Check if it's a GIF or PNG
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
            // Create form data for upload
            const formData = new FormData();
            formData.append("file", file);
            formData.append("actionId", actionId.toString());

            // Upload the image
            const response = await fetch("/api/images", {
              method: "POST",
              body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || "Ошибка загрузки изображения");
            }

            // Call the callback with the image path
            onImageUploaded();
            toast.success("Изображение успешно загружено");
          } catch (err: any) {
            setError(err.message || "Ошибка загрузки изображения");
            toast.error(err.message || "Ошибка загрузки изображения");
          } finally {
            setIsPasting(false);
          }

          // Prevent default paste behavior
          event.preventDefault();
          break;
        }
      }
    },
    [actionId, onImageUploaded],
  );

  useEffect(() => {
    // Add paste event listener to the document
    document.addEventListener("paste", handlePaste);

    // Clean up
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  return (
    <div className="image-paste-area mb-2">
      <div className="alert alert-info">
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
    </div>
  );
}
