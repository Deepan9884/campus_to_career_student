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
    Target,
    Trophy,
    Flame,
    Activity,
    Award,
    TrendingUp,
    Sparkles,
    BarChart3,
    Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { upsertCodingProfile, refreshCodingProfile, getProblemRecommendations, getAllCodingProfiles } from "@/lib/coding-profiles-api";
import { useSuperDream } from "@/stores/superDreamStore";
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
    ranking?: number;
    rating?: number;
    raw?: any;
};

type Recommendation = { title: string; url: string; topic: string; difficulty?: string; platform?: string };

export const Route = createFileRoute("/_authenticated/coding-platforms")({
    head: () => ({ meta: [{ title: "Coding Platforms — Campus to Career AI" }] }),
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
                                ranking: cs.ranking || cs.globalRanking || cs.raw?.data?.matchedUser?.profile?.ranking || cs.raw?.data?.userContestRanking?.globalRanking,
                                rating: cs.rating || cs.raw?.data?.userContestRanking?.rating,
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
            useSuperDream.getState().updateCodingPlatformUrl(platform, url);
            useSuperDream.getState().fetchAndSyncCodingPlatform(platform, url);
            toast.success("Profile saved & synced to Super Dream!");
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
                        ranking: cachedStats.ranking || cachedStats.globalRanking || cachedStats.raw?.data?.matchedUser?.profile?.ranking || cachedStats.raw?.data?.userContestRanking?.globalRanking,
                        rating: cachedStats.rating || cachedStats.raw?.data?.userContestRanking?.rating,
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
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-foreground">
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
            <GlassCard data-tour="coding-platforms-card">
                <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setActive(p.key)}
                            className={cn(
                                "text-xs px-3 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer font-medium",
                                active === p.key
                                    ? "btn-gradient text-white shadow-md font-semibold"
                                    : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-muted-foreground"
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
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                            {activePlatformMeta.icon}
                            {activePlatformMeta.label} Profile
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Paste the profile URL. Username will be extracted server-side.
                        </p>

                        <label className="text-xs font-semibold text-slate-700 dark:text-muted-foreground mb-1.5 block">Profile URL</label>
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
                                className="btn-gradient btn-gradient-hover rounded-xl px-4 text-sm font-semibold text-white shadow-md cursor-pointer"
                            >
                                Save
                            </button>
                        </div>

                        {errors[active] && (
                            <div className="mt-3 flex items-start gap-2 text-sm text-red-500 dark:text-red-300">
                                <AlertTriangle className="h-4 w-4 mt-0.5" />
                                <span>{errors[active]}</span>
                            </div>
                        )}

                        <div className="mt-5 flex gap-2">
                            <button
                                onClick={() => handleRefresh(active)}
                                disabled={Boolean(loading[active])}
                                className="glass rounded-xl px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                {loading[active] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Refresh
                            </button>

                            <button
                                onClick={() => {
                                    setProfileUrls((s) => ({ ...s, [active]: "" }));
                                    toast.success("Cleared");
                                }}
                                className="glass rounded-xl px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                            >
                                Clear
                            </button>
                        </div>
                    </GlassCard>

                    <ConnectedStatsCard
                        stats={statsByPlatform[active]}
                        platformMeta={activePlatformMeta}
                        onRefresh={() => handleRefresh(active)}
                        loading={Boolean(loading[active])}
                    />
                </div>

                {/* Right: recommendations */}
                <div className="space-y-6">
                    <GlassCard>
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
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
                                        idx === 0 ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-slate-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    <div className="min-w-0">
                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                            {idx === 0 && <Flame className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />}
                                            {idx === 0 ? <span className="text-amber-600 dark:text-amber-400 font-semibold">Daily Challenge • {r.topic}</span> : <span>{r.topic}</span>}
                                            {r.difficulty && (
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none",
                                                    r.difficulty === "Easy" && "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                                                    r.difficulty === "Medium" && "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                                                    r.difficulty === "Hard" && "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
                                                )}>
                                                    {r.difficulty}
                                                </span>
                                            )}
                                            {r.platform && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium leading-none bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 capitalize">
                                                    {r.platform === "gfg" ? "GFG" : r.platform === "hackerrank" ? "HackerRank" : r.platform === "codechef" ? "CodeChef" : r.platform === "codeforces" ? "Codeforces" : "LeetCode"}
                                                </span>
                                            )}
                                        </div>
                                        <a
                                            href={r.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-semibold text-foreground hover:underline break-words"
                                        >
                                            {r.title}
                                        </a>
                                    </div>
                                    <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-[color:var(--color-primary)]"
                                        aria-label="Open problem"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                    </a>
                                </div>
                            )))}
                        </div>
                    </GlassCard>

                </div>
            </div>
        </div>
    );
}

function ConnectedStatsCard({
    stats,
    platformMeta,
    onRefresh,
    loading,
}: {
    stats?: CodingProfileStats;
    platformMeta: { key: Platform; label: string; icon: React.ReactNode };
    onRefresh: () => void;
    loading?: boolean;
}) {
    const solved = Number(stats?.solved ?? 0);
    const byDiff = stats?.byDifficulty || {};

    const easy = Number(byDiff.Easy ?? byDiff.easy ?? 0);
    const medium = Number(byDiff.Medium ?? byDiff.medium ?? 0);
    const hard = Number(byDiff.Hard ?? byDiff.hard ?? 0);

    const otherEntries = Object.entries(byDiff).filter(
        ([k]) => !["Easy", "easy", "Medium", "medium", "Hard", "hard", "All", "all"].includes(k)
    );

    const sumDiff = easy + medium + hard;
    const effectiveTotal = sumDiff > 0 ? sumDiff : (solved > 0 ? solved : 1);

    const easyPct = sumDiff > 0 ? (easy / effectiveTotal) * 100 : (solved > 0 ? 50 : 0);
    const medPct = sumDiff > 0 ? (medium / effectiveTotal) * 100 : (solved > 0 ? 35 : 0);
    const hardPct = sumDiff > 0 ? (hard / effectiveTotal) * 100 : (solved > 0 ? 15 : 0);

    const ranking = stats?.ranking;
    const rating = stats?.rating;

    // SVG Donut calculation metrics
    const radius = 34;
    const circumference = 2 * Math.PI * radius; // ~213.63
    const easyStroke = (easyPct / 100) * circumference;
    const medStroke = (medPct / 100) * circumference;
    const hardStroke = (hardPct / 100) * circumference;

    const hasStats = Boolean(stats && (solved > 0 || Object.keys(byDiff).length > 0));

    const solverTier =
        solved >= 500
            ? { label: "Elite Problem Solver", badgeClass: "text-amber-500 bg-amber-500/10 border-amber-500/25" }
            : solved >= 250
            ? { label: "Advanced Coder", badgeClass: "text-purple-500 bg-purple-500/10 border-purple-500/25" }
            : solved >= 50
            ? { label: "Intermediate Coder", badgeClass: "text-blue-500 bg-blue-500/10 border-blue-500/25" }
            : { label: "Getting Started", badgeClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25" };

    return (
        <GlassCard className="relative overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                        {platformMeta.icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                            Connected Stats
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {platformMeta.label} Live Telemetry & Breakdown
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasStats ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            Live Synced
                        </div>
                    ) : (
                        <span className="text-xs font-medium text-muted-foreground px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-white/10">
                            Not Connected
                        </span>
                    )}

                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        title="Refresh live stats"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary")} />
                    </button>
                </div>
            </div>

            {hasStats ? (
                <div className="space-y-4">
                    {/* Hero Problem-Solving Showcase Banner with Donut Chart */}
                    <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/[0.04] to-transparent shadow-xs">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Trophy className="h-3.5 w-3.5 text-amber-500" /> Problems Solved
                                </span>
                                <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-baseline gap-2">
                                    {solved.toLocaleString()}
                                    <span className="text-xs font-medium text-muted-foreground">total</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                    <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-xs", solverTier.badgeClass)}>
                                        {solverTier.label}
                                    </span>
                                    <span className="text-[11px] font-medium text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-md border border-foreground/10">
                                        {platformMeta.label}
                                    </span>
                                </div>
                            </div>

                            {/* Donut Chart Visual */}
                            <div className="relative flex items-center justify-center shrink-0">
                                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
                                    {/* Background Track */}
                                    <circle
                                        cx="44"
                                        cy="44"
                                        r={radius}
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="7"
                                        className="text-muted/15"
                                    />
                                    {/* Easy Arc */}
                                    {easyStroke > 0 && (
                                        <circle
                                            cx="44"
                                            cy="44"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#10b981"
                                            strokeWidth="7"
                                            strokeDasharray={`${easyStroke} ${circumference}`}
                                            strokeDashoffset="0"
                                            strokeLinecap="round"
                                            className="transition-all duration-700"
                                        />
                                    )}
                                    {/* Medium Arc */}
                                    {medStroke > 0 && (
                                        <circle
                                            cx="44"
                                            cy="44"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#f59e0b"
                                            strokeWidth="7"
                                            strokeDasharray={`${medStroke} ${circumference}`}
                                            strokeDashoffset={`${-easyStroke}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-700"
                                        />
                                    )}
                                    {/* Hard Arc */}
                                    {hardStroke > 0 && (
                                        <circle
                                            cx="44"
                                            cy="44"
                                            r={radius}
                                            fill="transparent"
                                            stroke="#f43f5e"
                                            strokeWidth="7"
                                            strokeDasharray={`${hardStroke} ${circumference}`}
                                            strokeDashoffset={`${-(easyStroke + medStroke)}`}
                                            strokeLinecap="round"
                                            className="transition-all duration-700"
                                        />
                                    )}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                    <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Proportional Segmented Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                <BarChart3 className="h-3.5 w-3.5 text-primary" /> Difficulty Split
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">
                                {easy} Easy • {medium} Med • {hard} Hard
                            </span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden flex p-0.5 gap-0.5 border border-slate-200 dark:border-white/10 shadow-inner">
                            {easyPct > 0 && (
                                <div
                                    style={{ width: `${easyPct}%` }}
                                    className="h-full bg-emerald-500 rounded-l-full transition-all duration-700 hover:brightness-110 cursor-pointer"
                                    title={`Easy: ${easy} (${easyPct.toFixed(1)}%)`}
                                />
                            )}
                            {medPct > 0 && (
                                <div
                                    style={{ width: `${medPct}%` }}
                                    className={cn(
                                        "h-full bg-amber-500 transition-all duration-700 hover:brightness-110 cursor-pointer",
                                        easyPct === 0 && "rounded-l-full",
                                        hardPct === 0 && "rounded-r-full"
                                    )}
                                    title={`Medium: ${medium} (${medPct.toFixed(1)}%)`}
                                />
                            )}
                            {hardPct > 0 && (
                                <div
                                    style={{ width: `${hardPct}%` }}
                                    className="h-full bg-rose-500 rounded-r-full transition-all duration-700 hover:brightness-110 cursor-pointer"
                                    title={`Hard: ${hard} (${hardPct.toFixed(1)}%)`}
                                />
                            )}
                        </div>
                    </div>

                    {/* Difficulty Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Easy Card */}
                        <div className="p-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] hover:bg-emerald-500/[0.1] transition-all duration-200 shadow-xs group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                    <span className="text-xs font-bold text-foreground">Easy</span>
                                </div>
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md font-mono">
                                    {easyPct.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-2xl font-black text-foreground">{easy.toLocaleString()}</span>
                                <span className="text-[11px] text-muted-foreground">solved</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-emerald-500/20 mt-2.5 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                    style={{ width: `${easyPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Medium Card */}
                        <div className="p-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] dark:bg-amber-500/[0.07] hover:bg-amber-500/[0.1] transition-all duration-200 shadow-xs group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                    <span className="text-xs font-bold text-foreground">Medium</span>
                                </div>
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md font-mono">
                                    {medPct.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-2xl font-black text-foreground">{medium.toLocaleString()}</span>
                                <span className="text-[11px] text-muted-foreground">solved</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-amber-500/20 mt-2.5 overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                    style={{ width: `${medPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Hard Card */}
                        <div className="p-3.5 rounded-2xl border border-rose-500/25 bg-rose-500/[0.04] dark:bg-rose-500/[0.07] hover:bg-rose-500/[0.1] transition-all duration-200 shadow-xs group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                    <span className="text-xs font-bold text-foreground">Hard</span>
                                </div>
                                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md font-mono">
                                    {hardPct.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-2xl font-black text-foreground">{hard.toLocaleString()}</span>
                                <span className="text-[11px] text-muted-foreground">solved</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-rose-500/20 mt-2.5 overflow-hidden">
                                <div
                                    className="h-full bg-rose-500 rounded-full transition-all duration-700"
                                    style={{ width: `${hardPct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Non-standard categories if present */}
                    {otherEntries.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Additional Categories
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {otherEntries.map(([k, v]) => (
                                    <div key={k} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-foreground/5 text-xs font-medium text-foreground">
                                        <span className="text-muted-foreground">{k}:</span>
                                        <span className="font-bold">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Global Rank & Contest Rating Ribbon */}
                    {(ranking || rating) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {ranking && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/[0.05] border border-blue-500/20 shadow-xs">
                                    <div className="p-2 rounded-lg bg-blue-500/15 text-blue-500 shrink-0">
                                        <Award className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Global Ranking
                                        </div>
                                        <div className="text-sm font-black text-foreground">
                                            #{Number(ranking).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {rating && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/[0.05] border border-purple-500/20 shadow-xs">
                                    <div className="p-2 rounded-lg bg-purple-500/15 text-purple-500 shrink-0">
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Contest Rating
                                        </div>
                                        <div className="text-sm font-black text-foreground">
                                            {Math.round(Number(rating)).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20 shadow-xs">
                        {platformMeta.icon}
                    </div>
                    <h4 className="text-sm font-bold text-foreground">No {platformMeta.label} Stats Connected</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                        Enter your profile URL in the field above and click <span className="font-semibold text-foreground">Save</span> to sync live problem-solving telemetry, difficulty breakdowns, and unlock recommendations.
                    </p>
                </div>
            )}
        </GlassCard>
    );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="font-bold text-foreground">{value}</span>
        </div>
    );
}
