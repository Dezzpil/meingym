import { prisma } from "@/tools/db";
import { ActionTabs } from "@/app/actions/[id]/ActionTabs";
import { ActionCard } from "@/app/actions/components/ActionCard";
import { ItemPageParams } from "@/tools/types";
import { findUserInfo, getCurrentUser } from "@/tools/auth";
import { UserRole } from "@prisma/client";
import { ActionRecords } from "@/app/actions/components/ActionRecords";

export default async function ActionCardPage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  const user = await getCurrentUser();
  const userInfo = await findUserInfo(user.id);

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
      <ActionRecords records={records} purpose={userInfo.purpose} />
      <div className="row">
        <div className="col">
          <ActionCard action={action} />
        </div>
      </div>
    </div>
  );
}
