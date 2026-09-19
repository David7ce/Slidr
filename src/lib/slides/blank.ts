import type { SlideContent, SlideType } from "@/types/carousel";

/**
 * Blank, schema-valid starter content for each slide type.
 *
 * Used when adding a slide by hand: the placeholder satisfies the zod schema
 * immediately, so the slide renders before the user has typed anything, and
 * saving is never blocked by an empty required field.
 */
export function createBlankSlide(type: string): SlideContent | null {
  const t = type as SlideType;

  switch (t) {
    case "cover":
      return { type: "cover", title: "New cover", subtitle: "", eyebrow: "" };

    case "text":
      return { type: "text", title: "New slide", body: "", bullets: [] };

    case "comparison":
      return {
        type: "comparison",
        title: "New comparison",
        left: { title: "Left", items: ["First point"] },
        right: { title: "Right", items: ["First point"] },
      };

    case "statistic":
      return {
        type: "statistic",
        title: "New statistic",
        stats: [{ value: "00%", label: "What it measures" }],
      };

    case "timeline":
      return {
        type: "timeline",
        title: "New timeline",
        events: [
          { label: "Step 1", title: "First event" },
          { label: "Step 2", title: "Second event" },
        ],
      };

    case "process":
      return {
        type: "process",
        title: "New process",
        steps: [{ title: "First step" }, { title: "Second step" }],
      };

    case "diagram":
      return {
        type: "diagram",
        title: "New diagram",
        center: "Core idea",
        nodes: [{ label: "Part one" }, { label: "Part two" }],
      };

    case "quote":
      return { type: "quote", quote: "New quotation.", attribution: "" };

    case "conclusion":
      return { type: "conclusion", title: "New conclusion", body: "", cta: "" };

    default:
      return null;
  }
}