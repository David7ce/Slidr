import { NextResponse } from "next/server";
import { createBlankSlide } from "@/lib/slides/blank";

/**
 * Return a blank, valid slide content payload for a given type.
 *
 * The client uses this to add a slide manually and then edit it, so the
 * starting content always satisfies the schema.
 */
export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") ?? "text";
  const content = createBlankSlide(type);
  if (!content) {
    return NextResponse.json({ error: `Unknown slide type: ${type}` }, { status: 400 });
  }
  return NextResponse.json(content);
}
