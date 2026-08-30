import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AmbientPresetId =
  | "cosmic-violet"
  | "aurora-emerald"
  | "cyber-cyan"
  | "sunset-amber"
  | "sapphire-indigo"
  | "sakura-rose"
  | "superdream-gold"
  | "custom";

export type LightIntensity = "subtle" | "balanced" | "vivid" | "radiant";
export type MotionSpeed = "static" | "calm" | "flow" | "dynamic";
export type StarDensity = "low" | "medium" | "high";
export type UiMode = "minimal" | "immersive" | "custom";
export type BackgroundType = "none" | "solid" | "stars" | "orbs" | "full";

export interface AmbientPreset {
  id: AmbientPresetId;
  name: string;
  description: string;
  accent: string;
  colors: {
    orb1: string;
    orb2: string;
    orb3: string;
    starTint: string;
    constellationLine: string;
    cursorGlow: string;
  };
  gradientPreview: string;
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: "cosmic-violet",
    name: "Cosmic Violet",
    description: "Ethereal violet, magenta nebula & soft stardust glow",
    accent: "indigo",
    colors: {
      orb1: "rgba(139, 92, 246, 0.28)",
      orb2: "rgba(236, 72, 153, 0.22)",
      orb3: "rgba(99, 102, 241, 0.18)",
      starTint: "#C4B5FD",
      constellationLine: "rgba(167, 139, 250, 0.35)",
      cursorGlow: "rgba(167, 139, 250, 0.25)",
    },
    gradientPreview: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #6366F1 100%)",
  },
  {
    id: "aurora-emerald",
    name: "Aurora Borealis",
    description: "Luminous emerald green, electric teal & arctic cyan",
    accent: "emerald",
    colors: {
      orb1: "rgba(16, 185, 129, 0.26)",
      orb2: "rgba(20, 184, 166, 0.22)",
      orb3: "rgba(6, 182, 212, 0.18)",
      starTint: "#A7F3D0",
      constellationLine: "rgba(110, 231, 183, 0.35)",
      cursorGlow: "rgba(52, 211, 153, 0.25)",
    },
    gradientPreview: "linear-gradient(135deg, #10B981 0%, #14B8A6 50%, #06B6D4 100%)",
  },
  {
    id: "cyber-cyan",
    name: "Cyberpunk Neon",
    description: "Electric cyan, deep sapphire blue & neon ultraviolet",
    accent: "cyan",
    colors: {
      orb1: "rgba(6, 182, 212, 0.28)",
      orb2: "rgba(59, 130, 246, 0.24)",
      orb3: "rgba(168, 85, 247, 0.18)",
      starTint: "#BAE6FD",
      constellationLine: "rgba(125, 211, 252, 0.35)",
      cursorGlow: "rgba(56, 189, 248, 0.25)",
    },
    gradientPreview: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #A855F7 100%)",
  },
  {
    id: "sunset-amber",
    name: "Solar Nebula",
    description: "Warm golden amber, solar flare orange & rose crimson",
    accent: "amber",
    colors: {
      orb1: "rgba(245, 158, 11, 0.28)",
      orb2: "rgba(244, 63, 94, 0.22)",
      orb3: "rgba(251, 146, 60, 0.20)",
      starTint: "#FDE68A",
      constellationLine: "rgba(253, 230, 138, 0.35)",
      cursorGlow: "rgba(251, 191, 36, 0.25)",
    },
    gradientPreview: "linear-gradient(135deg, #F59E0B 0%, #F43F5E 50%, #FB923C 100%)",
  },
  {
    id: "sapphire-indigo",
    name: "Deep Space",
    description: "Royal cobalt, midnight sapphire & amethyst dust",
    accent: "indigo",
    colors: {
      orb1: "rgba(59, 130, 246, 0.28)",
      orb2: "rgba(99, 102, 241, 0.24)",
      orb3: "rgba(139, 92, 246, 0.18)",
      starTint: "#93C5FD",
      constellationLine: "rgba(147, 197, 253, 0.35)",
      cursorGlow: "rgba(96, 165, 250, 0.25)",
    },
    gradientPreview: "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
  },
  {
    id: "sakura-rose",
    name: "Sakura Opal",
    description: "Delicate blossom rose, soft lilac & peach ambient lights",
    accent: "rose",
    colors: {
      orb1: "rgba(244, 63, 94, 0.26)",
      orb2: "rgba(236, 72, 153, 0.22)",
      orb3: "rgba(251, 146, 60, 0.16)",
      starTint: "#FECDD3",
      constellationLine: "rgba(253, 164, 175, 0.35)",
      cursorGlow: "rgba(251, 113, 133, 0.25)",
    },
    gradientPreview: "linear-gradient(135deg, #F43F5E 0%, #EC4899 50%, #FB923C 100%)",
  },
  {
    id: "superdream-gold",
    name: "Radiant Super Dream",
    description: "Prestigious imperial gold, royal violet & diamond stars",
    accent: "amber",
    colors: {
      orb1: "rgba(251, 191, 36, 0.30)",
      orb2: "rgba(168, 85, 247, 0.24)",
      orb3: "rgba(236, 72, 153, 0.18)",
      starTint: "#FEF08A",
      constellationLine: "rgba(253, 224, 71, 0.40)",
      cursorGlow: "rgba(250, 204, 21, 0.30)",
    },
    gradientPreview: "linear-gradient(135deg, #FBBF24 0%, #A855F7 50%, #EC4899 100%)",
  },
];

export const SOLID_BACKGROUND_PALETTE = [
  // Dark Solid Canvas
  { label: "Deep Obsidian", color: "#0B0F19", text: "text-white", theme: "dark", accent: "carbon", preset: "cosmic-violet" },
  { label: "Pure Carbon", color: "#05070B", text: "text-white", theme: "dark", accent: "carbon", preset: "cosmic-violet" },
  { label: "Midnight Slate", color: "#0F172A", text: "text-white", theme: "dark", accent: "cyan", preset: "cyber-cyan" },
  { label: "Dark Zinc", color: "#18181B", text: "text-white", theme: "dark", accent: "zinc", preset: "cosmic-violet" },
  { label: "Rich Navy", color: "#0A1128", text: "text-white", theme: "dark", accent: "cyan", preset: "cyber-cyan" },
  { label: "Charcoal Black", color: "#121212", text: "text-white", theme: "dark", accent: "charcoal", preset: "cosmic-violet" },
  { label: "Deep Violet", color: "#130E26", text: "text-white", theme: "dark", accent: "purple", preset: "cosmic-violet" },
  { label: "Dark Forest", color: "#061A14", text: "text-white", theme: "dark", accent: "emerald", preset: "aurora-emerald" },
  // Light Solid Canvas
  { label: "Pure White", color: "#FFFFFF", text: "text-slate-900", theme: "light", accent: "indigo", preset: "cosmic-violet" },
  { label: "Soft Pearl", color: "#FAF8FF", text: "text-slate-900", theme: "light", accent: "indigo", preset: "cosmic-violet" },
  { label: "Clean Alabaster", color: "#F8FAFC", text: "text-slate-900", theme: "light", accent: "cyan", preset: "cyber-cyan" },
  { label: "Warm Linen", color: "#FDFBF7", text: "text-slate-900", theme: "light", accent: "amber", preset: "sunset-amber" },
  { label: "Lavender Mist", color: "#F5F3FF", text: "text-slate-900", theme: "light", accent: "purple", preset: "cosmic-violet" },
  { label: "Ice Blue Tint", color: "#F0F9FF", text: "text-slate-900", theme: "light", accent: "cyan", preset: "cyber-cyan" },
  { label: "Mint Cream", color: "#F0FDF4", text: "text-slate-900", theme: "light", accent: "emerald", preset: "aurora-emerald" },
  { label: "Rose Quartz", color: "#FFF1F2", text: "text-slate-900", theme: "light", accent: "rose", preset: "sakura-rose" },
];

interface AmbientLightingState {
  // Preset & Color state
  presetId: AmbientPresetId;
  uiMode: UiMode;
  backgroundType: BackgroundType;
  glassPanelsEnabled: boolean;
  solidBackgroundColor: string;
  orbsEnabled: boolean;
  backgroundOpacity: number;
  intensity: LightIntensity;
  motionSpeed: MotionSpeed;
  starsEnabled: boolean;
  starDensity: StarDensity;
  interactiveConstellations: boolean;
  shootingStars: boolean;
  clickRipple: boolean;
  customColors: {
    orb1: string;
    orb2: string;
    orb3: string;
    starTint: string;
  };

  // Actions
  setUiMode: (uiMode: UiMode) => void;
  setBackgroundType: (backgroundType: BackgroundType) => void;
  setGlassPanelsEnabled: (enabled: boolean) => void;
  setSolidBackgroundColor: (color: string, customAccent?: string) => void;
  setOrbsEnabled: (enabled: boolean) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setPreset: (presetId: AmbientPresetId) => void;
  setIntensity: (intensity: LightIntensity) => void;
  setMotionSpeed: (speed: MotionSpeed) => void;
  setStarsEnabled: (enabled: boolean) => void;
  setStarDensity: (density: StarDensity) => void;
  setInteractiveConstellations: (enabled: boolean) => void;
  setShootingStars: (enabled: boolean) => void;
  setClickRipple: (enabled: boolean) => void;
  setCustomColors: (colors: Partial<AmbientLightingState["customColors"]>) => void;
  resetDefaults: () => void;
}

export const useAmbientLighting = create<AmbientLightingState>()(
  persist(
    (set) => ({
      presetId: "cosmic-violet",
      uiMode: "immersive",
      backgroundType: "full",
      glassPanelsEnabled: true,
      solidBackgroundColor: "#0B0F19",
      orbsEnabled: true,
      backgroundOpacity: 100,
      intensity: "balanced",
      motionSpeed: "flow",
      starsEnabled: true,
      starDensity: "medium",
      interactiveConstellations: true,
      shootingStars: false,
      clickRipple: true,
      customColors: {
        orb1: "#8B5CF6",
        orb2: "#EC4899",
        orb3: "#6366F1",
        starTint: "#C4B5FD",
      },

      setUiMode: (uiMode) => {
        if (uiMode === "minimal") {
          set({
            uiMode: "minimal",
            glassPanelsEnabled: false,
          });
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-glass", "off");
          }
        } else if (uiMode === "immersive") {
          set({
            uiMode: "immersive",
            glassPanelsEnabled: true,
          });
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-glass", "on");
          }
        } else {
          set({ uiMode: "custom" });
        }
      },

      setBackgroundType: (backgroundType) => {
        set((state) => ({
          backgroundType,
          uiMode: "custom",
          starsEnabled: backgroundType === "stars" || backgroundType === "full",
          orbsEnabled: backgroundType === "orbs" || backgroundType === "full",
        }));
      },

      setGlassPanelsEnabled: (enabled) => {
        set({ glassPanelsEnabled: enabled, uiMode: "custom" });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-glass", enabled ? "on" : "off");
        }
      },

      setSolidBackgroundColor: (color, customAccent) => {
        const found = SOLID_BACKGROUND_PALETTE.find((s) => s.color.toLowerCase() === color.toLowerCase());
        const targetAccent = customAccent || found?.accent;
        const targetPreset = (found as any)?.preset as AmbientPresetId | undefined;

        if (targetAccent && typeof document !== "undefined") {
          document.documentElement.setAttribute("data-accent", targetAccent);
          try {
            localStorage.setItem("c2c_accent", targetAccent);
          } catch {}
        }

        set((state) => ({
          solidBackgroundColor: color,
          backgroundType: "solid",
          uiMode: state.uiMode === "minimal" ? "minimal" : state.uiMode,
          presetId: targetPreset || state.presetId,
        }));
      },

      setOrbsEnabled: (enabled) => {
        set((state) => ({
          orbsEnabled: enabled,
          uiMode: "custom",
          backgroundType: enabled
            ? (state.starsEnabled ? "full" : "orbs")
            : (state.starsEnabled ? "stars" : (state.backgroundType === "solid" ? "solid" : "none")),
        }));
      },

      setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),

      setPreset: (presetId) => {
        const found = AMBIENT_PRESETS.find((p) => p.id === presetId);
        if (found && typeof document !== "undefined") {
          document.documentElement.setAttribute("data-accent", found.accent);
          try {
            localStorage.setItem("c2c_accent", found.accent);
          } catch {}
        }
        set({ presetId });
      },

      setIntensity: (intensity) => set({ intensity }),
      setMotionSpeed: (motionSpeed) => set({ motionSpeed }),
      setStarsEnabled: (starsEnabled) =>
        set((state) => ({
          starsEnabled,
          uiMode: "custom",
          backgroundType: starsEnabled
            ? (state.orbsEnabled ? "full" : "stars")
            : (state.orbsEnabled ? "orbs" : (state.backgroundType === "solid" ? "solid" : "none")),
        })),
      setStarDensity: (starDensity) => set({ starDensity }),
      setInteractiveConstellations: (interactiveConstellations) =>
        set({ interactiveConstellations }),
      setShootingStars: (shootingStars) => set({ shootingStars }),
      setClickRipple: (clickRipple) => set({ clickRipple }),
      setCustomColors: (colors) =>
        set((state) => ({
          presetId: "custom",
          customColors: { ...state.customColors, ...colors },
        })),

      resetDefaults: () => {
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-accent", "indigo");
          document.documentElement.setAttribute("data-glass", "on");
          try {
            localStorage.setItem("c2c_accent", "indigo");
          } catch {}
        }
        set({
          presetId: "cosmic-violet",
          uiMode: "immersive",
          backgroundType: "full",
          glassPanelsEnabled: true,
          solidBackgroundColor: "#0B0F19",
          orbsEnabled: true,
          backgroundOpacity: 100,
          intensity: "balanced",
          motionSpeed: "flow",
          starsEnabled: true,
          starDensity: "medium",
          interactiveConstellations: true,
          shootingStars: false,
          clickRipple: true,
          customColors: {
            orb1: "#8B5CF6",
            orb2: "#EC4899",
            orb3: "#6366F1",
            starTint: "#C4B5FD",
          },
        });
      },
    }),
    {
      name: "c2c_ambient_lighting_v2",
    }
  )
);
