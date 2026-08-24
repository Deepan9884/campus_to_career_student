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

export function useNotificationSSE({
  onNotification,
}: {
  onNotification: (notification: Notification) => void;
}) {
  const [, rerender] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptRef = useRef(0);
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  });

  const handleNotificationEvent = useCallback((notification: Notification) => {
    onNotificationRef.current(notification);
  }, []);

  const connectSSE = useCallback(async () => {
    // Ensure we have a valid access token before attempting the ticket fetch.
    // If the in-memory token is missing (e.g. page reload) try a silent refresh first.
    let token = getAccessToken();
    if (!token) {
      try {
        await tryRefresh();
        token = getAccessToken();
      } catch {
        // Refresh failed — user is not authenticated; stop the reconnect loop.
        reconnectAttemptRef.current = 0;
        return;
      }
      if (!token) return;
    }

    closeEventSource();

    let streamParam = token;
    try {
      const ticketRes = await fetch(`${BASE_URL}/notifications/ticket`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (ticketRes.status === 401) {
        // Access token was expired — attempt a single silent refresh and retry.
        try {
          await tryRefresh();
          const freshToken = getAccessToken();
          if (!freshToken) return;
          token = freshToken;
          const retryRes = await fetch(`${BASE_URL}/notifications/ticket`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (retryRes.ok) {
            const retryJson = await retryRes.json();
            if (retryJson.data?.ticket) {
              streamParam = retryJson.data.ticket;
            } else {
              streamParam = token;
            }
          } else {
            // Still failing after refresh — stop reconnect loop; session truly invalid.
            reconnectAttemptRef.current = 0;
            return;
          }
        } catch {
          reconnectAttemptRef.current = 0;
          return;
        }
      } else if (ticketRes.ok) {
        const ticketJson = await ticketRes.json();
        if (ticketJson.data?.ticket) {
          streamParam = ticketJson.data.ticket;
        }
      }
    } catch {
      // Network error — fall back to access token; SSE will reconnect normally.
    }

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

    es.onerror = async () => {
      es.close();
      esInstance = null;

      // Before scheduling a reconnect, attempt a token refresh so we don't
      // hammer the server with repeated 401s if the access token expired.
      try {
        await tryRefresh();
      } catch {
        // Refresh failed — user session is over; stop reconnect loop.
        reconnectAttemptRef.current = 0;
        return;
      }

      if (!getAccessToken()) {
        reconnectAttemptRef.current = 0;
        return;
      }

      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(1000 * 2 ** attempt, 30000);
      reconnectAttemptRef.current = attempt + 1;
      reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
    };
  }, []);

  useEffect(() => {
    callbacks.push(handleNotificationEvent);
    rerender((n) => n + 1);

    return () => {
      callbacks = callbacks.filter((cb) => cb !== handleNotificationEvent);
      if (callbacks.length === 0) {
        closeEventSource();
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectAttemptRef.current = 0;
    };
  }, [handleNotificationEvent]);

  useEffect(() => {
    connectSSE();
    return () => {
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
