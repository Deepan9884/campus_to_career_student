import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Clock,
  Timer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Bell,
  Users,
  FileText,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { rescheduleAdminExam, type ExamItem } from "../../lib/admin-api";

interface RescheduleExamModalProps {
  open: boolean;
  onClose: () => void;
  exam: ExamItem | null;
  onSuccess: (updatedExam: ExamItem) => void;
}

export function RescheduleExamModal({
  open,
  onClose,
  exam,
  onSuccess,
}: RescheduleExamModalProps) {
  if (!open || !exam) return null;

  // Format a Date object to "YYYY-MM-DDTHH:mm" for datetime-local input
  const toDateTimeLocalString = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Initial states derived from current exam
  const [scheduleMode, setScheduleMode] = useState<"scheduled" | "immediate">(() =>
    exam.isScheduled ? "scheduled" : "scheduled"
  );

  const [startTime, setStartTime] = useState<string>(() => {
    if (exam.scheduledStartTime) {
      const d = new Date(exam.scheduledStartTime);
      if (d > new Date()) {
        return toDateTimeLocalString(d);
      }
    }
    // Default to +1 hour from now rounded to next 15 mins
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    return toDateTimeLocalString(d);
  });

  const [endTime, setEndTime] = useState<string>(() => {
    if (exam.scheduledEndTime) {
      const d = new Date(exam.scheduledEndTime);
      if (d > new Date()) {
        return toDateTimeLocalString(d);
      }
    }
    const d = new Date(Date.now() + 4 * 60 * 60 * 1000);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    return toDateTimeLocalString(d);
  });

  const [durationMinutes, setDurationMinutes] = useState<number>(() => exam.durationMinutes || 60);
  const [resetSubmissions, setResetSubmissions] = useState<boolean>(true);
  const [notifyStudents, setNotifyStudents] = useState<boolean>(true);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Derive calculated end time or use explicit endTime
  const computedEndTime = React.useMemo(() => {
    if (scheduleMode === "immediate") return null;
    if (endTime) {
      try {
        const eDate = new Date(endTime);
        if (!isNaN(eDate.getTime())) return eDate;
      } catch {}
    }
    if (!startTime) return null;
    try {
      const s = new Date(startTime);
      if (isNaN(s.getTime())) return null;
      return new Date(s.getTime() + (Number(durationMinutes) || 60) * 60 * 1000);
    } catch {
      return null;
    }
  }, [startTime, endTime, durationMinutes, scheduleMode]);

  // Helper presets for quick start time selection
  const applyPreset = (type: "plus1h" | "plus3h" | "tomorrowMorning" | "tomorrowAfternoon" | "plus2d") => {
    const now = new Date();
    let target = new Date();

    if (type === "plus1h") {
      target = new Date(now.getTime() + 60 * 60 * 1000);
      target.setMinutes(Math.ceil(target.getMinutes() / 15) * 15, 0, 0);
    } else if (type === "plus3h") {
      target = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      target.setMinutes(Math.ceil(target.getMinutes() / 15) * 15, 0, 0);
    } else if (type === "tomorrowMorning") {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (type === "tomorrowAfternoon") {
      target.setDate(target.getDate() + 1);
      target.setHours(14, 0, 0, 0);
    } else if (type === "plus2d") {
      target.setDate(target.getDate() + 2);
      target.setHours(10, 0, 0, 0);
    }

    const startStr = toDateTimeLocalString(target);
    setStartTime(startStr);
    const endTarget = new Date(target.getTime() + 4 * 60 * 60 * 1000);
    setEndTime(toDateTimeLocalString(endTarget));
    setScheduleMode("scheduled");
  };

  // Helper to adjust window duration
  const applyWindowPreset = (hours: number | "same" | "allDay") => {
    if (!startTime) return;
    const s = new Date(startTime);
    if (isNaN(s.getTime())) return;

    let e = new Date(s);
    if (hours === "same") {
      e = new Date(s.getTime() + (Number(durationMinutes) || 60) * 60 * 1000);
    } else if (hours === "allDay") {
      e.setHours(23, 59, 0, 0);
    } else {
      e = new Date(s.getTime() + hours * 60 * 60 * 1000);
    }
    setEndTime(toDateTimeLocalString(e));
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (scheduleMode === "scheduled") {
      if (!startTime) {
        toast.error("Please select a scheduled start date and time.");
        return;
      }
      if (endTime && new Date(endTime) <= new Date(startTime)) {
        toast.error("Window closing time must be after window opening time.");
        return;
      }
    }

    const payload = {
      isScheduled: scheduleMode === "scheduled",
      scheduledStartTime: scheduleMode === "scheduled" ? new Date(startTime).toISOString() : null,
      scheduledEndTime:
        scheduleMode === "scheduled" && computedEndTime
          ? computedEndTime.toISOString()
          : null,
      durationMinutes: Number(durationMinutes) || 60,
      resetSubmissions,
      notifyStudents,
      reason: reason.trim(),
    };

    setIsSubmitting(true);
    try {
      const res = await rescheduleAdminExam(exam._id, payload);
      toast.success(
        res.message || `Exam '${exam.title}' rescheduled successfully!`
      );
      if (res.resetSubmissionsCount && res.resetSubmissionsCount > 0) {
        toast.info(
          `Reset ${res.resetSubmissionsCount} prior candidate submission(s) for a clean attempt.`
        );
      }
      onSuccess(res.exam);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 p-6 my-auto text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
                  Reschedule Examination
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Format: <strong className="text-slate-800 dark:text-slate-200 uppercase">{exam.examType}</strong>
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                {exam.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleRescheduleSubmit} className="space-y-5">
          {/* Current Status Info Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="text-slate-700 dark:text-slate-300">
                Current Status:{" "}
                <span className="font-bold text-slate-900 dark:text-white capitalize">
                  {(() => {
                    const effectiveEndTime = exam.scheduledEndTime
                      ? new Date(exam.scheduledEndTime)
                      : exam.scheduledStartTime
                      ? new Date(new Date(exam.scheduledStartTime).getTime() + (Number(exam.durationMinutes) || 60) * 60 * 1000)
                      : null;
                    const isConcluded = exam.status === "completed" || Boolean(exam.isScheduled && effectiveEndTime && effectiveEndTime < new Date());
                    return exam.status === "stopped" ? "Stopped" : isConcluded ? "Concluded" : exam.status || "Active";
                  })()}
                </span>
                {exam.scheduledStartTime && (
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    (Originally scheduled: {new Date(exam.scheduledStartTime).toLocaleString()})
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Rescheduling will unblock this exam, restore published visibility, set the new access window, and optionally notify candidates.
              </p>
            </div>
          </div>

          {/* Schedule Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Assessment Window Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScheduleMode("scheduled")}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  scheduleMode === "scheduled"
                    ? "bg-indigo-50 border-indigo-500 text-slate-900 shadow-xs dark:bg-indigo-500/15 dark:border-indigo-500/50 dark:text-white dark:shadow-lg dark:shadow-indigo-500/10"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {scheduleMode === "scheduled" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <strong className="text-xs font-bold block text-slate-900 dark:text-white">
                  Schedule Specific Window
                </strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Test unlocks at specified date & time
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleMode("immediate")}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  scheduleMode === "immediate"
                    ? "bg-emerald-50 border-emerald-500 text-slate-900 shadow-xs dark:bg-emerald-500/15 dark:border-emerald-500/50 dark:text-white dark:shadow-lg dark:shadow-emerald-500/10"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {scheduleMode === "immediate" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <strong className="text-xs font-bold block text-slate-900 dark:text-white">
                  Make Live Immediately
                </strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Assessment unlocks right now for candidates
                </span>
              </button>
            </div>
          </div>

          {/* Scheduled Date/Time Picker & Presets */}
          {scheduleMode === "scheduled" && (
            <div className="space-y-4 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Window Opens / Start Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Window Opens (Available From)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Assessment unlocks at this time.
                  </span>
                </div>

                {/* Window Closes / End Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Window Closes (Available Until)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Gate closes strictly at this deadline.
                  </span>
                </div>
              </div>

              {/* Quick presets for Start Time */}
              <div className="space-y-1.5 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Quick Start Presets:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "plus1h", label: "+1 Hour" },
                    { id: "plus3h", label: "+3 Hours" },
                    { id: "tomorrowMorning", label: "Tomorrow 9:00 AM" },
                    { id: "tomorrowAfternoon", label: "Tomorrow 2:00 PM" },
                    { id: "plus2d", label: "+2 Days" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id as any)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:hover:bg-indigo-600/30 dark:text-slate-300 dark:hover:text-indigo-200 dark:border-slate-700 dark:hover:border-indigo-500/40 transition cursor-pointer shadow-xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Presets for Window Duration */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Window Duration Presets (Calculated from Start Time):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyWindowPreset("same")}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition cursor-pointer shadow-xs"
                  >
                    Match Duration ({durationMinutes}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyWindowPreset(2)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition cursor-pointer shadow-xs"
                  >
                    Open 2 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => applyWindowPreset(4)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-100/70 hover:bg-indigo-200/70 text-indigo-900 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 transition cursor-pointer shadow-xs"
                  >
                    Open 4 Hours (e.g. 4 PM – 8 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyWindowPreset("allDay")}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition cursor-pointer shadow-xs"
                  >
                    Open All Day (Until 11:59 PM)
                  </button>
                </div>
              </div>

              {/* Window & Duration Explanation */}
              {startTime && computedEndTime && (
                <div className="p-2.5 rounded-xl bg-indigo-100/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-[11px] text-indigo-900 dark:text-indigo-300 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Attendance Window:</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-xs">
                      {new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {computedEndTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </strong>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    Candidates can start anytime between these hours and receive up to <strong>{durationMinutes} minutes</strong> to complete the exam.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Duration Adjustment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-slate-400" />
              <span>Assessment Duration (Minutes)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(5, Number(e.target.value)))}
                className="w-32 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">minutes allowed per candidate</span>
            </div>
          </div>

          {/* Option: Reset Submissions */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={resetSubmissions}
                onChange={(e) => setResetSubmissions(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Reset Prior Candidate Submissions & Violations
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Recommended for fresh reschedules. Clears existing test submissions and unblocks candidate proctoring states so all assigned students can take this test cleanly in the new window.
                </p>
              </div>
            </label>
          </div>

          {/* Option: Notify Students */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyStudents}
                onChange={(e) => setNotifyStudents(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Broadcast Real-time Notification Alert</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Sends an immediate in-app push notification to all assigned candidates/mentees with the new examination date & time.
                </p>
              </div>
            </label>
          </div>

          {/* Reason / Note to Students */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Reschedule Note / Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Rescheduled due to network maintenance. Please be prepared 5 minutes prior to start time."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl text-xs font-black text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:scale-102 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Rescheduling...</span>
                </>
              ) : (
                <>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Confirm Reschedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
