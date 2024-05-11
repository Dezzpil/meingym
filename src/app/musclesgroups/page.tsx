import Link from "next/link";
import { prisma } from "@/tools/db";

export default async function MusclesGroupsPage() {
  const data = await prisma.muscleGroup.findMany({ include: { Muscle: true } });

  return (
    <>
      <div className="mb-3">
        <Link className="btn btn-primary" href={`/musclesgroups/create`}>
          Добавить группу мышц
        </Link>
      </div>
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
