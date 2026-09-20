# Roadmap

Status of the migration from *Slidr: AI writes slide HTML* to *Slidr: AI writes
structured content, a deterministic renderer draws it*.

Legend: **Done** · **Deferred** (deliberately out of scope). Completed work is
recorded in `docs/RELEASES.md`.

---

## The architecture, in one line

```
AI conversation → structured carousel JSON → theme + deterministic templates → HTML/CSS → PNG/JPG
```

The invariant everything depends on:

> `carousel.json` is the single source of truth. HTML is derived, never stored.

---

## Done

The migration is complete. All planned work has shipped:

- **Editor** — direct content editing, add-slide UI, optimistic live preview.
- **Themes** — 14 presets, theme-controlled brand placement, and a decision to
  keep layout in the renderer's templates (themes tune the visual system via
  design tokens).
- **Loose ends** — vestigial `isTemplate`/`tags` removed.
- **Quality** — WCAG AA contrast checks, portrait/landscape scale tuning,
  theme-aware text fitting, and a full render matrix (`scripts/render-matrix.mts`)
  for visual review.

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
- Per-slide-type layout overrides per theme (kept in the renderer's templates instead)

---

## Notes for future work

- **The renderer is the product.** Template quality matters more than feature count. Tune against real exports, not in the abstract.
- **Keep the invariant.** If a feature needs the AI to emit HTML or CSS, the design is wrong. Add a slide type instead.
- **`esc()` everything.** All interpolated user content goes through it; there are tests.
- **Preview = export.** Both call `renderSlide()` → `wrapSlideHtml()`. Never fork that path.
- Verify with `scripts/verify-render.mts` after any template change. Always look at the PNGs.