import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import {
  Github,
  Star,
  GitFork,
  Search,
  ShieldCheck,
  Code2,
  Layers,
  Briefcase,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  History,
  Check,
  RotateCw,
  Edit3,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  connectGithub,
  listRepos,
  analyzeRepo,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
  generateLinkedInPost,
} from "@/lib/github-api";
import { useAuth } from "@/stores";
import type {
  RepoListItem,
  RepoAnalysis,
  AnalysisHistoryItem,
  GithubProfile,
} from "@/types/github";

export const Route = createFileRoute("/_authenticated/github")({
  head: () => ({ meta: [{ title: "GitHub Projects — Campus to Career AI" }] }),
  component: GithubPage,
});

function GithubPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoConnectAttempted = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState(user?.githubUsername || "");
  const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null);
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState<RepoListItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [tab, setTab] = useState<"overview" | "quality" | "security" | "resume" | "linkedin">("overview");

  const [connecting, setConnecting] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
const [analyzing, setAnalyzing] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // LinkedIn post generation state
  const [linkedinPost, setLinkedinPost] = useState<string>("");
  const [generatingPost, setGeneratingPost] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Adjustable Layout States
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("c2c_github_split_ratio");
      if (saved) {
        const parsed = Number(saved);
        if (parsed >= 20 && parsed <= 60) return parsed;
      }
    }
    return 33;
  });
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newPercent >= 20 && newPercent <= 60) {
        setLeftWidthPercent(Math.round(newPercent));
        localStorage.setItem("c2c_github_split_ratio", String(Math.round(newPercent)));
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const fetchRepos = useCallback(async () => {
    setLoadingRepos(true);
    try {
      const data = await listRepos();
      setRepos(data.repos || []);
      if ((data.repos || []).length > 0) {
        setConnected(true);
      }
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      if (apiErr?.statusCode === 429) {
        toast.error(apiErr.message || "Rate limit reached. Please wait a few minutes.");
      }
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    try {
      const data = await getAnalysisHistory(page, 10);
      setHistory(data.analyses || []);
      setHistoryPagination(data.pagination);
    } catch {
      toast.error("Failed to load analysis history");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchHistory(1);
    }
  }, [showHistory, fetchHistory]);

  const handleConnect = async (customHandle?: string) => {
    const targetHandle = (customHandle || username).trim();
    if (!targetHandle) return;
    setConnecting(true);
    try {
      const data = await connectGithub({ githubUsername: targetHandle });
      setConnected(true);
      setGithubProfile(data.github);
      setUsername(data.github.login);
      if (data.user) {
        useAuth.setState((state) => ({
          user: state.user ? { ...state.user, ...data.user, githubUsername: data.user.githubUsername } : (data.user as any),
        }));
      }
      await fetchRepos();
      toast.success(`Connected as @${data.github.login}`);
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      toast.error(apiErr.message || "Failed to connect GitHub account");
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    const handle = user?.profile?.githubUsername || user?.githubUsername;
    if (handle && autoConnectAttempted.current !== handle) {
      autoConnectAttempted.current = handle;
      setUsername(handle);
      setConnecting(true);
      listRepos()
        .then((data) => {
          setConnected(true);
          setRepos(data.repos || []);
          connectGithub({ githubUsername: handle })
            .then((res) => {
              setGithubProfile(res.github);
            })
            .catch(() => {});
        })
        .catch(() => {
          connectGithub({ githubUsername: handle })
            .then((res) => {
              setConnected(true);
              setGithubProfile(res.github);
              fetchRepos();
            })
            .catch(() => {});
        })
        .finally(() => {
          setConnecting(false);
        });
    }
  }, [user?.githubUsername, user?.profile?.githubUsername, fetchRepos]);

  const handleAnalyze = async (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    setAnalysis(null);
    setAnalyzing(true);
    setShowHistory(false);
    try {
      const result = await analyzeRepo({ repoFullName });
      setAnalysis(result);
      if (result.status === "completed") {
        toast.success("Analysis complete");
      } else if (result.status === "failed") {
        toast.error(result.errorMessage || "Analysis failed");
      }
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      toast.error(apiErr.message || "Failed to analyze repository");
      setSelectedRepo(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewAnalysis = async (id: string) => {
    setLoadingAnalysis(true);
    setShowHistory(false);
    try {
      const result = await getAnalysisById(id);
      setAnalysis(result);
      setSelectedRepo(result.repoFullName);
      setTab("overview");
    } catch {
      toast.error("Failed to load analysis");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAnalysis(deleteId);
      toast.success("Analysis deleted");
      setHistory((prev) => prev.filter((a) => a._id !== deleteId));
      setHistoryPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      if (analysis?._id === deleteId) {
        setAnalysis(null);
        setSelectedRepo(null);
      }
    } catch {
      toast.error("Failed to delete analysis");
    } finally {
      setDeleteId(null);
    }
  };

  const handleGenerateLinkedInPost = async () => {
    if (!analysis || generatingPost) return;
    setGeneratingPost(true);
    try {
      const result = await generateLinkedInPost({
        repoFullName: analysis.repoFullName,
        overview: analysis.overview || "",
        quality: analysis.quality || "",
        resumeImpact: analysis.resumeImpact || [],
        repoUrl: analysis.repoUrl,
      });
      setLinkedinPost(result.draft);
      toast.success("Post draft generated");
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      toast.error(apiErr.message || "Failed to generate post");
    } finally {
      setGeneratingPost(false);
    }
  };

  const handleCopyPost = async () => {
    if (!linkedinPost) return;
    try {
      await navigator.clipboard.writeText(linkedinPost);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShareOnLinkedIn = () => {
    if (!analysis?.repoUrl || !linkedinPost) return;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(analysis.repoUrl)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const filteredRepos = (repos || []).filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">GitHub Project Analyzer</h1>
          <p className="text-muted-foreground text-sm mt-1">See how recruiters evaluate and benchmark your code.</p>
        </div>

        {/* Layout Adjustment Controls */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 dark:bg-black/30 border border-border dark:border-white/10 text-xs text-muted-foreground">
          <span className="px-2 font-medium text-[11px] text-muted-foreground">Split:</span>
          <button
            type="button"
            onClick={() => {
              setIsLeftCollapsed(false);
              setLeftWidthPercent(25);
              localStorage.setItem("c2c_github_split_ratio", "25");
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition text-[11px]",
              !isLeftCollapsed && leftWidthPercent === 25
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                : "hover:text-foreground",
            )}
            title="Wide Workspace (25% Repos / 75% Analysis)"
          >
            Wide (75%)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLeftCollapsed(false);
              setLeftWidthPercent(33);
              localStorage.setItem("c2c_github_split_ratio", "33");
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition text-[11px]",
              !isLeftCollapsed && leftWidthPercent === 33
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                : "hover:text-foreground",
            )}
            title="Balanced Split (33% Repos / 67% Analysis)"
          >
            Balanced (67%)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLeftCollapsed(false);
              setLeftWidthPercent(50);
              localStorage.setItem("c2c_github_split_ratio", "50");
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition text-[11px]",
              !isLeftCollapsed && leftWidthPercent === 50
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                : "hover:text-foreground",
            )}
            title="Equal Split (50% Repos / 50% Analysis)"
          >
            Equal (50/50)
          </button>
          <div className="w-[1px] h-4 bg-border/60 dark:bg-white/10 my-auto" />
          <button
            type="button"
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={cn(
              "px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 text-[11px]",
              isLeftCollapsed
                ? "bg-indigo-600 text-white shadow-sm"
                : "hover:text-foreground",
            )}
            title={isLeftCollapsed ? "Restore Repository List" : "Focus Mode (Maximize Workspace)"}
          >
            {isLeftCollapsed ? (
              <>
                <PanelLeftOpen className="h-3.5 w-3.5" />
                <span>Show Repos</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Focus</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex flex-col lg:flex-row items-stretch relative"
      >
        {/* Left Column (Connection & Repository Navigator) */}
        {!isLeftCollapsed && (
          <div
            style={{
              width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftWidthPercent}%` : "100%",
            }}
            className="w-full space-y-4 shrink-0 transition-[width] duration-75 lg:pr-3"
          >
            <GlassCard className="space-y-4 overflow-hidden p-5">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Github className="h-4 w-4 text-[color:var(--color-primary)]" /> GitHub Connection
              </h3>
              {(() => {
                const isCurrentConnected = Boolean(
                  connected &&
                    githubProfile?.login &&
                    username.trim().toLowerCase() === githubProfile.login.toLowerCase(),
                );
                return (
                  <>
                    <div className="flex items-stretch gap-2 min-w-0 w-full">
                      <input
                        ref={inputRef}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="GitHub username"
                        disabled={connecting}
                        className="flex-1 min-w-0 glass-input rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] disabled:opacity-50"
                        onKeyDown={(e) =>
                          e.key === "Enter" && !isCurrentConnected && !connecting && username.trim() && handleConnect()
                        }
                      />
                      {isCurrentConnected ? (
                        <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shrink-0 whitespace-nowrap shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect()}
                          disabled={connecting || !username.trim()}
                          className="btn-gradient btn-gradient-hover rounded-xl px-3.5 py-2 text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap transition-transform active:scale-95 shadow-md"
                        >
                          {connecting ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                              <span>{leftWidthPercent <= 28 ? "..." : "Connecting..."}</span>
                            </>
                          ) : connected ? (
                            "Switch"
                          ) : (
                            "Connect"
                          )}
                        </button>
                      )}
                    </div>
                    {connected && githubProfile && (
                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 dark:bg-black/30 border border-border dark:border-white/10">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={githubProfile.avatar_url}
                            alt={githubProfile.login}
                            className="w-9 h-9 rounded-full border border-white/20 shrink-0"
                          />
                          <div className="text-xs min-w-0">
                            <p className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-semibold truncate">
                              <Check className="h-3.5 w-3.5 shrink-0" /> @{githubProfile.login}
                            </p>
                            <p className="text-muted-foreground">{githubProfile.public_repos} public repos</p>
                          </div>
                        </div>
                        {isCurrentConnected && (
                          <button
                            onClick={() => {
                              setUsername("");
                              setTimeout(() => inputRef.current?.focus(), 50);
                            }}
                            className="text-xs text-indigo-400 hover:text-white px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition flex items-center gap-1 font-medium shrink-0"
                            title="Switch GitHub Account"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Change</span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

            <div className="pt-2 border-t border-border dark:border-white/10">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                  <span>Repositories</span>
                  {repos.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-muted dark:bg-white/10 text-[10px] font-mono text-foreground font-normal">
                      {repos.length}
                    </span>
                  )}
                </h4>
                {connected && (
                  <button
                    onClick={() => fetchRepos()}
                    disabled={loadingRepos}
                    className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted dark:hover:bg-white/5 transition flex items-center gap-1"
                    title="Refresh repositories"
                  >
                    <RotateCw className={cn("h-3.5 w-3.5", loadingRepos && "animate-spin")} />
                  </button>
                )}
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search repositories..."
                  disabled={!connected}
                  className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none disabled:opacity-50"
                />
              </div>

              {loadingRepos ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-primary)]" />
                  <span className="text-xs">Fetching repositories...</span>
                </div>
              ) : (
                <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {filteredRepos.map((r) => (
                    <li key={r.full_name}>
                      <button
                        onClick={() => handleAnalyze(r.full_name)}
                        disabled={analyzing}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all text-xs group",
                          selectedRepo === r.full_name
                            ? "bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500 text-foreground font-medium shadow-sm ring-1 ring-indigo-500/30"
                            : "bg-muted/30 dark:bg-black/20 border-border dark:border-white/5 hover:border-indigo-500/40 hover:bg-muted/60 dark:hover:bg-white/5 text-foreground",
                          analyzing && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm truncate group-hover:text-[color:var(--color-primary)] transition-colors">
                            {r.name}
                          </span>
                          <span className="text-[11px] font-mono flex items-center gap-1 text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0">
                            <Star className="h-3 w-3 fill-amber-400" />
                            {r.stargazers_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-primary)]" />
                            {r.language || "Other"}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" /> {r.forks_count}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                  {connected && (filteredRepos || []).length === 0 && !loadingRepos && (
                    <li className="text-xs text-muted-foreground text-center py-8">
                      {query ? "No matching repositories found" : "No public repositories found"}
                    </li>
                  )}
                  {!connected && (
                    <li className="text-xs text-muted-foreground text-center py-8">
                      Connect your GitHub account above to view your repositories
                    </li>
                  )}
                </ul>
              )}

              <div className="mt-3 pt-3 border-t border-border dark:border-white/10">
                <button
                  onClick={() => {
                    setShowHistory(!showHistory);
                    setSelectedRepo(null);
                    setAnalysis(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 glass rounded-xl px-4 py-2.5 text-sm hover:bg-muted/60 dark:hover:bg-white/10 text-foreground transition"
                >
                  <History className="h-4 w-4" />
                  {showHistory ? "Hide History" : "Analysis History"}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

        {/* Desktop Draggable Resizer Bar */}
        {!isLeftCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "hidden lg:flex w-4 -ml-2 -mr-2 z-20 cursor-col-resize self-stretch items-center justify-center group touch-none select-none",
              isDragging && "pointer-events-auto",
            )}
            title="Drag to resize columns"
          >
            <div
              className={cn(
                "w-1 h-full rounded-full transition-all flex flex-col items-center justify-center gap-1 py-4",
                isDragging
                  ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] w-1.5"
                  : "bg-border/60 dark:bg-white/10 group-hover:bg-indigo-500/80 group-hover:w-1.5",
              )}
            >
              <div className="w-4 h-8 rounded-full bg-card dark:bg-[#131B2E] border border-border dark:border-white/20 shadow-md flex items-center justify-center">
                <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
              </div>
            </div>
          </div>
        )}

        {/* Right Column (Analysis Workspace) */}
        <div
          style={{
            width:
              typeof window !== "undefined" && window.innerWidth >= 1024 && !isLeftCollapsed
                ? `${100 - leftWidthPercent}%`
                : "100%",
          }}
          className="w-full space-y-6 flex-1 min-w-0 transition-[width] duration-75 lg:pl-3"
        >
          {showHistory && !selectedRepo && (
            <GlassCard>
              <h3 className="font-semibold mb-4">Analysis History</h3>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (history || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No analyses yet</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item._id}
                        className="glass rounded-xl p-3 flex items-center justify-between"
                      >
                        <button
                          onClick={() => handleViewAnalysis(item._id)}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm font-medium">{item.repoFullName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                item.status === "completed"
                                  ? "bg-green-500/20 text-green-300"
                                  : item.status === "processing"
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => setDeleteId(item._id)}
                          className="p-2 text-muted-foreground hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {historyPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                      <button
                        onClick={() => fetchHistory(historyPagination.page - 1)}
                        disabled={historyPagination.page <= 1}
                        className="text-xs glass rounded-lg px-3 py-1.5 hover:bg-white/10 disabled:opacity-30"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {historyPagination.page} / {historyPagination.totalPages}
                      </span>
                      <button
                        onClick={() => fetchHistory(historyPagination.page + 1)}
                        disabled={historyPagination.page >= historyPagination.totalPages}
                        className="text-xs glass rounded-lg px-3 py-1.5 hover:bg-white/10 disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </GlassCard>
          )}

          {analyzing && (
            <GlassCard variant="strong">
              <div className="flex flex-col items-center py-12 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[color:var(--color-primary)]" />
                <div className="text-center">
                  <p className="font-semibold">Analyzing repository...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fetching files and running AI analysis
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {loadingAnalysis && (
            <GlassCard variant="strong">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </GlassCard>
          )}

          {analysis && !analyzing && !loadingAnalysis && (
            <>
              <GlassCard variant="strong">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-border/50 dark:border-white/10">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="text-lg sm:text-xl font-bold break-all leading-snug text-foreground">
                      {analysis.repoFullName}
                    </h3>
                    <a
                      href={analysis.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground mt-1.5 inline-flex items-center gap-1.5 hover:text-[color:var(--color-primary)] break-all"
                    >
                      <span>{analysis.repoUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                        analysis.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : analysis.status === "processing"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {analysis.status}
                    </span>
                    <button
                      onClick={() => setDeleteId(analysis._id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Delete Analysis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {analysis.status === "completed" && (
                  <>
                    <div className="flex flex-wrap gap-2 mt-4 border-b border-white/10 pb-3">
                      {(["overview", "quality", "security", "resume", "linkedin"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTab(t)}
                          className={`text-xs px-3 py-1.5 rounded-lg capitalize ${tab === t ? "btn-gradient" : "glass hover:bg-white/10"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      {tab === "overview" && <Overview analysis={analysis} />}
                      {tab === "quality" && <Quality analysis={analysis} />}
                      {tab === "security" && <Security analysis={analysis} />}
                      {tab === "resume" && <ResumeImpact analysis={analysis} />}
                      {tab === "linkedin" && <LinkedInPost analysis={analysis} draft={linkedinPost} generating={generatingPost} onGenerate={handleGenerateLinkedInPost} onCopy={handleCopyPost} onShare={handleShareOnLinkedIn} copySuccess={copySuccess} />}
                    </div>
                  </>
                )}

                {analysis.status === "failed" && (
                  <div className="mt-4 glass rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-300">Analysis Failed</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analysis.errorMessage || "An unexpected error occurred"}
                      </p>
                    </div>
                  </div>
                )}

                {analysis.filesAnalyzed?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-muted-foreground mb-2">Files analyzed:</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.filesAnalyzed.map((f) => (
                        <span key={f} className="text-[10px] px-2 py-0.5 rounded-md glass">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>

              <div className="flex flex-wrap gap-3">
                {analysis.status === "failed" && selectedRepo && (
                  <button
                    onClick={() => handleAnalyze(selectedRepo)}
                    disabled={analyzing}
                    className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-1.5"
                  >
                    <RotateCw className="h-4 w-4" />
                    Retry Analysis
                  </button>
                )}
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setSelectedRepo(null);
                  }}
                  className={analysis.status === "failed" ? "glass rounded-xl px-5 py-2.5 text-sm hover:bg-white/10" : "btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold"}
                >
                  Analyze Another
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className="glass rounded-xl px-5 py-2.5 text-sm hover:bg-white/10"
                >
                  View History
                </button>
              </div>
            </>
          )}

          {!selectedRepo && !showHistory && !analyzing && (
            <div className="rounded-3xl p-6 sm:p-8 border border-border shadow-md dark:shadow-xl relative overflow-hidden space-y-6 glass-strong">
              {/* Subtle background grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
                    <Github className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight">
                      {connected ? "Ready to Audit Your Repositories" : "Recruiter GitHub Project Intelligence"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {connected
                        ? "Select any repository from the list on the left to start full code & README analysis."
                        : "Enter your GitHub username on the left to benchmark your code quality against placement standards."}
                    </p>
                  </div>
                </div>

                {/* 3 Core Value Pillars */}
                <div className="grid sm:grid-cols-3 gap-3.5 pt-2">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary/40 transition-all space-y-2">
                    <div className="p-2 rounded-xl bg-card text-primary w-fit border border-border shadow-sm">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Code & Architecture Audit</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Evaluates modularity, framework usage, cleanliness, and test coverage for hiring engineers.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-emerald-500/40 transition-all space-y-2">
                    <div className="p-2 rounded-xl bg-card text-emerald-600 dark:text-emerald-400 w-fit border border-border shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Security & API Health</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Checks for exposed secrets, unsafe dependencies, and proper environment variable setup.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary/40 transition-all space-y-2">
                    <div className="p-2 rounded-xl bg-card text-sky-600 dark:text-sky-400 w-fit border border-border shadow-sm">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Resume Impact & Posts</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Generates bullet points tailored for your resume and ready-to-share LinkedIn project drafts.
                    </p>
                  </div>
                </div>

                {/* Recruiter Trust Footnote */}
                <div className="p-3.5 rounded-2xl bg-muted/50 border border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    <span>10,000+ student repositories audited for campus placement drives</span>
                  </span>
                  <span className="text-primary font-semibold">100% Free & Open-Source Friendly</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm">
            <h3 className="font-semibold mb-2">Delete Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this analysis? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="glass rounded-xl px-4 py-2 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500/20 text-red-300 rounded-xl px-4 py-2 text-sm hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function Overview({ analysis }: { analysis: RepoAnalysis }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Project Summary
        </p>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {analysis.overview || "No overview available"}
        </p>
      </div>
      <div className="glass rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Repository Metadata
        </p>
        <div className="space-y-2">
          <Row k="Repository" v={analysis.repoFullName} />
          <Row k="Files Analyzed" v={String(analysis.filesAnalyzed?.length || 0)} />
          <Row k="Audit Date" v={new Date(analysis.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })} />
        </div>
      </div>
    </div>
  );
}

function Quality({ analysis }: { analysis: RepoAnalysis }) {
  // Handle both old (string) and new (object) format
  const qualityData = analysis.quality;
  
  if (typeof qualityData === 'string') {
    // Old format: simple string
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Code2 className="h-8 w-8 text-[color:var(--color-primary)]" />
          <div>
            <p className="text-sm font-semibold text-foreground">Code Quality Assessment</p>
            <p className="text-xs text-muted-foreground">Based on analyzed project architecture</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {qualityData || "No quality assessment available"}
          </p>
        </div>
      </div>
    );
  }
  
  // New format: comprehensive object
  if (qualityData && typeof qualityData === 'object') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Code2 className="h-8 w-8 text-[color:var(--color-primary)]" />
          <div>
            <p className="text-sm font-semibold text-foreground">Code Quality Assessment</p>
            <p className="text-xs text-muted-foreground">Based on analyzed project architecture</p>
          </div>
        </div>
        
        {qualityData.overallScore !== undefined && (
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Overall Quality Score</span>
              <span className="text-2xl font-bold text-[color:var(--color-primary)]">
                {qualityData.overallScore}/100
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${qualityData.overallScore}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-3">
          {qualityData.codeOrganization && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Code Organization</p>
              <p className="text-sm text-foreground">{qualityData.codeOrganization}</p>
            </div>
          )}
          
          {qualityData.readability && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Readability</p>
              <p className="text-sm text-foreground">{qualityData.readability}</p>
            </div>
          )}
          
          {qualityData.bestPractices && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Best Practices</p>
              <p className="text-sm text-foreground">{qualityData.bestPractices}</p>
            </div>
          )}
          
          {qualityData.documentation && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Documentation</p>
              <p className="text-sm text-foreground">{qualityData.documentation}</p>
            </div>
          )}
          
          {qualityData.testing && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Testing</p>
              <p className="text-sm text-foreground">{qualityData.testing}</p>
            </div>
          )}
        </div>
        
        {qualityData.strengths && qualityData.strengths.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-emerald-400 mb-2">✓ Strengths</p>
            <ul className="space-y-1.5">
              {qualityData.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {qualityData.improvements && qualityData.improvements.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-400 mb-2">⚡ Areas for Improvement</p>
            <ul className="space-y-1.5">
              {qualityData.improvements.map((improvement, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  // No data
  return (
    <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
      No quality assessment available
    </div>
  );
}

function Security({ analysis }: { analysis: RepoAnalysis }) {
  // Handle both old (string) and new (object) format
  const securityData = analysis.security;
  
  if (typeof securityData === 'string') {
    // Old format: simple string
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-[color:var(--color-success)]" />
          <div>
            <p className="text-sm font-semibold text-foreground">Security & API Health Assessment</p>
            <p className="text-xs text-muted-foreground">Vulnerability checks and secrets audit</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {securityData || "No security assessment available"}
          </p>
        </div>
      </div>
    );
  }
  
  // New format: comprehensive object
  if (securityData && typeof securityData === 'object') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-[color:var(--color-success)]" />
          <div>
            <p className="text-sm font-semibold text-foreground">Security & API Health Assessment</p>
            <p className="text-xs text-muted-foreground">Vulnerability checks and secrets audit</p>
          </div>
        </div>
        
        {securityData.overallRating && (
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overall Security Rating</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                securityData.overallRating === 'Excellent' ? 'bg-emerald-500/20 text-emerald-300' :
                securityData.overallRating === 'Good' ? 'bg-green-500/20 text-green-300' :
                securityData.overallRating === 'Fair' ? 'bg-amber-500/20 text-amber-300' :
                'bg-rose-500/20 text-rose-300'
              }`}>
                {securityData.overallRating}
              </span>
            </div>
          </div>
        )}
        
        {securityData.goodPractices && securityData.goodPractices.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-emerald-400 mb-2">✓ Security Strengths</p>
            <ul className="space-y-1.5">
              {securityData.goodPractices.map((practice, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {securityData.issues && securityData.issues.length > 0 && (
          <div className="glass rounded-2xl p-4 border border-rose-500/30">
            <p className="text-xs font-semibold text-rose-400 mb-2">⚠ Security Concerns</p>
            <ul className="space-y-1.5">
              {securityData.issues.map((issue, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {securityData.recommendations && securityData.recommendations.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-indigo-400 mb-2">💡 Recommendations</p>
            <ul className="space-y-1.5">
              {securityData.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  // No data
  return (
    <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
      No security assessment available
    </div>
  );
}

function ResumeImpact({ analysis }: { analysis: RepoAnalysis }) {
  const resumeData = analysis.resumeImpact;
  
  // Handle old format (array of strings)
  if (Array.isArray(resumeData)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-[color:var(--color-accent)]" />
          <div>
            <p className="text-sm font-semibold text-foreground">Resume Impact Bullets</p>
            <p className="text-xs text-muted-foreground">How this project strengthens your career resume</p>
          </div>
        </div>
        {resumeData.length > 0 ? (
          <div className="space-y-2.5">
            {resumeData.map((item, i) => (
              <div key={i} className="glass rounded-2xl p-3.5 border border-border/50 dark:border-white/10">
                <p className="text-sm leading-relaxed text-foreground">{item}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
            No resume impact data available
          </div>
        )}
      </div>
    );
  }
  
  // Handle new format (comprehensive object)
  if (resumeData && typeof resumeData === 'object') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-[color:var(--color-accent)]" />
          <div>
            <p className="text-sm font-semibold text-foreground">Resume & Interview Value</p>
            <p className="text-xs text-muted-foreground">How to present this project professionally</p>
          </div>
        </div>
        
        {resumeData.bullets && resumeData.bullets.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-indigo-400 mb-3">📝 Resume Bullet Points</p>
            <div className="space-y-2.5">
              {resumeData.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-indigo-400 mt-1">•</span>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {resumeData.interviewTalkingPoints && resumeData.interviewTalkingPoints.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-emerald-400 mb-3">💬 Interview Talking Points</p>
            <div className="space-y-2.5">
              {resumeData.interviewTalkingPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-emerald-400 mt-1">•</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {resumeData.uniqueSellingPoints && resumeData.uniqueSellingPoints.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-400 mb-3">⭐ Unique Selling Points</p>
            <div className="space-y-2.5">
              {resumeData.uniqueSellingPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {resumeData.improvementSuggestions && resumeData.improvementSuggestions.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-semibold text-sky-400 mb-3">💡 How to Make It More Impressive</p>
            <div className="space-y-2.5">
              {resumeData.improvementSuggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-sky-400 mt-1">•</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // No data
  return (
    <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
      No resume impact data available
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 py-1.5 border-b border-border/40 dark:border-white/5 last:border-b-0">
      <span className="text-xs text-muted-foreground shrink-0">{k}</span>
      <span className="font-medium text-xs break-all sm:text-right text-foreground max-w-full sm:max-w-[280px]">
        {v}
      </span>
    </div>
  );
}

function LinkedInPost({
  analysis,
  draft,
  generating,
  onGenerate,
  onCopy,
  onShare,
  copySuccess,
}: {
  analysis: RepoAnalysis;
  draft: string;
  generating: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onShare: () => void;
  copySuccess: boolean;
}) {
  const [editedDraft, setEditedDraft] = useState(draft);

  useEffect(() => {
    setEditedDraft(draft);
  }, [draft]);

  const hasDraft = editedDraft.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <svg className="h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        <div>
          <p className="text-sm font-semibold">LinkedIn Post Ideas</p>
          <p className="text-xs text-muted-foreground">Generate a post draft to share your project</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/60 dark:bg-slate-800/50 border border-border/60 rounded-lg p-3">
        <strong className="text-foreground">Note:</strong> This generates a draft for you to review and edit. 
        The &quot;Share on LinkedIn&quot; button opens LinkedIn&apos;s share dialog &mdash; 
        you must manually post from there. No automatic posting occurs.
      </p>

      {!hasDraft ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">Click "Generate Post" to create a LinkedIn draft based on your project analysis.</p>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {generating ? (
              <>
                <svg className="h-4 w-4 animate-spin inline-block mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              "Generate Post"
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            className="w-full glass-input rounded-xl p-3 text-sm min-h-[100px] resize-y outline-none"
            placeholder="Your LinkedIn post draft will appear here..."
            rows={4}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onCopy}
              disabled={!hasDraft}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                copySuccess 
                  ? "bg-green-500/20 text-green-300" 
                  : "glass hover:bg-white/10"
              } disabled:opacity-50`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              {copySuccess ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={onShare}
              disabled={!hasDraft || !analysis.repoUrl}
              className="bg-blue-500/20 text-blue-300 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-500/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
