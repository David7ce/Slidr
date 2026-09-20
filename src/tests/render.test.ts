import { renderSlide } from "@/lib/render";
import { computeScale } from "@/lib/render/tokens";
import { validateSlideContent } from "@/lib/slides/schema";
import { createBlankSlide } from "@/lib/slides/blank";
import { parseDesignMd } from "@/lib/themes/parser";
import { DIMENSIONS, type AspectRatio, type Slide } from "@/types/carousel";
import { readFileSync } from "fs";
import path from "path";

/**
 * Renderer contract tests.
 *
 * These lock in the core invariant of the architecture: the AI supplies
 * content, the renderer supplies design. Every type must render to standalone
 * HTML at the exact target dimensions for every aspect ratio.
 */

const DESIGN_MD = readFileSync(
  path.join(process.cwd(), "src/lib/themes/presets/swiss-grid.md"),
  "utf-8"
);
const theme = parseDesignMd("swiss-grid", DESIGN_MD);

const byType: Record<string, Record<string, unknown>> = {
  cover: { title: "Human Brain vs AI", subtitle: "Two systems", eyebrow: "Neuroscience" },
  text: { title: "Where they diverge", body: "Brains need few examples.", bullets: ["Analog", "Digital"] },
  comparison: {
    title: "The basic unit",
    left: { title: "Biological", items: ["Electrochemical"] },
    right: { title: "Artificial", items: ["Mathematical"] },
  },
  statistic: { title: "By the numbers", stats: [{ value: "86B", label: "Neurons" }] },
  timeline: { title: "History", events: [{ label: "1943", title: "McCulloch-Pitts" }, { label: "2012", title: "AlexNet" }] },
  process: { title: "How it fires", steps: [{ title: "Receive" }, { title: "Integrate" }] },
  diagram: { title: "Architecture", center: "Learning", nodes: [{ label: "Inputs" }, { label: "Weights" }] },
  quote: { quote: "The brain is a computer made of wetware.", attribution: "Neuroscience" },
  conclusion: { title: "One principle", body: "Both adjust connections.", cta: "Follow" },
};

const SLIDE_TYPES = Object.keys(byType);

describe("renderSlide", () => {
  it.each(SLIDE_TYPES)("renders a %s slide with no unescaped template markers", (type) => {
    const content = { ...byType[type], id: "s1", order: 0, type } as unknown as Slide;
    const html = renderSlide(content, theme, "ig-4:5", { index: 1, total: 9 });

    expect(html.length).toBeGreaterThan(50);
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("${");
  });

  it("renders every type at the exact dimensions of every aspect ratio", () => {
    const ratios = Object.keys(DIMENSIONS) as AspectRatio[];

    for (const ratio of ratios) {
      const { width, height } = DIMENSIONS[ratio];
      for (const type of SLIDE_TYPES) {
        const content = { ...byType[type], id: "s1", order: 0, type } as unknown as Slide;
        const html = renderSlide(content, theme, ratio, { index: 1, total: 9 });
        expect(html).toContain(`width:${width}px`);
        expect(html).toContain(`height:${height}px`);
      }
    }
  });

  it("escapes HTML in user content", () => {
    const content = {
      type: "text",
      title: '<script>alert("xss")</script>',
      id: "s1",
      order: 0,
    } as unknown as Slide;
    const html = renderSlide(content, theme, "ig-4:5", { index: 1, total: 1 });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("applies the theme palette and fonts", () => {
    const content = { ...byType.cover, id: "s1", order: 0, type: "cover" } as unknown as Slide;
    const html = renderSlide(content, theme, "ig-4:5", { index: 1, total: 1 });

    expect(html).toContain(theme.palette.background);
    expect(html).toContain(theme.palette.accent);
    expect(html).toContain(theme.fonts.heading);
  });
});

describe("slide schema", () => {
  it.each(SLIDE_TYPES)("accepts a valid %s payload", (type) => {
    expect(validateSlideContent({ ...byType[type], type }).ok).toBe(true);
  });

  it("rejects an unknown type", () => {
    expect(validateSlideContent({ type: "pie-chart", title: "x" }).ok).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(validateSlideContent({ type: "cover", title: "   " }).ok).toBe(false);
  });

  it("rejects too many bullets", () => {
    const bullets = Array.from({ length: 20 }, (_, i) => `b${i}`);
    expect(validateSlideContent({ type: "text", title: "x", bullets }).ok).toBe(false);
  });

  it("rejects a comparison missing a side", () => {
    expect(validateSlideContent({ type: "comparison", title: "x" }).ok).toBe(false);
  });

  it("reports a useful error message", () => {
    const res = validateSlideContent({ type: "cover", title: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("title");
  });
});

describe("blank slide payloads", () => {
  it.each(SLIDE_TYPES)("produces valid content for %s", (type) => {
    const content = createBlankSlide(type);
    expect(content).not.toBeNull();
    const res = validateSlideContent(content);
    if (!res.ok) throw new Error(`${type}: ${res.error}`);
    expect(res.ok).toBe(true);
  });

  it("returns null for an unknown type", () => {
    expect(createBlankSlide("pie-chart")).toBeNull();
  });

  it("every blank payload renders without error", () => {
    for (const type of SLIDE_TYPES) {
      const content = createBlankSlide(type);
      const slide = { ...content, id: "s", order: 0 } as unknown as Slide;
      const html = renderSlide(slide, theme, "ig-4:5", { index: 1, total: 9 });
      expect(html.length).toBeGreaterThan(50);
      expect(html).not.toContain("undefined");
    }
  });
});

describe("brand mark", () => {
  const cover = { ...byType.cover, id: "s1", order: 0, type: "cover" } as unknown as Slide;

  it("renders the brand name when set", () => {
    const html = renderSlide(cover, theme, "ig-4:5", {
      index: 1,
      total: 1,
      brand: { name: "Acme" },
    });
    expect(html).toContain("Acme");
  });

  it("renders a logo image when a logo URL is set", () => {
    const html = renderSlide(cover, theme, "ig-4:5", {
      index: 1,
      total: 1,
      brand: { name: "Acme", logoUrl: "/api/projects/p1/assets/logo.png" },
    });
    expect(html).toContain("<img");
    expect(html).toContain("/api/projects/p1/assets/logo.png");
  });

  it("prefers the logo over the name so they never collide", () => {
    const html = renderSlide(cover, theme, "ig-4:5", {
      index: 1,
      total: 1,
      brand: { name: "Acme", logoUrl: "/logo.png" },
    });
    expect(html).toContain("<img");
    expect(html).not.toContain(">Acme<");
  });

  it("omits the brand mark when no brand is given", () => {
    const html = renderSlide(cover, theme, "ig-4:5", { index: 1, total: 1 });
    expect(html).not.toContain("<img");
  });

  it("escapes a logo URL to prevent attribute injection", () => {
    const html = renderSlide(cover, theme, "ig-4:5", {
      index: 1,
      total: 1,
      brand: { logoUrl: '/x.png" onerror="alert(1)' },
    });
    expect(html).not.toContain('onerror="alert(1)');
  });

  it("always renders the slide counter", () => {
    const html = renderSlide(cover, theme, "ig-4:5", { index: 3, total: 7 });
    expect(html).toContain("03 / 07");
  });
});

describe("layout constraints", () => {
  const at = (ratio: AspectRatio, slide: Slide) =>
    renderSlide(slide, theme, ratio, { index: 1, total: 4 });

  it("caps comparison card height so tall canvases do not stretch them", () => {
    const slide = { ...byType.comparison, id: "s", order: 0, type: "comparison" } as unknown as Slide;
    const html = at("ig-9:16", slide);
    expect(html).toContain("max-height:");
  });

  it("caps diagram node height", () => {
    const slide = { ...byType.diagram, id: "s", order: 0, type: "diagram" } as unknown as Slide;
    const html = at("ig-9:16", slide);
    expect(html).toMatch(/height:\d+px/);
  });

  it("gives spread rows a max-height so events do not drift apart", () => {
    const slide = { ...byType.timeline, id: "s", order: 0, type: "timeline" } as unknown as Slide;
    const html = at("ig-9:16", slide);
    expect(html).toContain("max-height:");
  });

  it("keeps the row cap at least 150px scaled", () => {
    const slide = { ...byType.process, id: "s", order: 0, type: "process" } as unknown as Slide;
    const html = at("ig-9:16", slide);
    const maxHeight = [...html.matchAll(/max-height:(\d+)px/g)].map((m) => Number(m[1]));
    expect(Math.max(...maxHeight)).toBeGreaterThanOrEqual(150);
  });

  it("renders a shorter canvas with smaller type than a taller one", () => {
    const slide = { ...byType.cover, id: "s", order: 0, type: "cover" } as unknown as Slide;
    const sizeIn = (html: string) => {
      const m = html.match(/font-size:(\d+)px/);
      return m ? Number(m[1]) : 0;
    };
    expect(sizeIn(at("li-16:9", slide))).toBeLessThanOrEqual(sizeIn(at("ig-9:16", slide)));
  });
});

describe("computeScale", () => {
  it("is 1 for the base 4:5 ratio", () => {
    expect(computeScale("ig-4:5")).toBe(1);
  });

  it("scales by the binding dimension, not area", () => {
    // 9:16 has the same width as the base but more height, so text must not
    // grow (area-based scaling would push it to 1.12 and overflow the width).
    expect(computeScale("ig-9:16")).toBe(1);
    // 16:9 has less height than the base, so text must shrink.
    expect(computeScale("li-16:9")).toBeLessThan(1);
  });

  it("shrinks square slides to fit their shorter height", () => {
    expect(computeScale("ig-1:1")).toBeLessThan(1);
    expect(computeScale("li-1:1")).toBeLessThan(1);
  });

  it("never exceeds the clamp", () => {
    for (const ratio of Object.keys(DIMENSIONS) as AspectRatio[]) {
      expect(computeScale(ratio)).toBeLessThanOrEqual(1.2);
      expect(computeScale(ratio)).toBeGreaterThanOrEqual(0.7);
    }
  });
});
