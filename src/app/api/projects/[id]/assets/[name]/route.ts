import { NextResponse } from "next/server";
import { readAsset } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serve an asset from a project's `assets/` directory.
 *
 * Assets are content-addressed by filename and stored locally, so they are
 * cached aggressively. The name is sanitised by `readAsset`, which prevents
 * traversal outside the project directory.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; name: string }> }
) {
  const { id, name } = await params;

  let asset: { data: Buffer; contentType: string } | null = null;
  try {
    asset = await readAsset(id, name);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}