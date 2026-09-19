import { NextResponse } from "next/server";
import { getLlmConfig } from "@/lib/llm/adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getLlmConfig();
  const configured = !!(config.baseURL && config.apiKey && config.model);

  return NextResponse.json({ configured });
}
