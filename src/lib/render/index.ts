import type { Slide } from "@/types/carousel";
import type { Theme } from "@/types/theme";
import type { AspectRatio, SlideBrand } from "@/types/carousel";
import { buildTokens, type RenderTokens } from "./tokens";
import {
  renderCover,
  renderText,
  renderComparison,
  renderStatistic,
  renderTimeline,
  renderProcess,
  renderDiagram,
  renderQuote,
  renderConclusion,
  type TemplateContext,
} from "./templates";

export { buildTokens, computeScale } from "./tokens";
export type { RenderTokens } from "./tokens";

/**
 * Render a structured slide to body-level HTML.
 *
 * This is the ONLY place slide HTML is produced. Preview and export both call
 * it, so what you see is exactly what gets exported.
 */
export function renderSlide(
  slide: Slide,
  theme: Theme,
  ratio: AspectRatio,
  opts: { index: number; total: number; brand?: SlideBrand }
): string {
  const tokens = buildTokens(theme, ratio);
  const ctx: TemplateContext = {
    tokens,
    index: opts.index,
    total: opts.total,
    brand: opts.brand,
  };

  switch (slide.type) {
    case "cover":
      return renderCover(slide, ctx);
    case "text":
      return renderText(slide, ctx);
    case "comparison":
      return renderComparison(slide, ctx);
    case "statistic":
      return renderStatistic(slide, ctx);
    case "timeline":
      return renderTimeline(slide, ctx);
    case "process":
      return renderProcess(slide, ctx);
    case "diagram":
      return renderDiagram(slide, ctx);
    case "quote":
      return renderQuote(slide, ctx);
    case "conclusion":
      return renderConclusion(slide, ctx);
    default: {
      // Exhaustiveness guard — unknown types render a safe fallback.
      const never: never = slide;
      void never;
      return "";
    }
  }
}

/**
 * Render every slide in a carousel. Returns body-level HTML per slide.
 */
export function renderCarouselSlides(
  slides: Slide[],
  theme: Theme,
  ratio: AspectRatio,
  brand?: SlideBrand
): string[] {
  return slides.map((slide, i) =>
    renderSlide(slide, theme, ratio, {
      index: i + 1,
      total: slides.length,
      brand,
    })
  );
}

/** Collect the font families a rendered carousel needs. */
export function themeFontFamilies(theme: Theme): string[] {
  return [...new Set([theme.fonts.heading, theme.fonts.body])].filter(Boolean);
}

export type { RenderTokens as Tokens };
