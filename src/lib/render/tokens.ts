import type { Theme, BrandPlacement } from "@/types/theme";
import { DIMENSIONS, type AspectRatio } from "@/types/carousel";

/**
 * Design tokens derived from a Theme + target dimensions.
 *
 * The renderer never invents visual design — it reads these tokens. This is
 * what keeps output deterministic and consistent across every slide.
 */
export interface RenderTokens {
  width: number;
  height: number;
  scale: number;
  colors: {
    background: string;
    surface: string;
    text: string;
    primary: string;
    secondary: string;
    accent: string;
    gradient?: string;
  };
  fonts: {
    heading: string;
    body: string;
    headingStack: string;
    bodyStack: string;
  };
  /** Where the brand mark is rendered. */
  brandPlacement: BrandPlacement;
  /** Base padding in px, already scaled. */
  pad: number;
  /** Base gap in px, already scaled. */
  gap: number;
  sizes: {
    hook: number;
    h1: number;
    h2: number;
    body: number;
    small: number;
    stat: number;
  };
}

const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1350;

/**
 * Scale typography proportionally to the slide, clamped so extreme ratios
 * (16:9 landscape, 9:16 vertical) stay readable.
 *
 * Text is scaled by the *binding* (narrower) dimension relative to the base
 * 1080x1350, not by area. Area-based scaling over-sizes text on extreme
 * ratios: a tall 9:16 slide has the same width as the base, so scaling by area
 * makes text overflow the width; a wide 16:9 slide has less height, so area
 * scaling overflows the height. Scaling by the binding dimension keeps text
 * from clipping on either axis.
 */
export function computeScale(ratio: AspectRatio): number {
  const { width, height } = DIMENSIONS[ratio];
  const widthRatio = width / BASE_WIDTH;
  const heightRatio = height / BASE_HEIGHT;
  return Math.max(0.7, Math.min(1.2, Math.min(widthRatio, heightRatio)));
}

export function buildTokens(theme: Theme, ratio: AspectRatio): RenderTokens {
  const { width, height } = DIMENSIONS[ratio];
  const scale = computeScale(ratio);
  const s = (n: number) => Math.round(n * scale);

  const headingFallback = theme.fonts.headingFallback || "sans-serif";
  const bodyFallback = theme.fonts.bodyFallback || "sans-serif";

  return {
    width,
    height,
    scale,
    colors: {
      background: theme.palette.background,
      surface: theme.palette.surface,
      text: theme.palette.text,
      primary: theme.palette.primary,
      secondary: theme.palette.secondary,
      accent: theme.palette.accent,
      gradient: theme.palette.gradient,
    },
    fonts: {
      heading: theme.fonts.heading,
      body: theme.fonts.body,
      headingStack: `'${theme.fonts.heading}', ${headingFallback}`,
      bodyStack: `'${theme.fonts.body}', ${bodyFallback}`,
    },
    brandPlacement: theme.brandPlacement ?? "footer",
    pad: s(80),
    gap: s(28),
    sizes: {
      hook: s(104),
      h1: s(72),
      h2: s(48),
      body: s(32),
      small: s(20),
      stat: s(128),
    },
  };
}
