// @ts-ignore
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

type PageParams = {
  params: { id: string };
};

export default async function ActionPage({ params }: PageParams) {
  const id = parseInt(params.id);
  const action = await prisma.action.findUniqueOrThrow({
    where: { id },
    include: {
      Mass: {
        include: { CurrentApproachGroup: { include: { Approaches: true } } },
      },
      Strength: {
        include: { CurrentApproachGroup: { include: { Approaches: true } } },
      },
      MusclesSynergy: true,
      MusclesAgony: true,
      MusclesStabilizer: true,
      TrainingExercise: true,
    },
  });
  const muscles = await prisma.muscle.findMany({ include: { Group: true } });

  const strength = action.Strength as ActionStrength & {
    CurrentApproachGroup: ApproachesGroup & { Approaches: Approach[] };
  };
  const mass = action.Mass as ActionMass & {
    CurrentApproachGroup: ApproachesGroup & { Approaches: Approach[] };
  };

  return (
    <>
      <ActionControl
        actionId={action.id}
        trainingsCount={action.TrainingExercise.length}
      />
      <ActionsForm action={action} muscles={muscles}></ActionsForm>
      <hr />
      <div className="d-flex row">
        {strength && (
          <div className="col-md-6 mb-3">
            <header className="mb-3">На силу</header>
            <ApproachesManagement
              create={{ purpose: "STRENGTH", actionPurposeId: strength.id }}
              approaches={strength.CurrentApproachGroup.Approaches}
            />
          </div>
        )}
        {mass && (
          <div className="col-md-6 mb-3">
            <header className="mb-3">На массу</header>
            <ApproachesManagement
              create={{ purpose: "MASS", actionPurposeId: mass.id }}
              approaches={mass.CurrentApproachGroup.Approaches}
            />
          </div>
        )}
      </div>
    </>
  );
}
