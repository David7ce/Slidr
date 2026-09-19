import { NextResponse } from "next/server";
import { listThemes } from "@/lib/themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const themes = await listThemes();
  return NextResponse.json({ themes });
}
