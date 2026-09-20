# Unified Liquid-Glass Theme — Design Spec

Date: 2026-08-22

## Problem

The project has two front-ends with two different, inconsistent design systems:

- **Student app** (`src/`): "Soft Aurora" — soft violet/rose/mint pastel palette, DM Serif Display + DM Sans typography, real liquid-glass utilities (`liquid-glass`, `liquid-glass-card`, `glass-strong`, `panel-card`) with layered gradients, backdrop blur/saturate, and inset specular highlights. Light and dark themes both defined in `src/styles.css`.
- **Admin/mentor portal** (`admin/`): dark navy (`#020617`) background, Plus Jakarta Sans/Inter typography, flat single-layer `.glass`/`.glass-card`, and `neon-glow-indigo/emerald/amber/rose/cyan` utilities — saturated multi-hue box-shadow glows on a near-black background. This reads as a "cyberpunk dashboard" rather than an elegant studying app, and clashes with the student app.

Additionally, specific components mix in raw monospace/terminal-style styling (shortcut badges, alert/status chips) that clashes with the elegant serif/sans pairing used elsewhere — the "broken fonts" symptom.

## Goal

Bring both apps under one coherent, elegant design language — the student app's existing "Soft Aurora" system — with a genuine liquid-glass effect applied consistently, and correct, polished light and dark themes in both apps.

## Approach

Extend "Soft Aurora" everywhere rather than inventing a new system or maintaining two identities. The student app's design system is already good and already has real liquid-glass CSS; port it into the admin app and retire admin's clashing navy/neon theme. Admin keeps its information-dense layout (sidebar, tables, stat rows) — only the visual skin changes.

## Scope

### 1. Token & typography foundation
- Replace `admin/src/index.css` root tokens (`--bg-main`, `--glass-*`, `neon-glow-*`, `btn-gradient`) with the student app's token set from `src/styles.css`: background/surface/text tokens, the accent palette system (`data-accent` variants), and the `--glass-*` / `liquid-glass` variables for both `:root` (dark) and `.light`.
- Switch admin typography to DM Serif Display (headings) + DM Sans (body/UI), loaded the same way (Google Fonts `<link>` in `admin/index.html`), replacing Plus Jakarta Sans/Inter.
- Keep JetBrains Mono (`font-data` utility) but restrict it to genuinely tabular/code contexts (IDs, stat digits, code blocks) and restyle it to match the theme's palette instead of harsh green-on-black terminal styling.
- Remove hardcoded body classes in `admin/index.html` (`bg-slate-950 text-slate-50`) that bypass theme tokens.
- Add the same ambient aurora radial-gradient body background (from `src/styles.css`'s `@layer base body`) to admin so glass surfaces have something to refract in both themes.

### 2. Liquid glass everywhere it should float
- Port `liquid-glass`, `liquid-glass-card`, `glass-strong`, `panel-card` (+ accent variants) utilities into admin's stylesheet.
- Apply them to admin's core shell surfaces: sidebar, topbar, stat/dashboard cards, table containers, and all modals (`AIInterventionModal`, `CompanyMatcherModal`, `CommandPalette`, the `Exhaustive*` builder modals, `AssignTaskModal`, `StudentPdfReport` preview chrome).
- Retire `neon-glow-*` and the flat `.glass`/`.glass-card` in favor of the layered utilities (gradient background + backdrop blur/saturate/brightness + translucent border + inset top highlight + inset bottom shadow).
- Preserve tactile hover behavior (`card-hover-lift` / `panel-card:hover` lift + glow intensify) on ported surfaces.

### 3. Font-usage cleanup
Sweep and fix mismatched font usage, focusing on components already flagged by recent local edits and the command-palette/modal/tour family on both apps:
- `admin/src/components/CommandPalette.tsx`, `AIInterventionModal.tsx`, `CompanyMatcherModal.tsx`, `MentorProductTour.tsx`
- `src/components/StudentCommandPalette.tsx`, `QuizDialog.tsx`, `StudentProductTour.tsx`

Rule: `font-mono`/`font-data` only for actual data (IDs, code, tabular numbers); everything else (labels, buttons, headings, alerts) uses `font-sans` (DM Sans) or `font-display` (DM Serif Display) via theme tokens, never a raw inline `fontFamily` override.

### 4. Light/dark QA
For both apps, after reskinning, verify in-browser on: landing/dashboard, a data table, a modal, and the command palette — in both `.light` and dark (default) — checking contrast, glass legibility against the aurora background, and that no component bypasses tokens with hardcoded hex colors.

### 5. Rollout order
1. Token + font foundation (admin `index.css`, `admin/index.html`, body background)
2. Liquid-glass utility port + apply to core admin shell (sidebar, topbar, cards, tables)
3. Modal/palette font + glass sweep on both apps
4. Light/dark verification pass across both apps
5. Manual browser verification (both themes, both apps) via the dev servers on ports 3000 (student) and 8082 (admin, per `.claude/launch.json`)

## Out of scope
- No new features, no IA/navigation restructuring, no backend changes.
- No new fonts or brand-new color palette — this is a consolidation onto the existing, already-approved "Soft Aurora" system.
- No component library swap (Radix primitives stay as-is; only theming/classes change).

## Testing
Manual visual verification in the browser (both dev servers, both themes) is the primary check — this is a CSS/visual-design change with no new logic. Existing TypeScript build (`tsc`) should still pass for both apps after the sweep.
