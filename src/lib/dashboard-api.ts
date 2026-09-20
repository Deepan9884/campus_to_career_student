import { api } from "@/lib/api";
import type { DashboardResponse } from "@/types/dashboard";

export async function getDashboardStats(): Promise<DashboardResponse> {
  return api.get<DashboardResponse>("/dashboard/stats");
}
