# Design System: Terminal Green

> Category: Agentic
> Phosphor green on near-black — a terminal that never sleeps. Monospace-first, scanlines, and a single amber alert. For ideas that feel like code.

Source inspiration: Original design. Clean-room: no third-party design assets.

## 2. Color Palette & Roles

### Primary
- **Phosphor Green** (`#33ff66`): CSS var `--palette-bg-primary`. Used for: headings, primary numbers, cover hook, cursor blocks.

### Secondary & Accent
- **Amber Alert** (`#ffb000`): CSS var `--palette-accent`. Used for: CTAs, warnings, one focal element per slide.
- **Dim Green** (`#1f7a3d`): CSS var `--palette-bg-secondary`. Used for: secondary headings, muted highlights.

### Surface & Background
- **Terminal Black** (`#0a0f0a`): CSS var `--palette-bg-background`. Used for: default slide background.
- **Panel Black** (`#101810`): CSS var `--palette-bg-surface`. Used for: cards, code blocks, inset panels.

### Neutrals & Text
- **Pale Green** (`#c8ffd4`): CSS var `--palette-text`. Used for: body text, labels.
- **Muted Green** (`#4d7a5a`): Used for: captions, secondary metadata, prompt prefixes.

### Gradient System
`linear-gradient(180deg, #0a0f0a 0%, #0d1a0f 100%)` — a subtle vertical wash for slide backgrounds.

## 3. Typography Rules

### Font Family
- Heading: "JetBrains Mono"
- Body: "IBM Plex Mono"
- Fallbacks: monospace / monospace

### Hierarchy
| Role | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| Hook | 72px | 700 | 1.1 | -0.02em |
| Heading | 40px | 700 | 1.2 | -0.01em |
| Subheading | 24px | 500 | 1.4 | 0 |
| Body | 20px | 400 | 1.6 | 0 |
| Label | 13px | 600 | 1.3 | 0.1em uppercase |

## 4. Spacing & Layout
- Padding: 64-80px
- gap scale: 8/16/24/32/48px
- Content left-aligned with a 2px green left border as a "prompt" gutter
- One focal element per slide; content centered in 80% safe zone

## 5. Motion (CSS-first)
- Easing: cubic-bezier(0.22,1,0.36,1)
- Duration: 200ms (snappy, decisive — like a keystroke)
- Hard cuts and quick fades only; respect prefers-reduced-motion
- @starting-style for fade-in

## 6. Design Rules
- Background must be terminal black #0a0f0a — never pure white
- Monospace ONLY — JetBrains Mono for headings, IBM Plex Mono for body
- Phosphor green for headings and primary numbers — never amber
- Amber used for ONE element per slide max (CTA, alert, or underline)
- A 2px green left border on content blocks reads as a terminal prompt
- Optional scanline overlay: repeating-linear-gradient at 3% opacity
- Slide 1 has a ">_" cursor block in green, bottom-right
- Vary background between slides: solid #0a0f0a, gradient, or #101810 surface
- Contrast > 4.5:1 — phosphor green on black is 15.4:1, maximum safety