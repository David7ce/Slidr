import type { Theme } from "@/types/theme";

/**
 * WCAG 2.x relative luminance and contrast ratio helpers.
 *
 * The renderer places text on backgrounds from the theme palette. These
 * helpers let us verify the pairs actually meet the WCAG AA threshold (4.5:1
 * for normal text, 3:1 for large text) instead of trusting the theme author.
 */

/** Parse a hex colour (#rgb, #rrggbb, #rrggbbaa) into 0-255 RGB channels. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().replace(/^#/, "").match(/^([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3 || h.length === 4) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

/** Convert an sRGB channel (0-255) to linear light. */
function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a colour, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

/** WCAG contrast ratio between two colours, 1 (identical) to 21 (black/white). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA minimum contrast for normal text. */
export const AA_NORMAL = 4.5;
/** WCAG AA minimum contrast for large text (>= 18pt / 14pt bold). */
export const AA_LARGE = 3.0;

/**
 * The text/background pairs the renderer actually produces, and the minimum
 * contrast each must meet. Text on a surface (cards) uses the surface colour;
 * text on the slide background uses the background colour.
 */
export interface ContrastCheck {
  /** Human-readable label for the pair. */
  label: string;
  /** Foreground colour. */
  fg: string;
  /** Background colour. */
  bg: string;
  /** Minimum ratio required (AA_LARGE for headings, AA_NORMAL for body). */
  min: number;
}

/**
 * Build the contrast checks for a theme's palette.
 *
 * Only the pairs the renderer actually produces are checked. `primary` and
 * `secondary` are used purely as fills (never as text), so they are excluded.
 * The renderer's text colours are `text` and `accent` on `background`/`surface`,
 * plus the inverted `background`-on-`accent` used by CTA pills and badges.
 */
export function themeContrastChecks(theme: Theme): ContrastCheck[] {
  const { text, accent, background, surface } = theme.palette;
  return [
    // Body text on the slide background.
    { label: "body on background", fg: text, bg: background, min: AA_NORMAL },
    // Headings on the slide background.
    { label: "heading on background", fg: text, bg: background, min: AA_LARGE },
    // Body text on a surface card.
    { label: "body on surface", fg: text, bg: surface, min: AA_NORMAL },
    // Accent (labels, stats, attribution, quote mark) on the background.
    { label: "accent on background", fg: accent, bg: background, min: AA_LARGE },
    // Inverted CTA pill / badge: background text on an accent fill.
    { label: "background on accent", fg: background, bg: accent, min: AA_NORMAL },
  ];
}

/** True if a single pair meets its required ratio. */
export function passesContrast(check: ContrastCheck): boolean {
  return contrastRatio(check.fg, check.bg) >= check.min;
}

/** All pairs that fail their required ratio. */
export function failingContrast(theme: Theme): ContrastCheck[] {
  return themeContrastChecks(theme).filter((c) => !passesContrast(c));
}