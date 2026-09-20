# Slidr

> **Local-first AI carousel generator for Instagram, LinkedIn, and TikTok.**
> The AI writes the content. A deterministic renderer draws it. Your carousel is a JSON file you own.

---

## What makes it different

Most AI carousel tools ask a language model to write HTML. The output is
inconsistent, unmaintainable, and different every time you regenerate.

Slidr splits the job:

```
AI conversation
      ↓
structured carousel JSON      ← the AI decides content, structure, slide types
      ↓
theme + deterministic templates   ← the renderer decides typography, colour, layout
      ↓
HTML/CSS
      ↓
PNG / JPG
```

**The AI never writes CSS.** It picks a slide type, writes the copy, and chooses
a theme. The renderer owns every visual decision, so output is consistent across
slides, reproducible across runs, and editable by hand.

---

## Quickstart

```bash
git clone https://github.com/David7ce/Slidr.git
cd Slidr
pnpm install
pnpm dev
```

Open <http://localhost:3000>, click the gear icon, and enter an
OpenAI-compatible endpoint:

| Field | Example (Groq free tier) |
|---|---|
| **Base URL** | `https://api.groq.com/openai/v1` |
| **API Key** | `gsk_...` from [console.groq.com](https://console.groq.com) |
| **Model** | `llama-3.3-70b-versatile` |

Any OpenAI-compatible provider works — Groq, Google AI Studio, OpenRouter,
Ollama, LM Studio, OpenAI, Anthropic, DeepSeek.

Then: create a carousel → pick a theme → describe what you want → export.

---

## The slide model

Nine semantic types. The AI chooses the type that fits the content.

| Type | Use for | Fields |
|---|---|---|
| `cover` | Opening slide | `title`, `subtitle`, `eyebrow` |
| `text` | One idea with supporting points | `title`, `body`, `bullets[]` |
| `comparison` | Two things side by side | `title`, `left`, `right` |
| `statistic` | Headline numbers | `title`, `stats[]` |
| `timeline` | Chronology | `title`, `events[]` |
| `process` | Ordered steps | `title`, `steps[]` |
| `diagram` | A concept and its parts | `title`, `center`, `nodes[]` |
| `quote` | A quotation | `quote`, `attribution` |
| `conclusion` | Takeaway + call to action | `title`, `body`, `cta` |

Every payload is validated with zod before it reaches storage. Malformed model
output is rejected with a corrective message, so the AI retries instead of
corrupting your carousel.

### Example

```json
{
  "title": "Human Brain vs AI",
  "theme": "swiss-grid",
  "size": "ig-4:5",
  "slides": [
    {
      "type": "cover",
      "title": "Human Brain vs AI",
      "subtitle": "Similar principles, different physical systems"
    },
    {
      "type": "comparison",
      "title": "The basic unit",
      "left": { "title": "Biological neuron", "items": ["Electrochemical", "Biological cell"] },
      "right": { "title": "Artificial neuron", "items": ["Mathematical function", "Numerical inputs"] }
    }
  ]
}
```

---

## Project layout

Each carousel is a directory you can read, diff, and edit by hand:

```
projects/
  <project-id>/
    carousel.json     ← the editable source of truth
    assets/           ← uploaded images
    output/           ← generated exports
```

`carousel.json` is authoritative. **Rendered HTML is never stored** — it is
derived on demand from the slide content plus the active theme. Edit the JSON,
reload, and the carousel updates.

---

## Themes

Fourteen curated themes, each a `DESIGN.md` file in `src/lib/themes/presets/`:

`swiss-grid` · `editorial-mono` · `minimal-mono` · `paper-editorial` ·
`midnight-neon` · `neo-brutalism-bold` · `gradient-mesh-aurora` · `tech-startup` ·
`blueprint-technical` · `scientific-journal` · `warm-print` ·
`coastal-editorial` · `terminal-green` · `terracotta-studio`

A theme defines the visual system — palette, fonts, spacing, motion. The AI
selects a theme; it cannot invent one. Add your own by dropping a `DESIGN.md`
file into the presets directory.

---

## Sizes

| Platform | Sizes |
|---|---|
| Instagram | `ig-1:1` (1080×1080), `ig-4:5` (1080×1350, recommended), `ig-3:4` (1080×1440), `ig-9:16` (1080×1920) |
| LinkedIn | `li-1:1`, `li-4:5` (recommended), `li-16:9` (1920×1080) |
| TikTok | `tt-9:16` (1080×1920, recommended) |

Typography scales automatically to the target area, clamped so extreme ratios
stay readable.

---

## Export

Puppeteer renders each slide at exact pixel dimensions; Sharp enforces sRGB.
Export as **PNG** or **JPG** — a ZIP with one file per slide. Exports are also
written to the project's `output/` directory.

Preview and export call the same renderer, so **what you see is what you ship**.

---

## Architecture

```
src/
  types/carousel.ts        Slide union, DIMENSIONS, platform helpers
  lib/
    slides/schema.ts       zod validation for every AI payload
    render/                tokens.ts · primitives.ts · templates.ts
    slide-html.ts          wrapSlideHtml() — shared preview/export contract
    projects.ts            projects/<id>/ storage, mutex + atomic writes
    carousels.ts           re-export shim over projects.ts
    llm/                   adapter.ts · http-client.ts · tools.ts · types.ts
    chat-system-prompt.ts  the content-strategist prompt
    export-slides.ts       Puppeteer → PNG/JPG
    themes/                parser.ts · serializer.ts · presets/*.md
  app/api/                 chat · carousels · projects assets · themes · upload
  components/              chat · editor · themes · brand · ui
```

**The invariant:** if a feature needs the AI to emit HTML or CSS, the design is
wrong. Add a slide type instead.

---

## Development

```bash
pnpm dev            # dev server
pnpm build          # production build
pnpm test           # jest — renderer contract + schema tests
pnpm doctor         # environment diagnostics
```

Verify renderer changes visually — always look at the PNGs:

```bash
pnpm exec tsx --tsconfig tsconfig.json scripts/verify-render.mts
# → /tmp/slidr-verify
```

End-to-end check of storage → AI tools → export:

```bash
pnpm exec tsx --tsconfig tsconfig.json scripts/verify-e2e.mts
```

See [docs/ROADMAP.md](docs/ROADMAP.md) for pending work and
[docs/RELEASES.md](docs/RELEASES.md) for what has shipped.

---

## License

Dual-licensed — see [LICENSE](LICENSE).

- **Code** — [AGPL-3.0](LICENSE-CODE). Use, modify, and distribute freely. If you
  run a modified version as a network service, you must publish your source.
- **Themes & docs** — [CC-BY-SA-4.0](LICENSE-CONTENT). Attribution and
  share-alike apply.

Originally forked from [UitbreidenOS/Slidr](https://github.com/UitbreidenOS/Slidr).
