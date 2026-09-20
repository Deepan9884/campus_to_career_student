import { api } from "@/lib/api";
import type { PaginatedActivityResponse, ActivityApiParams } from "@/types/activity";

export async function getActivity(
  params: ActivityApiParams = {}
): Promise<PaginatedActivityResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.module) searchParams.set("module", params.module);

  const query = searchParams.toString();
  return api.get<PaginatedActivityResponse>(`/activity${query ? `?${query}` : ""}`);
}