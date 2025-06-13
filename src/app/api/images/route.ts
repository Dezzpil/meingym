import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/tools/db";
import { writeFile, mkdir, chown } from "fs/promises";
import path from "path";
import { existsSync, readFileSync } from "fs";

const MAX_FILE_SIZE = 1024 * 1024 * 3;

// Function to get group ID (GID) from group name
function getGroupId(groupName: string): number | null {
  try {
    // Read /etc/group file which contains group information
    const groupFile = readFileSync('/etc/group', 'utf8');

    // Split the file by lines and find the line for the specified group
    const lines = groupFile.split('\n');
    for (const line of lines) {
      const [name, , gid] = line.split(':');
      if (name === groupName) {
        return parseInt(gid, 10);
      }
    }
    return null;
  } catch (error) {
    console.error(`Error getting GID for group ${groupName}:`, error);
    return null;
  }
}

// Allowed file formats
const ALLOWED_FORMATS = ["image/gif", "image/png"];

// Directory to store images
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const actionId = formData.get("actionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!actionId) {
      return NextResponse.json(
        { error: "Action ID is required" },
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
        { error: "Only GIF and PNG images are allowed" },
        { status: 400 },
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const relativePath = `/uploads/${filename}`;

    // Convert file to buffer and save it
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Change group ownership to www-data
    try {
      // Get the GID of www-data group
      const wwwDataGid = getGroupId("www-data");

      if (wwwDataGid !== null) {
        // Use the numeric GID instead of the string name
        await chown(filepath, -1, wwwDataGid);
      } else {
        console.warn("Could not find GID for www-data group, skipping chown");
      }
    } catch (chownError) {
      console.error("Error changing file group ownership:", chownError);
      // Continue execution even if chown fails
    }

    // Save file information to database
    const image = await prisma.exerciseImage.create({
      data: {
        filename,
        path: relativePath,
        size: file.size,
        format: file.type,
        actionId: parseInt(actionId),
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
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const actionId = searchParams.get("actionId");

  if (!actionId) {
    return NextResponse.json(
      { error: "Action ID is required" },
      { status: 400 },
    );
  }

  try {
    const images = await prisma.exerciseImage.findMany({
      where: {
        actionId: parseInt(actionId),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
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
    // Find the image to get the actionId
    const image = await prisma.exerciseImage.findUnique({
      where: {
        id: parseInt(imageId),
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (setMain) {
      // First, unset any existing main image for this action
      await prisma.exerciseImage.updateMany({
        where: {
          actionId: image.actionId,
          isMain: true,
        },
        data: {
          isMain: false,
        },
      });
    }

    // Update the image's isMain status
    const updatedImage = await prisma.exerciseImage.update({
      where: {
        id: parseInt(imageId),
      },
      data: {
        isMain: setMain,
      },
    });

    return NextResponse.json({
      success: true,
      image: updatedImage,
    });
  } catch (error) {
    console.error("Error updating image:", error);
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
    // Find the image first to get the filename
    const image = await prisma.exerciseImage.findUnique({
      where: {
        id: parseInt(imageId),
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete the image from the database
    await prisma.exerciseImage.delete({
      where: {
        id: parseInt(imageId),
      },
    });

    // Note: We're not deleting the actual file from the filesystem
    // to avoid potential issues with file system access in production
    // In a production environment, you might want to implement a cleanup job

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
