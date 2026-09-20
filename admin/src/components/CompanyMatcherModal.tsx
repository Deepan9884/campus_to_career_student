import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2,
  X,
  SlidersHorizontal,
  Download,
  CheckCircle2,
  Trophy,
  FileText,
  Mic,
  Code2,
  ExternalLink,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { exportCohortCsvData, type StudentSummary } from "../lib/admin-api";
import { ScoreRing } from "./Score";

interface CompanyMatcherModalProps {
  open: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    name: "Tier-1 Product Tech (Google, Amazon, Microsoft)",
    role: "SDE-1 / SWE",
    minReadiness: 75,
    minAts: 80,
    minInterview: 75,
    minCoding: 150,
    requireProof: false,
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  {
    name: "Fintech & Quantitative (Goldman Sachs, Morgan Stanley)",
    role: "Software & Quant Engineer",
    minReadiness: 80,
    minAts: 85,
    minInterview: 80,
    minCoding: 200,
    requireProof: false,
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    name: "High-Growth Unicorn Startups (Swiggy, Razorpay, Zepto)",
    role: "Full-Stack Engineer",
    minReadiness: 70,
    minAts: 75,
    minInterview: 70,
    minCoding: 100,
    requireProof: true,
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    name: "Global Tech Services (TCS Digital, Accenture, Infosys)",
    role: "Associate Software Engineer",
    minReadiness: 50,
    minAts: 60,
    minInterview: 55,
    minCoding: 40,
    requireProof: false,
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
];

export function CompanyMatcherModal({ open, onClose }: CompanyMatcherModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);
  const [minReadiness, setMinReadiness] = useState(75);
  const [minAts, setMinAts] = useState(80);
  const [minInterview, setMinInterview] = useState(75);
  const [minCoding, setMinCoding] = useState(150);
  const [requireProof, setRequireProof] = useState(false);
  const [companyName, setCompanyName] = useState("Target Hiring Partner");

  const { data, isLoading } = useQuery({
    queryKey: ["adminCohortCsvExport"],
    queryFn: exportCohortCsvData,
    enabled: open,
  });

  const students: StudentSummary[] = data?.students || [];

  const handleApplyPreset = (idx: number) => {
    setSelectedPreset(idx);
    const p = PRESETS[idx];
    setMinReadiness(p.minReadiness);
    setMinAts(p.minAts);
    setMinInterview(p.minInterview);
    setMinCoding(p.minCoding);
    setRequireProof(p.requireProof);
    setCompanyName(p.name.split(" ")[0]);
  };

  const matchedStudents = students.filter((s) => {
    if (s.overallReadiness < minReadiness) return false;
    if (s.resumeScore < minAts) return false;
    if (s.avgInterviewScore < minInterview) return false;
    if (s.totalProblemsSolved < minCoding) return false;
    if (requireProof && s.verifiedEventsCount < 1) return false;
    return true;
  });

  const handleExportRecruiterSheet = () => {
    if (matchedStudents.length === 0) {
      toast.error("No students match the current criteria.");
      return;
    }

    const headers = [
      "Candidate Name",
      "Email Address",
      "Target Role",
      "Overall Readiness %",
      "ATS Resume Score %",
      "Mock Interview Score %",
      "Coding Solved Count",
      "Verified Hackathon Proofs",
      "GitHub Profile",
      "Status",
    ];

    const csvRows = [
      headers.join(","),
      ...matchedStudents.map((s) =>
        [
          `"${s.name.replace(/"/g, '""')}"`,
          `"${s.email}"`,
          `"${s.targetRole}"`,
          s.overallReadiness,
          s.resumeScore,
          s.avgInterviewScore,
          s.totalProblemsSolved,
          s.verifiedEventsCount,
          `"${s.githubUsername ? `https://github.com/${s.githubUsername}` : ""}"`,
          `"${s.status}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Recruiter_Shortlist_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_${matchedStudents.length}_Candidates.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${matchedStudents.length} candidate dossiers for ${companyName}!`);
  };

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-[40px] saturate-[180%]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Placement Drive & Corporate Hiring Matcher
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filter and shortlist candidates based on company placement qualification benchmarks
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Preset Buttons */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Standard Hiring Partner Presets
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={p.name}
                  onClick={() => handleApplyPreset(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                    selectedPreset === idx
                      ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs ring-1 ring-indigo-500 dark:bg-indigo-500/20 dark:text-white dark:shadow-lg"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs leading-snug">{p.name}</span>
                    {selectedPreset === idx && <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span>LC ≥ {p.minCoding}</span>
                    <span>•</span>
                    <span>ATS ≥ {p.minAts}%</span>
                    <span>•</span>
                    <span>Mock ≥ {p.minInterview}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders & Criteria Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Fine-Tune Qualification Sliders
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Matching: <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{matchedStudents.length}</strong> of {students.length} students
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Min Readiness:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{minReadiness}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minReadiness}
                  onChange={(e) => {
                    setSelectedPreset(null);
                    setMinReadiness(Number(e.target.value));
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Min ATS Resume:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{minAts}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minAts}
                  onChange={(e) => {
                    setSelectedPreset(null);
                    setMinAts(Number(e.target.value));
                  }}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Min Mock Interview:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{minInterview}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minInterview}
                  onChange={(e) => {
                    setSelectedPreset(null);
                    setMinInterview(Number(e.target.value));
                  }}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Min Coding Solved:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{minCoding}+</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={400}
                  step={10}
                  value={minCoding}
                  onChange={(e) => {
                    setSelectedPreset(null);
                    setMinCoding(Number(e.target.value));
                  }}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={requireProof}
                  onChange={(e) => {
                    setSelectedPreset(null);
                    setRequireProof(e.target.checked);
                  }}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
                />
                <span>Require at least 1 verified Hackathon / Contest Podium Proof</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Drive Tag:</span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google Drive 2026"
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Matched Candidates Roster Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Qualified Candidates ({matchedStudents.length})
              </p>
              {matchedStudents.length > 0 && (
                <button
                  onClick={handleExportRecruiterSheet}
                  className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Export Recruiter Master Sheet (CSV)
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400">Evaluating cohort readiness...</div>
            ) : matchedStudents.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 max-h-64 overflow-y-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Student</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-center">Readiness</th>
                      <th className="py-2.5 px-3 text-center">ATS Resume</th>
                      <th className="py-2.5 px-3 text-center">Mock Interview</th>
                      <th className="py-2.5 px-3 text-center">Coding</th>
                      <th className="py-2.5 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {matchedStudents.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{s.name}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{s.targetRole}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{s.overallReadiness}%</td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-600 dark:text-purple-400">{s.resumeScore}%</td>
                        <td className="py-2.5 px-3 text-center font-bold text-cyan-600 dark:text-cyan-400">{s.avgInterviewScore}%</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{s.totalProblemsSolved}</td>
                        <td className="py-2.5 px-4 text-right">
                          <Link
                            to={`/students/${s._id}`}
                            onClick={onClose}
                            className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-white inline-flex items-center gap-1 font-bold"
                          >
                            <span>360°</span> <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                No candidates currently meet all threshold criteria. Lower the sliders to widen the candidate pool.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400 text-xs">
            Qualified Pool: <strong className="text-slate-900 dark:text-white font-bold">{matchedStudents.length} candidates</strong>
          </span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition cursor-pointer">
              Close
            </button>
            <button
              onClick={handleExportRecruiterSheet}
              disabled={matchedStudents.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download Recruiter CSV
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
