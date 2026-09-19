# Design System: Blueprint Technical

> Category: Agentic
> Dark schematic surfaces, monospaced labels, and hairline grid lines — documentation for systems that have to be understood precisely.

Source inspiration: Original design. Clean-room: no third-party design assets.

## 2. Color Palette & Roles

### Primary
- **Cyan Trace** (`#4fd1e0`): CSS var `--palette-bg-primary`. Used for: headings, diagram connectors, key labels.

### Secondary
- **Steel** (`#8fa3b8`): CSS var `--palette-bg-secondary`. Used for: descriptions, secondary annotations.

### Accent
- **Amber Signal** (`#f0a23c`): CSS var `--palette-accent`. Used for: step badges, emphasis, CTA fills.

### Background
- **Deep Slate** (`#0e1621`): CSS var `--palette-bg-background`. Used for: default slide background.

### Surface
- **Panel** (`#16222f`): CSS var `--palette-bg-surface`. Used for: cards, code blocks, diagram nodes.

### Text
- **Ice** (`#e6eef7`): CSS var `--palette-text`. Used for: body text.

### Gradient System
`linear-gradient(140deg, #0e1621 0%, #1b3042 100%)` — used for cover and conclusion backgrounds.

## 3. Typography Rules

### Font Family
- Heading: "Space Grotesk"
- Body: "IBM Plex Mono"
- Fallbacks: sans-serif / monospace

### Hierarchy
| Role       | Size | Weight | Line Height |
|------------|------|--------|-------------|
| Hook       | 92px | 700    | 1.02        |
| Heading    | 56px | 700    | 1.1         |
| Subheading | 32px | 600    | 1.25        |
| Body       | 26px | 400    | 1.6         |

## 4. Spacing & Layout
- Padding: 64-80px
- gap scale: 8/16/24/32/48px
- Consistent left rail; content aligns to a single column edge

## 5. Motion (CSS-first)
- Easing: cubic-bezier(0.16,1,0.3,1)
- Duration: 220ms
- Respect prefers-reduced-motion

## 6. Design Rules
- Monospaced body only — this is technical documentation, not prose
- Deep slate background (#0e1621) exclusively; never light surfaces
- Cyan is the structural colour: headings, connectors, labels
- Amber marks sequence and action; use it sparingly
- Hairline 1px cyan borders at 20% opacity on every panel
- Never use more than two type sizes on one slide
- Labels are uppercase with wide tracking; body text is not
- Diagrams read top to bottom, never left to right
- Keep corner radii small (8px) — this is a schematic, not a card UI
- Contrast between text and background must exceed 7:1
