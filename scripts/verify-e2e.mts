/**
 * End-to-end check: project storage -> AI tool layer -> export pipeline.
 *
 * Exercises the same code paths the app uses, without going through HTTP.
 */
import { writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import {
  createCarousel,
  readCarousel,
  addSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
  listCarousels,
  deleteCarousel,
} from "@/lib/projects";
import { executeToolCall } from "@/lib/llm/adapter";
import { exportAllSlides, resolveTheme, closeBrowser } from "@/lib/export-slides";
import { validateSlideContent } from "@/lib/slides/schema";

const OUT = "/tmp/slidr-e2e";

function check(label: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // 1. Create a project
  const carousel = await createCarousel("E2E Test", "ig-4:5", "swiss-grid");
  check("createCarousel writes carousel.json", (await readCarousel(carousel.id)) !== null);

  const file = path.join(process.cwd(), "projects", carousel.id, "carousel.json");
  check("project dir has assets/", await exists(path.join(process.cwd(), "projects", carousel.id, "assets")));
  check("project dir has output/", await exists(path.join(process.cwd(), "projects", carousel.id, "output")));
  console.log(`      file: ${path.relative(process.cwd(), file)}`);

  // 2. AI tool layer: metadata
  const meta = await executeToolCall(carousel.id, "set_carousel", {
    title: "Human Brain vs AI",
    size: "ig-4:5",
    theme: "swiss-grid",
  });
  check("set_carousel succeeds", meta.success);

  // invalid theme is rejected
  const badTheme = await executeToolCall(carousel.id, "set_carousel", { theme: "does-not-exist" });
  check("set_carousel rejects unknown theme", !badTheme.success);

  // 3. AI tool layer: slides of every type
  const contents = [
    { type: "cover", title: "Human Brain vs AI", subtitle: "Similar principles, different systems", eyebrow: "Neuroscience" },
    { type: "comparison", title: "The basic unit", left: { title: "Biological", items: ["Electrochemical", "Biological cell"] }, right: { title: "Artificial", items: ["Mathematical", "Numerical inputs"] } },
    { type: "statistic", title: "By the numbers", stats: [{ value: "86B", label: "Neurons" }, { value: "20W", label: "Power" }] },
    { type: "timeline", title: "History", events: [{ label: "1943", title: "McCulloch-Pitts" }, { label: "2012", title: "AlexNet" }] },
    { type: "process", title: "How it fires", steps: [{ title: "Receive" }, { title: "Integrate" }, { title: "Transmit" }] },
    { type: "diagram", title: "Architecture", center: "Learning", nodes: [{ label: "Inputs" }, { label: "Weights" }] },
    { type: "text", title: "Divergence", body: "Brains need few examples.", bullets: ["Analog", "Digital"] },
    { type: "quote", quote: "The brain is a computer made of wetware.", attribution: "Neuroscience" },
    { type: "conclusion", title: "One principle", body: "Both adjust connections.", cta: "Follow for more" },
  ];

  for (const content of contents) {
    const res = await executeToolCall(carousel.id, "add_slide", content);
    check(`add_slide ${content.type}`, res.success);
  }

  const after = await readCarousel(carousel.id);
  check("all 9 slides persisted", after?.slides.length === 9);

  // 4. Invalid content is rejected, not stored
  const bad = await executeToolCall(carousel.id, "add_slide", { type: "cover", title: "" });
  check("add_slide rejects empty title", !bad.success);
  const badType = await executeToolCall(carousel.id, "add_slide", { type: "pie-chart", title: "x" });
  check("add_slide rejects unknown type", !badType.success);
  const oversized = await executeToolCall(carousel.id, "add_slide", {
    type: "text",
    title: "ok",
    bullets: Array.from({ length: 20 }, (_, i) => `bullet ${i}`),
  });
  check("add_slide rejects too many bullets", !oversized.success);

  const stillNine = await readCarousel(carousel.id);
  check("rejected payloads did not mutate storage", stillNine?.slides.length === 9);

  // 5. Update / reorder / delete
  const firstId = stillNine!.slides[0].id;
  const upd = await executeToolCall(carousel.id, "update_slide", {
    slideId: firstId,
    type: "cover",
    title: "Human Brain vs AI (edited)",
    subtitle: "Updated subtitle",
  });
  check("update_slide preserves type", upd.success);

  const ids = stillNine!.slides.map((s) => s.id);
  const reordered = [ids[1], ids[0], ...ids.slice(2)];
  check("reorder_slides succeeds", await reorderSlides(carousel.id, reordered));
  const afterReorder = await readCarousel(carousel.id);
  check("reorder applied order 0", afterReorder!.slides[0].id === ids[1]);
  check("order fields reindexed", afterReorder!.slides.every((s, i) => s.order === i));

  check("delete_slide succeeds", await deleteSlide(carousel.id, ids[8]));
  const afterDelete = await readCarousel(carousel.id);
  check("slide removed", afterDelete!.slides.length === 8);
  check("order reindexed after delete", afterDelete!.slides.every((s, i) => s.order === i));

  // reorder with unknown id must not corrupt
  check("reorder rejects unknown ids", !(await reorderSlides(carousel.id, ["nope"])));
  const intact = await readCarousel(carousel.id);
  check("carousel intact after failed reorder", intact!.slides.length === 8);

  // 6. Schema unit checks
  check("schema accepts valid text slide", validateSlideContent({ type: "text", title: "Hi" }).ok);
  check("schema rejects missing required field", !validateSlideContent({ type: "comparison", title: "x" }).ok);

  // 7. Export the whole carousel
  const fresh = await readCarousel(carousel.id);
  const theme = await resolveTheme(fresh!.themeId);
  console.log(`      theme: ${theme.id} (${theme.name})`);

  const images = await exportAllSlides(fresh!.slides, theme, fresh!.aspectRatio, {
    format: "png",
    brand: { name: "Slidr" },
  });
  check("exported one file per slide", images.length === fresh!.slides.length);

  let total = 0;
  for (const img of images) {
    await writeFile(path.join(OUT, img.name), img.buffer);
    total += img.buffer.length;
    check(`  ${img.name} is a valid PNG`, img.buffer.subarray(1, 4).toString() === "PNG");
  }
  console.log(`      ${(total / 1024).toFixed(0)} KB total`);

  // 8. List / delete
  const listed = await listCarousels();
  check("listCarousels includes project", listed.some((c) => c.id === carousel.id));
  check("deleteCarousel removes it", await deleteCarousel(carousel.id));
  check("readCarousel returns null after delete", (await readCarousel(carousel.id)) === null);

  console.log(`\nOutput: ${OUT}`);
  await closeBrowser();
}

async function exists(p: string): Promise<boolean> {
  try {
    const { access } = await import("fs/promises");
    await access(p);
    return true;
  } catch {
    return false;
  }
}

main().catch(async (e) => {
  console.error("FAILED:", e);
  await closeBrowser().catch(() => {});
  process.exit(1);
});