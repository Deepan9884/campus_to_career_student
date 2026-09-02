import React, { useState } from "react";
import {
  useAmbientLighting,
  AMBIENT_PRESETS,
  SOLID_BACKGROUND_PALETTE,
  type AmbientPresetId,
  type LightIntensity,
  type MotionSpeed,
  type StarDensity,
  type UiMode,
  type BackgroundType,
} from "@/stores/ambientLightingStore";
import {
  Sparkles,
  Sliders,
  Sun,
  Moon,
  Zap,
  RotateCcw,
  Shuffle,
  Star,
  Layers,
  Check,
  X,
  Palette,
  Eye,
  MousePointer,
  Flame,
  Layout,
  Square,
  Shield,
  CircleDot,
  CheckCircle2,
  Tv2,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/stores";

interface AmbientLightingCustomizerProps {
  open: boolean;
  onClose: () => void;
}

export function AmbientLightingCustomizer({ open, onClose }: AmbientLightingCustomizerProps) {
  const {
    presetId,
    uiMode,
    backgroundType,
    glassPanelsEnabled,
    solidBackgroundColor,
    orbsEnabled,
    backgroundOpacity,
    intensity,
    motionSpeed,
    starsEnabled,
    starDensity,
    interactiveConstellations,
    shootingStars,
    clickRipple,
    customColors,
    setUiMode,
    setBackgroundType,
    setGlassPanelsEnabled,
    setSolidBackgroundColor,
    setOrbsEnabled,
    setBackgroundOpacity,
    setPreset,
    setIntensity,
    setMotionSpeed,
    setStarsEnabled,
    setStarDensity,
    setInteractiveConstellations,
    setShootingStars,
    setClickRipple,
    setCustomColors,
    resetDefaults,
  } = useAmbientLighting();

  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"style" | "presets" | "stars" | "custom">("style");
  const [canvasPaletteCategory, setCanvasPaletteCategory] = useState<"all" | "dark" | "light">("all");

  const [currentTheme, setCurrentTheme] = useState<"dark" | "light" | "system">(() => {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("c2c_theme");
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
    }
    return (user?.preferences?.theme as any) || "dark";
  });

  const handleSetTheme = (theme: "dark" | "light" | "system") => {
    setCurrentTheme(theme);
    const root = document.documentElement;
    localStorage.setItem("c2c_theme", theme);
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
      root.classList.toggle("light", theme === "light");
    }
    if (user) {
      updateUser({
        preferences: {
          ...user.preferences,
          theme,
          notifyOn: user.preferences?.notifyOn || [],
        },
      }).catch(() => {});
    }
    toast.success(`Theme set to ${theme === "light" ? "Light Mode ☀️" : theme === "dark" ? "Dark Mode 🌙" : "System Mode 💻"}`);
  };

  if (!open) return null;

  const handleShuffle = () => {
    const available = AMBIENT_PRESETS.filter((p) => p.id !== presetId);
    const random = available[Math.floor(Math.random() * available.length)];
    setPreset(random.id);
    toast.success(`Switched to ${random.name} atmosphere!`, {
      description: random.description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl panel-card rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.8)] border border-white/20 overflow-hidden space-y-5 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow header effect */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[var(--primary)]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[var(--accent)]/15 blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl grid place-items-center shadow-sm"
              style={{
                background: "linear-gradient(135deg, rgba(167,139,250,0.25) 0%, rgba(249,168,212,0.2) 100%)",
                border: "1px solid rgba(167,139,250,0.35)",
              }}
            >
              <Layout className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight">
                UI &amp; Atmosphere Studio
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="p-2 rounded-xl bg-white/8 hover:bg-white/14 text-[var(--foreground)] transition cursor-pointer border border-white/10"
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4 text-[var(--primary)]" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/8 hover:bg-white/14 text-[var(--foreground)] transition cursor-pointer border border-white/10"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl panel-slot border border-slate-200/80 dark:border-white/10 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("style")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "style"
                ? "bg-[var(--primary)] text-white shadow-sm font-bold"
                : "text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>UI Style &amp; Canvas</span>
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "presets"
                ? "bg-[var(--primary)] text-white shadow-sm font-bold"
                : "text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color Themes</span>
          </button>

          <button
            onClick={() => setActiveTab("stars")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "stars"
                ? "bg-[var(--primary)] text-white shadow-sm font-bold"
                : "text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Stars &amp; Motion</span>
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
              activeTab === "custom"
                ? "bg-[var(--primary)] text-white shadow-sm font-bold"
                : "text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom RGB</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: UI STYLE & CANVAS (MINIMALISM / LIQUID GLASS / SOLID BG) */}
          {activeTab === "style" && (
            <div className="space-y-4">
              {/* 1. Quick UI Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  Experience Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode A: Plain / Minimalist */}
                  <div
                    onClick={() => {
                      setUiMode("minimal");
                      toast.success("Plain Solid Surfaces active");
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                      !glassPanelsEnabled
                        ? "bg-emerald-500/10 border-emerald-400 ring-1 ring-emerald-400/50 shadow-md"
                        : "panel-slot hover:border-white/20 hover:bg-white/8"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 grid place-items-center shrink-0">
                        <Square className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-emerald-300 transition truncate">
                        Plain Minimalist UI
                      </h4>
                    </div>
                    {!glassPanelsEnabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-black shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Mode B: Immersive Liquid Glass */}
                  <div
                    onClick={() => {
                      setUiMode("immersive");
                      toast.success("Liquid Glass active with dynamic background");
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                      glassPanelsEnabled
                        ? "bg-[var(--primary)]/15 border-[var(--primary)] ring-1 ring-[var(--primary)]/50 shadow-md"
                        : "panel-slot hover:border-white/20 hover:bg-white/8"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] grid place-items-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition truncate">
                        Liquid Glass Surfaces
                      </h4>
                    </div>
                    {glassPanelsEnabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary)] text-white shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Glass Panels Toggle Switch */}
              <div className="p-3.5 rounded-2xl panel-slot border border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-400/30 grid place-items-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                      Liquid Glass Surfaces
                    </h4>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {glassPanelsEnabled
                        ? "Refractive surfaces paired with dynamic ambient backgrounds"
                        : "Flat solid surfaces with plain background compatibility"}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={glassPanelsEnabled}
                    onChange={(e) => {
                      setGlassPanelsEnabled(e.target.checked);
                      toast.success(
                        e.target.checked
                          ? "Liquid Glass enabled (dynamic background active)"
                          : "Flat solid surfaces enabled"
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* 3. Background Type Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                    Background Style
                  </label>
                  {glassPanelsEnabled && (
                    <span className="text-[10px] text-[var(--primary)] font-medium">
                      Liquid Glass pairs with Stars, Orbs & Mesh
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(
                    [
                      { id: "none", label: "None", plainOnly: true },
                      { id: "solid", label: "Plain Color", plainOnly: true },
                      { id: "stars", label: "Stars", plainOnly: false },
                      { id: "orbs", label: "Aurora Orbs", plainOnly: false },
                      { id: "full", label: "Full Mesh", plainOnly: false },
                    ] as { id: BackgroundType; label: string; plainOnly: boolean }[]
                  ).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        const wasGlass = glassPanelsEnabled;
                        setBackgroundType(b.id);
                        if (wasGlass && b.plainOnly) {
                          toast.info(`Plain background active (switched to Plain Minimalist UI)`);
                        } else {
                          toast.success(`Background: ${b.label}`);
                        }
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 font-bold text-xs",
                        backgroundType === b.id
                          ? "bg-white/14 border-[var(--primary)] text-[var(--foreground)] ring-1 ring-[var(--primary)]/40 shadow-sm"
                          : "panel-slot border-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/8"
                      )}
                    >
                      <span className="truncate">{b.label}</span>
                      {b.plainOnly && (
                        <span className="text-[9px] font-normal text-[var(--muted-foreground)]">
                          Plain UI
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 0. Light / Dark Mode Appearance Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Theme Mode</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "light", icon: Sun, label: "Light", color: "text-amber-500" },
                    { id: "dark", icon: Moon, label: "Dark", color: "text-indigo-400" },
                    { id: "system", icon: Monitor, label: "System", color: "text-slate-400" },
                  ].map(({ id, icon: Icon, label, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSetTheme(id as any)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between",
                        currentTheme === id
                          ? "bg-[var(--primary)]/15 border-[var(--primary)] ring-1 ring-[var(--primary)]/40 shadow-sm"
                          : "panel-slot hover:border-slate-300 dark:hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn("w-4 h-4", color)} />
                        <span className="text-xs font-bold text-[var(--foreground)]">{label}</span>
                      </div>
                      {currentTheme === id && (
                        <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Solid Background Color Palette */}
              {(backgroundType === "solid" || uiMode === "minimal") && (
                <div className="p-4 rounded-2xl panel-slot border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Canvas Palette</span>
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setCanvasPaletteCategory("all")}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-semibold transition cursor-pointer",
                          canvasPaletteCategory === "all"
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        All (16)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanvasPaletteCategory("dark")}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-semibold transition cursor-pointer",
                          canvasPaletteCategory === "dark"
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        Dark (8)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanvasPaletteCategory("light")}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-semibold transition cursor-pointer",
                          canvasPaletteCategory === "light"
                            ? "bg-[var(--primary)] text-white"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}
                      >
                        Light (8)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SOLID_BACKGROUND_PALETTE.filter(
                      (s) => canvasPaletteCategory === "all" || (s as any).theme === canvasPaletteCategory
                    ).map((swatch) => (
                      <button
                        key={swatch.color}
                        onClick={() => {
                          setSolidBackgroundColor(swatch.color, swatch.accent);
                          if (swatch.preset) {
                            setPreset(swatch.preset as any);
                          }
                          if (swatch.accent && typeof document !== "undefined") {
                            document.documentElement.setAttribute("data-accent", swatch.accent);
                            try {
                              localStorage.setItem("c2c_accent", swatch.accent);
                            } catch {}
                          }
                          if ((swatch as any).theme === "light") {
                            handleSetTheme("light");
                          } else if ((swatch as any).theme === "dark") {
                            handleSetTheme("dark");
                          }
                          if (glassPanelsEnabled) {
                            toast.info(`Set ${swatch.label} (switched to Plain Minimalist UI)`);
                          } else {
                            toast.success(`Set background: ${swatch.label}`);
                          }
                        }}
                        style={{ backgroundColor: swatch.color }}
                        className={cn(
                          "h-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer shadow-sm relative group",
                          solidBackgroundColor.toLowerCase() === swatch.color.toLowerCase()
                            ? "border-emerald-500 ring-2 ring-emerald-500/50 scale-105"
                            : "border-slate-300 dark:border-white/20 hover:scale-105"
                        )}
                        title={swatch.label}
                      >
                        {solidBackgroundColor.toLowerCase() === swatch.color.toLowerCase() && (
                          <Check className={cn(
                            "w-3.5 h-3.5",
                            (swatch as any).theme === "light" ? "text-emerald-700 font-extrabold" : "text-emerald-400"
                          )} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Hex Color input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="color"
                      value={solidBackgroundColor}
                      onChange={(e) => {
                        const hex = e.target.value;
                        if (hex && hex.startsWith("#") && hex.length === 7) {
                          const r = parseInt(hex.substring(1, 3), 16) / 255;
                          const g = parseInt(hex.substring(3, 5), 16) / 255;
                          const b = parseInt(hex.substring(5, 7), 16) / 255;
                          const max = Math.max(r, g, b);
                          const min = Math.min(r, g, b);
                          const delta = max - min;
                          let h = 0;
                          if (delta > 0) {
                            if (max === r) h = ((g - b) / delta) % 6;
                            else if (max === g) h = (b - r) / delta + 2;
                            else h = (r - g) / delta + 4;
                            h = Math.round(h * 60);
                            if (h < 0) h += 360;
                          }
                          let detectedAccent = "indigo";
                          if (h >= 65 && h <= 165) detectedAccent = "emerald";
                          else if (h > 165 && h <= 210) detectedAccent = "cyan";
                          else if (h > 210 && h <= 265) detectedAccent = "indigo";
                          else if (h > 265 && h <= 325) detectedAccent = "purple";
                          else if (h > 325 || h <= 20) detectedAccent = "rose";
                          else if (h > 20 && h < 65) detectedAccent = "amber";

                          setSolidBackgroundColor(hex, detectedAccent);
                          if (typeof document !== "undefined") {
                            document.documentElement.setAttribute("data-accent", detectedAccent);
                            try {
                              localStorage.setItem("c2c_accent", detectedAccent);
                            } catch {}
                          }
                          const brightness = (r * 255 * 299 + g * 255 * 587 + b * 255 * 114) / 1000;
                          if (brightness >= 128 && currentTheme !== "light") {
                            handleSetTheme("light");
                          } else if (brightness < 128 && currentTheme !== "dark") {
                            handleSetTheme("dark");
                          }
                        } else {
                          setSolidBackgroundColor(hex);
                        }
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={solidBackgroundColor}
                      onChange={(e) => {
                        const hex = e.target.value;
                        if (hex && hex.startsWith("#") && hex.length === 7) {
                          const r = parseInt(hex.substring(1, 3), 16) / 255;
                          const g = parseInt(hex.substring(3, 5), 16) / 255;
                          const b = parseInt(hex.substring(5, 7), 16) / 255;
                          const max = Math.max(r, g, b);
                          const min = Math.min(r, g, b);
                          const delta = max - min;
                          let h = 0;
                          if (delta > 0) {
                            if (max === r) h = ((g - b) / delta) % 6;
                            else if (max === g) h = (b - r) / delta + 2;
                            else h = (r - g) / delta + 4;
                            h = Math.round(h * 60);
                            if (h < 0) h += 360;
                          }
                          let detectedAccent = "indigo";
                          if (h >= 65 && h <= 165) detectedAccent = "emerald";
                          else if (h > 165 && h <= 210) detectedAccent = "cyan";
                          else if (h > 210 && h <= 265) detectedAccent = "indigo";
                          else if (h > 265 && h <= 325) detectedAccent = "purple";
                          else if (h > 325 || h <= 20) detectedAccent = "rose";
                          else if (h > 20 && h < 65) detectedAccent = "amber";

                          setSolidBackgroundColor(hex, detectedAccent);
                          if (typeof document !== "undefined") {
                            document.documentElement.setAttribute("data-accent", detectedAccent);
                            try {
                              localStorage.setItem("c2c_accent", detectedAccent);
                            } catch {}
                          }
                          const brightness = (r * 255 * 299 + g * 255 * 587 + b * 255 * 114) / 1000;
                          if (brightness >= 128 && currentTheme !== "light") {
                            handleSetTheme("light");
                          } else if (brightness < 128 && currentTheme !== "dark") {
                            handleSetTheme("dark");
                          }
                        } else {
                          setSolidBackgroundColor(hex);
                        }
                      }}
                      placeholder="#000000"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-[var(--foreground)] uppercase"
                    />
                  </div>
                </div>
              )}

              {/* 5. Background Opacity Slider */}
              {backgroundType !== "none" && (
                <div className="p-4 rounded-2xl panel-slot border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Background FX Intensity</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-[var(--primary)]">
                      {backgroundOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={backgroundOpacity}
                    onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRESET COLOR THEMES */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AMBIENT_PRESETS.map((p) => {
                  const isSelected = presetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setPreset(p.id);
                        toast.success(`Theme: ${p.name}`);
                      }}
                      className={cn(
                        "p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                        isSelected
                          ? "bg-white/12 border-[var(--primary)] shadow-[0_0_20px_rgba(167,139,250,0.25)] ring-1 ring-[var(--primary)]/40"
                          : "panel-slot hover:border-white/20 hover:bg-white/8"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl shrink-0 shadow-md transition-transform group-hover:scale-105 border border-white/20"
                          style={{ background: p.gradientPreview }}
                        />
                        <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition truncate">
                          {p.name}
                        </h4>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white grid place-items-center shrink-0 shadow-sm">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Intensity & Speed Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                {/* Glow Intensity */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> Glow Intensity
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl panel-slot border border-white/10">
                    {(["subtle", "balanced", "vivid", "radiant"] as LightIntensity[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setIntensity(lvl)}
                        className={cn(
                          "py-1.5 rounded-lg text-[11px] font-semibold capitalize transition cursor-pointer text-center",
                          intensity === lvl
                            ? "bg-[var(--primary)] text-white shadow-sm"
                            : "text-[var(--muted-foreground)] hover:text-white"
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motion Speed */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[var(--primary)]" /> Aurora Flow Speed
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl panel-slot border border-white/10">
                    {(["static", "calm", "flow", "dynamic"] as MotionSpeed[]).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setMotionSpeed(spd)}
                        className={cn(
                          "py-1.5 rounded-lg text-[11px] font-semibold capitalize transition cursor-pointer text-center",
                          motionSpeed === spd
                            ? "bg-[var(--primary)] text-white shadow-sm"
                            : "text-[var(--muted-foreground)] hover:text-white"
                        )}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE STARS & MOTION */}
          {activeTab === "stars" && (
            <div className="space-y-4">
              {/* Stars Master Toggle */}
              <div className="p-3.5 rounded-2xl panel-slot border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 grid place-items-center shrink-0">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                    Twinkling Star Field
                  </h4>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={starsEnabled}
                    onChange={(e) => setStarsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Star Density */}
              <div className="p-3.5 rounded-2xl panel-slot border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--primary)]" /> Star Density
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--primary)] capitalize">
                    {starDensity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-black/20 border border-white/10">
                  {(["low", "medium", "high"] as StarDensity[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setStarDensity(d)}
                      disabled={!starsEnabled}
                      className={cn(
                        "py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer text-center",
                        starDensity === d
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-[var(--muted-foreground)] hover:text-white disabled:opacity-40"
                      )}
                    >
                      {d} {d === "low" ? "(50)" : d === "medium" ? "(110)" : "(190)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Cursor Constellations */}
                <div
                  onClick={() => setInteractiveConstellations(!interactiveConstellations)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
                    interactiveConstellations
                      ? "bg-white/12 border-[var(--primary)] shadow-sm"
                      : "panel-slot border-white/10 opacity-70"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MousePointer className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <h5 className="text-xs font-bold text-[var(--foreground)] truncate">Constellations</h5>
                  </div>
                  <input
                    type="checkbox"
                    checked={interactiveConstellations}
                    readOnly
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                {/* 2. Shooting Stars */}
                <div
                  onClick={() => setShootingStars(!shootingStars)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
                    shootingStars
                      ? "bg-white/12 border-amber-400 shadow-sm"
                      : "panel-slot border-white/10 opacity-70"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <h5 className="text-xs font-bold text-[var(--foreground)] truncate">Shooting Stars</h5>
                  </div>
                  <input
                    type="checkbox"
                    checked={shootingStars}
                    readOnly
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                  />
                </div>

                {/* 3. Click Stardust Ripple */}
                <div
                  onClick={() => setClickRipple(!clickRipple)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
                    clickRipple
                      ? "bg-white/12 border-emerald-400 shadow-sm"
                      : "panel-slot border-white/10 opacity-70"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h5 className="text-xs font-bold text-[var(--foreground)] truncate">Click Ripple</h5>
                  </div>
                  <input
                    type="checkbox"
                    checked={clickRipple}
                    readOnly
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM PALETTE STUDIO */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl panel-slot border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                    Custom Ambient RGB Colors
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                    Live Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Orb 1 */}
                  <div className="p-3 rounded-xl bg-black/25 border border-white/10 space-y-2">
                    <label className="text-[11px] font-semibold text-[var(--foreground)] flex items-center justify-between">
                      <span>Primary Orb</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">Top-Left</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.orb1}
                        onChange={(e) => setCustomColors({ orb1: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={customColors.orb1}
                        onChange={(e) => setCustomColors({ orb1: e.target.value })}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--foreground)] uppercase"
                      />
                    </div>
                  </div>

                  {/* Orb 2 */}
                  <div className="p-3 rounded-xl bg-black/25 border border-white/10 space-y-2">
                    <label className="text-[11px] font-semibold text-[var(--foreground)] flex items-center justify-between">
                      <span>Secondary Orb</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">Right</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.orb2}
                        onChange={(e) => setCustomColors({ orb2: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={customColors.orb2}
                        onChange={(e) => setCustomColors({ orb2: e.target.value })}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--foreground)] uppercase"
                      />
                    </div>
                  </div>

                  {/* Orb 3 */}
                  <div className="p-3 rounded-xl bg-black/25 border border-white/10 space-y-2">
                    <label className="text-[11px] font-semibold text-[var(--foreground)] flex items-center justify-between">
                      <span>Ambient Aura</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">Bottom</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors.orb3}
                        onChange={(e) => setCustomColors({ orb3: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={customColors.orb3}
                        onChange={(e) => setCustomColors({ orb3: e.target.value })}
                        className="flex-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[var(--foreground)] uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              resetDefaults();
              toast.info("Reset atmosphere to Cosmic Violet defaults.");
            }}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--muted-foreground)] hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full btn-gradient btn-gradient-hover text-white text-xs font-semibold transition shadow-md active:scale-95 cursor-pointer"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
}
