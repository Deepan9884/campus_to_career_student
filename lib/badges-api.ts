import type { BadgesResponse } from "@/types/badges";
import { getAccessToken } from "@/lib/api";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function getBadges(): Promise<BadgesResponse> {
    const token = getAccessToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${BASE_URL}/badges`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to fetch badges (${res.status})`);
    }

    return res.json() as Promise<BadgesResponse>;
}
