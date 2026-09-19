import { estimateLines, estimateHeight, fitHeading, fitBody, fitFontSize } from "@/lib/render/fit";

/**
 * Text fitting tests.
 *
 * The renderer cannot measure real text, so it estimates. These tests pin the
 * properties that matter: fitting never grows text, never returns below the
 * floor, and shrinks as content gets longer.
 */

describe("estimateLines", () => {
  it("returns 1 for a short string", () => {
    expect(estimateLines("Hi", 48, 900, 0.54)).toBe(1);
  });

  it("grows with longer text", () => {
    const short = estimateLines("Short title", 48, 900, 0.54);
    const long = estimateLines("A considerably longer title that keeps going", 48, 900, 0.54);
    expect(long).toBeGreaterThan(short);
  });

  it("grows as the font size increases", () => {
    const text = "A moderately long heading for testing";
    expect(estimateLines(text, 96, 900, 0.54)).toBeGreaterThanOrEqual(
      estimateLines(text, 48, 900, 0.54)
    );
  });

  it("handles a single word longer than the line", () => {
    expect(estimateLines("Supercalifragilisticexpialidocious", 48, 200, 0.54)).toBeGreaterThan(1);
  });

  it("never returns less than 1", () => {
    expect(estimateLines("", 48, 900, 0.54)).toBe(1);
  });
});

describe("fitFontSize", () => {
  const base = {
    baseSize: 104,
    minSize: 52,
    maxWidth: 920,
    maxHeight: 400,
    lineHeight: 1.02,
  };

  it("keeps the base size when text fits", () => {
    expect(fitFontSize("Short", base)).toBe(base.baseSize);
  });

  it("shrinks long text", () => {
    const long = "An extremely long headline that will certainly not fit on one line at full size";
    expect(fitFontSize(long, base)).toBeLessThan(base.baseSize);
  });

  it("never returns below minSize", () => {
    const huge = Array.from({ length: 200 }, () => "word").join(" ");
    expect(fitFontSize(huge, base)).toBeGreaterThanOrEqual(base.minSize);
  });

  it("never returns above baseSize", () => {
    expect(fitFontSize("x", base)).toBeLessThanOrEqual(base.baseSize);
  });

  it("returns baseSize for empty input", () => {
    expect(fitFontSize("   ", base)).toBe(base.baseSize);
  });

  it("returns baseSize when the box is degenerate", () => {
    expect(fitFontSize("text", { ...base, maxWidth: 0 })).toBe(base.baseSize);
    expect(fitFontSize("text", { ...base, maxHeight: 0 })).toBe(base.baseSize);
  });

  it("is monotonic: more text never yields a larger size", () => {
    const short = fitHeading("Short", 104, 920, 400);
    const medium = fitHeading("A somewhat longer headline here", 104, 920, 400);
    const long = fitHeading(
      "An extremely long headline that will certainly not fit on one line at full size",
      104,
      920,
      400
    );
    expect(medium).toBeLessThanOrEqual(short);
    expect(long).toBeLessThanOrEqual(medium);
  });
});

describe("fitHeading / fitBody", () => {
  it("fitHeading floors at half the base size", () => {
    const huge = Array.from({ length: 300 }, () => "word").join(" ");
    expect(fitHeading(huge, 100, 900, 300)).toBeGreaterThanOrEqual(50);
  });

  it("fitBody floors at 70% of the base size", () => {
    const huge = Array.from({ length: 300 }, () => "word").join(" ");
    expect(fitBody(huge, 100, 900, 300)).toBeGreaterThanOrEqual(70);
  });

  it("estimateHeight scales with line count", () => {
    const one = estimateHeight("Hi", 48, 900, 1.5, 0.5);
    const many = estimateHeight(
      "A much longer piece of body copy that wraps across several lines",
      48,
      900,
      1.5,
      0.5
    );
    expect(many).toBeGreaterThan(one);
  });
});
