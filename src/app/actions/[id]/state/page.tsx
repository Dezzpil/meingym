import { getCurrentUserId } from "@/tools/auth";
import { prisma } from "@/tools/db";
import Link from "next/link";
import {
  ActionLoss,
  ActionMass,
  ActionStrength,
  Approach,
  ApproachesGroup,
} from "@prisma/client";
import { ApproachesManagement } from "@/components/approaches/Managment";
import { ActionCreateLoss } from "@/app/actions/[id]/state/components/ActionCreateLoss";
import { ActionCreateMass } from "@/app/actions/[id]/state/components/ActionCreateMass";
import { ActionCreateStrength } from "@/app/actions/[id]/state/components/ActionCreateStrength";

type PageParams = {
  params: { id: string };
};

type ActionRelationName = "ActionStrength" | "ActionMass" | "ActionLoss";

export default async function ActionStatePage({ params }: PageParams) {
  const id = parseInt(params.id);
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
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <Link href={`/actions/${id}`} className="nav-link">
            Редактирование
          </Link>
        </li>
        <li className="nav-item">
          <a className="nav-link active" aria-current="page" href="#">
            Подходы
          </a>
        </li>
      </ul>
      <div className="mb-3">
        <h5 className="mb-3">На массу</h5>
        {state.mass ? (
          <ApproachesManagement
            create={{ purpose: "MASS", actionPurposeId: state.mass.id }}
            approaches={state.mass.CurrentApproachGroup.Approaches}
            actionId={action.id}
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
              approaches={state.strength.CurrentApproachGroup.Approaches}
              actionId={action.id}
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
            approaches={state.loss.CurrentApproachGroup.Approaches}
            actionId={action.id}
          />
        ) : (
          <ActionCreateLoss action={action} />
        )}
      </div>
    </>
  );
}
