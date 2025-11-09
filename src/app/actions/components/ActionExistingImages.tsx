"use client";

import Image from "next/image";
import type { ExerciseImage } from "@prisma/client";

type Props = {
  images: ExerciseImage[];
  control?: boolean;
  onSetMain?: (imageId: number) => void;
  onDelete?: (imageId: number) => void;
};

export function ActionExistingImages({
  images,
  control,
  onSetMain,
  onDelete,
}: Props) {
  if (!images || images.length === 0) return null;

  return (
    <div>
      <div className="row g-2">
        {images.map((image) => (
          <div key={image.id} className="col-md-4 col-sm-6">
            <div className="card h-100">
              <Image
                src={image.path}
                alt={""}
                className="card-img-top"
                style={{ maxHeight: "150px", objectFit: "contain" }}
                width={150}
                height={150}
                unoptimized
              />
              <div className="card-body d-flex flex-column">
                <p className="card-text small text-muted mb-2">
                  {new Date(image.createdAt).toLocaleDateString()}
                  {image.isMain && (
                    <span className="badge bg-primary ms-2">Главное</span>
                  )}
                </p>
                {control && (
                  <div className="d-flex gap-2 mt-auto">
                    {!image.isMain && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onSetMain?.(image.id)}
                      >
                        Сделать главным
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete?.(image.id)}
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
  );
}
