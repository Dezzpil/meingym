import Link from "next/link";
import { ActionWithMusclesType } from "@/app/actions/types";
import { truncateText } from "@/tools/func";
import { ActionMuscles } from "@/app/actions/components/ActionMuscles";

type Props = {
  action: ActionWithMusclesType & { search?: string | null };
};

export function ActionListItem({ action }: Props) {
  return (
    <div className="card h-100" key={action.id}>
      <div className="card-header">
        <Link href={`/actions/${action.id}`}>
          {truncateText(action.alias ? action.alias : action.title, 32)}
        </Link>
      </div>
      <div className="card-body d-flex flex-column gap-2">
        {action.search ? (
          <div className="text-muted small" title="Строка поиска">
            {truncateText(action.search, 120)}
          </div>
        ) : null}
        <ActionMuscles action={action} />
      </div>
    </div>
  );
}
