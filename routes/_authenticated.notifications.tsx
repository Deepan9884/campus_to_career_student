import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/GlassCard";
import { getAccessToken } from "@/lib/api";
import { useNotificationSSE } from "@/hooks/useNotificationStream";
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Mic,
  Github,
  Target,
  Map,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Campus to Career AI" }] }),
  component: NotificationsPage,
});

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedResourceId: string | null;
  relatedResourceType: string | null;
  read: boolean;
  createdAt: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const typeIconMap: Record<string, typeof Bell> = {
  resume_analysis_complete: FileText,
  interview_complete: Mic,
  github_analysis_complete: Github,
  skill_gap_analysis_complete: Target,
  roadmap_generated: Map,
  quiz_passed: Trophy,
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setTotal((prev) => prev + 1);
  }, []);

  useNotificationSSE({ onNotification: handleNewNotification });

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${BASE_URL}/notifications?page=${p}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications);
        setTotalPages(json.data.pagination.totalPages);
        setTotal(json.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;
      await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      await fetch(`${BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <GlassCard variant="strong">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} total{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-sm text-[color:var(--color-primary)] hover:underline"
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BellOff className="h-10 w-10 mb-3 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {notifications.map((n) => {
              const Icon = typeIconMap[n.type] || Bell;
              return (
                <li key={n._id}>
                  <button
                    onClick={() => {
                      if (!n.read) markAsRead(n._id);
                    }}
                    className={cn(
                      "w-full text-left flex items-start gap-3 p-4 hover:bg-white/5 transition rounded-lg",
                      !n.read && "bg-white/[0.03]",
                    )}
                  >
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg grid place-items-center shrink-0",
                        n.read ? "bg-white/5" : "btn-gradient",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm", !n.read ? "font-semibold" : "text-muted-foreground")}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-[color:var(--color-primary)] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
