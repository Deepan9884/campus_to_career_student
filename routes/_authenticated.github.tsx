import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
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

  const fetchRepos = useCallback(async () => {
    setLoadingRepos(true);
    try {
      const data = await listRepos();
      setRepos(data.repos);
    } catch {
      toast.error("Failed to load repositories");
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    try {
      const data = await getAnalysisHistory(page, 10);
      setHistory(data.analyses);
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

  const handleConnect = async () => {
    if (!username.trim()) return;
    setConnecting(true);
    try {
      const data = await connectGithub({ githubUsername: username.trim() });
      setConnected(true);
      setGithubProfile(data.github);
      if (data.user) {
        useAuth.setState((state) => ({
          user: state.user ? { ...state.user, ...data.user, githubUsername: data.user.githubUsername } : data.user,
        }));
      }
      fetchRepos();
      toast.success(`Connected as ${data.github.login}`);
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      toast.error(apiErr.message || "Failed to connect GitHub account");
    } finally {
      setConnecting(false);
    }
  };

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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">GitHub Project Analyzer</h1>
        <p className="text-muted-foreground text-sm mt-1">See how recruiters view your code.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <GlassCard>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Github className="h-4 w-4" /> GitHub Connection
          </h3>
          <div className="flex gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="GitHub username"
              disabled={connected}
              className="flex-1 glass-input rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] disabled:opacity-50"
              onKeyDown={(e) => e.key === "Enter" && !connected && handleConnect()}
            />
            <button
              onClick={handleConnect}
              disabled={connected || connecting || !username.trim()}
              className="btn-gradient btn-gradient-hover rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : connected ? (
                "Connected"
              ) : (
                "Connect"
              )}
            </button>
          </div>
          {connected && githubProfile && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={githubProfile.avatar_url}
                alt={githubProfile.login}
                className="w-8 h-8 rounded-full"
              />
              <div className="text-xs">
                <p className="text-[color:var(--color-success)] flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 shrink-0" /> Connected as {githubProfile.login}
                </p>
                <p className="text-muted-foreground">{githubProfile.public_repos} public repos</p>
              </div>
            </div>
          )}

          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mt-6 mb-2">
            Repositories
          </h4>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search repos"
              disabled={!connected}
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none disabled:opacity-50"
            />
          </div>
          {loadingRepos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-auto">
              {filteredRepos.map((r) => (
                <li key={r.full_name}>
                  <button
                    onClick={() => handleAnalyze(r.full_name)}
                    disabled={analyzing}
                    className={`w-full text-left p-3 rounded-xl transition ${selectedRepo === r.full_name ? "btn-gradient" : "glass hover:bg-white/10"} disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{r.name}</span>
                      <span className="text-xs flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {r.stargazers_count}
                      </span>
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                      {r.language || "N/A"} • {r.forks_count} forks
                    </div>
                  </button>
                </li>
              ))}
              {connected && (filteredRepos || []).length === 0 && !loadingRepos && (
                <li className="text-xs text-muted-foreground text-center py-4">No repositories found</li>
              )}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setSelectedRepo(null);
                setAnalysis(null);
              }}
              className="w-full flex items-center justify-center gap-2 glass rounded-xl px-4 py-2.5 text-sm hover:bg-white/10"
            >
              <History className="h-4 w-4" />
              {showHistory ? "Hide History" : "Analysis History"}
            </button>
          </div>
        </GlassCard>

        <div className="space-y-6">
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{analysis.repoFullName}</h3>
                    <a
                      href={analysis.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground mt-1 flex items-center gap-1 hover:text-[color:var(--color-primary)]"
                    >
                      {analysis.repoUrl} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        analysis.status === "completed"
                          ? "bg-green-500/20 text-green-300"
                          : analysis.status === "processing"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {analysis.status}
                    </span>
                    <button
                      onClick={() => setDeleteId(analysis._id)}
                      className="p-2 text-muted-foreground hover:text-red-400 transition"
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
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setSelectedRepo(null);
                  }}
                  className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold"
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
            <div className="rounded-3xl p-6 sm:p-8 border border-border dark:border-[#2F4B6B]/60 shadow-xl relative overflow-hidden space-y-6 bg-card dark:bg-[#111827] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(27,39,64,0.9)_0%,rgba(17,24,39,0.96)_60%,rgba(8,13,24,1)_100%)]">
              {/* Subtle background grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-15"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(47,75,107,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(47,75,107,0.3) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 dark:bg-gradient-to-br dark:from-[#1B2740] dark:to-[#111827] border border-border dark:border-[#2F4B6B] text-indigo-600 dark:text-indigo-400 shadow-sm">
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
                  <div className="p-4 rounded-2xl bg-muted/40 dark:bg-[#080D18]/80 border border-border dark:border-[#2F4B6B]/50 hover:border-indigo-500/40 transition-all space-y-2">
                    <div className="p-2 rounded-xl bg-card dark:bg-[#1B2740] text-indigo-600 dark:text-indigo-400 w-fit border border-border dark:border-[#2F4B6B]/60 shadow-sm">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Code & Architecture Audit</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Evaluates modularity, framework usage, cleanliness, and test coverage for hiring engineers.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 dark:bg-[#080D18]/80 border border-border dark:border-[#2F4B6B]/50 hover:border-indigo-500/40 transition-all space-y-2">
                    <div className="p-2 rounded-xl bg-card dark:bg-[#1B2740] text-emerald-600 dark:text-emerald-400 w-fit border border-border dark:border-[#2F4B6B]/60 shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Security & API Health</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Checks for exposed secrets, unsafe dependencies, and proper environment variable setup.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 dark:bg-[#080D18]/80 border border-border dark:border-[#2F4B6B]/50 hover:border-indigo-500/40 transition-all space-y-2">
                    <div className="p-2 rounded-xl bg-card dark:bg-[#1B2740] text-sky-600 dark:text-blue-400 w-fit border border-border dark:border-[#2F4B6B]/60 shadow-sm">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground">Resume Impact & Posts</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Generates bullet points tailored for your resume and ready-to-share LinkedIn project drafts.
                    </p>
                  </div>
                </div>

                {/* Recruiter Trust Footnote */}
                <div className="p-3.5 rounded-2xl bg-muted/50 dark:bg-[#131B2E]/60 border border-border dark:border-[#2F4B6B]/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    <span>10,000+ student repositories audited for campus placement drives</span>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">100% Free & Open-Source Friendly</span>
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
      <div className="glass rounded-xl p-4">
        <p className="text-xs text-muted-foreground">Summary</p>
        <p className="text-sm mt-2 whitespace-pre-wrap">
          {analysis.overview || "No overview available"}
        </p>
      </div>
      <div className="glass rounded-xl p-4 space-y-2 text-sm">
        <Row k="Repository" v={analysis.repoFullName} />
        <Row k="Files analyzed" v={String(analysis.filesAnalyzed?.length || 0)} />
        <Row k="Created" v={new Date(analysis.createdAt).toLocaleDateString()} />
      </div>
    </div>
  );
}

function Quality({ analysis }: { analysis: RepoAnalysis }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Code2 className="h-8 w-8 text-[color:var(--color-primary)]" />
        <div>
          <p className="text-sm font-semibold">Code Quality Assessment</p>
          <p className="text-xs text-muted-foreground">Based on files analyzed</p>
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <p className="text-sm whitespace-pre-wrap">
          {analysis.quality || "No quality assessment available"}
        </p>
      </div>
    </div>
  );
}

function Security({ analysis }: { analysis: RepoAnalysis }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-[color:var(--color-success)]" />
        <div>
          <p className="text-sm font-semibold">Security Assessment</p>
          <p className="text-xs text-muted-foreground">Based on files analyzed</p>
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <p className="text-sm whitespace-pre-wrap">
          {analysis.security || "No security assessment available"}
        </p>
      </div>
    </div>
  );
}

function ResumeImpact({ analysis }: { analysis: RepoAnalysis }) {
  const impacts = analysis.resumeImpact;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Briefcase className="h-8 w-8 text-[color:var(--color-accent)]" />
        <div>
          <p className="text-sm font-semibold">Resume Impact</p>
          <p className="text-xs text-muted-foreground">How this project strengthens your resume</p>
        </div>
      </div>
      {impacts && (impacts || []).length > 0 ? (
        <div className="space-y-2">
          {impacts.map((item, i) => (
            <div key={i} className="glass rounded-xl p-3">
              <p className="text-sm">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-4 text-sm text-muted-foreground">
          No resume impact data available
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
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

      <p className="text-xs text-muted-foreground bg-slate-800/50 rounded-lg p-3">
        <strong>Note:</strong> This generates a draft for you to review and edit. 
        The "Share on LinkedIn" button opens LinkedIn&apos;s share dialog — 
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
