/**
 * How the AI works in Slidr, with no API key.
 *
 * A scripted "model" replies with tool calls. Each goes through the same
 * executeToolCall() the real chat uses: zod-validated, then stored as
 * carousel.json. The renderer derives the PNG. The AI never writes HTML.
 *
 *   pnpm exec tsx --tsconfig tsconfig.json scripts/demo-ai.mts
 */
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createCarousel, readCarousel, deleteCarousel } from "@/lib/projects";
import { executeToolCall } from "@/lib/llm/adapter";
import { exportAllSlides, resolveTheme, closeBrowser } from "@/lib/export-slides";

const OUT = path.join(process.cwd(), "demo-output");

// What a model would emit. The first slide is deliberately invalid.
const modelTurns: { say: string; tool: string; args: Record<string, unknown> }[] = [
  { say: "Set the deck up.", tool: "set_carousel", args: { title: "How AI Works", theme: "midnight-neon" } },
  { say: "Cover slide (empty title, my mistake).", tool: "add_slide", args: { type: "cover", title: "" } },
  { say: "Retry with a real title.", tool: "add_slide", args: { type: "cover", title: "How AI Works", subtitle: "In three slides", eyebrow: "AI 101" } },
  { say: "The core loop.", tool: "add_slide", args: { type: "process", title: "Training", steps: [{ title: "Predict" }, { title: "Measure error" }, { title: "Adjust weights" }] } },
  { say: "Wrap up.", tool: "add_slide", args: { type: "conclusion", title: "Just pattern fitting", body: "Repeat a billion times.", cta: "Follow for more" } },
];

const id = (await createCarousel("AI demo", "ig-4:5", "midnight-neon")).id;
console.log("USER  > Make a carousel explaining how AI works\n");

for (const { say, tool, args } of modelTurns) {
  const res = await executeToolCall(id, tool, args);
  console.log(`MODEL > ${say}\n        ${tool}(${JSON.stringify(args)})`);
  console.log(`TOOL  < ${res.success ? "ok" : "REJECTED"}: ${res.message}\n`);
}

const carousel = (await readCarousel(id))!;
console.log(`carousel.json holds ${carousel.slides.length} slides:`);
console.log(JSON.stringify(carousel.slides.map(({ type, order, ...s }) => ({ type, order, ...s })), null, 2));

const images = await exportAllSlides(carousel.slides, await resolveTheme(carousel.themeId), carousel.aspectRatio, {
  format: "png",
  brand: { name: "Slidr" },
});
await mkdir(OUT, { recursive: true });
for (const img of images) await writeFile(path.join(OUT, img.name), img.buffer);
console.log(`\nRendered ${images.length} PNGs -> ${path.relative(process.cwd(), OUT)}/`);

await deleteCarousel(id);
await closeBrowser();
