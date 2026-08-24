import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useSuperDream } from "@/stores/superDreamStore";
import {
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Send,
  X,
  Award,
  Check,
  UserCheck,
  UploadCloud,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { MentorTask, TravelMilestone } from "@/lib/super-dream-api";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DSA: { bg: "bg-indigo-500/15", text: "text-indigo-300", border: "border-indigo-500/30" },
  "System Design": { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" },
  "Core Engineering": { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30" },
  Project: { bg: "bg-cyan-500/15", text: "text-cyan-300", border: "border-cyan-500/30" },
  Hackathon: { bg: "bg-purple-500/15", text: "text-purple-300", border: "border-purple-500/30" },
  Research: { bg: "bg-rose-500/15", text: "text-rose-300", border: "border-rose-500/30" },
};

const PHASE_THEMES: Record<number, { ring: string; border: string; accent: string }> = {
  1: { ring: "ring-emerald-500/30", border: "border-emerald-500/40", accent: "text-emerald-400" },
  2: { ring: "ring-amber-500/30", border: "border-amber-500/40", accent: "text-amber-400" },
  3: { ring: "ring-purple-500/30", border: "border-purple-500/40", accent: "text-purple-400" },
  4: { ring: "ring-cyan-500/30", border: "border-cyan-500/40", accent: "text-cyan-400" },
};

export function SuperDreamTravelRoadmap() {
  const {
    travelMilestones,
    mentorTasks,
    mentorInfo,
    submitMentorTask,
  } = useSuperDream();

  const [selectedPhase, setSelectedPhase] = useState<number>(2);
  const [activeTaskModal, setActiveTaskModal] = useState<MentorTask | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPhaseTasks = mentorTasks.filter(
    (t) => t.phase === selectedPhase
  );

  const activeMilestone = travelMilestones.find((m) => m.phase === selectedPhase);

  const handleOpenSubmission = (task: MentorTask) => {
    setActiveTaskModal(task);
    setDeliverableUrl(task.deliverableLink || "");
    setSubmissionNotes(task.submissionNote || "");
  };

  const handleConfirmSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskModal) return;
    if (!deliverableUrl.trim()) {
      toast.error("Please provide a repository URL or deliverable proof link.");
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(submitMentorTask(activeTaskModal.id, deliverableUrl, submissionNotes));
      setActiveTaskModal(null);
      toast.success("Deliverable submitted to mentor for review!");
    } catch {
      toast.error("Failed to submit deliverable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mentor Advisor Spotlight Banner */}
      <GlassCard className="p-6 border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Mentor-Led Travel Trajectory
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Career Trajectory & Mentor Milestones
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Curated preparation trajectory targeting 20+ LPA placements. Deliverables, system implementations, and milestones are reviewed and approved directly by your industry mentor.
            </p>
          </div>

          {/* Mentor Profile Card */}
          <div className="flex items-center gap-3.5 bg-slate-900/80 p-3.5 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-950/40 shrink-0">
            <div className="relative">
              {mentorInfo.avatar ? (
                <img
                  src={mentorInfo.avatar}
                  alt={mentorInfo.name || "Mentor"}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-400/60"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 grid place-items-center text-indigo-300 ring-2 ring-indigo-400/60 font-bold text-sm">
                  {mentorInfo.name ? mentorInfo.name.charAt(0) : "M"}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white">{mentorInfo.name || "Faculty Mentor"}</p>
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-[11px] text-indigo-300/90 line-clamp-1">{mentorInfo.title ? mentorInfo.title.split("&")[0] : "Super Dream Mentorship Board"}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{mentorInfo.officeHours || "Office Hours: By Appointment"}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Trajectory Phase Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {travelMilestones.map((m) => {
          const isSelected = selectedPhase === m.phase;
          const isDone = m.status === "completed";
          const isCurr = m.status === "current";
          const theme = PHASE_THEMES[m.phase] || PHASE_THEMES[1];

          return (
            <GlassCard
              key={m.phase}
              onClick={() => setSelectedPhase(m.phase)}
              className={cn(
                "p-4 text-left transition-all border flex flex-col justify-between gap-3 cursor-pointer card-hover-lift relative overflow-hidden",
                isSelected
                  ? "bg-slate-900/90 border-amber-400/60 ring-1 ring-amber-400/30 shadow-lg shadow-indigo-950/50"
                  : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700",
                isDone && "border-emerald-500/30"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                    isDone
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : isCurr
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  )}
                >
                  Phase 0{m.phase}
                </span>

                <span className="text-[11px] font-bold text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  {m.targetLPA}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-white line-clamp-1">{m.title.split(": ")[1] || m.title}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.subtitle}</p>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">
                  {m.completedTasksCount} / {m.requiredTasksCount} Tasks Done
                </span>
                {isDone ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </span>
                ) : isCurr ? (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold text-xs">
                    <Clock className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs">Upcoming</span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Selected Phase Detail Card */}
      {activeMilestone && (
        <GlassCard className="p-5 border-indigo-500/30 bg-slate-900/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{activeMilestone.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeMilestone.targetLPA}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{activeMilestone.description}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-slate-400">Milestone Progress</p>
              <p className="text-sm font-bold font-mono text-emerald-400">
                {activeMilestone.completedTasksCount} of {activeMilestone.requiredTasksCount} Finished
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs">
            <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Mentor Directive ({mentorInfo.name || "Faculty Mentor"}):</span>{" "}
              <span className="text-slate-200 italic">"{activeMilestone.mentorNotes}"</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Mentor Tasks for Phase {selectedPhase}
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {currentPhaseTasks.length} Assigned Deliverables
          </span>
        </div>

        {currentPhaseTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/10 text-center text-slate-400">
            <Compass className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p className="text-sm">No tasks assigned for this phase yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPhaseTasks.map((task) => {
              const catStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS["DSA"];

              return (
                <GlassCard
                  key={task.id}
                  className="p-5 border-slate-800 bg-slate-900/70 flex flex-col justify-between gap-4 card-hover-lift"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold border", catStyle.bg, catStyle.text, catStyle.border)}>
                        {task.category}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                          task.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : task.status === "in_review"
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        )}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white leading-snug">{task.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{task.description}</p>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Due: <strong className="text-slate-200 font-mono">{task.dueDate}</strong></span>
                      <span>Priority: <strong className={task.priority === "Urgent" ? "text-rose-400 font-bold" : "text-amber-300"}>{task.priority}</strong></span>
                    </div>

                    {task.mentorFeedback && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-indigo-500/20 text-xs">
                        <p className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-400" /> Mentor Evaluation:
                        </p>
                        <p className="text-slate-200 text-[11px] mt-0.5 italic">{task.mentorFeedback}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {task.deliverableLink ? (
                        <a
                          href={task.deliverableLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 truncate max-w-[180px]"
                        >
                          <ExternalLink className="w-3 h-3" /> View Submitted Code
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">No link attached</span>
                      )}

                      <button
                        onClick={() => handleOpenSubmission(task)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 shrink-0"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        {task.status === "completed" ? "Update Deliverable" : "Submit Deliverable"}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Deliverable Submission Modal */}
      {activeTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl space-y-4 text-white relative">
            <button
              onClick={() => setActiveTaskModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                Mentor Deliverable Submission
              </span>
              <h3 className="text-lg font-bold">{activeTaskModal.title}</h3>
              <p className="text-xs text-slate-400">Assigned by {activeTaskModal.assignedBy}</p>
            </div>

            <form onSubmit={handleConfirmSubmission} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Deliverable Proof Link (GitHub Repo / PR / Live Demo URL) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/your-username/distributed-systems-task"
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Implementation Notes & Architecture Highlights
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize key optimizations, benchmarks, and how edge cases were addressed..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTaskModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-95 text-white transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit to Mentor
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
