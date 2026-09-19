import { readDataSafe, writeData } from "@/lib/data";
import type { LlmConfig, LlmMessage, LlmTool, LlmStreamEvent } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { HttpClient } from "./http-client";
import { SLIDE_TOOLS } from "./tools";
import {
  addSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
  updateCarousel,
  getCarousel,
} from "@/lib/carousels";
import { validateSlideContent } from "@/lib/slides/schema";
import { ALL_ASPECT_RATIOS, type AspectRatio } from "@/types/carousel";
import { listThemeIds } from "@/lib/themes";

const CONFIG_FILE = "llm-config.json";

export async function getLlmConfig(): Promise<LlmConfig> {
  return readDataSafe<LlmConfig>(CONFIG_FILE, DEFAULT_CONFIG);
}

export async function saveLlmConfig(config: LlmConfig): Promise<void> {
  await writeData(CONFIG_FILE, config);
}

export function getTools(): LlmTool[] {
  return SLIDE_TOOLS;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Execute a tool call server-side.
 *
 * Every slide payload is validated against the zod schema before it reaches
 * storage. Invalid model output is rejected with a corrective message that is
 * fed back to the model, so it can retry rather than corrupt the carousel.
 */
export async function executeToolCall(
  carouselId: string,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (name) {
      case "set_carousel": {
        const updates: Record<string, unknown> = {};
        if (typeof args.title === "string" && args.title.trim()) {
          updates.name = args.title.trim().slice(0, 120);
        }
        if (typeof args.size === "string" && ALL_ASPECT_RATIOS.includes(args.size as AspectRatio)) {
          updates.aspectRatio = args.size as AspectRatio;
        }
        if (typeof args.theme === "string" && args.theme.trim()) {
          const ids = await listThemeIds();
          if (!ids.includes(args.theme.trim())) {
            return {
              success: false,
              message: `Unknown theme "${args.theme}". Available: ${ids.join(", ")}`,
            };
          }
          updates.themeId = args.theme.trim();
        }
        if (Object.keys(updates).length === 0) {
          return { success: false, message: "No valid fields provided." };
        }
        const updated = await updateCarousel(carouselId, updates);
        if (!updated) return { success: false, message: "Carousel not found." };
        return { success: true, message: "Carousel metadata updated.", data: updates };
      }

      case "add_slide": {
        const { notes, ...content } = args;
        const parsed = validateSlideContent(content);
        if (!parsed.ok) {
          return { success: false, message: `Invalid slide content — ${parsed.error}` };
        }
        const slide = await addSlide(
          carouselId,
          parsed.data,
          typeof notes === "string" ? notes : ""
        );
        if (!slide) {
          return { success: false, message: "Failed to add slide (carousel not found or slide limit reached)." };
        }
        return { success: true, message: `Added ${slide.type} slide ${slide.id}.`, data: slide };
      }

      case "update_slide": {
        const slideId = args.slideId as string;
        if (!slideId) return { success: false, message: "Missing slideId." };
        const { slideId: _ignored, notes, ...content } = args;
        void _ignored;
        void notes;
        const parsed = validateSlideContent(content);
        if (!parsed.ok) {
          return { success: false, message: `Invalid slide content — ${parsed.error}` };
        }
        const slide = await updateSlide(carouselId, slideId, parsed.data);
        if (!slide) return { success: false, message: `Slide ${slideId} not found.` };
        return { success: true, message: `Updated slide ${slideId}.`, data: slide };
      }

      case "delete_slide": {
        const slideId = args.slideId as string;
        if (!slideId) return { success: false, message: "Missing slideId." };
        const ok = await deleteSlide(carouselId, slideId);
        return ok
          ? { success: true, message: `Deleted slide ${slideId}.` }
          : { success: false, message: `Slide ${slideId} not found.` };
      }

      case "reorder_slides": {
        const slideIds = args.slideIds as string[];
        if (!Array.isArray(slideIds) || slideIds.length === 0) {
          return { success: false, message: "slideIds must be a non-empty array." };
        }
        const carousel = await getCarousel(carouselId);
        if (!carousel) return { success: false, message: "Carousel not found." };
        const known = new Set(carousel.slides.map((s) => s.id));
        const unknown = slideIds.filter((id) => !known.has(id));
        if (unknown.length > 0) {
          return { success: false, message: `Unknown slide ids: ${unknown.join(", ")}` };
        }
        const ok = await reorderSlides(carouselId, slideIds);
        return ok
          ? { success: true, message: "Slides reordered." }
          : { success: false, message: "Reorder failed." };
      }

      case "set_caption": {
        const caption = args.caption as string;
        if (!caption || typeof caption !== "string") {
          return { success: false, message: "Missing caption." };
        }
        const hashtags = Array.isArray(args.hashtags)
          ? (args.hashtags as string[]).map((h) => String(h).replace(/^#/, "").trim()).filter(Boolean)
          : [];
        await updateCarousel(carouselId, { caption, hashtags });
        return { success: true, message: "Caption saved." };
      }

      case "fetch_url": {
        const url = args.url as string;
        if (!url) return { success: false, message: "Missing url." };
        try {
          const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
          const text = await resp.text();
          const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          return {
            success: true,
            message: `Fetched ${url}`,
            data: { url, content: clean.substring(0, 8000) },
          };
        } catch (err) {
          return { success: false, message: `Fetch failed: ${(err as Error).message}` };
        }
      }

      default:
        return { success: false, message: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { success: false, message: `Tool execution error: ${(err as Error).message}` };
  }
}

/**
 * Generate a chat response using the configured LLM (HTTP mode).
 * Streams tokens, executes tool calls, and continues until the model stops
 * requesting tools.
 */
export async function generateStream(
  carouselId: string,
  userMessage: string,
  systemPrompt: string,
  config: LlmConfig,
  onEvent: (event: LlmStreamEvent) => void
): Promise<void> {
  if (!config.baseURL || !config.apiKey || !config.model) {
    onEvent({
      type: "error",
      error: "No LLM configured. Set a base URL, API key, and model in settings.",
    });
    return;
  }

  const messages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  try {
    const client = new HttpClient(config);
    const tools = getTools();
    const currentMessages = [...messages];
    const MAX_TOOL_ROUNDS = 20;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      let hadToolCalls = false;

      for await (const event of client.stream(currentMessages, tools, config.model)) {
        if (event.type === "token" && event.text) {
          onEvent(event);
        } else if (event.type === "tool_call" && event.toolCall) {
          hadToolCalls = true;
          const result = await executeToolCall(
            carouselId,
            event.toolCall.name,
            event.toolCall.arguments
          );

          onEvent({
            type: "tool_call",
            toolCall: {
              id: event.toolCall.id,
              name: event.toolCall.name,
              arguments: { ...event.toolCall.arguments, _result: result },
            },
          });

          currentMessages.push({
            role: "assistant",
            content: "",
            tool_call_id: event.toolCall.id,
          });
          currentMessages.push({
            role: "tool",
            content: JSON.stringify(result),
            tool_call_id: event.toolCall.id,
          });
        }
      }

      if (!hadToolCalls) break;
    }

    onEvent({ type: "result" });
  } catch (err) {
    onEvent({ type: "error", error: `LLM error: ${(err as Error).message}` });
  }
}

export { PROVIDER_PRESETS, DEFAULT_CONFIG } from "./types";
export type { LlmConfig, LlmMode, LlmStreamEvent } from "./types";
