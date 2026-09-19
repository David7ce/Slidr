# Design System: Scientific Journal

> Category: Editorial & Magazine
> Precise, evidence-first typography on paper stock — the visual language of a peer-reviewed journal, minus the clutter.

Source inspiration: Original design. Clean-room: no third-party design assets.

## 2. Color Palette & Roles

### Primary
- **Ink Navy** (`#10243e`): CSS var `--palette-bg-primary`. Used for: headings, the masthead rule, key figures.

### Secondary
- **Slate** (`#4a5a6a`): CSS var `--palette-bg-secondary`. Used for: captions, secondary labels, axis notes.

### Accent
- **Signal Crimson** (`#b3122b`): CSS var `--palette-accent`. Used for: the rule under headings, one emphasised figure per slide, CTA fills.

### Background
- **Paper** (`#fbfaf7`): CSS var `--palette-bg-background`. Used for: default slide background.

### Surface
- **Card Stock** (`#f2f0eb`): CSS var `--palette-bg-surface`. Used for: comparison columns, diagram nodes.

### Text
- **Ink** (`#16202b`): CSS var `--palette-text`. Used for: body text.

### Gradient System
`linear-gradient(160deg, #10243e 0%, #2f4a6b 100%)` — used for cover and conclusion backgrounds.

## 3. Typography Rules

### Font Family
- Heading: "Source Serif 4"
- Body: "Inter"
- Fallbacks: serif / sans-serif

### Hierarchy
| Role       | Size | Weight | Line Height |
|------------|------|--------|-------------|
| Hook       | 88px | 700    | 1.05        |
| Heading    | 60px | 700    | 1.1         |
| Subheading | 36px | 600    | 1.25        |
| Body       | 30px | 400    | 1.55        |

## 4. Spacing & Layout
- Padding: 72-88px (generous, journal-like margins)
- gap scale: 8/16/24/32/48px
- Strict single column for text; two columns only for comparisons

## 5. Motion (CSS-first)
- Easing: cubic-bezier(0.22,1,0.36,1)
- Duration: 260ms
- Respect prefers-reduced-motion

## 6. Design Rules
- Serif headings, sans body — never the reverse
- Paper background (#fbfaf7) only; no pure white
- Signal crimson appears exactly once per slide as an emphasis
- Figures are set in the heading face, never the body face
- Left-align all text; centred text is reserved for the quote type
- Keep a clear visual hierarchy: hook > heading > body, no exceptions
- Use thin 1px hairline rules to separate sections
- No drop shadows, no rounded corners on text blocks
- Statistical claims require a visible source or attribution
- Body copy never exceeds 60 characters per line
