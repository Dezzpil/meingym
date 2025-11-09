"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { ExerciseImage } from "@prisma/client";
import { ActionExistingImages } from "@/app/actions/components/ActionExistingImages";
import { ActionImagePasteArea } from "@/app/actions/components/ActionImagePasteArea";
import toast from "react-hot-toast";

type Props = {
  actionId: number;
  control?: boolean;
  initialImages?: ExerciseImage[];
};

export function ActionImagesSection({ actionId, control, initialImages }: Props) {
  const [images, setImages] = useState<ExerciseImage[]>(initialImages || []);
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
  const imgTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      const response = await fetch(`/api/images?actionId=${actionId}`);
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
  }, [actionId]);

  useEffect(() => {
    if (!initialImages) {
      fetchImages();
    } else {
      setImages(initialImages);
    }
  }, [initialImages, fetchImages]);

  const handleImageUploaded = () => {
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
    <div className="mb-2">
      <label className="form-label">Изображения</label>
      {/* Optional textarea as visual paste target (not required for functionality) */}
      <textarea
        className="form-control"
        placeholder={"Ctrl+V изображение сюда"}
        name={"images"}
        id={"images"}
        ref={imgTextareaRef}
      />

      <ActionExistingImages
        images={images}
        control={control}
        onSetMain={handleSetMainImage}
        onDelete={handleDeleteImage}
      />

      {isLoadingImages && (
        <div className="d-flex justify-content-center my-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      )}

      {control && (
        <ActionImagePasteArea actionId={actionId} onImageUploaded={handleImageUploaded} />
      )}
    </div>
  );
}
