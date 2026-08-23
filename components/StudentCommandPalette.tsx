import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  X,
  LayoutDashboard,
  FileText,
  Mic,
  Github,
  Target,
  Map,
  BarChart3,
  Trophy,
  Linkedin,
  Settings,
  Bell,
  Sun,
  Moon,
  ArrowRight,
  Zap,
  Palette,
  Code2,
  Sparkles,
  Star,
  FileCode,
} from "lucide-react";
import { useAuth } from "@/stores";
import { useSuperDream } from "@/stores/superDreamStore";
import { useAmbientLighting, AMBIENT_PRESETS } from "@/stores/ambientLightingStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface NavCommand {
  id: string;
  title: string;
  category: "navigation" | "action" | "appearance";
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  keywords: string[];
  action: () => void;
}

export function StudentCommandPalette({ open, onClose }: StudentCommandPaletteProps) {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { enterSuperDreamMode, setActiveTab } = useSuperDream();
  const ambient = useAmbientLighting();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Set accent theme helper
  const handleSetAccent = (accent: string, label: string) => {
    const root = document.documentElement;
    root.setAttribute("data-accent", accent);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("c2c_accent", accent);
    }
    if (user) {
      updateUser({
        preferences: {
          ...user.preferences,
          theme: user.preferences?.theme || "dark",
          notifyOn: user.preferences?.notifyOn || [],
          accentColor: accent as any,
        },
      }).catch(() => {});
    }
    toast.success(`Accent theme switched to ${label}`);
    onClose();
  };

  // Toggle dark/light theme helper
  const handleToggleTheme = () => {
    const root = document.documentElement;
    const isLight = root.classList.contains("light");
    const newTheme = isLight ? "dark" : "light";
    root.classList.toggle("dark", !isLight);
    root.classList.toggle("light", isLight);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("c2c_theme", newTheme);
    }
    if (user) {
      updateUser({
        preferences: {
          ...user.preferences,
          notifyOn: user.preferences?.notifyOn || [],
          theme: newTheme as any,
        },
      }).catch(() => {});
    }
    toast.success(`Theme switched to ${newTheme.toUpperCase()} mode`);
    onClose();
  };

  const commands: NavCommand[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Dashboard Overview",
      category: "navigation",
      icon: LayoutDashboard,
      keywords: ["home", "main", "overview", "stats", "readiness"],
      action: () => {
        navigate({ to: "/dashboard" });
        onClose();
      },
    },
    {
      id: "nav-online-tests",
      title: "Proctored Online Coding Tests",
      category: "superdream",
      icon: FileCode,
      badge: "Super Dream",
      keywords: ["exam", "test", "tests", "assessment", "proctor", "proctored", "mcq", "coding", "scorecard", "results", "arena"],
      action: () => {
        enterSuperDreamMode(false);
        setActiveTab("tests");
        navigate({ to: "/super-dream" });
        onClose();
      },
    },
    {
      id: "nav-tests",
      title: "Super Dream Coding Tests Arena",
      category: "navigation",
      icon: Code2,
      badge: "Super Dream",
      keywords: ["test", "tests", "coding", "compiler", "assessment", "proctoring", "exam", "dsa", "faang", "super dream"],
      action: () => {
        enterSuperDreamMode(false);
        setActiveTab("tests");
        navigate({ to: "/super-dream" });
        onClose();
      },
    },
    {
      id: "nav-resume",
      title: "ATS Resume Review & Optimizer",
      category: "navigation",
      icon: FileText,
      badge: "AI Review",
      keywords: ["resume", "cv", "ats", "score", "pdf", "keywords"],
      action: () => {
        navigate({ to: "/resume" });
        onClose();
      },
    },
    {
      id: "nav-interview",
      title: "AI Voice & Tech Mock Interview",
      category: "navigation",
      icon: Mic,
      badge: "Voice & AI",
      keywords: ["interview", "mock", "practice", "questions", "voice", "speech"],
      action: () => {
        navigate({ to: "/interview" });
        onClose();
      },
    },
    {
      id: "nav-events",
      title: "Event Proofs & Hackathons",
      category: "navigation",
      icon: Trophy,
      keywords: ["events", "hackathon", "certificates", "proof", "podium"],
      action: () => {
        navigate({ to: "/events" });
        onClose();
      },
    },
    {
      id: "nav-github",
      title: "GitHub Repository Projects",
      category: "navigation",
      icon: Github,
      keywords: ["github", "code", "repos", "repositories", "commits"],
      action: () => {
        navigate({ to: "/github" });
        onClose();
      },
    },
    {
      id: "nav-skills",
      title: "Skill Gap Matrix & Radar",
      category: "navigation",
      icon: Target,
      keywords: ["skills", "gaps", "radar", "technologies", "benchmarks"],
      action: () => {
        navigate({ to: "/skills" });
        onClose();
      },
    },
    {
      id: "nav-roadmap",
      title: "Career Learning Roadmap",
      category: "navigation",
      icon: Map,
      keywords: ["roadmap", "learning", "study", "plan", "milestones"],
      action: () => {
        navigate({ to: "/roadmap" });
        onClose();
      },
    },
    {
      id: "nav-coding",
      title: "Coding Platform Analytics",
      category: "navigation",
      icon: BarChart3,
      keywords: ["coding", "leetcode", "hackerrank", "codechef", "codeforces"],
      action: () => {
        navigate({ to: "/coding-platforms" });
        onClose();
      },
    },
    {
      id: "nav-linkedin",
      title: "LinkedIn Post Generator",
      category: "navigation",
      icon: Linkedin,
      keywords: ["linkedin", "post", "social", "branding", "ideas"],
      action: () => {
        navigate({ to: "/linkedin-posts" });
        onClose();
      },
    },
    {
      id: "nav-analytics",
      title: "Readiness Analytics & Trends",
      category: "navigation",
      icon: BarChart3,
      keywords: ["analytics", "charts", "metrics", "history", "trend"],
      action: () => {
        navigate({ to: "/analytics" });
        onClose();
      },
    },
    {
      id: "nav-settings",
      title: "Settings & Appearance",
      category: "navigation",
      icon: Settings,
      keywords: ["settings", "preferences", "theme", "password", "profile"],
      action: () => {
        navigate({ to: "/settings" });
        onClose();
      },
    },
    {
      id: "nav-notifications",
      title: "Notifications & System Alerts",
      category: "navigation",
      icon: Bell,
      keywords: ["notifications", "alerts", "messages", "bell"],
      action: () => {
        navigate({ to: "/notifications" });
        onClose();
      },
    },

    // Quick Actions
    {
      id: "act-start-interview",
      title: "Start Quick Warmup Interview",
      category: "action",
      icon: Zap,
      badge: "Quick Action",
      keywords: ["start", "launch", "interview", "quick", "warmup"],
      action: () => {
        navigate({ to: "/interview" });
        onClose();
      },
    },
    {
      id: "act-upload-resume",
      title: "Score a New Resume Draft",
      category: "action",
      icon: FileText,
      badge: "Upload",
      keywords: ["upload", "resume", "scan", "ats", "score"],
      action: () => {
        navigate({ to: "/resume" });
        onClose();
      },
    },

    // Appearance & Accents
    {
      id: "theme-toggle",
      title: "Toggle Dark / Light Mode",
      category: "appearance",
      icon: Sun,
      keywords: ["theme", "light", "dark", "mode", "toggle", "appearance"],
      action: handleToggleTheme,
    },
    {
      id: "accent-indigo",
      title: "Accent Color: Indigo Electric (Default)",
      category: "appearance",
      icon: Palette,
      badge: "Indigo",
      keywords: ["accent", "color", "indigo", "blue", "purple"],
      action: () => handleSetAccent("indigo", "Indigo Electric"),
    },
    {
      id: "accent-purple",
      title: "Accent Color: Royal Purple",
      category: "appearance",
      icon: Palette,
      badge: "Purple",
      keywords: ["accent", "color", "purple", "violet", "fuchsia"],
      action: () => handleSetAccent("purple", "Royal Purple"),
    },
    {
      id: "accent-emerald",
      title: "Accent Color: Emerald Growth",
      category: "appearance",
      icon: Palette,
      badge: "Emerald",
      keywords: ["accent", "color", "emerald", "green", "growth"],
      action: () => handleSetAccent("emerald", "Emerald Growth"),
    },
    {
      id: "accent-amber",
      title: "Accent Color: Amber Glow",
      category: "appearance",
      icon: Palette,
      badge: "Amber",
      keywords: ["accent", "color", "amber", "orange", "glow"],
      action: () => handleSetAccent("amber", "Amber Glow"),
    },
    {
      id: "accent-cyan",
      title: "Accent Color: Ocean Cyan",
      category: "appearance",
      icon: Palette,
      badge: "Cyan",
      keywords: ["accent", "color", "cyan", "sky", "azure"],
      action: () => handleSetAccent("cyan", "Ocean Cyan"),
    },
    {
      id: "accent-rose",
      title: "Accent Color: Rose Bloom",
      category: "appearance",
      icon: Palette,
      badge: "Rose",
      keywords: ["accent", "color", "rose", "red", "pink"],
      action: () => handleSetAccent("rose", "Rose Bloom"),
    },

    // Atmospheric Background Lighting Presets
    ...AMBIENT_PRESETS.map((p) => ({
      id: `ambient-${p.id}`,
      title: `Atmospheric Lights: ${p.name}`,
      category: "appearance" as const,
      icon: Sparkles,
      badge: "Lighting",
      keywords: ["background", "lights", "ambient", "aurora", "theme", "stars", p.name.toLowerCase()],
      action: () => {
        ambient.setPreset(p.id);
        toast.success(`Atmospheric lights switched to ${p.name}!`);
        onClose();
      },
    })),
    {
      id: "ambient-toggle-stars",
      title: `Toggle Interactive Stars Background (${ambient.starsEnabled ? "Currently ON" : "Currently OFF"})`,
      category: "appearance" as const,
      icon: Star,
      badge: "Stars",
      keywords: ["stars", "particles", "background", "twinkle", "constellation", "space"],
      action: () => {
        ambient.setStarsEnabled(!ambient.starsEnabled);
        toast.success(`Interactive Stars ${!ambient.starsEnabled ? "Enabled" : "Disabled"}`);
        onClose();
      },
    },
  ];

  // Filter commands
  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const inTitle = cmd.title.toLowerCase().includes(q);
    const inKeywords = cmd.keywords.some((k) => k.toLowerCase().includes(q));
    return inTitle || inKeywords;
  });

  // Handle keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Command Palette Card */}
      <div
        className="relative w-full max-w-3xl lg:max-w-4xl bg-card border border-border dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-6 py-4.5 border-b border-border dark:border-white/10 gap-3.5 bg-muted/20">
          <Search className="h-6 w-6 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search tools, or switch accent theme..."
            className="w-full bg-transparent text-base sm:text-lg outline-none text-foreground placeholder:text-muted-foreground font-medium"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-muted text-xs font-mono text-muted-foreground border border-border">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl cursor-pointer transition text-sm shadow-sm",
                    isSelected
                      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/30"
                      : "text-foreground hover:bg-muted/60 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl shrink-0 transition-transform",
                        isSelected
                          ? "bg-indigo-500/20 text-indigo-500 scale-105"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="truncate">{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {cmd.badge && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        {cmd.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="h-4 w-4 text-indigo-500 shrink-0" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground space-y-2">
              <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="font-bold text-base">No matching commands found</p>
              <p className="text-xs">Try searching for "interview", "resume", "theme", or "accent"</p>
            </div>
          )}
        </div>

        {/* Footer info & shortcut hints */}
        <div className="px-6 py-3.5 bg-muted/40 border-t border-border dark:border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px]">↑</kbd>
              <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px]">↵</kbd>
              Select
            </span>
          </div>

          <span className="text-xs font-medium hidden sm:inline">
            Press <strong className="text-foreground">⌘K</strong> anytime to open
          </span>
        </div>
      </div>
    </div>
  );
}
