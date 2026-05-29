import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, mkdir, chown, chmod } from "node:fs/promises";
import { getgid, getuid } from "node:process";

const MAX_FILE_SIZE = 1024 * 1024 * 3;

// Allowed file formats
const ALLOWED_FORMATS = ["image/gif", "image/png", "image/jpg", "image/jpeg"];

// Directory to store images
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const muscleId = formData.get("muscleId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!muscleId) {
      return NextResponse.json(
        { error: "Muscle ID is required" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the maximum limit of 3MB" },
        { status: 400 },
      );
    }

    // Validate file format
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        { error: "Only GIF, JPEG and PNG images are allowed" },
        { status: 400 },
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filepath = join(UPLOAD_DIR, filename);
    const relativePath = `/uploads/${filename}`;

    // Convert file to buffer and save it
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Change group ownership
    try {
      const uid = getuid ? getuid() : 1000;
      const gid = getgid ? getgid() : 1000;
      await chown(filepath, uid, gid);
      await chmod(filepath, 0o775);
    } catch (chownError) {
      console.error("Error changing file group ownership:", chownError);
    }

    // Save file information to database
    const image = await prisma.muscleImage.create({
      data: {
        filename,
        path: relativePath,
        size: file.size,
        format: file.type,
        muscleId: parseInt(muscleId),
      },
    });

    return NextResponse.json({
      success: true,
      image: {
        id: image.id,
        path: image.path,
        filename: image.filename,
      },
    });
  } catch (error) {
    console.error("Error uploading muscle image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const muscleId = searchParams.get("muscleId");

  if (!muscleId) {
    return NextResponse.json(
      { error: "Muscle ID is required" },
      { status: 400 },
    );
  }

  try {
    const images = await prisma.muscleImage.findMany({
      where: {
        muscleId: parseInt(muscleId),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching muscle images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("id");
  const setMain = searchParams.get("setMain") === "true";

  if (!imageId) {
    return NextResponse.json(
      { error: "Image ID is required" },
      { status: 400 },
    );
  }

  try {
    const image = await prisma.muscleImage.findUnique({
      where: { id: parseInt(imageId) },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (setMain) {
      await prisma.muscleImage.updateMany({
        where: {
          muscleId: image.muscleId,
          isMain: true,
        },
        data: { isMain: false },
      });
    }

    const updatedImage = await prisma.muscleImage.update({
      where: { id: parseInt(imageId) },
      data: { isMain: setMain },
    });

    return NextResponse.json({ success: true, image: updatedImage });
  } catch (error) {
    console.error("Error updating muscle image:", error);
    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("id");

  if (!imageId) {
    return NextResponse.json(
      { error: "Image ID is required" },
      { status: 400 },
    );
  }

  try {
    const image = await prisma.muscleImage.findUnique({
      where: { id: parseInt(imageId) },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await prisma.muscleImage.delete({
      where: { id: parseInt(imageId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting muscle image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
