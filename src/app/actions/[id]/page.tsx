import ActionsForm from "@/app/actions/form";
import { ApproachesManagement } from "@/components/approaches/Managment";
import { prisma } from "@/tools/db";
import type {
  ActionMass,
  ActionStrength,
  Approach,
  ApproachesGroup,
} from "@prisma/client";
import { ActionControl } from "@/app/actions/[id]/control";
import { getCurrentUserId } from "@/tools/auth";
import { ActionCreateStrength } from "@/app/actions/[id]/createStrength";
import { ActionCreateMass } from "@/app/actions/[id]/createMass";

type PageParams = {
  params: { id: string };
};

export default async function ActionPage({ params }: PageParams) {
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
      MusclesSynergy: true,
      MusclesAgony: true,
      MusclesStabilizer: true,
      TrainingExercise: true,
    },
  });
  const muscles = await prisma.muscle.findMany({ include: { Group: true } });

  let strength;
  if (action.ActionStrength.length) {
    strength = action.ActionStrength[0] as ActionStrength & {
      CurrentApproachGroup: ApproachesGroup & { Approaches: Approach[] };
    };
  }
  let mass;
  if (action.ActionMass.length) {
    mass = action.ActionMass[0] as ActionMass & {
      CurrentApproachGroup: ApproachesGroup & { Approaches: Approach[] };
    };
  }

  return (
    <>
      <ActionControl
        actionId={action.id}
        trainingsCount={action.TrainingExercise.length}
      />
      <ActionsForm action={action} muscles={muscles}></ActionsForm>
      <hr />
      <div className="d-flex row">
        <div className="col-md-6 mb-3">
          <header className="mb-3">На массу</header>
          {mass ? (
            <ApproachesManagement
              create={{ purpose: "MASS", actionPurposeId: mass.id }}
              approaches={mass.CurrentApproachGroup.Approaches}
              actionId={action.id}
            />
          ) : (
            <ActionCreateMass action={action} />
          )}
        </div>
        {action.strengthAllowed && (
          <div className="col-md-6 mb-3">
            <header className="mb-3">На силу</header>
            {strength ? (
              <ApproachesManagement
                create={{ purpose: "STRENGTH", actionPurposeId: strength.id }}
                approaches={strength.CurrentApproachGroup.Approaches}
                actionId={action.id}
              />
            ) : (
              <ActionCreateStrength action={action} />
            )}
          </div>
        )}
      </div>
    </>
  );
}
