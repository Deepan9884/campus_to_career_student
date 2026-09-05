import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { GlassCard } from "@/components/GlassCard";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  BookOpen,
  Brain,
  BarChart3,
  LayoutDashboard,
  List,
  Sparkles,
  Compass,
  Zap,
  Award,
  TrendingUp,
  Target,
  Calendar,
  Play,
  Check,
  Clock,
  ArrowRight,
  RefreshCw,
  Flame,
  ShieldCheck,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateRoadmap,
  getRoadmapHistory,
  getRoadmapById,
  deleteRoadmap,
  getLatestRoadmap,
  getRoadmapRecommendations,
  updateSubTopicStatus,
} from "@/lib/roadmap-api";
import { getGapHistory } from "@/lib/skills-api";
import type {
  LearningRoadmap,
  RoadmapHistoryItem,
  RoadmapMilestone,
  RoadmapRecommendations,
  PrimaryRecommendation,
  RecommendationTrackItem,
  ProjectSuggestion,
} from "@/types/roadmap";
import type { AnalysisHistoryItem } from "@/types/skills";
import { QuizDialog } from "@/components/QuizDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Learning Roadmap — Campus to Career AI" }] }),
  component: RoadmapPage,
});

type View = "generate" | "history" | "detail";

function RoadmapPage() {
  const [view, setView] = useState<View>("detail");
  const [roadmaps, setRoadmaps] = useState<RoadmapHistoryItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [selectedRoadmap, setSelectedRoadmap] = useState<LearningRoadmap | null>(null);
  const [gapAnalyses, setGapAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [selectedGapId, setSelectedGapId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadLatest = useCallback(async () => {
    setLoadingLatest(true);
    try {
      const latest = await getLatestRoadmap();
      if (latest) {
        setSelectedRoadmap(latest);
        setView("detail");
      } else {
        setView("generate");
      }
    } catch {
      setView("generate");
    } finally {
      setLoadingLatest(false);
    }
  }, []);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  const loadHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getRoadmapHistory(page, 10);
      setRoadmaps(res.roadmaps);
      setPagination(res.pagination);
    } catch {
      toast.error("Failed to load roadmap history");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGapAnalyses = useCallback(async () => {
    try {
      const res = await getGapHistory(1, 50);
      setGapAnalyses(res.analyses.filter((a) => a.status === "completed"));
    } catch {
      // silent — dropdown will be empty
    }
  }, []);

  useEffect(() => {
    if (view === "history") loadHistory(pagination.page);
    if (view === "generate") loadGapAnalyses();
  }, [view, loadHistory, loadGapAnalyses, pagination.page]);

  const handleGenerate = async () => {
    if (!selectedGapId) {
      toast.error("Select a gap analysis first");
      return;
    }
    setGenerating(true);
    try {
      const roadmap = await generateRoadmap({ skillGapAnalysisId: selectedGapId });
      if (roadmap.status === "failed") {
        toast.error(roadmap.errorMessage || "Roadmap generation failed");
        return;
      }
      toast.success("Roadmap generated!");
      setSelectedRoadmap(roadmap);
      setView("detail");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate roadmap";
      if (
        typeof err === "object" &&
        err !== null &&
        "statusCode" in err &&
        (err as { statusCode: number }).statusCode === 429
      ) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(message);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleView = async (id: string) => {
    setLoading(true);
    try {
      const roadmap = await getRoadmapById(id);
      setSelectedRoadmap(roadmap);
      setView("detail");
    } catch {
      toast.error("Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRoadmap(id);
      setRoadmaps((prev) => prev.filter((r) => r._id !== id));
      setConfirmDeleteId(null);
      if (selectedRoadmap?._id === id) {
        setSelectedRoadmap(null);
        loadLatest();
      }
      toast.success("Roadmap deleted");
    } catch {
      toast.error("Failed to delete roadmap");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Learning Roadmap</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate a personalized learning path from your skill gap analysis.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {selectedRoadmap && (
          <button
            onClick={() => setView("detail")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              view === "detail"
                ? "btn-gradient text-white shadow-md font-semibold"
                : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-muted-foreground"
            }`}
          >
            Active Roadmap
          </button>
        )}
        <button
          onClick={() => setView("generate")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            view === "generate"
              ? "btn-gradient text-white shadow-md font-semibold"
              : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-muted-foreground"
          }`}
        >
          Generate New
        </button>
        <button
          onClick={() => setView("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            view === "history"
              ? "btn-gradient text-white shadow-md font-semibold"
              : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-muted-foreground"
          }`}
        >
          History
        </button>
      </div>

      {loadingLatest ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {!loadingLatest && (
        <>

      {/* Generate View */}
      {view === "generate" && (
        <GlassCard variant="strong">
          <h2 className="text-lg font-bold mb-4 text-foreground">Generate Learning Roadmap</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select a completed skill gap analysis to generate a structured learning roadmap.
          </p>
          {gapAnalyses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed gap analyses found. Run a skill gap analysis first.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-muted-foreground mb-2">Gap Analysis</label>
                <div className="w-full glass-input rounded-xl px-3 py-2 border border-slate-300 dark:border-white/10 focus-within:border-[color:var(--color-primary)]">
                  <select
                    value={selectedGapId}
                    onChange={(e) => setSelectedGapId(e.target.value)}
                    className="w-full bg-card text-foreground text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-card text-foreground">Select a gap analysis...</option>
                    {gapAnalyses.map((a) => (
                      <option key={a._id} value={a._id} className="bg-card text-foreground">
                        {a.targetRole} — {a.matchPercentage}% match (
                        {new Date(a.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedGapId}
                className="btn-gradient btn-gradient-hover rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" /> Generate Roadmap
                  </>
                )}
              </button>
            </div>
          )}
        </GlassCard>
      )}

      {/* History View */}
      {view === "history" && (
        <div className="space-y-4">
          {loading && roadmaps.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : roadmaps.length === 0 ? (
            <GlassCard>
              <p className="text-center text-muted-foreground py-8">
                No roadmaps generated yet. Create your first one!
              </p>
            </GlassCard>
          ) : (
            <>
              <div className="space-y-3">
                {roadmaps.map((r) => (
                  <GlassCard key={r._id} hover>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{r.targetRole}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.milestoneCount} milestones •{" "}
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                        <span
                          className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                            r.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleView(r._id)}
                          className="text-xs glass px-3 py-1.5 rounded-lg hover:bg-white/10"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(r._id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => loadHistory(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="glass px-4 py-2 rounded-lg text-sm hover:bg-white/10 disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => loadHistory(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="glass px-4 py-2 rounded-lg text-sm hover:bg-white/10 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Detail View */}
      {view === "detail" && selectedRoadmap && (
        <RoadmapDetail
          roadmap={selectedRoadmap}
          roadmapId={selectedRoadmap._id}
          onBack={() => setView("history")}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-2">Delete Roadmap</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This action cannot be undone. The roadmap will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="glass px-4 py-2 rounded-lg text-sm hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </GlassCard>
        </div>
      )}
        </>
      )}
    </div>
  );
}

function RoadmapDetail({
  roadmap: initialRoadmap,
  roadmapId,
  onBack,
}: {
  roadmap: LearningRoadmap;
  roadmapId: string;
  onBack: () => void;
}) {
  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizMilestone, setQuizMilestone] = useState<RoadmapMilestone | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    beginner: true,
    intermediate: true,
    advanced: false,
  });
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [activeTrack, setActiveTrack] = useState<"recommended" | "quick_wins" | "core" | "projects" | "all">("recommended");
  const [recommendations, setRecommendations] = useState<RoadmapRecommendations | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const normalizeDifficulty = (d?: string) => d === "basic" ? "beginner" : (d || "uncategorized");
  const humanize = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const subTopicStatusMap = useMemo(() => {
    return new Map((roadmap.subTopics || []).map((st) => [st.subTopicId, st.status]));
  }, [roadmap.subTopics]);

  const totalSubTopics = roadmap.subTopics?.length || 0;
  const passedSubTopics =
    roadmap.subTopics?.filter((st) => st.status === "passed").length || 0;
  const overallProgress = totalSubTopics > 0 ? Math.round((passedSubTopics / totalSubTopics) * 100) : 0;

  const loadRecommendations = useCallback(async () => {
    setLoadingRecs(true);
    try {
      const res = await getRoadmapRecommendations(roadmapId);
      setRecommendations(res);
    } catch (err) {
      console.warn("[Roadmap] Failed to load recommendations:", err);
    } finally {
      setLoadingRecs(false);
    }
  }, [roadmapId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleStatusChange = async (
    subTopicId: string,
    status: "not_started" | "in_progress" | "passed",
  ) => {
    try {
      const updated = await updateSubTopicStatus(roadmapId, subTopicId, status);
      setRoadmap(updated);
      toast.success(`Milestone updated to ${status.replace("_", " ")}`);
      loadRecommendations();
    } catch {
      toast.error("Failed to update milestone status");
    }
  };

  const handleQuizPass = useCallback(async () => {
    toast.success("Quiz passed! Your roadmap and readiness score have been updated.");
    try {
      const refreshed = await getRoadmapById(roadmapId);
      setRoadmap(refreshed);
      loadRecommendations();
    } catch {
      // silent — stale data is acceptable
    }
  }, [roadmapId, loadRecommendations]);

  const primaryRec = recommendations?.primaryRecommendation;
  const primaryMilestone = useMemo(() => {
    if (!primaryRec) return null;
    return roadmap.milestones.find((m) => m.subTopicId === primaryRec.subTopicId) || null;
  }, [primaryRec, roadmap.milestones]);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-[color:var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
      >
        ← Back to history
      </button>

      {/* === AI LEARNING SUGGESTION ENGINE COMMAND CENTER === */}
      <GlassCard variant="strong" className="border-indigo-500/30 dark:border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shadow-xs">
                <Sparkles className="h-3 w-3 animate-pulse text-indigo-500" />
                AI Learning Suggestion Engine
              </span>
              <span className="text-xs text-muted-foreground">• Calibrated for Technical Placement</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span>{roadmap.targetRole}</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  roadmap.status === "completed"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                }`}
              >
                {roadmap.status === "completed" ? "Active Curriculum" : roadmap.status}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {roadmap.milestones.length} milestones • Created {new Date(roadmap.createdAt).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={loadRecommendations}
            disabled={loadingRecs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold text-foreground cursor-pointer transition disabled:opacity-50"
            title="Refresh AI Recommendations"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loadingRecs && "animate-spin text-indigo-500")} />
            <span>Refresh Suggestions</span>
          </button>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative z-10">
          <div className="p-3 rounded-xl glass bg-slate-50/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-500" />
                Role Readiness
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {recommendations?.readiness?.readinessTier || "Evaluating"}
              </span>
            </div>
            <p className="text-2xl font-black text-foreground">
              {recommendations?.readiness?.score || Math.max(40, overallProgress)}%
            </p>
            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                style={{ width: `${recommendations?.readiness?.score || Math.max(40, overallProgress)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl glass bg-slate-50/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Mastered
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {overallProgress}%
              </span>
            </div>
            <p className="text-2xl font-black text-foreground">
              {passedSubTopics} <span className="text-xs font-normal text-muted-foreground">/ {totalSubTopics}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Verified subtopics passed</p>
          </div>

          <div className="p-3 rounded-xl glass bg-slate-50/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Active Focus
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                In Progress
              </span>
            </div>
            <p className="text-2xl font-black text-foreground">
              {recommendations?.readiness?.inProgressCount || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Active study sprint topics</p>
          </div>

          <div className="p-3 rounded-xl glass bg-slate-50/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                Estimated Velocity
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                5-6 hrs/wk
              </span>
            </div>
            <p className="text-2xl font-black text-foreground">
              ~{recommendations?.readiness?.estimatedWeeksLeft || Math.max(1, Math.ceil((totalSubTopics - passedSubTopics) * 0.75))} <span className="text-xs font-normal text-muted-foreground">wks</span>
            </p>
            <p className="text-[10px] text-muted-foreground">To interview readiness</p>
          </div>
        </div>

        {roadmap.overallSummary && (
          <p className="mt-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-white/10 pt-3">
            <span className="font-bold text-foreground">Curriculum Context: </span>
            {roadmap.overallSummary}
          </p>
        )}
      </GlassCard>

      {/* === PRIMARY RECOMMENDATION HERO CARD ("TODAY'S SUGGESTED PRIORITY") === */}
      {primaryRec && (
        <div className="p-5 rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10 backdrop-blur-md shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow-xs">
                <Target className="w-3 h-3" />
                Priority Suggestion — Recommended Next
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {primaryRec.difficulty}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                {primaryRec.importance}
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {primaryRec.impactScore}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">{primaryRec.name}</h3>
            <p className="text-xs text-muted-foreground">
              {primaryRec.skillName} • Estimated effort: {primaryRec.estimatedTimeframe}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-indigo-200/60 dark:border-indigo-900/40 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">Why the engine recommends this: </strong>
            <span>{primaryRec.reason}</span>
          </div>

          {/* Target Learning Outcomes */}
          {primaryRec.learningOutcomes && primaryRec.learningOutcomes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                Target Outcomes for This Milestone:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {primaryRec.learningOutcomes.map((out, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{out}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-200/50 dark:border-white/10">
            <div className="flex items-center gap-2">
              {primaryRec.status === "not_started" ? (
                <button
                  onClick={() => handleStatusChange(primaryRec.subTopicId, "in_progress")}
                  className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-95"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Learning (Mark In Progress)</span>
                </button>
              ) : primaryRec.status === "in_progress" ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    <span>In Progress</span>
                  </span>
                  <button
                    onClick={() => handleStatusChange(primaryRec.subTopicId, "passed")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Mark Completed</span>
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mastered ✓</span>
                </span>
              )}

              {primaryMilestone && (
                <button
                  onClick={() => {
                    setQuizMilestone(primaryMilestone);
                    setQuizOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-500/20"
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>Take Verification Quiz</span>
                </button>
              )}
            </div>

            {/* Quick Resources links */}
            {primaryRec.resources && primaryRec.resources.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground font-semibold">Recommended Resources:</span>
                {primaryRec.resources.slice(0, 2).map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg text-xs font-medium glass hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>{r.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === RECOMMENDATION TRACK TABS === */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTrack("recommended")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
              activeTrack === "recommended"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recommended Next</span>
          </button>

          <button
            onClick={() => setActiveTrack("quick_wins")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
              activeTrack === "quick_wins"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground"
            )}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Wins ({recommendations?.tracks?.quickWins?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTrack("core")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
              activeTrack === "core"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground"
            )}
          >
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            <span>Core Essentials ({recommendations?.tracks?.coreEssentials?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTrack("projects")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
              activeTrack === "projects"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground"
            )}
          >
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>Project Labs ({recommendations?.tracks?.projectSuggestions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTrack("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
              activeTrack === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Full Milestone Path</span>
          </button>
        </div>

        {activeTrack === "all" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-200 dark:bg-white/20 text-foreground font-bold shadow-xs"
                  : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-slate-200 dark:bg-white/20 text-foreground font-bold shadow-xs"
                  : "glass hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Kanban
            </button>
          </div>
        )}
      </div>

      {/* === TRACK 1: RECOMMENDED NEXT & STUDY SPRINT === */}
      {activeTrack === "recommended" && (
        <div className="space-y-6">
          {/* 5-Day Guided Study Sprint Planner */}
          {recommendations?.studyPacingPlan && (
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-bold text-sm text-foreground">
                    Suggested 5-Day Study Sprint
                  </h4>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                  {recommendations.studyPacingPlan.pace}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                <strong className="text-foreground">Weekly Goal: </strong>
                {recommendations.studyPacingPlan.weeklyGoal}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {recommendations.studyPacingPlan.days.map((d, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl glass bg-slate-50/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{d.day}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{d.duration}</span>
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{d.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{d.task}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Strategic Interview Tips */}
          {recommendations?.interviewTips && recommendations.interviewTips.length > 0 && (
            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-500" />
                <h4 className="font-bold text-sm text-foreground">
                  Interview Preparation & Technical Advice
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommendations.interviewTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs leading-relaxed text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">
                      Insight #{idx + 1}
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* === TRACK 2: QUICK WINS === */}
      {activeTrack === "quick_wins" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">⚡ High-Yield Quick Wins</h3>
            <p className="text-xs text-muted-foreground">
              These topics have beginner-to-intermediate complexity and short timeframes. Completing them rapidly boosts your profile match percentage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(recommendations?.tracks?.quickWins || []).map((item) => {
              const fullMilestone = roadmap.milestones.find((m) => m.subTopicId === item.subTopicId);
              const status = subTopicStatusMap.get(item.subTopicId) || "not_started";
              return (
                <GlassCard key={item.subTopicId} hover className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {item.tag}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{item.estimatedTimeframe}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.skillName}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      {status === "not_started" ? (
                        <button
                          onClick={() => handleStatusChange(item.subTopicId, "in_progress")}
                          className="text-xs px-2.5 py-1 rounded-lg btn-gradient text-white font-semibold cursor-pointer"
                        >
                          Start Topic
                        </button>
                      ) : status === "in_progress" ? (
                        <button
                          onClick={() => handleStatusChange(item.subTopicId, "passed")}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer"
                        >
                          Mark Done
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      )}

                      {fullMilestone && (
                        <button
                          onClick={() => {
                            setQuizMilestone(fullMilestone);
                            setQuizOpen(true);
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg glass hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold cursor-pointer"
                        >
                          Quiz
                        </button>
                      )}
                    </div>

                    {item.resources && item.resources[0] && (
                      <a
                        href={item.resources[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                      >
                        <span>Learn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* === TRACK 3: CORE ESSENTIALS === */}
      {activeTrack === "core" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">🏛️ Core Technical Round Essentials</h3>
            <p className="text-xs text-muted-foreground">
              These fundamental competencies are mandatory for {roadmap.targetRole}. Expect rigorous questioning on these during technical interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(recommendations?.tracks?.coreEssentials || []).map((item) => {
              const fullMilestone = roadmap.milestones.find((m) => m.subTopicId === item.subTopicId);
              const status = subTopicStatusMap.get(item.subTopicId) || "not_started";
              return (
                <GlassCard key={item.subTopicId} hover className="space-y-3 border-indigo-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                      {item.tag}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{item.estimatedTimeframe}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.skillName}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      {status === "not_started" ? (
                        <button
                          onClick={() => handleStatusChange(item.subTopicId, "in_progress")}
                          className="text-xs px-2.5 py-1 rounded-lg btn-gradient text-white font-semibold cursor-pointer"
                        >
                          Start Topic
                        </button>
                      ) : status === "in_progress" ? (
                        <button
                          onClick={() => handleStatusChange(item.subTopicId, "passed")}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer"
                        >
                          Mark Done
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      )}

                      {fullMilestone && (
                        <button
                          onClick={() => {
                            setQuizMilestone(fullMilestone);
                            setQuizOpen(true);
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg glass hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-semibold cursor-pointer"
                        >
                          Quiz
                        </button>
                      )}
                    </div>

                    {item.resources && item.resources[0] && (
                      <a
                        href={item.resources[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                      >
                        <span>Learn</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* === TRACK 4: PROJECT LABS === */}
      {activeTrack === "projects" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">🛠️ Portfolio Project Challenges</h3>
            <p className="text-xs text-muted-foreground">
              Interviewers look for tangible proof of skill application. Implement these real-world challenge scenarios to build undeniable resume credibility.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(recommendations?.tracks?.projectSuggestions || []).map((proj) => (
              <GlassCard key={proj.id} hover className="space-y-3 border-teal-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                    {proj.difficulty} Challenge
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{proj.estimatedHours}</span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-foreground">{proj.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{proj.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Demonstrated Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.skillsApplied.map((skill, sIdx) => (
                      <span key={sIdx} className="text-[11px] px-2 py-0.5 rounded-md glass text-slate-700 dark:text-slate-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* === TRACK 5: FULL MILESTONE PATH === */}
      {activeTrack === "all" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter roadmap milestones by skill or name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl glass border border-slate-200 dark:border-white/10 text-xs focus:outline-none"
            />
          </div>

          {roadmap.status === "completed" && viewMode === "list" && (
            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500 to-pink-500" />
              <div className="space-y-4">
                {["beginner", "intermediate", "advanced", "uncategorized"].map((diff) => {
                  const folderMilestones = roadmap.milestones.filter(
                    (m) =>
                      normalizeDifficulty(m.difficulty) === diff &&
                      (searchFilter.trim() === "" ||
                        m.skillName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        m.subTopicId.toLowerCase().includes(searchFilter.toLowerCase()))
                  );
                  if (folderMilestones.length === 0) return null;
                  const completedCount = folderMilestones.filter(
                    (m) => subTopicStatusMap.get(m.subTopicId || "") === "passed"
                  ).length;
                  const folderLabel = diff.charAt(0).toUpperCase() + diff.slice(1);
                  const isFolderOpen = openFolders[diff] !== false;

                  return (
                    <div key={diff} className="mb-6">
                      <button
                        onClick={() =>
                          setOpenFolders((prev) => ({ ...prev, [diff]: !prev[diff] }))
                        }
                        className="w-full flex items-center justify-between p-3.5 mb-3 rounded-xl glass hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              completedCount === folderMilestones.length ? "bg-emerald-500" : "bg-indigo-500"
                            }`}
                          />
                          <p className="text-sm font-bold tracking-wide text-foreground">
                            {folderLabel} Milestones
                          </p>
                          <span className="text-xs font-semibold text-slate-700 dark:text-muted-foreground bg-slate-100 dark:bg-black/20 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-transparent">
                            {completedCount}/{folderMilestones.length} complete
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          {isFolderOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </button>

                      {isFolderOpen &&
                        folderMilestones.map((m) => {
                          const idx = roadmap.milestones.indexOf(m);
                          const isExpanded = expanded === idx;
                          const subStatus = subTopicStatusMap.get(m.subTopicId || "") || "not_started";
                          return (
                            <MilestoneCard
                              key={m.subTopicId}
                              milestone={m}
                              index={idx}
                              total={roadmap.milestones.length}
                              isExpanded={isExpanded}
                              subTopicStatus={subStatus}
                              onToggle={() => setExpanded(isExpanded ? null : idx)}
                              onUpdateStatus={(st) => handleStatusChange(m.subTopicId, st)}
                              onQuiz={() => {
                                setQuizMilestone(m);
                                setQuizOpen(true);
                              }}
                            />
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {roadmap.status === "completed" && viewMode === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["not_started", "in_progress", "passed"] as const).map((status) => {
                const columnMilestones = roadmap.milestones.filter(
                  (m) =>
                    (subTopicStatusMap.get(m.subTopicId || "") || "not_started") === status &&
                    (searchFilter.trim() === "" ||
                      m.skillName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                      m.subTopicId.toLowerCase().includes(searchFilter.toLowerCase()))
                );
                const statusTitle =
                  status === "not_started" ? "To Do" : status === "in_progress" ? "In Progress" : "Done";
                const statusColor =
                  status === "passed" ? "bg-emerald-500" : status === "in_progress" ? "bg-amber-500" : "bg-slate-400";
                return (
                  <div key={status} className="glass p-4 rounded-xl flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                      <h3 className="font-bold text-foreground">{statusTitle}</h3>
                      <span className="text-xs font-semibold text-muted-foreground ml-auto bg-slate-100 dark:bg-black/20 px-2 py-0.5 rounded-full">
                        {columnMilestones.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {columnMilestones.map((m) => {
                        const idx = roadmap.milestones.indexOf(m);
                        const isExpanded = expanded === idx;
                        return (
                          <MilestoneCard
                            key={m.subTopicId}
                            milestone={m}
                            index={idx}
                            total={roadmap.milestones.length}
                            isExpanded={isExpanded}
                            subTopicStatus={status}
                            onToggle={() => setExpanded(isExpanded ? null : idx)}
                            onUpdateStatus={(st) => handleStatusChange(m.subTopicId, st)}
                            onQuiz={() => {
                              setQuizMilestone(m);
                              setQuizOpen(true);
                            }}
                          />
                        );
                      })}
                      {columnMilestones.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                          Empty
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Verification Quiz Modal */}
      {quizMilestone && (
        <QuizDialog
          open={quizOpen}
          onOpenChange={setQuizOpen}
          roadmapItemId={quizMilestone._id || quizMilestone.subTopicId || roadmap?._id || ""}
          subTopicName={quizMilestone.subTopicId || quizMilestone.skillName}
          skillName={quizMilestone.skillName}
          onPassed={handleQuizPass}
        />
      )}
    </div>
  );
}

function MilestoneCard({
  milestone,
  index,
  total,
  isExpanded,
  subTopicStatus,
  onToggle,
  onUpdateStatus,
  onQuiz,
}: {
  milestone: RoadmapMilestone;
  index: number;
  total: number;
  isExpanded: boolean;
  subTopicStatus: string;
  onToggle: () => void;
  onUpdateStatus?: (status: "not_started" | "in_progress" | "passed") => void;
  onQuiz: () => void;
}) {
  const humanize = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const statusColor =
    subTopicStatus === "passed"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
      : subTopicStatus === "in_progress"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25"
      : null;

  const statusLabel =
    subTopicStatus === "passed"
      ? "Passed"
      : subTopicStatus === "in_progress"
      ? "In Progress"
      : null;

  return (
    <div className="relative mb-4">
      <div
        className={`absolute -left-6 top-5 h-4 w-4 rounded-full border-2 border-slate-300 dark:border-white/30 ${
          milestone.importance === "core" ? "bg-indigo-500" : "bg-slate-400"
        }`}
      />
      <GlassCard hover>
        <div className="w-full text-left">
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={onToggle}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
            >
              <div className="h-8 w-8 rounded-lg btn-gradient grid place-items-center text-xs font-bold text-white shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{humanize(milestone.subTopicId)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {milestone.skillName} • {milestone.estimatedTimeframe} • {milestone.resources.length} resources
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Interactive Status Switcher */}
              {onUpdateStatus && (
                <div className="flex items-center gap-1">
                  {subTopicStatus === "not_started" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus("in_progress");
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-md glass hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/30 flex items-center gap-1 cursor-pointer transition"
                      title="Mark as In Progress"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start</span>
                    </button>
                  ) : subTopicStatus === "in_progress" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus("passed");
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition"
                      title="Mark as Done"
                    >
                      <Check className="w-3 h-3" />
                      <span>Complete</span>
                    </button>
                  ) : (
                    <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passed</span>
                    </span>
                  )}
                </div>
              )}

              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  milestone.importance === "core"
                    ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25"
                    : "bg-slate-200 dark:bg-slate-500/20 text-slate-700 dark:text-muted-foreground"
                }`}
              >
                {milestone.importance}
              </span>

              <button
                onClick={onToggle}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md cursor-pointer transition text-muted-foreground"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-2 pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Curated Learning Resources:
              </div>
              {milestone.resources.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 group transition border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-[color:var(--color-primary)] text-foreground">
                      {r.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.platform} • {r.type}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-[color:var(--color-primary)] shrink-0" />
                </a>
              ))}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuiz();
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl btn-gradient text-sm font-bold text-white cursor-pointer shadow-md shadow-indigo-500/20 hover:opacity-95"
              >
                <Brain className="h-4 w-4" />
                <span>Take Milestone Verification Quiz</span>
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
