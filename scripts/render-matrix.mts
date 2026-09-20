/**
 * Render the full matrix: every slide type × every aspect ratio × every theme.
 *
 * This is the visual-review companion to the roadmap's "Quality" item. It
 * renders all 9 slide types across all 8 aspect ratios for every theme preset,
 * writing PNGs into an organised tree so the output can be eyeballed:
 *
 *   /tmp/slidr-matrix/<theme>/<ratio>/<NN>-<type>.png
 *
 * Usage:
 *   pnpm exec tsx --tsconfig tsconfig.json scripts/render-matrix.mts
 *   pnpm exec tsx --tsconfig tsconfig.json scripts/render-matrix.mts swiss-grid   # one theme
 *   pnpm exec tsx --tsconfig tsconfig.json scripts/render-matrix.mts swiss-grid ig-4:5  # one theme + ratio
 */
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { listThemes, getTheme } from "@/lib/themes";
import { exportSlide, closeBrowser } from "@/lib/export-slides";
import { ALL_ASPECT_RATIOS, type Slide, type AspectRatio } from "@/types/carousel";

const OUT = "/tmp/slidr-matrix";

/** One representative slide per type, with realistic content. */
const slides: Slide[] = [
  { id: "1", type: "cover", order: 0, title: "Human Brain vs AI", subtitle: "Similar principles, different physical systems", eyebrow: "Neuroscience" },
  { id: "2", type: "comparison", order: 1, title: "The basic unit", left: { title: "Biological neuron", items: ["Electrochemical signalling", "Biological cell", "Slow, massively parallel"] }, right: { title: "Artificial neuron", items: ["Mathematical function", "Numerical inputs", "Fast, largely serial"] } },
  { id: "3", type: "statistic", order: 2, title: "By the numbers", stats: [{ value: "86B", label: "Neurons in the human brain" }, { value: "100T", label: "Synaptic connections" }, { value: "20W", label: "Power consumption" }] },
  { id: "4", type: "timeline", order: 3, title: "How we got here", events: [{ label: "1943", title: "McCulloch-Pitts neuron", description: "First mathematical model of a neuron." }, { label: "1958", title: "Perceptron", description: "First trainable single-layer network." }, { label: "2012", title: "AlexNet", description: "Deep learning breaks through." }] },
  { id: "5", type: "process", order: 4, title: "How a neuron fires", steps: [{ title: "Dendrites receive", description: "Signals arrive from other neurons." }, { title: "Soma integrates", description: "Inputs are summed over time." }, { title: "Axon transmits", description: "A spike travels down the axon." }] },
  { id: "6", type: "diagram", order: 5, title: "Shared architecture", center: "Learning", nodes: [{ label: "Inputs", description: "Raw signals" }, { label: "Weights", description: "Learned strength" }, { label: "Output", description: "Prediction" }, { label: "Feedback", description: "Error signal" }] },
  { id: "7", type: "text", order: 6, title: "Where they diverge", body: "Brains learn from a handful of examples. Networks need thousands.", bullets: ["Brains are analog", "Networks are digital", "Brains are embodied"] },
  { id: "8", type: "quote", order: 7, quote: "The brain is a computer made of wetware, and we are only beginning to read its instruction set.", attribution: "Computational Neuroscience" },
  { id: "9", type: "conclusion", order: 8, title: "Two systems, one principle", body: "Both learn by adjusting connections in response to error.", cta: "Follow for more" },
];

async function main() {
  const [themeArg, ratioArg] = process.argv.slice(2);

  const themeIds = themeArg ? [themeArg] : (await listThemes()).map((t) => t.id);
  const ratios: AspectRatio[] = ratioArg
    ? [ratioArg as AspectRatio]
    : [...ALL_ASPECT_RATIOS];

  let count = 0;
  for (const themeId of themeIds) {
    const theme = await getTheme(themeId);
    if (!theme) {
      console.error(`  SKIP ${themeId}: not found`);
      continue;
    }
    for (const ratio of ratios) {
      const dir = path.join(OUT, themeId, ratio.replace(/:/g, "-"));
      await mkdir(dir, { recursive: true });
      for (let i = 0; i < slides.length; i++) {
        const buf = await exportSlide(slides[i], theme, ratio, {
          index: i + 1,
          total: slides.length,
          brand: { name: "Slidr" },
          format: "png",
        });
        const name = `${String(i + 1).padStart(2, "0")}-${slides[i].type}.png`;
        await writeFile(path.join(dir, name), buf);
        count++;
      }
      console.log(`  ${themeId} / ${ratio} done`);
    }
  }

  console.log(`\nRendered ${count} slides → ${OUT}`);
  await closeBrowser();
}

main().catch(async (e) => {
  console.error("FAILED:", e);
  await closeBrowser().catch(() => {});
  process.exit(1);
});