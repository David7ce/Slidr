/**
 * Text fitting.
 *
 * The renderer produces static HTML with no layout pass, so it cannot measure
 * real text metrics. Instead it estimates how many lines a string will occupy
 * at a given font size and shrinks the size until the block fits its box.
 *
 * The estimates are deliberately conservative (slightly wide glyphs, generous
 * line height) so text errs toward being smaller rather than clipping. This is
 * a heuristic, not a substitute for looking at the rendered PNGs.
 */

/** Average glyph width as a fraction of font size, for bold sans headings. */
const HEADING_GLYPH_RATIO = 0.54;
/** Average glyph width as a fraction of font size, for regular body text. */
const BODY_GLYPH_RATIO = 0.5;

/**
 * Measured average glyph width (as a fraction of font size) for the fonts the
 * themes use. Calibrated with scripts/calibrate-fit.mts against real browser
 * metrics. A small safety margin is added so text errs toward fitting.
 *
 * Unknown fonts fall back to the conservative defaults above.
 */
const HEADING_RATIOS: Record<string, number> = {
  Inter: 0.5,
  "Space Grotesk": 0.49,
  "JetBrains Mono": 0.49,
  "IBM Plex Mono": 0.46,
  Fraunces: 0.49,
  "Archivo Black": 0.56,
  Archivo: 0.46,
  "Playfair Display": 0.5,
  "Source Serif 4": 0.5,
  Satoshi: 0.49,
};

const BODY_RATIOS: Record<string, number> = {
  Inter: 0.48,
  "IBM Plex Mono": 0.46,
  Archivo: 0.46,
  "Source Serif 4": 0.48,
};

/** Glyph ratio for a heading font, falling back to the conservative default. */
export function headingGlyphRatio(font: string): number {
  return HEADING_RATIOS[font] ?? HEADING_GLYPH_RATIO;
}

/** Glyph ratio for a body font, falling back to the conservative default. */
export function bodyGlyphRatio(font: string): number {
  return BODY_RATIOS[font] ?? BODY_GLYPH_RATIO;
}

export interface FitOptions {
  /** Font size to start from. */
  baseSize: number;
  /** Never shrink below this. */
  minSize: number;
  /** Available width in px. */
  maxWidth: number;
  /** Available height in px. */
  maxHeight: number;
  /** Line height multiplier. */
  lineHeight: number;
  /** Glyph width ratio; defaults to the heading ratio. */
  glyphRatio?: number;
}

/** Estimated number of lines a string occupies at a given font size. */
export function estimateLines(
  text: string,
  fontSize: number,
  maxWidth: number,
  glyphRatio: number
): number {
  const perLine = Math.max(1, Math.floor(maxWidth / (fontSize * glyphRatio)));
  // Long words break rather than overflow, so count words that exceed a line.
  const words = text.split(/\s+/).filter(Boolean);
  let lines = 1;
  let used = 0;

  for (const word of words) {
    const wordLines = Math.max(1, Math.ceil(word.length / perLine));
    if (wordLines > 1) {
      // A single long word wraps on its own.
      lines += wordLines - 1;
      used = word.length % perLine;
      continue;
    }
    if (used + word.length + 1 > perLine) {
      lines += 1;
      used = word.length;
    } else {
      used += word.length + 1;
    }
  }

  return lines;
}

/** Estimated rendered height of a string at a given font size. */
export function estimateHeight(
  text: string,
  fontSize: number,
  maxWidth: number,
  lineHeight: number,
  glyphRatio: number
): number {
  return estimateLines(text, fontSize, maxWidth, glyphRatio) * fontSize * lineHeight;
}

/**
 * Largest font size (at most `baseSize`, at least `minSize`) at which `text`
 * fits inside the given box.
 */
export function fitFontSize(text: string, opts: FitOptions): number {
  const { baseSize, minSize, maxWidth, maxHeight, lineHeight } = opts;
  const glyphRatio = opts.glyphRatio ?? HEADING_GLYPH_RATIO;

  if (!text.trim() || maxWidth <= 0 || maxHeight <= 0) return baseSize;

  // Step down in small increments so the result stays close to the base size.
  const step = Math.max(1, Math.round(baseSize * 0.04));
  for (let size = baseSize; size >= minSize; size -= step) {
    if (estimateHeight(text, size, maxWidth, lineHeight, glyphRatio) <= maxHeight) {
      return size;
    }
  }
  return minSize;
}

/** Convenience wrapper for headings. */
export function fitHeading(
  text: string,
  baseSize: number,
  maxWidth: number,
  maxHeight: number,
  lineHeight = 1.08,
  font?: string
): number {
  return fitFontSize(text, {
    baseSize,
    minSize: Math.round(baseSize * 0.5),
    maxWidth,
    maxHeight,
    lineHeight,
    glyphRatio: headingGlyphRatio(font ?? ""),
  });
}

/** Convenience wrapper for body copy. */
export function fitBody(
  text: string,
  baseSize: number,
  maxWidth: number,
  maxHeight: number,
  lineHeight = 1.5,
  font?: string
): number {
  return fitFontSize(text, {
    baseSize,
    minSize: Math.round(baseSize * 0.7),
    maxWidth,
    maxHeight,
    lineHeight,
    glyphRatio: bodyGlyphRatio(font ?? ""),
  });
}