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

interface SuperDreamNavItem {
  id: string;
  tab: SuperDreamTab;
  sectionId?: number;
  label: string;
  category: "core" | "sections" | "aux";
  icon: any;
}

const superDreamNav: SuperDreamNavItem[] = [
  // Primary Control & Brain
  { id: "nav-track-road", tab: "track-road", sectionId: 0, label: "Track Road (Sec 0)", icon: Compass, category: "core" },
  { id: "nav-tests", tab: "tests", label: "Proctored Coding Tests", icon: Code2, category: "core" },
  { id: "nav-brain", tab: "skill-analyzer", label: "Skill Analyzer Brain", icon: Brain, category: "core" },

  // All 10 Official Checklist Sections from PDF
  { id: "nav-sec-1", tab: "track-road", sectionId: 1, label: "1. Programming Languages", icon: Code, category: "sections" },
  { id: "nav-sec-2", tab: "track-road", sectionId: 2, label: "2. CS Fundamentals", icon: Cpu, category: "sections" },
  { id: "nav-sec-3", tab: "track-road", sectionId: 3, label: "3. Coding & DSA", icon: Binary, category: "sections" },
  { id: "nav-sec-4", tab: "track-road", sectionId: 4, label: "4. Software Development", icon: Layers, category: "sections" },
  { id: "nav-sec-5", tab: "track-road", sectionId: 5, label: "5. AI & Data Science", icon: BrainCircuit, category: "sections" },
  { id: "nav-sec-6", tab: "track-road", sectionId: 6, label: "6. Cloud & DevOps", icon: Cloud, category: "sections" },
  { id: "nav-sec-7", tab: "track-road", sectionId: 7, label: "7. GitHub Portfolio", icon: Github, category: "sections" },
  { id: "nav-sec-8", tab: "track-road", sectionId: 8, label: "8. Certifications", icon: Award, category: "sections" },
  { id: "nav-sec-9", tab: "track-road", sectionId: 9, label: "9. Interview Preparation", icon: Mic, category: "sections" },
  { id: "nav-sec-10", tab: "track-road", sectionId: 10, label: "10. Placement Readiness", icon: Crown, category: "sections" },
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
  const { user, logout, isCheckingAuth } = useAuth();
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
  } = useSuperDream();

  const isSuperDreamActive = pathname.startsWith("/super-dream");

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
      if (typeof window !== "undefined") {
        localStorage.setItem("cf_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStream();

  // Filter navigation modules according to user's sidebar visibility preferences
  const hiddenModules = user?.preferences?.hiddenModules || [];
  const filteredNav = nav.filter((item) => !hiddenModules.includes(item.to));

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

      {/* Global Student Command Palette (Cmd+K) */}
      <StudentCommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
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
          sidebarCollapsed ? "w-20 items-center px-3" : "w-64",
        )}
      >
        {isSuperDreamActive ? (
          /* Super Dream Sidebar Header */
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5 py-1">
                <div className="w-8 h-8 rounded-lg grid place-items-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.30)", color: "var(--primary)" }}>
                  SD
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--foreground)] tracking-tight">Super Dream</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Study Workspace</p>
                  </div>
                )}
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition shrink-0"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>

            {/* Exit Button */}
            <button
              onClick={handleExitSuperDream}
              title={sidebarCollapsed ? "Exit Workspace" : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl text-xs font-medium transition cursor-pointer",
                sidebarCollapsed ? "justify-center p-2" : "px-3 py-2"
              )}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "var(--muted-foreground)" }}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {!sidebarCollapsed && <span>Exit Workspace</span>}
            </button>
          </div>
        ) : (
          /* Standard Sidebar Header */
          <div className="flex items-center justify-between w-full">
            <Brand collapsed={sidebarCollapsed} />
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/10 text-foreground/70 hover:text-foreground transition shrink-0"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        )}

        <nav className="mt-4 flex-1 space-y-1.5 w-full overflow-y-auto pr-1">
          {isSuperDreamActive ? (
            /* Super Dream Navigation Items with all 10 sections */
            <>
              {superDreamNav.map((item, idx) => {
                const Icon = item.icon;
                const isActive =
                  pathname.startsWith("/super-dream") &&
                  activeTab === item.tab &&
                  (item.sectionId === undefined || activeSectionId === item.sectionId);

                return (
                  <React.Fragment key={item.id}>
                    <button
                      onClick={() => handleSuperDreamNavClick(item.tab, item.sectionId)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl text-sm transition-all text-left cursor-pointer",
                        sidebarCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5",
                      )}
                      style={isActive ? {
                        background: "rgba(167,139,250,0.18)",
                        border: "1px solid rgba(167,139,250,0.30)",
                        color: "var(--primary)",
                        fontWeight: 600,
                      } : {
                        color: "var(--muted-foreground)",
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      <Icon className="h-4 w-4 shrink-0" style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  </React.Fragment>
                );
              })}
            </>
          ) : (
            /* Standard Navigation + Clean Super Dream Entrance */
            <>
              <button
                onClick={handleEnterSuperDream}
                title={sidebarCollapsed ? "Super Dream Workspace" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl text-xs font-semibold btn-gradient btn-gradient-hover transition-all cursor-pointer mb-3",
                  sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
                )}
              >
                <Compass className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-semibold">Super Dream Workspace</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-semibold">PRO</span>
                  </div>
                )}
              </button>

              {filteredNav.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  active={pathname.startsWith(item.to)}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </>
          )}
        </nav>

        <div className="pt-4 border-t border-white/10 w-full space-y-1">
          <button
            onClick={handleOpenTour}
            data-tour="app-tour-btn"
            title={sidebarCollapsed ? (isSuperDreamActive ? "Super Dream Tour" : "App Tour") : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl text-sm transition cursor-pointer",
              sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
              isSuperDreamActive
                ? "text-amber-300 hover:bg-amber-500/10 font-semibold"
                : "text-foreground hover:bg-white/10 hover:text-foreground"
            )}
          >
            <HelpCircle className={cn("h-4 w-4 shrink-0", isSuperDreamActive ? "text-amber-400" : "text-foreground")} />
            {!sidebarCollapsed && <span>{isSuperDreamActive ? "Super Dream Tour" : "App Tour"}</span>}
          </button>

          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl text-sm text-foreground hover:bg-white/10 hover:text-foreground transition",
              sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
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

            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
              {isSuperDreamActive ? (
                superDreamNav.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.tab &&
                    (item.sectionId === undefined || activeSectionId === item.sectionId);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSuperDreamNavClick(item.tab, item.sectionId)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all text-left cursor-pointer",
                          isActive
                            ? "bg-slate-800/90 text-sky-200 font-semibold shadow-sm border border-sky-500/30 ring-1 ring-sky-500/20"
                            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sky-300" : "text-slate-400")} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })
              ) : (
                <>
                  <button
                    onClick={handleEnterSuperDream}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2"
                  >
                    <Compass className="h-4 w-4 text-indigo-400" />
                    <span>Super Dream Workspace</span>
                  </button>

                  {filteredNav.map((item) => (
                    <NavItem
                      key={item.to}
                      item={item}
                      active={pathname === item.to}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
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
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-2xl border-b border-border px-4 lg:px-6 py-3.5 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setMobileOpen(!mobileOpen);
              } else {
                toggleSidebar();
              }
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            aria-label="Toggle sidebar"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Welcome back</p>
              <p className="text-sm font-semibold truncate text-[var(--foreground)] font-[var(--font-display)]">{user?.name ?? "Guest"}</p>
            </div>

            {/* Quick Command Palette Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
              title="Search tools or switch theme (⌘K)"
            >
              <Search className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
              <span className="font-medium">Search or jump to...</span>
              <kbd className="px-1.5 py-0.5 rounded-full text-[10px] font-[var(--font-mono)]"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>⌘K</kbd>
            </button>
          </div>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
          <Link to="/settings" className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-lg hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--accent)]/80 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <Link to="/settings" className="flex items-center gap-2">
            <div className="relative h-9 w-9 rounded-full" style={{ boxShadow: "0 0 0 2px rgba(167,139,250,0.35)" }}>
              {isCheckingAuth ? (
                <div className="h-9 w-9 rounded-full animate-pulse" style={{ background: "rgba(167,139,250,0.15)" }} />
              ) : (
                <>
                  <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)" }}>
                    {(user?.name ?? "G").charAt(0).toUpperCase()}
                  </div>
                  {user?.avatar && (
                    <img
                      src={user.avatar}
                      alt=""
                      className="absolute inset-0 h-9 w-9 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </Link>
        </header>
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

function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: {
  notifications: { _id: string; title: string; message: string; read: boolean; createdAt: string; type: string }[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[color:var(--color-destructive)] text-[10px] font-bold text-white grid place-items-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[28rem] overflow-hidden rounded-xl bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-2xl border border-white/15 shadow-2xl z-50 flex flex-col text-slate-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-[color:var(--color-primary)] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {(!notifications || notifications.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <BellOff className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {(notifications || []).map((n) => (
                  <li key={n._id}>
                    <button
                      onClick={() => {
                        if (!n.read) onMarkAsRead(n._id);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-white/10 transition flex gap-3 border-b border-white/5 last:border-0",
                        !n.read ? "bg-white/10" : "bg-transparent",
                      )}
                    >
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-[color:var(--color-primary)] shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", !n.read ? "font-semibold text-white" : "text-slate-200")}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-300 truncate mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{relativeTime(n.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-2.5">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-[color:var(--color-primary)] hover:underline block text-center"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
