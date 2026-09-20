import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../lib/useDebounce";
import {
  Search,
  X,
  Users,
  ShieldCheck,
  Building2,
  Download,
  Sun,
  Moon,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  Command,
} from "lucide-react";
import { toast } from "sonner";
import {
  searchRegisteredStudents,
  exportCohortCsvData,
  batchUnblockStudents,
  getLiveProctoringFeed,
} from "../lib/admin-api";
import { useTheme } from "../lib/theme-context";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenCompanyMatcher?: () => void;
  onOpenLiveProctoring?: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onOpenCompanyMatcher,
  onOpenLiveProctoring,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Search registered students
  const { data: searchData, isLoading: searching } = useQuery({
    queryKey: ["adminCommandPaletteSearch", debouncedQuery],
    queryFn: () => (debouncedQuery.trim() ? searchRegisteredStudents(debouncedQuery) : Promise.resolve({ students: [] })),
    enabled: debouncedQuery.trim().length > 0,
  });

  const { data: proctorFeed } = useQuery({
    queryKey: ["adminLiveProctoringFeed"],
    queryFn: getLiveProctoringFeed,
    enabled: open,
  });

  const students = searchData?.students || [];
  const blockedUsers = proctorFeed?.blockedUsers || [];

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Batch unblock mutation
  const batchUnblockMutation = useMutation({
    mutationFn: (ids: string[]) => batchUnblockStudents(ids, "Restored via Global Command Palette"),
    onSuccess: (res) => {
      toast.success(res.message || "Students unblocked successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminStudentsList"] });
      queryClient.invalidateQueries({ queryKey: ["adminLiveProctoringFeed"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to batch unblock");
    },
  });

  // Export CSV
  const handleExportCsv = async () => {
    toast.loading("Compiling institutional cohort readiness dataset...", { id: "csv-export" });
    try {
      const res = await exportCohortCsvData();
      const rows = res.students || [];
      if (rows.length === 0) {
        toast.error("No student data available to export.", { id: "csv-export" });
        return;
      }

      const headers = [
        "Name",
        "Email",
        "Target Role",
        "Overall Readiness (%)",
        "ATS Resume Score (%)",
        "Mock Interview Score (%)",
        "Coding Solved Count",
        "Verified Hackathon Proofs",
        "Status",
        "Last Active",
      ];

      const csvContent = [
        headers.join(","),
        ...rows.map((s) =>
          [
            `"${s.name.replace(/"/g, '""')}"`,
            `"${s.email}"`,
            `"${s.targetRole}"`,
            s.overallReadiness,
            s.resumeScore,
            s.avgInterviewScore,
            s.totalProblemsSolved,
            s.verifiedEventsCount,
            s.status,
            `"${s.lastActive || ""}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CampusToCareer_Cohort_Readiness_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${rows.length} student records to CSV!`, { id: "csv-export" });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate CSV export", { id: "csv-export" });
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-md flex items-start justify-center p-4 pt-12 sm:pt-20 animate-in fade-in duration-150 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl lg:max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-[40px] saturate-[180%]"
      >
        {/* Search Header */}
        <div className="flex items-center px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 gap-3.5 bg-slate-50 dark:bg-slate-950">
          <Search className="h-6 w-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a student name, email, or command (e.g. 'export', 'matcher', 'proctor')..."
            className="flex-1 bg-transparent text-base sm:text-lg text-slate-900 dark:text-white placeholder:text-slate-400 outline-none font-medium"
          />
          <div className="flex items-center gap-1 text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-800 shadow-xs">
            <span>ESC</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Command Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm select-text">
          {/* Quick Actions Group */}
          <div>
            <p className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Operations & Tools
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenCompanyMatcher?.();
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 text-slate-900 border border-slate-200 hover:border-indigo-300 dark:bg-slate-950 dark:hover:bg-indigo-950/40 dark:text-white dark:border-slate-800 dark:hover:border-indigo-500/40 transition text-left group shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30 group-hover:scale-105 transition-transform">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Company Placement Matcher</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Filter students by hiring partner criteria</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenLiveProctoring?.();
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-rose-50/70 text-slate-900 border border-slate-200 hover:border-rose-300 dark:bg-slate-950 dark:hover:bg-rose-950/40 dark:text-white dark:border-slate-800 dark:hover:border-rose-500/40 transition text-left group shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Live Proctoring Operations</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {blockedUsers.length > 0 ? `${blockedUsers.length} blocked candidate(s)` : "Real-time violation stream"}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Export & System Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                handleExportCsv();
              }}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 hover:text-slate-950 border border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 flex items-center gap-3 transition cursor-pointer shadow-xs"
            >
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-xs">Export Master CSV</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">All student records</p>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                navigate("/students");
              }}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 hover:text-slate-950 border border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 flex items-center gap-3 transition cursor-pointer shadow-xs"
            >
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-xs">Student Directory</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">View roster table</p>
              </div>
            </button>

            <button
              onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
              }}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 hover:text-slate-950 border border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 flex items-center gap-3 transition cursor-pointer shadow-xs"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600 shrink-0" />
              )}
              <div className="text-left">
                <p className="font-bold text-xs">Toggle Theme</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Switch to {resolvedTheme === "dark" ? "Light" : "Dark"} Mode</p>
              </div>
            </button>
          </div>

          {/* Real-time Student Search Results */}
          {query.trim().length > 0 && (
            <div>
              <p className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Matching Student Profiles ({students.length})
              </p>
              {searching ? (
                <div className="py-8 text-center text-slate-400 text-sm">Searching directory...</div>
              ) : students.length > 0 ? (
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto pr-1">
                  {students.map((st: any) => (
                    <button
                      key={st._id}
                      onClick={() => {
                        onClose();
                        navigate(`/students/${st._id}`);
                      }}
                      className="w-full p-3 rounded-2xl bg-white hover:bg-indigo-50/60 dark:bg-slate-950 dark:hover:bg-indigo-950/30 border border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-500/40 flex items-center justify-between gap-3 text-left transition shadow-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-500/30">
                          {st.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{st.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{st.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/15 rounded-lg shrink-0 border border-indigo-200 dark:border-indigo-500/30">
                        Inspect 360° →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No matching student records found for "{query}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Press <kbd className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-800">ESC</kbd> to exit</span>
            <span>Use <kbd className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-800">↑</kbd> <kbd className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-800">↓</kbd> to navigate</span>
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5">
            <Command className="h-3.5 w-3.5" /> Career Intelligence Command Hub
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
