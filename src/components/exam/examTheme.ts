/**
 * Centralized exam theme tokens for skill verification / AI assessment consoles.
 * Light mode is the default. All exam surfaces must use these tokens instead of
 * hardcoded dark-only Tailwind classes so text stays WCAG AA readable in both modes.
 */

export function getExamTheme(isLight: boolean) {
  return {
    page: isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#0b1120] text-slate-100",
    panel: isLight ? "bg-white border-slate-200" : "bg-[#0f172a] border-slate-800",
    panelAlt: isLight ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800",
    header: isLight ? "bg-white border-slate-200" : "bg-[#0f172a] border-slate-800",
    headerAlt: isLight ? "bg-slate-50 border-slate-200" : "bg-[#0b1329] border-slate-800",
    bodyText: isLight ? "text-slate-800" : "text-slate-200",
    strongText: isLight ? "text-slate-900" : "text-white",
    secondaryText: isLight ? "text-slate-600" : "text-slate-300",
    // Hints only — never body copy. Dark uses slate-400 (not slate-500) for AA on #0b1120.
    mutedText: isLight ? "text-slate-500" : "text-slate-400",
    optionCard: isLight
      ? "bg-white border-slate-200 text-slate-800"
      : "bg-[#111c34] border-slate-700 text-slate-200",
    optionCardHover: isLight ? "hover:bg-slate-50 hover:border-indigo-300" : "hover:bg-[#16203a] hover:border-slate-500",
    badge: isLight
      ? "bg-slate-100 border-slate-200 text-slate-700"
      : "bg-slate-800 border-slate-600 text-slate-200",
    radio: isLight ? "border-slate-300 bg-white" : "border-slate-500 bg-slate-900",
    inactivePill: isLight
      ? "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60",
  };
}

export function getInitialExamTheme(storageKey = "c2c_exam_theme"): boolean {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return saved === "light";
  } catch {
    /* ignore */
  }
  // Light mode is the default for assessments (readability-first).
  return true;
}

export function persistExamTheme(isLight: boolean, storageKey = "c2c_exam_theme") {
  try {
    localStorage.setItem(storageKey, isLight ? "light" : "dark");
  } catch {
    /* ignore */
  }
}
