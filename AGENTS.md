# Slidr — Agent Instructions

Read by AI coding agents (Claude Code, Codex, Cursor, Copilot, Gemini) working on this repo.

## What is Slidr?

A local-first AI carousel generator for Instagram, LinkedIn, and TikTok. The AI
writes structured content; a deterministic renderer draws it. Carousels are JSON
files on disk that the user owns.

## The core invariant

> **`carousel.json` is the single source of truth. HTML is derived, never stored.**

The AI produces **content only** — never HTML, CSS, colours, fonts, or layout.
The renderer owns every visual decision. If a feature would require the AI to
emit markup, the design is wrong: add a slide type instead.

## Architecture

- **Framework**: Next.js 16 (Turbopack) + React 19 + TypeScript 5 + Tailwind v4
- **LLM**: HTTP only — any OpenAI-compatible endpoint (OpenAI SDK), SSE streaming
- **Slides**: 9-variant discriminated union, zod-validated before storage
- **Renderer**: deterministic templates driven by theme design tokens
- **Storage**: `projects/<id>/` directories, async-mutex + atomic writes
- **Export**: Puppeteer → PNG/JPG ZIP, Sharp for sRGB

## Key files

- `src/types/carousel.ts` — `Slide` union (9 types), `DIMENSIONS`, platform helpers
- `src/lib/slides/schema.ts` — zod schemas; the AI↔storage contract
- `src/lib/render/tokens.ts` — theme → design tokens (palette, fonts, sizes, scale)
- `src/lib/render/primitives.ts` — `shell()`, `heading()`, `bullets()`, `card()`, `stack()`
- `src/lib/render/templates.ts` — one function per slide type
- `src/lib/render/index.ts` — `renderSlide()` dispatcher
- `src/lib/slide-html.ts` — `wrapSlideHtml()`, the shared preview/export contract
- `src/lib/projects.ts` — project storage; all mutations go through here
- `src/lib/carousels.ts` — re-export shim over `projects.ts` (legacy import name)
- `src/lib/llm/adapter.ts` — `executeToolCall()` with zod validation
- `src/lib/llm/tools.ts` — tool schemas exposed to the model
- `src/lib/chat-system-prompt.ts` — the content-strategist prompt
- `src/lib/export-slides.ts` — Puppeteer export pipeline
- `src/lib/themes/parser.ts` — parses `DESIGN.md` → `Theme`

## API routes

- `POST /api/chat` — SSE streaming, executes tool calls server-side
- `GET/PUT /api/llm-config` — LLM config (baseURL, apiKey, model)
- `GET /api/themes` — list theme presets
- `GET/POST /api/carousels` — list / create
- `GET/PUT/DELETE /api/carousels/[id]` — read / update / delete
- `POST /api/carousels/[id]/export?format=png|jpg` — export ZIP
- `GET /api/projects/[id]/assets/[name]` — serve project assets
- `POST /api/upload` — upload an image into a project's `assets/`

## Conventions

- Components max ~300 lines per file
- Use `cn()` from `src/lib/utils.ts` for class merging
- Types in `src/types/`, libs in `src/lib/`, components in `src/components/`
- All carousel mutations go through `src/lib/projects.ts`
- iframe slides always use `sandbox=""` (no JavaScript)
- Themes are `.md` files — never hardcode theme palettes in components
- Escape all interpolated user content with `esc()` from `render/primitives.ts`

## Gotchas

- **`async-mutex` is not reentrant.** Never call a public mutex-taking function
  from inside `mutex.runExclusive` — use the `*Unlocked` helper.
- **Long-running Puppeteer scripts must call `closeBrowser()`** or the process
  never exits.
- **Never pipe long-running scripts through `tail`** — it buffers and hides
  progress.
- `projects/` is gitignored; `data/` holds only global config.

## Verification

```bash
pnpm test                                                    # 26 tests
pnpm exec tsx --tsconfig tsconfig.json scripts/verify-render.mts   # → /tmp/slidr-verify
pnpm exec tsx --tsconfig tsconfig.json scripts/verify-e2e.mts      # 31 assertions
pnpm exec next build
```

**After any template change, look at the rendered PNGs.** Rendering succeeding
does not mean it looks right.

## Git policy

- Author: `tushar2704 <tushar.inseec@gmail.com>` — sole author, no co-author trailers
- Commit messages: imperative mood, concise
- Auto-commit after each phase

## License

Dual: code is AGPL-3.0, theme presets and docs are CC-BY-SA-4.0. New themes
should be written clean-room to avoid the share-alike obligation.
