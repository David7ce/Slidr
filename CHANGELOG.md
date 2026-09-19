# Changelog

All notable changes to this project are documented here.

## [2.0.0] - 2026-09-19

The architectural pivot: the AI now writes structured content, and a
deterministic renderer draws it.

### Added

- **Structured slide model** — `Slide` is a 9-variant discriminated union
  (`cover`, `text`, `comparison`, `statistic`, `timeline`, `process`, `diagram`,
  `quote`, `conclusion`), replacing free-form slide HTML.
- **zod validation** (`src/lib/slides/schema.ts`) — every AI payload is validated
  before storage; invalid output returns a corrective message so the model retries.
- **Deterministic renderer** (`src/lib/render/`) — design tokens, shared
  primitives, and one template per slide type. The only place slide HTML is produced.
- **Project storage** (`src/lib/projects.ts`) — each carousel is a directory:
  `projects/<id>/{carousel.json, assets/, output/}`. `carousel.json` is the
  editable source of truth.
- **JPG export** alongside PNG.
- **Asset pipeline** — uploads normalised through Sharp into the owning project's
  `assets/`, served via `/api/projects/[id]/assets/[name]`, inlined as data URIs
  at export time.
- **Renderer contract tests** — 26 tests covering all 9 types, all 8 aspect
  ratios, XSS escaping, and schema rejection.
- **Verification scripts** — `scripts/verify-render.mts` (visual) and
  `scripts/verify-e2e.mts` (31 assertions across storage, tools, and export).
- **ROADMAP.md** — done, pending, and deferred work.

### Changed

- **AI tools** — `create_slide{html}` replaced by `set_carousel`, `add_slide`,
  `update_slide`, `delete_slide`, `reorder_slides`, `set_caption`, `fetch_url`.
- **System prompt** — rewritten around content strategy. Hard constraint: never
  emit HTML, CSS, or design values.
- **Preview and export** both render from content via `renderSlide()` →
  `wrapSlideHtml()`, so the preview is pixel-identical to the export.
- **`src/lib/carousels.ts`** reduced to a re-export shim over `projects.ts`.
- **Themes** pruned from 128 to 8 curated presets.
- **`package.json` license** corrected from `MIT` to `AGPL-3.0-or-later`, which
  contradicted `LICENSE`.
- **Typography scale** increased for the 1080×1350 canvas; content now fills the
  available space instead of floating centred.

### Removed

- Licensing and Lemon Squeezy integration
- Watermarks (preview and export)
- PDF export
- Social publishing
- Coding-CLI mode (Antigravity, Claude Code, Codex, Gemini, Cursor, OpenCode)
- Analytics and calendar pages
- Staged actions, team, style presets, templates gallery
- Background removal and image generation
- Markdown import, batch generate, theme upload/community
- MCP server
- 120 theme presets

### Fixed

- **Deadlock** in project storage: `mutate()` held the project mutex and then
  called the public `writeCarousel()`, which acquires the same non-reentrant
  mutex. Split into `writeCarouselUnlocked()`.
- **`duplicateCarousel`** aliased the same slide objects instead of copying them.
- **Timeline** rendered a duplicate footer that collided with the brand footer.
- **Comparison** cards were pinned to the top by `align-self`, leaving ~40% dead space.
- **Turbopack** NFT tracing warning from dynamic paths in `export-slides.ts`.

## [1.1.0] - 2026-06-29

### Added

- `npm run stop` script for killing port 3000.
- `CONTRIBUTING.md` outline with code conventions.

### Changed

- Bumped version to `1.1.0`.
- Synced `package.json` repository URLs.
- Updated copyright notice in `LICENSE`.
- Synchronised theme count from 15 to 115 across `AGENTS.md` and `README.md`.
