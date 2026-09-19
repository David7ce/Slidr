import { parseDesignMd } from "@/lib/themes/parser";
import { readFileSync, readdirSync } from "fs";
import path from "path";

/**
 * DESIGN.md parser tests.
 *
 * The parser feeds the renderer's design tokens and the AI's theme descriptions,
 * so a silently-empty field degrades output without failing anything obvious.
 */

const DIR = path.join(process.cwd(), "src/lib/themes/presets");

function parse(id: string) {
  return parseDesignMd(id, readFileSync(path.join(DIR, `${id}.md`), "utf-8"));
}

const ids = readdirSync(DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""));

describe("theme presets", () => {
  it("has at least 8 themes", () => {
    expect(ids.length).toBeGreaterThanOrEqual(8);
  });

  it.each(ids)("parses %s without empty required fields", (id) => {
    const t = parse(id);
    expect(t.name).toBeTruthy();
    expect(t.atmosphere).toBeTruthy();
    expect(t.fonts.heading).toBeTruthy();
    expect(t.fonts.body).toBeTruthy();
    for (const [role, color] of Object.entries(t.palette)) {
      if (role === "gradient") continue;
      expect(color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }
  });

  it.each(ids)("parses design rules for %s", (id) => {
    // Regression: the section regex was missing the `m` flag, so every theme
    // reported zero rules.
    expect(parse(id).designRules.length).toBeGreaterThan(0);
  });

  it.each(ids)("resolves a generic CSS fallback for %s", (id) => {
    const t = parse(id);
    const generics = ["serif", "sans-serif", "monospace", "system-ui"];
    expect(generics).toContain(t.fonts.headingFallback);
    expect(generics).toContain(t.fonts.bodyFallback);
  });

  it("infers a monospace fallback from a mono font name", () => {
    const t = parseDesignMd(
      "test",
      `# Design System: Test
> Category: General
> A test.
- Heading: "Space Grotesk"
- Body: "IBM Plex Mono"
## 6. Design Rules
- One rule
`
    );
    expect(t.fonts.bodyFallback).toBe("monospace");
  });

  it("infers a serif fallback from a serif font name", () => {
    const t = parseDesignMd(
      "test",
      `# Design System: Test
> Category: General
> A test.
- Heading: "Fraunces"
- Body: "Inter"
## 6. Design Rules
- One rule
`
    );
    expect(t.fonts.headingFallback).toBe("serif");
    expect(t.fonts.bodyFallback).toBe("sans-serif");
  });

  it("reads heading/body fallbacks separated by a slash", () => {
    const t = parseDesignMd(
      "test",
      `# Design System: Test
> Category: General
> A test.
- Heading: "A"
- Body: "B"
- Fallbacks: Georgia, serif / monospace
## 6. Design Rules
- One rule
`
    );
    expect(t.fonts.headingFallback).toBe("serif");
    expect(t.fonts.bodyFallback).toBe("monospace");
  });

  it("falls back to defaults for a malformed document", () => {
    const t = parseDesignMd("broken", "not a design file");
    expect(t.fonts.heading).toBe("Inter");
    expect(t.palette.background).toBe("#000000");
    expect(t.designRules).toEqual([]);
  });
});
