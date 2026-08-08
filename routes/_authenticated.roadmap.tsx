import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  generateRoadmap,
  getRoadmapHistory,
  getRoadmapById,
  deleteRoadmap,
} from "@/lib/roadmap-api";
import { getGapHistory } from "@/lib/skills-api";
import type { LearningRoadmap, RoadmapHistoryItem, RoadmapMilestone } from "@/types/roadmap";
import type { AnalysisHistoryItem } from "@/types/skills";
import { QuizDialog } from "@/components/QuizDialog";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "Learning Roadmap — CareerForge AI" }] }),
  component: RoadmapPage,
});

type View = "generate" | "history" | "detail";

function RoadmapPage() {
  const [view, setView] = useState<View>("generate");
  const [roadmaps, setRoadmaps] = useState<RoadmapHistoryItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [selectedRoadmap, setSelectedRoadmap] = useState<LearningRoadmap | null>(null);
  const [gapAnalyses, setGapAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [selectedGapId, setSelectedGapId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      toast.success("Roadmap deleted");
    } catch {
      toast.error("Failed to delete roadmap");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Learning Roadmap</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate a personalized learning path from your skill gap analysis.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {(["generate", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === tab || (view === "detail" && tab === "history")
                ? "btn-gradient text-white"
                : "glass hover:bg-white/10"
            }`}
          >
            {tab === "generate" ? "Generate New" : "History"}
          </button>
        ))}
      </div>

      {/* Generate View */}
      {view === "generate" && (
        <GlassCard variant="strong">
          <h2 className="text-lg font-bold mb-4">Generate Learning Roadmap</h2>
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
                <label className="block text-sm font-medium mb-2">Gap Analysis</label>
                <div className="w-full glass rounded-lg px-3 py-2 border border-white/10 focus-within:border-[color:var(--color-primary)]">
                  <select
                    value={selectedGapId}
                    onChange={(e) => setSelectedGapId(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-850">Select a gap analysis...</option>
                    {gapAnalyses.map((a) => (
                      <option key={a._id} value={a._id} className="bg-slate-800">
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
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const normalizeDifficulty = (d?: string) => d === "basic" ? "beginner" : (d || "uncategorized");
  const humanize = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const subTopicStatusMap = new Map(
    (roadmap.subTopics || []).map((st) => [st.subTopicId, st.status]),
  );
  const totalSubTopics = roadmap.subTopics?.length || 0;
  const passedSubTopics =
    roadmap.subTopics?.filter((st) => st.status === "passed").length || 0;
  const overallProgress = totalSubTopics > 0 ? Math.round((passedSubTopics / totalSubTopics) * 100) : 0;

  const handleQuizPass = useCallback(async () => {
    toast.success("Quiz passed! Your roadmap has been updated.");
    try {
      const refreshed = await getRoadmapById(roadmapId);
      setRoadmap(refreshed);
    } catch {
      // silent — stale data is acceptable
    }
  }, [roadmapId]);

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-[color:var(--color-primary)] hover:underline flex items-center gap-1"
      >
        ← Back to history
      </button>

      <GlassCard variant="strong">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{roadmap.targetRole}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {roadmap.milestones.length} milestones •{" "}
              {new Date(roadmap.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              roadmap.status === "completed"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {roadmap.status}
          </span>
        </div>
        {roadmap.overallSummary && (
          <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
            {roadmap.overallSummary}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              viewMode === "list" ? "bg-white/20 text-foreground" : "glass hover:bg-white/10 text-muted-foreground"
            }`}
          >
            <List className="h-4 w-4" /> List
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              viewMode === "kanban" ? "bg-white/20 text-foreground" : "glass hover:bg-white/10 text-muted-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" /> Kanban
          </button>
        </div>

        {totalSubTopics > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" />
                Overall Progress
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-[color:var(--color-success)]">{passedSubTopics}</span>
                {" / "}
                {totalSubTopics} sub-topics passed
              </p>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[color:var(--color-success)] transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{overallProgress}%</p>
          </div>
        )}
      </GlassCard>

      {roadmap.status === "failed" && roadmap.errorMessage && (
        <GlassCard>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Generation Failed</p>
              <p className="text-xs text-muted-foreground mt-1">{roadmap.errorMessage}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {roadmap.status === "completed" && viewMode === "list" && (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500" />
          <div className="space-y-4">
            {["beginner", "intermediate", "advanced", "uncategorized"]
              .map((diff) => {
                const folderMilestones = roadmap.milestones.filter(m => normalizeDifficulty(m.difficulty) === diff);
                if (folderMilestones.length === 0) return null;
                const completedCount = folderMilestones.filter(m => subTopicStatusMap.get(m.subTopicId || "") === "passed").length;
                const folderLabel = diff.charAt(0).toUpperCase() + diff.slice(1);
                const isFolderOpen = openFolders[diff] || false;
                
                return (
                  <div key={diff} className="mb-6">
                    <button 
                      onClick={() => setOpenFolders(prev => ({...prev, [diff]: !prev[diff]}))}
                      className="w-full flex items-center justify-between p-4 mb-4 rounded-xl glass hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${completedCount === folderMilestones.length ? 'bg-[color:var(--color-success)]' : 'bg-blue-500'}`} />
                        <p className="text-sm font-bold tracking-wide">
                          {folderLabel}
                        </p>
                        <span className="text-xs text-muted-foreground bg-black/20 px-2 py-1 rounded-md">
                          {completedCount}/{folderMilestones.length} complete
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {isFolderOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </button>
                    {isFolderOpen && folderMilestones.map((m) => {
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
              (m) => (subTopicStatusMap.get(m.subTopicId || "") || "not_started") === status
            );
            const statusTitle = status === "not_started" ? "To Do" : status === "in_progress" ? "In Progress" : "Done";
            const statusColor = status === "passed" ? "bg-[color:var(--color-success)]" : status === "in_progress" ? "bg-[color:var(--color-warning)]" : "bg-slate-500";
            return (
              <div key={status} className="glass p-4 rounded-xl flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                  <h3 className="font-bold">{statusTitle}</h3>
                  <span className="text-xs text-muted-foreground ml-auto bg-black/20 px-2 py-0.5 rounded-full">
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
                        onQuiz={() => {
                          setQuizMilestone(m);
                          setQuizOpen(true);
                        }}
                      />
                    );
                  })}
                  {columnMilestones.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-white/10 rounded-xl">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {quizMilestone && (
        <QuizDialog
          open={quizOpen}
          onOpenChange={setQuizOpen}
          roadmapItemId={quizMilestone._id}
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
  onQuiz,
}: {
  milestone: RoadmapMilestone;
  index: number;
  total: number;
  isExpanded: boolean;
  subTopicStatus: string;
  onToggle: () => void;
  onQuiz: () => void;
}) {
  const humanize = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const statusColor =
    subTopicStatus === "passed"
      ? "bg-[color:var(--color-success)]/20 text-[color:var(--color-success)]"
      : subTopicStatus === "in_progress"
        ? "bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)]"
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
        className={`absolute -left-6 top-5 h-4 w-4 rounded-full border-2 border-white/30 ${
          milestone.importance === "core" ? "bg-blue-500" : "bg-slate-600"
        }`}
      />
      <GlassCard hover>
        <button onClick={onToggle} className="w-full text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg btn-gradient grid place-items-center text-xs font-bold shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{humanize(milestone.subTopicId)}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {milestone.skillName} • {milestone.estimatedTimeframe} • {milestone.resources.length} resources
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {statusLabel && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                  {statusLabel}
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  milestone.importance === "core"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-500/20 text-muted-foreground"
                }`}
              >
                {milestone.importance}
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </button>
        {isExpanded && (
          <div className="mt-4 space-y-2 pt-4 border-t border-white/10">
            {milestone.resources.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-[color:var(--color-primary)]">
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
              onClick={(e) => { e.stopPropagation(); onQuiz(); }}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg btn-gradient text-sm font-medium"
            >
              <Brain className="h-4 w-4" />
              Take Quiz
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
