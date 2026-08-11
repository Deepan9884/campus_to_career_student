import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Linkedin, Loader2, Copy, Share2, ExternalLink, Github } from "lucide-react";
import { toast } from "sonner";
import { getAnalysisHistory, getAnalysisById, generateLinkedInPost } from "@/lib/github-api";
import { useAuth } from "@/stores";
import type { AnalysisHistoryItem } from "@/types/github";

export const Route = createFileRoute("/_authenticated/linkedin-posts")({
  head: () => ({ meta: [{ title: "LinkedIn Post Ideas — CareerForge AI" }] }),
  component: LinkedInPostsPage,
});

function LinkedInPostsPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getAnalysisHistory(page, 10);
      setHistory(data.analyses);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const handleGeneratePost = async (analysis: AnalysisHistoryItem) => {
    setGenerating((prev) => ({ ...prev, [analysis._id]: true }));
    try {
      const detail = await getAnalysisById(analysis._id);
      
      const result = await generateLinkedInPost({
        repoFullName: detail.repoFullName,
        overview: detail.overview || "",
        quality: detail.quality || "",
        resumeImpact: detail.resumeImpact || [],
        repoUrl: detail.repoUrl,
      });

      setDrafts((prev) => ({ ...prev, [analysis._id]: result.draft }));
      toast.success("Post draft generated");
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      toast.error(apiErr.message || "Failed to generate post");
    } finally {
      setGenerating((prev) => ({ ...prev, [analysis._id]: false }));
    }
  };

  const handleCopy = async (draft: string, id: string) => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = (repoUrl: string, draft: string) => {
    if (!repoUrl || !draft) return;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(repoUrl)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Linkedin className="h-7 w-7 text-blue-400" />
          LinkedIn Post Ideas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate and share LinkedIn posts for your analyzed GitHub projects.
        </p>
      </div>

      {history.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Linkedin className="h-12 w-12 mx-auto text-slate-600" />
          <p className="text-sm text-muted-foreground mt-4">
            No GitHub analyses yet. <span className="text-[color:var(--color-primary)] hover:underline cursor-pointer">Analyze a repository</span> to get started.
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="space-y-4">
            {history.map((analysis) => {
              const draft = drafts[analysis._id];
              const isGenerating = generating[analysis._id];
              const showCopySuccess = copySuccess === analysis._id;

              return (
                <GlassCard key={analysis._id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Github className="h-5 w-5 text-muted-foreground" />
                        <a
                          href={`https://github.com/${analysis.repoFullName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold hover:text-[color:var(--color-primary)] truncate block"
                        >
                          {analysis.repoFullName}
                        </a>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                            analysis.status === "completed"
                              ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30"
                              : analysis.status === "processing"
                              ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {analysis.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-8">
                        Analyzed {new Date(analysis.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {!draft ? (
                      <button
                        onClick={() => handleGeneratePost(analysis)}
                        disabled={isGenerating}
                        className="btn-gradient btn-gradient-hover rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 shrink-0"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                            Generating...
                          </>
                        ) : (
                          "Generate Post"
                        )}
                      </button>
                    ) : (
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(draft, analysis._id)}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${
                            showCopySuccess
                              ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "glass hover:bg-foreground/5"
                          }`}
                        >
                          <Copy className="h-4 w-4" />
                          {showCopySuccess ? "Copied!" : "Copy"}
                        </button>
                        <button
                          onClick={() => handleShare(`https://github.com/${analysis.repoFullName}`, draft)}
                          className="bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-blue-500/25 transition flex items-center gap-2"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                      </div>
                    )}
                  </div>

                  {draft && (
                    <div className="mt-4 pt-4 border-t border-foreground/10">
                      <textarea
                        value={draft}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [analysis._id]: e.target.value }))}
                        className="w-full glass-input rounded-xl p-3 text-sm min-h-[80px] resize-y outline-none"
                        placeholder="Your LinkedIn post draft..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Edit freely. The "Share" button opens LinkedIn&apos;s share dialog with your repo URL — you post manually.
                      </p>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => fetchHistory(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="text-xs glass rounded-lg px-3 py-1.5 hover:bg-white/10 disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchHistory(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="text-xs glass rounded-lg px-3 py-1.5 hover:bg-white/10 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}