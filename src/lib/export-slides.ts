import puppeteer, { type Browser } from "puppeteer";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import sharp from "sharp";
import { wrapSlideHtml } from "./slide-html";
import { getInlinedFontCSS } from "./fonts";
import { renderSlide, themeFontFamilies } from "./render";
import { getTheme } from "./themes";
import type { Slide, AspectRatio, SlideBrand } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";
import type { Theme } from "@/types/theme";

export type ExportFormat = "png" | "jpg";

// Singleton browser with lifecycle management
let browser: Browser | null = null;
let exportCount = 0;
const MAX_EXPORTS_BEFORE_RESTART = 50;

/**
 * Find a usable Chrome executable.
 * Prefers Puppeteer's bundled download, falls back to system Chrome/Chromium.
 */
function getChromeExecutablePath(): string | undefined {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch {
      // ignore
    }
  }

  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (browser && exportCount >= MAX_EXPORTS_BEFORE_RESTART) {
    await browser.close().catch(() => {});
    browser = null;
    exportCount = 0;
  }
  if (!browser || !browser.isConnected()) {
    const executablePath = getChromeExecutablePath();
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });
    exportCount = 0;
  }
  return browser;
}

/**
 * Inline all image references in slide HTML as data: URIs.
 *
 * Sources are project assets (`/api/projects/<id>/assets/<name>`). Inlining
 * removes any dependency on the dev server being reachable while Puppeteer
 * renders, which keeps exports self-contained and fast.
 */
async function inlineImages(html: string): Promise<string> {
  const projectDir = path.join(/* turbopackIgnore: true */ process.cwd(), "projects");
  const imgRegex = /(?:src=["']|url\(["']?)(\/api\/projects\/[^"'\s)]+)/g;
  const matches = [...html.matchAll(imgRegex)];

  let result = html;
  for (const match of matches) {
    const assetPath = match[1];
    try {
      // /api/projects/<id>/assets/<name>
      const parts = assetPath.split("/").filter(Boolean);
      const name = parts[parts.length - 1];
      const projectId = parts[parts.indexOf("projects") + 1];
      if (!name || !projectId) continue;

      const fullPath = path.join(projectDir, projectId, "assets", path.basename(name));
      const buffer = await readFile(fullPath);
      const ext = path.extname(name).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : "application/octet-stream";
      result = result.replace(
        assetPath,
        `data:${mime};base64,${buffer.toString("base64")}`
      );
    } catch {
      // Asset missing — leave the URL so the render still succeeds.
    }
  }

  return result;
}

/**
 * Export a single structured slide to an image buffer.
 * The slide is rendered deterministically from its content + the theme.
 */
export async function exportSlide(
  slide: Slide,
  theme: Theme,
  aspectRatio: AspectRatio,
  opts: { index: number; total: number; brand?: SlideBrand; format?: ExportFormat }
): Promise<Buffer> {
  const { width, height } = DIMENSIONS[aspectRatio];
  const format = opts.format ?? "png";

  const bodyHtml = renderSlide(slide, theme, aspectRatio, {
    index: opts.index,
    total: opts.total,
    brand: opts.brand,
  });

  const inlinedFontCss = await getInlinedFontCSS(themeFontFamilies(theme));
  const inlinedHtml = await inlineImages(bodyHtml);

  const fullHtml = wrapSlideHtml(inlinedHtml, aspectRatio, {
    inlineFontCss: inlinedFontCss,
    fontFamilies: themeFontFamilies(theme),
  });

  const br = await getBrowser();
  const page = await br.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded", timeout: 15000 });

    await page
      .waitForFunction(
        () =>
          document.fonts.ready.then(() =>
            [...document.fonts].every((f) => f.status === "loaded")
          ),
        { timeout: 10000 }
      )
      .catch(() => {
        // Font loading timeout — proceed with whatever loaded
      });

    const screenshotBuffer = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height },
    });

    exportCount++;

    const pipeline = sharp(screenshotBuffer).toColorspace("srgb");
    return format === "jpg"
      ? pipeline.jpeg({ quality: 92 }).toBuffer()
      : pipeline.png().toBuffer();
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Export all slides of a carousel to image buffers.
 * Processes up to 3 slides concurrently.
 */
export async function exportAllSlides(
  slides: Slide[],
  theme: Theme,
  aspectRatio: AspectRatio,
  opts?: {
    format?: ExportFormat;
    brand?: SlideBrand;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<{ name: string; buffer: Buffer }[]> {
  const format = opts?.format ?? "png";
  const ext = format === "jpg" ? "jpg" : "png";
  const results: { name: string; buffer: Buffer }[] = [];
  const CONCURRENCY = 3;

  for (let i = 0; i < slides.length; i += CONCURRENCY) {
    const batch = slides.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (slide, batchIdx) => {
        const idx = i + batchIdx;
        const buffer = await exportSlide(slide, theme, aspectRatio, {
          index: idx + 1,
          total: slides.length,
          brand: opts?.brand,
          format,
        });
        opts?.onProgress?.(idx + 1, slides.length);
        return { name: `slide-${String(idx + 1).padStart(2, "0")}.${ext}`, buffer };
      })
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Close the singleton browser and release its process.
 * Long-lived servers should not call this; CLI scripts must, so they can exit.
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
    exportCount = 0;
  }
}

/** Resolve the theme for a carousel, falling back to the first available. */
export async function resolveTheme(themeId?: string | null): Promise<Theme> {
  if (themeId) {
    const theme = await getTheme(themeId);
    if (theme) return theme;
  }
  const { listThemes } = await import("./themes");
  const themes = await listThemes();
  if (themes.length === 0) {
    throw new Error("No themes available. Add a DESIGN.md preset to src/lib/themes/presets/.");
  }
  return themes[0];
}
