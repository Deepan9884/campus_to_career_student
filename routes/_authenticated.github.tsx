import { createFileRoute, Link } from "@tanstack/react-router";
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
  Share2,
  Copy,
  Download,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  ArrowUpRight,
  Tag,
  Eye,
  FileText,
  Info,
  Linkedin,
  Wand2,
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
  type LinkedInPostResult,
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
  const [linkedinResult, setLinkedinResult] = useState<LinkedInPostResult | null>(null);
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

  const fetchRepos = useCallback(async (targetUsername?: string) => {
    setLoadingRepos(true);
    try {
      const data = await listRepos(targetUsername);
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
    setRepos([]); // Clear previous repos immediately
    setSelectedRepo(null);
    setAnalysis(null);
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
      await fetchRepos(data.github.login);
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
      connectGithub({ githubUsername: handle })
        .then((res) => {
          setConnected(true);
          setGithubProfile(res.github);
          setUsername(res.github.login);
          fetchRepos(res.github.login);
        })
        .catch(() => {
          fetchRepos(handle);
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
      const techList: string[] = [];
      if (Array.isArray(analysis.primaryTechStack)) techList.push(...analysis.primaryTechStack);
      if (analysis.technicalSkills?.languages) techList.push(...analysis.technicalSkills.languages);
      if (analysis.technicalSkills?.frameworks) techList.push(...analysis.technicalSkills.frameworks);
      const uniqueTech = Array.from(new Set(techList.filter(Boolean)));

      const result = await generateLinkedInPost({
        repoFullName: analysis.repoFullName,
        overview: analysis.overview || "",
        quality: analysis.quality || "",
        resumeImpact: analysis.resumeImpact || [],
        techStack: uniqueTech.length > 0 ? uniqueTech : undefined,
        repoUrl: analysis.repoUrl,
      });
      setLinkedinResult(result);
      setLinkedinPost(result.draft);
      toast.success("LinkedIn post draft generated!");
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      toast.error(apiErr.message || "Failed to generate post");
    } finally {
      setGeneratingPost(false);
    }
  };

  const handleCopyPost = async (textToCopy?: string) => {
    const text = textToCopy || linkedinPost;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast.success("Post draft copied to clipboard!");
    } catch {
      toast.error("Failed to copy post text");
    }
  };

  const handleShareOnLinkedIn = async (textToShare?: string) => {
    const text = textToShare || linkedinPost;
    if (!analysis?.repoUrl || !text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Post draft copied to clipboard! Paste (Ctrl+V) into LinkedIn compose box.");
    } catch {
      toast.info("Opening LinkedIn... Please copy your draft text!");
    }
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
            <GlassCard data-tour="github-connection-card" className="space-y-4 overflow-hidden p-5">
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
                            <p
                              className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-semibold truncate"
                              title={`@${githubProfile.login}`}
                            >
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">@{githubProfile.login}</span>
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
                    onClick={() => fetchRepos(githubProfile?.login || username)}
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
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                item.status === "completed"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
                                  : item.status === "processing"
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35"
                                    : "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30"
                              }`}
                            >
                              {item.status === "processing" ? "Processing..." : item.status}
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
                      {tab === "linkedin" && <LinkedInPost analysis={analysis} draft={linkedinPost} result={linkedinResult} generating={generatingPost} onGenerate={handleGenerateLinkedInPost} onCopy={handleCopyPost} onShare={handleShareOnLinkedIn} copySuccess={copySuccess} />}
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

function toUnicodeBold(text: string): string {
  return text
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d400 + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d41a + code - 97);
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ce + code - 48);
      return c;
    })
    .join("");
}

function generateRepoSocialCard(
  analysis: RepoAnalysis,
  userName: string,
  targetRole?: string,
): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Dark futuristic background
  const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGradient.addColorStop(0, "#080c14");
  bgGradient.addColorStop(0.5, "#0d172a");
  bgGradient.addColorStop(1, "#0a1120");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1200, 630);

  // 2. Glow orbs
  const orb1 = ctx.createRadialGradient(250, 140, 10, 250, 140, 420);
  orb1.addColorStop(0, "rgba(59, 130, 246, 0.4)");
  orb1.addColorStop(1, "transparent");
  ctx.fillStyle = orb1;
  ctx.fillRect(0, 0, 1200, 630);

  const orb2 = ctx.createRadialGradient(980, 480, 10, 980, 480, 450);
  orb2.addColorStop(0, "rgba(147, 51, 234, 0.35)");
  orb2.addColorStop(1, "transparent");
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, 1200, 630);

  // 3. Subtle outer border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 570);

  // 4. Badges Header
  ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
  ctx.strokeStyle = "rgba(96, 165, 250, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(70, 70, 390, 42, 21);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 15px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#93c5fd";
  ctx.fillText("⚡ CAMPUS TO CAREER AI • REPO AUDIT", 92, 97);

  const scoreText =
    typeof analysis.quality === "object" && analysis.quality?.overallScore
      ? `CODE SCORE: ${analysis.quality.overallScore}/100`
      : "VERIFIED OPEN SOURCE";
  ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
  ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(830, 70, 300, 42, 21);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 15px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#6ee7b7";
  ctx.fillText(scoreText, 855, 97);

  // 5. Main Title (Repo Full Name)
  ctx.font = "bold 44px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  const repoName = analysis.repoFullName || "Software Project";
  const truncatedTitle = repoName.length > 36 ? repoName.slice(0, 34) + "..." : repoName;
  ctx.fillText(truncatedTitle, 70, 205);

  // 6. Subtitle & Stats
  const stars = analysis.repoStats?.stars || 0;
  const forks = analysis.repoStats?.forks || 0;
  const subtitle = `⭐ ${stars} Stars  •  🍴 ${forks} Forks  •  Production-grade Architecture`;
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(subtitle, 70, 250);

  // 7. Middle Glass Panel: Key Highlights
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(70, 285, 1060, 160, 16);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 16px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("ARCHITECTURE & ENGINEERING HIGHLIGHTS", 95, 322);

  const rawOverview =
    analysis.overview ||
    (typeof analysis.quality === "object" && analysis.quality?.codeOrganization) ||
    "Clean modular architecture with robust error handling and high-efficiency performance.";
  const cleanOverview = rawOverview.replace(/[\n\r]+/g, " ");
  const overviewQuote = cleanOverview.length > 175 ? cleanOverview.slice(0, 170) + "..." : cleanOverview;

  ctx.font = "italic 19px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`"${overviewQuote}"`, 95, 365);

  // 8. Tech Stack Pills
  const techList: string[] = [];
  if (Array.isArray(analysis.primaryTechStack)) techList.push(...analysis.primaryTechStack);
  if (analysis.technicalSkills?.languages) techList.push(...analysis.technicalSkills.languages);
  if (analysis.technicalSkills?.frameworks) techList.push(...analysis.technicalSkills.frameworks);
  const uniqueTech = Array.from(new Set(techList.filter(Boolean))).slice(0, 5);
  if (uniqueTech.length === 0) uniqueTech.push("JavaScript", "TypeScript", "React", "Node.js");

  let startX = 70;
  uniqueTech.forEach((tech) => {
    ctx.fillStyle = "rgba(99, 102, 241, 0.22)";
    ctx.strokeStyle = "rgba(129, 140, 248, 0.4)";
    ctx.lineWidth = 1;
    const pillWidth = Math.max(100, tech.length * 13 + 32);
    ctx.beginPath();
    ctx.roundRect(startX, 485, pillWidth, 40, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = "600 15px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#c7d2fe";
    ctx.fillText(tech, startX + 16, 510);
    startX += pillWidth + 14;
  });

  // 9. Author Footer
  ctx.font = "bold 21px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  const displayAuthor = userName || "Software Engineer";
  ctx.fillText(displayAuthor, 860, 530);

  ctx.font = "14px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText(targetRole || "Campus to Career AI Developer", 860, 555);

  return canvas.toDataURL("image/png");
}

function LinkedInPost({
  analysis,
  draft,
  result,
  generating,
  onGenerate,
  onCopy,
  onShare,
  copySuccess,
}: {
  analysis: RepoAnalysis;
  draft: string;
  result: LinkedInPostResult | null;
  generating: boolean;
  onGenerate: () => void;
  onCopy: (text?: string) => void;
  onShare: (text?: string) => void;
  copySuccess: boolean;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"story" | "technical" | "executive" | "achievement">("story");
  const [editedDraft, setEditedDraft] = useState(draft);
  const [graphicPreview, setGraphicPreview] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "editor">("preview");
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (result) {
      if (activeTab === "story") {
        setEditedDraft(result.draft || draft);
      } else if (activeTab === "technical") {
        const tech = result.variations?.find((v) => v.style.toLowerCase().includes("tech"))?.content || result.variations?.[1]?.content || result.draft;
        setEditedDraft(tech || draft);
      } else if (activeTab === "executive") {
        const exec = result.variations?.find((v) => v.style.toLowerCase().includes("exec"))?.content || result.variations?.[2]?.content || result.draft;
        setEditedDraft(exec || draft);
      } else if (activeTab === "achievement") {
        setEditedDraft(result.achievementParagraph || result.draft || draft);
      }
    } else {
      setEditedDraft(draft);
    }
  }, [activeTab, draft, result]);

  // Generate graphic on mount or analysis change
  useEffect(() => {
    if (analysis) {
      const cardUrl = generateRepoSocialCard(analysis, user?.name || "Software Engineer", user?.profile?.targetRole || "Full Stack Developer");
      if (cardUrl) setGraphicPreview(cardUrl);
    }
  }, [analysis, user]);

  const hasDraft = editedDraft.trim().length > 0;

  const handleInsertBold = () => {
    const textarea = document.getElementById("linkedin-github-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedDraft.slice(start, end);
    if (!selectedText) {
      toast.info("Select text in the editor first to make it bold");
      return;
    }
    const bolded = toUnicodeBold(selectedText);
    const updated = editedDraft.slice(0, start) + bolded + editedDraft.slice(end);
    setEditedDraft(updated);
    toast.success("Converted selection to Bold Unicode!");
  };

  const handleInsertHashtag = (tag: string) => {
    const formattedTag = tag.startsWith("#") ? tag : `#${tag}`;
    if (!editedDraft.includes(formattedTag)) {
      setEditedDraft((prev) => `${prev.trim()}\n\n${formattedTag}`);
    }
  };

  const handleShareClick = () => {
    onShare(editedDraft);
    setShowShareModal(true);
  };

  const hashtags = result?.suggestedHashtags?.length
    ? result.suggestedHashtags
    : ["#SoftwareEngineering", "#FullStack", "#React", "#OpenSource", "#WebDev", "#Coding"];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Linkedin className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              LinkedIn Showcase Creator
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI Powered
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Generate recruiter-optimized post drafts and high-res social graphics for this project
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasDraft && (
            <Link
              to="/linkedin-posts"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/60 hover:bg-muted text-foreground border border-border/50 transition flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Full Creator Studio
            </Link>
          )}

          <button
            onClick={onGenerate}
            disabled={generating}
            className="btn-gradient btn-gradient-hover rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Post...
              </>
            ) : hasDraft ? (
              <>
                <RotateCw className="h-3.5 w-3.5" />
                Regenerate AI Post
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" />
                Generate LinkedIn Post
              </>
            )}
          </button>
        </div>
      </div>

      {!hasDraft && !generating ? (
        <div className="text-center py-12 glass rounded-2xl p-6 border border-border/40">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/20">
            <Linkedin className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-foreground">No LinkedIn draft generated yet</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-5">
            Click "Generate LinkedIn Post" to turn your code analysis, complexity metrics, and quality ratings into a viral, recruiter-focused LinkedIn post.
          </p>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg shadow-blue-500/20"
          >
            Generate Post Draft Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Post Style Variation Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Style:</span>
              <button
                type="button"
                onClick={() => setActiveTab("story")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  activeTab === "story"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "hover:bg-muted/60 text-muted-foreground",
                )}
              >
                🚀 Story &amp; Hook
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("technical")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  activeTab === "technical"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "hover:bg-muted/60 text-muted-foreground",
                )}
              >
                🛠️ Deep Technical
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("executive")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  activeTab === "executive"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "hover:bg-muted/60 text-muted-foreground",
                )}
              >
                ⚡ Executive Summary
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("achievement")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  activeTab === "achievement"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "hover:bg-muted/60 text-muted-foreground",
                )}
              >
                🏆 Achievement Highlight
              </button>
            </div>

            {/* Toggle Preview vs Editor */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1",
                  viewMode === "preview"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Eye className="h-3 w-3" />
                LinkedIn Preview
              </button>
              <button
                type="button"
                onClick={() => setViewMode("editor")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1",
                  viewMode === "editor"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Edit3 className="h-3 w-3" />
                Edit Text
              </button>
            </div>
          </div>

          {/* Editor or Live Preview Card */}
          {viewMode === "editor" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInsertBold}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-muted hover:bg-muted/80 border border-border/50 text-foreground transition"
                    title="Highlight text first, then click to make bold Unicode"
                  >
                    𝗕 Bold
                  </button>
                  <span className="text-[11px] text-muted-foreground">Select text and click Bold to format</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {editedDraft.length} chars • {editedDraft.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <textarea
                id="linkedin-github-textarea"
                value={editedDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
                className="w-full glass-input rounded-2xl p-4 text-xs md:text-sm min-h-[220px] resize-y outline-none font-sans leading-relaxed text-foreground border border-border/60 focus:border-blue-500/50"
                placeholder="Your LinkedIn post draft will appear here..."
                rows={9}
              />
            </div>
          ) : (
            /* Real LinkedIn Feed Post Card Mockup */
            <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-slate-900/90 shadow-md p-4 space-y-3">
              {/* Author Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "ME"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {user?.name || "Software Developer"}
                      <span className="text-[10px] text-muted-foreground font-normal">• 1st</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {user?.profile?.targetRole || "Software Engineer"} • Campus to Career AI
                    </p>
                    <p className="text-[10px] text-muted-foreground">Just now • 🌐</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Feed Preview
                </span>
              </div>

              {/* Formatted Post Text with Paragraphs */}
              <div className="text-xs md:text-sm text-foreground whitespace-pre-line leading-relaxed font-normal pt-1 border-t border-border/20">
                {editedDraft}
              </div>

              {/* Graphic Banner Attachment Card */}
              {graphicPreview && (
                <div className="rounded-xl overflow-hidden border border-border/50 bg-black/40 mt-3 relative group">
                  <img
                    src={graphicPreview}
                    alt="LinkedIn Project Showcase Graphic"
                    className="w-full max-h-72 object-cover"
                  />
                  <div className="absolute top-3 right-3 opacity-90 group-hover:opacity-100 transition">
                    <a
                      href={graphicPreview}
                      download={`${analysis.repoFullName.replace("/", "-")}-linkedin-card.png`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-black/80 hover:bg-black text-white border border-white/20 shadow-lg flex items-center gap-1.5 backdrop-blur-md"
                    >
                      <Download className="h-3.5 w-3.5 text-blue-400" />
                      Download Graphic
                    </a>
                  </div>
                </div>
              )}

              {/* GitHub Link Preview Card */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Github className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{analysis.repoFullName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{analysis.repoUrl}</p>
                  </div>
                </div>
                <a
                  href={analysis.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  View Repo <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Hashtag Suggestions */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                <Tag className="h-3 w-3 text-blue-400" />
                Add Hashtags:
              </span>
              {hashtags.map((tag, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInsertHashtag(tag)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 transition"
                  title="Click to add to post"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Clear Sharing Instructions Box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0 text-amber-500" />
              <span>How LinkedIn Sharing Works (Important)</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
              LinkedIn&apos;s web security policy only links your GitHub card and doesn&apos;t allow websites to auto-populate text. When you click <strong>&quot;Copy &amp; Open LinkedIn&quot;</strong> below, your formatted multi-paragraph post is <strong>automatically copied to your clipboard</strong>. Simply press <strong>Ctrl + V</strong> (Paste) into LinkedIn&apos;s compose dialog!
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <button
              type="button"
              onClick={() => onCopy(editedDraft)}
              className={cn(
                "py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border",
                copySuccess
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-muted/80 hover:bg-muted text-foreground border-border/60",
              )}
            >
              {copySuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Post Text
                </>
              )}
            </button>

            {graphicPreview && (
              <a
                href={graphicPreview}
                download={`${analysis.repoFullName.replace("/", "-")}-linkedin-card.png`}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition flex items-center justify-center gap-2 text-center"
              >
                <Download className="h-4 w-4" />
                Download Graphic Card
              </a>
            )}

            <button
              type="button"
              onClick={handleShareClick}
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0a66c2] hover:bg-[#084e96] text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 sm:col-span-1"
            >
              <Share2 className="h-4 w-4" />
              Copy &amp; Open LinkedIn
            </button>
          </div>
        </div>
      )}

      {/* Interactive LinkedIn Post Guidance Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card dark:bg-slate-900 border border-border/80 dark:border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0a66c2] text-white shadow-md shadow-blue-500/20">
                  <Linkedin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Ready to Post on LinkedIn!</h3>
                  <p className="text-xs text-muted-foreground">3 Quick steps to publish your project showcase</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Text Copied */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-300">1. Full Post Text is on Your Clipboard!</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All paragraphs, emoji, and hashtags are copied and ready to paste.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(editedDraft);
                  toast.success("Post text copied again!");
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition shrink-0"
              >
                Copy Again
              </button>
            </div>

            {/* Step 2: Download Social Graphic */}
            {graphicPreview && (
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-300">2. Branded 1200x630 Graphic Banner</p>
                    <p className="text-[11px] text-muted-foreground">Click below to download and attach to LinkedIn photo</p>
                  </div>
                </div>
                <a
                  href={graphicPreview}
                  download={`${analysis.repoFullName.replace("/", "-")}-linkedin-card.png`}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shrink-0 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            )}

            {/* Step 3: Paste in LinkedIn */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
              <p className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <span>👉 3. Paste into LinkedIn Dialog</span>
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                In the opened LinkedIn composer dialog, click into the <strong>&quot;Share your thoughts...&quot;</strong> box and press:
              </p>
              <div className="flex items-center justify-center gap-2 py-1.5">
                <kbd className="px-3 py-1.5 bg-muted border border-border text-foreground font-mono font-bold text-xs rounded-xl shadow-xs">
                  Ctrl
                </kbd>
                <span className="text-xs font-bold text-muted-foreground">+</span>
                <kbd className="px-3 py-1.5 bg-muted border border-border text-foreground font-mono font-bold text-xs rounded-xl shadow-xs">
                  V
                </kbd>
                <span className="text-xs text-muted-foreground ml-2">(or Right-Click &rarr; Paste)</span>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition"
              >
                Close Guide
              </button>

              <button
                type="button"
                onClick={() => {
                  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(analysis.repoUrl)}`;
                  window.open(shareUrl, "_blank", "noopener,noreferrer");
                }}
                className="btn-gradient btn-gradient-hover px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Launch LinkedIn Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
