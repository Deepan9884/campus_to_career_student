import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  HelpCircle,
  Menu,
  X,
  Sun,
  Moon,
  Laptop,
  PanelLeftClose,
  PanelLeftOpen,
  AlertCircle,
} from "lucide-react";
import { getAccessToken, setAccessToken, API_BASE } from "./lib/api";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider, useTheme } from "./lib/theme-context";
import { InteractiveAppBackground } from "./components/InteractiveAppBackground";
import { getCohortAnalytics } from "./lib/admin-api";

import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { StudentsPage } from "./pages/StudentsPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { MentorSettingsPage } from "./pages/MentorSettingsPage";
import { SuperDreamManagementPage } from "./pages/SuperDreamManagementPage";
import { ExamsManagementPage } from "./pages/ExamsManagementPage";
import { AdminResultsPage } from "./pages/AdminResultsPage";
import { MentorProductTour } from "./components/MentorProductTour";
import { CommandPalette } from "./components/CommandPalette";
import { CompanyMatcherModal } from "./components/CompanyMatcherModal";
import { LiveProctoringOperations } from "./components/LiveProctoringOperations";
import { Building2, ShieldAlert, Command, Crown, FileCode, Award } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000, // 30 seconds fresh cache to avoid thrashing network on tab navigation
      gcTime: 5 * 60 * 1000, // 5 minutes in-memory cache
    },
  },
});

function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const handleCycleTheme = () => {
      if (theme === "light") setTheme("dark");
      else if (theme === "dark") setTheme("system");
      else setTheme("light");
    };

    return (
      <button
        onClick={handleCycleTheme}
        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
        title={`Theme Mode: ${theme} (Click to switch)`}
      >
        {theme === "light" && <Sun className="h-4 w-4 text-amber-500" />}
        {theme === "dark" && <Moon className="h-4 w-4 text-indigo-400" />}
        {theme === "system" && <Laptop className="h-4 w-4 text-slate-500" />}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
      <button
        onClick={() => setTheme("light")}
        className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 font-bold text-[11px] transition-all duration-200 cursor-pointer ${
          theme === "light"
            ? "bg-white text-indigo-600 shadow-xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
        title="Light Mode"
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span>Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 font-bold text-[11px] transition-all duration-200 cursor-pointer ${
          theme === "dark"
            ? "bg-slate-800 text-indigo-400 shadow-xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
        title="Dark Mode"
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
        <span>Dark</span>
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 font-bold text-[11px] transition-all duration-200 cursor-pointer ${
          theme === "system"
            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        }`}
        title="System Preference"
      >
        <Laptop className="h-3.5 w-3.5 text-slate-500" />
        <span>Auto</span>
      </button>
    </div>
  );
}

function MentorLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {
        // no-op
      }
      return next;
    });
  };

  const [showMentorTour, setShowMentorTour] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cf-mentor-tour-done") !== "true";
    }
    return false;
  });

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [companyMatcherOpen, setCompanyMatcherOpen] = useState(false);
  const [liveProctoringOpen, setLiveProctoringOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard, dataTour: "nav-overview" },
    { label: "Exams & Assessments", href: "/exams", icon: FileCode, dataTour: "nav-exams" },
    { label: "Results & Disclosures", href: "/results", icon: Award, dataTour: "nav-results" },
    { label: "Student Roster", href: "/students", icon: Users, dataTour: "nav-students" },
    { label: "Super Dream Track", href: "/super-dream", icon: Crown, dataTour: "nav-superdream" },
    { label: "Cohort Analytics", href: "/analytics", icon: BarChart3, dataTour: "nav-analytics" },
    { label: "Settings", href: "/settings", icon: Settings, dataTour: "nav-settings" },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-indigo-500 selection:text-white flex transition-colors duration-300 overflow-x-hidden">
      {/* Interactive Background */}
      <InteractiveAppBackground />

      {/* Global Command Hub & Operations Modals */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenCompanyMatcher={() => setCompanyMatcherOpen(true)}
        onOpenLiveProctoring={() => setLiveProctoringOpen(true)}
      />
      <CompanyMatcherModal
        open={companyMatcherOpen}
        onClose={() => setCompanyMatcherOpen(false)}
      />
      <LiveProctoringOperations
        open={liveProctoringOpen}
        onClose={() => setLiveProctoringOpen(false)}
      />

      {/* Left Sidebar Navigation (Expandable & Shrinkable) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col justify-between transition-all duration-300 ease-in-out border-r ${
          sidebarCollapsed ? "w-[72px] p-3" : "w-64 p-5"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} bg-white/95 dark:bg-[#0B0F19]/90 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-[4px_0_48px_rgba(0,0,0,0.4)] backdrop-blur-xl`}
      >
        <div className="space-y-4">
          {/* Brand Logo Header & Shrink / Expand Toggle */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 pt-1">
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center gap-2">
                  <img
                    src="/logo-dark.png"
                    alt="Campus to Career AI"
                    className="h-11 w-auto max-w-[145px] object-contain drop-shadow-md hidden dark:block"
                  />
                  <img
                    src="/logo.png"
                    alt="Campus to Career AI"
                    className="h-11 w-auto max-w-[145px] object-contain drop-shadow-md block dark:hidden"
                  />
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center w-full gap-3">
                <img
                  src="/logo-icon.png"
                  alt="Campus to Career"
                  className="h-8 w-8 object-contain drop-shadow-xs transition-transform hover:scale-105 cursor-pointer"
                  onClick={toggleSidebar}
                  title="Expand sidebar"
                />
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Search & Command Hub Trigger Button */}
          {!sidebarCollapsed ? (
            <button
              data-tour="command-palette-btn"
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-slate-900 transition text-xs shadow-xs cursor-pointer"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Command className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Command Hub
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700 shadow-xs">
                ⌘K
              </kbd>
            </button>
          ) : (
            <button
              data-tour="command-palette-btn"
              onClick={() => setCommandPaletteOpen(true)}
              title="Command Hub (Cmd+K)"
              className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:scale-105 hover:border-indigo-400 transition cursor-pointer shadow-xs"
            >
              <Command className="h-4 w-4" />
            </button>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  data-tour={item.dataTour}
                  onClick={() => setMobileOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full rounded-xl text-xs font-bold flex items-center transition-all duration-200 group ${
                    sidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2.5 gap-3"
                  } ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600 dark:text-indigo-400"
                    }`}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

            {/* Quick Operations Sub-Group in Sidebar */}
            {!sidebarCollapsed && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-0.5">
                <div className="flex items-center gap-2 px-3 pb-1.5 pt-0.5">
                  <span className="section-accent-line" style={{ height: "0.7em" }} />
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Placement Tools
                  </p>
                </div>
                <button
                  data-tour="company-matcher-btn"
                  onClick={() => setCompanyMatcherOpen(true)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center gap-2.5 transition text-left cursor-pointer"
                >
                  <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Company Matcher</span>
                </button>
                <button
                  data-tour="live-proctoring-btn"
                  onClick={() => setLiveProctoringOpen(true)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2.5 transition text-left cursor-pointer"
                >
                  <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Live Proctoring Radar</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* Theme Switcher */}
          <div data-tour="theme-switcher">
            {!sidebarCollapsed ? (
              <div>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 mb-1.5 px-1">
                  Theme Mode
                </p>
                <ThemeSwitcher compact={false} />
              </div>
            ) : (
              <ThemeSwitcher compact={true} />
            )}
          </div>

          {/* Mentor Tour Button */}
          <button
            data-tour="mentor-tour-btn"
            onClick={() => setShowMentorTour(true)}
            title="Mentor Guide & Product Tour"
            className={`w-full rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center transition-all duration-200 group cursor-pointer ${
              sidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2 justify-between"
            }`}
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
              {!sidebarCollapsed && <span>Mentor Guide</span>}
            </span>
            {!sidebarCollapsed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-200/70 dark:bg-indigo-500/25 text-indigo-800 dark:text-indigo-200 font-extrabold border border-indigo-300/60 dark:border-indigo-500/30">
                Tour
              </span>
            )}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            title="Sign Out"
            className={`w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/[0.02] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center transition-all duration-200 group cursor-pointer ${
              sidebarCollapsed ? "p-2.5 justify-center" : "px-3.5 py-2 gap-2"
            }`}
          >
            <LogOut className="h-4 w-4 text-slate-400 group-hover:text-rose-600 shrink-0 transition-colors" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar with Hamburger Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[image:var(--glass-strong-bg)] backdrop-blur-[40px] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl btn-gradient flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <span className="font-extrabold text-[var(--foreground)] text-sm">Mentor Portal</span>
            <span className="block text-[10px] text-[var(--primary)] font-semibold">
              Campus to Career AI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--glass-input-bg)]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <MentorProductTour open={showMentorTour} onClose={() => setShowMentorTour(false)} />

      {/* Main Content Area (Generous breathing gap between sidebar navbar and main section) */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out min-w-0 py-8 px-6 sm:px-10 mt-14 lg:mt-0 relative ${
          sidebarCollapsed ? "lg:pl-[108px]" : "lg:pl-[296px]"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-7">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/exams" element={<ExamsManagementPage />} />
            <Route path="/results" element={<AdminResultsPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:studentId" element={<StudentDetailPage />} />
            <Route path="/super-dream" element={<SuperDreamManagementPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<MentorSettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Mentor Admin App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)] text-[var(--foreground)] font-sans">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[var(--popover)] border border-[rgb(var(--destructive-rgb)/30%)] text-center space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-xl bg-[rgb(var(--destructive-rgb)/15%)] text-[var(--destructive)] mx-auto flex items-center justify-center border border-[rgb(var(--destructive-rgb)/30%)]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Something Went Wrong</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {this.state.error?.message || "An unexpected error occurred while rendering the interface."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/students";
              }}
              className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2 shadow-lg"
            >
              Return to Student Roster
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <Toaster position="top-right" theme={resolvedTheme} richColors />
      <AppErrorBoundary>
        <MentorLayout onLogout={onLogout} />
      </AppErrorBoundary>
    </>
  );
}

export function App() {
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [isVerifying, setIsVerifying] = useState<boolean>(() => Boolean(getAccessToken()));

  // Listen for custom auth change events from api.ts
  React.useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ token: string | null }>;
      setToken(customEvent.detail?.token || null);
    };

    window.addEventListener("cf:admin:auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("cf:admin:auth-change", handleAuthChange);
    };
  }, []);

  // Verify stored token on initial load
  React.useEffect(() => {
    const currentToken = getAccessToken();
    if (!currentToken) {
      setIsVerifying(false);
      return;
    }

    let isMounted = true;
    fetch(`${API_BASE}/admin/profile`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid session");
        }
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          if (json.success === false) {
            setAccessToken(null);
            setToken(null);
          }
          setIsVerifying(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccessToken(null);
          setToken(null);
          setIsVerifying(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    setAccessToken(null);
    setToken(null);
    queryClient.clear();
  };

  const handleLoginSuccess = () => {
    setToken(getAccessToken());
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 rounded-full border-4 border-[rgb(var(--primary-rgb)/20%)] border-t-[var(--primary)] animate-spin" />
        <p className="text-xs font-bold text-[var(--muted-foreground)]">Verifying session...</p>
      </div>
    );
  }

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "1000000000000-demo1234567890abcdef.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            {token ? (
              <AuthenticatedApp onLogout={handleLogout} />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )}
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
export default App;
