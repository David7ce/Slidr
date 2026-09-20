# Roadmap

Status of the migration from *Slidr: AI writes slide HTML* to *Slidr: AI writes
structured content, a deterministic renderer draws it*.

Legend: **Done** · **Pending** · **Deferred** (deliberately out of scope)

---

## The architecture, in one line

```
AI conversation → structured carousel JSON → theme + deterministic templates → HTML/CSS → PNG/JPG
```

The invariant everything depends on:

> `carousel.json` is the single source of truth. HTML is derived, never stored.

---

## Done

### Core pivot

| Area            | Change                                                                                                                                                                 |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Slide model     | `Slide.html: string` replaced by a 9-variant discriminated union (`cover`, `text`, `comparison`, `statistic`, `timeline`, `process`, `diagram`, `quote`, `conclusion`) |
| Validation      | Every AI payload passes through zod (`src/lib/slides/schema.ts`) before touching storage; failures return a corrective message to the model                            |
| Renderer        | `src/lib/render/` — design tokens (`tokens.ts`), primitives (`primitives.ts`), 9 templates (`templates.ts`). The only place slide HTML is produced                     |
| Shared contract | `wrapSlideHtml()` unchanged; preview and export both render from content, so the preview is pixel-identical to the export                                              |
| AI tools        | `create_slide{html}` → `set_carousel`, `add_slide`, `update_slide`, `delete_slide`, `reorder_slides`, `set_caption`, `fetch_url`                                       |
| System prompt   | Rewritten: the AI is a content strategist. Hard constraint — never emit HTML, CSS, or design values                                                                    |
| Export          | PNG + JPG via Puppeteer/Sharp, driven by the renderer                                                                                                                  |

### Storage: `projects/`

```
projects/<id>/
  carousel.json   ← editable source of truth
  assets/         ← uploads, normalised through Sharp
  output/         ← generated exports
```

- `src/lib/projects.ts` owns all mutations, with per-project `async-mutex` and atomic tmp-rename writes.
- `src/lib/carousels.ts` is now a re-export shim, so the 10 existing call sites were untouched.
- Assets served by `/api/projects/[id]/assets/[name]`; inlined as data URIs at export time.

### Removed

Licensing + Lemon Squeezy · watermarks · PDF export · social publishing ·
coding-CLI mode (`agy`/`claude`/`codex` detection and spawning) · analytics and
calendar pages · staged actions · team · style presets · templates gallery ·
background removal · image generation · markdown import · batch generate ·
theme upload/community · MCP server · 120 of 128 theme presets.

**8 themes kept:** `swiss-grid`, `editorial-mono`, `minimal-mono`,
`paper-editorial`, `midnight-neon`, `neo-brutalism-bold`,
`gradient-mesh-aurora`, `tech-startup`. Later expanded with
`blueprint-technical`, `scientific-journal`, `warm-print`, and three
clean-room originals: `coastal-editorial`, `terminal-green`, `terracotta-studio`.

### Licensing

`LICENSE` is authoritative and unchanged: **AGPL-3.0** for code,
**CC-BY-SA-4.0** for theme presets and docs. `package.json` said `MIT`, which
contradicted it — corrected to `AGPL-3.0-or-later`.

> The 120 pruned theme presets were CC-BY-SA-4.0. New themes should be written
> clean-room to avoid the share-alike obligation applying to your theme files.

### Text fitting

Long content shrinks to fit rather than clipping. `src/lib/render/fit.ts`
estimates line counts and steps the font size down until a block fits its box;
cover, text, quote, and conclusion use it. Verified by rendering deliberately
oversized content — nothing clips.

### Brand marks

The brand logo now actually renders. `SlideBrand` (`{name, logoUrl}`) is a
plain data shape threaded through the renderer, so it stays decoupled from
`BrandConfig`. The logo replaces the name in the footer rather than competing
with it.

### Loose ends cleared

- `ReferenceImage` and the `/references` API removed — nothing read them
- `setup.mjs` no longer seeds `carousels.json`; it creates `data/` and `projects/`
- `doctor.mjs` reports the project count and no longer fails on unseeded config
- Turbopack NFT tracing warning resolved

### Documentation

Rewritten for the new architecture: `README.md`, `AGENTS.md`, `CLAUDE.md`,
`CHANGELOG.md`. `internaldev.md` deleted (described the abandoned product plan).
`package.json` `repository.url` corrected.

### Verification

- `pnpm test` — 96 tests: renderer contract, dimension correctness, XSS escaping, schema rejection, text fitting, theme parsing, brand marks (passing)
- `scripts/verify-render.mts` — renders all 9 types through the real export pipeline to `/tmp/slidr-verify`
- `scripts/verify-e2e.mts` — 31 assertions: storage → tool layer → export (passing)
- `pnpm exec next build` — clean

---

## Pending

### 1. Editor: direct content editing

The editor is no longer AI-only. A user can fix a typo without asking the model.

- [x] Per-slide structured content editor (fields per type, not raw HTML)
- [x] `PUT /api/carousels/[id]/slides/[slideId]` accepts and validates content
- [x] Add-slide UI with a type picker
- [x] Optimistic updates so edits feel instant (live preview while typing)

### 2. Theme authoring

- [x] Author 2–3 additional original themes (clean-room, per the licence note) — `coastal-editorial`, `terminal-green`, `terracotta-studio`
- [x] `designRules` parses to 0 rules for the current presets — either surface and use them in the renderer, or drop the field (resolved: the parser now reads rules; all 14 presets carry them)
- [ ] Decide whether themes should tune per-slide-type layout, not just colour/type

### 3. Remaining loose ends

- [x] `isTemplate` / `tags` on `Carousel` are vestigial (removed)
- [x] Brand rendering uses a plain name/logo footer. Consider whether themes should control brand placement (corner, watermark-style, none) — added `brandPlacement` (`footer` | `corner` | `watermark` | `none`), parsed from a `> Brand Placement:` front-matter directive and honoured by the renderer's `shell()`

### 4. Quality

- [ ] Visual review of all 9 types × 8 aspect ratios (only `ig-4:5` has been eyeballed)
- [x] Portrait/landscape tuning — `computeScale` now scales by the binding (narrower) dimension instead of area, so `li-16:9` and `ig-9:16` no longer overflow their constrained axis
- [x] Accessibility: colour-contrast checks against theme palettes — added `src/lib/render/contrast.ts` (WCAG AA) + tests; fixed 4 theme accents to pass
- [x] Fitting is heuristic: `fit.ts` estimates glyph widths. Calibrated against real browser metrics (`scripts/calibrate-fit.mts`) and made theme-aware — `fitHeading`/`fitBody` now take the theme's font and use its measured glyph ratio

---

## Deferred

Out of scope for the local-first carousel tool. Recorded so the decisions are explicit.

- Multi-user / team features
- Cloud sync or hosted deployment
- Social publishing integrations
- Export to PDF or video
- MCP / agent tooling
- Community theme marketplace
- Image generation and background removal

---

## Suggested order

1. **Editor** — makes the tool usable without an LLM configured; the biggest usability gap.
2. **Themes** — expands range once the renderer is stable.
3. **Loose ends** — tidy up.
4. **Quality** — visual review, contrast, fitting calibration.

---

## Notes for future work

- **The renderer is the product.** Template quality matters more than feature count. Tune against real exports, not in the abstract.
- **Keep the invariant.** If a feature needs the AI to emit HTML or CSS, the design is wrong. Add a slide type instead.
- **`esc()` everything.** All interpolated user content goes through it; there are tests.
- **Preview = export.** Both call `renderSlide()` → `wrapSlideHtml()`. Never fork that path.
- Verify with `scripts/verify-render.mts` after any template change. Always look at the PNGs.