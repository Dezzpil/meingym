import MuscleForm from "@/app/muscles/components/MuscleForm";
import { ItemPageParams } from "@/tools/types";
import { prisma } from "@/tools/db";
import { MuscleDescForm } from "@/app/muscles/[id]/components/MuscleDescForm";
import { MuscleInActions } from "@/app/muscles/[id]/components/MuscleInActions";
import { MuscleImagesSection } from "@/app/muscles/[id]/components/MuscleImagesSection";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from "@prisma/client";
import Image from "next/image";

export default async function MusclePage({ params }: ItemPageParams) {
  const user = await getCurrentUser();
  const groups = await prisma.muscleGroup.findMany();
  const muscle = await prisma.muscle.findUniqueOrThrow({
    where: { id: parseInt(params.id) },
    include: {
      MuscleDesc: { orderBy: { createdAt: "asc" } },
      AgonyInActions: { include: { Action: true } },
      SynergyInActions: { include: { Action: true } },
      MuscleImages: { orderBy: [{ isMain: "desc" }, { createdAt: "desc" }] },
    },
  });
  const mainImage =
    muscle.MuscleImages.find((img) => img.isMain) ?? muscle.MuscleImages[0];

  const priorityLabel =
    muscle.priorityRank === 3
      ? "Главная цель"
      : muscle.priorityRank === 2
        ? "Вспомогательная"
        : "Стабилизатор/добивка";

  return (
    <>
      <h2 className="mb-3">
        {muscle.title} мышца
        {muscle.titleEn && (
          <span className="text-muted fs-6 ms-2">{muscle.titleEn}</span>
        )}
      </h2>
      <div className="mb-3 d-flex gap-2">
        <span className="badge text-bg-primary">
          Приоритет: {muscle.priorityRank} ({priorityLabel})
        </span>
        <span className="badge text-bg-secondary">
          Размер: {muscle.sizeFactor}
        </span>
      </div>
      {mainImage && (
        <div className="mb-3">
          <Image
            src={mainImage.path}
            alt={muscle.title}
            width={400}
            height={400}
            style={{ maxHeight: "300px", width: "auto", objectFit: "contain" }}
            unoptimized
          />
        </div>
      )}
      <MuscleInActions muscle={muscle} />
      <MuscleForm
        groups={groups}
        muscle={muscle}
        control={user.role === UserRole.ADMIN}
      />
      <MuscleImagesSection
        muscleId={muscle.id}
        control={user.role === UserRole.ADMIN}
        initialImages={muscle.MuscleImages}
      />
      {muscle.MuscleDesc.map((desc) => (
        <MuscleDescForm
          muscle={muscle}
          desc={desc}
          key={desc.id}
          control={user.role === UserRole.ADMIN}
        />
      ))}
      {user.role === UserRole.ADMIN && (
        <MuscleDescForm
          muscle={muscle}
          control={user.role === UserRole.ADMIN}
        />
      )}
    </>
  );
}
