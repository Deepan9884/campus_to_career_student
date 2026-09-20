import { api } from "@/lib/api";
import type { BadgesResponse } from "@/types/badges";

export async function getBadges(): Promise<BadgesResponse> {
  return api.get<BadgesResponse>("/badges");
}
