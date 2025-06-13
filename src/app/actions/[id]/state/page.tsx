import { getCurrentUser, getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";
import {
  ActionLoss,
  ActionMass,
  ActionStrength,
  Approach,
  ApproachesGroup,
  UserRole,
} from "@prisma/client";
import { ApproachesManagement } from "@/components/approaches/Managment";
import { ActionCreateLoss } from "@/app/actions/[id]/state/components/ActionCreateLoss";
import { ActionCreateMass } from "@/app/actions/[id]/state/components/ActionCreateMass";
import { ActionCreateStrength } from "@/app/actions/[id]/state/components/ActionCreateStrength";
import { ItemPageParams } from "@/tools/types";
import { ActionTabs } from "@/app/actions/[id]/ActionTabs";

type ActionRelationName = "ActionStrength" | "ActionMass" | "ActionLoss";

export default async function ActionStatePage({ params }: ItemPageParams) {
  const id = parseInt(params.id);
  const user = await getCurrentUser();
  const userId = await getCurrentUserId();
  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
    include: {
      ActionMass: {
        where: { userId },
        take: 1,
        include: {
          CurrentApproachGroup: { include: { Approaches: true } },
        },
      },
      ActionStrength: {
        where: { userId },
        take: 1,
        include: { CurrentApproachGroup: { include: { Approaches: true } } },
      },
      ActionLoss: {
        where: { userId },
        take: 1,
        include: { CurrentApproachGroup: { include: { Approaches: true } } },
      },
      TrainingExercise: true,
    },
  });

  const state: Record<
    string,
    | ((ActionStrength | ActionMass | ActionLoss) & {
        CurrentApproachGroup: ApproachesGroup & { Approaches: Approach[] };
      })
    | undefined
  > = {
    strength: undefined,
    mass: undefined,
    loss: undefined,
  };
  for (const [key, relName] of [
    ["strength", "ActionStrength"],
    ["mass", "ActionMass"],
    ["loss", "ActionLoss"],
  ]) {
    if (action[relName as ActionRelationName].length) {
      state[key] = action[relName as ActionRelationName][0];
    }
  }

  return (
    <>
      <h2 className="mb-3">{action.alias ? action.alias : action.title}</h2>
      {user.role === UserRole.ADMIN && (
        <ActionTabs id={id} current={"state"} className={"mb-2"} />
      )}
      <div className="mb-3">
        <h5 className="mb-3">На массу</h5>
        {state.mass ? (
          <ApproachesManagement
            create={{ purpose: "MASS", actionPurposeId: state.mass.id }}
            actionId={action.id}
            approachGroup={state.mass.CurrentApproachGroup}
          />
        ) : (
          <ActionCreateMass action={action} />
        )}
      </div>
      {action.strengthAllowed && (
        <div className="mb-3">
          <h5 className="mb-3">На силу</h5>
          {state.strength ? (
            <ApproachesManagement
              create={{
                purpose: "STRENGTH",
                actionPurposeId: state.strength.id,
              }}
              actionId={action.id}
              approachGroup={state.strength.CurrentApproachGroup}
            />
          ) : (
            <ActionCreateStrength action={action} />
          )}
        </div>
      )}
      <div className="mb-3">
        <h5 className="mb-3">На снижение веса</h5>
        {state.loss ? (
          <ApproachesManagement
            create={{ purpose: "LOSS", actionPurposeId: state.loss.id }}
            actionId={action.id}
            approachGroup={state.loss.CurrentApproachGroup}
          />
        ) : (
          <ActionCreateLoss action={action} />
        )}
      </div>
    </>
  );
}
