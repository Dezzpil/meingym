"use client";

import { useCallback, useEffect, useState } from "react";
import type { MuscleImage } from "@prisma/client";
import { MuscleExistingImages } from "@/app/muscles/[id]/components/MuscleExistingImages";
import { MuscleImagePasteArea } from "@/app/muscles/[id]/components/MuscleImagePasteArea";
import toast from "react-hot-toast";

type Props = {
  muscleId: number;
  control?: boolean;
  initialImages?: MuscleImage[];
};

export function MuscleImagesSection({
  muscleId,
  control,
  initialImages,
}: Props) {
  const [images, setImages] = useState<MuscleImage[]>(initialImages || []);
  const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);

  const fetchImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      const response = await fetch(`/api/muscle-images?muscleId=${muscleId}`);
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
  }, [muscleId]);

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
      const response = await fetch(`/api/muscle-images?id=${imageId}`, {
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
      const response = await fetch(
        `/api/muscle-images?id=${imageId}&setMain=true`,
        { method: "PATCH" },
      );

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
      {control && (
        <MuscleImagePasteArea
          muscleId={muscleId}
          onImageUploaded={handleImageUploaded}
        />
      )}

      <MuscleExistingImages
        images={images}
        control={control}
        onSetMain={handleSetMainImage}
        onDelete={handleDeleteImage}
      />

      {isLoadingImages && (
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      )}
    </div>
  );
}
