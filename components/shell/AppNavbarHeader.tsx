import React from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Search, Sun, Moon, Sparkles, Settings, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/shell/NotificationBell";

export interface AppNavbarHeaderProps {
  user: any;
  isCheckingAuth: boolean;
  isLightMode: boolean;
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  onToggleMobileOpen: () => void;
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
  onToggleTheme: () => void;
  onOpenAmbientCustomizer: () => void;
  onLogout: () => void;
  notifications: any[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function AppNavbarHeader({
  user,
  isCheckingAuth,
  isLightMode,
  sidebarCollapsed,
  mobileOpen,
  onToggleMobileOpen,
  onToggleSidebar,
  onOpenCommandPalette,
  onToggleTheme,
  onOpenAmbientCustomizer,
  onLogout,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: AppNavbarHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-2xl border-b border-border px-4 lg:px-6 py-3.5 flex items-center gap-3 shadow-xs">
      <button
        onClick={() => {
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            onToggleMobileOpen();
          } else {
            onToggleSidebar();
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
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-slate-600 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-[var(--foreground)] transition cursor-pointer bg-slate-100/90 dark:bg-white/6 border border-slate-200/90 dark:border-white/12"
          title="Search tools or switch theme (⌘K)"
        >
          <Search className="h-3.5 w-3.5 text-indigo-500" />
          <span className="font-medium">Search or jump to...</span>
          <kbd className="px-1.5 py-0.5 rounded-full text-[10px] font-[var(--font-mono)] bg-slate-200/80 dark:bg-white/8 border border-slate-300 dark:border-white/12">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 1-Click Quick Light/Dark Mode Switcher */}
      <button
        onClick={onToggleTheme}
        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-foreground hover:text-amber-500 dark:hover:text-amber-400 transition border border-slate-200/90 dark:border-white/10 cursor-pointer shadow-xs"
        title={isLightMode ? "Switch to Dark Mode (🌙)" : "Switch to Light Mode (☀️)"}
        aria-label="Toggle theme mode"
      >
        {isLightMode ? (
          <Sun className="h-4.5 w-4.5 text-amber-500 hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-indigo-400 hover:-rotate-12 transition-transform" />
        )}
      </button>

      <NotificationBell
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
      />
      <button
        onClick={onOpenAmbientCustomizer}
        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-[var(--foreground)] hover:text-indigo-600 dark:hover:text-[var(--primary)] transition border border-slate-200/90 dark:border-white/10 relative group cursor-pointer shadow-xs"
        title="Atmospheric Lighting & Stars Studio (Customize background)"
        aria-label="Customize background lights & stars"
      >
        <Sparkles className="h-4.5 w-4.5 text-indigo-500 group-hover:rotate-12 transition-transform" />
      </button>
      <Link to="/settings" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-[var(--muted-foreground)] hover:text-slate-900 dark:hover:text-[var(--foreground)] transition border border-slate-200/90 dark:border-white/10 shadow-xs" aria-label="Settings">
        <Settings className="h-4.5 w-4.5" />
      </Link>
      <button
        onClick={onLogout}
        title="Sign out"
        aria-label="Sign out"
        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-[var(--muted-foreground)] dark:hover:text-[var(--accent)] transition border border-slate-200/90 dark:border-white/10 shadow-xs"
      >
        <LogOut className="h-4.5 w-4.5" />
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
  );
}
