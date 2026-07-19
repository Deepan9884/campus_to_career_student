import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/GlassCard";
import { ScoreRing } from "@/components/Score";
import { SubTopicProgress } from "@/components/SubTopicProgress";
import { TargetRoleSelect } from "@/components/TargetRoleSelect";
import {
  X,
  Plus,
  TrendingUp,
  Loader2,
  Trash2,
  History,
  Lightbulb,
  FileText,
  Github,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  addSkill,
  getCurrentSkills,
  deleteSkill,
  getSuggestions,
  analyzeGap,
  getGapHistory,
  getGapById,
  deleteGapAnalysis,
} from "@/lib/skills-api";
import { useAuth } from "@/stores";
import { getRoadmapByGapAnalysis } from "@/lib/roadmap-api";
import type { UserSkill, Suggestion, SkillGapAnalysis, AnalysisHistoryItem } from "@/types/skills";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({ meta: [{ title: "Skill Gap — CareerForge AI" }] }),
  component: SkillsPage,
});

function SkillsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [targetRole, setTargetRole] = useState(user?.profile?.targetRole || user?.targetRole || "");
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "expert">(
    "intermediate",
  );

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);
  const [quizPassTick, setQuizPassTick] = useState(0);
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const data = await getCurrentSkills();
      setSkills(data.skills);
    } catch {
      toast.error("Failed to load skills");
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoadingHistory(true);
    try {
      const data = await getGapHistory(page, 10);
      setHistory(data.analyses);
      setHistoryPagination(data.pagination);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  useEffect(() => {
    if (showHistory) {
      fetchHistory(1);
    }
  }, [showHistory, fetchHistory]);

  useEffect(() => {
    if (quizPassTick > 0 && analysis?._id) {
      handleViewAnalysis(analysis._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizPassTick]);

  const handleAddSkill = async () => {
    if (!input.trim()) return;
    try {
      const created = await addSkill({ name: input.trim(), level });
      setSkills((prev) => {
        const idx = prev.findIndex((s) => s.name.toLowerCase() === created.name.toLowerCase());
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = created;
          return updated;
        }
        return [created, ...prev];
      });
      setInput("");
      toast.success(`Added ${created.name}`);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      toast.error(apiErr.message || "Failed to add skill");
    }
  };

  const handleDeleteSkill = async () => {
    if (!deleteSkillId) return;
    try {
      await deleteSkill(deleteSkillId);
      setSkills((prev) => prev.filter((s) => s._id !== deleteSkillId));
      toast.success("Skill removed");
    } catch {
      toast.error("Failed to delete skill");
    } finally {
      setDeleteSkillId(null);
    }
  };

  const handleGetSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await getSuggestions(targetRole);
      setSuggestions(data.suggestions);
      if (data.suggestions.length === 0) {
        toast.info("No new suggestions found");
      }
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: Suggestion) => {
    try {
      const created = await addSkill({ name: suggestion.name, level: "beginner" });
      setSkills((prev) => [created, ...prev]);
      setSuggestions((prev) => prev.filter((s) => s !== suggestion));
      toast.success(`Added ${created.name} (beginner) — edit level anytime`);
    } catch {
      toast.error("Failed to add skill");
    }
  };

  const handleAnalyze = async () => {
    if (!targetRole) return;
    setAnalyzing(true);
    setAnalysis(null);
    setShowHistory(false);
    try {
      const result = await analyzeGap({ targetRole });
      setAnalysis(result);
      toast.success("Analysis complete");
    } catch (err: unknown) {
      const apiErr = err as { statusCode?: number; message?: string };
      if (apiErr.statusCode === 429) {
        toast.error(apiErr.message || "Too many requests");
      } else {
        toast.error(apiErr.message || "Analysis failed");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewAnalysis = async (id: string) => {
    setShowHistory(false);
    setLinkedRoadmapId(null);
    try {
      const result = await getGapById(id);
      setAnalysis(result);
      setTargetRole(result.targetRole);
      const roadmap = await getRoadmapByGapAnalysis(id);
      setLinkedRoadmapId(roadmap?._id || null);
    } catch {
      toast.error("Failed to load analysis");
    }
  };

  const handleDeleteAnalysis = async () => {
    if (!deleteId) return;
    try {
      await deleteGapAnalysis(deleteId);
      toast.success("Analysis deleted");
      setHistory((prev) => prev.filter((a) => a._id !== deleteId));
      setHistoryPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      if (analysis?._id === deleteId) {
        setAnalysis(null);
      }
    } catch {
      toast.error("Failed to delete analysis");
    } finally {
      setDeleteId(null);
    }
  };

  const coreGaps = analysis?.gaps.filter((g) => g.importance === "core") || [];
  const niceGaps = analysis?.gaps.filter((g) => g.importance === "nice-to-have") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Skill Gap Analyzer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find the exact gap between you and your target role.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <div className="space-y-6 relative z-10">
          <GlassCard className="relative z-30">
            <h3 className="font-semibold mb-3">Your Current Skills</h3>
            {loadingSkills ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((s) => (
                  <span
                    key={s._id}
                    className="text-xs px-3 py-1.5 rounded-full glass flex items-center gap-1.5"
                  >
                    {s.name}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">
                      {s.level}
                    </span>
                    <button onClick={() => setDeleteSkillId(s._id)} className="hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {skills.length === 0 && (
                  <p className="text-xs text-muted-foreground">No skills added yet</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                placeholder="Add a skill..."
                className="flex-1 glass-input rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
              />
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as typeof level)}
                className="glass-input rounded-xl px-2 py-2 text-xs outline-none"
              >
                <option value="beginner" className="bg-slate-900">
                  Beginner
                </option>
                <option value="intermediate" className="bg-slate-900">
                  Intermediate
                </option>
                <option value="advanced" className="bg-slate-900">
                  Advanced
                </option>
                <option value="expert" className="bg-slate-900">
                  Expert
                </option>
              </select>
              <button
                onClick={handleAddSkill}
                className="btn-gradient btn-gradient-hover rounded-xl px-3"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </GlassCard>

          <GlassCard className="relative z-20">
            <h3 className="font-semibold mb-3">Target Role</h3>
            <TargetRoleSelect
              value={targetRole}
              onChange={(v) => {
                setTargetRole(v);
                setSuggestions([]);
              }}
            />
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !targetRole || skills.length === 0}
              className="w-full mt-4 btn-gradient btn-gradient-hover rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
              {analyzing ? "Analyzing..." : "Analyze Gap"}
            </button>
            {skills.length === 0 && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">Add some skills first</p>
            )}
          </GlassCard>

          <GlassCard className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Suggestions
              </h3>
              <button
                onClick={handleGetSuggestions}
                disabled={loadingSuggestions}
                className="text-xs glass rounded-lg px-3 py-1.5 hover:bg-white/10 disabled:opacity-50"
              >
                {loadingSuggestions ? (
                  <Loader2 className="h-3 w-3 animate-spin inline" />
                ) : (
                  "Get suggestions"
                )}
              </button>
            </div>
            {suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.source}-${s.name}-${i}`}
                    onClick={() => handleAcceptSuggestion(s)}
                    className="text-xs px-3 py-1.5 rounded-full glass hover:btn-gradient transition flex items-center gap-1.5"
                  >
                    {s.source === "role" ? (
                      <Target className="h-3 w-3" />
                    ) : s.source === "resume" ? (
                      <FileText className="h-3 w-3" />
                    ) : (
                      <Github className="h-3 w-3" />
                    )}
                    {s.name}
                    <span className="text-[10px] text-muted-foreground">+ add</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {loadingSuggestions
                  ? ""
                  : 'Click "Get suggestions" to find skills from your resume and GitHub repos'}
              </p>
            )}
          </GlassCard>

          <div className="flex gap-2 relative z-0">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setAnalysis(null);
              }}
              className="flex-1 glass rounded-xl px-4 py-2.5 text-sm hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <History className="h-4 w-4" />
              {showHistory ? "Hide History" : "History"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {showHistory && !analysis && (
            <GlassCard>
              <h3 className="font-semibold mb-4">Analysis History</h3>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
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
                          <p className="text-sm font-medium">{item.targetRole}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-lg font-bold text-gradient">
                              {item.matchPercentage}%
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
                <p className="font-semibold">Analyzing your skills...</p>
              </div>
            </GlassCard>
          )}

          {analysis && !analyzing && (
            <>
              <GlassCard variant="strong">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{analysis.targetRole}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analysis.matchPercentage}% core skills matched
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreRing score={analysis.matchPercentage} size={100} stroke={10} />
                    <button
                      onClick={() => setDeleteId(analysis._id)}
                      className="p-2 text-muted-foreground hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {analysis.matchedSkills.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-muted-foreground mb-2">Matched Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.matchedSkills.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {coreGaps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    <p className="text-xs text-red-300 mb-2 font-semibold">Core Gaps</p>
                    {coreGaps.map((g) => (
                      <div key={g.skillName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-200">{g.skillName}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                            core
                          </span>
                        </div>
                        <SubTopicProgress gap={g} roadmapId={linkedRoadmapId} />
                      </div>
                    ))}
                  </div>
                )}

                {niceGaps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    <p className="text-xs text-yellow-300 mb-2 font-semibold">Nice-to-have Gaps</p>
                    {niceGaps.map((g) => (
                      <div key={g.skillName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-200">{g.skillName}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                            nice-to-have
                          </span>
                        </div>
                        <SubTopicProgress gap={g} roadmapId={linkedRoadmapId} />
                      </div>
                    ))}
                  </div>
                )}

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-xs text-muted-foreground mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 mt-1 shrink-0 text-[color:var(--color-primary)]" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </GlassCard>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setAnalysis(null);
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

          {!analysis && !showHistory && !analyzing && (
            <GlassCard>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-slate-600" />
                <p className="text-sm text-muted-foreground mt-4">
                  {skills.length === 0
                    ? "Add some skills to get started"
                    : "Select a target role and click Analyze Gap"}
                </p>
              </div>
            </GlassCard>
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
                onClick={handleDeleteAnalysis}
                className="bg-red-500/20 text-red-300 rounded-xl px-4 py-2 text-sm hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {deleteSkillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm">
            <h3 className="font-semibold mb-2">Remove Skill</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to remove this skill?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteSkillId(null)}
                className="glass rounded-xl px-4 py-2 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSkill}
                className="bg-red-500/20 text-red-300 rounded-xl px-4 py-2 text-sm hover:bg-red-500/30"
              >
                Remove
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
