import Link from "next/link";
import { ActionWithMusclesType } from "@/app/actions/types";
import { truncateText } from "@/tools/func";
import { ActionMuscles } from "@/app/actions/components/ActionMuscles";
import { ExerciseImage } from "@prisma/client";

type Props = {
  action: ActionWithMusclesType & {
    search?: string | null;
    ExerciseImages: ExerciseImage[];
  };
};

export function ActionListItem({ action }: Props) {
  return (
    <div className="card h-100 mb-2" key={action.id}>
      <div className="card-header">
        <Link href={`/actions/${action.id}`}>
          {truncateText(action.alias ? action.alias : action.title, 32)}
        </Link>
      </div>
      <div
        className="card-body d-flex flex-column gap-2"
        style={{ position: "relative" }}
      >
        {action.ExerciseImages.length ? (
          <img
            src={action.ExerciseImages[0].path}
            alt={action.search ? action.search : action.title}
            width={300}
            height={300}
            style={{
              objectFit: "contain",
              maxHeight: "300px",
              maxWidth: "300px",
            }}
            className="card-img-top"
          />
        ) : (
          <div style={{ width: "300px", height: "300px" }}>&nbsp;</div>
        )}
        <div style={{ position: "absolute", bottom: "16px" }}>
          <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
            <span className="badge bg-secondary">
              База: {action.base}
            </span>
          </div>
          <ActionMuscles action={action} short />
        </div>
      </div>
    </div>
  );
}
