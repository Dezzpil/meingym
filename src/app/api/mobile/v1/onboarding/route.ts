import { NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "@/mobile/tools/jwt";
import { prisma } from "@/tools/db";
import { z } from "zod";
import { TrainingExperience, TrainingProgression, Purpose, Sex } from "@prisma/client";

const OnboardingUpdateSchema = z.object({
  trainingExperience: z.nativeEnum(TrainingExperience).optional(),
  profile: z
    .object({
      height: z.number().min(100).max(300),
      sex: z.nativeEnum(Sex),
      purpose: z.nativeEnum(Purpose),
    })
    .optional(),
  progression: z
    .object({
      type: z.nativeEnum(TrainingProgression),
      params: z.any().optional(),
    })
    .optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header with Bearer token is required" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = await verifyMobileToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const body = await request.json();
    const data = OnboardingUpdateSchema.parse(body);

    const updateData: any = {};

    if (data.trainingExperience !== undefined) {
      updateData.trainingExperience = data.trainingExperience;
    }

    if (data.profile !== undefined) {
      updateData.height = data.profile.height;
      updateData.sex = data.profile.sex;
      updateData.purpose = data.profile.purpose;
    }

    if (data.progression !== undefined) {
      updateData.trainingProgression = data.progression.type;
      if (data.progression.params !== undefined) {
        updateData.trainingProgressionParams = JSON.stringify(data.progression.params);
      }
    }

    if (data.completed !== undefined) {
      updateData.onboardingCompleted = data.completed;
    }

    await prisma.userInfo.updateMany({
      where: { userId: payload.userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Mobile onboarding update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
