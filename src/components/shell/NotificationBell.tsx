import React, { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationBellProps {
  notifications: { _id: string; title: string; message: string; read: boolean; createdAt: string; type: string }[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationBellProps) {
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
        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-[var(--foreground)] hover:text-indigo-600 dark:hover:text-[var(--primary)] transition border border-slate-200/90 dark:border-white/10 relative cursor-pointer shadow-xs"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-[10px] font-bold text-white grid place-items-center px-1 shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[30rem] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col text-slate-900 dark:text-slate-100 transition-colors animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[22rem]">
            {(!notifications || notifications.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <BellOff className="h-6 w-6 opacity-60 text-slate-400" />
                </div>
                <p className="text-xs font-medium">No notifications yet</p>
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
                        "w-full text-left px-4 py-3 transition flex gap-3 cursor-pointer",
                        !n.read
                          ? "bg-indigo-50/50 hover:bg-indigo-50/80 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/40"
                          : "bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-slate-800/40"
                      )}
                    >
                      <span className="mt-1.5 h-2 w-2 rounded-full shrink-0 flex items-center justify-center">
                        {!n.read ? (
                          <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-2 ring-indigo-500/20" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-xs leading-snug",
                            !n.read
                              ? "font-bold text-slate-900 dark:text-white"
                              : "font-semibold text-slate-700 dark:text-slate-200"
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-50/90 dark:bg-slate-950/80">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline block text-center transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
