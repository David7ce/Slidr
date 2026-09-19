import { NextRequest, NextResponse } from "next/server";
import { getLlmConfig, saveLlmConfig } from "@/lib/llm/adapter";
import { PROVIDER_PRESETS } from "@/lib/llm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getLlmConfig();

  const maskedConfig = {
    ...config,
    apiKey: config.apiKey
      ? config.apiKey.substring(0, 4) + "..." + config.apiKey.slice(-4)
      : "",
  };

  return NextResponse.json({
    config: maskedConfig,
    hasApiKey: !!config.apiKey,
    configured: !!(config.baseURL && config.apiKey && config.model),
    presets: PROVIDER_PRESETS,
  });
}

export async function PUT(request: NextRequest) {
  let body: { baseURL?: string; apiKey?: string; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const current = await getLlmConfig();
  const updated = {
    baseURL: body.baseURL !== undefined ? body.baseURL : current.baseURL,
    apiKey: body.apiKey !== undefined && body.apiKey !== "" ? body.apiKey : current.apiKey,
    model: body.model !== undefined ? body.model : current.model,
  };

  await saveLlmConfig(updated);

  return NextResponse.json({
    success: true,
    config: { ...updated, apiKey: updated.apiKey ? "***" : "" },
  });
}
