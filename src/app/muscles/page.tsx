import Link from "next/link";
import { prisma } from "@/tools/db";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from "@prisma/client";

type SortField =
  | "priorityRank"
  | "sizeFactor"
  | "agonyCount"
  | "synergyCount";

type SortOrder = "asc" | "desc";

const SORT_FIELDS: SortField[] = [
  "priorityRank",
  "sizeFactor",
  "agonyCount",
  "synergyCount",
];

const DEFAULT_SORT: SortField = "priorityRank";
const DEFAULT_ORDER: SortOrder = "desc";

function sortMuscles(
  muscles: any[],
  sort: SortField,
  order: SortOrder,
): any[] {
  const dir = order === "asc" ? 1 : -1;
  return [...muscles].sort((a, b) => {
    let av: number;
    let bv: number;
    switch (sort) {
      case "agonyCount":
        av = a.AgonyInActions.length;
        bv = b.AgonyInActions.length;
        break;
      case "synergyCount":
        av = a.SynergyInActions.length;
        bv = b.SynergyInActions.length;
        break;
      default:
        av = a[sort];
        bv = b[sort];
    }
    if (av === bv) return 0;
    return av < bv ? -dir : dir;
  });
}

function SortLink({
  field,
  currentSort,
  currentOrder,
  children,
}: {
  field: SortField;
  currentSort: SortField;
  currentOrder: SortOrder;
  children: React.ReactNode;
}) {
  const isActive = currentSort === field;
  const nextOrder: SortOrder =
    isActive && currentOrder === "desc" ? "asc" : "desc";
  const params = new URLSearchParams();
  params.set("sort", field);
  params.set("order", nextOrder);
  return (
    <Link
      href={`?${params.toString()}`}
      className="text-decoration-none text-reset d-inline-flex align-items-center gap-1"
    >
      {children}
      {isActive && (
        <span className="text-muted">
          {currentOrder === "desc" ? "↓" : "↑"}
        </span>
      )}
    </Link>
  );
}

type Props = {
  searchParams: { sort?: string; order?: string };
};

export default async function MusclesPage({ searchParams }: Props) {
  const user = await getCurrentUser();

  const sort: SortField = SORT_FIELDS.includes(
    searchParams.sort as SortField,
  )
    ? (searchParams.sort as SortField)
    : DEFAULT_SORT;
  const order: SortOrder =
    searchParams.order === "asc" ? "asc" : DEFAULT_ORDER;

  const muscles = await prisma.muscle.findMany({
    include: {
      Group: true,
      AgonyInActions: true,
      SynergyInActions: true,
    },
  });

  const sortedMuscles = sortMuscles(muscles, sort, order);

  return (
    <>
      {user.role === UserRole.ADMIN && (
        <div className="mb-3">
          <Link className="btn btn-primary" href={`/muscles/create`}>
            Добавить мышцу
          </Link>
        </div>
      )}

      {sortedMuscles.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Англ.</th>
              <th>Группа</th>
              <th>
                <SortLink
                  field="priorityRank"
                  currentSort={sort}
                  currentOrder={order}
                >
                  Ранг
                </SortLink>
              </th>
              <th>
                <SortLink
                  field="sizeFactor"
                  currentSort={sort}
                  currentOrder={order}
                >
                  Размер
                </SortLink>
              </th>
              <th>
                <SortLink
                  field="agonyCount"
                  currentSort={sort}
                  currentOrder={order}
                >
                  Агонист
                </SortLink>
              </th>
              <th>
                <SortLink
                  field="synergyCount"
                  currentSort={sort}
                  currentOrder={order}
                >
                  Синергист
                </SortLink>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMuscles.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>
                  <Link href={`/muscles/${m.id}`}>{m.title}</Link>
                </td>
                <td className="text-muted">{m.titleEn ?? "—"}</td>
                <td>{m.Group.title}</td>
                <td>{m.priorityRank}</td>
                <td>{m.sizeFactor}</td>
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
