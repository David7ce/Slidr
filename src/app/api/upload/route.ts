import { NextResponse } from "next/server";
import sharp from "sharp";
import { writeAsset } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Magic bytes for the image types we accept.
const MAGIC_BYTES: number[][] = [
  [0x89, 0x50, 0x4e, 0x47], // PNG
  [0xff, 0xd8, 0xff], // JPG
  [0x52, 0x49, 0x46, 0x46], // WebP (RIFF)
];

function looksLikeImage(buffer: Uint8Array): boolean {
  return MAGIC_BYTES.some((magic) => magic.every((byte, i) => buffer[i] === byte));
}

/**
 * Upload an image into a project's assets/ directory.
 *
 * Images are normalised through Sharp (EXIF stripped, sRGB, capped at 1080px)
 * so exports are deterministic regardless of the source file.
 *
 * `projectId` may be supplied as a form field or query parameter. Without it
 * the upload is stored under a shared "shared" project, which keeps logo
 * uploads working before a carousel exists.
 */
export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Request must be multipart/form-data with a 'file' field" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const query = new URL(request.url).searchParams;
    const projectId =
      (formData.get("projectId") as string | null) || query.get("projectId") || "shared";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    if (!looksLikeImage(buffer)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PNG, JPG, WebP" },
        { status: 400 }
      );
    }

    // Normalise: strip EXIF, enforce sRGB, cap dimensions, emit PNG.
    const processed = await sharp(Buffer.from(arrayBuffer))
      .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
      .toColorspace("srgb")
      .png()
      .toBuffer();

    const stem = file.name.replace(/\.[^.]+$/, "");
    const filename = `${stem}.png`;
    const asset = await writeAsset(projectId, filename, processed);

    return NextResponse.json({
      url: asset.url,
      name: asset.name,
      projectId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
