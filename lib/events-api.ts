import { api } from "./api";
import type {
  Event,
  EventPagination,
  CreateEventPayload,
  UpdateEventPayload,
  EventStats,
  EventAnalytics,
  EventPortfolio,
  EventBadge,
} from "@/types/event";

export async function getUserEvents(
  page = 1,
  limit = 10
): Promise<EventPagination> {
  return api.get<EventPagination>(`/events?page=${page}&limit=${limit}`);
}

export async function getEventById(id: string): Promise<Event> {
  return api.get<Event>(`/events/${id}`);
}

export async function createEvent(payload: CreateEventPayload): Promise<Event> {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "certificate" && value instanceof File) {
      formData.append("certificate", value);
    } else if (key === "techStack" || key === "teamMembers") {
      formData.append(key, JSON.stringify(value));
    } else if (key === "reflection") {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return api.post<Event>("/events", formData);
}

export async function updateEvent(
  id: string,
  payload: UpdateEventPayload
): Promise<Event> {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "certificate" && value instanceof File) {
      formData.append("certificate", value);
    } else if (key === "techStack" || key === "teamMembers") {
      formData.append(key, JSON.stringify(value));
    } else if (key === "reflection") {
      formData.append(key, JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return api.patch<Event>(`/events/${id}`, formData);
}

export async function deleteEvent(id: string): Promise<void> {
  return api.delete<void>(`/events/${id}`);
}

export async function getEventStats(): Promise<EventStats> {
  return api.get<EventStats>("/events/stats");
}

export async function getEventAnalytics(): Promise<EventAnalytics> {
  return api.get<EventAnalytics>("/events/analytics");
}

export async function getEventBadges(): Promise<EventBadge[]> {
  return api.get<EventBadge[]>("/events/badges");
}

export async function getEventPortfolio(userId?: string): Promise<EventPortfolio> {
  const url = userId ? `/events/portfolio/${userId}` : "/events/portfolio";
  return api.get<EventPortfolio>(url);
}

export async function generateEventDescription(params: {
  eventType: string;
  projectTitle?: string;
  problemStatement?: string;
  techStack?: string[];
  result?: string;
}): Promise<{ description: string; reflection: { whatILearned: string; whatIdDoDifferently: string; keyTakeaways: string[] } }> {
  return api.post<{ description: string; reflection: { whatILearned: string; whatIdDoDifferently: string; keyTakeaways: string[] } }>("/events/generate-description", params);
}

export async function predictSkillGaps(eventId: string): Promise<{
  predictedSkills: string[];
  confidence: number;
}> {
  return api.post<{ predictedSkills: string[]; confidence: number }>(`/events/${eventId}/predict-gaps`);
}

export function getCertificateUrl(certificateUrl: string): string {
  if (!certificateUrl) return "";
  if (certificateUrl.startsWith("http://") || certificateUrl.startsWith("https://")) {
    return certificateUrl;
  }
  const base = import.meta.env.VITE_API_URL || "";
  const cleanBase = base.replace(/\/api$/, "");
  const cleanPath = certificateUrl.startsWith("/") ? certificateUrl : `/${certificateUrl}`;
  return `${cleanBase}${cleanPath}`;
}

export function formatEventDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.toDateString() === end.toDateString()) {
    return formatEventDate(startDate);
  }

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`;
  } else if (sameYear) {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  } else {
    return `${formatEventDate(startDate)} - ${formatEventDate(endDate)}`;
  }
}

export function getEventDurationDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateWinRate(events: Event[]): number {
  if (!events || events.length === 0) return 0;
  const wins = events.filter((e) => e.result === "winner" || e.result === "runner-up").length;
  return Math.round((wins / events.length) * 100);
}

export function getUniqueTechStack(events: Event[]): string[] {
  if (!events) return [];
  const techSet = new Set<string>();
  events.forEach((e) => (e.techStack || []).forEach((t) => techSet.add(t.toLowerCase())));
  return Array.from(techSet).sort();
}

export function getEventsByType(events: Event[]): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!events) return counts;
  events.forEach((e) => {
    counts[e.eventType] = (counts[e.eventType] || 0) + 1;
  });
  return counts;
}

export function getEventsByLevel(events: Event[]): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!events) return counts;
  events.forEach((e) => {
    counts[e.level] = (counts[e.level] || 0) + 1;
  });
  return counts;
}

export function getEventsByResult(events: Event[]): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!events) return counts;
  events.forEach((e) => {
    counts[e.result] = (counts[e.result] || 0) + 1;
  });
  return counts;
}

export function downloadICS(event: Event) {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const start = new Date(event.startDate);
  // Default to 1 hour event or end date if provided
  const end = new Date(event.endDate || start.getTime() + 60 * 60 * 1000);
  
  // Need to adjust end date to include the full day if it's an all-day event, but standard format works too
  const icsData = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CareerForge AI//Events Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event._id || Date.now()}@careerforge.ai`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART;VALUE=DATE:${start.toISOString().split("T")[0].replace(/-/g, "")}`,
    `DTEND;VALUE=DATE:${new Date(end.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0].replace(/-/g, "")}`, // All-day events need +1 day end
    `SUMMARY:${event.eventName}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${event.mode === "online" ? "Online" : event.mode}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.eventName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}