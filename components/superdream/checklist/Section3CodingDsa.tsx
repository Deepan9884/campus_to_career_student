import React, { useState, useMemo, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import {
  type CodingPlatformKey,
  CODING_PLATFORMS_CONFIG,
  DSA_TOPICS_BREAKDOWN,
  computeDsaTopicsBreakdown,
  calculateAggregateCodingTelemetry,
} from "@/lib/super-dream-dsa-data";
import {
  Binary,
  Code2,
  CheckCircle2,
  Zap,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Target,
  BarChart3,
  Globe,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const PLATFORM_KEYS: CodingPlatformKey[] = ["leetcode", "gfg", "codechef", "hackerrank"];

// Soft study color mapping for platforms
const SOFT_PLATFORM_PALETTE: Record<
  CodingPlatformKey,
  {
    pillBg: string;
    pillText: string;
    pillBorder: string;
    indicator: string;
    activeTab: string;
    cardBorder: string;
  }
> = {
  leetcode: {
    pillBg: "bg-[var(--warning)]/10",
    pillText: "text-[var(--warning)]",
    pillBorder: "border-[var(--warning)]/20",
    indicator: "#D99E4B",
    activeTab: "bg-white/8 text-amber-200 border-amber-500/30 ring-1 ring-amber-500/20",
    cardBorder: "border-[var(--warning)]/20 hover:border-amber-500/35",
  },
  gfg: {
    pillBg: "bg-[var(--success)]/10",
    pillText: "text-[var(--success)]",
    pillBorder: "border-[var(--success)]/20",
    indicator: "#4CAF7D",
    activeTab: "bg-white/8 text-emerald-200 border-[var(--success)]/30 ring-1 ring-emerald-500/20",
    cardBorder: "border-[var(--success)]/20 hover:border-emerald-500/35",
  },
  codechef: {
    pillBg: "bg-purple-500/10",
    pillText: "text-[var(--accent)]/90",
    pillBorder: "border-purple-500/20",
    indicator: "#8B7FC6",
    activeTab: "bg-white/8 text-purple-200 border-purple-500/30 ring-1 ring-purple-500/20",
    cardBorder: "border-purple-500/20 hover:border-purple-500/35",
  },
  hackerrank: {
    pillBg: "bg-[var(--primary)]/8",
    pillText: "text-[var(--primary)]/80/90",
    pillBorder: "border-[var(--primary)]/20",
    indicator: "#4A90A4",
    activeTab: "bg-white/8 text-cyan-200 border-cyan-500/30 ring-1 ring-cyan-500/20",
    cardBorder: "border-[var(--primary)]/20 hover:border-cyan-500/35",
  },
};

export function Section3CodingDsa() {
  const {
    studentChecklist,
    updateCodingMetric,
    codingPlatformsStats,
    updateCodingPlatformUrl,
    syncCodingPlatformTelemetry,
    fetchAndSyncCodingPlatform,
    syncWithClassicCodingProfiles,
  } = useSuperDream();

  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 3) || summaries[2];

  // Selected Platform Tab
  const [selectedPlatformTab, setSelectedPlatformTab] = useState<"all" | CodingPlatformKey>("all");

  // Category Filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Draft URL input state
  const [inputUrls, setInputUrls] = useState<Record<CodingPlatformKey, string>>({
    leetcode: codingPlatformsStats?.leetcode?.profileUrl || codingPlatformsStats?.leetcode?.username || "",
    gfg: codingPlatformsStats?.gfg?.profileUrl || codingPlatformsStats?.gfg?.username || "",
    codechef: codingPlatformsStats?.codechef?.profileUrl || codingPlatformsStats?.codechef?.username || "",
    hackerrank: codingPlatformsStats?.hackerrank?.profileUrl || codingPlatformsStats?.hackerrank?.username || "",
  });

  const [syncing, setSyncing] = useState(false);
  const [platformLoading, setPlatformLoading] = useState<Record<CodingPlatformKey, boolean>>({
    leetcode: false,
    gfg: false,
    codechef: false,
    hackerrank: false,
  });

  // Keep input URLs in sync if store updates
  useEffect(() => {
    setInputUrls((prev) => ({
      leetcode: prev.leetcode || codingPlatformsStats?.leetcode?.profileUrl || codingPlatformsStats?.leetcode?.username || "",
      gfg: prev.gfg || codingPlatformsStats?.gfg?.profileUrl || codingPlatformsStats?.gfg?.username || "",
      codechef: prev.codechef || codingPlatformsStats?.codechef?.profileUrl || codingPlatformsStats?.codechef?.username || "",
      hackerrank: prev.hackerrank || codingPlatformsStats?.hackerrank?.profileUrl || codingPlatformsStats?.hackerrank?.username || "",
    }));
  }, [codingPlatformsStats]);

  // Auto-fetch and sync classic profiles on component mount
  useEffect(() => {
    // Sync any saved profiles from classic section
    syncWithClassicCodingProfiles();

    // Trigger live stats fetch for any connected platform missing telemetry
    PLATFORM_KEYS.forEach((pk) => {
      const stats = codingPlatformsStats[pk];
      const urlOrUser = stats?.profileUrl || stats?.username;
      if (urlOrUser && stats?.totalSolved === 0) {
        fetchAndSyncCodingPlatform(pk, urlOrUser);
      }
    });
  }, []);

  // Aggregate stats across all 4 platforms
  const aggregateStats = useMemo(() => {
    return calculateAggregateCodingTelemetry(codingPlatformsStats);
  }, [codingPlatformsStats]);

  // Handle saving single platform URL with live fetch
  const handleSavePlatformUrl = async (platform: CodingPlatformKey) => {
    const url = inputUrls[platform];
    if (!url || !url.trim()) {
      toast.error(`Please enter your ${CODING_PLATFORMS_CONFIG[platform].name} username or profile URL`);
      return;
    }

    setPlatformLoading((prev) => ({ ...prev, [platform]: true }));
    updateCodingPlatformUrl(platform, url);

    try {
      await fetchAndSyncCodingPlatform(platform, url);
      toast.success(`${CODING_PLATFORMS_CONFIG[platform].name} Live Telemetry Fetched!`, {
        description: `Successfully pulled live problem solving statistics.`,
      });
    } catch {
      toast.info(`${CODING_PLATFORMS_CONFIG[platform].name} URL Saved`, {
        description: "Profile connected to dashboard.",
      });
    } finally {
      setPlatformLoading((prev) => ({ ...prev, [platform]: false }));
    }
  };

  // Handle Full Telemetry Sync Across All Platforms
  const handleFullSync = async () => {
    setSyncing(true);
    try {
      const promises = PLATFORM_KEYS.map(async (p) => {
        const target = inputUrls[p] || codingPlatformsStats[p]?.profileUrl || codingPlatformsStats[p]?.username;
        if (target && target.trim()) {
          updateCodingPlatformUrl(p, target);
          await fetchAndSyncCodingPlatform(p, target);
        }
      });
      await Promise.all(promises);
      syncCodingPlatformTelemetry();
      toast.success("Live Telemetry Synchronized", {
        description: `Pulled live metrics across connected coding profiles.`,
      });
    } catch {
      syncCodingPlatformTelemetry();
      toast.success("Telemetry updated.");
    } finally {
      setSyncing(false);
    }
  };

  // Compute live DSA Topics Breakdown dynamically from telemetry
  const allComputedTopics = useMemo(() => {
    return computeDsaTopicsBreakdown(codingPlatformsStats);
  }, [codingPlatformsStats]);

  // Filtered DSA Topics
  const filteredTopics = useMemo(() => {
    return allComputedTopics.filter((topic) => {
      if (selectedCategoryFilter === "all") return true;
      return topic.category === selectedCategoryFilter;
    });
  }, [allComputedTopics, selectedCategoryFilter]);

  // Active Platform Stats for the selected tab
  const currentPlatformStats = selectedPlatformTab === "all" ? null : codingPlatformsStats[selectedPlatformTab];
  const currentConfig = selectedPlatformTab === "all" ? null : CODING_PLATFORMS_CONFIG[selectedPlatformTab];
  const currentPalette = selectedPlatformTab === "all" ? null : SOFT_PLATFORM_PALETTE[selectedPlatformTab];

  // Soft Difficulty Chart Data
  const difficultyChartData = useMemo(() => {
    if (selectedPlatformTab === "all") {
      return [
        { name: "Easy", value: aggregateStats.totalEasy, color: "#5FA886" },
        { name: "Medium", value: aggregateStats.totalMedium, color: "#D99E4B" },
        { name: "Hard", value: aggregateStats.totalHard, color: "#CD6A6A" },
      ];
    } else {
      const stats = codingPlatformsStats[selectedPlatformTab];
      return [
        { name: "Easy", value: stats?.easySolved || 0, color: "#5FA886" },
        { name: "Medium", value: stats?.mediumSolved || 0, color: "#D99E4B" },
        { name: "Hard", value: stats?.hardSolved || 0, color: "#CD6A6A" },
      ];
    }
  }, [selectedPlatformTab, aggregateStats, codingPlatformsStats]);

  // Topic Distribution Chart Data
  const topicDistributionData = useMemo(() => {
    return filteredTopics.map((topic) => {
      let solved = 0;
      if (selectedPlatformTab === "all") {
        solved = topic.totalSolvedAcrossPlatforms;
      } else {
        solved = topic.byPlatform[selectedPlatformTab]?.solved || 0;
      }

      return {
        topic: topic.topicName.split(" ")[0],
        fullName: topic.topicName,
        solved,
        target: selectedPlatformTab === "all" ? topic.targetCount : Math.round(topic.targetCount / 2),
      };
    });
  }, [filteredTopics, selectedPlatformTab]);

  return (
    <div className="space-y-6">
      {/* 3 Calm Pie Charts at Top */}
      <SectionHeaderMetrics
        sectionId={3}
        title={summary.title}
        subtitle="Multi-platform competitive coding, dynamic live telemetry across LeetCode, GFG, CodeChef, and HackerRank, plus topic analysis."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* 4 Aggregate Platform Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="panel-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Total Solved
            </p>
            <div className="w-7 h-7 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] grid place-items-center">
              <Code2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] font-mono">
            {aggregateStats.totalSolved}
          </p>
          <span className="text-[10px] text-[var(--muted-foreground)] font-mono block">
            Across 4 Connected Platforms
          </span>
        </div>

        <div className="panel-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Easy Solved
            </p>
            <div className="w-7 h-7 rounded-xl bg-[var(--success)]/15 text-[var(--success)] grid place-items-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[var(--success)] font-mono">
            {aggregateStats.totalEasy}
          </p>
          <span className="text-[10px] text-[var(--muted-foreground)] font-mono block">
            Foundational Accuracy
          </span>
        </div>

        <div className="panel-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Medium Solved
            </p>
            <div className="w-7 h-7 rounded-xl bg-[var(--warning)]/15 text-[var(--warning)] grid place-items-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[var(--warning)] font-mono">
            {aggregateStats.totalMedium}
          </p>
          <span className="text-[10px] text-[var(--muted-foreground)] font-mono block">
            Core Technical Rounds
          </span>
        </div>

        <div className="panel-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">
              Hard (Advanced)
            </p>
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-300 grid place-items-center">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-300/90 font-mono">
            {aggregateStats.totalHard}
          </p>
          <span className="text-[10px] text-[var(--muted-foreground)] font-mono block">
            Super Dream Tier
          </span>
        </div>
      </div>

      {/* 1. PROFILE URL CONNECTION HUB (LIQUID GLASS) */}
      <GlassCard variant="liquid" className="p-5 space-y-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 tracking-tight">
                <Globe className="w-4 h-4 text-[var(--primary)]" />
                Connect Coding Profile URLs
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[var(--foreground)]/80 border border-white/[0.08] text-[10px] font-mono font-medium">
                4 Platforms
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Provide profile links for LeetCode, GeeksforGeeks, CodeChef, and HackerRank to auto-sync topic telemetry.
            </p>
          </div>

          <button
            onClick={handleFullSync}
            disabled={syncing}
            className="px-4 py-2 rounded-full btn-gradient btn-gradient-hover text-xs font-semibold flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
            <span>{syncing ? "Syncing..." : "Sync Live Stats"}</span>
          </button>
        </div>

        {/* 4 URL Input Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {PLATFORM_KEYS.map((key) => {
            const config = CODING_PLATFORMS_CONFIG[key];
            const stats = codingPlatformsStats[key];
            const isConnected = stats?.isConnected;
            const palette = SOFT_PLATFORM_PALETTE[key];

            return (
              <div
                key={key}
                className={cn(
                  "p-3.5 rounded-xl panel-slot transition-all duration-200 space-y-2.5",
                  isConnected ? palette.cardBorder : "border-white/[0.08]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: palette.indicator }}
                    />
                    <span className="text-xs font-semibold text-[var(--foreground)]">{config.name}</span>
                    <span className={cn("text-[10px] font-mono px-2 py-0.2 rounded-full border font-medium", palette.pillBg, palette.pillText, palette.pillBorder)}>
                      {config.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isConnected ? (
                      <span className="text-[10px] font-medium text-[var(--success)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--muted-foreground)] font-medium">Not Linked</span>
                    )}

                    {stats?.profileUrl && (
                      <a
                        href={stats.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg hover:bg-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
                        title={`Open ${config.name} Profile`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* URL Input + Connect Button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={inputUrls[key]}
                      onChange={(e) =>
                        setInputUrls((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={config.urlPlaceholder}
                      className="w-full px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.10] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/40 font-mono"
                    />
                  </div>

                  <button
                    onClick={() => handleSavePlatformUrl(key)}
                    disabled={platformLoading[key]}
                    className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[var(--foreground)] text-xs font-medium transition border border-white/[0.12] cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {platformLoading[key] ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-[var(--primary)]" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <span>Save &amp; Sync</span>
                    )}
                  </button>
                </div>

                {/* Mini Stats Tag */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--muted-foreground)] pt-0.5">
                  <span>
                    Solved: <strong className="text-[var(--foreground)]">{stats?.totalSolved || 0}</strong>
                  </span>
                  <span>
                    {config.ratingLabel}: <strong className="text-[var(--warning)]">{stats?.contestRating || 0}</strong>
                  </span>
                  <span>
                    Streak: <strong className="text-[var(--success)]/90">{stats?.streakDays || 0}d</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* 2. INTERACTIVE PLATFORM PANELS & TOPIC-BY-TOPIC STUDY ANALYSIS */}
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="space-y-4">
        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-between p-1.5 rounded-2xl bg-transparent border border-white/10 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedPlatformTab("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 border",
                selectedPlatformTab === "all"
                  ? "bg-white/8 text-[var(--primary)] border-[var(--primary)]/30 shadow-sm"
                  : "bg-transparent border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/8/40"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>All Platforms Aggregate</span>
              <span className="px-1.5 py-0.2 rounded bg-white/10/50 text-[10px] font-mono text-[var(--foreground)]/80">
                {aggregateStats.totalSolved}
              </span>
            </button>

            {PLATFORM_KEYS.map((key) => {
              const config = CODING_PLATFORMS_CONFIG[key];
              const stats = codingPlatformsStats[key];
              const palette = SOFT_PLATFORM_PALETTE[key];
              const isSelected = selectedPlatformTab === key;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlatformTab(key)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 shrink-0 border",
                    isSelected
                      ? palette.activeTab
                      : "bg-transparent border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/8/40"
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: palette.indicator }}
                  />
                  <span>{config.name}</span>
                  <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                    ({stats?.totalSolved || 0})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-[var(--muted-foreground)] font-mono px-2 hidden sm:block">
            {selectedPlatformTab === "all"
              ? "All 4 Platforms"
              : `${currentConfig?.name} Breakdown`}
          </div>
        </div>

        {/* Selected Platform Summary Bar */}
        {selectedPlatformTab !== "all" && currentPlatformStats && currentConfig && currentPalette && (
          <div
            className={cn(
              "p-4 rounded-2xl bg-transparent border shadow-sm transition-all duration-200",
              currentPalette.cardBorder
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentPalette.indicator }}
                  />
                  <h3 className="text-sm font-bold text-[var(--foreground)]">
                    {currentConfig.name} Study Overview
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/8 text-[var(--foreground)]/80 border border-white/10">
                    @{currentPlatformStats.username}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {currentConfig.ratingLabel}:{" "}
                  <strong className="text-[var(--warning)] font-mono">
                    {currentPlatformStats.contestRating} ({currentPlatformStats.globalRank})
                  </strong>{" "}
                  • Accuracy:{" "}
                  <strong className="text-[var(--success)] font-mono">
                    {currentPlatformStats.accuracyRate}%
                  </strong>{" "}
                  • Streak:{" "}
                  <strong className="text-[var(--primary)]/90 font-mono">
                    {currentPlatformStats.streakDays} Days
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
                <div className="px-2.5 py-1 rounded-lg bg-transparent border border-white/10 text-center">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Contests</span>
                  <span className="font-bold text-[var(--foreground)]">{currentPlatformStats.contestsAttended}</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-transparent border border-white/10 text-center">
                  <span className="text-[10px] text-[var(--success)]/80 block">Easy</span>
                  <span className="font-bold text-[var(--success)]">{currentPlatformStats.easySolved}</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-transparent border border-white/10 text-center">
                  <span className="text-[10px] text-[var(--warning)]/80 block">Med</span>
                  <span className="font-bold text-[var(--warning)]">{currentPlatformStats.mediumSolved}</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-transparent border border-white/10 text-center">
                  <span className="text-[10px] text-rose-400/80 block">Hard</span>
                  <span className="font-bold text-rose-300">{currentPlatformStats.hardSolved}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filters: (Soft study pills) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 pb-1">
          <div className="flex items-center gap-1.5">
            {[
              { key: "all", label: "All 12 Topics" },
              { key: "Linear", label: "Arrays, Strings & Stacks" },
              { key: "Trees & Graphs", label: "Trees & Graph Theory" },
              { key: "Advanced DP", label: "Dynamic Programming & Greedy" },
              { key: "System Primitives", label: "Tries, DSU & System DS" },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryFilter(cat.key)}
                className={cn(
                  "px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer shrink-0 border",
                  selectedCategoryFilter === cat.key
                    ? "bg-white/8 text-[var(--foreground)] border-white/18 shadow-sm"
                    : "bg-transparent text-[var(--muted-foreground)] border-white/10 hover:text-[var(--foreground)]"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[var(--muted-foreground)] font-mono hidden md:inline">
            {filteredTopics.length} DSA Topics
          </span>
        </div>

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* TOPIC-BY-TOPIC COUNT & ANALYSIS GRID (SOFT, CALM STUDY CARDS) */}
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTopics.map((topic) => {
            let solvedCount = 0;
            let targetCount = topic.targetCount;
            let easyCount = 0;
            let mediumCount = 0;
            let hardCount = 0;
            let accuracy = 0;
            let recommendedList: { title: string; difficulty: "Easy" | "Medium" | "Hard"; url: string; acceptanceRate: string }[] = [];

            if (selectedPlatformTab === "all") {
              solvedCount = topic.totalSolvedAcrossPlatforms;
              targetCount = topic.targetCount;
              recommendedList = [
                ...topic.byPlatform.leetcode.recommendedProblems,
                ...topic.byPlatform.gfg.recommendedProblems.slice(0, 1),
              ];
              PLATFORM_KEYS.forEach((pk) => {
                const data = topic.byPlatform[pk];
                easyCount += data.easy;
                mediumCount += data.medium;
                hardCount += data.hard;
              });
              const activeAccs = PLATFORM_KEYS.map((pk) => topic.byPlatform[pk].accuracy).filter((a) => a > 0);
              accuracy = activeAccs.length > 0
                ? Math.round(activeAccs.reduce((acc, a) => acc + a, 0) / activeAccs.length)
                : 0;
            } else {
              const pData = topic.byPlatform[selectedPlatformTab];
              solvedCount = pData?.solved || 0;
              targetCount = Math.round(topic.targetCount / 2);
              easyCount = pData?.easy || 0;
              mediumCount = pData?.medium || 0;
              hardCount = pData?.hard || 0;
              accuracy = pData?.accuracy || 0;
              recommendedList = pData?.recommendedProblems || [];
            }

            const percent = Math.min(100, Math.round((solvedCount / targetCount) * 100));
            const isDone = solvedCount >= targetCount && targetCount > 0;

            return (
              <div
                key={topic.id}
                className={cn(
                  "panel-card rounded-2xl p-4.5 flex flex-col justify-between gap-3.5 relative overflow-hidden",
                  isDone && "border-[var(--success)]/30 shadow-[0_0_20px_rgba(134,239,172,0.12)]"
                )}
              >
                <div className="space-y-3 relative z-10">
                  {/* Topic Header: Title, Category, Solved Count */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[var(--foreground)]/80 border border-white/[0.08] font-medium inline-block">
                        {topic.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] tracking-tight leading-snug">
                        {topic.topicName}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-[var(--foreground)] font-mono">
                        {solvedCount}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)] font-mono block">
                        / {targetCount}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar (Calm, Soft Study Tones) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[var(--muted-foreground)]">Mastery Progress</span>
                      <span className={cn("font-medium", isDone ? "text-[var(--success)]" : "text-[var(--foreground)]/80")}>
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden border border-white/[0.08]">
                      <div
                        className={cn(
                          "h-full transition-all duration-500 rounded-full",
                          isDone
                            ? "bg-gradient-to-r from-emerald-400 to-teal-300"
                            : "bg-gradient-to-r from-violet-400 to-pink-300"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Difficulty Breakdown Pills & Accuracy */}
                  <div className="flex items-center justify-between gap-1.5 pt-0.5 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="px-2 py-0.2 rounded-full bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25">
                        E: {easyCount}
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/25">
                        M: {mediumCount}
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-rose-500/15 text-rose-300/90 border border-rose-500/25">
                        H: {hardCount}
                      </span>
                    </div>

                    <span className="text-[var(--muted-foreground)]">
                      Acc: <strong className="text-[var(--foreground)] font-medium">{accuracy > 0 ? `${accuracy}%` : "-"}</strong>
                    </span>
                  </div>

                  {/* Curated Recommendations for this Platform & Topic */}
                  {recommendedList.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider block">
                        Recommended Practice:
                      </span>
                      {recommendedList.slice(0, 2).map((prob, idx) => (
                        <a
                          key={idx}
                          href={prob.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl panel-slot transition flex items-center justify-between gap-2 group/p"
                        >
                          <div className="truncate">
                            <span className="text-xs text-[var(--foreground)]/80 group-hover/p:text-[var(--foreground)] transition truncate block font-medium">
                              {prob.title}
                            </span>
                            <span className="text-[9px] font-mono text-[var(--muted-foreground)]">
                              Acceptance: {prob.acceptanceRate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={cn(
                                "text-[9px] font-mono font-medium px-2 py-0.2 rounded-full border",
                                prob.difficulty === "Hard"
                                  ? "bg-rose-500/15 text-rose-300 border-rose-500/25"
                                  : prob.difficulty === "Medium"
                                  ? "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/25"
                                  : "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/25"
                              )}
                            >
                              {prob.difficulty}
                            </span>
                            <ExternalLink className="w-3 h-3 text-[var(--muted-foreground)] group-hover/p:text-[var(--foreground)] transition" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* 3. VISUAL ANALYTICS: DIFFICULTY SPLIT & TOPIC RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Difficulty Bar Breakdown Chart */}
        <GlassCard variant="liquid" className="p-5 space-y-3.5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[var(--primary)]" />
              Difficulty Distribution ({selectedPlatformTab === "all" ? "All Platforms" : CODING_PLATFORMS_CONFIG[selectedPlatformTab].name})
            </h4>
            <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
              Total:{" "}
              <strong className="text-[var(--foreground)]">
                {selectedPlatformTab === "all"
                  ? aggregateStats.totalSolved
                  : codingPlatformsStats[selectedPlatformTab]?.totalSolved || 0}
              </strong>
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="rgba(167,139,250,0.3)" fontSize={11} />
                <YAxis stroke="rgba(167,139,250,0.3)" fontSize={11} />
                <Tooltip
                  cursor={{ fill: "rgba(167, 139, 250, 0.08)", radius: 6 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value;
                      return (
                        <div className="px-3 py-1.5 rounded-xl bg-[#0f0a1c]/95 border border-purple-500/30 text-white text-xs font-semibold shadow-xl backdrop-blur-xl">
                          <span className="text-slate-300">{label}: </span>
                          <strong className="text-purple-300 ml-1">{val} Solved</strong>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {difficultyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Topic Mastery Distribution */}
        <GlassCard variant="liquid" className="p-5 space-y-3.5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--success)]" />
              Topic Study Spectrum
            </h4>
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
              Target Benchmarks
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicDistributionData.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="topic" stroke="rgba(167,139,250,0.3)" fontSize={10} />
                <YAxis stroke="rgba(167,139,250,0.3)" fontSize={11} />
                <Tooltip
                  cursor={{ fill: "rgba(167, 139, 250, 0.08)", radius: 6 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const solved = payload.find((p) => p.dataKey === "solved")?.value ?? 0;
                      const target = payload.find((p) => p.dataKey === "target")?.value ?? 0;
                      return (
                        <div className="p-3 rounded-2xl bg-[#0f0a1c]/95 border border-purple-500/30 shadow-2xl backdrop-blur-xl space-y-1.5 min-w-[140px]">
                          <p className="text-xs font-bold text-white tracking-wide border-b border-white/10 pb-1">{label}</p>
                          <div className="flex items-center justify-between text-xs text-purple-200">
                            <span>Solved:</span>
                            <strong className="text-purple-300 font-bold ml-2">{solved}</strong>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span>Target:</span>
                            <strong className="text-slate-200 font-semibold ml-2">{target}</strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="solved" fill="#A78BFA" radius={[4, 4, 0, 0]} name="Solved" />
                <Bar dataKey="target" fill="rgba(167,139,250,0.18)" radius={[4, 4, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* 4. 10 MODULAR CHECKLIST METRIC CARDS & COUNTERS */}
      <div className="space-y-3 pt-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 tracking-tight">
            <Target className="w-4 h-4 text-[var(--success)]" />
            Section 3 Checklist Targets &amp; Telemetry Metrics
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Directly synced with your connected coding profiles. Manual adjustments are saved to your study plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentChecklist.section3CodingDsa.map((item) => {
            const percent = Math.min(100, Math.round((item.current / item.target) * 100));
            const isCompleted = item.current >= item.target;

            return (
              <div
                key={item.id}
                className={cn(
                  "panel-card rounded-2xl p-4.5 flex flex-col justify-between gap-3.5 relative overflow-hidden",
                  isCompleted && "border-[var(--success)]/30 shadow-[0_0_20px_rgba(134,239,172,0.12)]"
                )}
              >
                <div className="space-y-3 relative z-10">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl grid place-items-center shrink-0 text-xs shadow-sm",
                          isCompleted
                            ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25"
                            : "bg-white/[0.06] text-[var(--primary)] border border-white/[0.10]"
                        )}
                      >
                        <Binary className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] tracking-tight">
                          {item.activity}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/[0.05] text-[var(--muted-foreground)] border border-white/[0.08] font-medium inline-block mt-0.5">
                          Target: {item.target}{" "}
                          {item.id === "dsa-9"
                            ? "hrs/week"
                            : item.id === "dsa-10"
                            ? "Rating"
                            : "Problems"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border",
                        isCompleted
                          ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                          : "bg-white/[0.06] text-[var(--foreground)] border-white/[0.10]"
                      )}
                    >
                      {percent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden border border-white/[0.08]">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        isCompleted
                          ? "bg-gradient-to-r from-emerald-400 to-teal-300"
                          : "bg-gradient-to-r from-violet-400 to-pink-300"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Synced Telemetry Metric Display */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08] text-xs relative z-10">
                  <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                    <span>Telemetry Progress:</span>
                  </span>

                  <span className="font-mono text-xs font-bold text-[var(--foreground)] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10]">
                    {item.current} {item.id === "dsa-9" ? "hrs/wk" : item.id === "dsa-10" ? "Rating" : "Solved"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



