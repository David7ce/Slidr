import type {
  CoverSlide,
  TextSlide,
  ComparisonSlide,
  StatisticSlide,
  TimelineSlide,
  ProcessSlide,
  DiagramSlide,
  QuoteSlide,
  ConclusionSlide,
  SlideBrand,
} from "@/types/carousel";
import type { RenderTokens } from "./tokens";
import { esc, shell, eyebrow, heading, rule, bullets, card, badge, stack } from "./primitives";
import { fitHeading, fitBody } from "./fit";

export interface TemplateContext {
  tokens: RenderTokens;
  index: number;
  total: number;
  brand?: SlideBrand;
}

/**
 * Usable content box, in px, after the shell's padding.
 * Templates use this to fit text before it can overflow.
 */
function contentBox(t: RenderTokens): { width: number; height: number } {
  return {
    width: t.width - t.pad * 2,
    height: t.height - t.pad * 2,
  };
}

// --- cover -----------------------------------------------------------------

export function renderCover(slide: CoverSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;
  const box = contentBox(t);

  // The cover carries the largest type, so it is the most likely to overflow.
  // Reserve room for the eyebrow, rule, and subtitle before fitting the title.
  const reserved =
    (slide.eyebrow ? t.sizes.small * 2 : 0) +
    t.gap * 2 +
    (slide.subtitle ? t.sizes.h2 * 3 : 0);
  const titleSize = fitHeading(
    slide.title,
    t.sizes.hook,
    box.width,
    Math.max(t.sizes.hook, box.height - reserved),
    1.02,
    t.fonts.heading
  );

  const inner = `
    ${slide.eyebrow ? eyebrow(slide.eyebrow, t) : ""}
    <h1 style="
      font-family:${t.fonts.headingStack};
      font-size:${titleSize}px;
      font-weight:800;
      line-height:1.02;
      letter-spacing:-0.03em;
      color:${t.colors.text};
      margin:0;
    ">${esc(slide.title)}</h1>
    ${rule(t)}
    ${slide.subtitle ? `<p style="font-family:${t.fonts.bodyStack}; font-size:${t.sizes.h2}px; line-height:1.4; color:${t.colors.text}; opacity:0.75; margin:0; max-width:85%;">${esc(slide.subtitle)}</p>` : ""}
  `;
  return shell(inner, { ...ctx, center: true, gradient: true });
}

// --- text ------------------------------------------------------------------

export function renderText(slide: TextSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;
  const box = contentBox(t);

  // Heading and body share the box; give the heading its natural size and let
  // the body shrink into whatever remains.
  const headingSize = fitHeading(slide.title, t.sizes.h1, box.width, box.height * 0.4, 1.08, t.fonts.heading);
  const headingHeight = headingSize * 1.08 + t.gap * 2;
  const bodySize = slide.body
    ? fitBody(slide.body, t.sizes.h2, box.width * 0.92, box.height - headingHeight, 1.5, t.fonts.body)
    : t.sizes.h2;

  const inner = `
    <div style="display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.4)}px;">
      ${heading(slide.title, t, headingSize)}
      ${rule(t)}
    </div>
    <div style="flex:1; min-height:0; display:flex; flex-direction:column; justify-content:center; gap:${Math.round(t.gap * 1.2)}px;">
      ${slide.body ? `<p style="font-family:${t.fonts.bodyStack}; font-size:${bodySize}px; line-height:1.5; color:${t.colors.text}; opacity:0.85; margin:0; max-width:92%;">${esc(slide.body)}</p>` : ""}
      ${slide.bullets?.length ? bullets(slide.bullets, t) : ""}
    </div>
  `;
  return shell(inner, ctx);
}

// --- comparison ------------------------------------------------------------

export function renderComparison(slide: ComparisonSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;

  const side = (data: { title: string; items: string[] }, accent: boolean) =>
    card(
      `
      <div style="font-family:${t.fonts.headingStack}; font-size:${t.sizes.h2}px; font-weight:700; color:${accent ? t.colors.accent : t.colors.text};">${esc(data.title)}</div>
      ${bullets(data.items, t)}
      `,
      t,
      accent
    );

  const inner = `
    <div style="display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.4)}px;">
      ${heading(slide.title, t)}
      ${rule(t)}
    </div>
    <div style="display:flex; gap:${t.gap}px; flex:1; min-height:0;">
      ${side(slide.left, false)}
      ${side(slide.right, true)}
    </div>
  `;
  return shell(inner, ctx);
}

// --- statistic -------------------------------------------------------------

export function renderStatistic(slide: StatisticSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;
  const count = slide.stats.length;
  const statSize = count === 1 ? t.sizes.stat : count === 2 ? Math.round(t.sizes.stat * 0.8) : Math.round(t.sizes.stat * 0.62);

  const stats = slide.stats
    .map(
      (s) => `
      <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.4)}px;">
        <div style="font-family:${t.fonts.headingStack}; font-size:${statSize}px; font-weight:800; line-height:1; letter-spacing:-0.03em; color:${t.colors.accent};">${esc(s.value)}</div>
        <div style="font-family:${t.fonts.bodyStack}; font-size:${t.sizes.body}px; line-height:1.4; color:${t.colors.text}; opacity:0.8;">${esc(s.label)}</div>
      </div>`
    )
    .join("");

  const inner = `
    <div style="display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.4)}px;">
      ${slide.title ? heading(slide.title, t) : ""}
      ${rule(t)}
    </div>
    <div style="display:flex; gap:${t.gap}px; flex-wrap:wrap; flex:1; min-height:0; align-items:center;">
      ${stats}
    </div>
  `;
  return shell(inner, ctx);
}

// --- timeline --------------------------------------------------------------

export function renderTimeline(slide: TimelineSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;
  const box = contentBox(t);
  const dot = Math.round(16 * t.scale);

  // Each event is a row of [dot column][content]. The connecting rail is drawn
  // as a single line behind the dot column, spanning the stacked rows.
  const rows = slide.events.map(
    (e) => `
      <div style="display:flex; gap:${Math.round(t.gap * 0.7)}px; align-items:flex-start;">
        <div style="flex-shrink:0; width:${dot}px; display:flex; justify-content:center; padding-top:${Math.round(6 * t.scale)}px;">
          <span style="width:${dot}px; height:${dot}px; border-radius:50%; background:${t.colors.accent}; display:block; position:relative; z-index:1;"></span>
        </div>
        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.18)}px;">
          <div style="font-family:${t.fonts.bodyStack}; font-size:${t.sizes.small}px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${t.colors.accent};">${esc(e.label)}</div>
          <div style="font-family:${t.fonts.headingStack}; font-size:${t.sizes.h2}px; font-weight:700; line-height:1.2; color:${t.colors.text};">${esc(e.title)}</div>
          ${e.description ? `<div style="font-family:${t.fonts.bodyStack}; font-size:${t.sizes.body}px; line-height:1.45; color:${t.colors.text}; opacity:0.75;">${esc(e.description)}</div>` : ""}
        </div>
      </div>`
  );

  const inner = `
    <div style="display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.4)}px;">
      ${heading(slide.title, t)}
      ${rule(t)}
    </div>
    <div style="position:relative; flex:1; min-height:0; display:flex; flex-direction:column;">
      <div style="
        position:absolute;
        top:${Math.round(12 * t.scale)}px;
        bottom:${Math.round(12 * t.scale)}px;
        left:${Math.round(dot / 2)}px;
        width:${Math.max(2, Math.round(2 * t.scale))}px;
        background:color-mix(in srgb, ${t.colors.accent} 40%, transparent);
      "></div>
      ${stack(rows, t, "spread", box.height - t.sizes.h1 - t.gap * 3)}
    </div>
  `;
  return shell(inner, ctx);
}

// --- process ---------------------------------------------------------------

export function renderProcess(slide: ProcessSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;
  const box = contentBox(t);

  const rows = slide.steps.map(
    (s, i) => `
      <div style="display:flex; gap:${Math.round(t.gap * 0.8)}px; align-items:flex-start;">
        ${badge(i + 1, t)}
        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.2)}px; padding-top:${Math.round(4 * t.scale)}px;">
          <div style="font-family:${t.fonts.headingStack}; font-size:${t.sizes.h2}px; font-weight:700; line-height:1.2; color:${t.colors.text};">${esc(s.title)}</div>
          ${s.description ? `<div style="font-family:${t.fonts.bodyStack}; font-size:${t.sizes.body}px; line-height:1.45; color:${t.colors.text}; opacity:0.75;">${esc(s.description)}</div>` : ""}
        </div>
      </div>`
  );

  const inner = `
    <div style="display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.4)}px;">
      ${heading(slide.title, t)}
      ${rule(t)}
    </div>
    ${stack(rows, t, "spread", box.height - t.sizes.h1 - t.gap * 3)}
  `;
  return shell(inner, ctx);
}

// --- diagram ---------------------------------------------------------------

export function renderDiagram(slide: DiagramSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;

  const nodes = slide.nodes
    .map(
      (n) => `
      <div style="
        flex:1 1 ${Math.round(42 * t.scale)}%;
        min-width:0;
        height:${Math.round(t.height * 0.17)}px;
        background:${t.colors.surface};
        border:1px solid color-mix(in srgb, ${t.colors.text} 12%, transparent);
        border-radius:${Math.round(16 * t.scale)}px;
        padding:${Math.round(t.pad * 0.35)}px;
        display:flex;
        flex-direction:column;
        justify-content:center;
        gap:${Math.round(t.gap * 0.2)}px;
        overflow:hidden;
      ">
        <div style="font-family:${t.fonts.headingStack}; font-size:${t.sizes.body}px; font-weight:700; color:${t.colors.text};">${esc(n.label)}</div>
        ${n.description ? `<div style="font-family:${t.fonts.bodyStack}; font-size:${t.sizes.small}px; line-height:1.4; color:${t.colors.text}; opacity:0.7;">${esc(n.description)}</div>` : ""}
      </div>`
    )
    .join("");

  const inner = `
    <div style="display:flex; flex-direction:column; gap:${Math.round(t.gap * 0.4)}px;">
      ${heading(slide.title, t)}
      ${rule(t)}
    </div>
    <div style="flex:1; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:${Math.round(t.gap * 0.35)}px;">
      <div style="
        background:${t.colors.accent};
        color:${t.colors.background};
        border-radius:${Math.round(999 * t.scale)}px;
        padding:${Math.round(t.gap * 0.55)}px ${Math.round(t.gap * 1.5)}px;
        font-family:${t.fonts.headingStack};
        font-size:${t.sizes.h2}px;
        font-weight:700;
        text-align:center;
      ">${esc(slide.center)}</div>
      <div style="width:${Math.max(2, Math.round(3 * t.scale))}px; height:${Math.round(t.gap * 0.9)}px; background:${t.colors.accent}; opacity:0.5;"></div>
      <div style="width:80%; height:${Math.max(2, Math.round(2 * t.scale))}px; background:color-mix(in srgb, ${t.colors.accent} 45%, transparent);"></div>
      <div style="display:flex; flex-wrap:wrap; gap:${Math.round(t.gap * 0.6)}px; width:100%; flex:1; min-height:0; align-content:stretch;">
        ${nodes}
      </div>
    </div>
  `;
  return shell(inner, ctx);
}

// --- quote -----------------------------------------------------------------

export function renderQuote(slide: QuoteSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;
  const box = contentBox(t);

  // Reserve room for the opening mark and the attribution line.
  const reserved = t.sizes.hook * 1.6 * 0.8 + (slide.attribution ? t.sizes.body * 2.5 : 0);
  const quoteSize = fitHeading(
    slide.quote,
    t.sizes.h1,
    box.width * 0.92,
    Math.max(t.sizes.h1, box.height - reserved),
    1.25,
    t.fonts.heading
  );

  const inner = `
    <div style="font-family:${t.fonts.headingStack}; font-size:${Math.round(t.sizes.hook * 1.6)}px; line-height:0.8; color:${t.colors.accent}; opacity:0.35;">&ldquo;</div>
    <blockquote style="
      font-family:${t.fonts.headingStack};
      font-size:${quoteSize}px;
      font-weight:600;
      line-height:1.25;
      letter-spacing:-0.02em;
      color:${t.colors.text};
      margin:0;
      max-width:92%;
    ">${esc(slide.quote)}</blockquote>
    ${slide.attribution ? `<div style="font-family:${t.fonts.bodyStack}; font-size:${t.sizes.body}px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:${t.colors.accent};">${esc(slide.attribution)}</div>` : ""}
  `;
  return shell(inner, { ...ctx, center: true });
}

// --- conclusion ------------------------------------------------------------

export function renderConclusion(slide: ConclusionSlide, ctx: TemplateContext): string {
  const t = ctx.tokens;
  const box = contentBox(t);

  // Reserve room for the rule and the CTA pill.
  const reserved = t.gap * 2 + (slide.cta ? t.sizes.body * 3 : 0);
  const titleSize = fitHeading(
    slide.title,
    t.sizes.hook * 0.72,
    box.width,
    Math.max(t.sizes.h1, box.height - reserved),
    1.08,
    t.fonts.heading
  );
  const bodySize = slide.body
    ? fitBody(slide.body, t.sizes.h2, box.width * 0.88, box.height - reserved - titleSize * 1.08, 1.45, t.fonts.body)
    : t.sizes.h2;

  const inner = `
    ${heading(slide.title, t, titleSize)}
    ${rule(t)}
    ${slide.body ? `<p style="font-family:${t.fonts.bodyStack}; font-size:${bodySize}px; line-height:1.45; color:${t.colors.text}; opacity:0.8; margin:0; max-width:88%;">${esc(slide.body)}</p>` : ""}
    ${slide.cta ? `<div style="
      align-self:flex-start;
      margin-top:${Math.round(t.gap * 0.5)}px;
      background:${t.colors.accent};
      color:${t.colors.background};
      border-radius:${Math.round(999 * t.scale)}px;
      padding:${Math.round(t.gap * 0.55)}px ${Math.round(t.gap * 1.3)}px;
      font-family:${t.fonts.headingStack};
      font-size:${t.sizes.body}px;
      font-weight:700;
    ">${esc(slide.cta)}</div>` : ""}
  `;
  return shell(inner, { ...ctx, center: true, gradient: true });
}
