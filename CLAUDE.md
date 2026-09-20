# Slidr

Local-first AI carousel generator for Instagram, LinkedIn, and TikTok.
Next.js 16 + React 19 + TypeScript + Tailwind v4.

## The core invariant

> **`carousel.json` is the single source of truth. HTML is derived, never stored.**

The AI writes **content only** — never HTML, CSS, colours, fonts, or layout. The
renderer owns all visual design. If a feature needs the AI to emit markup, add a
slide type instead.

## Architecture

- **Frontend**: chat panel (left), carousel preview (centre), slide filmstrip (bottom)
- **LLM**: HTTP only — any OpenAI-compatible endpoint, SSE streaming
- **Slides**: 9-variant discriminated union, zod-validated before storage
- **Renderer**: deterministic templates driven by theme design tokens
- **Storage**: `projects/<id>/{carousel.json, assets/, output/}`, async-mutex + atomic writes
- **Export**: Puppeteer → PNG/JPG ZIP, Sharp for sRGB

## Key files

- `src/types/carousel.ts` — `Slide` union (9 types), `DIMENSIONS`
- `src/lib/slides/schema.ts` — zod schemas; the AI↔storage contract
- `src/lib/render/` — `tokens.ts`, `primitives.ts`, `templates.ts`, `index.ts`
- `src/lib/slide-html.ts` — `wrapSlideHtml()`, shared preview/export contract
- `src/lib/projects.ts` — project storage; all mutations go through here
- `src/lib/carousels.ts` — re-export shim over `projects.ts`
- `src/lib/llm/adapter.ts` — `executeToolCall()` with zod validation
- `src/lib/llm/tools.ts` — tool schemas exposed to the model
- `src/lib/chat-system-prompt.ts` — the content-strategist prompt
- `src/lib/export-slides.ts` — Puppeteer export pipeline
- `src/lib/themes/parser.ts` — parses `DESIGN.md` → `Theme`

## Slide types

`cover` · `text` · `comparison` · `statistic` · `timeline` · `process` ·
`diagram` · `quote` · `conclusion`

## Themes

14 presets in `src/lib/themes/presets/`: `swiss-grid`, `editorial-mono`,
`minimal-mono`, `paper-editorial`, `midnight-neon`, `neo-brutalism-bold`,
`gradient-mesh-aurora`, `tech-startup`, `blueprint-technical`,
`scientific-journal`, `warm-print`, `coastal-editorial`, `terminal-green`,
`terracotta-studio`.

## Sizes

Instagram: `ig-1:1`, `ig-4:5` (recommended), `ig-3:4`, `ig-9:16`
LinkedIn: `li-1:1`, `li-4:5` (recommended), `li-16:9`
TikTok: `tt-9:16` (recommended)

## Conventions

- Components max ~300 lines per file
- Use `cn()` from `src/lib/utils.ts`
- Types in `src/types/`, libs in `src/lib/`, components in `src/components/`
- All carousel mutations go through `src/lib/projects.ts`
- iframe slides always use `sandbox=""`
- Themes are `.md` files — never hardcode palettes in components
- Escape interpolated content with `esc()`

## Gotchas

- **`async-mutex` is not reentrant** — use the `*Unlocked` helper inside `runExclusive`
- **Puppeteer scripts must call `closeBrowser()`** or the process hangs
- **Never pipe long-running scripts through `tail`** — it buffers output

## Verification

```bash
pnpm test
pnpm exec tsx --tsconfig tsconfig.json scripts/verify-render.mts
pnpm exec tsx --tsconfig tsconfig.json scripts/verify-e2e.mts
pnpm exec next build
```

After any template change, **look at the rendered PNGs**.

## Git policy

- Author: `tushar2704 <tushar.inseec@gmail.com>` — sole author, no co-author trailers
- Commit messages: imperative mood, concise

## License

Dual: code AGPL-3.0, themes/docs CC-BY-SA-4.0.
