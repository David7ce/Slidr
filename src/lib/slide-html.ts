import type { AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";

// Backward-compat: legacy ratios map to Instagram equivalents
const LEGACY_MAP: Record<string, AspectRatio> = {
  "1:1": "ig-1:1",
  "4:5": "ig-4:5",
  "9:16": "ig-9:16",
};

function resolveRatio(ratio: AspectRatio | string): AspectRatio {
  return LEGACY_MAP[ratio] ?? (ratio as AspectRatio);
}

/**
 * Extract Google Font family names from slide HTML.
 * Looks for font-family declarations in inline styles and <style> tags.
 */
export function extractFontFamilies(html: string): string[] {
  const families = new Set<string>();
  const regex = /font-family:\s*['"]?([^;'"}\n]+?)['"]?\s*[;}"]/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    const generics = new Set([
      "serif",
      "sans-serif",
      "monospace",
      "cursive",
      "fantasy",
      "system-ui",
      "inherit",
      "initial",
      "unset",
    ]);
    for (const part of raw.split(",")) {
      const name = part.trim().replace(/['"]/g, "");
      if (name && !generics.has(name.toLowerCase())) {
        families.add(name);
      }
    }
  }
  return Array.from(families);
}

/**
 * Wraps slide body HTML into a full HTML document at the correct dimensions.
 * This is THE shared rendering contract between preview (iframe) and export
 * (Puppeteer). The body HTML always comes from the deterministic renderer.
 */
export function wrapSlideHtml(
  slideHtml: string,
  aspectRatio: AspectRatio | string,
  options?: { inlineFontCss?: string; fontFamilies?: string[] }
): string {
  const ratio = resolveRatio(aspectRatio);
  const { width, height } = DIMENSIONS[ratio];
  const fontFamilies = options?.fontFamilies ?? extractFontFamilies(slideHtml);

  let fontBlock = "";
  if (options?.inlineFontCss) {
    // For export: use inlined base64 @font-face CSS
    fontBlock = `<style>${options.inlineFontCss}</style>`;
  } else if (fontFamilies.length > 0) {
    // For preview: use Google Fonts CDN link
    const params = fontFamilies
      .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`)
      .join("&");
    fontBlock = `<link href="https://fonts.googleapis.com/css2?${params}&display=swap" rel="stylesheet">`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=${width}, initial-scale=1">
  ${fontBlock}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
  </style>
</head>
<body>
  ${slideHtml}
</body>
</html>`;
}
