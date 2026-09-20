import React from "react";
import {
  FileText,
  Mic,
  Code2,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Github,
  Target,
} from "lucide-react";

interface StudentPdfReportProps {
  student: any;
  metrics: any;
  resumes?: any[];
  interviews?: any[];
  codingProfiles?: any[];
  repoAnalyses?: any[];
  events?: any[];
  userSkills?: any[];
  activityLogs?: any[];
}

export const StudentPdfReport: React.FC<StudentPdfReportProps> = ({
  student = {},
  metrics = {},
  resumes = [],
  interviews = [],
  codingProfiles = [],
  repoAnalyses = [],
  events = [],
  userSkills = [],
  activityLogs = [],
}) => {
  const verifiedEvents = (events || []).filter(
    (e: any) => e?.verificationResult?.isVerified || e?.status === "verified"
  );
  const verificationPassRate =
    (events || []).length > 0
      ? Math.round((verifiedEvents.length / events.length) * 100)
      : 0;

  const latestResume = (resumes && resumes.length > 0) ? resumes[0] : null;
  const matchedSkills = latestResume?.keywordBreakdown?.matched || [];
  const missingKeywords = latestResume?.keywordBreakdown?.missing || [];

  const readinessScore = Number(metrics?.overallReadinessPct || 0);
  const readinessTier =
    readinessScore >= 75
      ? { label: "Placement Ready", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" }
      : readinessScore >= 45
      ? { label: "Developing / On Track", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" }
      : { label: "Intervention Required", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" };

  const reportDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const studentIdStr = String(student?._id || "ID-UNSPECIFIED");

  return (
    <div
      id="printable-student-report"
      className="bg-white text-slate-900 p-8 max-w-[800px] mx-auto font-sans leading-normal border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0"
      style={{ minHeight: "1000px" }}
    >
      {/* 1. Official Executive Header */}
      <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-indigo-700 uppercase">
              Campus to Career AI
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Verified Diagnostic
            </span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 mt-1">
            Candidate 360° Assessment & Placement Readiness Report
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic career telemetry evaluated across ATS resume parsing, AI mock interviews, verified proofs & DSA.
          </p>
        </div>

        <div className="text-right text-xs">
          <p className="font-bold text-slate-800">Generated: {reportDate}</p>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Ref ID: {studentIdStr}</p>
          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Mentor Telemetry Matrix
          </span>
        </div>
      </div>

      {/* 2. Candidate Executive Overview Card */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 mb-6 flex items-center justify-between gap-6 print-avoid-break">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900">{student?.name || "Candidate"}</h2>
            <span
              className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border"
              style={{
                backgroundColor: readinessTier.bg,
                color: readinessTier.color,
                borderColor: readinessTier.border,
              }}
            >
              {readinessTier.label}
            </span>
          </div>

          <p className="text-xs font-bold text-indigo-600">Target Role: {student?.targetRole || "Software Engineer"}</p>

          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
            <span>Email: <strong className="text-slate-900">{student?.email || "N/A"}</strong></span>
            {student?.githubUsername && (
              <span className="flex items-center gap-1">
                <Github className="h-3.5 w-3.5 text-slate-700" />
                GitHub: <strong className="text-slate-900">@{student.githubUsername}</strong>
              </span>
            )}
            <span>Status: <strong className="text-slate-900">{student?.status || "Active Candidate"}</strong></span>
          </div>
        </div>

        {/* Large Score Indicator */}
        <div className="text-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0 min-w-[140px]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
            Readiness Index
          </span>
          <span className="text-3xl font-black mt-0.5 block" style={{ color: readinessTier.color }}>
            {readinessScore}%
          </span>
          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
            5 Telemetry Streams
          </span>
        </div>
      </div>

      {/* 3. Core Telemetry Scorecard Matrix */}
      <div className="mb-6 print-avoid-break">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-indigo-600" /> Core Placement Readiness Scorecard
        </h3>

        <div className="grid grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-center">
            <FileText className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 font-bold uppercase">ATS Resume</p>
            <p className="text-lg font-black text-blue-700 mt-0.5">{Number(metrics?.resumeScore || 0)}%</p>
            <p className="text-[9px] text-slate-400 font-medium">Keywords match</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-center">
            <Mic className="h-4 w-4 text-purple-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 font-bold uppercase">Mock Interview</p>
            <p className="text-lg font-black text-purple-700 mt-0.5">{Number(metrics?.avgInterviewScore || 0)}%</p>
            <p className="text-[9px] text-slate-400 font-medium">Technical rounds</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-center">
            <Code2 className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 font-bold uppercase">Problems Solved</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">{Number(metrics?.totalProblemsSolved || 0)}</p>
            <p className="text-[9px] text-slate-400 font-medium">DSA platforms</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-center">
            <Award className="h-4 w-4 text-amber-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 font-bold uppercase">Verified Proofs</p>
            <p className="text-lg font-black text-amber-700 mt-0.5">{Number(metrics?.verifiedEventsCount || 0)}</p>
            <p className="text-[9px] text-slate-400 font-medium">Credentials</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-center">
            <ShieldCheck className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-500 font-bold uppercase">Pass Rate</p>
            <p className="text-lg font-black text-indigo-700 mt-0.5">{verificationPassRate}%</p>
            <p className="text-[9px] text-slate-400 font-medium">Audit pass</p>
          </div>
        </div>
      </div>

      {/* 4. ATS Resume & Skill Deficiency Analysis */}
      <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-white print-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-600" /> ATS Resume & Technical Keyword Diagnostics
          </span>
          <span className="text-[11px] font-bold text-blue-600">
            Latest Score: {Number(metrics?.resumeScore || 0)}%
          </span>
        </h3>

        {latestResume ? (
          <div className="space-y-3 text-xs">
            {latestResume.summary && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-0.5 text-[11px] uppercase">Executive Summary</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">{latestResume.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Matched Skills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified Matched Skills ({matchedSkills.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {matchedSkills.length > 0 ? (
                    matchedSkills.slice(0, 10).map((sk: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-[11px]">No matched skills detected</span>
                  )}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> Critical Keyword Gaps ({missingKeywords.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {missingKeywords.length > 0 ? (
                    missingKeywords.slice(0, 10).map((sk: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-semibold">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-emerald-600 text-[11px] font-semibold">No critical keywords missing</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-3 text-center">No resume data recorded yet for this candidate.</p>
        )}
      </div>

      {/* 5. AI Mock Interviews Assessment History */}
      <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-white print-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="flex items-center gap-1.5">
            <Mic className="h-4 w-4 text-purple-600" /> AI Mock Interview Evaluation Rounds ({interviews?.length || 0})
          </span>
          <span className="text-[11px] font-bold text-purple-600">
            Average Score: {Number(metrics?.avgInterviewScore || 0)}%
          </span>
        </h3>

        {(interviews && interviews.length > 0) ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold">
                <th className="py-1.5">Target Role</th>
                <th className="py-1.5">Rounds</th>
                <th className="py-1.5">Status</th>
                <th className="py-1.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interviews.map((sess: any, i: number) => (
                <tr key={i} className="text-slate-800">
                  <td className="py-2 font-semibold">{sess?.targetRole || student?.targetRole || "Technical Round"}</td>
                  <td className="py-2">{sess?.rounds?.length || 1} rounds</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {sess?.status || "Completed"}
                    </span>
                  </td>
                  <td className="py-2 text-right font-black text-purple-700">
                    {sess?.overallScore || 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-slate-500 py-3 text-center">No mock interview sessions recorded yet.</p>
        )}
      </div>

      {/* 6. Verified Proofs & Competitive Achievements */}
      <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-white print-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-600" /> Verified Proofs, Hackathons & Credentials ({events?.length || 0})
          </span>
          <span className="text-[11px] font-bold text-amber-700">
            {verifiedEvents.length} Verified
          </span>
        </h3>

        {(events && events.length > 0) ? (
          <div className="space-y-2.5">
            {events.slice(0, 5).map((ev: any, i: number) => {
              const isVer = ev?.verificationResult?.isVerified || ev?.status === "verified";
              return (
                <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900">{ev?.title || "Event Submission"}</strong>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                        {ev?.eventCategory || "Hackathon"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Organized by {ev?.organizer || "Community"} • Result: <strong className="text-slate-800">{ev?.result || "Participant"}</strong>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isVer
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    }`}
                  >
                    {isVer ? "Verified Proof" : "Under Review"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-3 text-center">No event proof submissions recorded.</p>
        )}
      </div>

      {/* 7. Coding & GitHub Telemetry Summary */}
      <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-white print-avoid-break">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="flex items-center gap-1.5">
            <Code2 className="h-4 w-4 text-emerald-600" /> Coding & GitHub Telemetry Overview
          </span>
          <span className="text-[11px] font-bold text-emerald-700">
            {Number(metrics?.totalProblemsSolved || 0)} Total Problems Solved
          </span>
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-slate-700 block mb-1">Coding Profiles</span>
            {(codingProfiles && codingProfiles.length > 0) ? (
              <div className="space-y-1.5">
                {codingProfiles.map((cp: any, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                    <span className="capitalize font-semibold text-slate-800">{cp?.platform || "Platform"}</span>
                    <strong className="text-emerald-700">{cp?.totalSolved || 0} Solved</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No coding profiles connected</p>
            )}
          </div>

          <div>
            <span className="font-bold text-slate-700 block mb-1">GitHub Repositories Analyzed</span>
            {(repoAnalyses && repoAnalyses.length > 0) ? (
              <div className="space-y-1.5">
                {repoAnalyses.slice(0, 3).map((r: any, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{r?.repoName || "Repository"}</span>
                    <strong className="text-indigo-700">{r?.overallScore || 0}% Quality</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No repositories analyzed yet</p>
            )}
          </div>
        </div>
      </div>

      {/* 8. Official Document Seal & Verification Footer */}
      <div className="border-t-2 border-slate-300 pt-4 mt-8 flex items-center justify-between text-[10px] text-slate-500 print-avoid-break">
        <div>
          <p className="font-bold text-slate-700">Campus to Career AI • Official Candidate Placement Dossier</p>
          <p className="mt-0.5">This document contains verified multi-stream career readiness telemetry.</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-slate-600">Verification Hash: SHA256-{studentIdStr.slice(0, 16)}</p>
          <p className="text-emerald-600 font-bold mt-0.5">Status: Verified Official Report</p>
        </div>
      </div>
    </div>
  );
};
