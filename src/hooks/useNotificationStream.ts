import { useEffect, useRef, useCallback, useState } from "react";
import { getAccessToken, tryRefresh } from "@/lib/api";

export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  relatedResourceId: string | null;
  relatedResourceType: string | null;
  read: boolean;
  createdAt: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Maximum reconnect attempts before we stop trying
const MAX_RECONNECT_ATTEMPTS = 10;
// Delay between retries (doubles each attempt, capped at 60s)
const BASE_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 60_000;

let esInstance: EventSource | null = null;
let callbacks: ((notification: Notification) => void)[] = [];

function getCallbacks(): ((notification: Notification) => void)[] {
  return callbacks;
}

function notifyCallbacks(notification: Notification) {
  for (const cb of getCallbacks()) {
    cb(notification);
  }
}

function closeEventSource() {
  if (esInstance) {
    esInstance.close();
    esInstance = null;
  }
}

/**
 * Try to obtain a fresh access token via silent refresh.
 * Only attempts refresh if an active session is indicated in sessionStorage.
 */
async function ensureValidToken(): Promise<string | null> {
  let token = getAccessToken();
  if (token) return token;

  // If no active session exists, do NOT spam /api/auth/refresh
  if (typeof window !== "undefined" && !sessionStorage.getItem("cf_session_active")) {
    return null;
  }

  try {
    const refreshed = await tryRefresh();
    if (refreshed) return refreshed;
  } catch {
    // Refresh failed or unauthorized
  }
  return null;
}

export function useNotificationSSE({
  onNotification,
}: {
  onNotification: (notification: Notification) => void;
}) {
  const [, rerender] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptRef = useRef(0);
  const onNotificationRef = useRef(onNotification);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  });

  const handleNotificationEvent = useCallback((notification: Notification) => {
    onNotificationRef.current(notification);
  }, []);

  const connectSSE = useCallback(async () => {
    if (isUnmountedRef.current) return;

    // Get or refresh the access token
    const token = await ensureValidToken();
    if (!token) {
      // User is not authenticated — stop SSE connection attempts without retry loops
      return;
    }

    closeEventSource();

    // Get a short-lived SSE ticket to avoid sending access token in URL query strings
    let streamParam = token;
    try {
      const ticketRes = await fetch(`${BASE_URL}/notifications/ticket`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (ticketRes.status === 401) {
        // Token expired between ensureValidToken and ticket fetch — try one more refresh if session is active
        if (typeof window !== "undefined" && sessionStorage.getItem("cf_session_active")) {
          try {
            const freshToken = await tryRefresh();
            if (!freshToken) return;
            const retryRes = await fetch(`${BASE_URL}/notifications/ticket`, {
              method: "POST",
              headers: { Authorization: `Bearer ${freshToken}` },
            });
            if (retryRes.ok) {
              const retryJson = await retryRes.json();
              streamParam = retryJson.data?.ticket || freshToken;
            } else {
              streamParam = freshToken;
            }
          } catch {
            return;
          }
        } else {
          return;
        }
      } else if (ticketRes.ok) {
        const ticketJson = await ticketRes.json();
        if (ticketJson.data?.ticket) {
          streamParam = ticketJson.data.ticket;
        }
      }
    } catch {
      // Network error (Render cold-start, etc.) — fall back to access token
    }

    if (isUnmountedRef.current) return;

    const es = new EventSource(
      `${BASE_URL}/notifications/stream?token=${encodeURIComponent(streamParam)}`,
    );
    esInstance = es;

    es.addEventListener("notification", (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        notifyCallbacks(notification);
      } catch {
        // silent
      }
    });

    es.onopen = () => {
      // Successful connection — reset attempt counter
      reconnectAttemptRef.current = 0;
    };

    es.onerror = async () => {
      es.close();
      esInstance = null;

      if (isUnmountedRef.current) return;

      // If user session is no longer active, stop attempting reconnects
      if (typeof window !== "undefined" && !sessionStorage.getItem("cf_session_active")) {
        return;
      }

      const attempt = reconnectAttemptRef.current;
      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        // Stop reconnecting after max attempts instead of resetting to 0 and looping forever
        return;
      }

      const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
      reconnectAttemptRef.current = attempt + 1;
      reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
    };
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;
    callbacks.push(handleNotificationEvent);
    rerender((n) => n + 1);

    return () => {
      isUnmountedRef.current = true;
      callbacks = callbacks.filter((cb) => cb !== handleNotificationEvent);
      if (callbacks.length === 0) {
        closeEventSource();
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectAttemptRef.current = 0;
    };
  }, [handleNotificationEvent]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connectSSE();
    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      closeEventSource();
      reconnectAttemptRef.current = 0;
    };
  }, [connectSSE]);
}

export function useNotificationStream() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  useNotificationSSE({ onNotification: handleNewNotification });

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setUnreadCount(json.data.count);
    } catch {
      // silent
    }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${BASE_URL}/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const list: Notification[] = json.data?.notifications || (Array.isArray(json.data) ? json.data : []);
        setNotifications(list);
        setUnreadCount(list.filter((n: Notification) => !n?.read).length);
      }
    } catch {
      // silent
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const token = getAccessToken();
      if (!token) return;
      await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => (prev || []).map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      await fetch(`${BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => (prev || []).map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchRecentNotifications();
  }, [fetchUnreadCount, fetchRecentNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchRecentNotifications,
  };
}
