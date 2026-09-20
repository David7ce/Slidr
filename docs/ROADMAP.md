# Roadmap

Status of the migration from *Slidr: AI writes slide HTML* to *Slidr: AI writes
structured content, a deterministic renderer draws it*.

Legend: **Pending** · **Deferred** (deliberately out of scope). Completed work
is recorded in `docs/RELEASES.md`.

---

## The architecture, in one line

```
AI conversation → structured carousel JSON → theme + deterministic templates → HTML/CSS → PNG/JPG
```

The invariant everything depends on:

> `carousel.json` is the single source of truth. HTML is derived, never stored.

---

## Pending

### 1. Theme authoring

- [ ] Decide whether themes should tune per-slide-type layout, not just colour/type

### 2. Quality

- [ ] Visual review of all 9 types × 8 aspect ratios (only `ig-4:5` has been eyeballed)

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

## Notes for future work

- **The renderer is the product.** Template quality matters more than feature count. Tune against real exports, not in the abstract.
- **Keep the invariant.** If a feature needs the AI to emit HTML or CSS, the design is wrong. Add a slide type instead.
- **`esc()` everything.** All interpolated user content goes through it; there are tests.
- **Preview = export.** Both call `renderSlide()` → `wrapSlideHtml()`. Never fork that path.
- Verify with `scripts/verify-render.mts` after any template change. Always look at the PNGs.