import { api } from "@/lib/api";
import type { AnalyticsResponse } from "@/types/analytics";

export async function getAnalyticsOverview(): Promise<AnalyticsResponse> {
  return api.get<AnalyticsResponse>("/analytics/overview");
}

export interface WeeklyReportResponse {
  summary: string;
  recommendations: string[];
}

export async function getWeeklyReport(): Promise<WeeklyReportResponse> {
  return api.get<WeeklyReportResponse>("/analytics/weekly-report");
}
