/** Render key slide types across extreme aspect ratios to inspect layout. */
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getTheme } from "@/lib/themes";
import { exportSlide, closeBrowser } from "@/lib/export-slides";
import type { Slide, AspectRatio } from "@/types/carousel";

const OUT = "/tmp/slidr-ratios";

const ratios: AspectRatio[] = ["li-16:9", "ig-1:1", "ig-9:16"];

const slides: Slide[] = [
  { id: "1", type: "cover", order: 0, title: "Human Brain vs AI",
    subtitle: "Similar principles, different physical systems", eyebrow: "Neuroscience" },
  { id: "2", type: "comparison", order: 1, title: "The basic unit",
    left: { title: "Biological neuron", items: ["Electrochemical signalling", "Biological cell", "Slow, parallel"] },
    right: { title: "Artificial neuron", items: ["Mathematical function", "Numerical inputs", "Fast, serial"] } },
  { id: "3", type: "timeline", order: 2, title: "How we got here",
    events: [
      { label: "1943", title: "McCulloch-Pitts neuron", description: "First mathematical model." },
      { label: "1958", title: "Perceptron", description: "First trainable network." },
      { label: "2012", title: "AlexNet", description: "Deep learning breaks through." } ] },
  { id: "4", type: "diagram", order: 3, title: "Shared architecture", center: "Learning",
    nodes: [{ label: "Inputs", description: "Raw signals" }, { label: "Weights", description: "Learned strength" },
            { label: "Output", description: "Prediction" }, { label: "Feedback", description: "Error signal" }] },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const theme = await getTheme("swiss-grid");
  if (!theme) throw new Error("theme missing");

  for (const ratio of ratios) {
    for (let i = 0; i < slides.length; i++) {
      const buf = await exportSlide(slides[i], theme, ratio, {
        index: i + 1, total: slides.length, brand: { name: "Slidr" }, format: "png",
      });
      const name = `${ratio.replace(/[:]/g, "-")}__${slides[i].type}.png`;
      await writeFile(path.join(OUT, name), buf);
    }
    console.log(`  ${ratio} done`);
  }
  console.log(`Output: ${OUT}`);
  await closeBrowser();
}

main().catch(async (e) => { console.error("FAILED:", e); await closeBrowser().catch(() => {}); process.exit(1); });
