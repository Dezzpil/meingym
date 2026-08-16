import Link from "next/link";
import moment from "moment";
import { prisma } from "@/tools/db";
import { ActionTabs } from "@/app/actions/[id]/ActionTabs";
import { ActionCard } from "@/app/actions/components/ActionCard";
import { ItemPageParams } from "@/tools/types";
import { getCurrentUser } from "@/tools/auth";
import { UserRole } from "@prisma/client";
import { DateFormat } from "@/tools/dates";
import { RecordMark } from "@/components/records/RecordMark";
import {
  formatRecordValue,
  purposeShortTitle,
} from "@/components/records/format";

export default async function ActionCardPage({ params }: ItemPageParams) {
  const user = await getCurrentUser();
  const id = parseInt(params.id);

  const [action, records] = await Promise.all([
    prisma.action.findUniqueOrThrow({
      where: { id },
      include: {
        ExerciseImages: {
          where: { isMain: true },
          take: 1,
        },
        ActionMass: {
          where: { userId: user.id },
          take: 1,
          include: {
            CurrentApproachGroup: { include: { Approaches: true } },
          },
        },
        ActionStrength: {
          where: { userId: user.id },
          take: 1,
          include: {
            CurrentApproachGroup: { include: { Approaches: true } },
          },
        },
        ActionLoss: {
          where: { userId: user.id },
          take: 1,
          include: {
            CurrentApproachGroup: { include: { Approaches: true } },
          },
        },
        MusclesAgony: { include: { Muscle: { include: { Group: true } } } },
        MusclesSynergy: { include: { Muscle: { include: { Group: true } } } },
        MusclesStabilizer: {
          include: { Muscle: { include: { Group: true } } },
        },
        MusclesAntagonist: {
          include: { Muscle: { include: { Group: true } } },
        },
        TrainingExerciseScore: true,
        SimilarTo: {
          include: {
            Action: true,
          },
        },
        SimilarFrom: {
          include: {
            SimilarAction: true,
          },
        },
      },
    }),
    // действующие all-time рекорды пользователя по этому упражнению
    prisma.personalRecord.findMany({
      where: { userId: user.id, actionId: id, isAllTime: true },
      distinct: ["purpose", "type"],
      orderBy: [{ achievedAt: "desc" }, { id: "desc" }],
    }),
  ]);

  return (
    <div className="container-fluid px-0">
      <div className="col">
        <h2 className="mb-3">{action.alias ? action.alias : action.title}</h2>
        {user.role === UserRole.ADMIN && (
          <ActionTabs id={id} current={"card"} className={"mb-4"} />
        )}
      </div>

      {records.length > 0 && (
        <div className="card record-card-alltime mb-3">
          <div className="card-header">Действующие рекорды</div>
          <ul className="list-group list-group-flush">
            {records.map((record) => (
              <li
                key={record.id}
                className="list-group-item d-flex align-items-center justify-content-between flex-wrap"
              >
                <div className="d-inline-flex column-gap-2 align-items-baseline">
                  <RecordMark record={record} withIcon withTitle iconFirst />
                  <Link
                    href={`/trainings/${record.trainingId}`}
                    className="text-decoration-none fw-semibold"
                  >
                    {formatRecordValue(record)}
                  </Link>
                </div>
                <div className="d-inline-flex column-gap-2 align-items-baseline">
                  <span className="badge text-bg-light">
                    {purposeShortTitle(record.purpose)}
                  </span>
                  <small className="text-muted">
                    {moment(record.achievedAt).format(DateFormat)}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="row">
        <div className="col">
          <ActionCard action={action} />
        </div>
      </div>
    </div>
  );
}
