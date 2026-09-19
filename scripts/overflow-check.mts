import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getTheme } from "@/lib/themes";
import { exportSlide, closeBrowser } from "@/lib/export-slides";
import type { Slide } from "@/types/carousel";

const OUT = "/tmp/slidr-overflow";

// Deliberately oversized content to prove fitting prevents clipping.
const slides: Slide[] = [
  { id: "1", type: "cover", order: 0,
    title: "A Deliberately Extremely Long Cover Headline That Would Normally Overflow The Slide Badly",
    subtitle: "And a subtitle that also runs on for quite a while to stress the reserved space calculation",
    eyebrow: "Overflow stress test" },
  { id: "2", type: "quote", order: 1,
    quote: "This is a very long quotation indeed, one that keeps going well past the point where a normal quote would have stopped, testing whether the fitting logic shrinks the type enough to keep every word visible on the slide without clipping any of it.",
    attribution: "A Very Long Attribution Line" },
  { id: "3", type: "text", order: 2,
    title: "A Long Section Heading That Needs To Shrink",
    body: "This body paragraph is intentionally verbose. It exists to confirm that the renderer reduces the type size rather than letting the text run off the bottom edge of the slide, which is the failure mode that silent overflow:hidden would otherwise hide from us entirely.",
    bullets: ["A bullet point that is reasonably long and descriptive", "Another bullet of similar length for good measure", "A third bullet to fill out the list"] },
  { id: "4", type: "conclusion", order: 3,
    title: "A Conclusion Title That Is Also Quite Long Indeed",
    body: "The closing paragraph is likewise longer than typical, so the fitting logic has to account for the call-to-action pill below it.",
    cta: "Follow for more" },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const theme = await getTheme("swiss-grid");
  if (!theme) throw new Error("theme missing");

  for (let i = 0; i < slides.length; i++) {
    const buf = await exportSlide(slides[i], theme, "ig-4:5", {
      index: i + 1, total: slides.length, brand: { name: "Slidr" }, format: "png",
    });
    const name = `${String(i + 1).padStart(2, "0")}-${slides[i].type}.png`;
    await writeFile(path.join(OUT, name), buf);
    console.log(`  ${name}`);
  }
  console.log(`\nOutput: ${OUT}`);
  await closeBrowser();
}

main().catch(async (e) => { console.error("FAILED:", e); await closeBrowser().catch(() => {}); process.exit(1); });
