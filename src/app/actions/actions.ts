"use server";

import { ActionsFormFieldsType } from "@/app/actions/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/tools/db";
import { ActionRig } from "@prisma/client";

// Function to detect if text contains Markdown
function containsMarkdown(text: string): boolean {
  // Check for common Markdown patterns
  const markdownPatterns = [
    /#{1,6}\s+.+/,          // Headers
    /\*\*.+\*\*/,           // Bold
    /\*.+\*/,               // Italic
    /\[.+\]\(.+\)/,         // Links
    /!\[.+\]\(.+\)/,        // Images
    /```[\s\S]*?```/,       // Code blocks
    /`[^`]+`/,              // Inline code
    /^\s*[-*+]\s+.+/m,      // Unordered lists
    /^\s*\d+\.\s+.+/m,      // Ordered lists
    /^\s*>\s+.+/m,          // Blockquotes
    /\|\s*[-:]+\s*\|/,      // Tables
    /~~.+~~/,               // Strikethrough
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}

export async function handleUpdate(id: number, data: ActionsFormFieldsType) {
  const title = data.title.trim();
  const existed = await prisma.action.findFirst({
    where: { title, id: { not: id } },
  });
  if (existed) {
    throw new Error(`Движение ${title} уже существует`);
  }

  // оставил только мышцы агонисты
  const muscleIds = [
    ...data.musclesAgonyIds.map((id) => parseInt(id)),
    // ...data.musclesSynergyIds.map(id => parseInt(id)),
    // ...data.musclesStabilizerIds.map(id => parseInt(id))
  ];

  const muscles = await prisma.muscle.findMany({
    where: { id: { in: muscleIds } },
    include: { Group: true },
  });

  // Create search terms from muscles and their groups
  const muscleSearchTerms = muscles.map(
    (muscle) =>
      `${muscle.title.toLowerCase()} ${muscle.Group.title.toLowerCase()}`,
  );

  // Check if description contains Markdown
  const isMarkDownInDesc = containsMarkdown(data.desc);

  await prisma.$transaction(async (tx) => {
    // Update the action
    await tx.action.update({
      where: { id },
      data: {
        title,
        desc: data.desc,
        isMarkDownInDesc,
        alias: data.alias,
        anotherTitles: data.anotherTitles,
        strengthAllowed: data.strengthAllowed,
        bigCount: data.bigCount,
        allowCheating: data.allowCheating,
        MusclesAgony: {
          deleteMany: { actionId: id },
          createMany: {
            data: data.musclesAgonyIds.map((id) => {
              return { muscleId: parseInt(id) };
            }),
          },
        },
        MusclesSynergy: {
          deleteMany: { actionId: id },
          createMany: {
            data: data.musclesSynergyIds.map((id) => {
              return { muscleId: parseInt(id) };
            }),
          },
        },
        MusclesStabilizer: {
          deleteMany: { actionId: id },
          createMany: {
            data: data.musclesStabilizerIds.map((id) => {
              return { muscleId: parseInt(id) };
            }),
          },
        },
        rig: data.rig,
        updatedAt: new Date(),
        search: [
          data.title.toLowerCase(),
          data.alias?.toLowerCase(),
          data.anotherTitles?.toLowerCase(),
          ...muscleSearchTerms,
        ]
          .filter((s) => s && s.trim().length)
          .join(" "),
      },
    });

    // Update similar exercises
    // First, delete all existing similar exercises relationships for this action
    await tx.similarExercises.deleteMany({
      where: { actionId: id },
    });

    // Then create new relationships if there are any similar exercises selected
    if (data.similarExerciseIds && data.similarExerciseIds.length > 0) {
      await tx.similarExercises.createMany({
        data: data.similarExerciseIds.map((similarId) => ({
          actionId: id,
          similarActionId: parseInt(similarId),
        })),
      });
    }
  });

  revalidatePath(`/actions/${id}`);
}

function autoDefineRig(title: string, def: ActionRig): ActionRig {
  const blocks = title.match(/тренаж|блок/iu);
  if (blocks && blocks.length > 0) return ActionRig.BLOCKS;

  const barbell = title.match(/штанг|жим/iu);
  if (barbell && barbell.length > 0) return ActionRig.BARBELL;

  const dumbbell = title.match(/гантел/iu);
  if (dumbbell && dumbbell.length > 0) return ActionRig.DUMBBELL;

  return def;
}

export async function handleCreate(data: ActionsFormFieldsType) {
  const title = data.title.trim();
  const existed = await prisma.action.findFirst({ where: { title } });
  if (existed) {
    throw new Error(`Движение ${title} уже существует`);
  }

  const desc = data.desc.trim();
  // Check if description contains Markdown
  const isMarkDownInDesc = containsMarkdown(desc);

  const newAction = await prisma.action.create({
    data: {
      title,
      desc,
      isMarkDownInDesc,
    },
  });

  redirect(`/actions/${newAction.id}`);
}

export async function _handleCreate(data: ActionsFormFieldsType) {
  const title = data.title.trim();
  const rig = autoDefineRig(data.title, data.rig);

  const existed = await prisma.action.findFirst({ where: { title } });
  if (existed) {
    throw new Error(`Движение ${title} уже существует`);
  }

  // Check if description contains Markdown
  const isMarkDownInDesc = containsMarkdown(data.desc);

  // Create the action first
  const action = await prisma.$transaction(async (tx) => {
    const newAction = await tx.action.create({
      data: {
        title,
        rig,
        desc: data.desc,
        isMarkDownInDesc,
        search: title,
        alias: data.alias,
        strengthAllowed: data.strengthAllowed,
        bigCount: data.bigCount,
        allowCheating: data.allowCheating,
        anotherTitles: data.anotherTitles,
      },
    });

    // Create muscle relationships
    if (data.musclesAgonyIds.length > 0) {
      await tx.actionsOnMusclesAgony.createMany({
        data: data.musclesAgonyIds.map((id) => ({
          actionId: newAction.id,
          muscleId: parseInt(id),
        })),
      });
    }

    if (data.musclesSynergyIds.length > 0) {
      await tx.actionsOnMusclesSynergy.createMany({
        data: data.musclesSynergyIds.map((id) => ({
          actionId: newAction.id,
          muscleId: parseInt(id),
        })),
      });
    }

    if (data.musclesStabilizerIds.length > 0) {
      await tx.actionsOnMusclesStabilizer.createMany({
        data: data.musclesStabilizerIds.map((id) => ({
          actionId: newAction.id,
          muscleId: parseInt(id),
        })),
      });
    }

    // Fetch muscle data for search field
    const muscleIds = [
      ...data.musclesAgonyIds.map((id) => parseInt(id)),
      ...data.musclesSynergyIds.map((id) => parseInt(id)),
      ...data.musclesStabilizerIds.map((id) => parseInt(id)),
    ];

    if (muscleIds.length > 0) {
      const muscles = await tx.muscle.findMany({
        where: { id: { in: muscleIds } },
        include: { Group: true },
      });

      // Create search terms from muscles and their groups
      const muscleSearchTerms = muscles.map(
        (muscle) =>
          `${muscle.title.toLowerCase()} ${muscle.Group.title.toLowerCase()}`,
      );

      // Update the search field with all terms
      const searchTerms = [
        title.toLowerCase(),
        data.alias?.toLowerCase(),
        data.anotherTitles?.toLowerCase(),
        ...muscleSearchTerms,
      ]
        .filter((s) => s && s.trim().length)
        .join(" ");

      await tx.action.update({
        where: { id: newAction.id },
        data: { search: searchTerms },
      });
    }

    return newAction;
  });

  redirect(`/actions/${action.id}`);
}
