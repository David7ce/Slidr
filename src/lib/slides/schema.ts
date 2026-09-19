import { z } from "zod";
import { SLIDE_TYPES } from "@/types/carousel";

/**
 * Zod schemas for the structured slide model.
 *
 * These are the contract between the AI and the renderer. Every tool call is
 * validated here before it touches storage, so malformed model output is
 * rejected with a corrective message instead of corrupting a carousel.
 */

const nonEmpty = (max: number) => z.string().trim().min(1).max(max);

export const coverSlideSchema = z.object({
  type: z.literal("cover"),
  title: nonEmpty(120),
  subtitle: z.string().trim().max(200).optional(),
  eyebrow: z.string().trim().max(60).optional(),
});

export const textSlideSchema = z.object({
  type: z.literal("text"),
  title: nonEmpty(120),
  body: z.string().trim().max(600).optional(),
  bullets: z.array(nonEmpty(160)).max(6).optional(),
});

export const comparisonSlideSchema = z.object({
  type: z.literal("comparison"),
  title: nonEmpty(120),
  left: z.object({
    title: nonEmpty(60),
    items: z.array(nonEmpty(120)).min(1).max(6),
  }),
  right: z.object({
    title: nonEmpty(60),
    items: z.array(nonEmpty(120)).min(1).max(6),
  }),
});

export const statisticSlideSchema = z.object({
  type: z.literal("statistic"),
  title: z.string().trim().max(120).optional(),
  stats: z
    .array(
      z.object({
        value: nonEmpty(20),
        label: nonEmpty(80),
      })
    )
    .min(1)
    .max(4),
});

export const timelineSlideSchema = z.object({
  type: z.literal("timeline"),
  title: nonEmpty(120),
  events: z
    .array(
      z.object({
        label: nonEmpty(24),
        title: nonEmpty(80),
        description: z.string().trim().max(200).optional(),
      })
    )
    .min(2)
    .max(6),
});

export const processSlideSchema = z.object({
  type: z.literal("process"),
  title: nonEmpty(120),
  steps: z
    .array(
      z.object({
        title: nonEmpty(80),
        description: z.string().trim().max(200).optional(),
      })
    )
    .min(2)
    .max(6),
});

export const diagramSlideSchema = z.object({
  type: z.literal("diagram"),
  title: nonEmpty(120),
  center: nonEmpty(60),
  nodes: z
    .array(
      z.object({
        label: nonEmpty(60),
        description: z.string().trim().max(160).optional(),
      })
    )
    .min(2)
    .max(6),
});

export const quoteSlideSchema = z.object({
  type: z.literal("quote"),
  quote: nonEmpty(300),
  attribution: z.string().trim().max(80).optional(),
});

export const conclusionSlideSchema = z.object({
  type: z.literal("conclusion"),
  title: nonEmpty(120),
  body: z.string().trim().max(400).optional(),
  cta: z.string().trim().max(80).optional(),
});

export const slideContentSchema = z.discriminatedUnion("type", [
  coverSlideSchema,
  textSlideSchema,
  comparisonSlideSchema,
  statisticSlideSchema,
  timelineSlideSchema,
  processSlideSchema,
  diagramSlideSchema,
  quoteSlideSchema,
  conclusionSlideSchema,
]);

export const slideTypeSchema = z.enum(SLIDE_TYPES as [string, ...string[]]);

export const carouselMetaSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  theme: z.string().trim().max(60).optional(),
  size: z.string().trim().max(20).optional(),
});

export type SlideContentInput = z.infer<typeof slideContentSchema>;

/**
 * Validate a slide payload, returning a human-readable error suitable for
 * feeding back to the model.
 */
export function validateSlideContent(
  input: unknown
): { ok: true; data: SlideContentInput } | { ok: false; error: string } {
  const result = slideContentSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };

  const issues = result.error.issues
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
  return { ok: false, error: issues };
}
