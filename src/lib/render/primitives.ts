import type { RenderTokens } from "./tokens";
import type { SlideBrand } from "@/types/carousel";

/** Escape text for safe interpolation into HTML. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ShellOptions {
  tokens: RenderTokens;
  /** Slide position, 1-based. */
  index: number;
  total: number;
  /** Optional brand name rendered in the footer. */
  brand?: SlideBrand;
  /** Use the accent gradient as the slide background. */
  gradient?: boolean;
  /** Vertically center the content block. */
  center?: boolean;
}

/**
 * The shared slide shell: full-bleed background, consistent padding, and a
 * footer with the brand mark and slide numbering. Every template renders
 * inside this.
 */
export function shell(inner: string, opts: ShellOptions): string {
  const { tokens: t, index, total, brand, gradient, center } = opts;

  const background = gradient && t.colors.gradient
    ? t.colors.gradient
    : t.colors.background;

  // If a logo is configured it replaces the brand name, so the two never
  // compete for the same corner.
  const brandMark = brand?.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="" style="height:${Math.round(28 * t.scale)}px; max-width:${Math.round(160 * t.scale)}px; object-fit:contain;" />`
    : brand?.name
      ? `<span>${esc(brand.name)}</span>`
      : "";

  const placement = t.brandPlacement ?? "footer";

  // The footer always carries the slide counter; the brand joins it only in
  // the default "footer" placement.
  const footer = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:${t.gap}px; font-family:${t.fonts.bodyStack}; font-size:${t.sizes.small}px; color:${t.colors.text}; opacity:0.45; letter-spacing:0.08em; text-transform:uppercase;">
      <span style="display:flex; align-items:center; min-width:0;">${placement === "footer" ? brandMark : ""}</span>
      <span style="flex-shrink:0;">${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
    </div>`;

  // Non-footer placements render the brand as an absolutely-positioned layer
  // so it never participates in the flex layout.
  const brandLayer =
    placement !== "footer" && brandMark
      ? placement === "corner"
        ? `<div style="position:absolute; top:${t.pad}px; left:${t.pad}px; z-index:2; font-family:${t.fonts.bodyStack}; font-size:${t.sizes.small}px; color:${t.colors.text}; opacity:0.6; letter-spacing:0.08em; text-transform:uppercase;">${brandMark}</div>`
        : placement === "watermark"
          ? `<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:0; pointer-events:none; font-family:${t.fonts.headingStack}; font-size:${Math.round(t.sizes.hook * 1.6)}px; font-weight:800; color:${t.colors.text}; opacity:0.06; letter-spacing:-0.02em; white-space:nowrap; overflow:hidden;">${brandMark}</div>`
          : ""
      : "";

  const justify = center ? "center" : "flex-start";

  return `
  <div style="
    position:relative;
    width:${t.width}px;
    height:${t.height}px;
    background:${background};
    color:${t.colors.text};
    font-family:${t.fonts.bodyStack};
    display:flex;
    flex-direction:column;
    padding:${t.pad}px;
    box-sizing:border-box;
    overflow:hidden;
  ">
    ${brandLayer}
    <div style="
      flex:1;
      display:flex;
      flex-direction:column;
      justify-content:${justify};
      gap:${t.gap}px;
      min-height:0;
      position:relative;
      z-index:1;
    ">
      ${inner}
    </div>
    ${footer}
  </div>`;
}

/** A small uppercase label above a heading. */
export function eyebrow(text: string, t: RenderTokens): string {
  return `<div style="
    font-family:${t.fonts.bodyStack};
    font-size:${t.sizes.small}px;
    font-weight:700;
    letter-spacing:0.16em;
    text-transform:uppercase;
    color:${t.colors.accent};
  ">${esc(text)}</div>`;
}

/** A slide heading. */
export function heading(text: string, t: RenderTokens, size?: number): string {
  return `<h2 style="
    font-family:${t.fonts.headingStack};
    font-size:${size ?? t.sizes.h1}px;
    font-weight:700;
    line-height:1.08;
    letter-spacing:-0.02em;
    color:${t.colors.text};
    margin:0;
  ">${esc(text)}</h2>`;
}

/** A thin accent rule used to separate the heading from content. */
export function rule(t: RenderTokens): string {
  return `<div style="width:${Math.round(72 * t.scale)}px; height:${Math.max(3, Math.round(4 * t.scale))}px; background:${t.colors.accent}; border-radius:2px;"></div>`;
}

/** A bulleted list with accent markers. */
export function bullets(items: string[], t: RenderTokens): string {
  const rows = items
    .map(
      (item) => `
      <li style="display:flex; gap:${Math.round(t.gap * 0.6)}px; align-items:flex-start;">
        <span style="
          flex-shrink:0;
          width:${Math.round(10 * t.scale)}px;
          height:${Math.round(10 * t.scale)}px;
          margin-top:${Math.round(t.sizes.body * 0.42)}px;
          border-radius:50%;
          background:${t.colors.accent};
        "></span>
        <span style="font-family:${t.fonts.bodyStack}; font-size:${t.sizes.body}px; line-height:1.5; color:${t.colors.text};">${esc(item)}</span>
      </li>`
    )
    .join("");

  return `<ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.7)}px;">${rows}</ul>`;
}

/**
 * A surface card used by the comparison template.
 *
 * `maxHeight` defaults to a generous share of the canvas. Without a cap, a
 * short card on a tall aspect ratio (9:16) stretches into a large empty box.
 */
export function card(
  inner: string,
  t: RenderTokens,
  accent = false,
  maxHeight = Math.round(t.height * 0.72)
): string {
  const radius = Math.round(20 * t.scale);
  return `<div style="
    flex:1 1 auto;
    min-width:0;
    max-height:${maxHeight}px;
    background:${t.colors.surface};
    border:1px solid color-mix(in srgb, ${t.colors.text} 12%, transparent);
    border-radius:${radius}px;
    padding:${Math.round(t.pad * 0.5)}px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:${Math.round(t.gap * 0.7)}px;
    overflow:hidden;
    ${accent ? `box-shadow: inset 0 ${Math.max(4, Math.round(6 * t.scale))}px 0 0 ${t.colors.accent};` : ""}
  ">${inner}</div>`;
}

/**
 * A vertical list of rows in the flexible content region.
 *
 * `mode`:
 * - `center` — rows hug their content, group is centered (sparse short content)
 * - `spread` — rows fill the height evenly, up to `maxRowHeight`
 *
 * `availableHeight` is the height the rows may occupy, in px. It is passed in
 * rather than measured because static HTML has no layout pass; the renderer
 * knows the canvas dimensions, so it does the arithmetic up front.
 */
export function stack(
  rows: string[],
  t: RenderTokens,
  mode: "center" | "spread" = "center",
  availableHeight = 0
): string {
  if (mode === "spread" && rows.length > 0) {
    // Cap each row so tall canvases (9:16 at 1920px) do not stretch three
    // events into three enormous boxes. Rows still fill shorter canvases.
    const even = availableHeight > 0 ? availableHeight / rows.length : 0;
    const cap = Math.max(Math.round(150 * t.scale), Math.round(even * 0.7));

    const grown = rows
      .map(
        (row) =>
          `<div style="flex:1 1 auto; min-height:0; max-height:${cap}px; display:flex; flex-direction:column; justify-content:center;">${row}</div>`
      )
      .join("");
    return `<div style="flex:1; min-height:0; display:flex; flex-direction:column; justify-content:center; gap:${Math.round(t.gap * 0.8)}px;">${grown}</div>`;
  }

  return `<div style="
    flex:1;
    min-height:0;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:${Math.round(t.gap * 1.5)}px;
  ">${rows.join("")}</div>`;
}

/** A small numbered badge (01, 02, …) used by process and timeline templates. */
export function badge(n: number, t: RenderTokens): string {
  return `<div style="
    flex-shrink:0;
    width:${Math.round(52 * t.scale)}px;
    height:${Math.round(52 * t.scale)}px;
    border-radius:50%;
    background:${t.colors.accent};
    color:${t.colors.background};
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:${t.fonts.headingStack};
    font-size:${Math.round(22 * t.scale)}px;
    font-weight:700;
  ">${String(n).padStart(2, "0")}</div>`;
}
