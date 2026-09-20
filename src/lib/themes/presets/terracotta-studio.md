# Design System: Terracotta Studio

> Category: Brutalist & Y2K
> Warm terracotta, cream, and a chunky display face — a sun-baked studio poster. Bold shapes, hard shadows, and confident type.

Source inspiration: Original design. Clean-room: no third-party design assets.

## 2. Color Palette & Roles

### Primary
- **Terracotta** (`#c4552d`): CSS var `--palette-bg-primary`. Used for: headings, primary numbers, cover hook, filled blocks.

### Secondary & Accent
- **Mustard** (`#e0a526`): CSS var `--palette-accent`. Used for: CTAs, badges, one focal element per slide.
- **Clay** (`#a04a2f`): CSS var `--palette-bg-secondary`. Used for: secondary headings, filled panels.

### Surface & Background
- **Cream** (`#faf3e8`): CSS var `--palette-bg-background`. Used for: default slide background.
- **Warm Sand** (`#f0e2cc`): CSS var `--palette-bg-surface`. Used for: cards, comparison columns.

### Neutrals & Text
- **Espresso** (`#2b1d16`): CSS var `--palette-text`. Used for: all body and heading copy.
- **Taupe** (`#b8a48c`): Used for: hairlines, dividers, quiet rules.

### Gradient System
`linear-gradient(135deg, #c4552d 0%, #e0a526 100%)` — a warm sunset wash for cover and conclusion backgrounds.

## 3. Typography Rules

### Font Family
- Heading: "Archivo Black"
- Body: "Archivo"
- Fallbacks: sans-serif / sans-serif

### Hierarchy
| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Hook | 96px | 900 | 0.98 | -0.03em |
| Heading | 52px | 800 | 1.05 | -0.02em |
| Subheading | 26px | 600 | 1.25 | 0 |
| Body | 22px | 500 | 1.5 | 0 |
| Label | 14px | 700 | 1.2 | 0.08em uppercase |

## 4. Spacing & Layout
- Padding: 64-80px
- gap scale: 8/16/24/32/48/64px
- Bold, chunky blocks; hard-edged cards with offset shadows
- Content left-aligned; cover and quote centered

## 5. Motion (CSS-first)
- Easing: cubic-bezier(0.23,1,0.32,1)
- Duration: 280ms (punchy, confident)
- Snappy pops and hard cuts; respect prefers-reduced-motion
- @starting-style for fade-in

## 6. Design Rules
- Background is always cream #faf3e8 — never pure white
- Archivo Black for headings ONLY — body is always Archivo
- Mustard used ONCE per slide — a single badge, CTA, or underline
- Hard offset shadows (4px solid espresso, no blur) on cards and buttons
- NO rounded corners on primary blocks — sharp, confident edges
- Left-aligned typography for body — never justified
- Labels in 14px with 0.08em tracking — bold and considered
- One focal element per slide — let everything else recede
- Whitespace is the loudest element — never fill more than 60% of slide
- Contrast > 4.5:1 — espresso on cream is 13.2:1, comfortably safe