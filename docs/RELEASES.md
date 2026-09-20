# Releases

Notable changes to Slidr, grouped by release. The roadmap (`docs/ROADMAP.md`)
tracks what is done, pending, and deferred; this file records what shipped.

---

## [2.1.0] - 2026-09-20

The editor becomes usable without an LLM, the theme library grows, and the
renderer gets a quality pass.

### Added

- **Direct content editing** — a per-slide structured editor (`SlideEditor`)
  with fields driven by slide type, so a user can fix a typo without asking the
  model. Add-slide UI with a type picker (`AddSlideDialog`).
- **Optimistic live preview** — edits reflect in the preview and filmstrip as
  you type, before the save round-trip.
- **Three clean-room themes** — `coastal-editorial`, `terminal-green`,
  `terracotta-studio`, bringing the preset count to 14.
- **Theme-controlled brand placement** — a `> Brand Placement:` front-matter
  directive (`footer` | `corner` | `watermark` | `none`) lets a theme decide
  where the brand mark appears.
- **WCAG AA contrast checks** (`src/lib/render/contrast.ts`) — verifies every
  theme's text/background pairs meet the AA threshold; 4 low-contrast accents
  were corrected.
- **Theme-aware text fitting** — `fitHeading`/`fitBody` now use the theme's
  font's measured glyph ratio (calibrated against real browser metrics via
  `scripts/calibrate-fit.mts`) instead of a single conservative constant.
- **Full render matrix** (`scripts/render-matrix.mts`) — renders every slide
  type × aspect ratio × theme into `/tmp/slidr-matrix/` for visual review.

### Changed

- **`computeScale`** scales type by the binding (narrower) dimension instead of
  area, so `li-16:9` and `ig-9:16` no longer overflow their constrained axis.
- **`Carousel`** dropped the vestigial `isTemplate` and `tags` fields.
- **Theme layout decision** — themes tune the visual system via design tokens
  (palette, fonts, spacing, motion, brand placement); the renderer's templates
  remain the single source of layout truth. Per-slide-type overrides were
  deliberately not added.

### Fixed

- **Theme parser** silently emptied `atmosphere` on CRLF line endings; the
  parser now normalises line endings and tolerates whitespace in the
  atmosphere lookahead.

---

## [2.0.0] - 2026-09-19

The architectural pivot: the AI now writes structured content, and a
deterministic renderer draws it. See `CHANGELOG.md` for the full detail.

### Added

- **Structured slide model** — `Slide` is a 9-variant discriminated union
  (`cover`, `text`, `comparison`, `statistic`, `timeline`, `process`, `diagram`,
  `quote`, `conclusion`), replacing free-form slide HTML.
- **zod validation** — every AI payload is validated before storage; invalid
  output returns a corrective message so the model retries.
- **Deterministic renderer** — design tokens, shared primitives, and one
  template per slide type. The only place slide HTML is produced.
- **Project storage** — each carousel is a directory
  (`projects/<id>/{carousel.json, assets/, output/}`); `carousel.json` is the
  editable source of truth.
- **JPG export** alongside PNG; uploads normalised through Sharp and inlined as
  data URIs at export time.
- **Brand marks** — the brand logo now renders, replacing the name in the footer.

### Changed

- **AI tools** — `create_slide{html}` replaced by `set_carousel`, `add_slide`,
  `update_slide`, `delete_slide`, `reorder_slides`, `set_caption`, `fetch_url`.
- **System prompt** — rewritten around content strategy; never emit HTML, CSS,
  or design values.
- **Preview = export** — both render from content via `renderSlide()` →
  `wrapSlideHtml()`, so the preview is pixel-identical to the export.
- **Themes** pruned from 128 to 8 curated presets.
- **`package.json` license** corrected from `MIT` to `AGPL-3.0-or-later`.

### Removed

Licensing and Lemon Squeezy · watermarks · PDF export · social publishing ·
coding-CLI mode · analytics and calendar pages · staged actions · team · style
presets · templates gallery · background removal · image generation · markdown
import · batch generate · theme upload/community · MCP server · 120 theme
presets.

### Fixed

- **Deadlock** in project storage (`mutate()` re-acquiring the non-reentrant
  mutex) — split into `writeCarouselUnlocked()`.
- **`duplicateCarousel`** aliased slide objects instead of copying them.
- **Timeline** rendered a duplicate footer colliding with the brand footer.
- **Comparison** cards pinned to the top left ~40% dead space.
- **Turbopack** NFT tracing warning from dynamic paths in `export-slides.ts`.