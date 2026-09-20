import {
  hexToRgb,
  luminance,
  contrastRatio,
  themeContrastChecks,
  failingContrast,
  passesContrast,
  AA_NORMAL,
  AA_LARGE,
} from "@/lib/render/contrast";
import { parseDesignMd } from "@/lib/themes/parser";
import { readFileSync, readdirSync } from "fs";
import path from "path";

/**
 * Colour-contrast tests.
 *
 * The renderer places text on theme backgrounds. These tests verify the
 * palette pairs the renderer actually produces meet the WCAG AA threshold,
 * so a low-contrast theme cannot silently ship.
 */

describe("hexToRgb", () => {
  it("parses 3-digit hex", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses 6-digit hex", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("parses 8-digit hex ignoring alpha", () => {
    expect(hexToRgb("#ff000080")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("is case-insensitive", () => {
    expect(hexToRgb("#FF00FF")).toEqual({ r: 255, g: 0, b: 255 });
  });

  it("returns null for invalid input", () => {
    expect(hexToRgb("red")).toBeNull();
    expect(hexToRgb("#12345")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });
});

describe("luminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(luminance("#000000")).toBeCloseTo(0, 5);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#000000"),
      5
    );
  });
});

describe("theme contrast", () => {
  const DIR = path.join(process.cwd(), "src/lib/themes/presets");
  const ids = readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  it("builds checks for the pairs the renderer produces", () => {
    const theme = parseDesignMd("test", `# Design System: Test
> Category: General
> A test.
- Heading: "Inter"
- Body: "Inter"
## 6. Design Rules
- One rule
`);
    const checks = themeContrastChecks(theme);
    expect(checks.length).toBeGreaterThanOrEqual(5);
    expect(checks.some((c) => c.label === "body on background")).toBe(true);
    expect(checks.some((c) => c.label === "background on accent")).toBe(true);
  });

  it.each(ids)("all text/background pairs in %s meet WCAG AA", (id) => {
    const theme = parseDesignMd(
      id,
      readFileSync(path.join(DIR, `${id}.md`), "utf-8")
    );
    const failures = failingContrast(theme);
    expect(failures).toEqual([]);
  });

  it("flags a deliberately low-contrast pair", () => {
    const theme = parseDesignMd("test", `# Design System: Test
> Category: General
> A test.
- Heading: "Inter"
- Body: "Inter"
## 2. Color Palette & Roles
- **Primary** (\`#999999\`): CSS var \`--palette-bg-primary\`.
- **Secondary** (\`#999999\`): CSS var \`--palette-bg-secondary\`.
- **Accent** (\`#999999\`): CSS var \`--palette-accent\`.
- **Background** (\`#ffffff\`): CSS var \`--palette-bg-background\`.
- **Surface** (\`#ffffff\`): CSS var \`--palette-bg-surface\`.
- **Text** (\`#999999\`): CSS var \`--palette-text\`.
## 6. Design Rules
- One rule
`);
    const failures = failingContrast(theme);
    expect(failures.length).toBeGreaterThan(0);
    expect(passesContrast(failures[0])).toBe(false);
  });

  it("exposes the AA thresholds", () => {
    expect(AA_NORMAL).toBe(4.5);
    expect(AA_LARGE).toBe(3.0);
  });
});