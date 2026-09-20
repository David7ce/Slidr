# Design System: Coastal Editorial

> Category: Editorial & Magazine
> Sun-bleached paper, a humanist serif, and a restrained sea-glass palette — for ideas that feel calm, considered, and unhurried.

Source inspiration: Original design. Clean-room: no third-party design assets.

## 2. Color Palette & Roles

### Primary
- **Deep Teal** (`#0f4c5c`): CSS var `--palette-bg-primary`. Used for: headings, primary emphasis, cover hook.

### Secondary & Accent
- **Sea Glass** (`#2a9d8f`): CSS var `--palette-accent`. Used for: rules, badges, CTA fills, one focal element per slide.
- **Driftwood** (`#8a7a6a`): CSS var `--palette-bg-secondary`. Used for: secondary text, captions, metadata.

### Surface & Background
- **Bleached Sand** (`#fbf7f0`): CSS var `--palette-bg-background`. Used for: default slide background.
- **Washed Linen** (`#f3ece1`): CSS var `--palette-bg-surface`. Used for: cards, comparison columns, inset panels.

### Neutrals & Text
- **Ink** (`#22333b`): CSS var `--palette-text`. Used for: all body and heading copy.
- **Fog** (`#c9d6d4`): Used for: hairlines, dividers, quiet rules.

### Gradient System
`linear-gradient(160deg, #fbf7f0 0%, #e8f1ee 100%)` — a barely-there wash for cover and conclusion backgrounds.

## 3. Typography Rules

### Font Family
- Heading: "Fraunces"
- Body: "Inter"
- Fallbacks: serif / sans-serif

### Hierarchy
| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Hook | 88px | 600 | 1.05 | -0.02em |
| Heading | 48px | 600 | 1.15 | -0.01em |
| Subheading | 26px | 500 | 1.35 | 0 |
| Body | 22px | 400 | 1.55 | 0 |
| Label | 13px | 600 | 1.3 | 0.12em uppercase |

## 4. Spacing & Layout
- Padding: 72-88px (generous — let the paper breathe)
- gap scale: 8/16/24/32/48/72px
- Left-aligned single-column for text slides; centered only for cover and quote
- At least 35% of every slide must be empty space

## 5. Motion (CSS-first)
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Duration: 320ms (gentle, unhurried)
- Soft fades and slow reveals only; respect prefers-reduced-motion
- @starting-style for fade-in

## 6. Design Rules
- Background is always bleached sand #fbf7f0 — never pure white, never cream
- Fraunces for headings ONLY — body is always Inter
- Sea Glass used ONCE per slide — a single rule, dot, or CTA
- NO harsh black — ink #22333b is the darkest tone allowed
- Hairline rules (1px fog) separate sections — quiet and crisp
- Left-aligned typography for body — never justified
- Captions in 13px with 0.12em tracking — small and considered
- One focal element per slide — let everything else recede
- Whitespace is the loudest element — never fill more than 65% of slide
- Contrast > 4.5:1 — deep teal on sand is 9.8:1, comfortably safe