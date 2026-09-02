import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Mic,
  Github,
  Target,
  Map,
  BarChart3,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  Settings,
  CheckCheck,
  BellOff,
  Linkedin,
  Trophy,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Search,
  Crown,
  Compass,
  Code,
  FileCode,
  UserCheck,
  Users,
  Cpu,
  Binary,
  Layers,
  BrainCircuit,
  Cloud,
  Award,
  Brain,
  Code2,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/stores";
import { useSuperDream, type SuperDreamTab } from "@/stores/superDreamStore";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { StudentProductTour } from "@/components/StudentProductTour";
import { SuperDreamTour } from "@/components/superdream/SuperDreamTour";
import { StudentCommandPalette } from "@/components/StudentCommandPalette";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getBadges } from "@/lib/badges-api";
import type { BadgeId, EarnedBadge } from "@/types/badges";
import { BrandLogo } from "@/components/BrandLogo";
import { InteractiveAppBackground } from "@/components/InteractiveAppBackground";

import { AmbientLightingCustomizer } from "@/components/AmbientLightingCustomizer";
import { useAmbientLighting } from "@/stores/ambientLightingStore";
import { Sparkles, ChevronDown, ChevronUp, Sliders, Sun, Moon } from "lucide-react";
import { SuperDreamSidebarAccordion } from "@/components/shell/SuperDreamSidebarAccordion";
import { AppNavbarHeader } from "@/components/shell/AppNavbarHeader";
import { NotificationBell } from "@/components/shell/NotificationBell";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Events & Proofs", icon: Trophy },
  { to: "/resume", label: "Resume Analyzer", icon: FileText },
  { to: "/interview", label: "Mock Interview", icon: Mic },
  { to: "/github", label: "GitHub Projects", icon: Github },
  { to: "/linkedin-posts", label: "LinkedIn Post Ideas", icon: Linkedin },
  { to: "/skills", label: "Skill Gap", icon: Target },
  { to: "/roadmap", label: "Learning Roadmap", icon: Map },
  { to: "/coding-platforms", label: "Coding Platforms", icon: BarChart3 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export interface SuperDreamSubItem {
  id: string;
  tab: SuperDreamTab;
  sectionId?: number;
  label: string;
  badge?: string;
  icon: any;
}

export interface SuperDreamBranch {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  accentBg: string;
  accentBorder: string;
  items: SuperDreamSubItem[];
}

export const SUPER_DREAM_BRANCHES: SuperDreamBranch[] = [
  {
    id: "coding",
    title: "Coding & DSA",
    description: "Languages, Core CS & DSA Practice",
    icon: Code2,
    color: "text-emerald-600 dark:text-emerald-400",
    accentBg: "rgba(16, 185, 129, 0.12)",
    accentBorder: "rgba(16, 185, 129, 0.25)",
    items: [
      { id: "sec-1", tab: "track-road", sectionId: 1, label: "1. Languages", icon: Code },
      { id: "sec-2", tab: "track-road", sectionId: 2, label: "2. CS Fundamentals", icon: Cpu },
      { id: "sec-3", tab: "track-road", sectionId: 3, label: "3. Coding & DSA", icon: Binary },
    ],
  },
  {
    id: "certifications",
    title: "Certifications & Learning",
    description: "Industry certs, AI & Cloud roadmaps",
    icon: Award,
    color: "text-amber-600 dark:text-amber-400",
    accentBg: "rgba(245, 158, 11, 0.12)",
    accentBorder: "rgba(245, 158, 11, 0.25)",
    items: [
      { id: "sec-8", tab: "track-road", sectionId: 8, label: "8. Certifications", icon: Award },
      { id: "sec-5", tab: "track-road", sectionId: 5, label: "5. AI & Data Science", icon: BrainCircuit },
      { id: "sec-6", tab: "track-road", sectionId: 6, label: "6. Cloud & DevOps", icon: Cloud },
      { id: "courses", tab: "courses", label: "Skill Courses", icon: GraduationCap },
    ],
  },
  {
    id: "portfolio",
    title: "Projects & Portfolio",
    description: "Fullstack apps, GitHub & Events",
    icon: Layers,
    color: "text-cyan-600 dark:text-cyan-400",
    accentBg: "rgba(6, 182, 212, 0.12)",
    accentBorder: "rgba(6, 182, 212, 0.25)",
    items: [
      { id: "sec-4", tab: "track-road", sectionId: 4, label: "4. Software Dev", icon: Layers },
      { id: "sec-7", tab: "track-road", sectionId: 7, label: "7. GitHub Portfolio", icon: Github },
      { id: "events", tab: "events", label: "Events & Proofs", icon: Trophy },
    ],
  },
  {
    id: "interview",
    title: "Interview & Placement",
    description: "Mocks, AI Brain & Final Readiness",
    icon: Crown,
    color: "text-purple-600 dark:text-purple-400",
    accentBg: "rgba(167, 139, 250, 0.12)",
    accentBorder: "rgba(167, 139, 250, 0.25)",
    items: [
      { id: "sec-9", tab: "track-road", sectionId: 9, label: "9. Interview Prep", icon: Mic },
      { id: "sec-10", tab: "track-road", sectionId: 10, label: "10. Readiness Eval", icon: Crown },
      { id: "brain", tab: "skill-analyzer", label: "Brain Analyzer", icon: Brain },
      { id: "interview-hub", tab: "interview", label: "Interview Center", icon: UserCheck },
    ],
  },
];

const ALL_BADGE_IDS: BadgeId[] = [
  "First Steps",
  "Resume Ready",
  "Interview Warmup",
  "Interview Pro",
  "Code Explorer",
  "Gap Closer",
  "Roadmap Builder",
  "Quiz Streak",
  "High Scorer",
];

export function AppShell() {
  const { user, logout, isCheckingAuth, updateUser } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    isSuperDreamMode,
    enterSuperDreamMode,
    exitSuperDreamMode,
    activeTab,
    setActiveTab,
    activeSectionId,
    setActiveSectionId,
    expandedBranch,
    setExpandedBranch,
  } = useSuperDream();

  const { glassPanelsEnabled, backgroundType } = useAmbientLighting();

  // Sync data-glass and data-bg on document root for full UI customizability
  useEffect(() => {
    if (typeof document !== "undefined") {
      let resolvedBg = backgroundType;
      // When Liquid Glass is active, plain/none background is not allowed — pair with dynamic background
      if (glassPanelsEnabled && (resolvedBg === "solid" || resolvedBg === "none")) {
        resolvedBg = "full";
      }
      document.documentElement.setAttribute("data-glass", glassPanelsEnabled ? "on" : "off");
      document.documentElement.setAttribute("data-bg", resolvedBg);
    }
  }, [glassPanelsEnabled, backgroundType]);

  const isSuperDreamActive = pathname.startsWith("/super-dream");

  // Auto-expand the active section's branch on mount or navigation
  useEffect(() => {
    if (!isSuperDreamActive) return;
    for (const branch of SUPER_DREAM_BRANCHES) {
      const hasActiveChild = branch.items.some(
        (item) =>
          item.tab === activeTab &&
          (item.sectionId === undefined || activeSectionId === item.sectionId)
      );
      if (hasActiveChild && expandedBranch !== branch.id) {
        setExpandedBranch(branch.id);
        break;
      }
    }
  }, [activeTab, activeSectionId, isSuperDreamActive]);

  const handleEnterSuperDream = () => {
    enterSuperDreamMode(true);
    setActiveTab("track-road");
    setActiveSectionId(0);
    navigate({ to: "/super-dream" });
    setMobileOpen(false);
  };

  const handleExitSuperDream = () => {
    exitSuperDreamMode();
    navigate({ to: "/dashboard" });
    setMobileOpen(false);
    toast.info("Returned to Standard Campus to Career Mode");
  };

  const handleSuperDreamNavClick = (tab: SuperDreamTab, sectionId?: number) => {
    setActiveTab(tab);
    if (sectionId !== undefined) {
      setActiveSectionId(sectionId);
    }
    if (!pathname.startsWith("/super-dream")) {
      navigate({ to: "/super-dream" });
    }
    setMobileOpen(false);
  };

  const toggleBranch = (branchId: string) => {
    setExpandedBranch(expandedBranch === branchId ? null : branchId);
  };

  const [showProductTour, setShowProductTour] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cf-student-tour-done") !== "true";
    }
    return false;
  });
  const [showSuperDreamTour, setShowSuperDreamTour] = useState(false);

  const handleOpenTour = () => {
    if (isSuperDreamActive) {
      setShowSuperDreamTour(true);
    } else {
      setShowProductTour(true);
    }
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cf_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [ambientCustomizerOpen, setAmbientCustomizerOpen] = useState(false);

  // Synchronize Light/Dark Mode state
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light");
    }
    return false;
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsLightMode(document.documentElement.classList.contains("light"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleToggleTheme = () => {
    const root = document.documentElement;
    const isLight = root.classList.contains("light");
    const nextTheme = isLight ? "dark" : "light";

    root.classList.remove("light", "dark");
    root.classList.add(nextTheme);
    setIsLightMode(nextTheme === "light");
    localStorage.setItem("c2c_theme", nextTheme);

    if (user) {
      updateUser({
        preferences: {
          ...user.preferences,
          theme: nextTheme,
          notifyOn: user.preferences?.notifyOn || [],
        },
      }).catch(() => {});
    }

    toast.success(`Switched to ${nextTheme === "light" ? "Light Mode ☀️" : "Dark Mode 🌙"}`);
  };

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("cf_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStream();

  // Filter navigation modules according to user's sidebar visibility preferences
  const hiddenModules = user?.preferences?.hiddenModules || [];
  const filteredNav = nav.filter(
    (item) => item.to === "/dashboard" || item.to === "/settings" || !hiddenModules.includes(item.to)
  );

  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const earnedBadgeIdsRef = useRef<Set<string>>(new Set());
  const lastCelebrationAtRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const res = await getBadges();
        if (!isMounted) return;
        const list = res.data.badges || [];
        setEarnedBadges(list);
        earnedBadgeIdsRef.current = new Set(list.map((b) => b.badgeId));
      } catch {
        // silent
      }
    }

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Notifications are pushed whenever the user completes a server action.
    if (!user) return;

    const now = Date.now();
    if (now - lastCelebrationAtRef.current < 1500) {
      // throttle bursty events
    }

    const t = setTimeout(async () => {
      try {
        const res = await getBadges();
        const list = res.data.badges || [];
        const newIds = new Set(list.map((b) => b.badgeId));

        const prevIds = earnedBadgeIdsRef.current;
        const newlyEarned = ALL_BADGE_IDS.filter((id) => newIds.has(id) && !prevIds.has(id));

        if (newlyEarned.length > 0) {
          earnedBadgeIdsRef.current = newIds;
          setEarnedBadges(list);

          const badgeId = newlyEarned[0];
          lastCelebrationAtRef.current = Date.now();

          // Confetti burst
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Toast
          toast.success(badgeId, {
            description: "New badge unlocked!",
          });
        } else {
          earnedBadgeIdsRef.current = newIds;
          setEarnedBadges(list);
        }
      } catch {
        // silent
      }
    }, 250);

    return () => clearTimeout(t);
  }, [notifications, user]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex relative bg-background text-foreground">
      {/* Interactive Constellation & Cyber Mesh Background Feature */}
      <InteractiveAppBackground />

      {/* Dynamic Cursor Aura & Stardust Trail for Light & Dark Themes */}


      {/* Global Student Command Palette (Cmd+K) */}
      <StudentCommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Atmospheric Lighting & Interactive Stars Studio */}
      <AmbientLightingCustomizer
        open={ambientCustomizerOpen}
        onClose={() => setAmbientCustomizerOpen(false)}
      />

      <OnboardingWizard
        open={showOnboardingWizard ? true : undefined}
        onClose={() => setShowOnboardingWizard(false)}
        onComplete={() => {
          setShowOnboardingWizard(false);
          setShowProductTour(true);
        }}
      />
      <StudentProductTour open={showProductTour} onClose={() => setShowProductTour(false)} />
      <SuperDreamTour open={showSuperDreamTour} onClose={() => setShowSuperDreamTour(false)} />

      {/* Sidebar — Persistent on desktop/tablet */}
      <aside
        className={cn(
          "hidden md:flex flex-col liquid-glass m-3 mr-0 rounded-2xl p-4 sticky top-3 h-[calc(100vh-1.5rem)] transition-all duration-300 shrink-0 z-40",
          sidebarCollapsed ? "w-20 items-center px-3" : "w-72",
        )}
      >
        {isSuperDreamActive ? (
          /* Super Dream Sidebar Header */
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5 py-1">
                <div
                  className="w-10 h-10 rounded-xl grid place-items-center shrink-0 shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, rgba(167,139,250,0.25) 0%, rgba(249,168,212,0.2) 100%)",
                    border: "1px solid rgba(167,139,250,0.35)",
                  }}
                >
                  <Crown className="w-5 h-5 text-[var(--primary)]" />
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold tracking-wide text-[var(--foreground)] truncate">
                      SUPER DREAM
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">Easwari Engineering</p>
                  </div>
                )}
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition shrink-0"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
              </button>
            </div>

            {/* Exit Button */}
            <button
              onClick={handleExitSuperDream}
              title={sidebarCollapsed ? "Exit Workspace" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl text-[13px] font-semibold transition cursor-pointer",
                sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
              )}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "var(--muted-foreground)" }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Exit Workspace</span>}
            </button>
          </div>
        ) : (
          /* Standard Sidebar Header */
          <div className="flex items-center justify-between w-full">
            <BrandLogo collapsed={sidebarCollapsed} />
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/70 hover:text-foreground transition shrink-0"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        )}

        <nav className="mt-4 flex-1 space-y-2 w-full overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isSuperDreamActive ? (
            /* Super Dream Reorganized 4-Branch Progressive Navigation */
            <SuperDreamSidebarAccordion
              sidebarCollapsed={sidebarCollapsed}
              activeTab={activeTab}
              activeSectionId={activeSectionId}
              expandedBranch={expandedBranch}
              toggleBranch={toggleBranch}
              onNavigate={handleSuperDreamNavClick}
            />
          ) : (
            /* Standard Navigation + Clean Super Dream Entrance */
            <>
              <button
                onClick={handleEnterSuperDream}
                title={sidebarCollapsed ? "Super Dream Workspace" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl text-[13.5px] font-bold btn-gradient btn-gradient-hover transition-all cursor-pointer mb-3",
                  sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
                )}
              >
                <Compass className="h-4.5 w-4.5 shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-bold">Super Dream Workspace</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold">PRO</span>
                  </div>
                )}
              </button>
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl text-sm transition-all cursor-pointer",
                      sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5",
                      isActive
                        ? "bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-[var(--foreground)] font-bold border border-indigo-200/80 dark:border-transparent shadow-xs"
                        : "text-slate-600 dark:text-[var(--muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-[var(--foreground)]"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 w-full space-y-1.5">
          {/* Atmosphere Studio Trigger */}
          <button
            onClick={() => setAmbientCustomizerOpen(true)}
            title={sidebarCollapsed ? "Atmosphere Studio" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl text-[13px] font-semibold transition cursor-pointer text-slate-600 dark:text-[var(--muted-foreground)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
              sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5",
            )}
          >
            <Sliders className="h-4 w-4 shrink-0 text-[var(--primary)]" />
            {!sidebarCollapsed && <span>UI & Atmosphere Studio</span>}
          </button>

          <button
            onClick={handleOpenTour}
            data-tour="app-tour-btn"
            title={sidebarCollapsed ? (isSuperDreamActive ? "Super Dream Tour" : "App Tour") : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl text-[13.5px] transition cursor-pointer",
              sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5",
              isSuperDreamActive
                ? "text-amber-500 dark:text-amber-300 hover:bg-amber-500/10 font-bold"
                : "text-slate-700 dark:text-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-foreground font-semibold"
            )}
          >
            <HelpCircle className={cn("h-4.5 w-4.5 shrink-0", isSuperDreamActive ? "text-amber-500 dark:text-amber-400" : "text-slate-700 dark:text-foreground")} />
            {!sidebarCollapsed && <span>{isSuperDreamActive ? "Super Dream Tour" : "App Tour"}</span>}
          </button>

          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl text-[13.5px] font-semibold text-slate-700 dark:text-foreground hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition",
              sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
            )}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 glass-strong p-4 flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between">
              {isSuperDreamActive ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-indigo-400 font-bold text-xs">
                    SD
                  </div>
                  <span className="font-bold text-white text-sm">Super Dream Workspace</span>
                </div>
              ) : (
                <Brand />
              )}
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isSuperDreamActive && (
              <button
                onClick={handleExitSuperDream}
                className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800"
              >
                <LogOut className="h-4 w-4 text-slate-400" /> Exit Workspace
              </button>
            )}

            <nav className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
              {isSuperDreamActive ? (
                <SuperDreamSidebarAccordion
                  sidebarCollapsed={false}
                  activeTab={activeTab}
                  activeSectionId={activeSectionId}
                  expandedBranch={expandedBranch}
                  toggleBranch={toggleBranch}
                  onNavigate={(tab, secId) => {
                    setMobileOpen(false);
                    handleSuperDreamNavClick(tab, secId);
                  }}
                />
              ) : (
                <>
                  <button
                    onClick={handleEnterSuperDream}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2"
                  >
                    <Compass className="h-4.5 w-4.5 text-indigo-400" />
                    <span>Super Dream Workspace</span>
                  </button>

                  {filteredNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition cursor-pointer",
                          isActive
                            ? "bg-white/10 text-[var(--foreground)] font-semibold"
                            : "text-[var(--muted-foreground)] hover:bg-white/5"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>

            <button
              onClick={() => {
                setMobileOpen(false);
                handleOpenTour();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition mb-1",
                isSuperDreamActive ? "text-amber-300 hover:bg-amber-500/10 font-medium" : "hover:bg-white/10"
              )}
            >
              <HelpCircle className={cn("h-4 w-4", isSuperDreamActive ? "text-amber-400" : "")} />
              <span>{isSuperDreamActive ? "Super Dream Tour" : "App Tour"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <AppNavbarHeader
          user={user}
          isCheckingAuth={isCheckingAuth}
          isLightMode={isLightMode}
          sidebarCollapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onToggleMobileOpen={() => setMobileOpen(!mobileOpen)}
          onToggleSidebar={toggleSidebar}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleTheme={handleToggleTheme}
          onOpenAmbientCustomizer={() => setAmbientCustomizerOpen(true)}
          onLogout={handleLogout}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
        <main className="flex-1 p-3 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Link to="/dashboard" className="flex items-center justify-center py-1 w-full" title="Campus to Career">
        <img
          src="/logo-dark.png"
          alt="Campus to Career"
          className="hidden dark:block h-8 w-auto object-contain"
        />
        <img
          src="/logo.png"
          alt="Campus to Career"
          className="block dark:hidden h-8 w-auto object-contain"
        />
      </Link>
    );
  }

  return (
    <Link to="/dashboard" className="flex items-center py-1">
      <img
        src="/logo-dark.png"
        alt="Campus to Career"
        className="hidden dark:block h-9 md:h-10 w-auto max-w-[180px] object-contain transition-all"
      />
      <img
        src="/logo.png"
        alt="Campus to Career"
        className="block dark:hidden h-9 md:h-10 w-auto max-w-[180px] object-contain transition-all"
      />
    </Link>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: { to: string; label: string; icon: typeof LayoutDashboard };
  active: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      data-tour={`nav-${String(item?.to || "").replace("/", "")}`}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl text-sm transition-all",
        collapsed ? "justify-center p-2.5" : "px-3.5 py-2.5",
        active
          ? "btn-gradient text-white font-bold shadow-lg shadow-indigo-500/25 border border-white/20"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-500 dark:text-slate-400")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}


