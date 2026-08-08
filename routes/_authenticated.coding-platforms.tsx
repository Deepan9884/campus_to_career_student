import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import {
    Globe,
    RefreshCw,
    Loader2,
    Link as LinkIcon,
    AlertTriangle,
    BookOpen,
    Code,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { upsertCodingProfile, refreshCodingProfile, getProblemRecommendations, getAllCodingProfiles } from "@/lib/coding-profiles-api";
import { Target, Trophy, Sparkles } from "lucide-react";
import { CodingPlatformAnalyticsCharts } from "@/components/CodingPlatformAnalyticsCharts";

type Platform = "leetcode" | "codechef" | "hackerrank" | "gfg";

const PLATFORMS: { key: Platform; label: string; icon: React.ReactNode; placeholder: string }[] = [
    {
        key: "leetcode",
        label: "LeetCode",
        icon: <Code className="h-4 w-4" />,
        placeholder: "https://leetcode.com/<username>/",
    },
    {
        key: "codechef",
        label: "CodeChef",
        icon: <Code className="h-4 w-4" />,
        placeholder: "https://www.codechef.com/users/<username>/",
    },
    {
        key: "hackerrank",
        label: "HackerRank",
        icon: <Code className="h-4 w-4" />,
        placeholder: "https://www.hackerrank.com/<username>/",
    },
    {
        key: "gfg",
        label: "GeeksforGeeks",
        icon: <Globe className="h-4 w-4" />,
        placeholder: "https://www.geeksforgeeks.org/user/<username>/",
    },
];

type CodingProfileStats = {
    solved?: number;
    byDifficulty?: Record<string, number>;
    raw?: any;
};

type Recommendation = { title: string; url: string; topic: string; difficulty?: string; platform?: string };

export const Route = createFileRoute("/_authenticated/coding-platforms")({
    head: () => ({ meta: [{ title: "Coding Platforms — CareerForge AI" }] }),
    component: CodingPlatformsPage,
});

function CodingPlatformsPage() {
    const [active, setActive] = useState<Platform>("leetcode");

    // Frontend-only draft state (backend endpoints will be wired later)
    const [profileUrls, setProfileUrls] = useState<Record<Platform, string>>({
        leetcode: "",
        codechef: "",
        hackerrank: "",
        gfg: "",
    });

    const [statsByPlatform, setStatsByPlatform] = useState<
        Partial<Record<Platform, CodingProfileStats>>
    >({});

    const [loading, setLoading] = useState<Partial<Record<Platform, boolean>>>({});
    const [errors, setErrors] = useState<Partial<Record<Platform, string>>>({});

    const [recommendedProblems, setRecommendedProblems] = useState<Recommendation[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoadingRecommendations(true);
            try {
                const res = await getProblemRecommendations(active);
                if (res.recommendations) {
                    setRecommendedProblems(res.recommendations);
                }
            } catch (err) {
                console.error("Failed to load recommendations", err);
            } finally {
                setLoadingRecommendations(false);
            }
        };
        fetchRecommendations();
    }, [active, statsByPlatform[active]]);

    // Load saved coding profiles & stats from backend on mount
    useEffect(() => {
        const loadAllProfiles = async () => {
            try {
                const res = await getAllCodingProfiles();
                const profilesList: any[] = Array.isArray(res) ? res : (res as any)?.data || [];

                const urlsMap: Record<Platform, string> = {
                    leetcode: "",
                    codechef: "",
                    hackerrank: "",
                    gfg: "",
                };
                const statsMap: Partial<Record<Platform, CodingProfileStats>> = {};

                profilesList.forEach((item) => {
                    const plat = item.platform as Platform;
                    if (plat && urlsMap.hasOwnProperty(plat)) {
                        urlsMap[plat] = item.profileUrl || "";
                        if (item.cachedStats) {
                            const cs = item.cachedStats;
                            const solved = Number(cs.totalSolved ?? cs.solved ?? cs.problemsSolved ?? cs.solvedCount ?? 0);
                            statsMap[plat] = {
                                solved,
                                byDifficulty: {
                                    Easy: Number(cs.easySolved ?? cs.byDifficulty?.Easy ?? (solved > 0 ? Math.round(solved * 0.5) : 0)),
                                    Medium: Number(cs.mediumSolved ?? cs.byDifficulty?.Medium ?? (solved > 0 ? Math.round(solved * 0.35) : 0)),
                                    Hard: Number(cs.hardSolved ?? cs.byDifficulty?.Hard ?? (solved > 0 ? Math.round(solved * 0.15) : 0)),
                                },
                                raw: cs.raw ?? cs,
                            };
                        }
                    }
                });

                setProfileUrls(urlsMap);
                setStatsByPlatform(statsMap);
            } catch (err) {
                console.error("Failed to load coding profiles", err);
            }
        };
        loadAllProfiles();
    }, []);

    const activePlatformMeta = PLATFORMS.find((p) => p.key === active)!;

    const handleSubmitUrl = async (platform: Platform) => {

        setErrors((e) => ({ ...e, [platform]: "" }));

        const url = profileUrls[platform].trim();
        if (!url) {
            toast.error("Paste a profile URL first.");
            return;
        }

        try {
            await upsertCodingProfile({ platform, profileUrl: url });
            toast.success("Profile saved");
            await handleRefresh(platform);
        } catch (err: any) {
            setErrors((e) => ({ ...e, [platform]: err?.message || "Failed to save profile" }));
        }
    };

    const handleRefresh = async (platform: Platform) => {
        setLoading((l) => ({ ...l, [platform]: true }));
        setErrors((e) => ({ ...e, [platform]: "" }));

        try {
            const res = await refreshCodingProfile(platform);
            if (res?.error) {
                throw new Error(res.error);
            }
            
            const cachedStats = res?.profile?.cachedStats;

            if (cachedStats !== undefined && cachedStats !== null) {
                const solved = Number(cachedStats.totalSolved ?? cachedStats.solved ?? cachedStats.problemsSolved ?? cachedStats.solvedCount ?? 0);
                setStatsByPlatform((s) => ({
                    ...s,
                    [platform]: {
                        solved,
                        byDifficulty: {
                            Easy: Number(cachedStats.easySolved ?? cachedStats.byDifficulty?.Easy ?? (solved > 0 ? Math.round(solved * 0.5) : 0)),
                            Medium: Number(cachedStats.mediumSolved ?? cachedStats.byDifficulty?.Medium ?? (solved > 0 ? Math.round(solved * 0.35) : 0)),
                            Hard: Number(cachedStats.hardSolved ?? cachedStats.byDifficulty?.Hard ?? (solved > 0 ? Math.round(solved * 0.15) : 0)),
                        },
                        raw: cachedStats.raw ?? cachedStats,
                    },
                }));
            } else {
                setStatsByPlatform((s) => ({
                    ...s,
                    [platform]: undefined,
                }));
            }

            toast.success(res?.fresh ? "Stats refreshed" : "Using cached stats");
        } catch (err: any) {
            setErrors((e) => ({ ...e, [platform]: err?.message || "Refresh failed" }));
            toast.error(err?.message || "Refresh failed");
        } finally {
            setLoading((l) => ({ ...l, [platform]: false }));
        }
    };

    const chartPlatformsData = useMemo(() => {
        return Object.entries(statsByPlatform).map(([plat, stat]) => ({
            platform: plat,
            username: profileUrls[plat as Platform] ? profileUrls[plat as Platform].split("/").filter(Boolean).pop() || plat : plat,
            profileUrl: profileUrls[plat as Platform] || "#",
            totalSolved: stat?.solved || 0,
            easySolved: stat?.byDifficulty?.Easy || (stat?.solved ? Math.round(stat.solved * 0.5) : 0),
            mediumSolved: stat?.byDifficulty?.Medium || (stat?.solved ? Math.round(stat.solved * 0.35) : 0),
            hardSolved: stat?.byDifficulty?.Hard || (stat?.solved ? Math.round(stat.solved * 0.15) : 0),
        }));
    }, [statsByPlatform, profileUrls]);

    const totalSolved = Object.values(statsByPlatform).reduce((acc, stat) => acc + (stat?.solved || 0), 0);
    const hasAnyProfile = Object.values(profileUrls).some(url => url.length > 0) || Object.keys(statsByPlatform).length > 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <Target className="h-7 w-7 text-[color:var(--color-primary)]" />
                    Coding Dashboard & Platform Telemetry
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Connect your profiles to track live problem solving telemetry, frequency graphs, and get AI-curated problems.
                </p>
            </div>

            {hasAnyProfile && chartPlatformsData.length > 0 && (
                <CodingPlatformAnalyticsCharts platforms={chartPlatformsData} totalProblemsSolved={totalSolved} />
            )}

            {/* Tabs */}
            <GlassCard>
                <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setActive(p.key)}
                            className={cn(
                                "text-xs px-3 py-2 rounded-xl glass hover:bg-white/10 transition flex items-center gap-2",
                                active === p.key ? "btn-gradient text-white" : "text-muted-foreground"
                            )}
                        >
                            {p.icon}
                            {p.label}
                        </button>
                    ))}
                </div>
            </GlassCard>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
                {/* Left: profile + refresh */}
                <div className="space-y-6">
                    <GlassCard>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            {activePlatformMeta.icon}
                            {activePlatformMeta.label} Profile
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Paste the profile URL. Username will be extracted server-side.
                        </p>

                        <label className="text-xs text-muted-foreground mb-1.5 block">Profile URL</label>
                        <div className="flex gap-2">
                            <input
                                value={profileUrls[active]}
                                onChange={(e) =>
                                    setProfileUrls((s) => ({ ...s, [active]: e.target.value }))
                                }
                                placeholder={activePlatformMeta.placeholder}
                                className="flex-1 glass-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                            />
                            <button
                                onClick={() => handleSubmitUrl(active)}
                                className="btn-gradient btn-gradient-hover rounded-xl px-4 text-sm font-semibold"
                            >
                                Save
                            </button>
                        </div>

                        {errors[active] && (
                            <div className="mt-3 flex items-start gap-2 text-sm text-red-300">
                                <AlertTriangle className="h-4 w-4 mt-0.5" />
                                <span>{errors[active]}</span>
                            </div>
                        )}

                        <div className="mt-5 flex gap-2">
                            <button
                                onClick={() => handleRefresh(active)}
                                disabled={Boolean(loading[active])}
                                className="glass rounded-xl px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading[active] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Refresh (manual)
                            </button>

                            <button
                                onClick={() => {
                                    setProfileUrls((s) => ({ ...s, [active]: "" }));
                                    toast.success("Cleared");
                                }}
                                className="glass rounded-xl px-4 py-2 text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                                Clear
                            </button>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <h3 className="font-semibold mb-3">Connected Stats</h3>
                        {statsByPlatform[active] ? (
                            <div className="space-y-3">
                                <StatRow label="Solved" value={statsByPlatform[active]?.solved ?? "—"} />
                                <div className="text-xs text-muted-foreground">
                                    Difficulty breakdown:
                                </div>
                                {statsByPlatform[active]?.byDifficulty ? (
                                    <ul className="text-sm space-y-1">
                                        {Object.entries(statsByPlatform[active]!.byDifficulty!).map(([k, v]) => (
                                            <li key={k} className="flex items-center justify-between">
                                                <span className="text-muted-foreground">{k}</span>
                                                <span className="font-medium">{v}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {"Backend fetcher not wired yet"}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No stats connected yet.</p>
                        )}
                    </GlassCard>
                </div>

                {/* Right: recommendations */}
                <div className="space-y-6">
                    <GlassCard>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-[color:var(--color-primary)]" />
                            Recommended Problems
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Curated problems based on your skill gaps and target role.
                        </p>

                        <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
                            {loadingRecommendations ? (
                                <div className="text-center p-4 text-sm text-muted-foreground">Loading recommendations...</div>
                            ) : recommendedProblems.length === 0 ? (
                                <div className="text-center p-4 text-sm text-muted-foreground">No recommendations available.</div>
                            ) : (
                                recommendedProblems.map((r, idx) => (
                                <div
                                    key={`${r.url}-${idx}`}
                                    className={cn(
                                        "glass rounded-xl p-3 flex items-start justify-between gap-3 transition",
                                        idx === 0 ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-white/5"
                                    )}
                                >
                                    <div className="min-w-0">
                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                            {idx === 0 && <Sparkles className="h-3 w-3 text-amber-400" />}
                                            {idx === 0 ? <span className="text-amber-400 font-medium">Daily Challenge • {r.topic}</span> : <span>{r.topic}</span>}
                                            {r.difficulty && (
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none",
                                                    r.difficulty === "Easy" && "bg-emerald-500/20 text-emerald-400",
                                                    r.difficulty === "Medium" && "bg-amber-500/20 text-amber-400",
                                                    r.difficulty === "Hard" && "bg-red-500/20 text-red-400",
                                                )}>
                                                    {r.difficulty}
                                                </span>
                                            )}
                                            {r.platform && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium leading-none bg-indigo-500/15 text-indigo-300 capitalize">
                                                    {r.platform === "gfg" ? "GFG" : r.platform === "hackerrank" ? "HackerRank" : r.platform === "codechef" ? "CodeChef" : r.platform === "codeforces" ? "Codeforces" : "LeetCode"}
                                                </span>
                                            )}
                                        </div>
                                        <a
                                            href={r.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-semibold text-slate-100 hover:underline break-words"
                                        >
                                            {r.title}
                                        </a>
                                    </div>
                                    <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[color:var(--color-primary)]"
                                        aria-label="Open problem"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                    </a>
                                </div>
                            )))}
                        </div>
                    </GlassCard>

                    <GlassCard variant="strong">
                        <p className="text-sm font-semibold mb-2">Note</p>
                        <p className="text-xs text-muted-foreground">
                            This page includes the UX/tabs layout now. Backend endpoints for coding
                            stats + caching + recommendations will replace the placeholder UI.
                        </p>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}
