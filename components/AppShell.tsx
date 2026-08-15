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
  Sparkles,
  Settings,
  CheckCheck,
  BellOff,
  Linkedin,
  Trophy,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HelpCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/stores";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { StudentProductTour } from "@/components/StudentProductTour";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getBadges } from "@/lib/badges-api";
import type { BadgeId, EarnedBadge } from "@/types/badges";

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
  const [showProductTour, setShowProductTour] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cf-student-tour-done") !== "true";
    }
    return false;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cf_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

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

  const filteredNav = nav.filter((item) => {
    if (!user?.preferences?.hiddenModules) return true;
    return !user.preferences.hiddenModules.includes(item.to);
  });

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
    // When we receive a new notification, re-check badges and celebrate on newly earned ones.
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
          toast.success(`🏅 ${badgeId}`, {
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
    <div className="min-h-screen flex">
      <OnboardingWizard
        open={showOnboardingWizard ? true : undefined}
        onClose={() => setShowOnboardingWizard(false)}
        onComplete={() => {
          setShowOnboardingWizard(false);
          setShowProductTour(true);
        }}
      />
      <StudentProductTour open={showProductTour} onClose={() => setShowProductTour(false)} />
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col glass-strong m-3 mr-0 rounded-2xl p-4 sticky top-3 h-[calc(100vh-1.5rem)] transition-all duration-300 shrink-0",
          sidebarCollapsed ? "w-20 items-center px-3" : "w-64"
        )}
      >
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

        <nav className="mt-6 flex-1 space-y-1 w-full">
          {filteredNav.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              active={pathname.startsWith(item.to)}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10 w-full space-y-1">
          <button
            onClick={() => setShowProductTour(true)}
            data-tour="app-tour-btn"
            title={sidebarCollapsed ? "App Tour" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl text-sm text-foreground hover:bg-white/10 hover:text-foreground transition",
              sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"
            )}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>App Tour</span>}
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
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 glass-strong p-4 flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 flex-1 space-y-1">
              {filteredNav.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  active={pathname === item.to}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
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
        <header className="sticky top-0 z-30 glass-strong m-3 ml-3 lg:ml-3 rounded-2xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setMobileOpen(!mobileOpen);
              } else {
                toggleSidebar();
              }
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-foreground transition"
            aria-label="Toggle sidebar"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="text-sm font-semibold truncate">{user?.name ?? "Guest"}</p>
          </div>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
          <Link to="/settings" className="p-2 rounded-lg hover:bg-white/10" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <Link to="/settings" className="flex items-center gap-2">
            <div className="relative h-9 w-9 rounded-full ring-2 ring-white/20">
              {isCheckingAuth ? (
                <div className="h-9 w-9 rounded-full bg-slate-700/50 animate-pulse" />
              ) : (
                <>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-xs font-bold text-white">
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
        <main className="flex-1 p-3 lg:p-6 pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Link to="/dashboard" className="flex items-center justify-center py-1 w-full" title="Campus to Career AI">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-sm">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
        </div>
      </Link>
    );
  }

  return (
    <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden py-1">
      <img
        src="/logo-dark.png"
        alt="Campus to Career AI"
        className="h-10 md:h-12 w-auto max-w-[190px] object-contain hidden dark:block transition-all"
      />
      <img
        src="/logo-dark.png"
        alt="Campus to Career AI"
        className="h-10 md:h-12 w-auto max-w-[190px] object-contain block dark:hidden transition-all"
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
      data-tour={`nav-${item.to.replace("/", "")}`}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm transition-all",
        collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
        active
          ? "btn-gradient text-white shadow-lg font-medium"
          : "text-foreground hover:bg-white/10 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
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
