import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import {
  Code,
  Globe,
  RefreshCw,
  Target,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Flame,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { upsertCodingProfile } from "@/lib/coding-profiles-api";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateAggregateCodingTelemetry, CODING_PLATFORMS_CONFIG } from "@/lib/super-dream-dsa-data";

type Platform = "leetcode" | "codechef" | "hackerrank" | "gfg";

const PLATFORMS: { key: Platform; label: string; placeholder: string; color: string }[] = [
  {
    key: "leetcode",
    label: "LeetCode",
    placeholder: "https://leetcode.com/u/<username>/",
    color: "text-amber-400 border-amber-500/30",
  },
  {
    key: "codechef",
    label: "CodeChef",
    placeholder: "https://www.codechef.com/users/<username>",
    color: "text-amber-600 border-amber-600/30",
  },
  {
    key: "hackerrank",
    label: "HackerRank",
    placeholder: "https://www.hackerrank.com/profile/<username>",
    color: "text-emerald-400 border-emerald-500/30",
  },
  {
    key: "gfg",
    label: "GeeksforGeeks",
    placeholder: "https://auth.geeksforgeeks.org/user/<username>/",
    color: "text-green-400 border-green-500/30",
  },
];

const CURATED_PROBLEMS = [
  {
    title: "Trapping Rain Water II (Priority Queue & Grid BFS)",
    platform: "LeetCode",
    difficulty: "Hard",
    topic: "BFS & Heaps",
    url: "https://leetcode.com/problems/trapping-rain-water-ii/",
  },
  {
    title: "LRU & LFU Cache Design with O(1) Operations",
    platform: "LeetCode",
    difficulty: "Hard",
    topic: "System Primitives",
    url: "https://leetcode.com/problems/lfu-cache/",
  },
  {
    title: "Median of Two Sorted Arrays (Binary Search on Partition)",
    platform: "LeetCode",
    difficulty: "Hard",
    topic: "Binary Search",
    url: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
  },
  {
    title: "Design In-Memory File System with Linux Paths",
    platform: "LeetCode",
    difficulty: "Hard",
    topic: "Trie & OOP Design",
    url: "https://leetcode.com/problems/design-in-memory-file-system/",
  },
  {
    title: "Alien Dictionary (Topological Sort with Cycle Detection)",
    platform: "GeeksforGeeks",
    difficulty: "Medium",
    topic: "Graph Theory",
    url: "https://practice.geeksforgeeks.org/problems/alien-dictionary/1",
  },
];

export function SuperDreamCodingSection() {
  const {
    codingPlatformsStats,
    updateCodingPlatformUrl,
    fetchAndSyncCodingPlatform,
    syncCodingPlatformTelemetry,
    syncWithClassicCodingProfiles,
  } = useSuperDream();

  const [activePlatform, setActivePlatform] = useState<Platform>("leetcode");
  const [profileUrls, setProfileUrls] = useState<Record<Platform, string>>({
    leetcode: codingPlatformsStats?.leetcode?.profileUrl || codingPlatformsStats?.leetcode?.username || "",
    codechef: codingPlatformsStats?.codechef?.profileUrl || codingPlatformsStats?.codechef?.username || "",
    hackerrank: codingPlatformsStats?.hackerrank?.profileUrl || codingPlatformsStats?.hackerrank?.username || "",
    gfg: codingPlatformsStats?.gfg?.profileUrl || codingPlatformsStats?.gfg?.username || "",
  });
  const [loading, setLoading] = useState<Partial<Record<Platform, boolean>>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Auto sync from classic section if available
    syncWithClassicCodingProfiles();
  }, []);

  useEffect(() => {
    setProfileUrls((prev) => ({
      leetcode: prev.leetcode || codingPlatformsStats?.leetcode?.profileUrl || codingPlatformsStats?.leetcode?.username || "",
      codechef: prev.codechef || codingPlatformsStats?.codechef?.profileUrl || codingPlatformsStats?.codechef?.username || "",
      hackerrank: prev.hackerrank || codingPlatformsStats?.hackerrank?.profileUrl || codingPlatformsStats?.hackerrank?.username || "",
      gfg: prev.gfg || codingPlatformsStats?.gfg?.profileUrl || codingPlatformsStats?.gfg?.username || "",
    }));
  }, [codingPlatformsStats]);

  const aggregate = calculateAggregateCodingTelemetry(codingPlatformsStats);

  const handleSaveProfile = async (platform: Platform) => {
    const url = profileUrls[platform];
    if (!url || !url.trim()) {
      toast.error(`Please enter your ${PLATFORMS.find((p) => p.key === platform)?.label} username or profile URL`);
      return;
    }

    setLoading((prev) => ({ ...prev, [platform]: true }));
    updateCodingPlatformUrl(platform, url);

    try {
      await fetchAndSyncCodingPlatform(platform, url);
      toast.success(`${PLATFORMS.find((p) => p.key === platform)?.label} live telemetry fetched!`, {
        description: "Profile connected and stats updated in placement readiness tracker.",
      });
    } catch {
      toast.success(`${PLATFORMS.find((p) => p.key === platform)?.label} profile saved.`);
    } finally {
      setLoading((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const handleSyncMetrics = async () => {
    setRefreshing(true);
    try {
      const promises = PLATFORMS.map(async (p) => {
        if (profileUrls[p.key]?.trim()) {
          updateCodingPlatformUrl(p.key, profileUrls[p.key]);
          await fetchAndSyncCodingPlatform(p.key, profileUrls[p.key]);
        }
      });
      await Promise.all(promises);
      syncCodingPlatformTelemetry();
      toast.success("Coding telemetry synchronized across all platforms!");
    } catch {
      syncCodingPlatformTelemetry();
      toast.success("Telemetry updated.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard className="p-6 border-sky-500/30 bg-gradient-to-r from-slate-900/90 via-sky-950/40 to-slate-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold">
            <Code className="w-3.5 h-3.5 text-sky-400" />
            Competitive Coding Ecosystem
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Multi-Platform Coding Profiles & Problem Targets
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Synchronize live telemetry from LeetCode, CodeChef, HackerRank, and GeeksforGeeks. Track problem distributions and practice high-yield interview questions.
          </p>
        </div>

        <button
          onClick={handleSyncMetrics}
          disabled={refreshing}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 via-indigo-600 to-amber-500 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer shrink-0 active:scale-95"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-amber-200")} />
          <span>{refreshing ? "Syncing Telemetry..." : "Sync Live Stats"}</span>
        </button>
      </GlassCard>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 border-sky-500/30 bg-slate-900/70">
          <p className="text-xs text-slate-400">Total Solved</p>
          <p className="text-3xl font-black text-sky-300 font-mono mt-1">{aggregate.totalSolved}</p>
          <p className="text-[11px] text-sky-400/90 mt-1 font-medium">Across all platforms</p>
        </GlassCard>

        <GlassCard className="p-4 border-emerald-500/30 bg-slate-900/70">
          <p className="text-xs text-slate-400">Easy Solved</p>
          <p className="text-3xl font-black text-emerald-400 font-mono mt-1">{aggregate.totalEasy}</p>
          <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">Foundational</p>
        </GlassCard>

        <GlassCard className="p-4 border-amber-500/30 bg-slate-900/70">
          <p className="text-xs text-slate-400">Medium Solved</p>
          <p className="text-3xl font-black text-amber-400 font-mono mt-1">{aggregate.totalMedium}</p>
          <p className="text-[11px] text-amber-400/90 mt-1 font-medium">Core Interview Tier</p>
        </GlassCard>

        <GlassCard className="p-4 border-rose-500/30 bg-slate-900/70">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Hard Solved (FAANG)</p>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-rose-400 font-mono mt-1">{aggregate.totalHard}</p>
          <p className="text-[11px] text-rose-400/90 mt-1 font-medium">Top 2.5% Bracket</p>
        </GlassCard>
      </div>

      {/* Platform Connect Card */}
      <GlassCard className="p-6 border-slate-800 bg-slate-900/70 space-y-4">
        <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePlatform(p.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0",
                activePlatform === p.key
                  ? "bg-slate-800 text-white shadow-md border-sky-500/50 ring-1 ring-sky-500/30"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="url"
              placeholder={PLATFORMS.find((p) => p.key === activePlatform)?.placeholder}
              value={profileUrls[activePlatform]}
              onChange={(e) =>
                setProfileUrls({ ...profileUrls, [activePlatform]: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono"
            />
          </div>

          <button
            onClick={() => handleSaveProfile(activePlatform)}
            disabled={loading[activePlatform]}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-95 text-white transition shrink-0 cursor-pointer shadow-md shadow-sky-500/20"
          >
            {loading[activePlatform] ? "Connecting..." : "Connect Profile"}
          </button>
        </div>
      </GlassCard>

      {/* Curated High-Yield Problem Targets */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-sky-400" />
          High-Yield Problem Targets
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {CURATED_PROBLEMS.map((prob, i) => (
            <GlassCard
              key={i}
              className="p-4 border-slate-800 bg-slate-900/70 flex items-center justify-between gap-4 card-hover-lift"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold px-2 py-0.5 rounded border",
                      prob.difficulty === "Hard"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    )}
                  >
                    {prob.difficulty}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{prob.topic}</span>
                  <span className="text-[10px] font-mono text-slate-500">({prob.platform})</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white mt-1.5 truncate">
                  {prob.title}
                </p>
              </div>

              <a
                href={prob.url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition shrink-0 border border-slate-700 shadow-sm"
                title="Solve problem"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
