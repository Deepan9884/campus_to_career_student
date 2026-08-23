import React, { useState } from "react";
import {
  useAmbientLighting,
  AMBIENT_PRESETS,
  type AmbientPresetId,
  type LightIntensity,
  type MotionSpeed,
  type StarDensity,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AmbientLightingCustomizerProps {
  open: boolean;
  onClose: () => void;
}

export function AmbientLightingCustomizer({ open, onClose }: AmbientLightingCustomizerProps) {
  const {
    presetId,
    intensity,
    motionSpeed,
    starsEnabled,
    starDensity,
    interactiveConstellations,
    shootingStars,
    clickRipple,
    customColors,
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

  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "stars">("presets");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl panel-card rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.7)] border border-white/20 overflow-hidden space-y-5 max-h-[90vh] flex flex-col"
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
              <Sparkles className="w-5 h-5 text-[var(--primary)] animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
                Atmospheric Lighting &amp; Stars Studio
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Customize ambient glow orbs, color themes, and interactive starry background.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="p-2 rounded-xl bg-white/8 hover:bg-white/14 text-[var(--foreground)] transition cursor-pointer border border-white/10"
              title="Shuffle atmospheric lights"
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
        <div className="flex items-center gap-1.5 p-1 rounded-2xl panel-slot border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab("presets")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer",
              activeTab === "presets"
                ? "bg-white/14 text-white shadow-sm border border-white/20"
                : "text-[var(--muted-foreground)] hover:text-white"
            )}
          >
            <Palette className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Awesome Color Themes</span>
          </button>

          <button
            onClick={() => setActiveTab("stars")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer",
              activeTab === "stars"
                ? "bg-white/14 text-white shadow-sm border border-white/20"
                : "text-[var(--muted-foreground)] hover:text-white"
            )}
          >
            <Star className="w-3.5 h-3.5 text-amber-300" />
            <span>Interactive Stars</span>
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer",
              activeTab === "custom"
                ? "bg-white/14 text-white shadow-sm border border-white/20"
                : "text-[var(--muted-foreground)] hover:text-white"
            )}
          >
            <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Custom Palette Studio</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* TAB 1: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AMBIENT_PRESETS.map((p) => {
                  const isSelected = presetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setPreset(p.id);
                        toast.success(`Active theme: ${p.name}`);
                      }}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                        isSelected
                          ? "bg-white/12 border-[var(--primary)] shadow-[0_0_20px_rgba(167,139,250,0.25)] ring-1 ring-[var(--primary)]/40"
                          : "panel-slot hover:border-white/20 hover:bg-white/8"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl shrink-0 shadow-md transition-transform group-hover:scale-105 border border-white/20"
                          style={{ background: p.gradientPreview }}
                        />
                        <div className="truncate">
                          <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition truncate">
                            {p.name}
                          </h4>
                          <p className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white grid place-items-center shrink-0 shadow-sm">
                          <Check className="w-3.5 h-3.5" />
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

          {/* TAB 2: INTERACTIVE STARS */}
          {activeTab === "stars" && (
            <div className="space-y-4">
              {/* Stars Master Toggle */}
              <div className="p-4 rounded-2xl panel-slot border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 grid place-items-center shrink-0">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                      Living Twinkling Star Field
                    </h4>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      Render high-performance starry background particles with smooth twinkling.
                    </p>
                  </div>
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
              <div className="p-4 rounded-2xl panel-slot border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--primary)]" /> Star Dust Density
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--primary)] capitalize">
                    {starDensity} Density
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-black/20 border border-white/10">
                  {(["low", "medium", "high"] as StarDensity[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setStarDensity(d)}
                      disabled={!starsEnabled}
                      className={cn(
                        "py-2 rounded-lg text-xs font-semibold capitalize transition cursor-pointer text-center",
                        starDensity === d
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-[var(--muted-foreground)] hover:text-white disabled:opacity-40"
                      )}
                    >
                      {d} {d === "low" ? "(80)" : d === "medium" ? "(155)" : "(250)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Cursor Constellations */}
                <div
                  onClick={() => setInteractiveConstellations(!interactiveConstellations)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3",
                    interactiveConstellations
                      ? "bg-white/12 border-[var(--primary)] shadow-sm"
                      : "panel-slot border-white/10 opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <MousePointer className="w-4 h-4 text-[var(--primary)]" />
                    <input
                      type="checkbox"
                      checked={interactiveConstellations}
                      readOnly
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[var(--foreground)]">Cursor Constellations</h5>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      Connects stars &amp; adds magnetic gravity around pointer.
                    </p>
                  </div>
                </div>

                {/* 2. Shooting Stars */}
                <div
                  onClick={() => setShootingStars(!shootingStars)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3",
                    shootingStars
                      ? "bg-white/12 border-amber-400 shadow-sm"
                      : "panel-slot border-white/10 opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <input
                      type="checkbox"
                      checked={shootingStars}
                      readOnly
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[var(--foreground)]">Shooting Stars</h5>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      Streaks radiant meteors across the sky periodically.
                    </p>
                  </div>
                </div>

                {/* 3. Click Stardust Ripple */}
                <div
                  onClick={() => setClickRipple(!clickRipple)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3",
                    clickRipple
                      ? "bg-white/12 border-emerald-400 shadow-sm"
                      : "panel-slot border-white/10 opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <input
                      type="checkbox"
                      checked={clickRipple}
                      readOnly
                      className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[var(--foreground)]">Click Ripple Wave</h5>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      Disperses a glowing stardust ripple wave on mouse click.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM PALETTE STUDIO */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl panel-slot border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                      Custom Ambient Light Studio
                    </h4>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      Pick any custom RGB/Hex colors for the three atmospheric glowing orbs.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                    Live Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Orb 1 */}
                  <div className="p-3 rounded-xl bg-black/25 border border-white/10 space-y-2">
                    <label className="text-[11px] font-semibold text-[var(--foreground)] flex items-center justify-between">
                      <span>Primary Orb Light</span>
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
                      <span>Secondary Orb Light</span>
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
                      <span>Bottom Ambient Aura</span>
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
            Apply &amp; Done
          </button>
        </div>
      </div>
    </div>
  );
}
