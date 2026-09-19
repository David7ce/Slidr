import type { LlmTool } from "./types";

/**
 * Tool definitions exposed to the LLM.
 *
 * The AI produces STRUCTURED CONTENT ONLY. It never writes HTML or CSS — the
 * deterministic renderer (src/lib/render) owns all visual design. Every
 * payload is validated against the zod schemas in src/lib/slides/schema.ts
 * before it reaches storage.
 */

const slideContentProperties = {
  type: {
    type: "string",
    enum: [
      "cover",
      "text",
      "comparison",
      "statistic",
      "timeline",
      "process",
      "diagram",
      "quote",
      "conclusion",
    ],
    description: "The semantic slide type. Choose the type that best fits the content.",
  },
  title: { type: "string", description: "Slide heading. Required for all types except quote." },
  subtitle: { type: "string", description: "cover only — supporting line under the title." },
  eyebrow: { type: "string", description: "cover only — short uppercase label above the title." },
  body: { type: "string", description: "text/conclusion — a short paragraph." },
  bullets: {
    type: "array",
    items: { type: "string" },
    description: "text only — up to 6 short bullet points.",
  },
  left: {
    type: "object",
    description: "comparison only — left column.",
    properties: {
      title: { type: "string" },
      items: { type: "array", items: { type: "string" } },
    },
    required: ["title", "items"],
  },
  right: {
    type: "object",
    description: "comparison only — right column.",
    properties: {
      title: { type: "string" },
      items: { type: "array", items: { type: "string" } },
    },
    required: ["title", "items"],
  },
  stats: {
    type: "array",
    description: "statistic only — 1 to 4 headline numbers.",
    items: {
      type: "object",
      properties: {
        value: { type: "string", description: "e.g. '87%' or '3.2x'" },
        label: { type: "string", description: "What the number means." },
      },
      required: ["value", "label"],
    },
  },
  events: {
    type: "array",
    description: "timeline only — 2 to 6 chronological events.",
    items: {
      type: "object",
      properties: {
        label: { type: "string", description: "Short time marker, e.g. '1998' or 'Step 1'." },
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["label", "title"],
    },
  },
  steps: {
    type: "array",
    description: "process only — 2 to 6 ordered steps.",
    items: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["title"],
    },
  },
  center: { type: "string", description: "diagram only — the central concept." },
  nodes: {
    type: "array",
    description: "diagram only — 2 to 6 surrounding concepts.",
    items: {
      type: "object",
      properties: {
        label: { type: "string" },
        description: { type: "string" },
      },
      required: ["label"],
    },
  },
  quote: { type: "string", description: "quote only — the quotation text." },
  attribution: { type: "string", description: "quote only — who said it." },
  cta: { type: "string", description: "conclusion only — short call to action." },
  notes: { type: "string", description: "Optional internal note about this slide." },
};

export const SLIDE_TOOLS: LlmTool[] = [
  {
    type: "function",
    function: {
      name: "set_carousel",
      description:
        "Set carousel-level metadata: title, theme, and size. Call this first, before adding slides.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The carousel title." },
          theme: {
            type: "string",
            description:
              "Theme id from the available themes list (e.g. 'swiss-grid', 'midnight-neon').",
          },
          size: {
            type: "string",
            description:
              "Aspect ratio id: ig-1:1, ig-4:5, ig-3:4, ig-9:16, li-1:1, li-4:5, li-16:9, tt-9:16.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_slide",
      description:
        "Append one slide to the carousel. Call once per slide, sequentially, so the user sees progress. Provide content only — never HTML or CSS.",
      parameters: {
        type: "object",
        properties: slideContentProperties,
        required: ["type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_slide",
      description:
        "Replace the content of an existing slide. Provide the full content for the slide's type.",
      parameters: {
        type: "object",
        properties: {
          slideId: { type: "string", description: "The id of the slide to update." },
          ...slideContentProperties,
        },
        required: ["slideId", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_slide",
      description: "Delete a slide from the carousel.",
      parameters: {
        type: "object",
        properties: {
          slideId: { type: "string", description: "The id of the slide to delete." },
        },
        required: ["slideId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reorder_slides",
      description: "Reorder all slides. Pass every slide id in the desired order.",
      parameters: {
        type: "object",
        properties: {
          slideIds: {
            type: "array",
            items: { type: "string" },
            description: "All slide ids, in the new order.",
          },
        },
        required: ["slideIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_caption",
      description: "Save the post caption and hashtags for the carousel.",
      parameters: {
        type: "object",
        properties: {
          caption: { type: "string", description: "The post caption text." },
          hashtags: {
            type: "array",
            items: { type: "string" },
            description: "Hashtag strings without the # symbol.",
          },
        },
        required: ["caption"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Fetch a web page and return its text content. Use when the user provides a link to an article or blog post.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to fetch." },
        },
        required: ["url"],
      },
    },
  },
];
