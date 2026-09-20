/**
 * Calibrate the glyph-width ratios used by the text fitter.
 *
 * The fitter (src/lib/render/fit.ts) estimates how many lines a string
 * occupies from a glyph-width ratio (average glyph width / font size). Those
 * ratios are hardcoded constants. This script measures the *real* ratio for
 * the fonts the themes use, so the constants can be tuned against actual
 * metrics instead of guesswork.
 *
 * Usage: pnpm exec tsx --tsconfig tsconfig.json scripts/calibrate-fit.mts
 */
import puppeteer from "puppeteer";

const FONTS = [
  { name: "Inter", weight: 400 },
  { name: "Inter", weight: 700 },
  { name: "Inter", weight: 800 },
  { name: "Space Grotesk", weight: 700 },
  { name: "JetBrains Mono", weight: 700 },
  { name: "IBM Plex Mono", weight: 400 },
  { name: "Fraunces", weight: 600 },
  { name: "Archivo Black", weight: 900 },
  { name: "Archivo", weight: 500 },
];

// A representative sample of English prose (mixed case, spaces, punctuation).
const SAMPLE =
  "The quick brown fox jumps over the lazy dog. " +
  "A considerably longer headline that keeps going and wraps across several lines " +
  "of text to stress the estimator with realistic word lengths and spacing.";

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(`<div id="m" style="position:absolute;visibility:hidden;white-space:nowrap;"></div>`);

  for (const { name, weight } of FONTS) {
    const ratio = await page.evaluate(
      (fontName, fontWeight, sample) => {
        const el = document.getElementById("m")!;
        el.style.fontFamily = `'${fontName}', sans-serif`;
        el.style.fontWeight = String(fontWeight);
        el.style.fontSize = "100px";
        el.textContent = sample;
        const width = el.getBoundingClientRect().width;
        // Average glyph width = total width / character count.
        return width / sample.length / 100;
      },
      name,
      weight,
      SAMPLE
    );
    console.log(`${name} ${weight}: ${ratio.toFixed(3)}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});