# Unified Liquid-Glass Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the admin portal's dark-navy "neon-glow" cyberpunk theme and the scattered hardcoded dark-only styling in specific student/admin components, replacing both with the student app's existing "Soft Aurora" liquid-glass design system, in both light and dark mode.

**Architecture:** Both apps already theme themselves via CSS custom properties on `<html>` toggled between `.dark`/`.light` classes plus a `data-accent` attribute — that mechanism is unchanged. Work is CSS-token/utility replacement plus mechanical Tailwind-class substitution in JSX; no component logic, routing, or data-fetching changes.

**Tech Stack:** React + Vite + Tailwind (admin: v3 `@tailwind` directives + `tailwind.config`; student: v4 CSS-first `@theme`/`@utility` in `src/styles.css`). No new dependencies.

## Global Constraints

- No new fonts, no new base color palette — reuse tokens/utilities already defined in `src/styles.css` (see spec `docs/superpowers/specs/2026-08-22-unified-liquid-glass-theme-design.md`).
- No IA/routing/logic changes — visual/CSS only.
- Every replaced surface must work in **both** `.light` and default-dark states — a class with no light-mode counterpart is a bug to fix, not something to leave as-is.
- `font-mono`/`font-data` stays only on genuine data (IDs, kbd shortcut glyphs, stat digits, code) — never on prose/labels/headings.
- Verification is manual/visual (no unit tests for CSS) plus `tsc` type-check passing for both apps — per the spec's Testing section.

### Table A — Admin Tailwind → Soft Aurora token mapping

Apply these as file-wide find/replace in every admin file touched below (`replace_all`), on top of any file-specific exceptions listed in that file's task:

| Find | Replace |
|---|---|
| `text-white` (prose/headings, not inside a colored chip) | `text-[var(--foreground)]` |
| `text-slate-100`, `text-slate-200` | `text-[var(--foreground)]` |
| `text-slate-300`, `text-slate-400`, `text-slate-500` | `text-[var(--muted-foreground)]` |
| `border-slate-700/80`, `border-slate-700`, `border-slate-800`, `border-slate-800/60` | `border-[var(--border)]` |
| `divide-slate-800/80` | `divide-[var(--border)]` |
| `bg-slate-800/40`, `bg-slate-800/90`, `bg-slate-800`, `bg-slate-900/80`, `hover:bg-slate-800` | `bg-[var(--glass-input-bg)]` (keep `hover:` prefix where present) |
| `bg-slate-950/40`, `bg-slate-950/60`, `bg-slate-950/70`, `bg-slate-950/80`, `bg-slate-950/90`, `bg-slate-950` (nested slot, not the page root) | `bg-[var(--glass-input-bg)]` |
| `text-indigo-300`, `text-indigo-400` | `text-[var(--primary)]` |
| `bg-indigo-500/10`, `bg-indigo-500/20` | `bg-[var(--primary)]/15` |
| `border-indigo-500/20`, `border-indigo-500/30`, `border-indigo-500/40` | `border-[var(--primary)]/30` |
| `bg-indigo-600 hover:bg-indigo-500` | `bg-[var(--primary)] hover:brightness-110` |
| `text-rose-300`, `text-rose-400`, `text-red-400` | `text-[var(--destructive)]` |
| `bg-rose-500/10`, `bg-rose-500/20`, `bg-red-500/20` | `bg-[var(--destructive)]/15` |
| `border-rose-500/20`, `border-rose-500/30`, `border-red-500/30` | `border-[var(--destructive)]/30` |
| `bg-rose-600 hover:bg-rose-500` | `bg-[var(--destructive)] hover:brightness-110` |
| `text-emerald-400` | `text-[var(--success)]` |
| `bg-emerald-500/20` | `bg-[var(--success)]/15` |
| `border-emerald-500/30`, `border-emerald-500/40` | `border-[var(--success)]/30` |
| `text-amber-300`, `text-amber-400` | `text-[var(--warning)]` |
| `bg-amber-500/20` | `bg-[var(--warning)]/15` |
| `border-amber-500/30`, `border-amber-500/40` | `border-[var(--warning)]/30` |
| `text-purple-400` | `text-[var(--chart-2)]` |
| `text-blue-400`, `text-cyan-400` | `text-[var(--chart-5)]` |
| `bg-blue-500/20` | `bg-[var(--chart-5)]/15` |

This table is reused by Tasks 4–7. Each task lists only what Table A does **not** cover (outer container surfaces, one-off shadows, structural swaps).

---

### Task 1: Admin foundation — tokens, fonts, background

**Files:**
- Modify: `admin/src/index.css` (full replace)
- Modify: `admin/index.html:8-12`

**Interfaces:**
- Produces: CSS custom properties `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--success`, `--warning`, `--border`, `--glass-bg`, `--glass-border`, `--glass-strong-bg`, `--glass-strong-border`, `--glass-input-bg`, `--glass-input-border`, `--btn-gradient-start/end`, on `:root` (dark) and `.light`, plus utility classes `.liquid-glass`, `.liquid-glass-card`, `.glass-strong`, `.panel-card`, `.panel-slot`, `.ember-glow`, `.ember-glow-lg`, `.card-hover-lift`, `.btn-gradient` — all consumed by Tasks 2–7.

- [ ] **Step 1: Replace `admin/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #0E0B1E;
    --foreground: #F0EEFF;
    --card: rgba(255, 255, 255, 0.05);
    --popover: #1C1540;
    --popover-foreground: #F0EEFF;
    --primary: #A78BFA;
    --primary-foreground: #0E0B1E;
    --secondary: #2D2257;
    --muted: #1C1540;
    --muted-foreground: #A89FCE;
    --accent: #F9A8D4;
    --destructive: #FB7185;
    --success: #86EFAC;
    --warning: #FDE68A;
    --border: rgba(167, 139, 250, 0.15);
    --ring: #A78BFA;

    --chart-1: #A78BFA;
    --chart-2: #F9A8D4;
    --chart-3: #86EFAC;
    --chart-4: #FDE68A;
    --chart-5: #7DD3FC;

    --btn-gradient-start: #8B5CF6;
    --btn-gradient-end: #EC4899;
    --btn-glow: rgba(167, 139, 250, 0.4);
    --btn-gradient: linear-gradient(135deg, var(--btn-gradient-start) 0%, var(--btn-gradient-end) 100%);

    --glass-bg: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%);
    --glass-border: rgba(255, 255, 255, 0.14);
    --glass-shadow: rgba(0, 0, 0, 0.35);
    --glass-strong-bg: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%);
    --glass-strong-border: rgba(255, 255, 255, 0.22);
    --glass-strong-shadow: rgba(0, 0, 0, 0.5);
    --glass-input-bg: rgba(255, 255, 255, 0.07);
    --glass-input-border: rgba(167, 139, 250, 0.25);

    --scrollbar-track: #0E0B1E;
    --scrollbar-thumb: rgba(255, 255, 255, 0.18);
  }

  [data-accent="indigo"] {
    --primary: #A78BFA; --accent: #F9A8D4;
    --btn-gradient-start: #8B5CF6; --btn-gradient-end: #EC4899;
  }
  [data-accent="purple"] {
    --primary: #C084FC; --accent: #F0ABFC;
    --btn-gradient-start: #9333EA; --btn-gradient-end: #EC4899;
  }
  [data-accent="emerald"] {
    --primary: #6EE7B7; --accent: #86EFAC;
    --btn-gradient-start: #10B981; --btn-gradient-end: #06B6D4;
  }
  [data-accent="amber"] {
    --primary: #FDE68A; --accent: #FCD34D;
    --btn-gradient-start: #D97706; --btn-gradient-end: #F97316;
  }
  [data-accent="cyan"] {
    --primary: #7DD3FC; --accent: #BAE6FD;
    --btn-gradient-start: #0891B2; --btn-gradient-end: #38BDF8;
  }

  html.light, .light {
    --background: #FAF8FF;
    --foreground: #1E1B4B;
    --card: rgba(255, 255, 255, 0.80);
    --popover: #FFFFFF;
    --popover-foreground: #1E1B4B;
    --primary: #7C3AED;
    --primary-foreground: #FFFFFF;
    --secondary: #EDE9FE;
    --muted: #F5F3FF;
    --muted-foreground: #6D5D8A;
    --accent: #DB2777;
    --destructive: #E11D48;
    --success: #16A34A;
    --warning: #D97706;
    --border: rgba(124, 58, 237, 0.12);
    --ring: #7C3AED;

    --chart-1: #7C3AED; --chart-2: #DB2777; --chart-3: #16A34A; --chart-4: #D97706; --chart-5: #0EA5E9;

    --btn-gradient-start: #7C3AED;
    --btn-gradient-end: #DB2777;

    --glass-bg: linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.60) 100%);
    --glass-border: rgba(124, 58, 237, 0.14);
    --glass-shadow: rgba(100, 60, 180, 0.10);
    --glass-strong-bg: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.80) 100%);
    --glass-strong-border: rgba(124, 58, 237, 0.20);
    --glass-strong-shadow: rgba(100, 60, 180, 0.15);
    --glass-input-bg: rgba(255, 255, 255, 0.90);
    --glass-input-border: rgba(124, 58, 237, 0.22);

    --scrollbar-track: #F5F3FF;
    --scrollbar-thumb: rgba(124, 58, 237, 0.22);
  }

  .light[data-accent="indigo"] { --primary: #7C3AED; --accent: #DB2777; --btn-gradient-start: #7C3AED; --btn-gradient-end: #DB2777; }
  .light[data-accent="purple"] { --primary: #9333EA; --accent: #DB2777; --btn-gradient-start: #9333EA; --btn-gradient-end: #EC4899; }
  .light[data-accent="emerald"] { --primary: #059669; --accent: #0D9488; --btn-gradient-start: #059669; --btn-gradient-end: #0D9488; }
  .light[data-accent="amber"] { --primary: #D97706; --accent: #EA580C; --btn-gradient-start: #D97706; --btn-gradient-end: #EA580C; }
  .light[data-accent="cyan"] { --primary: #0891B2; --accent: #0284C7; --btn-gradient-start: #0891B2; --btn-gradient-end: #0284C7; }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: "DM Sans", system-ui, -apple-system, sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.25s ease, color 0.25s ease;
    background-image:
      radial-gradient(ellipse 900px 700px at 15% -10%, rgba(139, 92, 246, 0.22) 0%, transparent 70%),
      radial-gradient(ellipse 700px 600px at 85% 10%, rgba(236, 72, 153, 0.14) 0%, transparent 65%),
      radial-gradient(ellipse 600px 500px at 50% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
    background-attachment: fixed;
  }
  .light body, html.light body {
    background-image:
      radial-gradient(ellipse 900px 700px at 15% -10%, rgba(167, 139, 250, 0.16) 0%, transparent 70%),
      radial-gradient(ellipse 700px 600px at 85% 10%, rgba(249, 168, 212, 0.14) 0%, transparent 65%);
  }

  h1, h2 {
    font-family: "DM Serif Display", Georgia, serif;
    letter-spacing: -0.015em;
    font-weight: 400;
  }
}

/* ─── Liquid Glass Utilities (ported from student app) ─── */
.liquid-glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.08) 100%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(36px) saturate(180%) brightness(1.05);
  -webkit-backdrop-filter: blur(36px) saturate(180%) brightness(1.05);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08);
}
.light .liquid-glass, html.light .liquid-glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.68) 50%, rgba(255,255,255,0.80) 100%);
  border: 1px solid rgba(124, 58, 237, 0.14);
  backdrop-filter: blur(32px) saturate(150%);
  -webkit-backdrop-filter: blur(32px) saturate(150%);
  box-shadow: 0 8px 32px rgba(100, 60, 180, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.liquid-glass-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.light .liquid-glass-card, html.light .liquid-glass-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.72) 100%);
  border: 1px solid rgba(124, 58, 237, 0.12);
  box-shadow: 0 4px 20px rgba(100, 60, 180, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1);
}

.glass-strong {
  background: var(--glass-strong-bg);
  border: 1px solid var(--glass-strong-border);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  box-shadow: 0 12px 40px -6px var(--glass-strong-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.panel-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(20, 15, 45, 0.65) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.panel-card:hover {
  border-color: rgba(167, 139, 250, 0.35);
  transform: translateY(-2px);
}
.light .panel-card, html.light .panel-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(245,242,255,0.80) 100%);
  border: 1px solid rgba(124, 58, 237, 0.14);
  box-shadow: 0 6px 24px rgba(100, 60, 180, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1);
}

.panel-slot {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.875rem;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;
}
.panel-slot:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(167, 139, 250, 0.25); }
.light .panel-slot, html.light .panel-slot {
  background: rgba(124, 58, 237, 0.04);
  border: 1px solid rgba(124, 58, 237, 0.10);
}

.ember-glow { box-shadow: 0 0 24px rgba(167, 139, 250, 0.30), 0 4px 16px rgba(0, 0, 0, 0.25); }
.ember-glow-lg { box-shadow: 0 0 40px rgba(167, 139, 250, 0.40), 0 8px 30px rgba(0, 0, 0, 0.30); }

.card-hover-lift {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.3s ease, box-shadow 0.3s ease;
}
.card-hover-lift:hover { transform: translateY(-3px) scale(1.005); border-color: rgba(167, 139, 250, 0.35); }

/* Legacy alias so any un-migrated `.glass`/`.glass-card` usage still renders as glass, not a flat box */
.glass, .glass-card { }
.glass { background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: blur(24px) saturate(160%); -webkit-backdrop-filter: blur(24px) saturate(160%); }
.glass-card { background: var(--glass-strong-bg); border: 1px solid var(--glass-strong-border); backdrop-filter: blur(28px) saturate(170%); -webkit-backdrop-filter: blur(28px) saturate(170%); box-shadow: 0 8px 28px -6px var(--glass-strong-shadow); transition: all 0.3s ease; }
.glass-card:hover { border-color: var(--primary); }

.glass-input {
  background: var(--glass-input-bg);
  border: 1px solid var(--glass-input-border);
  color: var(--foreground);
  transition: all 0.2s ease-in-out;
}
.glass-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent); }

.btn-gradient {
  background: var(--btn-gradient, linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%));
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 4px 20px var(--btn-glow, rgba(167, 139, 250, 0.4)), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition: all 0.25s ease;
}
.btn-gradient:hover { filter: brightness(1.08); transform: translateY(-1px); }
.btn-gradient:active { transform: translateY(0px); }

@keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes pulse-subtle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.02); } }
.animate-pulse-subtle { animation: pulse-subtle 4s ease-in-out infinite; }
@keyframes float-badge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
.animate-float-badge { animation: float-badge 3s ease-in-out infinite; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--scrollbar-track); }
::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

html.light select option, .light select option { background-color: #ffffff; color: #1E1B4B; }
html.dark select option, .dark select option { background-color: #1C1540; color: #F0EEFF; }

@media print {
  @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
  body { background: #ffffff !important; color: #0f172a !important; font-size: 11pt !important; line-height: 1.4 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  aside, header, nav, .no-print, #interactive-canvas-bg, .btn-gradient, .glass, .fixed, button:not(.print-include) { display: none !important; }
  main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
  .print-page-break { page-break-before: always !important; break-before: page !important; }
  .print-avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
}
```

- [ ] **Step 2: Update `admin/index.html` fonts and body classes**

Replace lines 8-12 (font links):

```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Replace line 12 `<body class="bg-slate-950 text-slate-50 antialiased font-sans">` with:

```html
  <body class="antialiased font-sans">
```

(the hardcoded slate classes bypassed theme tokens; `body`'s background/color now come from `admin/src/index.css`'s `body` rule)

- [ ] **Step 3: Verify build**

Run: `npm --prefix admin run build`
Expected: TypeScript + Vite build succeeds with no errors (CSS-only change, no type errors expected).

- [ ] **Step 4: Commit**

```bash
git add admin/src/index.css admin/index.html
git commit -m "feat(admin): replace neon-glow theme with Soft Aurora tokens and liquid-glass utilities"
```

---

### Task 2: Admin GlassCard component

**Files:**
- Modify: `admin/src/components/GlassCard.tsx` (full replace)

**Interfaces:**
- Consumes: `.liquid-glass`, `.liquid-glass-card`, `.glass-strong`, `.glass`, `.card-hover-lift` from Task 1.
- Produces: `GlassCard` component with `variant?: "default" | "strong" | "subtle" | "interactive" | "liquid" | "card"` (keeps existing variant names `default`/`strong`/`subtle`/`interactive` used by current consumers, adds `liquid`/`card`), `hover?: boolean`, `glow?: "violet" | "rose" | "mint" | "amber" | "none"`. The old `variant="neon"` is removed (no remaining consumers after Task 7 updates `MentorProductTour`; confirm with the grep in Step 2 before removing).

- [ ] **Step 1: Confirm no other consumer uses `variant="neon"`**

Run: `grep -rn 'variant="neon"' admin/src`
Expected: no matches, or only in files this plan already updates (fix those in their own task first if found elsewhere).

- [ ] **Step 2: Replace `admin/src/components/GlassCard.tsx`**

```tsx
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "strong" | "subtle" | "interactive" | "liquid" | "card";
  hover?: boolean;
  glow?: "violet" | "rose" | "mint" | "amber" | "none";
}

const GLOW_CLASS: Record<NonNullable<GlassCardProps["glow"]>, string> = {
  violet: "shadow-[0_0_30px_rgba(167,139,250,0.25)]",
  rose: "shadow-[0_0_30px_rgba(249,168,212,0.22)]",
  mint: "shadow-[0_0_30px_rgba(134,239,172,0.22)]",
  amber: "shadow-[0_0_30px_rgba(253,230,138,0.20)]",
  none: "",
};

export function GlassCard({
  children,
  className = "",
  variant = "default",
  hover = false,
  glow = "none",
  ...props
}: GlassCardProps) {
  let baseClass = "glass rounded-2xl p-6 shadow-xl";

  if (variant === "strong") {
    baseClass = "glass-strong rounded-2xl p-6 shadow-2xl";
  } else if (variant === "subtle") {
    baseClass = "glass rounded-xl p-4";
  } else if (variant === "interactive") {
    baseClass = "liquid-glass-card rounded-2xl p-6 cursor-pointer card-hover-lift";
  } else if (variant === "liquid") {
    baseClass = "liquid-glass rounded-2xl p-6";
  } else if (variant === "card") {
    baseClass = "liquid-glass-card rounded-2xl p-6";
  }

  const glowClass = GLOW_CLASS[glow] || "";

  return (
    <div className={`${baseClass} ${hover ? "card-hover-lift cursor-pointer" : ""} ${glowClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm --prefix admin run build`
Expected: succeeds (any remaining `variant="neon"` consumer would now fall through to the `default` branch rather than error, since TS would reject an invalid literal at compile time if one exists — that's the intended safety net).

- [ ] **Step 4: Commit**

```bash
git add admin/src/components/GlassCard.tsx
git commit -m "feat(admin): port liquid-glass variants into GlassCard component"
```

---

### Task 3: Admin ambient background — drop the cyber grid

**Files:**
- Modify: `admin/src/components/InteractiveAppBackground.tsx` (full replace)

**Interfaces:**
- Consumes: `useTheme()` from `admin/src/lib/theme-context.tsx` (`accentColor: AccentColor` — one of `"indigo" | "purple" | "emerald" | "amber" | "cyan"`).
- Produces: same default export shape (`InteractiveAppBackground: React.FC`, no props) — drop-in replacement, no changes needed at the `App.tsx:171` call site.

The current version draws a scanline grid overlay plus a canvas particle network connected by lines — this is the single strongest "cyberpunk HUD" visual in the app. Replace it with soft blurred aurora orbs only (matching `src/components/InteractiveAppBackground.tsx`'s pattern), keyed off the same 5 admin accent colors.

- [ ] **Step 1: Replace `admin/src/components/InteractiveAppBackground.tsx`**

```tsx
import React from "react";
import { useTheme } from "../lib/theme-context";

export const InteractiveAppBackground: React.FC = () => {
  const { accentColor } = useTheme();

  const orbConfig = {
    indigo: {
      orb1: "from-violet-600/18 via-purple-600/12 to-transparent",
      orb2: "from-pink-500/14 via-rose-500/10 to-transparent",
    },
    purple: {
      orb1: "from-purple-600/20 via-fuchsia-600/15 to-transparent",
      orb2: "from-pink-500/16 via-rose-500/12 to-transparent",
    },
    emerald: {
      orb1: "from-emerald-500/18 via-teal-500/14 to-transparent",
      orb2: "from-teal-500/14 via-cyan-500/10 to-transparent",
    },
    amber: {
      orb1: "from-amber-400/18 via-orange-400/14 to-transparent",
      orb2: "from-yellow-400/14 via-amber-300/10 to-transparent",
    },
    cyan: {
      orb1: "from-sky-500/18 via-cyan-500/14 to-transparent",
      orb2: "from-blue-500/14 via-sky-400/10 to-transparent",
    },
  }[accentColor] || {
    orb1: "from-violet-600/18 via-purple-600/12 to-transparent",
    orb2: "from-pink-500/14 via-rose-500/10 to-transparent",
  };

  return (
    <div id="interactive-canvas-bg" className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print" aria-hidden="true">
      <div
        className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br ${orbConfig.orb1} blur-[160px] animate-pulse pointer-events-none`}
        style={{ animationDuration: "12s" }}
      />
      <div
        className={`absolute top-1/3 -right-36 w-[550px] h-[550px] rounded-full bg-gradient-to-bl ${orbConfig.orb2} blur-[160px] animate-pulse pointer-events-none`}
        style={{ animationDuration: "16s", animationDelay: "4s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[140px] animate-pulse pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(196,181,253,0.12), transparent 70%)", animationDuration: "20s", animationDelay: "8s" }}
      />
      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(14,11,30,0.55) 80%, rgba(14,11,30,0.88) 100%)" }}
      />
      <div
        className="absolute inset-0 block dark:hidden pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(250,248,255,0.20) 85%)" }}
      />
    </div>
  );
};
```

- [ ] **Step 2: Verify build**

Run: `npm --prefix admin run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add admin/src/components/InteractiveAppBackground.tsx
git commit -m "feat(admin): replace cyber-grid particle background with soft aurora orbs"
```

---

### Task 4: Admin shell (`App.tsx`) reskin

**Files:**
- Modify: `admin/src/App.tsx`

**Interfaces:**
- Consumes: Table A mapping, plus `.liquid-glass`/`.glass-strong`/`var(--glass-strong-bg)` etc. from Task 1.

Apply Table A (`replace_all` for each row) across the whole file, then these file-specific replacements (Table A does not cover container surfaces or one-off shadows):

| Location | Find | Replace |
|---|---|---|
| Line 169 | `bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50` | `bg-[var(--background)] text-[var(--foreground)]` |
| Line 191 | `bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10` | `bg-[var(--glass-strong-bg)] backdrop-blur-[40px] saturate-[180%] border-r border-[var(--border)]` |
| Line 246 | `bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700` | `bg-[var(--glass-input-bg)] text-[10px] font-mono text-[var(--muted-foreground)] font-bold border border-[var(--border)]` |
| Line 334 | `rounded-xl glass hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-500/30` | `rounded-xl liquid-glass-card hover:brightness-110 border border-[var(--primary)]/30` |
| Line 364 | `bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200 dark:border-white/10` | `bg-[var(--glass-strong-bg)] backdrop-blur-[40px] border-b border-[var(--border)]` |
| Line 432 | `bg-slate-900 text-white` | `bg-[var(--background)] text-[var(--foreground)]` |
| Line 433 | `bg-slate-950 border border-red-500/30` | `bg-[var(--popover)] border border-[var(--destructive)]/30` |
| Line 542 | `bg-slate-950` (loading screen root) | `bg-[var(--background)]` |
| Line 543 | `border-4 border-indigo-500/20 border-t-indigo-500` | `border-4 border-[var(--primary)]/20 border-t-[var(--primary)]` |

Also check the two `hover:bg-slate-100 dark:hover:bg-white/10` occurrences (sidebar collapse/expand toggle buttons, lines 214/227) and `hover:bg-slate-100 dark:hover:bg-white/5` (nav item hover, line 278) — replace all three with `hover:bg-[var(--glass-input-bg)]`.

- [ ] **Step 1: Apply Table A + the table above to `admin/src/App.tsx`**

Use search-and-replace (`replace_all: true` per row) for every Table A pattern present in the file, then apply the file-specific rows above by exact line match.

- [ ] **Step 2: Verify build**

Run: `npm --prefix admin run build`
Expected: succeeds, no TypeScript errors, no unresolved `slate-`/`indigo-`/`rose-`/`emerald-`/`amber-` literal color classes left except inside `orbConfig` objects (background component, not App.tsx) or badge "priority" colors intentionally deferred to later tasks.

- [ ] **Step 3: Grep check**

Run: `grep -n "slate-\|dark:bg-\[#020617\]" admin/src/App.tsx`
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add admin/src/App.tsx
git commit -m "feat(admin): reskin sidebar/topbar shell with Soft Aurora glass tokens"
```

---

### Task 5: Admin `CommandPalette.tsx` reskin

**Files:**
- Modify: `admin/src/components/CommandPalette.tsx`

The palette currently hardcodes `bg-slate-900/95 ... text-slate-100` — it never adapts to light mode. Fix that plus apply Table A.

| Location | Find | Replace |
|---|---|---|
| Line 153 | `bg-slate-900/95 text-slate-100 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-2xl` | `bg-[var(--glass-strong-bg)] text-[var(--foreground)] border border-[var(--glass-strong-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-[40px] saturate-[180%]` |
| Line 156 | `border-b border-slate-800 gap-3.5 bg-slate-950/70` | `border-b border-[var(--border)] gap-3.5 bg-[var(--glass-input-bg)]` |
| Line 164 | `text-white placeholder:text-slate-400` | `text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]` |
| Line 166 | `bg-slate-800/90 px-2.5 py-1 rounded-lg text-slate-400 font-mono border border-slate-700/60 shadow-sm` | `bg-[var(--glass-input-bg)] px-2.5 py-1 rounded-lg text-[var(--muted-foreground)] font-mono border border-[var(--border)] shadow-sm` |
| Line 336 | `bg-slate-950 border-t border-slate-800 text-xs text-slate-400` | `bg-[var(--glass-input-bg)] border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]` |
| Lines 338-339 | `bg-slate-800 rounded-md text-slate-300 font-mono text-[11px] border border-slate-700` (×4 `<kbd>`) | `bg-[var(--glass-input-bg)] rounded-md text-[var(--muted-foreground)] font-mono text-[11px] border border-[var(--border)]` |

Apply Table A (`replace_all`) for the remaining `text-white`, `text-slate-*`, `bg-slate-800/40`, `border-slate-800`, `indigo-*`, `rose-*`, `emerald-*`, `amber-*` occurrences in the Quick Actions grid, blocked-candidates panel, and search-results list (lines ~181-330).

- [ ] **Step 1: Apply the table above + Table A to `admin/src/components/CommandPalette.tsx`**

- [ ] **Step 2: Verify build**

Run: `npm --prefix admin run build`
Expected: succeeds.

- [ ] **Step 3: Manual check — light mode**

With the admin dev server running (`http://localhost:8082`), toggle to light theme (Command Palette → Toggle Theme, or Settings page) and open the Command Palette (`Ctrl+K`).
Expected: the palette panel is light/frosted, not a hardcoded dark slate box.

- [ ] **Step 4: Commit**

```bash
git add admin/src/components/CommandPalette.tsx
git commit -m "feat(admin): make CommandPalette theme-aware and glass-consistent"
```

---

### Task 6: Admin `AIInterventionModal.tsx` and `CompanyMatcherModal.tsx` reskin

**Files:**
- Modify: `admin/src/components/AIInterventionModal.tsx`
- Modify: `admin/src/components/CompanyMatcherModal.tsx`

Both share the same always-dark modal chrome pattern. Apply this container mapping to each file, then Table A for the rest:

| File | Location | Find | Replace |
|---|---|---|---|
| AIInterventionModal.tsx | Line 92 | `bg-slate-900 text-slate-100 border border-indigo-500/40 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl` | `bg-[var(--glass-strong-bg)] text-[var(--foreground)] border border-[var(--primary)]/40 rounded-3xl ember-glow-lg overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-[40px] saturate-[180%]` |
| AIInterventionModal.tsx | Line 95 | `border-b border-slate-800 bg-slate-950/80` | `border-b border-[var(--border)] bg-[var(--glass-input-bg)]` |
| AIInterventionModal.tsx | Line 255 | `bg-slate-950 border-t border-slate-800` | `bg-[var(--glass-input-bg)] border-t border-[var(--border)]` |
| AIInterventionModal.tsx | Line 238 | `bg-blue-500/20 text-blue-300 border border-blue-500/30` (normal-priority chip) | `bg-[var(--chart-5)]/20 text-[var(--chart-5)] border border-[var(--chart-5)]/30` |
| CompanyMatcherModal.tsx | Line 167 | `bg-slate-900 text-slate-100 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl` | `bg-[var(--glass-strong-bg)] text-[var(--foreground)] border border-[var(--glass-strong-border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-[40px] saturate-[180%]` |
| CompanyMatcherModal.tsx | Line 170 | `border-b border-slate-800 bg-slate-950/70` | `border-b border-[var(--border)] bg-[var(--glass-input-bg)]` |
| CompanyMatcherModal.tsx | Line 403 | `bg-slate-950 border-t border-slate-800` | `bg-[var(--glass-input-bg)] border-t border-[var(--border)]` |
| CompanyMatcherModal.tsx | Lines 257, 277, 288 | `text-blue-400` (ATS slider value), `text-purple-400` (interview slider value) | `text-[var(--chart-5)]` for ATS, `text-[var(--chart-2)]` for interview |
| CompanyMatcherModal.tsx | Line 259 | `accent-blue-500` | `accent-[var(--chart-5)]` |
| CompanyMatcherModal.tsx | Line 278 | `accent-purple-500` | `accent-[var(--chart-2)]` |
| CompanyMatcherModal.tsx | Line 35 | `badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"` | `badgeColor: "bg-[var(--primary)]/20 text-[var(--primary)] border-[var(--primary)]/30"` (preset object — this field is unused in the current JSX per the read; leave the value present but token-based for when it is wired up) |

Apply Table A (`replace_all`) for the remaining `text-white`, `text-slate-*`, `bg-slate-800/*`, `bg-slate-950/*`, `border-slate-700`, `border-slate-800`, `indigo-*`, `rose-*`, `emerald-*` occurrences in both files (preset cards, sliders section, keyed-deficit chips, week-plan cards, task-priority chips, roster table).

- [ ] **Step 1: Apply the tables above + Table A to both files**

- [ ] **Step 2: Verify build**

Run: `npm --prefix admin run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add admin/src/components/AIInterventionModal.tsx admin/src/components/CompanyMatcherModal.tsx
git commit -m "feat(admin): reskin AI intervention and company matcher modals with glass tokens"
```

---

### Task 7: Admin `MentorProductTour.tsx` reskin

**Files:**
- Modify: `admin/src/components/MentorProductTour.tsx`

| Location | Find | Replace |
|---|---|---|
| Line 249 | `bg-slate-950/85 backdrop-blur-md` | `bg-[var(--background)]/85 backdrop-blur-md` |
| Line 265 | `bg-slate-950 rounded-[14px]` | `bg-[var(--popover)] rounded-[14px]` |
| Step icon colors, lines 39/56/92/121/147/173/199 (`iconColor: "text-indigo-400"` etc.) | cycle the 7 steps through the 5 chart tokens: step 1 → `text-[var(--chart-1)]`, step 2 → `text-[var(--chart-3)]`, step 3 → `text-[var(--chart-5)]`, step 4 → `text-[var(--chart-2)]`, step 5 → `text-[var(--destructive)]` (proctoring/alert step keeps a destructive-leaning hue intentionally), step 6 → `text-[var(--chart-5)]`, step 7 → `text-[var(--warning)]` | — |
| Line 207 | `bg-slate-800 text-[11px] font-mono border border-slate-700` (the `⌘K` kbd inside step 7 copy) | `bg-[var(--glass-input-bg)] text-[11px] font-mono border border-[var(--border)]` |

Apply Table A (`replace_all`) for the remaining `text-slate-300`, `text-white`, `bg-white/5`, `border-white/10`, `bg-indigo-500/10`, `border-indigo-500/20`, `bg-indigo-500/20`, `border-indigo-500/30`, `bg-indigo-500/20 text-indigo-300 border-indigo-500/30` (step badge, line 271) occurrences throughout the step-content JSX (lines 40-220) and the modal chrome (lines 250-317). Progress-dot active color (line 289, `bg-indigo-500`) and inactive (`bg-white/20`) become `bg-[var(--primary)]` and `bg-[var(--foreground)]/20` respectively.

- [ ] **Step 1: Apply the table above + Table A to `admin/src/components/MentorProductTour.tsx`**

- [ ] **Step 2: Verify build**

Run: `npm --prefix admin run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add admin/src/components/MentorProductTour.tsx
git commit -m "feat(admin): reskin mentor product tour with Soft Aurora glass tokens"
```

---

### Task 8: Student app font/token fixes (`QuizDialog.tsx`, `StudentProductTour.tsx`)

**Files:**
- Modify: `src/components/QuizDialog.tsx`
- Modify: `src/components/StudentProductTour.tsx`

`src/components/StudentCommandPalette.tsx` was checked and already uses theme tokens correctly (`bg-muted`, `text-muted-foreground`, `border-border` at line 406) — no change needed there.

`QuizDialog.tsx` hardcodes a navy `#0b1120`/`#111c34` proctoring/exam-lockdown screen regardless of theme — the strongest "cyberpunk lockdown terminal" instance in the student app. `StudentProductTour.tsx` hardcodes `text-white`/`text-slate-300/400`/`bg-slate-800/900/950` throughout, so the tour never adapts to light mode either.

| File | Location | Find | Replace |
|---|---|---|---|
| QuizDialog.tsx | Lines 156, 202, 378 | `bg-[#0b1120]` / `bg-[#0b1120]/95` | `bg-[var(--background)]` / `bg-[var(--background)]/95` |
| QuizDialog.tsx | Lines 156, 202, 378 | `text-slate-100` | `text-[var(--foreground)]` |
| QuizDialog.tsx | Lines 157, 379 | `bg-[#111c34] border border-slate-800` / `bg-[#111c34] border border-slate-700/60` | `bg-[var(--popover)] border border-[var(--border)]` |
| QuizDialog.tsx | Lines 162, 207, 387 | `text-white` | `text-[var(--foreground)]` |
| QuizDialog.tsx | Lines 163, 208, 388, 458, 475, 484-511 (label text) | `text-slate-400` / `text-slate-300` | `text-[var(--muted-foreground)]` |
| QuizDialog.tsx | Line 212 | `bg-blue-600 hover:bg-blue-500 text-white` | `bg-[var(--primary)] hover:brightness-110 text-[var(--primary-foreground)]` |
| QuizDialog.tsx | Lines 218, 535 | `bg-slate-800 hover:bg-slate-700 text-slate-300` | `bg-[var(--glass-input-bg)] hover:brightness-110 text-[var(--foreground)]` |
| QuizDialog.tsx | Line 442 | `bg-slate-950 border border-slate-700/80` | `bg-[var(--popover)] border border-[var(--border)]` |
| QuizDialog.tsx | Line 468 | `text-slate-400 font-mono` | `text-[var(--muted-foreground)] font-mono` (kept — this is a live camera-feed status readout, a legitimate data/mono use) |
| QuizDialog.tsx | Lines 484, 490, 496, 502, 508 | `bg-slate-900/60 border border-slate-800` | `bg-[var(--glass-input-bg)] border border-[var(--border)]` |
| QuizDialog.tsx | Line 522 | `border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 accent-blue-600` | `border-[var(--border)] bg-[var(--glass-input-bg)] text-[var(--primary)] focus:ring-[var(--primary)] accent-[var(--primary)]` |
| QuizDialog.tsx | Line 543 | `from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white ... shadow-indigo-500/25` | `btn-gradient` (use the existing gradient utility instead of a one-off blue/indigo gradient) |
| StudentProductTour.tsx | All `text-slate-300` prose lines (62, 86, 121, 156, 198, 233, 258, 277, 301, 336) | `text-slate-300` | `text-muted-foreground` |
| StudentProductTour.tsx | All `text-white` emphasis spans (63, 68, 93, 101, 122, 138→`text-slate-400`, 163, 171, 179, 205, 213, 283, 308, 316, 337, 693, 766, 793) | `text-white` | `text-foreground`; the one `text-slate-400` at line 138/694/796 → `text-muted-foreground` |
| StudentProductTour.tsx | Line 316 | `bg-slate-800 text-[11px] font-mono border border-slate-700` | `bg-muted text-[11px] font-mono border border-border` |
| StudentProductTour.tsx | Line 688 | `bg-slate-950/80` | `bg-background/80` |
| StudentProductTour.tsx | Line 690 | `bg-slate-900/90 border border-indigo-500/30` | `bg-popover border border-primary/30` |
| StudentProductTour.tsx | Line 735 | `bg-slate-900/95` (tooltip card) | `liquid-glass-strong` → use `bg-popover/95` (keep the existing `backdrop-blur-2xl` and shadow already on this line) |
| StudentProductTour.tsx | Line 745 | `bg-slate-900 border-indigo-500/40` (arrow pointer) | `bg-popover border-primary/40` |
| StudentProductTour.tsx | Lines 765-766 | `bg-white/[0.06] border border-white/[0.08] text-[11px] font-medium text-slate-300` | `bg-muted border border-border text-[11px] font-medium text-muted-foreground` |
| StudentProductTour.tsx | Line 774 | `text-slate-400 hover:text-white hover:bg-white/10` | `text-muted-foreground hover:text-foreground hover:bg-muted` |
| StudentProductTour.tsx | Line 793 | `text-white` | `text-foreground` |
| StudentProductTour.tsx | Line 835 | `text-slate-400 hover:text-slate-200 hover:bg-white/5` | `text-muted-foreground hover:text-foreground hover:bg-muted` |
| StudentProductTour.tsx | Line 844 | `bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300` | `bg-muted hover:brightness-110 border border-border text-muted-foreground` |

Note: student-app files already have Tailwind theme keys (`background`, `foreground`, `muted`, `popover`, `primary`, `border`) mapped to the CSS variables in `src/styles.css` via `@theme inline`, so these use plain Tailwind utility names (`text-foreground`), not `text-[var(--foreground)]` arbitrary values — unlike the admin app, which does not have that Tailwind `@theme` mapping and needs the `[var(--x)]` arbitrary-value form.

- [ ] **Step 1: Apply the table above to `src/components/QuizDialog.tsx` and `src/components/StudentProductTour.tsx`**

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Manual check — light mode**

With the student dev server running (`http://localhost:3000`), switch to light theme in Settings, then open the App Tour (sidebar → "App Tour") and trigger a proctored exam check-in screen (Coding Platforms or a mock test start flow that renders `QuizDialog`).
Expected: both surfaces are light/frosted in light mode, not a hardcoded dark navy box.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuizDialog.tsx src/components/StudentProductTour.tsx
git commit -m "fix(student): replace hardcoded dark-only colors with theme tokens in QuizDialog and StudentProductTour"
```

---

### Task 9: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Grep for leftover cyberpunk-era classes in admin**

Run: `grep -rn "neon-glow\|#020617\|bg-slate-9\|bg-slate-8\|text-slate-\|border-slate-" admin/src/App.tsx admin/src/components/CommandPalette.tsx admin/src/components/AIInterventionModal.tsx admin/src/components/CompanyMatcherModal.tsx admin/src/components/MentorProductTour.tsx admin/src/components/GlassCard.tsx admin/src/components/InteractiveAppBackground.tsx admin/src/index.css`
Expected: no matches (a stray match means a Table A row was missed in that file — fix it before proceeding).

- [ ] **Step 2: Grep for leftover hardcoded colors in the two student files**

Run: `grep -n "text-white\|text-slate-\|bg-slate-\|border-slate-\|#0b1120\|#111c34" src/components/QuizDialog.tsx src/components/StudentProductTour.tsx`
Expected: no matches.

- [ ] **Step 3: Type-check both apps**

Run: `npm run build` (root) and `npm --prefix admin run build`
Expected: both succeed with no TypeScript errors.

- [ ] **Step 4: Manual browser verification**

Using the dev servers on `http://localhost:3000` (student) and `http://localhost:8082` (admin, per `.claude/launch.json`), for each app check in both `.light` and default-dark theme:
- Landing/dashboard page: aurora background visible behind glass cards, no leftover flat/opaque panels.
- A modal (admin: Command Palette via `Ctrl+K`; student: App Tour): glass blur + border visible, text legible, no dark-only panel showing up in light mode.
- A data table (admin: Company Matcher roster, or Students page): readable in both themes, no white-on-white or dark-on-dark text.
- Font check: headings render in DM Serif Display (serif), body/UI in DM Sans, and only genuinely tabular/code text (IDs, kbd shortcuts, stat digits) uses the monospace font.

Expected: no visual regressions, no cyberpunk-era dark-navy-with-neon-glow surfaces remaining, both themes look intentional.

- [ ] **Step 5: Commit any fixes found during manual verification, then mark the plan complete**

```bash
git add -A
git commit -m "fix: address issues found during Soft Aurora theme verification pass"
```
(Skip this commit if Step 4 found nothing to fix.)

## Self-Review Notes

- **Spec coverage:** Section 1 (foundation) → Task 1. Section 2 (liquid glass) → Tasks 1-3 (utilities + GlassCard + background) plus 4-7 (applied to shell/modals). Section 3 (font cleanup) → Task 8 (and Task 2/4-7's `font-mono` preservation on kbd/data only). Section 4 (light/dark QA) → Task 9. Section 5 (rollout order) → task ordering above.
- **Placeholder scan:** every step has an exact find/replace pair or full file content; no "add appropriate styling" language.
- **Type consistency:** `GlassCard`'s `variant` union in Task 2 matches every consumer's usage found in the codebase (`variant="strong"` in `MentorProductTour.tsx`); no other admin file was found passing a `variant` prop.
