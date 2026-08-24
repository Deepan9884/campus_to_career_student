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
 * Retries up to 3 times with a short delay to handle Render cold-starts
 * (Render free tier can take 10-50s to wake up after inactivity).
 */
async function ensureValidToken(): Promise<string | null> {
  let token = getAccessToken();
  if (token) return token;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await tryRefresh();
      token = getAccessToken();
      if (token) return token;
    } catch {
      // wait a bit before retrying (cold-start forgiveness)
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
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

    // Get or refresh the access token (handles Render cold-start delays)
    const token = await ensureValidToken();
    if (!token) {
      // Couldn't get a token after retries — schedule a retry with backoff
      const attempt = reconnectAttemptRef.current;
      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptRef.current = 0;
        return;
      }
      const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
      reconnectAttemptRef.current = attempt + 1;
      reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
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
        // Token expired between ensureValidToken and ticket fetch — try one more refresh
        try {
          await tryRefresh();
          const freshToken = getAccessToken();
          if (!freshToken) throw new Error("No token after refresh");
          const retryRes = await fetch(`${BASE_URL}/notifications/ticket`, {
            method: "POST",
            headers: { Authorization: `Bearer ${freshToken}` },
          });
          if (retryRes.ok) {
            const retryJson = await retryRes.json();
            streamParam = retryJson.data?.ticket || freshToken;
          } else {
            // Ticket still failing — use fresh token directly as stream param
            streamParam = freshToken;
          }
        } catch {
          // Both refresh + retry failed — schedule backoff reconnect
          const attempt = reconnectAttemptRef.current;
          if (attempt < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
            reconnectAttemptRef.current = attempt + 1;
            reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
          }
          return;
        }
      } else if (ticketRes.ok) {
        const ticketJson = await ticketRes.json();
        if (ticketJson.data?.ticket) {
          streamParam = ticketJson.data.ticket;
        }
      }
      // If ticket endpoint is down (network error), we still fall back to the access token
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

      // Before scheduling a reconnect, attempt a token refresh so we don't
      // hammer the server with repeated 401s if the access token expired.
      try {
        await tryRefresh();
      } catch {
        // Refresh failed — could be Render cold-start or session over
        // Don't stop the loop — schedule a longer retry to let Render wake up
      }

      if (isUnmountedRef.current) return;

      const attempt = reconnectAttemptRef.current;
      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        // Too many failures — reset and try again from scratch after a long delay
        reconnectAttemptRef.current = 0;
        reconnectTimeoutRef.current = setTimeout(connectSSE, 30_000);
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
