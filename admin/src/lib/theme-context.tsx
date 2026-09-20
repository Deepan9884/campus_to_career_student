import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";
export type AccentColor = "indigo" | "emerald" | "purple" | "amber" | "cyan";
export type LayoutDensity = "comfortable" | "compact";

export interface MentorPreferences {
  atRiskThreshold: number; // e.g. 60, 70, 80
  emailDigest: "daily" | "weekly" | "off";
  autoEncouragement: boolean;
  officeHoursUrl: string;
  defaultExportFormat: "csv" | "pdf" | "json";
  showAmbientGlow: boolean;
  notifyOnLowMockScore: boolean;
  notifyOnLowResumeScore: boolean;
  notifyOnInactivity: boolean;
  defaultCohortFilter: string;
}

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  density: LayoutDensity;
  setDensity: (density: LayoutDensity) => void;
  mentorPreferences: MentorPreferences;
  updatePreferences: (newPrefs: Partial<MentorPreferences>) => void;
}

const DEFAULT_PREFERENCES: MentorPreferences = {
  atRiskThreshold: 65,
  emailDigest: "daily",
  autoEncouragement: true,
  officeHoursUrl: "https://calendly.com/mentor-office-hours",
  defaultExportFormat: "csv",
  showAmbientGlow: true,
  notifyOnLowMockScore: true,
  notifyOnLowResumeScore: true,
  notifyOnInactivity: true,
  defaultCohortFilter: "my-mentees",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cf-admin-theme") as Theme;
      if (saved && ["dark", "light", "system"].includes(saved)) {
        return saved;
      }
    }
    return "dark";
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cf-admin-accent") as AccentColor;
      if (saved && ["indigo", "emerald", "purple", "amber", "cyan"].includes(saved)) {
        return saved;
      }
    }
    return "indigo";
  });

  const [density, setDensityState] = useState<LayoutDensity>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cf-admin-density") as LayoutDensity;
      if (saved && ["comfortable", "compact"].includes(saved)) {
        return saved;
      }
    }
    return "comfortable";
  });

  const [mentorPreferences, setMentorPreferences] = useState<MentorPreferences>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cf-admin-preferences");
      if (saved) {
        try {
          return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
        } catch (e) {
          console.error("Failed to parse mentor preferences", e);
        }
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let active: "dark" | "light" = "dark";
      if (theme === "system") {
        active = mediaQuery.matches ? "dark" : "light";
      } else {
        active = theme;
      }
      setResolvedTheme(active);

      if (active === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        root.classList.add("dark");
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  // Apply Accent Color to Root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-density", density);
  }, [density]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("cf-admin-theme", newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem("cf-admin-accent", color);
  };

  const setDensity = (newDensity: LayoutDensity) => {
    setDensityState(newDensity);
    localStorage.setItem("cf-admin-density", newDensity);
  };

  const updatePreferences = (newPrefs: Partial<MentorPreferences>) => {
    setMentorPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem("cf-admin-preferences", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        accentColor,
        setAccentColor,
        density,
        setDensity,
        mentorPreferences,
        updatePreferences,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
