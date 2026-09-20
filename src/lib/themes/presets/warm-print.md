# Design System: Warm Print

> Category: General
> Warm paper tones, a humanist serif, and unhurried spacing — for ideas that benefit from feeling considered rather than urgent.

Source inspiration: Original design. Clean-room: no third-party design assets.

## 2. Color Palette & Roles

### Primary
- **Cocoa** (`#3d2b1f`): CSS var `--palette-bg-primary`. Used for: headings, primary emphasis.

### Secondary
- **Clay** (`#8a6a52`): CSS var `--palette-bg-secondary`. Used for: secondary text, captions.

### Accent
- **Burnt Orange** (`#b04a24`): CSS var `--palette-accent`. Used for: rules, badges, CTA fills.

### Background
- **Warm Sand** (`#faf5ed`): CSS var `--palette-bg-background`. Used for: default slide background.

### Surface
- **Linen** (`#f1e8d9`): CSS var `--palette-bg-surface`. Used for: cards, comparison columns.

### Text
- **Espresso** (`#2e2118`): CSS var `--palette-text`. Used for: body text.

### Gradient System
`linear-gradient(150deg, #3d2b1f 0%, #7a4a2c 100%)` — used for cover and conclusion backgrounds.

## 3. Typography Rules

### Font Family
- Heading: "Fraunces"
- Body: "Inter"
- Fallbacks: serif / sans-serif

### Hierarchy
| Role       | Size | Weight | Line Height |
|------------|------|--------|-------------|
| Hook       | 84px | 600    | 1.08        |
| Heading    | 56px | 600    | 1.12        |
| Subheading | 34px | 500    | 1.3         |
| Body       | 30px | 400    | 1.6         |

## 4. Spacing & Layout
- Padding: 80-96px (unhurried margins)
- gap scale: 8/16/24/32/48px
- Single column; content sits slightly left of centre

## 5. Motion (CSS-first)
- Easing: cubic-bezier(0.33,1,0.68,1)
- Duration: 300ms
- Respect prefers-reduced-motion

## 6. Design Rules
- Fraunces headings at 600 weight; never bold beyond that
- Warm sand background (#faf5ed) only — never pure white
- Burnt orange is an accent, never a fill for large areas
- Generous leading (1.6+) on body copy; this is for reading
- Keep line lengths short; break long sentences into bullets
- Use clay for all secondary information, never for headings
- One idea per slide; leave visible empty space
- Soft 20px radii on cards, nothing sharper
- Avoid technical or angular motifs — no grids, no schematics
- Numbers set in the heading face at regular weight, not bold
