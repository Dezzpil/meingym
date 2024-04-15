"use server";

import { prisma } from "@/tools/db";
import { redirect } from "next/navigation";

export async function handleRemoveAction(actionId: number) {
  await prisma.action.delete({ where: { id: actionId } });
  redirect(`/actions`);
}
