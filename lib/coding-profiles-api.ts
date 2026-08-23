import { api } from "@/lib/api";

export type CodingPlatform = "leetcode" | "codechef" | "hackerrank" | "gfg";

export type CodingProfileResponse = {
    profile: {
        _id: string;
        userId: string;
        platform: CodingPlatform;
        profileUrl: string;
        username: string;
        cachedStats: any;
        lastFetchedAt: string | null;
    };
    fresh?: boolean;
    cached?: boolean;
    error?: string;
};

export async function upsertCodingProfile(payload: {
    platform: CodingPlatform;
    profileUrl: string;
}): Promise<{ profile: any; cached: boolean }> {
    const res = await api.post<{ profile: any; cached: boolean }>("/coding/coding-profiles", payload);
    return res;
}

export async function refreshCodingProfile(platform: CodingPlatform, payload?: { profileUrl?: string }) {
    const res = await api.post<{ profile: any; fresh: boolean; error?: string; cached: boolean }>(
        `/coding/coding-profiles/${platform}/refresh`,
        payload || {},
    );
    return res;
}

export async function getCodingProfile(platform: CodingPlatform, force?: boolean) {
    const res = await api.get<CodingProfileResponse>(
        `/coding/coding-profiles/${platform}${force ? "?force=true" : ""}`,
    );
    return res;
}

export async function getProblemRecommendations(platform: CodingPlatform) {
    const res = await api.get<{ recommendations: any[] }>(
        `/coding/coding-profiles/${platform}/recommendations`,
    );
    return res;
}

export async function getAllCodingProfiles() {
    const res = await api.get<any[]>("/coding/coding-profiles/all");
    return res;
}
