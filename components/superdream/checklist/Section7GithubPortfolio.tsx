import React, { useState } from "react";
import { SectionHeaderMetrics } from "./SectionHeaderMetrics";
import { useSuperDream } from "@/stores/superDreamStore";
import { calculateStudentChecklistScores } from "@/lib/super-dream-checklist";
import {
  Github,
  GitCommit,
  GitPullRequest,
  Star,
  Globe,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Minus,
  RefreshCw,
  FolderGit2,
  Check,
  Table as TableIcon,
  LayoutGrid,
  ShieldCheck,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useAuth } from "@/stores";

// Helper for Activity Icons
function getActivityIcon(activityName: string) {
  if (activityName.includes("Repositories")) return FolderGit2;
  if (activityName.includes("Commits")) return GitCommit;
  if (activityName.includes("Pull Requests")) return GitPullRequest;
  if (activityName.includes("Open Source")) return Globe;
  if (activityName.includes("Stars")) return Star;
  if (activityName.includes("Documentation")) return FileText;
  if (activityName.includes("Portfolio")) return Laptop;
  return Github;
}

export function Section7GithubPortfolio() {
  const { user } = useAuth();
  const { studentChecklist, updateGithubMetric } = useSuperDream();
  const { summaries } = calculateStudentChecklistScores(studentChecklist);
  const summary = summaries.find((s) => s.sectionId === 7) || summaries[6];

  // UI View Mode: 'table' (Exact image replica) vs 'cards' (Interactive Showcase)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // GitHub Account Telemetry Sync state
  const [githubInput, setGithubInput] = useState(user?.githubUsername || user?.github || "");
  const [connectedUsername, setConnectedUsername] = useState(user?.githubUsername || user?.github || "");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [userProfileData, setUserProfileData] = useState<{
    avatarUrl?: string;
    publicRepos?: number;
    starsCount?: number;
    followers?: number;
    profileUrl?: string;
    name?: string;
  } | null>(null);

  // Helper to extract clean username from URL or handle
  const parseGithubUsername = (input: string) => {
    if (!input) return "";
    const clean = input.trim();
    if (clean.includes("github.com/")) {
      const parts = clean.split("github.com/");
      const handle = parts[1]?.split("/")[0]?.replace(/[^a-zA-Z0-9-_]/g, "");
      return handle || clean;
    }
    return clean.replace(/[^a-zA-Z0-9-_]/g, "");
  };

  // Real GitHub Public API Sync
  const handleSyncGithub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const username = parseGithubUsername(githubInput);
    if (!username) {
      toast.error("Please enter a valid GitHub username or profile link (e.g. https://github.com/username)");
      return;
    }

    setIsSyncing(true);
    toast.loading(`Fetching live GitHub telemetry for @${username}...`, { id: "gh-sync" });

    try {
      // 1. Fetch User Profile
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      if (!userRes.ok) {
        throw new Error(userRes.status === 404 ? "GitHub user not found" : "GitHub API limit or network error");
      }
      const userData = await userRes.json();

      // 2. Fetch Public Repositories (up to 100)
      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
      const reposData = reposRes.ok ? await reposRes.json() : [];

      const totalPublicRepos = userData.public_repos || reposData.length || 0;
      let totalStars = 0;
      const languageMap: Record<string, number> = {};

      if (Array.isArray(reposData)) {
        reposData.forEach((r: any) => {
          totalStars += Number(r.stargazers_count || 0);
          if (r.language) {
            languageMap[r.language] = (languageMap[r.language] || 0) + 1;
          }
        });
      }

      // Build real repository category breakdown
      const repoBreakdown = Object.entries(languageMap)
        .slice(0, 4)
        .map(([lang, count]) => ({
          name: `${lang} Repositories`,
          count,
          note: `Public source code in ${lang}`,
        }));

      // Top starred repos breakdown
      const topStarredRepos = Array.isArray(reposData)
        ? [...reposData]
            .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
            .filter((r) => (r.stargazers_count || 0) > 0)
            .slice(0, 3)
            .map((r) => ({
              name: r.name,
              count: r.stargazers_count,
              note: r.description || `${r.language || "Code"} repository`,
            }))
        : [];

      // Update Section 7 Checklist items with real metrics
      updateGithubMetric("gh-1", totalPublicRepos, totalPublicRepos >= 30, { breakdown: repoBreakdown });
      updateGithubMetric("gh-5", totalStars, totalStars >= 75, { breakdown: topStarredRepos });

      if (userData.blog) {
        updateGithubMetric("gh-7", 1, true, { liveUrl: userData.blog });
      }

      setConnectedUsername(username);
      setUserProfileData({
        avatarUrl: userData.avatar_url,
        publicRepos: totalPublicRepos,
        starsCount: totalStars,
        followers: userData.followers,
        profileUrl: userData.html_url || `https://github.com/${username}`,
        name: userData.name || username,
      });

      setLastSynced(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      toast.success(`GitHub Telemetry Synced! @${username} (${totalPublicRepos} public repos, ${totalStars} stars)`, {
        id: "gh-sync",
      });
    } catch (err: any) {
      console.warn("GitHub API error:", err);
      toast.error(err.message || "Failed to fetch GitHub data. Please check username.", { id: "gh-sync" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Section Header Metrics (3 Calm Gauge Pie Charts) */}
      <SectionHeaderMetrics
        sectionId={7}
        title={summary.title}
        subtitle="Tier-1 placement benchmark: 30 Repositories, 3000+ Commits, 30 PRs, 15 Open Source Merges, 75 Stars, 60 Docs, and a Completed Portfolio Website."
        readinessScore={summary.readinessScore}
        completedTasks={summary.completedTasks}
        totalTasks={summary.totalTasks}
        completionPercent={summary.completionPercent}
        recommendedStatLabel={summary.recommendedStatLabel}
        recommendedStatValue={summary.recommendedStatValue}
        recommendedStatSub={summary.recommendedStatSub}
        statusColor={summary.statusColor}
      />

      {/* 2. GitHub Connected Profile & Telemetry Sync Bar */}
      <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-border shadow-md space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Profile Identity or Input Form */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {userProfileData?.avatarUrl ? (
                <img
                  src={userProfileData.avatarUrl}
                  alt={connectedUsername}
                  className="w-12 h-12 rounded-2xl border border-white/12 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center text-[var(--foreground)] shadow-inner">
                  <Github className="w-6 h-6" />
                </div>
              )}
              {connectedUsername && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                </div>
              )}
            </div>

            <div>
              {connectedUsername ? (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] flex items-center gap-1.5 font-mono">
                      @{connectedUsername}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 text-[10px] font-medium font-mono">
                      <ShieldCheck className="w-3 h-3 text-[var(--success)]" /> Live Synced
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {userProfileData?.name || "Connected Profile"} • {userProfileData?.publicRepos || 0} Repos • {userProfileData?.starsCount || 0} Stars • Synced:{" "}
                    <span className="text-[var(--foreground)]/80 font-mono">{lastSynced || "Live"}</span>
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">Connect GitHub Profile</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Enter your GitHub username or profile link to fetch your live repositories and stars.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* GitHub Input & Sync Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-transparent p-1 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer",
                  viewMode === "table"
                    ? "bg-white/8 text-[var(--primary)] font-semibold shadow-sm border border-white/12"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
                title="Official 3-Column Document Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Official Table</span>
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer",
                  viewMode === "cards"
                    ? "bg-white/8 text-[var(--primary)] font-semibold shadow-sm border border-white/12"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
                title="Interactive Modular Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Showcase Cards</span>
              </button>
            </div>

            {/* Direct GitHub Link */}
            {connectedUsername && (
              <a
                href={`https://github.com/${connectedUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/8 hover:bg-white/10 text-[var(--foreground)]/80 hover:text-white border border-white/12 transition shrink-0"
                title="Open GitHub Profile"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Username input & live fetch form */}
        <form onSubmit={handleSyncGithub} className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-white/8">
          <div className="relative flex-1">
            <Github className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={githubInput}
              onChange={(e) => setGithubInput(e.target.value)}
              placeholder="Enter GitHub username or URL (e.g. Deepan9884 or https://github.com/Deepan9884)"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-transparent border border-white/10 text-xs text-[var(--foreground)] placeholder-slate-500 focus:outline-none focus:border-[var(--primary)]/40 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSyncing}
            className="px-4 py-1.5 rounded-xl bg-white/8 hover:bg-white/10 text-[var(--foreground)] border border-white/12 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-[var(--primary)]", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Fetching..." : "Fetch & Sync GitHub"}</span>
          </button>
        </form>
      </div>

      {/* 3. VIEW MODE A: OFFICIAL DOCUMENT TABLE MATRIX (Exact Replica of Reference Image) */}
      {viewMode === "table" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-[var(--primary)]" />
              7. GitHub Portfolio
            </h3>
            <span className="text-xs text-[var(--muted-foreground)] font-mono">
              7 / 7 Target Deliverables Tracked
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-transparent shadow-md">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-transparent border-b border-white/10 text-[var(--foreground)]/80 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 w-2/5">Activity</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center w-1/5">Target</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center w-1/5">Current</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right w-1/5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {studentChecklist.section7GithubPortfolio.map((item, idx) => {
                  const isCompleted =
                    item.id === "gh-7" || item.activity === "Portfolio Website"
                      ? item.isCompleted || item.current >= 1
                      : item.current >= (typeof item.target === "number" ? item.target : item.targetValue || 1);

                  const targetStr =
                    item.targetDisplay || (typeof item.target === "string" ? item.target : `${item.target}`);
                  const Icon = getActivityIcon(item.activity);

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition-colors hover:bg-white/8 group",
                        idx % 2 === 0 ? "bg-white/5" : "bg-transparent"
                      )}
                    >
                      {/* 1. Activity Column */}
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-[var(--foreground)]">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center text-[var(--foreground)]/80 shrink-0">
                            <Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
                          </div>
                          <div>
                            <span className="font-semibold text-[var(--foreground)] block">{item.activity}</span>
                            {item.details && (
                              <span className="text-[10px] text-[var(--muted-foreground)] line-clamp-1 max-w-sm hidden md:block">
                                {item.details}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Target Column */}
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <span className="inline-block font-mono font-bold text-[var(--foreground)] bg-transparent border border-white/10 px-3 py-1 rounded-lg text-xs sm:text-sm">
                          {targetStr}
                        </span>
                      </td>

                      {/* 3. Current Column */}
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        {item.id === "gh-7" || item.activity === "Portfolio Website" ? (
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() =>
                                updateGithubMetric(item.id, isCompleted ? 0 : 1, !isCompleted)
                              }
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border transition cursor-pointer",
                                isCompleted
                                  ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/25 hover:bg-emerald-500/20"
                                  : "bg-[var(--warning)]/10 text-[var(--warning)] border-amber-500/25 hover:bg-amber-500/20"
                              )}
                            >
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-[var(--success)]" /> Completed
                                </>
                              ) : (
                                "In Progress"
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() =>
                                updateGithubMetric(
                                  item.id,
                                  Math.max(0, item.current - (item.id === "gh-2" ? 100 : 1))
                                )
                              }
                              className="p-1 rounded bg-white/8 hover:bg-white/10 text-[var(--foreground)]/80 border border-white/12 cursor-pointer transition"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={item.current}
                              onChange={(e) =>
                                updateGithubMetric(item.id, parseInt(e.target.value || "0", 10))
                              }
                              className="w-16 text-center font-mono font-bold text-[var(--foreground)] bg-transparent border border-white/10 rounded-lg py-1 text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                            />
                            <button
                              onClick={() =>
                                updateGithubMetric(
                                  item.id,
                                  item.current + (item.id === "gh-2" ? 100 : 1)
                                )
                              }
                              className="p-1 rounded bg-white/8 hover:bg-white/10 text-[var(--foreground)]/80 border border-white/12 cursor-pointer transition"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 4. Status Column */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--success)] font-medium bg-[var(--success)]/10 px-2.5 py-1 rounded-md border border-[var(--success)]/20">
                              <CheckCircle2 className="w-3 h-3" /> Target Met
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--warning)] font-medium bg-[var(--warning)]/10 px-2.5 py-1 rounded-md border border-[var(--warning)]/20">
                              <AlertCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VIEW MODE B: INTERACTIVE SHOWCASE CARDS */}
      {viewMode === "cards" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-[var(--primary)]" />
              Interactive GitHub Modules & Telemetry
            </h3>
            <span className="text-xs text-[var(--muted-foreground)] font-mono">
              7 Structured Milestone Cards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentChecklist.section7GithubPortfolio.map((item) => {
              const targetVal =
                typeof item.target === "number" ? item.target : item.targetValue || 1;
              const isCompleted =
                item.id === "gh-7" || item.activity === "Portfolio Website"
                  ? item.isCompleted || item.current >= 1
                  : item.current >= targetVal;

              const percent =
                item.id === "gh-7" || item.activity === "Portfolio Website"
                  ? isCompleted ? 100 : 50
                  : Math.min(100, Math.round((item.current / targetVal) * 100));

              const Icon = getActivityIcon(item.activity);
              const targetStr =
                item.targetDisplay || (typeof item.target === "string" ? item.target : `${item.target}`);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "panel-card rounded-2xl p-4.5 transition-all duration-200 flex flex-col justify-between gap-4 shadow-sm relative group hover:border-white/12",
                    isCompleted ? "border-[var(--success)]/25 hover:border-emerald-500/40" : "border-white/10 hover:border-white/12"
                  )}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white/8 text-[var(--primary)] border border-white/12 grid place-items-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition">
                            {item.activity}
                          </h4>
                          <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                            Target: <strong className="text-[var(--foreground)] font-bold">{targetStr}</strong>
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg border",
                          isCompleted
                            ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/25"
                            : "bg-transparent text-[var(--muted-foreground)] border-white/10"
                        )}
                      >
                        {item.id === "gh-7" || item.activity === "Portfolio Website"
                          ? isCompleted ? "Completed" : "Pending"
                          : `${item.current} / ${item.target}`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--muted-foreground)]">
                        <span>Pacing: {percent}% Delivered</span>
                        <span>{isCompleted ? "✓ Target Met" : "In Progress"}</span>
                      </div>
                      <div className="w-full bg-transparent rounded-full h-2 overflow-hidden border border-white/10">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isCompleted ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-sky-500"
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown or Details */}
                    {item.breakdown && (
                      <div className="space-y-1.5 pt-1">
                        {item.breakdown.slice(0, 2).map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between text-[11px] bg-transparent px-2.5 py-1 rounded-lg border border-white/8"
                          >
                            <span className="text-[var(--foreground)]/80 truncate max-w-[140px]">{sub.name}</span>
                            <span className="font-mono text-xs font-bold text-[var(--primary)] shrink-0">
                              {sub.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Interactive Controls */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs">
                    <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                      {item.unit || "Metrics"}
                    </span>

                    {/* Numeric Counter adjustment */}
                    {item.id !== "gh-7" && item.activity !== "Portfolio Website" ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateGithubMetric(
                              item.id,
                              Math.max(0, item.current - (item.id === "gh-2" ? 100 : 1))
                            )
                          }
                          className="p-1 rounded-lg bg-white/8 hover:bg-white/10 text-[var(--foreground)]/80 border border-white/12 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold text-[var(--foreground)] px-1.5">
                          {item.current}
                        </span>
                        <button
                          onClick={() =>
                            updateGithubMetric(
                              item.id,
                              item.current + (item.id === "gh-2" ? 100 : 1)
                            )
                          }
                          className="p-1 rounded-lg bg-white/8 hover:bg-white/10 text-[var(--foreground)]/80 border border-white/12 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => updateGithubMetric(item.id, isCompleted ? 0 : 1, !isCompleted)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition cursor-pointer",
                          isCompleted
                            ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30"
                            : "bg-white/8 text-[var(--foreground)]/80 border-white/12"
                        )}
                      >
                        {isCompleted ? "✓ Completed" : "Mark Done"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}





