import Link from "next/link";
import { prisma } from "@/tools/db";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from ".prisma/client";
export default async function MusclesPage() {
  const user = await getCurrentUser();
  const muscles = await prisma.muscle.findMany({
    include: {
      Group: true,
      AgonyInActions: true,
      SynergyInActions: true,
    },
  });

  return (
    <>
      {user.role === UserRole.ADMIN && (
        <div className="mb-3">
          <Link className="btn btn-primary" href={`/muscles/create`}>
            Добавить
          </Link>
        </div>
      )}

      {muscles.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Группа</th>
              <th>Агонист</th>
              <th>Синергист</th>
            </tr>
          </thead>
          <tbody>
            {muscles.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>
                  <Link href={`/muscles/${m.id}`}>{m.title}</Link>
                </td>
                <td>{m.Group.title}</td>
                <td>{m.AgonyInActions.length}</td>
                <td>{m.SynergyInActions.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">Список пуст</p>
      )}
    </>
  );
}
