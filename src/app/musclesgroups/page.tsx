import Link from "next/link";
import { prisma } from "@/tools/db";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";

export default async function MusclesGroupsPage() {
  const user = await getCurrentUser();
  const data = await prisma.muscleGroup.findMany({ include: { Muscle: true } });

  return (
    <>
      {user.role === UserRole.ADMIN && (
        <div className="mb-3">
          <Link className="btn btn-primary" href={`/musclesgroups/create`}>
            Добавить группу мышц
          </Link>
        </div>
      )}
      {data.length ? (
        <ul className="list-group">
          {data.map((d) => (
            <li className="list-group-item hstack gap-3" key={d.id}>
              <span>
                <Link href={`/musclesgroups/${d.id}`}>{d.title}</Link>
              </span>
              <span>включает {d.Muscle.length} мышц</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">Список пуст</p>
      )}
    </>
  );
}
