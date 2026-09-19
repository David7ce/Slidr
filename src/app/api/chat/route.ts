import { NextRequest, NextResponse } from "next/server";
import { getBrand } from "@/lib/brand";
import { getCarousel } from "@/lib/carousels";
import { buildSystemPrompt } from "@/lib/chat-system-prompt";
import { generateStream, getLlmConfig } from "@/lib/llm/adapter";
import { getTheme, listThemes } from "@/lib/themes";
import type { LlmStreamEvent } from "@/lib/llm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let body: { message?: string; carouselId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, carouselId } = body;

  if (!message || typeof message !== "string" || !message.trim() || message.length > 10000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const config = await getLlmConfig();
  if (!config.baseURL || !config.apiKey || !config.model) {
    return NextResponse.json(
      {
        error:
          "No LLM configured. Open Settings and enter a base URL, API key, and model (a free Groq or Google AI Studio key works).",
      },
      { status: 503 }
    );
  }

  const brand = await getBrand();
  const carousel = carouselId ? await getCarousel(carouselId) : null;
  const theme = carousel?.themeId ? await getTheme(carousel.themeId) : null;
  const availableThemes = await listThemes();

  const systemPrompt = buildSystemPrompt(brand, carousel, theme, availableThemes);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const onEvent = (event: LlmStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // stream already closed
        }
      };

      try {
        await generateStream(carouselId || "", message, systemPrompt, config, onEvent);
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: `Stream error: ${(err as Error).message}`,
            })}\n\n`
          )
        );
      } finally {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
