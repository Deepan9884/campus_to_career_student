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

interface AmbientLightingState {
  presetId: AmbientPresetId;
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
      intensity: "vivid",
      motionSpeed: "flow",
      starsEnabled: true,
      starDensity: "medium",
      interactiveConstellations: true,
      shootingStars: true,
      clickRipple: true,
      customColors: {
        orb1: "#8B5CF6",
        orb2: "#EC4899",
        orb3: "#6366F1",
        starTint: "#C4B5FD",
      },

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
      setStarsEnabled: (starsEnabled) => set({ starsEnabled }),
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
          try {
            localStorage.setItem("c2c_accent", "indigo");
          } catch {}
        }
        set({
          presetId: "cosmic-violet",
          intensity: "vivid",
          motionSpeed: "flow",
          starsEnabled: true,
          starDensity: "medium",
          interactiveConstellations: true,
          shootingStars: true,
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
      name: "c2c_ambient_lighting_v1",
    }
  )
);
