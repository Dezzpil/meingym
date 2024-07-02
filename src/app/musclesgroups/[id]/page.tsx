import { prisma } from "@/tools/db";
import Link from "next/link";
import classNames from "classnames";
import { MuscleGroupsDescForm } from "@/app/musclesgroups/[id]/components/MuscleGroupsDescForm";
import MusclesGroupsButtons from "@/app/musclesgroups/[id]/components/MusclesGroupsButtons";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";

type Props = {
  params: { id: string };
};

export default async function MusclesGroupsIdPage({ params }: Props) {
  const id = parseInt(params.id);
  const user = await getCurrentUser();
  const group = await prisma.muscleGroup.findUniqueOrThrow({
    where: { id },
    include: {
      MuscleGroupDesc: { orderBy: { createdAt: "asc" } },
      Muscle: {
        include: {
          AgonyInActions: true,
          SynergyInActions: true,
        },
      },
    },
  });
  return (
    <>
      <h2 className="mb-3">Мышечная группа: {group.title}</h2>
      {group.Muscle.length ? (
        <ul className="list-group mb-3">
          {group.Muscle.map((m) => (
            <li
              className="list-group-item hstack justify-content-between"
              key={m.id}
            >
              <Link href={`/muscles/${m.id}`}>{m.title}</Link>
              <div className="hstack gap-2">
                <span
                  title="Агонист"
                  className={classNames(
                    "badge",
                    m.AgonyInActions.length
                      ? "text-bg-primary"
                      : "text-bg-secondary",
                  )}
                >
                  {m.AgonyInActions.length}
                </span>
                <span
                  title="Синергист"
                  className={classNames(
                    "badge",
                    m.SynergyInActions.length
                      ? "text-bg-primary"
                      : "text-bg-secondary",
                  )}
                >
                  {m.SynergyInActions.length}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-muted">Мышцы еще не добавлены...</p>
      )}
      {group.MuscleGroupDesc.map((desc) => (
        <MuscleGroupsDescForm
          group={group}
          desc={desc}
          key={desc.id}
          control={user.role === UserRole.ADMIN}
        />
      ))}
      {user.role === UserRole.ADMIN && (
        <>
          <MuscleGroupsDescForm group={group} />
          <MusclesGroupsButtons id={group.id} />
        </>
      )}
    </>
  );
}
