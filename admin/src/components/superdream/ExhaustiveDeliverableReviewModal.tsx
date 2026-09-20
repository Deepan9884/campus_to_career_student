import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UserCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Award,
  Star,
  Layers,
  FileText,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface ExhaustiveDeliverableReviewModalProps {
  open: boolean;
  onClose: () => void;
  task: any;
  candidateName: string;
  onApprove: (taskId: string, feedback: string, rating: number, rubricScores: any) => void;
  onRequestRevisions: (taskId: string, feedback: string) => void;
}

export function ExhaustiveDeliverableReviewModal({
  open,
  onClose,
  task,
  candidateName,
  onApprove,
  onRequestRevisions,
}: ExhaustiveDeliverableReviewModalProps) {
  const [archScore, setArchScore] = useState(38);
  const [perfScore, setPerfScore] = useState(28);
  const [qualityScore, setQualityScore] = useState(29);
  const [feedbackNotes, setFeedbackNotes] = useState(
    "Excellent implementation of the Raft leader election state machine. Heartbeat randomized timers and split-brain resolution pass all adversarial fuzzing tests."
  );
  const [starRating, setStarRating] = useState(5);

  if (!open || !task) return null;

  const totalScore = archScore + perfScore + qualityScore;

  const handleApproveClick = () => {
    onApprove(task.id, feedbackNotes, starRating, {
      archScore,
      perfScore,
      qualityScore,
      totalScore,
    });
    toast.success(`Deliverable approved with ${totalScore}/100 score!`);
    onClose();
  };

  const handleRevisionClick = () => {
    onRequestRevisions(task.id, feedbackNotes);
    toast.info("Revisions requested from candidate.");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/40 shadow-2xl flex flex-col text-slate-900 dark:text-white overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 grid place-items-center text-white shadow-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  DELIVERABLE EVALUATION CONSOLE
                </span>
                <span className="text-xs text-slate-400">Candidate: <strong className="text-white">{candidateName}</strong></span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {task.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Submission Meta & Links */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Phase 0{task.phase} Deliverable Submission</span>
              <span className="text-slate-400 font-mono">{task.submittedAt || "Submitted Recently"}</span>
            </div>

            {task.submissionNote && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 italic">
                "{task.submissionNote}"
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {task.deliverableLink ? (
                <a
                  href={task.deliverableLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-indigo-500/30 flex items-center justify-between text-indigo-400 hover:text-indigo-300 font-mono transition"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    <span>Submitted Code Repository</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-500">
                  No public repo link attached
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-cyan-300 font-mono">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Architecture Whitepaper</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  Verified PDF
                </span>
              </div>
            </div>
          </div>

          {/* Rubric Evaluation Sliders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Rubric Evaluation Breakdown (Score: {totalScore}/100)
              </h3>
              <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg ${totalScore >= 80 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                {totalScore >= 80 ? "Super Dream Qualified" : "Needs Optimization"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">1. System Architecture & Fault Tolerance (Max: 40)</span>
                  <span className="font-mono text-indigo-400 font-bold text-sm">{archScore} / 40</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={archScore}
                  onChange={(e) => setArchScore(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">2. High-Throughput & Low-Latency Performance (Max: 30)</span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">{perfScore} / 30</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={perfScore}
                  onChange={(e) => setPerfScore(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">3. Code Quality, ASan Leak Checks & Unit Tests (Max: 30)</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">{qualityScore} / 30</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Star Rating & Feedback */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold">Mentor Star Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star className={`w-5 h-5 ${star <= starRating ? "fill-amber-400" : "text-slate-600"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">Line-by-Line Code Review & Optimization Feedback *</label>
              <textarea
                rows={4}
                required
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRevisionClick}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30 transition cursor-pointer"
            >
              Request Revisions
            </button>

            <button
              type="button"
              onClick={handleApproveClick}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Advance Candidate Phase</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
